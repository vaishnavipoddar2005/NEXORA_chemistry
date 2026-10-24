import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const children = [];
let stopping = false;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    let settled = false;
    const finish = (available) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (probe.listening) probe.close(() => resolve(available));
      else resolve(available);
    };
    const timeout = setTimeout(() => finish(false), 1200);
    probe.once('error', () => finish(false));
    probe.listen(port, '127.0.0.1', () => finish(true));
  });
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null && !child.killed) child.kill();
  process.exitCode = code;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

const preferredPort = Number(process.env.API_PORT || 8787);
let apiPort = preferredPort;
while (!(await isPortAvailable(apiPort)) && apiPort < preferredPort + 20) apiPort += 1;
if (apiPort >= preferredPort + 20) {
  console.error(`No free NEXORA API port found between ${preferredPort} and ${preferredPort + 19}.`);
  process.exit(1);
}
if (apiPort !== preferredPort) console.log(`API port ${preferredPort} is busy; using ${apiPort} for this session.`);

const env = { ...process.env, API_PORT: String(apiPort) };
for (const args of [
  [path.join(projectDir, 'server', 'index.js')],
  [path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js')],
]) {
  const child = spawn(node, args, { cwd: projectDir, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Could not start NEXORA service: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => { if (!stopping) stop(code || 0); });
}
