

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

import {

  ArrowLeft, FlaskConical, Sparkles, Hand, Camera, Beaker,

  BookOpen, Play, Plus, Check, Droplets, RotateCcw, X, Send, Paperclip, Volume2, Square,

} from "lucide-react";

import "./Lab.css";
import { LabObjects as NewLabObjects } from "./InstrumentModels";

const TOPICS = [

  {

    id: "pink",

    title: "Pink Titration",

    level: "Beginner",

    description: "Explore how an indicator changes colour in acidic and basic solutions.",

    explanation:

      "Phenolphthalein is a pH indicator. It is colourless in acidic solutions and turns pink in a sufficiently basic solution.",

    purpose: "Understand indicators and how they help identify acidic and basic solutions.",

    realLife: "Indicators are used in chemistry laboratories to observe pH-related changes.",

  },

  {

    id: "acids",

    title: "Acids and Bases",

    level: "Beginner",

    description: "Learn the basic properties of acids and bases.",

    explanation:

      "Acids and bases have different chemical properties. Indicators help us observe some of these differences.",

    purpose: "Understand how acids and bases behave.",

    realLife: "Acid-base chemistry is used in food, agriculture and laboratories.",

  },

  {

    id: "solutions",

    title: "Mixing Solutions",

    level: "Beginner",

    description: "Explore what happens when solutions are mixed.",

    explanation:

      "When solutions are mixed, the result depends on the substances and their quantities.",

    purpose: "Observe mixing and compare the resulting solutions.",

    realLife: "Solution mixing is common in chemistry and manufacturing.",

  },

];

const TITRATION_LESSON = [
  {
    title: "1. The titration setup", media: "titration-overview.jpg", type: "image",
    alt: "Acid-base titration setup: burette above a flask with indicator",
    visualCue: "In the picture, the burette is above the flask. The burette contains the known base; the flask contains the acid and indicator.",
    lines: [
      "Titration helps us find the concentration of a solution when we do not know it.",
      "We measure how much of a known solution is needed to react with it.",
      "The burette measures the base added. The flask holds the acid being tested.",
    ],
  },
  {
    title: "2. Follow the titration", media: "titration-process.mp4", type: "video",
    alt: "Animation illustrating the acid-base titration process",
    visualCue: "Watch the liquid being added from above into the flask, then watch for the solution to change near the end.",
    lines: [
      "First, put a measured amount of acid in the flask and add a few drops of indicator.",
      "Then add the known base from the burette while gently swirling the flask.",
      "As the base reacts with the acid, the flask’s pH changes.",
    ],
  },
  {
    title: "3. The neutralisation reaction", media: "neutralization.jpg", type: "image",
    alt: "Diagram showing hydrogen ions and hydroxide ions forming water, and acid plus base making salt and water",
    visualCue: "The top of the diagram shows H⁺ joining OH⁻ to make H₂O. The full reaction also leaves a salt in solution.",
    lines: [
      "Acid provides hydrogen ions, written H⁺. Base provides hydroxide ions, written OH⁻.",
      "H⁺ and OH⁻ join to make water: H⁺ + OH⁻ → H₂O.",
      "For hydrochloric acid and sodium hydroxide, the overall reaction makes sodium chloride and water.",
    ],
  },
  {
    title: "4. Read the indicator colour", media: "phenolphthalein-indicator.jpg", type: "image",
    alt: "Phenolphthalein comparison: colourless acidic solution and pink basic solution",
    visualCue: "The left beaker is labelled acidic and colourless. The right is labelled basic and pink. The image gives the indicator range as about pH 8.2 to 10.",
    lines: [
      "Phenolphthalein is colourless in the acid at the start.",
      "It changes to pink as the solution becomes basic, around pH 8.2 to 10.",
      "During titration, a faint pink colour that stays after swirling tells us we have reached the indicator endpoint.",
    ],
  },
  {
    title: "5. Spot the endpoint", media: "endpoint-animation.mp4", type: "video",
    alt: "Animation demonstrating the endpoint colour change in a titration",
    visualCue: "Look for the first faint pink colour that remains after the flask is mixed. A strong, dark pink means too much base was added.",
    lines: [
      "Far from the endpoint, the base can be added more quickly.",
      "Near the endpoint, add it drop by drop and swirl after each drop.",
      "Stop when a faint pink colour stays. Do not keep pouring after that.",
    ],
  },
  {
    title: "6. Understand the pH curve", media: "titration-curve.jpg", type: "image",
    alt: "Titration graph: pH rises as base is added, with a steep change near equivalence",
    visualCue: "The horizontal axis is the volume of base added. The vertical axis is pH. The steep part marks the rapid pH change near equivalence.",
    lines: [
      "At the start, the acid has a low pH, so the curve begins low.",
      "As more base is added, the pH rises. Near equivalence, even a small amount can cause a big change.",
      "For a strong acid and strong base such as HCl and NaOH, the equivalence point is about pH 7. The indicator endpoint is nearby, but is not exactly the same idea.",
    ],
  },
  {
    title: "7. Calculate the unknown concentration", media: "concentration-calculation.jpg", type: "image",
    alt: "Titration calculation: unknown acid molarity times acid volume equals known base molarity times base volume",
    visualCue: "The image shows Mₐ × Vₐ = Mᵦ × Vᵦ, then rearranges it to Mₐ = (Mᵦ × Vᵦ) ÷ Vₐ.",
    lines: [
      "M means concentration, or molarity. V means volume. The subscripts a and b mean acid and base.",
      "For a one-to-one reaction like HCl + NaOH, use Mₐ × Vₐ = Mᵦ × Vᵦ.",
      "Rearrange to find the unknown acid concentration: Mₐ = (Mᵦ × Vᵦ) ÷ Vₐ. Use the same volume units on both sides.",
    ],
  },
  {
    title: "8. Review the full experiment", media: "titration-animation.mp4", type: "video",
    alt: "Acid-base titration animation showing the practical sequence",
    visualCue: "Use this final animation to connect the apparatus, slow addition, indicator colour and measured volume.",
    lines: [
      "Measure the acid into the flask and add phenolphthalein. It should begin colourless.",
      "Add the known base while swirling. Slow down to drops when the colour is close to changing.",
      "Stop at faint pink, record the base volume, and use the one-to-one formula to calculate the acid concentration.",
    ],
  },
];





const EQUIPMENT = [
  { id: "flask", name: "Conical Flask — 250 mL", kind: "glass" },
  { id: "stand", name: "Clamp Stand", kind: "tool" },
  { id: "burette", name: "Burette — 50 mL", kind: "glass" },
  { id: "beaker", name: "Beaker — 100 mL", kind: "glass" },
  { id: "cylinder", name: "Measuring Cylinder — 50 mL", kind: "glass" },
  { id: "dropper", name: "Pasteur Dropper / Pipette", kind: "tool" },
  { id: "rod", name: "Glass Stirring Rod", kind: "tool" },
  { id: "testtube", name: "Test Tube", kind: "glass" },
  { id: "balance", name: "Digital Balance", kind: "tool" },
  { id: "spatula", name: "Laboratory Spatula", kind: "tool" },
  { id: "weighboat", name: "Weighing Boat", kind: "tool" },
];

const CHEMICALS = [
  {
    id: "acid",
    name: "HCl — Hydrochloric Acid",
    formula: "HCl",
    kind: "chemical",
    liquidColor: "#F5F5F5",
    appearance: "Colourless",
    startingVolume: 100,
    concentrationM: 0.1,
  },
  {
    id: "indicator",
    name: "Phenolphthalein — Indicator (C20H14O4)",
    formula: "C20H14O4",
    kind: "chemical",
    liquidColor: "#F5F5F5",
    appearance: "Colourless",
    startingVolume: 5,
  },
  {
    id: "base",
    name: "NaOH — Sodium Hydroxide",
    formula: "NaOH",
    kind: "chemical",
    liquidColor: "#F5F5F5",
    appearance: "Colourless",
    startingVolume: 100,
    concentrationM: 0.1,
  },
  {
    id: "water",
    name: "Distilled Water (H₂O)",
    formula: "H2O",
    kind: "chemical",
    liquidColor: "#48BFFF",
    appearance: "Clear (blue tint for visibility)",
    startingVolume: 100,
  },
];




const CONNECTIONS = [

  [0, 1], [1, 2], [2, 3], [3, 4],

  [0, 5], [5, 6], [6, 7], [7, 8],

  [5, 9], [9, 10], [10, 11], [11, 12],

  [9, 13], [13, 14], [14, 15], [15, 16],

  [13, 17], [17, 18], [18, 19], [19, 20],

  [0, 17],

];



function distance(a, b) {

  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

}

// Map normalized MediaPipe coordinates into the full-screen object-fit:cover frame.
// The camera preview is mirrored, so screen X is inverted exactly once here.
function mapVideoPointToViewport(video, x, y) {
  if (!video) return { x: (1 - x) * window.innerWidth, y: y * window.innerHeight };
  const rect = video.getBoundingClientRect();
  const videoWidth = video.videoWidth || rect.width;
  const videoHeight = video.videoHeight || rect.height;
  const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;
  return {
    x: rect.left + offsetX + (1 - x) * renderedWidth,
    y: rect.top + offsetY + y * renderedHeight,
  };
}



function normalizeLandmarks(points) {
  if (!points || points.length < 21) return null;
  const wrist = points[0];
  const scale = distance(points[0], points[9]) || 0.001;
  const features = [];
  for (const point of points) {
    features.push((point.x - wrist.x) / scale, (point.y - wrist.y) / scale, ((point.z || 0) - (wrist.z || 0)) / scale);
  }
  return features;
}

function classifyCalibratedGesture(features, samples) {
  if (!features || !samples) return null;
  const labels = ["POINT", "PINCH", "OPEN"].filter((label) => Array.isArray(samples[label]) && samples[label].length >= 2);
  if (labels.length < 2) return null;
  const ranked = [];
  for (const label of labels) {
    for (const sample of samples[label]) {
      if (!Array.isArray(sample) || sample.length !== features.length) continue;
      let error = 0;
      for (let i = 0; i < features.length; i++) error += Math.abs(features[i] - sample[i]);
      ranked.push({ label, error: error / features.length });
    }
  }
  ranked.sort((a, b) => a.error - b.error);
  if (!ranked.length || ranked[0].error > 0.16) return null;
  const otherLabel = ranked.find((item) => item.label !== ranked[0].label);
  if (otherLabel && ranked[0].error > otherLabel.error * 0.92) return null;
  return ranked[0].label;
}

function getIndicatorColor(pH, indicatorAdded, endpoint = false) {
  if (endpoint && indicatorAdded) return "#ff3f91";
  if (!indicatorAdded || pH < 8.2) return "#f8fafc";
  const amount = Math.max(0, Math.min(1, (pH - 8.2) / (10.0 - 8.2)));
  const from = [248, 250, 252];
  const to = [245, 166, 190];
  const rgb = from.map((value, index) => Math.round(value + (to[index] - value) * amount));
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}






function Glassware({ item, position }) {
  const glass = {
    color: "#e7f7ff",
    transparent: true,
    opacity: 0.16,
    roughness: 0.08,
    metalness: 0,
    side: 2,
    depthWrite: false,
  };

  const rim = {
    color: "#dff6ff",
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
  };

  const liquidColors = {
    indicator: "#f5f5f5",
    acid: "#f5f5f5",
    base: "#f5f5f5",
    water: "#d9f3ff",
  };

  // CHEMICAL BOTTLE
  if (item.kind === "chemical") {
    const color = liquidColors[item.id] || "#d9f3ff";

    return (
      <group position={position}>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.105, 0.12, 0.43, 64, 1, true]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>

        <mesh position={[0, 0.205, 0]}>
          <cylinderGeometry args={[0.055, 0.105, 0.10, 48]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>

        <mesh position={[0, 0.285, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.12, 48, 1, true]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>

        <mesh position={[0, 0.35, 0]}>
          <torusGeometry args={[0.052, 0.006, 12, 48]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>

        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.095, 0.105, 0.25, 48]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.24}
            roughness={0.12}
          />
        </mesh>

        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.065, 48]} />
          <meshStandardMaterial color="#b9c8d8" roughness={0.32} />
        </mesh>
      </group>
    );
  }

  // GLASS STIRRING ROD
  if (item.id === "rod") {
    return (
      <group position={position} rotation={[0, 0, -0.65]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 1.05, 24]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>
        <mesh position={[0, 0.525, 0]}>
          <sphereGeometry args={[0.012, 20, 16]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>
        <mesh position={[0, -0.525, 0]}>
          <sphereGeometry args={[0.012, 20, 16]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>
      </group>
    );
  }

  // PASTEUR DROPPER
  if (item.id === "dropper") {
    return (
      <group position={position} rotation={[0, 0, -0.25]}>
        <mesh>
          <cylinderGeometry args={[0.022, 0.007, 0.66, 32]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>
        <mesh position={[0, 0.37, 0]}>
          <sphereGeometry args={[0.05, 32, 24]} />
          <meshStandardMaterial color="#a78bfa" roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.355, 0]}>
          <coneGeometry args={[0.012, 0.10, 24]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>
      </group>
    );
  }

  // TEST TUBE — narrow body, rounded closed bottom
  
if (item.id === "testtube") {
  const r = 0.055;
  const h = 0.58;
  const bottomY = -h / 2 + 0.015;
  const topY = h / 2 + 0.015;

  return (
    <group position={position}>
      {/* Slim glass tube walls */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[r, r, h, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#e6f7ff"
          transparent
          opacity={0.16}
          roughness={0.12}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {/* Correct lower hemisphere: rounded bottom stays INSIDE the tube */}
      <mesh position={[0, bottomY, 0]}>
        <sphereGeometry
          args={[r, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
        />
        <meshPhysicalMaterial
          color="#dff6ff"
          transparent
          opacity={0.3}
          roughness={0.12}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {/* One thin rim only, exactly at the opening */}
      <mesh position={[0, topY, 0]}>
        <torusGeometry args={[r - 0.001, 0.0025, 10, 64]} />
        <meshPhysicalMaterial
          color="#e6f7ff"
          transparent
          opacity={0.6}
          roughness={0.12}
        />
      </mesh>

      {/* Liquid contained inside the tube */}
      <mesh position={[0, -0.19, 0]}>
        <cylinderGeometry args={[r * 0.78, r * 0.78, 0.12, 48]} />
        <meshPhysicalMaterial
          color={item.liquidColor || "#d9f3ff"}
          transparent
          opacity={0.48}
          roughness={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Liquid surface */}
      <mesh position={[0, -0.13, 0]}>
        <circleGeometry args={[r * 0.78, 48]} />
        <meshBasicMaterial
          color={item.liquidColor || "#d9f3ff"}
          transparent
          opacity={0.5}
          side={2}
        />
      </mesh>
    </group>
  );
}


  // MEASURING CYLINDER
  if (item.id === "cylinder") {
    return (
      <group position={position}>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.82, 64, 1, true]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>

        <mesh position={[0, 0.55, 0]}>
          <torusGeometry args={[0.065, 0.004, 12, 64]} />
          <meshPhysicalMaterial {...rim} />
        </mesh>

        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.14, 0.15, 0.055, 64]} />
          <meshPhysicalMaterial
            color="#d9eff8"
            roughness={0.2}
          />
        </mesh>

        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0.018, -0.22 + i * 0.075, 0.06]}>
            <boxGeometry
              args={[i % 5 === 4 ? 0.05 : 0.03, 0.004, 0.002]}
            />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
    );
  }

  // BEAKER — straight sides, thick base, open rim and spout
  
if (item.id === "beaker") {
  const r = 0.235;
  const h = 0.52;

  return (
    <group position={position}>
      {/* Open glass walls */}
      <mesh>
        <cylinderGeometry args={[r, r * 0.97, h, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#e8f7ff"
          transparent
          opacity={0.12}
          roughness={0.15}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {/* Single thick bottom — no extra outer ring */}
      <mesh position={[0, -h / 2 - 0.012, 0]}>
        <cylinderGeometry args={[r * 0.97, r * 0.97, 0.024, 64]} />
        <meshStandardMaterial
          color="#d9eff8"
          transparent
          opacity={0.55}
          roughness={0.18}
        />
      </mesh>

      {/* Single opening rim */}
      <mesh position={[0, h / 2, 0]}>
        <torusGeometry args={[r, 0.0015, 6, 64]} />
        <meshBasicMaterial
          color="#e6f7ff"
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Small pouring spout */}
      <mesh position={[r * 0.98, h / 2 - 0.015, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.018, 0.055, 24]} />
        <meshStandardMaterial
          color="#e6f7ff"
          transparent
          opacity={0.24}
        />
      </mesh>

      {/* One simple liquid layer */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[r * 0.84, r * 0.84, 0.12, 48]} />
        <meshStandardMaterial
          color="#d9f3ff"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}


  // DIGITAL BALANCE
  if (item.id === "balance") {
    return (
      <group position={position}>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.38, 0.12, 0.28]} />
          <meshStandardMaterial color="#dce5ef" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.0, 0.03]}>
          <boxGeometry args={[0.19, 0.035, 0.015]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.018, 48]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.25} />
        </mesh>
      </group>
    );
  }

  // LAB SPATULA
  if (item.id === "spatula") {
    return (
      <group position={position} rotation={[0, 0, -0.5]}>
        <mesh>
          <cylinderGeometry args={[0.009, 0.009, 0.48, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.65} />
        </mesh>
      </group>
    );
  }

  // WEIGHING BOAT
  if (item.id === "weighboat") {
    return (
      <group position={position}>
        <mesh>
          <cylinderGeometry args={[0.13, 0.09, 0.035, 48, 1, true]} />
          <meshStandardMaterial
            color="#e5e7eb"
            transparent
            opacity={0.8}
            side={2}
          />
        </mesh>
        <mesh position={[0, -0.018, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.008, 48]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>
    );
  }

  // FALLBACK FOR ANY OTHER EQUIPMENT
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#a78bfa" />
      </mesh>
    </group>
  );
}






 


const LabObjects = memo(function LabObjects(props) {
  return <NewLabObjects {...props} />;
});



export default function Lab({ experiment, onBack }) {

  const videoRef = useRef(null);

  const overlayRef = useRef(null);



  const [stage, setStage] = useState("topics");

  const [topic, setTopic] = useState(null);

  const [mode, setMode] = useState("guided");
  const [lessonSpeaking, setLessonSpeaking] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [doubtImage, setDoubtImage] = useState(null);
  const [doubtAnswer, setDoubtAnswer] = useState("");
  const [doubtBusy, setDoubtBusy] = useState(false);
  const [doubtError, setDoubtError] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");

  const [drawer, setDrawer] = useState("equipment");

  const [selectedItems, setSelectedItems] = useState([]);

  const [cameraStatus, setCameraStatus] = useState("Starting camera...");

  const [handsFound, setHandsFound] = useState(0);

  const [rightGesture, setRightGesture] = useState("NO HAND");

  const [leftGesture, setLeftGesture] = useState("NO HAND");
const [handPositions, setHandPositions] = useState({ Left: null, Right: null });
  const handPositionsRef = useRef({ Left: null, Right: null });
  const stageRef = useRef(stage);
  const selectionDwellRef = useRef({ Left: null, Right: null });
  const selectionCooldownRef = useRef({ Left: 0, Right: 0 });
  stageRef.current = stage;
  const [step, setStep] = useState(0);
  const [labSceneRevision, setLabSceneRevision] = useState(0);
  const [assistedPourToken, setAssistedPourToken] = useState(0);

const [showEquipment, setShowEquipment] = useState(true);
const [showChemicals, setShowChemicals] = useState(true);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [calibration, setCalibration] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nexora-gesture-calibration") || "{}"); }
    catch { return {}; }
  });
  // Keep the latest calibration available to the animation loop without stale React closures.
  const calibrationRef = useRef(calibration);
  useEffect(() => { calibrationRef.current = calibration; }, [calibration]);
  // Keep the capture label in both React state (for the UI) and a ref (for the camera loop).
  const [calibrationCaptureLabel, setCalibrationCaptureLabel] = useState(null);
  const calibrationCaptureLabelRef = useRef(null);
  const [experimentState, setExperimentState] = useState({
    waterMl: 0, baseMl: 0, acidMl: 0, indicatorMl: 0,
    flaskMl: 0, cylinderMl: 0, buretteMl: 0, pH: 7, indicatorDrops: 0,
    endpoint: false, lastAction: "Prepare the lab equipment.",
  });
  const experimentStateRef = useRef(experimentState);

  const activeTopic =

    topic || TOPICS.find((item) => item.title === experiment?.title) || TOPICS[0];

  const speakLessonLine = useCallback((line) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const readFullLesson = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const lines = TITRATION_LESSON.flatMap((section) => [section.title, section.visualCue, ...section.lines]);
    let index = 0;
    setLessonSpeaking(true);
    const speakNext = () => {
      if (index >= lines.length) { setLessonSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(lines[index++]);
      utterance.lang = "en-IN";
      utterance.rate = 0.9;
      utterance.onend = speakNext;
      utterance.onerror = () => setLessonSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }, []);

  const stopLessonSpeech = useCallback(() => {
    window.speechSynthesis?.cancel?.();
    setLessonSpeaking(false);
  }, []);

  useEffect(() => {
    if (stage !== "explanation") stopLessonSpeech();
    return () => window.speechSynthesis?.cancel?.();
  }, [stage, stopLessonSpeech]);



  const experimentSteps = [
    { title: "Prepare the laboratory", instruction: "Use your left hand for all movable equipment and your right hand for chemical bottles. Keep the stand and burette fixed; check the HCl, NaOH, phenolphthalein and funnel.", done: selectedItems.some((item) => item.id === "flask") && selectedItems.some((item) => item.id === "acid") && selectedItems.some((item) => item.id === "base") && selectedItems.some((item) => item.id === "indicator"), blocked: "Select the conical flask, HCl — Hydrochloric Acid, NaOH — Sodium Hydroxide, and Phenolphthalein — Indicator from the existing drawers." },
    { title: "Add hydrochloric acid to the flask", instruction: "Right hand: pinch the HCl bottle, hold its mouth over the flask, and tilt briefly. About 12 mL transfers in roughly 1 second. Use your left hand for equipment.", done: experimentState.acidMl >= 11.9 && experimentState.flaskMl >= 11.9, blocked: "Right hand: tilt HCl over the flask until about 12 mL has transferred." },
    { title: "Add phenolphthalein", instruction: "Right hand: tip the indicator briefly over the flask. One tilt releases exactly two drops (0.10 mL); return it upright before dispensing another dose.", done: experimentState.indicatorMl >= 0.10, blocked: "Right hand: tip the indicator over the flask once for two drops. The acidic solution stays colourless." },
    { title: "Fill the burette with sodium hydroxide", instruction: "Right hand: pour about 20 mL of labelled NaOH into the fixed burette. The fast pour takes about 1–2 seconds; use the funnel if present.", done: experimentState.buretteMl >= 19.9, blocked: "Right hand: tilt the NaOH bottle over the burette top until about 20 mL transfers. Do not pour through the stopcock." },
    { title: "Position the flask under the burette", instruction: "Left hand: place the conical flask directly below the burette tip. Keep the stand and burette fixed.", done: experimentState.buretteMl >= 19.9 && experimentState.baseMl > 0, blocked: "Left hand: move the flask beneath the fixed burette nozzle after filling it with NaOH." },
    { title: "Titrate with sodium hydroxide", instruction: "Use your right hand to pinch the stopcock and start the controlled NaOH flow. Close it as soon as the solution turns faint pink.", done: experimentState.baseMl > 0 && experimentState.endpoint, blocked: "Right hand: open the stopcock with the flask beneath the tip. Close it at the faint-pink endpoint." },
    { title: "Reach the pale-pink endpoint", instruction: "Dispense NaOH carefully until a faint pink colour persists, then close the stopcock with your right hand.", done: experimentState.endpoint, blocked: "Continue the controlled burette flow and stop at the first persistent pale pink." },
    { title: "Review the result", instruction: "Observe the pale-pink endpoint and review the reaction and conclusion.", done: experimentState.endpoint && experimentState.indicatorMl >= 0.10, blocked: "Complete the titration and add phenolphthalein before reviewing the result." },
  ];
  const currentStepIndex = Math.min(experimentSteps.findIndex((item) => !item.done) < 0 ? experimentSteps.length - 1 : experimentSteps.findIndex((item) => !item.done), experimentSteps.length - 1);
  const currentExperimentStep = experimentSteps[currentStepIndex];
  const teacherLine = experimentState.endpoint
    ? "Excellent work, scientist! We’ve completed our first experiment — Pink Titration."
    : validationMessage
      ? `Let's correct that: ${validationMessage}`
    : currentStepIndex > 0
      ? `Good work. ${currentExperimentStep.instruction}`
      : "Welcome to the lab. Let’s prepare the apparatus and solutions together.";

  useEffect(() => {
    if (stage !== "lab") return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(teacherLine);
      utterance.lang = "en-IN";
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    }
    return () => window.speechSynthesis?.cancel?.();
  }, [stage, currentStepIndex, experimentState.endpoint, currentExperimentStep.instruction, teacherLine]);

  async function askTeacher(event) {
    event.preventDefault();
    if (!doubtQuestion.trim()) return;
    setHintsUsed((count) => count + 1);
    setDoubtBusy(true);
    setDoubtError("");
    setDoubtAnswer("");
    try {
      const formData = new FormData();
      formData.append("question", doubtQuestion.trim());
      formData.append("state", JSON.stringify({ ...experimentStateRef.current, step: currentStepIndex + 1, mode }));
      if (doubtImage) formData.append("file", doubtImage, doubtImage.name);
      const response = await fetch("/api/doubt", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(response.status
          ? `The learning API returned an invalid response (HTTP ${response.status}). Restart the project with npm run dev.`
          : "The learning API returned an empty response. Restart the project with npm run dev.");
      }
      if (!response.ok) throw new Error(data.error || "The teacher could not answer right now.");
      setDoubtAnswer(`${data.answer}${data.sources?.length ? `\n\nSources: ${data.sources.join(", ")}` : ""}`);
    } catch (error) {
      setDoubtError(error.message || "Dr. Nova could not reach the learning API. Restart the project and try again.");
    } finally {
      setDoubtBusy(false);
    }
  }

  const handleTransfer = useCallback(({ sourceId, targetId, ml }) => {
    if (!Number.isFinite(ml) || ml <= 0) return;
    const prev = experimentStateRef.current;
    const reject = (message) => {
      setMistakes((count) => count + 1);
      setValidationMessage(message);
      return 0;
    };
    if (targetId === "burette" && sourceId !== "base") return reject("Only the labelled NaOH bottle should fill the burette for this titration.");
    if (sourceId === "burette" && targetId === "flask" && (prev.acidMl <= 0 || prev.indicatorMl < 0.10)) return reject("Add HCl and phenolphthalein to the flask before dispensing NaOH from the burette.");
    if (sourceId === "base" && targetId === "flask") return reject("For a controlled titration, fill the burette with NaOH and dispense it through the stopcock.");
    if (sourceId === "indicator" && targetId === "flask" && prev.acidMl <= 0) return reject("Add hydrochloric acid to the flask before adding the indicator.");
    setValidationMessage("");
    let amount = Math.max(0, ml);
    if (sourceId === "acid" && targetId === "flask") {
      amount = Math.min(amount, Math.max(0, 12 - prev.acidMl));
    }
    if (sourceId === "burette" && targetId === "flask" && prev.acidMl > 0 && prev.indicatorMl >= 0.10 && !prev.endpoint) {
      const targetOH = 10 ** (8.8 - 14);
      const ratio = targetOH / 0.1;
      const targetBaseMl = (prev.acidMl + ratio * (prev.acidMl + prev.waterMl + prev.indicatorMl)) / (1 - ratio);
      amount = Math.min(amount, Math.max(0, targetBaseMl - prev.baseMl));
    }
    if (amount <= 0) return 0;
    const next = { ...prev };
      if (sourceId === "water" && targetId === "cylinder") next.cylinderMl = Math.min(50, next.cylinderMl + amount);
      if (sourceId === "water" && targetId === "flask") next.waterMl = Math.min(250, next.waterMl + amount);
      if (sourceId === "cylinder" && targetId === "flask") {
        const moved = Math.min(amount, next.cylinderMl, Math.max(0, 250 - next.flaskMl));
        next.cylinderMl = Math.max(0, next.cylinderMl - moved);
        next.waterMl = Math.min(250, next.waterMl + moved);
      }
      if (sourceId === "base" && targetId === "burette") next.buretteMl = Math.min(50, next.buretteMl + amount);
      if (sourceId === "base" && targetId === "flask") next.baseMl = Math.min(250 - next.flaskMl, next.baseMl + amount);
      if (sourceId === "indicator" && targetId === "flask") { next.indicatorMl = Math.min(5, next.indicatorMl + amount); next.indicatorDrops = next.indicatorMl / 0.05; }
      if (sourceId === "acid" && targetId === "burette") next.buretteMl = Math.min(50, next.buretteMl + amount);
      if (sourceId === "acid" && targetId === "flask") next.acidMl = Math.min(250 - next.flaskMl, next.acidMl + amount);
      if (sourceId === "burette" && targetId === "flask") { const moved = Math.min(amount, next.buretteMl, Math.max(0, 250 - next.flaskMl)); next.buretteMl -= moved; next.baseMl += moved; }
      next.flaskMl = Math.min(250, next.waterMl + next.baseMl + next.acidMl + next.indicatorMl);
      const baseMoles = next.baseMl * 0.100 / 1000;
      const acidMoles = next.acidMl * 0.100 / 1000;
      const totalLitres = Math.max(next.flaskMl / 1000, 1e-9);
      const excess = baseMoles - acidMoles;
      if (Math.abs(excess) < 1e-12) next.pH = 7;
      else if (excess > 0) next.pH = 14 + Math.log10(Math.max(excess / totalLitres, 1e-14));
      else next.pH = -Math.log10(Math.max((-excess) / totalLitres, 1e-14));
      next.pH = Math.max(0, Math.min(14, next.pH));
      const crossedIndicatorRange = prev.pH < 8.2 && next.pH >= 8.2 && next.pH <= 10.5;
      next.endpoint = prev.endpoint || (next.acidMl > 0 && next.indicatorMl >= 0.10 && ((next.pH >= 8.2 && next.pH <= 9.2) || crossedIndicatorRange));
      next.lastAction = `${sourceId} → ${targetId}: ${amount.toFixed(2)} mL transferred`;
    experimentStateRef.current = next;
    setExperimentState(next);
    // The user asked to treat bringing/pouring HCl into the flask as the
    // completed practical and jump straight to the final pink result.
    if (sourceId === "acid" && targetId === "flask") finishGuidedTitration();
    if (next.endpoint) {
      try { localStorage.setItem("nexora-last-result", JSON.stringify({ experiment: "Pink Titration", status: "completed", stepsCompleted: 8, mistakes, hintsUsed, finalPH: next.pH, acidMl: next.acidMl, baseMl: next.baseMl, completedAt: new Date().toISOString() })); } catch {}
    }
    return amount;
  }, [mistakes, hintsUsed]);

  function finishGuidedTitration() {
    const previous = experimentStateRef.current;
    const acidMl = Math.max(12, previous.acidMl);
    const indicatorMl = Math.max(0.10, previous.indicatorMl);
    const targetExcessOH = 10 ** (8.8 - 14);
    const ratio = targetExcessOH / 0.100;
    const baseMl = (acidMl + ratio * (acidMl + previous.waterMl + indicatorMl)) / (1 - ratio);
    const next = {
      ...previous,
      acidMl,
      indicatorMl,
      indicatorDrops: Math.max(2, previous.indicatorDrops),
      baseMl,
      buretteMl: Math.max(0, 20 - baseMl),
      flaskMl: previous.waterMl + acidMl + indicatorMl + baseMl,
      pH: 8.8,
      endpoint: true,
      lastAction: "Guided titration completed at the pale-pink endpoint.",
    };
    experimentStateRef.current = next;
    setExperimentState(next);
    setValidationMessage("");
    try {
      localStorage.setItem("nexora-last-result", JSON.stringify({
        experiment: "Pink Titration", status: "completed", stepsCompleted: 8,
        mistakes, hintsUsed, finalPH: next.pH, acidMl: next.acidMl,
        baseMl: next.baseMl, completedAt: new Date().toISOString(),
      }));
    } catch {}
  }

  const sceneItems = useMemo(() => [
    ...selectedItems.filter((item) => item.id !== "stand" && item.id !== "burette").map((item) => {
      const isBlueWaterOnly = experimentState.waterMl > 0 && experimentState.acidMl === 0 && experimentState.baseMl === 0 && !experimentState.endpoint;
      const liquidColor = isBlueWaterOnly ? "#48BFFF" : getIndicatorColor(experimentState.pH, experimentState.indicatorMl > 0, experimentState.endpoint);
      return item.id === "flask" || item.id === "beaker"
        ? { ...item, liquidColor, isEndpoint: experimentState.endpoint }
        : item;
    }),
    { id: "stand", name: "Clamp Stand", kind: "tool", fixed: true, permanent: true },
    { id: "burette", name: "Burette — 50 mL", kind: "glass", fixed: true, permanent: true, startingVolume: experimentState.buretteMl },
  ], [selectedItems, experimentState]);

  function resetExperimentState() {
    try {
      sessionStorage.removeItem("nexora-lab-positions-v2");
      sessionStorage.removeItem("nexora-lab-positions-v4");
    } catch {}
    const initialState = { waterMl: 0, baseMl: 0, acidMl: 0, indicatorMl: 0, flaskMl: 0, cylinderMl: 0, buretteMl: 0, pH: 7, indicatorDrops: 0, endpoint: false, lastAction: "Prepare the lab equipment." };
    experimentStateRef.current = initialState;
    setExperimentState(initialState);
    setMistakes(0);
    setHintsUsed(0);
    setValidationMessage("");
    setSelectedItems([]);
    setStep(0);
    setLabSceneRevision((revision) => revision + 1);
  }

  function armCalibration(label) {
    setCalibrationCaptureLabel(label);
    calibrationCaptureLabelRef.current = label;
  }
  function clearCalibration() {
    setCalibration({});
    calibrationRef.current = {};
    setCalibrationCaptureLabel(null);
    calibrationCaptureLabelRef.current = null;
    try { localStorage.removeItem("nexora-gesture-calibration"); } catch {}
  }



  useEffect(() => {

    let active = true;

    let stream;

    let landmarker;

    let frameId;

    let lastVideoTime = -1;

    let lastStatus = "";

    let lastHands = -1;



    
    // Smooth noisy MediaPipe landmarks to reduce cursor and tilt jitter.
    const smoothedHands = { Left: null, Right: null };
async function startCamera() {

      try {

        if (!navigator.mediaDevices?.getUserMedia) {

          throw new Error("Camera unavailable. Open the app on localhost or HTTPS.");

        }



        stream = await navigator.mediaDevices.getUserMedia({

          video: {

            facingMode: "user",

            width: { ideal: 1280 },

            height: { ideal: 720 },

          },

          audio: false,

        });

        // Use the webcam's widest field of view when it exposes a zoom control.
        try {
          const cameraTrack = stream.getVideoTracks()[0];
          const zoomRange = cameraTrack?.getCapabilities?.().zoom;
          if (zoomRange && Number.isFinite(zoomRange.min)) {
            await cameraTrack.applyConstraints({ advanced: [{ zoom: zoomRange.min }] });
          }
        } catch (zoomError) {
          console.info("NEXORA: camera zoom control unavailable; retaining default framing.", zoomError);
        }



        if (!active) {

          stream.getTracks().forEach((track) => track.stop());

          return;

        }



        const video = videoRef.current;

        if (!video) throw new Error("Camera preview could not be found.");



        video.srcObject = stream;

        await video.play();



        setCameraStatus("Loading hand tracking...");



        const vision = await FilesetResolver.forVisionTasks(

          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"

        );



        if (!active) return;



        // Prefer GPU for responsive tracking; fall back to CPU on unsupported devices.
        const options = {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        };

        try {
          landmarker = await HandLandmarker.createFromOptions(vision, options);
        } catch (gpuError) {
          console.warn("NEXORA: GPU hand tracker unavailable; falling back to CPU.", gpuError);
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: "CPU" },
          });
        }



        if (!active) {

          landmarker.close();

          return;

        }



        function track() {

          if (!active) return;



          const videoElement = videoRef.current;

          const canvas = overlayRef.current;



          if (!videoElement || !canvas || videoElement.readyState < 2) {

            frameId = requestAnimationFrame(track);

            return;

          }



          const overlayRect = canvas.getBoundingClientRect();
          const overlayWidth = Math.max(1, Math.round(overlayRect.width));
          const overlayHeight = Math.max(1, Math.round(overlayRect.height));
          if (canvas.width !== overlayWidth || canvas.height !== overlayHeight) {
            canvas.width = overlayWidth;
            canvas.height = overlayHeight;
          }



          if (videoElement.currentTime !== lastVideoTime) {

            // Do not run inference more than ~30 times per second on high-refresh displays.
            const inferenceNow = performance.now();
            if (track.lastInferenceAt && inferenceNow - track.lastInferenceAt < 33) {
              frameId = requestAnimationFrame(track);
              return;
            }
            track.lastInferenceAt = inferenceNow;
            lastVideoTime = videoElement.currentTime;

            const result = landmarker.detectForVideo(videoElement, inferenceNow);

            const ctx = canvas.getContext("2d");

            const hands = result.landmarks || [];

            const handedness = result.handedness || [];

            const detected = { Left: "NO HAND", Right: "NO HAND" };

const detectedHandPositions = { Left: null, Right: null };



            ctx.clearRect(0, 0, canvas.width, canvas.height);



            hands.forEach((points, index) => {
              // Draw skeleton landmarks against the same mirrored cover crop as
              // the webcam instead of stretching raw camera coordinates.
              const displayPoints = points.map((point) => {
                const mapped = mapVideoPointToViewport(videoElement, point.x, point.y);
                return { x: mapped.x - overlayRect.left, y: mapped.y - overlayRect.top };
              });

              // MediaPipe handedness uses a mirrored-selfie convention, while
              // detectForVideo receives the raw unmirrored camera frame. Flip
              // its label once so Left/Right refer to the student's physical hands.
              const reportedHand = handedness[index]?.[0]?.categoryName;
              let handName = reportedHand === "Left" ? "Right"
                : reportedHand === "Right" ? "Left"
                  : reportedHand;
              const handConfidence = handedness[index]?.[0]?.score ?? 1;
              if ((handName !== "Left" && handName !== "Right") || handConfidence < 0.45) return;

              // MediaPipe can briefly flip its handedness result when a single
              // hand turns edge-on. Keep the physical identity if the wrist is
              // continuous with the other label from the immediately prior frame.
              const oppositeHand = handName === "Left" ? "Right" : "Left";
              const oppositeTrack = smoothedHands[oppositeHand];
              const wrist = points[0];
              if (oppositeTrack?.wristX != null && performance.now() - (oppositeTrack.seenAt ?? 0) < 140 &&
                  Math.hypot(wrist.x - oppositeTrack.wristX, wrist.y - oppositeTrack.wristY) < 0.14) {
                handName = oppositeHand;
              }



              const features = normalizeLandmarks(points);
              const requestedCalibration = calibrationCaptureLabelRef.current;
              if (requestedCalibration && features) {
                const samples = { ...(calibrationRef.current || {}) };
                const previousSamples = Array.isArray(samples[requestedCalibration]) ? samples[requestedCalibration] : [];
                samples[requestedCalibration] = [...previousSamples, features].slice(-8);
                samples.savedAt = Date.now();
                calibrationRef.current = samples;
                setCalibration(samples);
                try { localStorage.setItem("nexora-gesture-calibration", JSON.stringify(samples)); } catch {}
                calibrationCaptureLabelRef.current = null;
                setCalibrationCaptureLabel(null);
              }
              const calibratedGesture = classifyCalibratedGesture(features, calibrationRef.current);
              // Use hysteresis so tiny landmark jitter cannot release a held
              // bottle mid-gesture. A fresh pinch starts at 0.38 palm widths;
              // once held, it stays engaged until the fingers clearly separate.
              const previousGesture = smoothedHands[handName];
              const palmWidth = distance(points[0], points[9]) || 0.001;
              const pinchRatio = distance(points[4], points[8]) / palmWidth;
              const pinch = calibratedGesture === "PINCH" ||
                (previousGesture?.pinching ? pinchRatio < 0.56 : pinchRatio < 0.38);
              const cursorLandmark = pinch
                ? { x: (points[4].x + points[8].x) / 2, y: (points[4].y + points[8].y) / 2 }
                : points[8];
              const wristToMiddleX = points[9].x - points[0].x;
              const wristToMiddleY = points[9].y - points[0].y;
              const palmAngle = Math.atan2(wristToMiddleY, wristToMiddleX);
              let rawTilt = palmAngle + Math.PI / 2;
              while (rawTilt > Math.PI) rawTilt -= Math.PI * 2;
              while (rawTilt < -Math.PI) rawTilt += Math.PI * 2;
              rawTilt = Math.max(-1.45, Math.min(1.45, rawTilt));
              // Detect pointing from finger segments (tip-to-MCP vs PIP-to-MCP),
              // not wrist distances. Wrist-based tests fail when the hand rotates.
              const palmScale = distance(points[0], points[9]) || 0.001;
              const indexExtended = distance(points[8], points[5]) > distance(points[6], points[5]) * 1.12;
              const middleFolded = distance(points[12], points[0]) < distance(points[9], points[0]) * 1.22;
              const ringFolded = distance(points[16], points[0]) < distance(points[13], points[0]) * 1.22;
              const pinkyFolded = distance(points[20], points[0]) < distance(points[17], points[0]) * 1.22;
              const rulePointing = !pinch && indexExtended && middleFolded && (ringFolded || pinkyFolded) && palmScale > 0.001;
              const pointing = calibratedGesture ? calibratedGesture === "POINT" : rulePointing;
              const previous = previousGesture;
              const alpha = previous ? 0.24 : 1;
              const smoothed = {
                x: previous ? previous.x + (cursorLandmark.x - previous.x) * alpha : cursorLandmark.x,
                y: previous ? previous.y + (cursorLandmark.y - previous.y) * alpha : cursorLandmark.y,
                // Wrist orientation is used for bottle pouring. Smooth it enough
                // to calm landmark jitter while keeping the pour response quick.
                tilt: previous ? previous.tilt + (rawTilt - previous.tilt) * 0.32 : rawTilt,
                pinching: pinch,
                wristX: points[0].x,
                wristY: points[0].y,
                seenAt: performance.now(),
              };
              smoothedHands[handName] = smoothed;
              const mappedScreenPoint = mapVideoPointToViewport(videoRef.current, smoothed.x, smoothed.y);
              detectedHandPositions[handName] = {
                x: smoothed.x, y: smoothed.y, screenX: mappedScreenPoint.x, screenY: mappedScreenPoint.y,
                pinching: pinch, pointing, tilt: smoothed.tilt,
              };

              // Dwell-to-select: use the same mirrored viewport coordinates as the
              // visible fingertip cursor, then hit-test the real DOM element.
              // The selection guidance is left instruments / right chemicals;
              // Use the same physical-hand mapping as object interaction:
              // left hand for instruments, right hand for chemical inventory.
              if (pointing && stageRef.current === "lab") {
                const mappedPoint = mapVideoPointToViewport(videoRef.current, smoothed.x, smoothed.y);
                const px = mappedPoint.x;
                const py = mappedPoint.y;
                const hit = document.elementFromPoint(
                  Math.max(0, Math.min(window.innerWidth - 1, px)),
                  Math.max(0, Math.min(window.innerHeight - 1, py))
                );
                const card = hit?.closest?.(".equipment-option");
                const correctDrawer = handName === "Left"
                  ? card?.closest?.(".equipment-sidebar-left")
                  : card?.closest?.(".equipment-sidebar-right");
                const rect = card?.getBoundingClientRect();
                const target = card && correctDrawer && rect && rect.width > 0 && rect.height > 0
                  ? card : null;
                const now = performance.now();
                const nextHover = target ? `${handName}:${target.dataset.itemId}` : null;
                setHoveredOption((old) => old === nextHover ? old : nextHover);
                const key = target?.dataset.itemId || "";
                const dwell = selectionDwellRef.current[handName];

                if (!target) {
                  selectionDwellRef.current[handName] = null;
                } else if (dwell?.key !== key) {
                  selectionDwellRef.current[handName] = { key, since: now, clicked: false };
                } else if (
                  !dwell.clicked &&
                  now - dwell.since >= 550 &&
                  now - selectionCooldownRef.current[handName] >= 650
                ) {
                  const isAlreadyAdded = target.classList.contains("equipment-added");
                  if (!isAlreadyAdded) target.click();
                  selectionCooldownRef.current[handName] = now;
                  selectionDwellRef.current[handName] = { key, since: now, clicked: true };
                }
              } else {
                selectionDwellRef.current[handName] = null;
                setHoveredOption((old) => old?.startsWith(`${handName}:`) ? null : old);
              }
              detected[handName] = pinch ? "PINCH" : pointing ? "POINT" : "OPEN";



              ctx.strokeStyle = handName === "Left" ? "#A78BFA" : "#36D6C5";

              ctx.lineWidth = Math.max(3, canvas.width / 400);

              ctx.lineCap = "round";

              ctx.lineJoin = "round";



              CONNECTIONS.forEach(([a, b]) => {

                ctx.beginPath();

                ctx.moveTo(displayPoints[a].x, displayPoints[a].y);

                ctx.lineTo(displayPoints[b].x, displayPoints[b].y);

                ctx.stroke();

              });



              displayPoints.forEach((point) => {

                ctx.beginPath();

                ctx.arc(

                  point.x,
                  point.y,

                  Math.max(3, canvas.width / 300),

                  0,

                  Math.PI * 2

                );

                ctx.fillStyle = "#ffffff";

                ctx.fill();

              });



              [4, 8].forEach((i) => {

                const p = displayPoints[i];

                ctx.beginPath();

                ctx.arc(

                  p.x,
                  p.y,

                  Math.max(7, canvas.width / 180),

                  0,

                  Math.PI * 2

                );

                ctx.fillStyle = pinch ? "#FFD166" : "#ffffff";

                ctx.fill();

              });

            });


            const detectedCount = Object.values(detectedHandPositions).filter(Boolean).length;
            // Forget stale smoothing data when a hand leaves frame so re-entry is stable.
            ["Left", "Right"].forEach((name) => {
              if (!detectedHandPositions[name]) {
                smoothedHands[name] = null;
                selectionDwellRef.current[name] = null;
              }
            });
            handPositionsRef.current = detectedHandPositions;
            setHandPositions((previous) => {
              const same = ["Left", "Right"].every((name) => {
                const a = previous[name], b = detectedHandPositions[name];
                return (!a && !b) || (a && b &&
                  Math.abs(a.x - b.x) < 0.02 &&
                  Math.abs(a.y - b.y) < 0.02 &&
                  Math.abs((a.screenX ?? 0) - (b.screenX ?? 0)) < 12 &&
                  Math.abs((a.screenY ?? 0) - (b.screenY ?? 0)) < 12 &&
                  a.pinching === b.pinching && a.pointing === b.pointing &&
                  Math.abs(a.tilt - b.tilt) < 0.04);
              });
              return same ? previous : detectedHandPositions;
            });


            if (detectedCount !== lastHands) {
              lastHands = detectedCount;
              setHandsFound(detectedCount);
            }

            const status = detectedCount === 2
              ? "Both hands detected"
              : detectedCount === 1
                ? "One hand detected"
                : "Show your hands to the camera";



            if (status !== lastStatus) {

              lastStatus = status;

              setCameraStatus(status);

            }



            setLeftGesture((old) => old === detected.Left ? old : detected.Left);

            setRightGesture((old) => old === detected.Right ? old : detected.Right);

          }



          frameId = requestAnimationFrame(track);

        }



        setCameraStatus("Show your hands to the camera");

        track();

      } catch (error) {

        console.error("NEXORA camera error:", error);

        if (active) setCameraStatus(`Camera error: ${error.message}`);

      }

    }



    startCamera();



    return () => {

      active = false;

      cancelAnimationFrame(frameId);

      if (stream) stream.getTracks().forEach((track) => track.stop());

      if (landmarker) landmarker.close();

    };

  }, []);



  function toggleItem(item) {

    setSelectedItems((current) =>

      current.some((existing) => existing.id === item.id)

        ? current.filter((existing) => existing.id !== item.id)

        : [...current, item]

    );

  }



  function resetLab() {
    if (window.confirm("Reset the experiment, remove workspace items, and clear all measurements?")) resetExperimentState();
  }



  function changeExperiment() {

    setStage("topics");

    setTopic(null);

    resetLab();

  }



  return (

    <main className={`lab-page ${stage === "lab" ? "lab-fullscreen" : ""}`}>
      <style>{`.equipment-option.equipment-hand-hover{outline:2px solid #67e8f9!important;border-color:#67e8f9!important;box-shadow:0 0 0 4px #67e8f933,0 0 22px #67e8f955!important;transform:translateY(-1px)}.equipment-option{transition:outline .12s,border-color .12s,box-shadow .12s,transform .12s}.lab-current-step{position:absolute;z-index:8;top:14px;left:50%;transform:translateX(-50%);width:min(760px,calc(100vw - 40px));text-align:center;color:#fff;font-size:clamp(13px,1.25vw,18px);font-weight:800;letter-spacing:.035em;text-shadow:0 2px 8px #000,0 0 14px #000b;pointer-events:none}.lab-current-step span{color:#a5b4fc}.lab-current-step small{display:block;margin-top:4px;font-size:12px;font-weight:500;letter-spacing:0;color:#f0f4ff}.lab-current-step .lab-step-blocked{color:#fde68a;font-size:10px}`}</style>

      <video

        ref={videoRef}

        className="lab-webcam"

        autoPlay

        muted

        playsInline

      />

      <canvas ref={overlayRef} className="lab-hand-overlay" />
      {["Left", "Right"].map((name) => {
        const hand = handPositions[name];
        if (!hand || hand.x == null) return null;
        const cursorPoint = mapVideoPointToViewport(videoRef.current, hand.x, hand.y);
        return <div key={name} aria-hidden="true" style={{
          position: "fixed", left: `${cursorPoint.x}px`, top: `${cursorPoint.y}px`,
          width: 18, height: 18, borderRadius: "50%", zIndex: 9999,
          transform: "translate(-50%, -50%)", pointerEvents: "none",
          background: hand.pinching ? "#FFD166" : hand.pointing ? "#FFFFFF" : name === "Left" ? "#A78BFA" : "#36D6C5",
          border: "2px solid white", boxShadow: "0 0 0 3px #0005"
        }} />;
      })}



      <header className="lab-topbar lab-floating-topbar">

        <button className="lab-back" onClick={onBack}>

          <ArrowLeft size={18} /> Back to NEXORA

        </button>

        <div className="lab-brand">

          <FlaskConical size={20} /> NEXORA <span>LAB</span>

        </div>

        <div className="lab-status">

          <span className="lab-live-dot" /> {handsFound}/2 HANDS

        </div>

      </header>



      {/* {stage !== "lab" && (

        <div className="lab-camera-status lab-floating-status">

          <span className="lab-live-dot" /> {cameraStatus}

        </div>

      )} */}



      {stage === "topics" && (

        <section className="lab-stage lab-glass-panel">

          <span className="lab-eyebrow">NEXORA / VIRTUAL CHEMISTRY</span>

          <h1>Choose your experiment</h1>

          <p className="lab-intro">

            Your camera stays active while you learn and explore the virtual lab.

          </p>

          <div className="topic-grid">

            {TOPICS.map((item) => (

              <button

                className="topic-card"

                key={item.id}

                onClick={() => {

                  setTopic(item);

                  setStage("explanation");

                }}

              >

                <FlaskConical size={26} />

                <span className="topic-level">{item.level}</span>

                <h2>{item.title}</h2>

                <p>{item.description}</p>

                <span className="topic-link">Explore topic →</span>

              </button>

            ))}

          </div>

        </section>

      )}



      {stage === "explanation" && (

        <section className="lab-stage lab-glass-panel">

          <span className="lab-eyebrow">STEP 01 / UNDERSTAND</span>

          <h1>{activeTopic.title}</h1>

          {activeTopic.id === "pink" && <section className="titration-lesson" aria-label="Titration lesson">
            <div className="titration-lesson-heading">
              <div>
                <span className="lab-eyebrow">WATCH, READ AND LISTEN</span>
                <h2>Acid–base titration, step by step</h2>
                <p>Simple explanations in order. Use the speaker to hear the lesson read aloud.</p>
              </div>
              <div className="lesson-audio-controls">
                <button type="button" className="lesson-audio-button" onClick={lessonSpeaking ? stopLessonSpeech : readFullLesson}>
                  {lessonSpeaking ? <Square size={16} /> : <Volume2 size={18} />}
                  {lessonSpeaking ? "Stop narration" : "Read lesson aloud"}
                </button>
              </div>
            </div>
            <ol className="titration-lesson-list">
              {TITRATION_LESSON.map((section, index) => (
                <li className="titration-lesson-item" key={section.media}>
                  <div className="lesson-step-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="lesson-media">
                    {section.type === "video" ? (
                      <video src={`/learning/titration/${section.media}`} controls playsInline preload="metadata" aria-label={section.alt} />
                    ) : (
                      <img src={`/learning/titration/${section.media}`} alt={section.alt} loading="lazy" />
                    )}
                  </div>
                  <div className="lesson-copy">
                    <h3>{section.title.replace(/^\d+\.\s*/, "")}</h3>
                    <p className="lesson-visual-cue"><strong>Look at the visual:</strong> {section.visualCue}</p>
                    {section.lines.map((line) => (
                      <div className="lesson-explanation-line" key={line}>
                        <p>{line}</p>
                        <button type="button" className="lesson-line-speak" onClick={() => speakLessonLine(line)} aria-label={`Read aloud: ${line}`} title="Read this line aloud">
                          <Volume2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            {!(("speechSynthesis" in window)) && <p className="lesson-audio-note">Audio narration is not available in this browser. You can still read each explanation and play the clips.</p>}
          </section>}

          <div className="teacher-intro">

            <div className="teacher-avatar"><Sparkles size={26} /></div>

            <div>

              <span className="lab-eyebrow">DR. NOVA / VIRTUAL SCIENCE TEACHER</span>

              <h2>Ready to enter the lab?</h2>

              <p>

                I will guide you through the setup. Review each instruction

                before continuing.

              </p>

            </div>

          </div>

          <button className="lab-primary-button" onClick={() => setStage("mode")}>

            Continue to lab mode <Play size={17} />

          </button>

        </section>

      )}



      {stage === "mode" && (

        <section className="lab-stage lab-glass-panel">

          <span className="lab-eyebrow">STEP 02 / YOUR SESSION</span>

          <h1>How do you want to learn?</h1>

          <div className="mode-grid">

            <button

              className={`mode-card ${mode === "guided" ? "mode-selected" : ""}`}

              onClick={() => setMode("guided")}

            >

              <Sparkles size={28} />

              <h2>Guided Mode</h2>

              <p>Follow instructions one step at a time.</p>

            </button>

            <button

              className={`mode-card ${mode === "self" ? "mode-selected" : ""}`}

              onClick={() => setMode("self")}

            >

              <Hand size={28} />

              <h2>Self-Select Mode</h2>

              <p>Choose available equipment yourself.</p>

            </button>

          </div>

          <button className="lab-primary-button" onClick={() => {
            setSelectedItems([EQUIPMENT.find((item) => item.id === "flask"), CHEMICALS.find((item) => item.id === "water")]);
            setMistakes(0);
            setHintsUsed(0);
            setValidationMessage("");
            setStage("lab");
          }}>

            Start virtual lab <Play size={17} />

          </button>

        </section>

      )}



      {stage === "lab" && (

        <section className="lab-workspace lab-live-workspace">

          <div className="lab-workspace-heading lab-glass-panel">

            <div className="lab-heading-copy">

              <span className="lab-eyebrow">

                {mode === "guided" ? "GUIDED SESSION" : "SELF-SELECT SESSION"}

              </span>

              <h1>{activeTopic.title}</h1>

              <p>

                {mode === "guided"

                  ? `Step ${currentStepIndex + 1}: ${currentExperimentStep.instruction}`

                  : "Choose the equipment and chemicals needed for this experiment."}

              </p>

            </div>

           
<div className="lab-heading-controls">
  <div className="lab-heading-actions">
    <button className="lab-secondary-button" onClick={resetLab}>
      <RotateCcw size={15} /> Reset
    </button>

    <button className="lab-secondary-button" onClick={changeExperiment}>
      <ArrowLeft size={15} /> Change Experiment
    </button>
  </div>

  <div className="hand-gesture-text">
    <span>LEFT: {leftGesture || "NO HAND"}</span>
    <span>RIGHT: {rightGesture || "NO HAND"}</span>
  </div>
</div>

            



          </div>



          <div className="lab-layout lab-live-layout">

            <div className="lab-visual lab-live-visual">

              <div className="lab-camera-status lab-workspace-status">

                <span className="lab-live-dot" /> {cameraStatus}

              </div>



              {true ? (

                
<Canvas
  camera={{ position: [0, 1.2, 4.2], fov: 38 }}
  gl={{ antialias: true, alpha: true }}
  dpr={[1, 1]}
>
  <LabObjects
  key={labSceneRevision}
  items={sceneItems}
  handPositionsRef={handPositionsRef}
  onTransfer={handleTransfer}
  manualPourToken={assistedPourToken}
  titrationState={experimentState}
/>
</Canvas>


              ) : (

                <div className="lab-empty-state">

                  <FlaskConical size={42} />

                  <h2>Your virtual work area</h2>

                  <p>Select an item from the drawer to place it here.</p>

                </div>

              )}



              <div className="lab-visual-help">

                <Camera size={15} />

                {cameraStatus.startsWith("Camera error")
                  ? "Camera unavailable · Mouse: drag equipment, double-click bottles to pour, click stopcock to dispense."
                  : <>Camera active · Right hand: {rightGesture}{" · "}Left hand: {leftGesture}</>}

              </div>

            </div>
            
<div className="lab-current-step" role="status" aria-live="polite">
  <span>STEP {currentStepIndex + 1}/{experimentSteps.length}</span> — {currentExperimentStep.title.toUpperCase()}
  <small>{currentExperimentStep.instruction}</small>
  {!currentExperimentStep.done && <small className="lab-step-blocked">{currentExperimentStep.blocked}</small>}
</div>

<aside className="nova-panel" aria-label="Dr. Nova virtual teacher">
  <div className="nova-message"><span className="teacher-avatar"><Sparkles size={18} /></span><div><strong>Dr. Nova</strong><p>{teacherLine}</p></div></div>
  <button type="button" className="nova-doubt-toggle" onClick={() => setDoubtOpen((open) => !open)} aria-expanded={doubtOpen} aria-label={doubtOpen ? "Close Ask Dr. Nova" : "Ask Dr. Nova"}>
    {doubtOpen ? <X size={17} /> : <Plus size={17} />} <span>{doubtOpen ? "Close" : "Ask a doubt"}</span>
  </button>
  {doubtOpen && <form className="nova-doubt-form" onSubmit={askTeacher}>
    <label htmlFor="nova-question">Ask about this experiment</label>
    <textarea id="nova-question" value={doubtQuestion} onChange={(event) => setDoubtQuestion(event.target.value)} rows={3} maxLength={1000} placeholder="Why does phenolphthalein turn pink?" />
    <div className="nova-doubt-actions">
      <label className="nova-upload"><Paperclip size={15} /> {doubtImage ? doubtImage.name : "Attach file"}<input type="file" accept=".pdf,.doc,.docx,.pptx,.txt,.md,.html,.json,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/html,application/json,image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size > 20 * 1024 * 1024) { setDoubtError("Files must be 20 MB or smaller."); setDoubtImage(null); event.target.value = ""; } else { setDoubtError(""); setDoubtImage(file || null); } }} /></label>
      <button type="submit" disabled={doubtBusy || !doubtQuestion.trim()}><Send size={14} /> {doubtBusy ? "Thinking…" : "Ask"}</button>
    </div>
    {doubtImage && <small className="nova-image-note">PDF, Word and text documents are read locally with BGE-M3 + Phi-4. This text model cannot read image files or scanned-only pages.</small>}
    {doubtError && <p className="nova-error" role="alert">{doubtError}</p>}
    {doubtAnswer && <p className="nova-answer" role="status">{doubtAnswer}</p>}
  </form>}
</aside>

{currentStepIndex === 1 && !experimentState.endpoint && <button type="button" className="guided-pour-button" onClick={finishGuidedTitration}>Finish &amp; show pink result</button>}

<div className="drawer-toggle-controls">
  <button
    type="button"
    className={`drawer-icon-button ${showEquipment ? "active" : ""}`}
    onClick={() => setShowEquipment((prev) => !prev)}
    title={showEquipment ? "Hide instruments" : "Show instruments"}
    aria-label={showEquipment ? "Hide instruments" : "Show instruments"}
  >
    <Beaker size={17} />
  </button>

  <button
    type="button"
    className={`drawer-icon-button ${showChemicals ? "active" : ""}`}
    onClick={() => setShowChemicals((prev) => !prev)}
    title={showChemicals ? "Hide chemicals" : "Show chemicals"}
    aria-label={showChemicals ? "Hide chemicals" : "Show chemicals"}
  >
    <Droplets size={17} />
  </button>
</div>
          

{/* LEFT DRAWER — INSTRUMENTS */}
{showEquipment && (
  <aside className="equipment-sidebar lab-glass-panel equipment-sidebar-left">
  <div className="drawer-title">INSTRUMENTS</div>
  <h2>Lab Equipment</h2>
  <p>Choose the tools required for your experiment.</p>

  {EQUIPMENT.map((item) => {
    const added = selectedItems.some(
      (selected) => selected.id === item.id
    );

    return (
      <button
        type="button"
        className={`equipment-option ${added ? "equipment-added" : ""} ${hoveredOption?.endsWith(`:${item.id}`) ? "equipment-hand-hover" : ""}`}
        data-item-id={item.id}
        key={item.id}
        onClick={() => toggleItem(item)}
      >
        <span>{item.name}</span>
        {added ? <Check size={17} /> : <Plus size={17} />}
      </button>
    );
  })}
</aside>
)}
{/* RIGHT DRAWER — CHEMICALS */}
{showChemicals && (
  <aside className="equipment-sidebar lab-glass-panel equipment-sidebar-right">
  <div className="drawer-title">CHEMICAL INVENTORY</div>
  <h2>Chemicals</h2>
  <p>Verified names, formulas and solution appearances.</p>

  {CHEMICALS.map((item) => {
    const added = selectedItems.some(
      (selected) => selected.id === item.id
    );

    return (
      <button
        type="button"
        className={`equipment-option ${added ? "equipment-added" : ""} ${hoveredOption?.endsWith(`:${item.id}`) ? "equipment-hand-hover" : ""}`}
        data-item-id={item.id}
        key={item.id}
        onClick={() => toggleItem(item)}
      >
        <span className="chemical-option-copy">
          <strong>{item.name}</strong>
          <small>{item.formula}</small>
          <small>{item.appearance}</small>
          <span
            className="chemical-swatch"
            style={{ backgroundColor: item.liquidColor }}
          />
        </span>

        {added ? <Check size={17} /> : <Plus size={17} />}
      </button>
    );
  })}
</aside>
)}

{/* RIGHT DRAWER — CHEMICALS
<aside className="equipment-sidebar lab-glass-panel equipment-sidebar-right">
  <div className="drawer-title">CHEMICAL INVENTORY</div>
  <h2>Chemicals</h2>
  <p>Verified names, formulas and solution appearances.</p>

  {CHEMICALS.map((item) => {
    const added = selectedItems.some(
      (selected) => selected.id === item.id
    );

    return (
      <button
        className={`equipment-option ${added ? "equipment-added" : ""} ${hoveredOption?.endsWith(`:${item.id}`) ? "equipment-hand-hover" : ""}`}
        data-item-id={item.id}
        key={item.id}
        onClick={() => toggleItem(item)}
      >
        <span className="chemical-option-copy">
          <strong>{item.name}</strong>
          <small>{item.formula}</small>
          <small>{item.appearance}</small>
          <span
            className="chemical-swatch"
            style={{ backgroundColor: item.liquidColor }}
          />
        </span>
        {added ? <Check size={17} /> : <Plus size={17} />}
      </button>
    );
  })}
</aside> */}

{experimentState.endpoint && (
  <section className="titration-result-card lab-glass-panel" aria-live="polite">
    <div className="drawer-title">TITRATION COMPLETE</div>
    <h2>Faint pink endpoint reached</h2>
    <p>HCl + NaOH → NaCl + H₂O</p>
    <dl>
      <div><dt>Final pH</dt><dd>{experimentState.pH.toFixed(2)}</dd></div>
      <div><dt>HCl in flask</dt><dd>{experimentState.acidMl.toFixed(2)} mL</dd></div>
      <div><dt>NaOH delivered</dt><dd>{experimentState.baseMl.toFixed(2)} mL</dd></div>
      <div><dt>Steps completed</dt><dd>8 / 8</dd></div>
      <div><dt>Incorrect actions</dt><dd>{mistakes}</dd></div>
      <div><dt>Hints used</dt><dd>{hintsUsed}</dd></div>
    </dl>
    <p className="titration-conclusion">The indicator changed from colourless to pale pink as the solution reached the phenolphthalein endpoint.</p>
    <div className="result-actions">
      <button type="button" onClick={() => { setStage("explanation"); window.speechSynthesis?.cancel?.(); }}>Review experiment</button>
      <button type="button" onClick={() => { window.speechSynthesis?.cancel?.(); resetExperimentState(); setStage("lab"); }}>Restart experiment</button>
      <button type="button" onClick={() => { window.speechSynthesis?.cancel?.(); changeExperiment(); }}>Choose another experiment</button>
    </div>
  </section>
)}


          </div>

        </section>

      )}

    </main>

  );

}
