import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

/**
 * NEXORA instrument models.
 * Kept separate from Lab.jsx so 3D equipment can be tuned without
 * changing the lab UI, drawers, webcam, or hand tracking.
 */

const glassMaterial = {
  color: "#e7f7ff",
  transparent: true,
  opacity: 0.31,
  roughness: 0.12,
  metalness: 0,
  side: THREE.DoubleSide,
  depthWrite: false,
};

const rimMaterial = {
  color: "#e7f7ff",
  transparent: true,
  opacity: 0.78,
  roughness: 0.12,
  metalness: 0,
  side: THREE.DoubleSide,
};

const markingMaterial = {
  color: "#ffffff",
  depthTest: false,
  toneMapped: false,
};

/** Add a short graduation that follows the curved front of a cylinder. */
function CurvedTick({ radius, y, width, thickness = 0.0025, segments = 10, keyPrefix = "tick" }) {
  return (
    <group>
      {Array.from({ length: segments }, (_, index) => {
        const segmentWidth = width / segments;
        const x = -width / 2 + (index + 0.5) * segmentWidth;
        const z = Math.sqrt(Math.max(0, radius * radius - x * x)) + 0.0018;

        return (
          <mesh
            key={`${keyPrefix}-${index}`}
            position={[x, y, z]}
          >
            <boxGeometry args={[segmentWidth + 0.0008, thickness, 0.0015]} />
            <meshBasicMaterial {...markingMaterial} />
          </mesh>
        );
      })}
    </group>
  );
}

function TestTube({ liquidColor = "#d9f3ff" }) {
  const radius = 0.052;
  const totalHeight = 0.52;
  const topY = totalHeight / 2;
  const wallBottomY = -totalHeight / 2 + radius;
  const mouthSlant = 0.018; // Only the mouth is angled; the tube body stays upright.

  // Build the cylindrical wall with a slanted top edge.
  const wallGeometry = (() => {
    const segments = 64;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const slantedTopY = topY + mouthSlant * Math.cos(angle);

      positions.push(x, wallBottomY, z);
      positions.push(x, slantedTopY, z);
    }

    for (let i = 0; i < segments; i++) {
      const bottomA = i * 2;
      const topA = bottomA + 1;
      const bottomB = (i + 1) * 2;
      const topB = bottomB + 1;

      indices.push(bottomA, bottomB, topA);
      indices.push(topA, bottomB, topB);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  })();

  // A single thin lip follows the same slanted opening edge.
  const rimGeometry = (() => {
    const points = [];
    const segments = 64;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          (radius - 0.0015) * Math.cos(angle),
          topY + mouthSlant * Math.cos(angle),
          (radius - 0.0015) * Math.sin(angle)
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return new THREE.TubeGeometry(curve, segments, 0.0018, 8, true);
  })();

  return (
    <group>
      {/* Upright transparent body; only the top opening is slanted */}
      <mesh geometry={wallGeometry}>
        <meshPhysicalMaterial {...glassMaterial} side={THREE.DoubleSide} />
      </mesh>

      {/* Smooth rounded, closed bottom */}
      <mesh position={[0, wallBottomY, 0]}>
        <sphereGeometry
          args={[radius, 48, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
        />
        <meshPhysicalMaterial
          color="#e7f7ff"
          transparent
          opacity={0.28}
          roughness={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* One slanted opening lip — no extra concentric circle */}
      <mesh geometry={rimGeometry}>
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>

      {/* Measurement graduations on the front of the tube */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = -0.105 + i * 0.035;
        const major = (i + 1) % 2 === 0;

        return (
          <CurvedTick
            key={`tube-mark-${i}`}
            keyPrefix={`tube-mark-${i}`}
            radius={radius + 0.001}
            y={y}
            width={major ? 0.055 : 0.035}
            thickness={0.002}
            segments={8}
          />
        );
      })}
    </group>
  );
}

function Beaker({ liquidColor = "#d9f3ff" }) {
  const radius = 0.22;
  const height = 0.52;
  const thickness = 0.012;

  // Cross-section makes an open glass vessel with a visible lip.
  const profile = [
    new THREE.Vector2(0, -height / 2),
    new THREE.Vector2(radius - thickness, -height / 2),
    new THREE.Vector2(radius, -height / 2 + thickness),
    new THREE.Vector2(radius, height / 2 - 0.015),
    new THREE.Vector2(radius + 0.012, height / 2),
    new THREE.Vector2(radius + 0.006, height / 2 + 0.008),
    new THREE.Vector2(radius - 0.006, height / 2 + 0.008),
    new THREE.Vector2(radius - thickness, height / 2 - 0.015),
    new THREE.Vector2(radius - thickness, -height / 2 + 0.025),
    new THREE.Vector2(0, -height / 2 + 0.025),
  ];

  return (
    <group>
      {/* Glass body */}
      <mesh>
        <latheGeometry args={[profile, 96]} />
        <meshPhysicalMaterial
          color="#e8f7ff"
          transparent
          opacity={0.22}
          roughness={0.12}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Pouring spout */}
      <mesh
        position={[radius - 0.005, height / 2 + 0.002, 0]}
        rotation={[0, 0, -0.35]}
      >
        <coneGeometry args={[0.018, 0.045, 24]} />
        <meshPhysicalMaterial
          color="#e8f7ff"
          transparent
          opacity={0.3}
          roughness={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Graduation marks follow the curved front of the beaker */}
      {Array.from({ length: 10 }, (_, i) => {
        const y = -0.19 + i * 0.04;
        const major = (i + 1) % 2 === 0;
        return (
          <CurvedTick
            key={`beaker-mark-${i}`}
            keyPrefix={`beaker-mark-${i}`}
            radius={radius + 0.001}
            y={y}
            width={major ? 0.105 : 0.065}
            thickness={0.003}
            segments={14}
          />
        );
      })}
    </group>
  );
}

function MeasuringCylinder() {
  const radius = 0.065;
  const height = 0.76;
  const wallCenterY = 0.08;
  const topY = wallCenterY + height / 2;

  return (
    <group>
      {/* Tall, narrow, open glass tube */}
      <mesh position={[0, wallCenterY, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshPhysicalMaterial {...glassMaterial} />
      </mesh>

      {/* One thin opening rim only — remove the extra inner circle */}
      <mesh position={[0, topY, 0]}>
        <torusGeometry args={[radius - 0.001, 0.0022, 8, 64]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>

      {/* Proportionate base, positioned to meet the bottom of the glass tube */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.105, 0.115, 0.05, 48]} />
        <meshStandardMaterial color="#dceff7" roughness={0.22} />
      </mesh>

      {/* Front-facing graduation marks: long every fifth line, short between */}
      {Array.from({ length: 20 }, (_, i) => {
        const y = -0.265 + i * 0.032;
        const major = (i + 1) % 5 === 0;
        const medium = !major && (i + 1) % 2 === 0;
        const width = major ? 0.082 : medium ? 0.055 : 0.032;

        return (
          <CurvedTick
            key={`cylinder-mark-${i}`}
            keyPrefix={`cylinder-mark-${i}`}
            radius={radius + 0.001}
            y={y}
            width={width}
            thickness={0.0025}
            segments={8}
          />
        );
      })}
    </group>
  );
}

function ChemicalBottle({ item, pouring = false, volumeMl = 100, volumeStateRef, onMousePourToggle }) {
  const liquidColor = item.liquidColor || "#d9f3ff";
  const isWater = item.id === "water";
  const bottleName = item.label || item.name || item.id;
  const liquidRef = useRef(null);
  const displayedVolumeRef = useRef(volumeMl);
  useFrame((_, delta) => {
    const currentMl = volumeStateRef?.current.get(item.id) ?? volumeMl;
    const targetRatio = clamp(currentMl / 100, 0, 1);
    displayedVolumeRef.current = THREE.MathUtils.damp(displayedVolumeRef.current, targetRatio, 11, delta);
    const ratio = displayedVolumeRef.current;
    if (liquidRef.current) {
      liquidRef.current.scale.y = Math.max(0.001, ratio);
      liquidRef.current.position.y = -0.215 + 0.125 * ratio;
    }
  });

  return (
    <group>
      <Html position={[0, -0.025, 0.126]} center pointerEvents="none" style={{ pointerEvents: "none" }}>
        <div style={{
          width: 56, padding: "2px 3px", border: "1px solid #8da0b3", borderRadius: 2,
          background: "rgba(248,250,252,.96)", color: "#0f172a", textAlign: "center",
          fontFamily: "Arial, sans-serif", lineHeight: 1.05, boxShadow: "0 1px 3px #0f172a33",
          pointerEvents: "none", whiteSpace: "normal", boxSizing: "border-box",
        }}>
          <div style={{ fontSize: 7, fontWeight: 700 }}>{bottleName}</div>
          {item.formula && <div style={{ marginTop: 1, fontSize: 6, fontWeight: 600 }}>{item.formula}</div>}
        </div>
      </Html>
      {/* Bottle body */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.105, 0.12, 0.43, 48, 1, true]} />
        <meshPhysicalMaterial {...glassMaterial} />
      </mesh>

      {/* Shoulder and neck */}
      <mesh position={[0, 0.205, 0]}>
        <cylinderGeometry args={[0.055, 0.105, 0.10, 48]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
      <mesh position={[0, 0.285, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.12, 40, 1, true]} />
        <meshPhysicalMaterial {...glassMaterial} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.052, 0.006, 8, 40]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>

      {/* Liquid */}
      <mesh
        ref={liquidRef}
        position={[0, -0.215 + 0.125 * Math.max(0, Math.min(1, volumeMl / 100)), 0]}
        scale={[1, Math.max(0.001, Math.min(1, volumeMl / 100)), 1]}
      >
        <cylinderGeometry args={[0.095, 0.105, 0.25, 40]} />
        <meshPhysicalMaterial
          color={liquidColor}
          transparent
          opacity={isWater ? 0.92 : 0.78}
          roughness={0.16}
          depthWrite={false}
          emissive={isWater ? "#0879bd" : "#000000"}
          emissiveIntensity={isWater ? 0.22 : 0}
          clearcoat={0.8}
        />
      </mesh>

      {/* Cap is hidden during a pour so the stream has a visible opening. */}
      {!pouring && (
        <>
          <mesh position={[0, 0.39, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.065, 40]} />
            <meshStandardMaterial color="#b9c8d8" roughness={0.32} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh
              key={`cap-ridge-${i}`}
              position={[
                Math.cos((i * Math.PI * 2) / 12) * 0.064,
                0.39,
                Math.sin((i * Math.PI * 2) / 12) * 0.064,
              ]}
            >
              <boxGeometry args={[0.004, 0.04, 0.004]} />
              <meshStandardMaterial color="#e3edf5" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function Dropper() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.02, 0.007, 0.62, 24]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.045, 24, 16]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.33, 0]}>
        <coneGeometry args={[0.01, 0.08, 20]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
    </group>
  );
}

function StirringRod() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 20]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.012, 16, 12]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <sphereGeometry args={[0.012, 16, 12]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
    </group>
  );
}

function DigitalBalance() {
  return (
    <group>
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

function Spatula() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.009, 0.009, 0.48, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.025, 20, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.65} />
      </mesh>
    </group>
  );
}

function WeighingBoat() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.13, 0.09, 0.035, 48, 1, true]} />
        <meshStandardMaterial
          color="#e5e7eb"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.018, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.008, 48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
    </group>
  );
}



function ConicalFlask({
  liquidColor = "#e7b6d0",
  volumeMl = 0,
  isMixing = false,
  isEndpoint = false,
}) {
  const liquidRef = useRef(null);
  const displayedFillRef = useRef(0);
  const rippleRef = useRef(null);
  const bubblesRef = useRef(null);
  const liquidGeometry = useMemo(() => {
    // Match the flask's real interior: broad at the base, narrowing toward
    // the shoulder. The previous mesh used the cylinder's radii backwards,
    // so its upper surface could protrude through the conical glass wall.
    const geometry = new THREE.CylinderGeometry(1, 1, 1, 48, 24, false);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const heightRatio = positions.getY(index) + 0.5;
      const innerTaper = 1 - 0.74 * heightRatio;
      positions.setX(index, positions.getX(index) * innerTaper);
      positions.setZ(index, positions.getZ(index) * innerTaper);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useFrame((state, delta) => {
    if (!liquidRef.current) return;
    const targetFill = clamp(volumeMl / 250, 0, 1);
    displayedFillRef.current = THREE.MathUtils.damp(displayedFillRef.current, targetFill, 10, delta);
    const fill = displayedFillRef.current;
    const fillShape = Math.cbrt(fill);
    const height = 0.34 * fillShape;
    const radius = 0.17;
    const surfaceRadius = radius * (1 - 0.74 * fillShape);
    liquidRef.current.visible = fill > 0.0001;
    liquidRef.current.scale.set(radius, Math.max(0.001, height), radius);
    liquidRef.current.position.y = -0.23 + height / 2;
    liquidRef.current.material.color.set(isEndpoint ? "#ff3f91" : liquidColor);
    liquidRef.current.material.emissive?.set(isEndpoint ? "#c40050" : "#0b4d70");
    liquidRef.current.rotation.y += delta * (isMixing ? 0.55 : 0.12);
    if (rippleRef.current) {
      const wave = 0.94 + Math.sin(state.clock.elapsedTime * 5.2) * 0.05;
      rippleRef.current.visible = fill > 0.015;
      rippleRef.current.position.y = -0.23 + height - 0.003;
      rippleRef.current.scale.set(surfaceRadius * 0.96 * wave, surfaceRadius * 0.96 * wave, 1);
    }
    if (bubblesRef.current) {
      bubblesRef.current.visible = isMixing && fill > 0.015;
      bubblesRef.current.children.forEach((bubble, index) => {
        const phase = (state.clock.elapsedTime * 0.18 + index / 18) % 1;
        const angle = state.clock.elapsedTime * 0.8 + index * 2.399;
        const bubbleRadius = Math.min(surfaceRadius * 0.62, 0.025 + (index % 4) * 0.012);
        bubble.position.set(Math.cos(angle) * bubbleRadius, -0.19 + phase * Math.max(0.02, height * 0.72), Math.sin(angle) * bubbleRadius);
      });
    }
  });

  return (
    <group>
      {/* Darker visible glass flask body */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.055, 0.19, 0.42, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#a8c8d8"
          transparent
          opacity={0.48}
          roughness={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.245, 0]}>
        <cylinderGeometry args={[0.052, 0.055, 0.16, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#b5d5e5"
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mouth rim */}
      <mesh position={[0, 0.325, 0]}>
        <torusGeometry args={[0.053, 0.004, 8, 48]} />
        <meshPhysicalMaterial color="#e7f7ff" />
      </mesh>

      {/* Liquid visibly rises inside the flask */}
      <mesh ref={liquidRef} geometry={liquidGeometry} position={[0, -0.23, 0]} scale={[0.17, 0.001, 0.17]} visible={false} renderOrder={9}>
        <meshPhysicalMaterial
          color={isEndpoint ? "#f4a1c0" : liquidColor}
          emissive={isEndpoint ? "#c40050" : "#0b4d70"}
          emissiveIntensity={isEndpoint ? 0.34 : 0.1}
          transparent
          opacity={0.96}
          roughness={0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Animated surface ripple and gentle mixing bubbles. */}
      <mesh ref={rippleRef} position={[0, -0.23, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={10}>
        <ringGeometry args={[0.74, 0.92, 48]} />
        <meshBasicMaterial color={isEndpoint ? "#ff80b3" : "#c9f4ff"} transparent opacity={0.56} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={bubblesRef} visible={false}>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={`mix-bubble-${i}`}>
            <sphereGeometry args={[i % 3 === 0 ? 0.010 : 0.007, 12, 10]} />
            <meshStandardMaterial color={isEndpoint ? "#ff9ac3" : "#dff8ff"} transparent opacity={0.62} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Graduation marks */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`flask-mark-${i}`}
          position={[0.12, -0.13 + i * 0.045, 0.09]}
        >
          <boxGeometry args={[0.035, 0.003, 0.002]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}


function Burette({ volumeMl = 0, stopcockOpen = false, volumeStateRef }) {
  const liquidRef = useRef(null);
  useFrame(() => {
    const currentMl = volumeStateRef?.current.get("burette") ?? volumeMl;
    const fill = clamp(currentMl / 50, 0, 1);
    const liquidHeight = 0.72 * fill;
    if (liquidRef.current) {
      liquidRef.current.visible = fill > 0;
      liquidRef.current.scale.y = Math.max(0.001, liquidHeight);
      liquidRef.current.position.y = -0.34 + liquidHeight / 2;
    }
  });
  return (
    <group>
      {/* Long graduated glass tube, mounted vertically on the stand. */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.78, 40, 1, true]} />
        <meshPhysicalMaterial {...glassMaterial} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <torusGeometry args={[0.035, 0.003, 8, 40]} />
        <meshPhysicalMaterial {...rimMaterial} />
      </mesh>
      {/* Liquid column rises from the nozzle end as the burette is filled. */}
      <mesh ref={liquidRef} position={[0, -0.34, 0]} scale={[1, 0.001, 1]} visible={volumeMl > 0} renderOrder={6}>
        <cylinderGeometry args={[0.027, 0.027, 1, 32]} />
        <meshBasicMaterial color="#bdefff" transparent opacity={0.78} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => <mesh key={`burette-tick-${i}`} position={[0.036, 0.34 - i * 0.065, 0]}>
        <boxGeometry args={[0.018, 0.0025, 0.002]} /><meshBasicMaterial color="#ffffff" depthTest={false} toneMapped={false} />
      </mesh>)}
      {/* Stopcock body and hand-rotatable lever. */}
      <mesh position={[0.055, -0.385, 0.01]} userData={{ interactionPart: "burette-stopcock" }}>
        <sphereGeometry args={[0.095, 20, 14]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.385, 0]}>
        <boxGeometry args={[0.085, 0.035, 0.045]} /><meshStandardMaterial color="#64748b" metalness={0.45} />
      </mesh>
      <mesh position={[0.055, -0.385, 0.01]} rotation={[0, 0, stopcockOpen ? 0.8 : 0]} userData={{ interactionPart: "burette-stopcock" }}>
        <boxGeometry args={[0.10, 0.018, 0.022]} /><meshStandardMaterial color={stopcockOpen ? "#34d399" : "#f59e0b"} metalness={0.35} />
      </mesh>
      <mesh position={[0, -0.45, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.014, 0.09, 20]} /><meshPhysicalMaterial color="#dbeafe" transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function ClampStand({ clampOffset = 0, knobHighlighted = false, knobRotation = 0 }) {
  return (
    <group>
      <mesh position={[0, -0.34, 0]}>
        <boxGeometry args={[0.48, 0.055, 0.28]} />
        <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[-0.12, 0.28, 0]}>
        <boxGeometry args={[0.035, 1.18, 0.035]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0.10, 0.47 + clampOffset, 0]}>
        <boxGeometry args={[0.43, 0.035, 0.035]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0.28, 0.38 + clampOffset, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.16, 0.025, 0.025]} />
        <meshStandardMaterial color="#64748b" metalness={0.65} />
      </mesh>
      <mesh position={[0.20, 0.47 + clampOffset, 0.055]} rotation={[0, 0, knobRotation]} userData={{ interactionPart: "clamp-knob" }}>
        <cylinderGeometry args={[0.045, 0.045, 0.035, 24]} />
        <meshStandardMaterial color={knobHighlighted ? "#67e8f9" : "#a78bfa"} metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[0.20, 0.47 + clampOffset, 0.085]} rotation={[0, 0, knobRotation]} userData={{ interactionPart: "clamp-knob" }}>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshStandardMaterial color={knobHighlighted ? "#cffafe" : "#e9d5ff"} metalness={0.35} />
      </mesh>
    </group>
  );
}

export function InstrumentModel({ item, position = [0, 0, 0], pouring = false, volumeMl = 100, volumeStateRef, onMousePourToggle, clampOffset = 0, knobRotation = 0, knobHighlighted = false, stopcockOpen = false, isMixing = false }) {
  return (
    <group position={position}>
      {item.kind === "chemical" ? (
        <ChemicalBottle item={item} pouring={pouring} volumeMl={volumeMl} volumeStateRef={volumeStateRef} onMousePourToggle={onMousePourToggle} />
      ) : item.id === "flask" ? (
        <ConicalFlask liquidColor={item.liquidColor} volumeMl={volumeMl} isEndpoint={item.isEndpoint} isMixing={isMixing} />
      ) : item.id === "stand" ? (
        <ClampStand clampOffset={clampOffset} knobRotation={knobRotation} knobHighlighted={knobHighlighted} />
      ) : item.id === "burette" ? (
        <Burette volumeMl={volumeMl} stopcockOpen={stopcockOpen} volumeStateRef={volumeStateRef} />
      ) : item.id === "beaker" ? (
        <Beaker liquidColor={item.liquidColor} />
      ) : item.id === "testtube" ? (
        <TestTube liquidColor={item.liquidColor} />
      ) : item.id === "cylinder" ? (
        <MeasuringCylinder />
      ) : item.id === "dropper" ? (
        <Dropper />
      ) : item.id === "rod" ? (
        <StirringRod />
      ) : item.id === "balance" ? (
        <DigitalBalance />
      ) : item.id === "spatula" ? (
        <Spatula />
      ) : item.id === "weighboat" ? (
        <WeighingBoat />
      ) : (
        <mesh>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#a78bfa" />
        </mesh>
      )}
    </group>
  );
}




// Invisible, forgiving grab targets make thin equipment (pipettes, rods,
// spatulas and test tubes) just as easy to pinch as a beaker.
function getInstrumentGrabSize(id) {
  const sizes = {
    stand: [0.58, 1.42, 0.42],
    burette: [0.18, 1.05, 0.18],
    flask: [0.58, 0.88, 0.58],
    beaker: [0.9, 1.15, 0.9],
    testtube: [0.62, 1.35, 0.62],
    cylinder: [0.72, 1.55, 0.72],
    dropper: [0.72, 1.35, 0.72],
    rod: [0.72, 1.35, 0.72],
    balance: [1.25, 0.72, 1.0],
    spatula: [0.72, 1.35, 0.72],
    weighboat: [1.0, 0.55, 0.9],
    indicator: [0.38, 0.72, 0.42],
    acid: [0.38, 0.72, 0.42],
    base: [0.38, 0.72, 0.42],
    water: [0.38, 0.72, 0.42],
  };
  return sizes[id] ?? [0.9, 1.0, 0.9];
}

const VESSEL_CONFIG = {
  // openingY is the actual mouth height of each model, not the liquid-fill height.
  flask: { capacity: 250, radius: 0.14, openingRadius: 0.052, bottom: -0.23, maxHeight: 0.34, openingY: 0.325 },
  // A small catch tolerance accounts for the narrow neck while still keeping
  // the stream centred inside the burette mouth in the rendered view.
  burette: { capacity: 50, radius: 0.025, openingRadius: 0.06, bottom: -0.45, maxHeight: 0.72, openingY: 0.43 },
  beaker: { capacity: 100, radius: 0.175, openingRadius: 0.175, bottom: -0.235, maxHeight: 0.43, openingY: 0.26 },
  cylinder: { capacity: 50, radius: 0.047, openingRadius: 0.047, bottom: -0.29, maxHeight: 0.68, openingY: 0.55 },
  testtube: { capacity: 20, radius: 0.039, openingRadius: 0.039, bottom: -0.235, maxHeight: 0.43, openingY: 0.275 },
};

const MAX_CHEMICAL_ML = 100;
const DEFAULT_LAB_POSITIONS = {
  flask: [-0.575, -0.82, 0],
  acid: [-0.83, -0.12, 0],
  base: [0.00, 0.32, 0],
  indicator: [-0.17, -0.22, 0],
  water: [0.78, -0.82, 0],
  beaker: [0.08, -0.05, 0],
  cylinder: [0.82, -0.05, 0],
  dropper: [0.08, -0.72, 0],
  rod: [0.82, -0.72, 0],
  testtube: [0.08, -1.2, 0],
  balance: [0.82, -1.2, 0],
  spatula: [0.08, -1.2, 0],
  weighboat: [0.82, -1.2, 0],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isValidChemicalDestination(sourceId, targetId) {
  if (sourceId === "acid" || sourceId === "indicator") return targetId === "flask";
  if (sourceId === "base") return targetId === "burette";
  return true;
}

function getVesselLiquidSurface(root, vesselId, config, volumeMl) {
  const fill = clamp(volumeMl / config.capacity, 0, 1);
  if (vesselId === "flask") {
    return root.localToWorld(new THREE.Vector3(0, config.bottom + config.maxHeight * Math.cbrt(fill), 0));
  }
  const height = config.maxHeight * fill;
  return root.localToWorld(new THREE.Vector3(0, config.bottom + Math.max(height, 0.008), 0));
}

function updatePourStream(stream, start, end, color, opening = null) {
  if (!stream) return;
  stream.visible = true;
  stream.userData.dropletCount = 3;
  const [upper, lower] = stream.children;
  stream.userData.flowPath = [start.clone(), (opening || end).clone(), end.clone()];
  const placeSegment = (mesh, from, to) => {
    if (!mesh) return;
    const direction = to.clone().sub(from);
    const length = direction.length();
    mesh.visible = length > 0.012;
    if (!mesh.visible) return;
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.scale.set(1, length, 1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.material.color.set(color || "#d9f3ff");
  };
  // Route the stream through the real vessel mouth, then down to its liquid
  // surface. A straight chord often clips the flask neck when the bottle is
  // slightly off-centre, making both the stream and transfer disappear.
  if (opening) {
    placeSegment(upper, start, opening);
    placeSegment(lower, opening, end);
  } else {
    placeSegment(upper, start, end);
    if (lower) lower.visible = false;
  }
}

export function LabObjects({ items, handPositions, handPositionsRef, onTransfer, titrationState, manualPourToken = 0 }) {
  const { camera, gl } = useThree();

  // Keep the apparatus anchored: page scrolling must not zoom or shift the 3D camera.
  // Deliberate camera controls can be added separately if needed.


  const objectRefs = useRef(new Map());
  const positionsRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());

  const pointerRefs = useRef({ Left: new THREE.Vector2(), Right: new THREE.Vector2() });
  const targetPointerRefs = useRef({ Left: new THREE.Vector2(), Right: new THREE.Vector2() });
  const grabbedRefs = useRef({ Left: null, Right: null });
  const mouseDragRef = useRef(null);
  const mousePouringIdRef = useRef(null);
  const manualPourActiveRef = useRef(false);
  const mousePourElapsedRef = useRef(0);
  const indicatorDropLatchedRef = useRef(false);
  const indicatorDropHideAtRef = useRef(0);
  const mouseIndicatorDoseLatchedRef = useRef(false);
  const mouseIndicatorDropHideAtRef = useRef(0);
  const lastManualPourTokenRef = useRef(0);
  const hoverRefs = useRef({ Left: null, Right: null });
  const [hoveredObject, setHoveredObject] = React.useState(null);
  const wasPinchingRefs = useRef({ Left: false, Right: false });
  const volumeRef = useRef(new Map());
  const vesselFillRefs = useRef(new Map());
  const streamRef = useRef(null);
  const pouringRef = useRef(null);
    const pourLatchedRef = useRef(false);
const lastPourAtRef = useRef(0);
  const [pouringId, setPouringId] = React.useState(null);
  const clampOffsetRef = useRef(0);
  const [clampOffset, setClampOffset] = React.useState(0);
  const clampRotationRef = useRef(0);
  const [clampRotation, setClampRotation] = React.useState(0);
  const [buretteOpen, setBuretteOpen] = React.useState(false);
  const buretteOpenRef = useRef(false);
  const lastBuretteTransferAtRef = useRef(0);

  function toggleMouseBottlePour(itemId) {
    const root = objectRefs.current.get(itemId);
    if (!root) return;
    if (mousePouringIdRef.current === itemId) {
      mousePouringIdRef.current = null;
      if (itemId === "indicator") mouseIndicatorDoseLatchedRef.current = false;
      root.rotation.z = 0;
      setPouringId(null);
      return;
    }
    if (mousePouringIdRef.current) {
      const previous = objectRefs.current.get(mousePouringIdRef.current);
      if (previous) previous.rotation.z = 0;
    }
    mousePouringIdRef.current = itemId;
    if (itemId === "indicator") mouseIndicatorDoseLatchedRef.current = false;
    root.rotation.z = -0.65;
    setPouringId(itemId);
  }

  // Guided fallback: place the real HCl bottle above the flask and run the same
  // Three.js stream, inventory transfer and flask fill used by pointer pouring.
  React.useEffect(() => {
    if (!manualPourToken || manualPourToken === lastManualPourTokenRef.current) return undefined;
    lastManualPourTokenRef.current = manualPourToken;
    const bottle = objectRefs.current.get("acid");
    const flask = objectRefs.current.get("flask");
    if (!bottle || !flask || (volumeRef.current.get("acid") ?? 0) <= 0) return undefined;

    flask.updateWorldMatrix(true, false);
    const opening = flask.localToWorld(new THREE.Vector3(0, VESSEL_CONFIG.flask.openingY, 0));
    const bottleScale = scaleByItem.acid;
    const pourAngle = -0.65;
    const mouthOffset = new THREE.Vector3(0, 0.35, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), pourAngle).multiplyScalar(bottleScale);
    bottle.rotation.set(0, 0, pourAngle);
    bottle.position.set(opening.x - mouthOffset.x, opening.y + 0.45 - mouthOffset.y, flask.position.z);
    const savedPosition = [bottle.position.x, bottle.position.y, bottle.position.z];
    positionsRef.current.set("acid", savedPosition);
    try { sessionStorage.setItem("nexora-lab-positions-v4", JSON.stringify(Object.fromEntries(positionsRef.current))); } catch {}

    mousePouringIdRef.current = "acid";
    manualPourActiveRef.current = true;
    mousePourElapsedRef.current = 0;
    setPouringId("acid");
    const timer = window.setTimeout(() => {
      mousePouringIdRef.current = null;
      manualPourActiveRef.current = false;
      mousePourElapsedRef.current = 0;
      bottle.rotation.set(0, 0, 0);
      if (streamRef.current) streamRef.current.visible = false;
      setPouringId((current) => current === "acid" ? null : current);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [manualPourToken]);

  const columns = Math.min(items.length, 3);

  const scaleByItem = {
    flask: 1.05,
    stand: 1.25,
    beaker: 1.15,
    testtube: 1.35,
    cylinder: 1.1,
    dropper: 1.15,
    rod: 1.1,
    balance: 1,
    spatula: 1,
    weighboat: 1,
    indicator: 1.1,
    acid: 1.1,
    base: 1.1,
    water: 1.1,
  };

  items.forEach((item, index) => {
    if (!volumeRef.current.has(item.id)) {
      volumeRef.current.set(item.id, item.kind === "chemical"
        ? (item.startingVolume ?? MAX_CHEMICAL_ML)
        : 0);
    }
    if (!positionsRef.current.has(item.id)) {
      let savedPositions = {};
      try {
        savedPositions = JSON.parse(
          sessionStorage.getItem("nexora-lab-positions-v4") || "{}"
        );
      } catch {
        savedPositions = {};
      }

      const savedPosition = item.permanent ? null : savedPositions[item.id];
      if (item.permanent && item.id === "stand") {
        positionsRef.current.set(item.id, [-0.95, -0.02, 0]);
      } else if (item.permanent && item.id === "burette") {
        positionsRef.current.set(item.id, [-0.575, -0.02, 0]);
      } else if (
        Array.isArray(savedPosition) &&
        savedPosition.length === 3 &&
        savedPosition.every(Number.isFinite)
      ) {
        positionsRef.current.set(item.id, [...savedPosition]);
      } else {
        const defaultPosition = DEFAULT_LAB_POSITIONS[item.id];
        if (defaultPosition) positionsRef.current.set(item.id, [...defaultPosition]);
        else {
          const column = index % 3;
          const row = Math.floor(index / 3);
          positionsRef.current.set(item.id, [
            (column - (columns - 1) / 2) * 0.8,
            item.id === "rod" ? 0.35 : -0.05 - row * 0.58,
            0,
          ]);
        }
      }
    }
  });

  useFrame((state, delta) => {
    if (titrationState?.endpoint) {
      // A completed guided result is authoritative for the visible liquid levels.
      volumeRef.current.set("flask", titrationState.flaskMl ?? 0);
      volumeRef.current.set("burette", titrationState.buretteMl ?? 0);
      volumeRef.current.set("acid", Math.max(0, MAX_CHEMICAL_ML - (titrationState.acidMl ?? 0)));
    }
    const hands = handPositionsRef?.current || handPositions || {};
    const raycaster = raycasterRef.current;
    const animatedStream = streamRef.current;
    const flowPath = animatedStream?.userData?.flowPath;
    if (animatedStream?.visible && flowPath?.length >= 2) {
      const start = flowPath[0];
      const opening = flowPath[1];
      const end = flowPath[2];
      const lengths = [start.distanceTo(opening), opening.distanceTo(end)];
      const totalLength = Math.max(0.001, lengths[0] + lengths[1]);
      animatedStream.children.slice(2).forEach((droplet, index) => {
        if (index >= (animatedStream.userData.dropletCount ?? 3)) {
          droplet.visible = false;
          return;
        }
        const progress = (state.clock.elapsedTime * 0.85 + index / 3) % 1;
        let distance = progress * totalLength;
        if (distance <= lengths[0]) {
          droplet.position.copy(start).lerp(opening, distance / Math.max(lengths[0], 0.001));
        } else {
          distance -= lengths[0];
          droplet.position.copy(opening).lerp(end, distance / Math.max(lengths[1], 0.001));
        }
        droplet.visible = true;
      });
    } else if (animatedStream) {
      animatedStream.children.slice(2).forEach((droplet) => { droplet.visible = false; });
    }

    // If the user positions the flask beneath the selected stand's holder, gently seat it.
    // A held flask is never moved by the support constraint.
    const standRoot = objectRefs.current.get("stand");
    const flaskRoot = objectRefs.current.get("flask");
    const buretteRoot = objectRefs.current.get("burette");
    const flaskHeld = grabbedRefs.current.Left?.id === "flask" || grabbedRefs.current.Right?.id === "flask";
    const standHeld = grabbedRefs.current.Left?.id === "stand" || grabbedRefs.current.Right?.id === "stand";
    if (standRoot && flaskRoot && buretteRoot && !flaskHeld && !standHeld) {
      const nozzle = buretteRoot.localToWorld(new THREE.Vector3(0, -0.45, 0));
      const holderX = standRoot.position.x + 0.375;
      const holderY = nozzle.y - VESSEL_CONFIG.flask.openingY - 0.025;
      const closeEnough = Math.abs(flaskRoot.position.x - holderX) < 0.22 &&
        Math.abs(flaskRoot.position.y - holderY) < 0.22 &&
        Math.abs(flaskRoot.position.z - standRoot.position.z) < 0.32;
      if (closeEnough) {
        flaskRoot.position.x += (holderX - flaskRoot.position.x) * 0.35;
        flaskRoot.position.y += (holderY - flaskRoot.position.y) * 0.35;
        flaskRoot.position.z += (standRoot.position.z - flaskRoot.position.z) * 0.35;
      }
    }

    // Update vessel liquid even when no hand is pinching.
    for (const [id, fillMesh] of vesselFillRefs.current.entries()) {
      const config = VESSEL_CONFIG[id];
      if (!config) continue;
      const volume = clamp(volumeRef.current.get(id) ?? 0, 0, config.capacity);
      const fillHeight = (volume / config.capacity) * config.maxHeight;
      fillMesh.scale.y = Math.max(fillHeight, 0.001);
      fillMesh.position.y = config.bottom + fillHeight / 2;
      fillMesh.visible = volume > 0;
    }

    // Stop dispensing on the first simulated indicator endpoint so the recorded
    // result remains a faint-pink titration rather than an over-titrated one.
    const flaskEndpointReached = items.find((item) => item.id === "flask")?.isEndpoint;
    if (flaskEndpointReached && buretteOpenRef.current) {
      buretteOpenRef.current = false;
      setBuretteOpen(false);
      lastBuretteTransferAtRef.current = 0;
      if (streamRef.current && !mousePouringIdRef.current) streamRef.current.visible = false;
    }

    // When the stopcock is open, dispense the burette into the nearest valid vessel below its nozzle.
    const flaskRootForDispense = objectRefs.current.get("flask");
    if (buretteOpenRef.current && buretteRoot && flaskRootForDispense && (volumeRef.current.get("burette") ?? 0) > 0) {
      const nozzle = buretteRoot.localToWorld(new THREE.Vector3(0, -0.45, 0));
      const flaskOpening = flaskRootForDispense.localToWorld(new THREE.Vector3(0, 0.325, 0));
      const verticalGap = nozzle.y - flaskOpening.y;
      const aligned = Math.hypot(flaskOpening.x - nozzle.x, flaskOpening.z - nozzle.z) < 0.10 && verticalGap >= 0 && verticalGap < 0.45;
        if (aligned && (volumeRef.current.get("flask") ?? 0) < VESSEL_CONFIG.flask.capacity) {
        const stream = streamRef.current;
        const end = getVesselLiquidSurface(flaskRootForDispense, "flask", VESSEL_CONFIG.flask, volumeRef.current.get("flask") ?? 0);
        updatePourStream(stream, nozzle, end, "#d9f3ff", flaskOpening);
        lastBuretteTransferAtRef.current += Math.min(delta, 0.25);
        if (lastBuretteTransferAtRef.current >= 0.08) {
          const elapsed = lastBuretteTransferAtRef.current; lastBuretteTransferAtRef.current = 0;
          let rateMlPerSecond = 2.5;
          if (titrationState?.indicatorMl >= 0.1 && titrationState.acidMl > 0 && !titrationState.endpoint) {
            // Slow down adaptively as equivalence approaches. This resolves the
            // indicator transition without one coarse frame jumping to pH 12+.
            const targetExcessOH = 10 ** (9 - 14);
            const currentFlaskMl = Math.max(titrationState.flaskMl, 0.1);
            const targetBaseMl = titrationState.acidMl + (targetExcessOH * currentFlaskMl) / 0.1;
            const remainingToEndpoint = Math.max(0, targetBaseMl - titrationState.baseMl);
            rateMlPerSecond = Math.max(0.05, Math.min(rateMlPerSecond, remainingToEndpoint * 5));
          }
          const amount = Math.min(volumeRef.current.get("burette") ?? 0, Math.max(0, VESSEL_CONFIG.flask.capacity - (volumeRef.current.get("flask") ?? 0)), rateMlPerSecond * elapsed);
          if (amount > 0) {
            volumeRef.current.set("burette", Math.max(0, (volumeRef.current.get("burette") ?? 0) - amount));
            volumeRef.current.set("flask", Math.min(VESSEL_CONFIG.flask.capacity, (volumeRef.current.get("flask") ?? 0) + amount));
            const accepted = onTransfer?.({ sourceId: "burette", targetId: "flask", ml: amount }) ?? amount;
            const correction = Math.max(0, amount - accepted);
            if (correction > 0) {
              volumeRef.current.set("burette", (volumeRef.current.get("burette") ?? 0) + correction);
              volumeRef.current.set("flask", Math.max(0, (volumeRef.current.get("flask") ?? 0) - correction));
            }
          }
        }
      } else { lastBuretteTransferAtRef.current = 0; if (streamRef.current && !pouringRef.current) streamRef.current.visible = false; }
    } else { lastBuretteTransferAtRef.current = 0; }

    for (const handName of ["Left", "Right"]) {
      const hand = hands[handName];
      const grabbedBefore = grabbedRefs.current[handName];

      if (!hand || !hand.pinching) {
        hoverRefs.current[handName] = null;
        if (hand && Number.isFinite(hand.screenX) && Number.isFinite(hand.screenY) && !grabbedBefore) {
          const rect = gl.domElement.getBoundingClientRect();
          if (hand.screenX >= rect.left && hand.screenX <= rect.right && hand.screenY >= rect.top && hand.screenY <= rect.bottom) {
            const hoverPointer = pointerRefs.current[handName];
            hoverPointer.set(
              ((hand.screenX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
              1 - ((hand.screenY - rect.top) / Math.max(rect.height, 1)) * 2
            );
            raycaster.setFromCamera(hoverPointer, camera);
            const hoverHits = raycaster.intersectObjects([...objectRefs.current.values()], true);
            const knob = handName === "Left" ? hoverHits.find((hit) => hit.object.userData?.interactionPart === "clamp-knob") : null;
            const orderedHoverHits = knob ? [knob, ...hoverHits.filter((hit) => hit !== knob)] : hoverHits;
            for (const hit of orderedHoverHits) {
              let current = hit.object;
              let rootEntry = null;
              while (current && !rootEntry) {
                rootEntry = [...objectRefs.current.entries()].find(([, root]) => root === current);
                current = current.parent;
              }
              if (!rootEntry) continue;
              const [id] = rootEntry;
              const item = items.find((candidate) => candidate.id === id);
              const part = hit.object.userData?.interactionPart;
              if (part === "clamp-knob" && handName === "Left" && id === "stand") {
                hoverRefs.current[handName] = "stand:clamp-knob";
                break;
              }
              if ((handName === "Left" && item?.kind === "chemical") || (handName === "Right" && item?.kind !== "chemical")) continue;
              hoverRefs.current[handName] = id;
              break;
            }
          }
        }
        if (grabbedBefore) {
          const releasedRoot = objectRefs.current.get(grabbedBefore.id);
          if (releasedRoot) {
            const saved = positionsRef.current.get(grabbedBefore.id);
            if (saved) {
              saved[0] = releasedRoot.position.x;
              saved[1] = releasedRoot.position.y;
            }
            const releasedItem = items.find((item) => item.id === grabbedBefore.id);
            if (releasedItem?.kind === "chemical") releasedRoot.rotation.z = 0;
            else if (releasedItem?.id !== "titrationStand" && releasedItem?.id !== "burette") releasedRoot.rotation.z = 0;
          }
          try {
            sessionStorage.setItem("nexora-lab-positions-v4", JSON.stringify(Object.fromEntries(positionsRef.current)));
          } catch {}
        }
        grabbedRefs.current[handName] = null;
        wasPinchingRefs.current[handName] = false;
        if (handName === "Right" || handName === "Left") {
          pourLatchedRef.current = false;
          indicatorDropLatchedRef.current = false;
          lastPourAtRef.current = 0;
          setPouringId((current) => current === null ? current : null);
          if (streamRef.current) streamRef.current.visible = false;
        }
        continue;
      }

      const pointer = pointerRefs.current[handName];
      const targetPointer = targetPointerRefs.current[handName];
      const canvasRect = gl.domElement.getBoundingClientRect();
      const screenX = Number.isFinite(hand.screenX) ? hand.screenX : (1 - hand.x) * window.innerWidth;
      const screenY = Number.isFinite(hand.screenY) ? hand.screenY : hand.y * window.innerHeight;
      targetPointer.set(
        ((screenX - canvasRect.left) / Math.max(canvasRect.width, 1)) * 2 - 1,
        1 - ((screenY - canvasRect.top) / Math.max(canvasRect.height, 1)) * 2
      );
      if (!wasPinchingRefs.current[handName]) pointer.copy(targetPointer);
      else pointer.lerp(targetPointer, 0.72);
      raycaster.setFromCamera(pointer, camera);

      if (!grabbedRefs.current[handName]) {
        const hits = raycaster.intersectObjects([...objectRefs.current.values()], true);
        const knobHit = handName === "Left" ? hits.find((hit) => hit.object.userData?.interactionPart === "clamp-knob") : null;
        const stopcockHit = handName === "Right" ? hits.find((hit) => hit.object.userData?.interactionPart === "burette-stopcock") : null;
        if (stopcockHit && !wasPinchingRefs.current[handName]) {
          buretteOpenRef.current = !buretteOpenRef.current;
          setBuretteOpen(buretteOpenRef.current);
          wasPinchingRefs.current[handName] = true;
          continue;
        }
        const orderedHits = knobHit ? [knobHit, ...hits.filter((hit) => hit !== knobHit)] : hits;
        for (const hit of orderedHits) {
          let current = hit.object;
          let rootEntry = null;
          while (current && !rootEntry) {
            rootEntry = [...objectRefs.current.entries()].find(([, root]) => root === current);
            current = current.parent;
          }
          if (!rootEntry) continue;
          const [id] = rootEntry;
          const item = items.find((candidate) => candidate.id === id);
          const isChemical = item?.kind === "chemical";
          const interactionPart = hit.object.userData?.interactionPart || null;
          if ((interactionPart === "clamp-knob" && (handName !== "Left" || id !== "stand")) || interactionPart === "burette-stopcock") continue;
          if (!interactionPart && ((handName === "Left" && isChemical) || (handName === "Right" && !isChemical))) continue;
          if ((item?.fixed === true && interactionPart !== "clamp-knob") || item?.id === "titrationStand" || item?.id === "burette") continue;

          const root = objectRefs.current.get(id);
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -root.position.z);
          const point = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, point)) {
            grabbedRefs.current[handName] = {
              id, plane, part: interactionPart,
              lastPoint: point.clone(),
              startHandTilt: Number.isFinite(hand.tilt) ? hand.tilt : 0,
              startObjectTilt: root.rotation.z,
              lastHandTilt: Number.isFinite(hand.tilt) ? hand.tilt : 0,
              offset: new THREE.Vector3(root.position.x - point.x, root.position.y - point.y, 0),
            };
          }
          break;
        }
      }

      wasPinchingRefs.current[handName] = true;
      const grabbed = grabbedRefs.current[handName];
      if (!grabbed) continue;
      hoverRefs.current[handName] = grabbed.part === "clamp-knob" ? "stand:clamp-knob" : grabbed.id;
      const root = objectRefs.current.get(grabbed.id);
      if (!root) continue;
      const point = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(grabbed.plane, point)) continue;
      if (grabbed.part === "clamp-knob") {
        // Twist uses palm orientation (MediaPipe wrist-to-middle-finger angle), not cursor travel.
        if (handName === "Left" && Number.isFinite(hand.tilt)) {
          let angleDelta = hand.tilt - (grabbed.lastHandTilt ?? hand.tilt);
          while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
          while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
          if (Math.abs(angleDelta) > 0.012) {
            clampRotationRef.current = clamp(clampRotationRef.current + angleDelta * 1.35, -1.35, 1.35);
            setClampRotation(clampRotationRef.current);
            // Rotation drives the simulated clamp jaw opening/tightening.
            clampOffsetRef.current = clamp(clampRotationRef.current * 0.19, -0.25, 0.25);
            setClampOffset(clampOffsetRef.current);
            grabbed.lastHandTilt = hand.tilt;
          }
        }
        continue;
      }

      const targetX = point.x + grabbed.offset.x;
      const targetY = point.y + grabbed.offset.y;
      // Low-pass movement smooths camera jitter without excessive lag.
      const smoothing = 1 - Math.exp(-Math.min(delta, 0.05) * 14);
      root.position.x += (targetX - root.position.x) * smoothing;
      root.position.y += (targetY - root.position.y) * smoothing;

      const grabbedItem = items.find((item) => item.id === grabbed.id);
      const isChemical = grabbedItem?.kind === "chemical";
      const canPourFromHand = (handName === "Right" && isChemical) || (handName === "Left" && !!VESSEL_CONFIG[grabbed.id] && !isChemical);
      // HCl is the guided practical's most failure-prone interaction. When the
      // right hand brings it close to the flask, gently tip it and start the same
      // real transfer path without requiring a precise wrist-tilt latch.
      const acidFlask = grabbed.id === "acid" && handName === "Right"
        ? objectRefs.current.get("flask")
        : null;
      let autoPourHcl = false;
      if (acidFlask && (volumeRef.current.get("acid") ?? 0) > 0 && (titrationState?.acidMl ?? 0) < 12) {
        acidFlask.updateWorldMatrix(true, false);
        const flaskOpening = acidFlask.localToWorld(new THREE.Vector3(0, VESSEL_CONFIG.flask.openingY, 0));
        // Use the bottle body for the proximity latch so the bottle's own tilt
        // cannot make it fall out of the trigger radius mid-pour.
        const nearFlask = root.position.distanceTo(flaskOpening) < 1.35;
        if (nearFlask) {
          autoPourHcl = true;
          const desiredTilt = flaskOpening.x >= root.position.x ? -0.48 : 0.48;
          root.rotation.z += (desiredTilt - root.rotation.z) * (1 - Math.exp(-Math.min(delta, 0.05) * 12));
        }
      }
      if (isChemical && handName === "Right" && Number.isFinite(hand.tilt) && !autoPourHcl) {
        // Rotate relative to the hand orientation at pickup so a tilted starting
        // pose does not prevent the bottle from responding to the pour gesture.
        let angleDelta = hand.tilt - (grabbed.startHandTilt ?? hand.tilt);
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        let targetTilt = clamp((grabbed.startObjectTilt ?? 0) + angleDelta * 1.35, -1.12, 1.12);
        if (Math.abs(targetTilt - root.rotation.z) < 0.035) targetTilt = root.rotation.z;
        root.rotation.z += (targetTilt - root.rotation.z) * (1 - Math.exp(-Math.min(delta, 0.05) * 11));
      } else if (!isChemical && handName === "Left" && Number.isFinite(hand.tilt)) {
        let targetTilt = clamp(hand.tilt * 0.58, -0.70, 0.70);
        if (Math.abs(targetTilt - root.rotation.z) < 0.035) targetTilt = root.rotation.z;
        root.rotation.z += (targetTilt - root.rotation.z) * (1 - Math.exp(-Math.min(delta, 0.05) * 4.8));
      }

      // Hysteresis avoids the pour stream flickering around a single tilt threshold.
      if (canPourFromHand) {
        // Webcam palm angle is noisy, so use a forgiving tilt threshold with hysteresis.
        // This prevents a normal hand rotation from needing an extreme wrist angle.
        const tiltMagnitude = Math.abs(root.rotation.z);
        if (!pourLatchedRef.current && tiltMagnitude > 0.10) pourLatchedRef.current = true;
        else if (pourLatchedRef.current && tiltMagnitude < 0.06) {
          pourLatchedRef.current = false;
          if (grabbed.id === "indicator") indicatorDropLatchedRef.current = false;
        }
      }

      let pourTarget = null;
        if (canPourFromHand && (pourLatchedRef.current || autoPourHcl) &&
          !(grabbed.id === "acid" && (titrationState?.acidMl ?? 0) >= 12) &&
          (volumeRef.current.get(grabbed.id) ?? 0) > 0) {
        const mouthLocal = grabbed.id === "cylinder" ? new THREE.Vector3(0, 0.48, 0)
          : grabbed.id === "beaker" ? new THREE.Vector3(0.22, 0.25, 0)
          : grabbed.id === "testtube" ? new THREE.Vector3(0, 0.30, 0)
          : isChemical ? new THREE.Vector3(0, 0.35, 0)
          : new THREE.Vector3(0, 0.41, 0);
        const mouth = root.localToWorld(mouthLocal.clone());
        let closestOpeningDistance = Infinity;
        for (const candidate of items) {
          const config = VESSEL_CONFIG[candidate.id];
          if (!config || candidate.kind === "chemical" || candidate.id === grabbed.id || (isChemical && !isValidChemicalDestination(grabbed.id, candidate.id))) continue;
          const targetRoot = objectRefs.current.get(candidate.id);
          if (!targetRoot) continue;
          const opening = targetRoot.localToWorld(new THREE.Vector3(0, config.openingY ?? (config.bottom + config.maxHeight), 0));
          const end = getVesselLiquidSurface(targetRoot, candidate.id, config, volumeRef.current.get(candidate.id) ?? 0);
          // The lab is viewed mostly from the front. Test the opening in screen-facing
          // X/Y space; a strict 3D vertical test made the stream disappear when the
          // bottle was tilted or the receiving vessel sat a little higher.
          const screenPlaneDistance = Math.hypot(opening.x - mouth.x, opening.y - mouth.y);
          const openingDistance = mouth.distanceTo(opening);
          const mouthAboveOpening = mouth.y - opening.y;
          if (autoPourHcl && candidate.id === "flask") {
            closestOpeningDistance = openingDistance;
            pourTarget = { item: candidate, root: targetRoot, config, mouth, opening };
            break;
          }
          // Guided HCl has one permitted receiving vessel (the flask), so give
          // that pour a forgiving catch radius. A narrow 1.25-unit gate caused
          // long, apparently valid pours to show no stream or transfer at all.
          const catchRadius = grabbed.id === "acid" ? 1.8 : 1.25;
          if (screenPlaneDistance < catchRadius && mouthAboveOpening > -0.85 && mouthAboveOpening < 1.8 &&
              openingDistance < catchRadius && openingDistance < closestOpeningDistance &&
              (volumeRef.current.get(candidate.id) ?? 0) < config.capacity) {
            closestOpeningDistance = openingDistance;
            pourTarget = { item: candidate, root: targetRoot, config, mouth, opening };
          }
        }
      }

      if (canPourFromHand && pourTarget) {
        setPouringId((current) => current === grabbed.id ? current : grabbed.id);
        const stream = streamRef.current;
        if (stream && (grabbed.id !== "indicator" || !indicatorDropLatchedRef.current)) {
          const start = pourTarget.mouth;
          const end = getVesselLiquidSurface(pourTarget.root, pourTarget.item.id, pourTarget.config, volumeRef.current.get(pourTarget.item.id) ?? 0);
          const streamColor = grabbed.id === "acid" || grabbed.id === "base" || grabbed.id === "indicator" ? "#8bdcff" : grabbedItem.liquidColor;
          updatePourStream(stream, start, end, streamColor, pourTarget.opening);
          if (grabbed.id === "indicator") {
            stream.children[0].visible = false;
            stream.children[1].visible = false;
            stream.userData.dropletCount = 2;
            indicatorDropHideAtRef.current = state.clock.elapsedTime + 0.45;
          }
        }
        if (grabbed.id === "indicator" && indicatorDropLatchedRef.current && state.clock.elapsedTime >= indicatorDropHideAtRef.current) {
          if (stream) stream.visible = false;
          setPouringId((current) => current === "indicator" ? null : current);
        }
        lastPourAtRef.current += Math.min(delta, 0.25);
        if (lastPourAtRef.current >= 0.08) {
          const elapsed = lastPourAtRef.current;
          lastPourAtRef.current = 0;
          const rateMlPerSecond = grabbed.id === "acid" ? 24.0 : grabbed.id === "base" ? 16.0 : 15.0;
          const available = Math.max(0, volumeRef.current.get(grabbed.id) ?? 0);
          const capacityLeft = Math.max(0, pourTarget.config.capacity - (volumeRef.current.get(pourTarget.item.id) ?? 0));
          const transferred = grabbed.id === "indicator"
            ? (indicatorDropLatchedRef.current ? 0 : Math.min(0.10, available, capacityLeft))
            : Math.min(available, capacityLeft, rateMlPerSecond * elapsed);
          if (transferred > 0) {
            if (grabbed.id === "indicator") indicatorDropLatchedRef.current = true;
            volumeRef.current.set(grabbed.id, Math.max(0, available - transferred));
            volumeRef.current.set(pourTarget.item.id, Math.min(pourTarget.config.capacity, (volumeRef.current.get(pourTarget.item.id) ?? 0) + transferred));
            const accepted = onTransfer?.({ sourceId: grabbed.id, targetId: pourTarget.item.id, ml: transferred }) ?? transferred;
            const correction = Math.max(0, transferred - accepted);
            if (correction > 0) {
              volumeRef.current.set(grabbed.id, (volumeRef.current.get(grabbed.id) ?? 0) + correction);
              volumeRef.current.set(pourTarget.item.id, Math.max(0, (volumeRef.current.get(pourTarget.item.id) ?? 0) - correction));
            }
          }
        }
      } else if (handName === "Right" || handName === "Left") {
        lastPourAtRef.current = 0;
        setPouringId((current) => current === grabbed.id ? null : current);
        if (streamRef.current) streamRef.current.visible = false;
      }

      const saved = positionsRef.current.get(grabbed.id);
      if (saved) {
        saved[0] = root.position.x;
        saved[1] = root.position.y;
      }
    }

    // Mouse fallback: double-click a chemical bottle to tilt it and pour; double-click
    // again to stop. It uses the same inventory, vessel capacities and transfer callback.
    const mousePourId = mousePouringIdRef.current;
    const mouseBottle = mousePourId ? objectRefs.current.get(mousePourId) : null;
    const mouseChemical = mousePourId ? items.find((item) => item.id === mousePourId) : null;
    let mouseTarget = null;
    if (mouseBottle && mouseChemical) {
      // The bottle rim sits at y=0.35; y=0.41 was above the actual opening.
      const mouthLocal = new THREE.Vector3(0, 0.35, 0);
      const mouth = mouseBottle.localToWorld(mouthLocal);
      let closest = Infinity;
      for (const candidate of items) {
        const config = VESSEL_CONFIG[candidate.id];
        const targetRoot = objectRefs.current.get(candidate.id);
        if (!config || !targetRoot || candidate.id === mousePourId || candidate.kind === "chemical" || !isValidChemicalDestination(mousePourId, candidate.id) ||
            (mousePourId === "acid" && (titrationState?.acidMl ?? 0) >= 12)) continue;
        const opening = targetRoot.localToWorld(new THREE.Vector3(0, config.openingY, 0));
        const end = getVesselLiquidSurface(targetRoot, candidate.id, config, volumeRef.current.get(candidate.id) ?? 0);
        const distance = mouth.distanceTo(opening);
        if (distance < 1.4 && mouth.y >= opening.y - 0.2 && mouth.y - opening.y < 1.4 &&
            distance < 0.85 && distance < closest && (volumeRef.current.get(candidate.id) ?? 0) < config.capacity) {
          closest = distance;
          mouseTarget = { candidate, config, targetRoot, mouth, opening };
        }
      }
      // The guided button is an explicit user command: target the real flask
      // directly instead of making this fallback depend on a narrow distance gate.
      if (manualPourActiveRef.current && mousePourId === "acid") {
        const flaskItem = items.find((item) => item.id === "flask");
        const flaskRoot = objectRefs.current.get("flask");
        const flaskConfig = VESSEL_CONFIG.flask;
        if (flaskItem && flaskRoot && flaskConfig) {
          flaskRoot.updateWorldMatrix(true, false);
          const opening = flaskRoot.localToWorld(new THREE.Vector3(0, flaskConfig.openingY, 0));
          const mouth = mouseBottle.localToWorld(new THREE.Vector3(0, 0.35, 0));
          mouseTarget = { candidate: flaskItem, config: flaskConfig, targetRoot: flaskRoot, mouth, opening };
        }
      }
    }
    if (mouseTarget && (volumeRef.current.get(mousePourId) ?? 0) > 0) {
      const stream = streamRef.current;
      const end = getVesselLiquidSurface(mouseTarget.targetRoot, mouseTarget.candidate.id, mouseTarget.config, volumeRef.current.get(mouseTarget.candidate.id) ?? 0);
      const streamColor = mousePourId === "acid" || mousePourId === "base" || mousePourId === "indicator" ? "#8bdcff" : mouseChemical.liquidColor;
      if (mousePourId !== "indicator" || !mouseIndicatorDoseLatchedRef.current) {
        updatePourStream(stream, mouseTarget.mouth, end, streamColor, mouseTarget.opening);
        if (mousePourId === "indicator") {
          stream.children[0].visible = false;
          stream.children[1].visible = false;
          stream.userData.dropletCount = 2;
          mouseIndicatorDropHideAtRef.current = state.clock.elapsedTime + 0.45;
        }
      }
      if (mousePourId === "indicator" && mouseIndicatorDoseLatchedRef.current && state.clock.elapsedTime >= mouseIndicatorDropHideAtRef.current) {
        if (stream) stream.visible = false;
        mousePouringIdRef.current = null;
        mouseBottle.rotation.z = 0;
        setPouringId((current) => current === "indicator" ? null : current);
      }
      mousePourElapsedRef.current += Math.min(delta, 0.25);
      if (mousePourElapsedRef.current >= 0.08) {
        const elapsed = mousePourElapsedRef.current;
        mousePourElapsedRef.current = 0;
        const available = volumeRef.current.get(mousePourId) ?? 0;
        const targetVolume = volumeRef.current.get(mouseTarget.candidate.id) ?? 0;
        const rate = mousePourId === "acid" ? 24 : mousePourId === "base" ? 16 : 15;
        const capacityLeft = Math.max(0, mouseTarget.config.capacity - targetVolume);
        const amount = mousePourId === "indicator"
          ? (mouseIndicatorDoseLatchedRef.current ? 0 : Math.min(0.10, available, capacityLeft))
          : Math.min(available, capacityLeft, rate * elapsed);
        if (amount > 0) {
          if (mousePourId === "indicator") mouseIndicatorDoseLatchedRef.current = true;
          volumeRef.current.set(mousePourId, available - amount);
          volumeRef.current.set(mouseTarget.candidate.id, targetVolume + amount);
          const accepted = onTransfer?.({ sourceId: mousePourId, targetId: mouseTarget.candidate.id, ml: amount }) ?? amount;
          const correction = Math.max(0, amount - accepted);
          if (correction > 0) {
            volumeRef.current.set(mousePourId, (volumeRef.current.get(mousePourId) ?? 0) + correction);
            volumeRef.current.set(mouseTarget.candidate.id, Math.max(0, (volumeRef.current.get(mouseTarget.candidate.id) ?? 0) - correction));
          }
        }
      }
    } else {
      mousePourElapsedRef.current = 0;
      if (!buretteOpenRef.current && streamRef.current) streamRef.current.visible = false;
    }
    // Re-apply the burette stream after hand interactions so an idle hand cannot hide it.
    if (buretteOpenRef.current && (volumeRef.current.get("burette") ?? 0) > 0) {
      const burette = objectRefs.current.get("burette");
      const flask = objectRefs.current.get("flask");
      if (burette && flask) {
        const start = burette.localToWorld(new THREE.Vector3(0, -0.45, 0));
        const opening = flask.localToWorld(new THREE.Vector3(0, 0.325, 0));
        const aligned = Math.hypot(opening.x - start.x, opening.z - start.z) < 0.85 && opening.y < start.y + 0.05;
        if (aligned) {
        const end = getVesselLiquidSurface(flask, "flask", VESSEL_CONFIG.flask, volumeRef.current.get("flask") ?? 0);
        if (Math.hypot(opening.x - start.x, opening.z - start.z) < 0.12) updatePourStream(streamRef.current, start, end, "#d9f3ff", opening);
        else if (streamRef.current) streamRef.current.visible = false;
        } else if (streamRef.current && !pouringId) streamRef.current.visible = false;
      }
    }
    const nextHovered = hoverRefs.current.Right || hoverRefs.current.Left || null;
    setHoveredObject((current) => current === nextHovered ? current : nextHovered);
  });

  return (
    <>
      <ambientLight intensity={2.0} color="#f5f8ff" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#ffffff" />
      <directionalLight
        position={[-3, 2, 3]}
        intensity={1.25}
        color="#d7eaff"
      />

      {items.map((item) => (
        <group
          key={item.id}
          ref={(node) => {
            if (node) {
              objectRefs.current.set(item.id, node);
            } else {
              objectRefs.current.delete(item.id);
            }
          }}
          position={positionsRef.current.get(item.id)}
          scale={scaleByItem[item.id] ?? 1}
          onPointerDown={(event) => {
            const root = objectRefs.current.get(item.id);
            if (!root || item.fixed || item.permanent || event.button !== 0) return;
            event.stopPropagation();
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -root.position.z);
            const point = new THREE.Vector3();
            if (!event.ray.intersectPlane(plane, point)) return;
            mouseDragRef.current = { id: item.id, plane, offset: new THREE.Vector3(root.position.x - point.x, root.position.y - point.y, 0) };
            event.target.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = mouseDragRef.current;
            if (!drag || drag.id !== item.id) return;
            const root = objectRefs.current.get(item.id);
            const point = new THREE.Vector3();
            if (!root || !event.ray.intersectPlane(drag.plane, point)) return;
            root.position.x = point.x + drag.offset.x;
            root.position.y = point.y + drag.offset.y;
          }}
          onPointerUp={(event) => {
            if (mouseDragRef.current?.id !== item.id) return;
            const root = objectRefs.current.get(item.id);
            const saved = positionsRef.current.get(item.id);
            if (root && saved) { saved[0] = root.position.x; saved[1] = root.position.y; }
            mouseDragRef.current = null;
            event.target.releasePointerCapture?.(event.pointerId);
            try { sessionStorage.setItem("nexora-lab-positions-v4", JSON.stringify(Object.fromEntries(positionsRef.current))); } catch {}
          }}
          onDoubleClick={(event) => {
            if (item.kind !== "chemical") return;
            event.stopPropagation();
            toggleMouseBottlePour(item.id);
          }}
          onClick={(event) => {
            // The invisible grab volume covers most of the burette and can be
            // the primary hit even when the visible lever is clicked. Check all
            // ray intersections so the transparent hitbox cannot swallow it.
            const clickedStopcock = event.intersections?.some(({ object }) => object.userData?.interactionPart === "burette-stopcock");
            if (!clickedStopcock) return;
            event.stopPropagation();
            buretteOpenRef.current = !buretteOpenRef.current;
            setBuretteOpen(buretteOpenRef.current);
          }}
        >
          {/* Transparent hitbox: lets the user grab thin/small instruments reliably. */}
          <mesh>
            <boxGeometry args={getInstrumentGrabSize(item.id)} />
            <meshBasicMaterial
              transparent
              opacity={0}
              colorWrite={false}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Keep the invisible hitbox for reliable grabbing, but do not draw a
              wireframe box around the bottle or chemical when the hand hovers. */}
            <InstrumentModel item={item} pouring={pouringId === item.id} volumeMl={volumeRef.current.get(item.id) ?? 100} volumeStateRef={volumeRef} onMousePourToggle={toggleMouseBottlePour} clampOffset={clampOffset} knobRotation={clampRotation} knobHighlighted={hoveredObject === "stand:clamp-knob"} stopcockOpen={buretteOpen} isMixing={item.id === "flask" && (titrationState?.flaskMl ?? 0) > 0 && !titrationState?.endpoint} />

          {VESSEL_CONFIG[item.id] && item.id !== "flask" && (
            <mesh
              ref={(node) => {
                if (node) vesselFillRefs.current.set(item.id, node);
                else vesselFillRefs.current.delete(item.id);
              }}
              position={[0, VESSEL_CONFIG[item.id].bottom, 0]}
              scale={[1, 0.001, 1]}
              visible={false}
              renderOrder={8}
            >
              <cylinderGeometry args={[VESSEL_CONFIG[item.id].radius, VESSEL_CONFIG[item.id].radius, 1, 48]} />
              <meshBasicMaterial
                color={items.find((entry) => entry.id === item.id)?.liquidColor || "#d9f3ff"}
                transparent
                opacity={0.78}
                depthTest={false}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      ))}

      <group ref={streamRef} visible={false} renderOrder={20}>
        {[0, 1].map((part) => (
          <mesh key={part} visible={false} renderOrder={20}>
            <cylinderGeometry args={[0.025, 0.031, 1, 24]} />
            <meshBasicMaterial color="#8bdcff" transparent opacity={0.98} depthTest={false} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
        {[0, 1, 2].map((part) => (
          <mesh key={`flow-drop-${part}`} visible={false} renderOrder={21}>
            <sphereGeometry args={[0.014, 12, 10]} />
            <meshBasicMaterial color="#e4faff" transparent opacity={0.95} depthTest={false} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}



export default InstrumentModel;
