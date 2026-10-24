
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import "./HandTracking.css";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function distanceBetween(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
    (a.z || 0) - (b.z || 0)
  );
}

function getGesture(points) {
  if (!points || points.length < 21) return "NO HAND";

  const palmSize = distanceBetween(points[0], points[9]) || 0.001;
  const pinchDistance = distanceBetween(points[4], points[8]);
  if (pinchDistance / palmSize < 0.30) return "PINCH";

  const indexExtended = distanceBetween(points[8], points[5]) >
    distanceBetween(points[6], points[5]) * 1.12;
  const middleFolded = distanceBetween(points[12], points[0]) <
    distanceBetween(points[9], points[0]) * 1.02;
  const ringFolded = distanceBetween(points[16], points[0]) <
    distanceBetween(points[13], points[0]) * 1.02;
  const pinkyFolded = distanceBetween(points[20], points[0]) <
    distanceBetween(points[17], points[0]) * 1.02;
  if (indexExtended && middleFolded && ringFolded && pinkyFolded) return "POINT";

  return "OPEN";
}

const emptyHand = {
  gesture: "NO HAND",
  x: null,
  y: null,
};

export default function HandTracking() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Starting camera...");
  const [handsFound, setHandsFound] = useState(0);
  const [leftHand, setLeftHand] = useState(emptyHand);
  const [rightHand, setRightHand] = useState(emptyHand);

  useEffect(() => {
    let stream;
    let landmarker;
    let animationId;
    let active = true;
    let lastVideoTime = -1;
    let lastInferenceAt = 0;
    let lastStatus = "";
    let lastCount = -1;
    let lastGestures = { Left: "", Right: "" };
    let lastPositions = { Left: "", Right: "" };
    const smoothedPositions = { Left: null, Right: null };

    async function startTracking() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera unavailable. Open using localhost.");
        }

        setStatus("Requesting camera permission...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        setStatus("Loading hand tracking...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        if (!active) return;

        const trackerOptions = {
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
          landmarker = await HandLandmarker.createFromOptions(vision, trackerOptions);
        } catch (gpuError) {
          console.warn("NEXORA: GPU tracker unavailable; retrying with CPU.", gpuError);
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...trackerOptions,
            baseOptions: { ...trackerOptions.baseOptions, delegate: "CPU" },
          });
        }

        if (!active) {
          landmarker.close();
          return;
        }

        setStatus("Show both hands to the camera");

        function track() {
          if (!active) return;

          const currentVideo = videoRef.current;
          const canvas = canvasRef.current;

          if (
            !currentVideo ||
            !canvas ||
            currentVideo.readyState < 2 ||
            !currentVideo.videoWidth
          ) {
            animationId = requestAnimationFrame(track);
            return;
          }

          if (
            canvas.width !== currentVideo.videoWidth ||
            canvas.height !== currentVideo.videoHeight
          ) {
            canvas.width = currentVideo.videoWidth;
            canvas.height = currentVideo.videoHeight;
          }

          if (currentVideo.currentTime !== lastVideoTime) {
            const inferenceNow = performance.now();
            if (inferenceNow - lastInferenceAt < 33) {
              animationId = requestAnimationFrame(track);
              return;
            }
            lastInferenceAt = inferenceNow;
            lastVideoTime = currentVideo.currentTime;

            const result = landmarker.detectForVideo(
              currentVideo,
              inferenceNow
            );

            const ctx = canvas.getContext("2d");
            const hands = result.landmarks || [];
            const handedness = result.handedness || [];

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const nextHands = {
              Left: { ...emptyHand },
              Right: { ...emptyHand },
            };

            hands.forEach((points, index) => {
              const category = handedness[index]?.[0]?.categoryName;
              const confidence = handedness[index]?.[0]?.score ?? 1;
              if (confidence < 0.45) return;

              // The video is mirrored visually using CSS, not before detection.
              // Swap MediaPipe labels to match the user's anatomical hands.
             const handName =
  category === "Left"
    ? "Left"
    : category === "Right"
    ? "Right"
    : null;

              if (!handName) return;

              const gesture = getGesture(points);

              const rawX = (1 - points[8].x) * 100;
              const rawY = points[8].y * 100;
              const previousPosition = smoothedPositions[handName];
              const smooth = previousPosition
                ? { x: previousPosition.x + (rawX - previousPosition.x) * 0.28,
                    y: previousPosition.y + (rawY - previousPosition.y) * 0.28 }
                : { x: rawX, y: rawY };
              smoothedPositions[handName] = smooth;
              nextHands[handName] = {
                gesture,
                x: Math.round(smooth.x),
                y: Math.round(smooth.y),
              };

              // Draw hand skeleton.
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.strokeStyle =
                handName === "Left" ? "#A78BFA" : "#36D6C5";
              ctx.lineWidth = Math.max(3, canvas.width / 400);

              CONNECTIONS.forEach(([a, b]) => {
                ctx.beginPath();
                ctx.moveTo(
                  points[a].x * canvas.width,
                  points[a].y * canvas.height
                );
                ctx.lineTo(
                  points[b].x * canvas.width,
                  points[b].y * canvas.height
                );
                ctx.stroke();
              });

              points.forEach((point) => {
                ctx.beginPath();
                ctx.arc(
                  point.x * canvas.width,
                  point.y * canvas.height,
                  Math.max(4, canvas.width / 250),
                  0,
                  Math.PI * 2
                );
                ctx.fillStyle = "#FFFFFF";
                ctx.fill();
              });

              // Highlight thumb and index fingertips.
              [4, 8].forEach((pointIndex) => {
                const point = points[pointIndex];
                ctx.beginPath();
                ctx.arc(
                  point.x * canvas.width,
                  point.y * canvas.height,
                  Math.max(7, canvas.width / 180),
                  0,
                  Math.PI * 2
                );
                ctx.fillStyle =
                  gesture === "PINCH" ? "#FFD166" : "#FFFFFF";
                ctx.fill();
              });
            });

            const detectedCount = Object.values(nextHands).filter((hand) => hand.x !== null).length;
            if (detectedCount !== lastCount) {
              lastCount = detectedCount;
              setHandsFound(detectedCount);
            }

            const newStatus = detectedCount === 2
              ? "Both hands detected!"
              : detectedCount === 1
                ? "One hand detected"
                : "Show your hands to the camera";

            if (newStatus !== lastStatus) {
              lastStatus = newStatus;
              setStatus(newStatus);
            }

            // Update each hand independently, without re-rendering every frame.
            ["Left", "Right"].forEach((name) => {
              const data = nextHands[name];
              const setHand = name === "Left" ? setLeftHand : setRightHand;

              if (data.gesture !== lastGestures[name]) {
                lastGestures[name] = data.gesture;
                setHand((previous) => ({
                  ...previous,
                  gesture: data.gesture,
                }));
              }

              const positionKey = `${data.x},${data.y}`;

              if (
                data.x !== null &&
                positionKey !== lastPositions[name]
              ) {
                lastPositions[name] = positionKey;
                setHand((previous) => ({
                  ...previous,
                  x: data.x,
                  y: data.y,
                }));
              }

              if (data.x === null && lastPositions[name] !== "missing") {
                lastPositions[name] = "missing";
                smoothedPositions[name] = null;
                setHand({ ...emptyHand });
              }
            });
          }

          animationId = requestAnimationFrame(track);
        }

        track();
      } catch (error) {
        console.error("Hand tracking error:", error);
        setStatus("Error: " + error.message);
      }
    }

    startTracking();

    return () => {
      active = false;
      cancelAnimationFrame(animationId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (landmarker) landmarker.close();
    };
  }, []);

  function HandCard({ title, hand }) {
    const isPinching = hand.gesture === "PINCH";

    return (
      <div className={`hand-card ${isPinching ? "hand-card-pinching" : ""}`}>
        <div className="hand-card-top">
          <span className="hand-card-icon">
            {title === "LEFT HAND" ? "🤚" : "✋"}
          </span>
          <span className="hand-card-title">{title}</span>
          <span
            className={`hand-indicator ${
              hand.gesture === "NO HAND" ? "hand-indicator-off" : ""
            }`}
          />
        </div>

        <div className="hand-gesture">{hand.gesture}</div>

        <div className="hand-card-position">
          {hand.x === null
            ? "Position: Not detected"
            : `Position: X ${hand.x}% · Y ${hand.y}%`}
        </div>

        <div className="hand-card-help">
          {isPinching
            ? "Pinch detected"
            : hand.gesture === "POINT"
            ? "Index-point gesture"
            : hand.gesture === "OPEN"
            ? "Fingers separated"
            : "Show this hand to camera"}
        </div>
      </div>
    );
  }

  return (
    <main className="tracking-page">
      <video
        ref={videoRef}
        className="tracking-video"
        autoPlay
        muted
        playsInline
      />

      <canvas ref={canvasRef} className="tracking-canvas" />

      <header className="tracking-header">
        <div className="tracking-title">
          <div className="tracking-brand">NEXORA</div>
          <h1>Dual Hand Tracking</h1>
          <p>Each hand has its own gesture and position.</p>
        </div>

        <div className="tracking-status">
          <span className="tracking-status-dot" />
          <span>{status}</span>
          <strong>Hands: {handsFound}/2</strong>
        </div>
      </header>

      <section className="hands-dashboard">
        <HandCard title="LEFT HAND" hand={leftHand} />
        <HandCard title="RIGHT HAND" hand={rightHand} />
      </section>

      <footer className="tracking-footer">
        <span>CAMERA ACTIVE</span>
        <span>DUAL HAND GESTURES</span>
        <span>NEXORA · TEST MODE</span>
      </footer>
    </main>
  );
}
