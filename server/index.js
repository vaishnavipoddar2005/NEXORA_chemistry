import http from 'node:http';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const envFile = await readFile(path.join(PROJECT_DIR, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* .env is optional. */ }

const PORT = Number(process.env.API_PORT || 8787);
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'phi4:14b-q4_K_M';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'bge-m3';
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(SERVER_DIR, 'data');
const STORE_FILE = path.join(DATA_DIR, 'knowledge-store.json');
const PARSER_FILE = path.join(SERVER_DIR, 'extract-document.py');
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_TYPES = new Map([
  ['.pdf', 'application/pdf'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['.txt', 'text/plain'], ['.md', 'text/markdown'], ['.html', 'text/html'], ['.json', 'application/json'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'],
]);

const BASE_KNOWLEDGE = `NEXORA CHEMISTRY REFERENCE

ACID-BASE TITRATION
In this educational strong-acid/strong-base titration, sodium hydroxide is delivered from the burette into hydrochloric acid. The equivalence point is approximately pH 7 for equal concentrations; phenolphthalein changes from colourless to pale pink just beyond equivalence (about pH 8.2–10). NEXORA's simulation uses a configured endpoint near pH 8.8.

PHENOLPHTHALEIN INDICATOR
Phenolphthalein is colourless in acidic solution and pink in sufficiently alkaline solution (transition range about pH 8.2–10). Add it to the acid before titrating. A faint pink that persists after mixing is the endpoint observation.

APPARATUS
The burette measures and dispenses the titrant. Its stopcock controls flow. The conical flask holds the measured analyte and indicator; swirl it gently so each drop mixes. Keep the flask opening under the burette tip.

SAFETY
Hydrochloric acid and sodium hydroxide can irritate or burn skin and eyes. In a real lab use splash goggles, follow your instructor's handling rules, and rinse exposures with plenty of water. This virtual activity is an educational simulation, not a substitute for supervised lab practice.

NEUTRALISATION
Hydrochloric acid and sodium hydroxide neutralise in a 1:1 mole ratio: HCl + NaOH → NaCl + H₂O. The endpoint is detected with the indicator; the colour is evidence of pH, not a separate product.`;

async function loadStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try { return JSON.parse(await readFile(STORE_FILE, 'utf8')); }
  catch { return { version: 1, chunks: [], documents: [], baselineReady: false }; }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(store)}\n`, 'utf8');
}

async function ollama(pathname, body) {
  let response;
  try {
    response = await fetch(`${OLLAMA_URL}${pathname}`, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : undefined);
  } catch {
    const error = new Error(`Ollama is not running at ${OLLAMA_URL}. Start the Ollama app, then retry. For setup use: ollama pull ${CHAT_MODEL} and ollama pull ${EMBED_MODEL}.`);
    error.status = 503;
    throw error;
  }
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Ollama returned an invalid response. Restart Ollama and retry.'); }
  if (!response.ok) {
    const message = data.error || `Ollama request failed (${response.status}).`;
    if (/model.*not found/i.test(message)) {
      const error = new Error(`Local model missing. Run these in PowerShell: ollama pull ${CHAT_MODEL}; ollama pull ${EMBED_MODEL}.`);
      error.status = 503;
      throw error;
    }
    throw new Error(message);
  }
  return data;
}

async function verifyModels() {
  const { models = [] } = await ollama('/api/tags');
  const available = new Set(models.map((model) => model.name));
  const has = (wanted) => [...available].some((name) => name === wanted || name.startsWith(`${wanted}:`) || wanted.startsWith(`${name}:`));
  const missing = [!has(CHAT_MODEL) && CHAT_MODEL, !has(EMBED_MODEL) && EMBED_MODEL].filter(Boolean);
  if (missing.length) {
    const error = new Error(`Local model${missing.length > 1 ? 's are' : ' is'} missing: ${missing.join(', ')}. In PowerShell run: ${missing.map((name) => `ollama pull ${name}`).join('; ')}`);
    error.status = 503;
    throw error;
  }
}

async function embed(texts) {
  let result;
  try { result = await ollama('/api/embed', { model: EMBED_MODEL, input: texts, truncate: true }); }
  catch (error) {
    if (!/404|not found|unknown endpoint/i.test(error.message)) throw error;
    const oldApiResults = await Promise.all(texts.map((input) => ollama('/api/embeddings', { model: EMBED_MODEL, prompt: input })));
    result = { embeddings: oldApiResults.map((item) => item.embedding) };
  }
  if (!Array.isArray(result.embeddings) || result.embeddings.length !== texts.length) throw new Error('BGE-M3 did not return embeddings for every text chunk.');
  return result.embeddings;
}

function chunkText(text, size = 1100, overlap = 180) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let start = 0; start < normalized.length; start += size - overlap) {
    const value = normalized.slice(start, start + size).trim();
    if (value.length >= 40) chunks.push(value);
  }
  return chunks;
}

function extractDocument(bytes, extension) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.PYTHON || 'python', [PARSER_FILE, extension], { stdio: ['pipe', 'pipe', 'pipe'] });
    const output = [];
    const errors = [];
    let length = 0;
    child.stdout.on('data', (part) => { length += part.length; if (length < 8 * 1024 * 1024) output.push(part); });
    child.stderr.on('data', (part) => errors.push(part));
    child.on('error', () => reject(new Error('Python document parser is unavailable. Install pypdf and python-docx to read PDF/Word files.')));
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(Buffer.concat(errors).toString('utf8').trim() || 'Could not extract text from this document.'));
      const text = Buffer.concat(output).toString('utf8').trim();
      if (!text) return reject(new Error('No selectable text was found in this file. Scanned PDFs/images need OCR before they can be searched.'));
      resolve(text);
    });
    child.stdin.end(bytes);
  });
}

async function indexDocument(store, name, bytes, extension, kind = 'upload') {
  const text = await extractDocument(bytes, extension);
  const sections = chunkText(text);
  if (!sections.length) throw new Error('This document does not contain enough readable text to index.');
  const vectors = [];
  for (let start = 0; start < sections.length; start += 24) vectors.push(...await embed(sections.slice(start, start + 24)));
  const id = kind === 'baseline' ? 'nexora-chemistry-reference' : createHash('sha256').update(bytes).digest('hex');
  store.chunks.push(...sections.map((content, index) => ({ id: `${id}:${index}`, documentId: id, source: name, content, vector: vectors[index] })));
  store.documents.push({ id, name, kind, indexedAt: new Date().toISOString(), chunks: sections.length });
  if (kind === 'baseline') store.baselineReady = true;
}

async function ensureLocalKnowledge() {
  const store = await loadStore();
  if (!store.baselineReady) {
    await indexDocument(store, 'NEXORA Chemistry Reference', Buffer.from(BASE_KNOWLEDGE, 'utf8'), '.txt', 'baseline');
    await saveStore(store);
  }
  return store;
}

function parseMultipart(body, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) throw new Error('Upload form boundary is missing. Please retry.');
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const separator = Buffer.from('\r\n\r\n');
  const ending = Buffer.concat([Buffer.from('\r\n'), boundary]);
  const fields = {};
  let cursor = body.indexOf(boundary);
  while (cursor >= 0) {
    cursor += boundary.length;
    if (body[cursor] === 45 && body[cursor + 1] === 45) break;
    if (body[cursor] === 13 && body[cursor + 1] === 10) cursor += 2;
    const headerEnd = body.indexOf(separator, cursor);
    if (headerEnd < 0) break;
    const headers = body.subarray(cursor, headerEnd).toString('latin1');
    const dataStart = headerEnd + separator.length;
    const dataEnd = body.indexOf(ending, dataStart);
    if (dataEnd < 0) break;
    const disposition = /content-disposition:\s*form-data;([^\r\n]+)/i.exec(headers)?.[1] || '';
    const fieldName = /name="([^"]+)"/i.exec(disposition)?.[1];
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1];
    const content = body.subarray(dataStart, dataEnd);
    if (fieldName && filename) fields[fieldName] = { filename: path.basename(filename.replaceAll('\\', '/')), type: /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() || '', bytes: content };
    else if (fieldName) fields[fieldName] = content.toString('utf8');
    cursor = dataEnd + 2;
  }
  return fields;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const part of req) {
    size += part.length;
    if (size > MAX_UPLOAD_BYTES + 1024 * 1024) { const error = new Error('Files must be 20 MB or smaller.'); error.status = 413; throw error; }
    chunks.push(part);
  }
  return Buffer.concat(chunks);
}

function cosineSimilarity(a, b) {
  let dot = 0; let normA = 0; let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) { dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2; }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

async function registerDocument(file, store) {
  const extension = path.extname(file.filename).toLowerCase();
  if (IMAGE_TYPES.has(file.type) || ['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
    throw new Error('Phi-4 is a text-only model, so it cannot read image pixels. Please attach a text PDF or Word document.');
  }
  if (!['.pdf', '.docx', '.pptx', '.txt', '.md', '.html', '.json'].includes(extension)) {
    throw new Error('Supported local RAG files: PDF, Word .docx, PowerPoint .pptx, TXT, Markdown, HTML and JSON.');
  }
  if (extension === '.doc') throw new Error('Legacy .doc files are not supported by the local parser. Save this Word file as .docx and upload again.');
  if (file.bytes.length > MAX_UPLOAD_BYTES) { const error = new Error('Files must be 20 MB or smaller.'); error.status = 413; throw error; }
  const id = createHash('sha256').update(file.bytes).digest('hex');
  const existing = store.documents.find((doc) => doc.id === id);
  if (existing) return existing;
  await indexDocument(store, file.filename, file.bytes, extension);
  await saveStore(store);
  return store.documents.at(-1);
}

async function answerQuestion(question, state, file) {
  await verifyModels();
  const store = await ensureLocalKnowledge();
  const uploaded = file ? await registerDocument(file, store) : null;
  const query = `${question}\nExperiment: Pink Titration. Step ${Number(state.step || 1)}. Flask volume ${Number(state.flaskMl || 0).toFixed(2)} mL. pH ${Number(state.pH ?? 7).toFixed(2)}. Endpoint ${Boolean(state.endpoint)}.`;
  const [queryVector] = await embed([query]);
  const matches = store.chunks.map((chunk) => ({ chunk, score: cosineSimilarity(queryVector, chunk.vector) }))
    .sort((a, b) => b.score - a.score).slice(0, 5);
  const context = matches.map(({ chunk }, index) => `[${index + 1}] Source: ${chunk.source}\n${chunk.content}`).join('\n\n');
  const generated = await ollama('/api/chat', {
    model: CHAT_MODEL,
    stream: false,
    options: { temperature: 0.15, num_ctx: 8192 },
    messages: [
      { role: 'system', content: 'You are Dr. Nova, a patient chemistry tutor. Answer in the same language as the student. Ground answers in the retrieved CONTEXT. Cite a source by its exact source name in the answer. If the context does not contain the answer, clearly say so before giving a short general chemistry explanation. Never claim that an uploaded document says something unless its retrieved text supports it. The lab state is simulation data, not real measurement.' },
      { role: 'user', content: `Question: ${question}\n\nCurrent lab state: ${query}\n\nRetrieved context:\n${context}` },
    ],
  });
  const answer = generated.message?.content?.trim();
  if (!answer) throw new Error('Phi-4 returned an empty answer. Please retry.');
  const sources = [...new Set(matches.map(({ chunk }) => chunk.source))];
  if (uploaded && !sources.includes(uploaded.name)) sources.unshift(uploaded.name);
  return { answer, sources, model: CHAT_MODEL, embeddingModel: EMBED_MODEL, indexedDocument: uploaded?.name || null };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.method !== 'POST' || req.url !== '/api/doubt') { sendJson(res, 404, { error: 'Not found.' }); return; }
  try {
    const body = await readBody(req);
    let question; let state = {}; let attachment = null;
    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      const fields = parseMultipart(body, req.headers['content-type']);
      question = fields.question;
      try { state = JSON.parse(fields.state || '{}'); } catch { state = {}; }
      attachment = fields.file || null;
    } else {
      let payload;
      try { payload = JSON.parse(body.toString('utf8') || '{}'); }
      catch { const error = new Error('Could not read the question. Please try again.'); error.status = 400; throw error; }
      question = payload.question; state = payload.state || {};
    }
    question = String(question || '').trim();
    if (!question) { const error = new Error('Type a question first.'); error.status = 400; throw error; }
    if (attachment && !attachment.bytes.length) { const error = new Error('The selected file is empty.'); error.status = 400; throw error; }
    sendJson(res, 200, await answerQuestion(question, state, attachment));
  } catch (error) {
    console.error('NEXORA local RAG request failed:', error.message);
    sendJson(res, error.status || 500, { error: error.message || 'Dr. Nova could not answer right now.' });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`NEXORA local RAG API listening at http://127.0.0.1:${PORT} (chat: ${CHAT_MODEL}; embeddings: ${EMBED_MODEL})`));
