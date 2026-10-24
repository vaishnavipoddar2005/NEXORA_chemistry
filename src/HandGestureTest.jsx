
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

export default function HandGestureTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState("Camera not started");
  const [hands, setHands] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  async function startCamera() {
    try {
      setError("");
      setStatus("Starting camera...");
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access requires localhost or HTTPS.");
      }

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraOn(true);
      setStatus("Show your hands to the camera");
      detectHands();
    } catch (err) {
      setStatus("Camera or tracking failed");
      setError(err.message || "Unable to start hand tracking.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    }
  }

  function detectHands() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    const ctx = canvas.getContext("2d");

    function frame() {
      if (!videoRef.current || !landmarkerRef.current) return;

      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const result = landmarker.detectForVideo(video, performance.now());
        const detected = [];

        (result.landmarks || []).forEach((points, index) => {
          const handedness = result.handedness?.[index]?.[0]?.categoryName;
          const label = handedness || `Hand ${index + 1}`;

          const thumb = points[4];
          const indexTip = points[8];
          const middleTip = points[12];
          const wrist = points[0];
          const middleBase = points[9];

          const distance = (a, b) =>
            Math.hypot(a.x - b.x, a.y - b.y);

          const pinchDistance = distance(thumb, indexTip);
          const palmSize = distance(wrist, middleBase) || 0.001;
          const isPinching = pinchDistance / palmSize < 0.35;

          // Basic pinch/open/release demonstration.
          const gesture = isPinching ? "PINCH" : "OPEN / RELEASE";

          detected.push({ label, gesture, points });

          ctx.fillStyle = "#a78bfa";
          points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              3,
              0,
              Math.PI * 2
            );
            ctx.fill();
          });

          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 2;

          for (const [a, b] of [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17],
          ]) {
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
          }
        });

        setHands(detected);
        setStatus(
          detected.length
            ? `${detected.length}/2 hand(s) detected`
            : "Show your hands to the camera"
        );
      }

      animationRef.current = requestAnimationFrame(frame);
    }

    animationRef.current = requestAnimationFrame(frame);
  }

  function stopCamera() {
    cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setCameraOn(false);
    setHands([]);
    setStatus("Camera stopped");
    if (canvasRef.current) {
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  return (
    <main style={styles.page}>
      <h1>Hand Gesture Test</h1>
      <p style={styles.status}>{status}</p>

      <div style={styles.preview}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={styles.video}
        />
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      <div style={styles.controls}>
        {!cameraOn ? (
          <button onClick={startCamera} style={styles.button}>
            Start Hand Tracking
          </button>
        ) : (
          <button onClick={stopCamera} style={styles.button}>
            Stop Camera
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.results}>
        {["Left", "Right"].map((side) => {
          const hand = hands.find(
            (item) => item.label.toLowerCase() === side.toLowerCase()
          );

          return (
            <div key={side} style={styles.card}>
              <strong>{side.toUpperCase()} HAND</strong>
              <p>{hand?.gesture || "NO HAND"}</p>
            </div>
          );
        })}
      </section>

      <p style={styles.note}>
        PINCH = thumb and index finger close together.
        OPEN / RELEASE = fingers are not pinched. This is a basic test,
        not a full open-palm or object-release classifier.
      </p>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    background: "#11111b",
    color: "#f4f0ff",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  status: { color: "#a5b4fc" },
  preview: {
    position: "relative",
    width: "min(640px, 100%)",
    aspectRatio: "4 / 3",
    background: "#242438",
    borderRadius: 12,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    transform: "scaleX(-1)",
    pointerEvents: "none",
  },
  controls: { marginTop: 16 },
  button: {
    padding: "10px 18px",
    border: 0,
    borderRadius: 8,
    background: "#a78bfa",
    color: "#171326",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: { color: "#fca5a5", overflowWrap: "anywhere" },
  results: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  card: {
    minWidth: 140,
    padding: 14,
    border: "1px solid #393750",
    borderRadius: 10,
    background: "#1c1b2d",
  },
  note: {
    maxWidth: 640,
    marginTop: 18,
    color: "#aaa6bd",
    fontSize: 13,
    lineHeight: 1.6,
  },
};
