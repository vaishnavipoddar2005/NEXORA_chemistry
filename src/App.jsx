import { useEffect, useState } from "react";

import {
  Atom,
  FlaskConical,
  BookOpen,
  Microscope,
  Rocket,
  ArrowUpRight,
  ArrowDown,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Heart,
  Dna,
  Waves,
  Telescope,
} from "lucide-react";

import "./App.css";
import Lab from "./Lab";
import HandTracking from "./HandTracking";

const experiments = [
  {
    title: "Chemistry Lab",
    subtitle: "Mix. Observe. Discover.",
    icon: FlaskConical,
    color: "lavender",
    image:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=85",
    detail:
      "Discover reactions, colour changes, acids, bases and the tiny particles that make up everything around us.",
    activities: [
      "Acids and bases",
      "Colour-changing reactions",
      "Explore atoms and molecules",
    ],
  },
  {
    title: "Physics Playground",
    subtitle: "Make the invisible visible.",
    icon: Waves,
    color: "blue",
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1000&q=85",
    detail:
      "Explore motion, forces, light and energy through visual experiments and demonstrations.",
    activities: [
      "Motion and gravity",
      "Light and reflection",
      "Electricity and magnets",
    ],
  },
  {
    title: "Biology Garden",
    subtitle: "Life, up close.",
    icon: Dna,
    color: "pink",
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=85",
    detail:
      "Explore cells, plants, the human body and the systems that make living things work.",
    activities: [
      "Discover a cell",
      "Explore plant parts",
      "Journey through the human body",
    ],
  },
  {
    title: "Space Explorer",
    subtitle: "Your universe awaits.",
    icon: Rocket,
    color: "violet",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1000&q=85",
    detail:
      "Travel across the solar system and discover the planets, stars and galaxies beyond Earth.",
    activities: [
      "Tour the solar system",
      "Compare the planets",
      "Explore stars and galaxies",
    ],
  },
];

const scientists = [
  {
    name: "Marie Curie",
    field: "PHYSICS · CHEMISTRY",
    contribution: "Pioneer of radioactivity research",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Marie_Curie_c1920.jpg",
    story:
      "Marie Curie was a physicist and chemist whose research transformed our understanding of radioactivity. Working with Pierre Curie, she discovered polonium and radium. She won Nobel Prizes in Physics and Chemistry and became the first person to win Nobel Prizes in two different scientific fields.",
    facts: [
      "First woman to win a Nobel Prize",
      "Won Nobel Prizes in two scientific fields",
      "Advanced the study of radioactivity",
    ],
    discoveries: [
      "Research on radioactivity",
      "Discovery of polonium with Pierre Curie",
      "Discovery of radium with Pierre Curie",
    ],
  },
  {
    name: "Albert Einstein",
    field: "THEORETICAL PHYSICS",
    contribution: "Developed the theory of relativity",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Einstein_Head.jpg",
    story:
      "Albert Einstein developed the special and general theories of relativity, changing how scientists understand space, time and gravity. His equation E = mc² expresses the relationship between mass and energy. His explanation of the photoelectric effect also contributed to the development of quantum physics.",
    facts: [
      "Developed the theory of relativity",
      "Received the 1921 Nobel Prize in Physics",
      "Helped transform modern physics",
    ],
    discoveries: [
      "Special theory of relativity",
      "General theory of relativity",
      "Explanation of the photoelectric effect",
    ],
  },
  {
    name: "Isaac Newton",
    field: "PHYSICS · MATHEMATICS",
    contribution: "Laws of motion and universal gravitation",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/GodfreyKneller-IsaacNewton-1689.jpg",
    story:
      "Isaac Newton formulated three laws of motion and the law of universal gravitation. These ideas helped explain how objects move on Earth and how planets move in space. He also made important contributions to mathematics and the study of light.",
    facts: [
      "Formulated three laws of motion",
      "Explained universal gravitation",
      "Contributed to optics and mathematics",
    ],
    discoveries: [
      "Three laws of motion",
      "Law of universal gravitation",
      "Important work on light and colour",
    ],
  },
  {
    name: "C. V. Raman",
    field: "PHYSICS",
    contribution: "Discovered the Raman effect",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cvraman.jpg",
    story:
      "Sir Chandrasekhara Venkata Raman was an Indian physicist who discovered the Raman effect. It describes how light changes when it is scattered by matter. This discovery gave scientists a new way to study the molecular structure of materials. He received the Nobel Prize in Physics in 1930.",
    facts: [
      "Indian Nobel laureate in Physics",
      "Discovered the Raman effect",
      "His work supports modern spectroscopy",
    ],
    discoveries: [
      "The Raman effect",
      "Light scattering in materials",
      "Applications in molecular spectroscopy",
    ],
  },
];

const resources = [
  {
    title: "ICSE Physics",
    type: "TEXTBOOK REFERENCE",
    description:
      "Revise concepts, diagrams, numerical problems and chapter exercises using your school's prescribed textbook.",
    tag: "PHYSICS",
    icon: Waves,
  },
  {
    title: "ICSE Chemistry",
    type: "TEXTBOOK REFERENCE",
    description:
      "Explore chemical formulae, reactions, laboratory observations and the theory behind experiments.",
    tag: "CHEMISTRY",
    icon: FlaskConical,
  },
  {
    title: "ICSE Biology",
    type: "TEXTBOOK REFERENCE",
    description:
      "Study cells, life processes, diagrams, terminology and biological systems.",
    tag: "BIOLOGY",
    icon: Dna,
  },
  {
    title: "Science Field Notes",
    type: "NEXORA LEARNING RESOURCE",
    description:
      "Keep observations, new vocabulary, questions and important discoveries together.",
    tag: "NOTES",
    icon: BookOpen,
  },
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function openContentPage({ title, label, image, description, sections }) {
  const newTab = window.open("", "_blank");

  if (!newTab) {
    alert("Please allow pop-ups for NEXORA to open this page.");
    return;
  }

  const safeTitle = escapeHTML(title);
  const safeLabel = escapeHTML(label);
  const safeImage = escapeHTML(image);
  const safeDescription = escapeHTML(description);

  const sectionHTML = sections
    .map(
      (section) => `
        <section class="detail-section">
          <h2>${escapeHTML(section.title)}</h2>
          ${
            section.items
              ? `<ul>${section.items
                  .map((item) => `<li>${escapeHTML(item)}</li>`)
                  .join("")}</ul>`
              : `<p>${escapeHTML(section.text || "")}</p>`
          }
        </section>
      `,
    )
    .join("");

  newTab.document.open();
  newTab.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle} | NEXORA</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          body {
            margin: 0; color: #f5f2ff;
            font-family: 'DM Sans', sans-serif;
            background:
              radial-gradient(ellipse at 80% 5%, #4e3b8b70, transparent 38%),
              radial-gradient(ellipse at 5% 50%, #17558b30, transparent 38%),
              #100f25;
          }
          .top { padding: 25px 7%; border-bottom: 1px solid #ffffff18; }
          .brand { color: #f8f5ff; text-decoration: none; font-weight: 800; letter-spacing: 1px; }
          .brand span { color: #9bdcff; }
          main { width: min(100% - 40px, 950px); margin: auto; padding: 48px 0 90px; }
          .back { display: inline-block; margin-bottom: 35px; color: #a9dfff; text-decoration: none; font-size: 14px; }
          .label { color: #b6a0ff; font-size: 11px; font-weight: 700; letter-spacing: 2px; }
          h1 { font: 600 clamp(38px, 7vw, 70px)/1.1 'Fredoka', sans-serif; margin: 16px 0; letter-spacing: -1px; }
          .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(200px, .8fr); gap: 36px; align-items: center; }
          .hero img { width: 100%; max-height: 350px; object-fit: cover; border-radius: 42% 18% 28% 18%; }
          .description { color: #c7c2e4; line-height: 1.9; font-size: 15px; }
          .detail-section { margin-top: 38px; padding: 26px 0; border-top: 1px solid #ffffff20; }
          h2 { font: 600 27px 'Fredoka', sans-serif; }
          li { color: #cbc6e5; line-height: 2; padding-left: 5px; }
          .footer { margin-top: 55px; color: #aaa4ca; font-size: 11px; letter-spacing: 1px; }
          @media (max-width: 650px) {
            main { padding-top: 30px; }
            .hero { grid-template-columns: 1fr; }
            .hero img { max-height: 280px; }
          }
        </style>
      </head>
      <body>
        <header class="top"><a class="brand" href="${escapeHTML(window.location.origin)}">NEXORA<span>.</span></a></header>
        <main>
          <a class="back" href="${escapeHTML(window.location.origin)}">← Back to NEXORA</a>
          <div class="hero">
            <div>
              <div class="label">${safeLabel}</div>
              <h1>${safeTitle}</h1>
              <p class="description">${safeDescription}</p>
            </div>
            ${safeImage ? `<img src="${safeImage}" alt="${safeTitle}" />` : ""}
          </div>
          ${sectionHTML}
          <div class="footer">EXPLORE. EXPERIMENT. UNDERSTAND.</div>
        </main>
      </body>
    </html>
  `);
  newTab.document.close();
}

export default function App() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeLab, setActiveLab] = useState(null);
  const [testHands, setTestHands] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handlePointer = (event) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    const handleScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(
        scrollable > 0 ? window.scrollY / scrollable : 0,
      );
    };

    window.addEventListener("pointermove", handlePointer, {
      passive: true,
    });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const moleculeStyle = {
    "--mouse-x": `${pointer.x * 22}px`,
    "--mouse-y": `${pointer.y * 16 - 24}px`,
    "--scroll-y": `${scrollProgress * 80}px`,
  };

  const flaskStyle = {
    "--mouse-x": `${pointer.x * -10}px`,
    "--mouse-y": `${pointer.y * -7 - 28}px`,
  };

  const openLab = (experiment) => {
  setActiveLab(experiment);
};

  const openScientist = (person) => {
    openContentPage({
      title: person.name,
      label: person.field,
      image: person.image,
      description: person.story,
      sections: [
        { title: "Major contributions", items: person.discoveries },
        { title: "Quick facts", items: person.facts },
        {
          title: "Keep exploring",
          text: `${person.name}'s work is part of the story of modern science. Learn the concepts, ask questions and explore how these discoveries influence science today.`,
        },
      ],
    });
  };

  if (testHands) {
  return (
    <div>
      <button
        onClick={() => setTestHands(false)}
        style={{ padding: 12, margin: 12, cursor: "pointer" }}
      >
        ← Back to NEXORA
      </button>

      <HandTracking />
    </div>
  );
}

  if (activeLab) {
  return (
    <Lab
      experiment={activeLab}
      onBack={() => setActiveLab(null)}
    />
  );
}

  return (
    <main className="nexora" id="top">
      <div
        className="reading-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <nav className="nav-shell">
        <a href="#top" className="brand">
          <span className="brand-icon">
            <Atom size={24} />
          </span>
          <span>
            NEXORA<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#experiments">Experiments</a>
          <a href="#scientists">Scientists</a>
          <a href="#library">Learning library</a>
          <a href="#about">About</a>
        </div>

        <a href="#experiments" className="nav-cta">
          Explore <ArrowUpRight size={16} />
        </a>
      </nav>

      <section className="hero" id="home">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />
        <div className="hero-stars" />

        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            A LITTLE WONDER GOES A LONG WAY
          </div>

          <h1>
            Science is
            <br />
            <span className="script-word">magic</span>
            <span className="heading-tail"> you can</span>
            <br />
            <span className="gradient-word">understand.</span>
          </h1>

          <p className="hero-description">
            Welcome to a world where questions become adventures. Mix,
            explore, discover — and see how wonderfully our world works.
          </p>

          <div className="hero-buttons">
            <a href="#experiments" className="primary-button">
              <FlaskConical size={19} />
              Start exploring
              <ArrowUpRight size={17} />
            </a>
            <a href="#scientists" className="secondary-button">
              Meet the scientists <ArrowDown size={16} />
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Floating science illustrations">
          <div className="art-orbit orbit-a" />
          <div className="art-orbit orbit-b" />
          <div className="art-orbit orbit-c" />

          <div className="float-label label-a">
            <Atom size={16} /> Tiny particles, big ideas
          </div>
          <div className="float-label label-b">
            <Sparkles size={16} /> Keep wondering!
          </div>

          <div className="hero-molecule" style={moleculeStyle}>
            <svg viewBox="0 0 360 340" role="img" aria-label="Blue and violet molecule">
              <defs>
                <radialGradient id="nBlue" cx="30%" cy="25%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#a9e5ff" />
                  <stop offset="100%" stopColor="#477cff" />
                </radialGradient>
                <radialGradient id="nViolet" cx="28%" cy="25%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#d7b7ff" />
                  <stop offset="100%" stopColor="#8555ee" />
                </radialGradient>
              </defs>
              <g stroke="#a6b5ff" strokeWidth="5" opacity=".85">
                <line x1="175" y1="155" x2="82" y2="85" />
                <line x1="175" y1="155" x2="276" y2="85" />
                <line x1="175" y1="155" x2="278" y2="234" />
                <line x1="175" y1="155" x2="91" y2="250" />
                <line x1="82" y1="85" x2="45" y2="174" />
                <line x1="276" y1="85" x2="316" y2="165" />
                <line x1="91" y1="250" x2="175" y2="303" />
              </g>
              <g className="molecule-atoms">
                <circle cx="175" cy="155" r="31" fill="url(#nBlue)" />
                <circle cx="82" cy="85" r="22" fill="url(#nViolet)" />
                <circle cx="276" cy="85" r="25" fill="url(#nBlue)" />
                <circle cx="278" cy="234" r="20" fill="url(#nViolet)" />
                <circle cx="91" cy="250" r="25" fill="url(#nBlue)" />
                <circle cx="45" cy="174" r="14" fill="url(#nViolet)" />
                <circle cx="316" cy="165" r="15" fill="url(#nViolet)" />
                <circle cx="175" cy="303" r="16" fill="url(#nBlue)" />
              </g>
              <g fill="#fff">
                <circle cx="165" cy="145" r="5" />
                <circle cx="75" cy="78" r="4" />
                <circle cx="267" cy="76" r="5" />
                <circle cx="83" cy="241" r="5" />
              </g>
            </svg>
          </div>

          <div className="hero-flask" style={flaskStyle}>
            <svg viewBox="0 0 190 250" role="img" aria-label="Flask with blue liquid">
              <defs>
                <linearGradient id="nGlass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity=".9" />
                  <stop offset="55%" stopColor="#b8d8ff" stopOpacity=".12" />
                  <stop offset="100%" stopColor="#9bbdff" stopOpacity=".65" />
                </linearGradient>
                <linearGradient id="nLiquid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8deaff" />
                  <stop offset="100%" stopColor="#6558ed" />
                </linearGradient>
                <clipPath id="nFlaskClip">
                  <path d="M70 18 H120 V87 L160 173 Q176 211 133 220 H57 Q14 211 30 173 L70 87 Z" />
                </clipPath>
              </defs>
              <g clipPath="url(#nFlaskClip)">
                <path
                  className="flask-liquid"
                  d="M20 145 Q50 132 80 146 T140 145 T180 147 L185 240 H10 Z"
                  fill="url(#nLiquid)"
                />
                <path
                  d="M22 146 Q50 133 80 146 T140 145 T180 147"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <circle cx="67" cy="176" r="3" fill="#fff" />
                <circle cx="110" cy="190" r="4" fill="#fff" />
                <circle cx="129" cy="167" r="2" fill="#fff" />
              </g>
              <path
                d="M70 18 H120 V87 L160 173 Q176 211 133 220 H57 Q14 211 30 173 L70 87 Z"
                fill="url(#nGlass)"
                stroke="#e9e6ff"
                strokeWidth="4"
              />
              <path
                d="M74 20 V87 L36 173 Q25 200 54 207"
                fill="none"
                stroke="#fff"
                strokeWidth="4"
                opacity=".85"
              />
              <path
                d="M66 10 H124 V24 H66 Z"
                fill="#cbd7ff"
                stroke="#fff"
                strokeWidth="2"
              />
              <g stroke="#fff" strokeWidth="2">
                <line x1="127" y1="148" x2="145" y2="148" />
                <line x1="132" y1="161" x2="145" y2="161" />
                <line x1="127" y1="174" x2="145" y2="174" />
              </g>
            </svg>
            <span>Curiosity in progress</span>
          </div>

          <div className="tiny-planet planet-a" />
          <div className="tiny-planet planet-b" />
          <div className="tiny-planet planet-c" />
        </div>

        <a className="scroll-cue" href="#experiments">
          <span>SCROLL TO DISCOVER</span>
          <span className="scroll-arrow">
            <ArrowDown size={16} />
          </span>
        </a>
      </section>

      <section className="experiment-section section-pad" id="experiments">
        <div className="section-kicker">
          <span>01</span> PICK YOUR ADVENTURE
        </div>
        <div className="section-heading">
          <h2>
            Welcome to the <span className="script-word small-script">playground!</span>
          </h2>
          <p>Four worlds. A million questions. Which one will you explore first?</p>
        </div>

        <div className="experiment-grid">
          {experiments.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                className={`experiment-card ${item.color}`}
                onClick={() => openLab(item)}
                type="button"
              >
                <div className="experiment-image">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="experiment-number">0{index + 1}</span>
                  <span className="experiment-icon">
                    <Icon size={22} />
                  </span>
                </div>
                <div className="experiment-copy">
                  <span>{item.subtitle}</span>
                  <h3>{item.title}</h3>
                  <div className="card-link">
                    Let's explore <ArrowUpRight size={17} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="scientist-section section-pad" id="scientists">
        <div className="scientist-decoration">
          <Atom size={190} />
        </div>
        <div className="section-kicker">
          <span>02</span> BIG IDEAS, CURIOUS MINDS
        </div>
        <div className="section-heading scientist-heading">
          <h2>
            Meet the minds <span className="script-word small-script">behind the magic.</span>
          </h2>
          <p>They asked questions, made discoveries and changed the way we see the world.</p>
        </div>

        <div className="scientist-grid">
          {scientists.map((person, index) => (
            <button
              key={person.name}
              className={`scientist-card ${["lavender", "blue", "pink", "violet"][index]}`}
              onClick={() => openScientist(person)}
              type="button"
            >
              <div className="scientist-photo">
                <img
                  src={person.image}
                  alt={person.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                />
                <span className="scientist-number">0{index + 1}</span>
                <span className="scientist-open">
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <div className="scientist-info">
                <span className="scientist-field">{person.field}</span>
                <h3>{person.name}</h3>
                <p>{person.contribution}</p>
                <span className="discover-more">Discover their story ↗</span>
              </div>
            </button>
          ))}
        </div>
        <p className="image-note">
          Portraits are loaded from Wikimedia Commons; availability can vary.
        </p>
      </section>

      <button onClick={() => setTestHands(true)}>
  Test Hand Tracking
</button>

      <section className="library-section section-pad" id="library">
        <div className="section-kicker">
          <span>03</span> YOUR KNOWLEDGE CORNER
        </div>
        <div className="section-heading">
          <h2>
            Books, notes & <span className="script-word small-script">big discoveries.</span>
          </h2>
          <p>Connect classroom learning with hands-on exploration.</p>
        </div>

        <div className="library-banner">
          <div className="library-illustration">
            <div className="book-shape book-back">
              <BookOpen size={55} />
            </div>
            <div className="book-shape book-front">
              <GraduationCap size={48} />
            </div>
            <Sparkles className="book-sparkle" size={28} />
          </div>
          <div className="library-banner-copy">
            <span className="library-tag">YOUR STUDY COMPANION</span>
            <h3>
              From textbook pages
              <br />
              to real-world wonder.
            </h3>
            <p>
              Start with your prescribed school books, then explore concepts
              with NEXORA's visual learning activities.
            </p>
          </div>
        </div>

        <div className="resource-grid">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <article className="resource-card" key={resource.title}>
                <div className="resource-icon">
                  <Icon size={23} />
                </div>
                <span className="resource-type">{resource.type}</span>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <span className="resource-tag">{resource.tag}</span>
              </article>
            );
          })}
        </div>

        <div className="icse-note">
          <BookOpen size={22} />
          <div>
            <strong>ICSE textbook references</strong>
            <p>
              Physics, Chemistry and Biology references should match the
              student's class, current syllabus and school-prescribed editions.
              Some schools use the Selina Concise series; confirm the exact
              books and chapters with your school.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section section-pad" id="about">
        <div className="about-orb about-orb-one" />
        <div className="about-orb about-orb-two" />
        <div className="about-content">
          <div className="section-kicker">
            <span>04</span> A LITTLE ABOUT US
          </div>
          <h2>
            Learning should feel like{" "}
            <span className="script-word small-script">an adventure.</span>
          </h2>
          <p>
            NEXORA is being built to help young learners move beyond memorising
            facts. We want science to feel visible, playful and understandable
            through experiments, stories, discoveries and questions worth asking.
          </p>
          <div className="about-values">
            <span>
              <Lightbulb size={17} /> Curiosity first
            </span>
            <span>
              <Heart size={17} /> Learn by doing
            </span>
            <span>
              <Microscope size={17} /> Discover together
            </span>
          </div>
          <a href="#top" className="primary-button">
            Back to the beginning <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="about-illustration">
          <div className="about-ring" />
          <div className="about-atom">
            <Atom size={145} strokeWidth={1} />
          </div>
          <div className="about-note note-one">Stay curious ✦</div>
          <div className="about-note note-two">Ask why?</div>
        </div>
      </section>

      <footer className="footer">
        <a href="#top" className="brand">
          <span className="brand-icon">
            <Atom size={22} />
          </span>
          <span>
            NEXORA<span className="brand-dot">.</span>
          </span>
        </a>
        <span>EXPLORE. EXPERIMENT. UNDERSTAND.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}