"use client";
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Boxes } from "./ScenePrimitives";
import Crowd from "./Crowd";
import { useQuality } from "./Quality";
import { groundHeight } from "./Landscape";
import { campFire, campTent, trailLife } from "../../lib/trail-life.mjs";
import { campsite } from "../../lib/valley-layout.mjs";

// A two-person ridge tent: two pitched panels, a ridge pole and a sheet.
function Tent() {
  const { x, z, yaw } = campTent;
  const parts = useMemo(() => {
    const fly = [],
      dark = [];
    for (const s of [-1, 1])
      fly.push({
        position: [s * 0.52, 0.55, 0],
        size: [0.03, 1.5, 2.2],
        rotation: [0, 0, s * 0.76],
        radius: 0.01,
      });
    dark.push({ position: [0, 0.02, 0], size: [1.9, 0.03, 2.4], radius: 0.01 });
    dark.push({
      position: [0, 1.08, 0],
      size: [0.05, 0.05, 2.3],
      radius: 0.02,
    });
    dark.push({
      position: [0, 0.5, 1.1],
      size: [0.5, 0.95, 0.02],
      radius: 0.01,
    });
    return { fly, dark };
  }, []);
  return (
    <group position={[x, groundHeight(x, z), z]} rotation={[0, yaw, 0]}>
      <Boxes items={parts.fly} color="#c9713f" roughness={0.8} />
      <Boxes items={parts.dark} color="#2e3430" roughness={0.9} />
    </group>
  );
}

// A stone ring, crossed logs, and flames that flicker while animating.
function Fire({ night, animate }) {
  const { x, z } = campFire;
  const stones = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return {
          position: [Math.cos(a) * 0.5, 0.08, Math.sin(a) * 0.5],
          size: [0.2, 0.16, 0.16],
          rotation: [0, a, 0],
          radius: 0.06,
        };
      }),
    [],
  );
  const logs = useMemo(
    () => [
      ...[0, 1.1, 2.2].map((a) => ({
        position: [0, 0.12, 0],
        size: [0.1, 0.1, 0.72],
        rotation: [0.25, a, 0],
        radius: 0.04,
      })),
      {
        position: [1.55, 0.18, 1.1],
        size: [0.34, 0.34, 1.5],
        rotation: [0, -0.6, 0],
        radius: 0.15,
      },
      {
        position: [-1.5, 0.18, 0.9],
        size: [0.34, 0.34, 1.5],
        rotation: [0, 0.7, 0],
        radius: 0.15,
      },
    ],
    [],
  );
  const flames = [useRef(), useRef(), useRef()];
  const light = useRef();
  useFrame(({ clock }) => {
    if (!animate) return;
    const t = clock.elapsedTime;
    flames.forEach((f, i) => {
      if (!f.current) return;
      const k =
        0.85 +
        Math.sin(t * (9 + i * 3.1) + i) * 0.1 +
        Math.sin(t * 23 + i * 2) * 0.05;
      f.current.scale.set(1, k, 1);
      f.current.rotation.y = t * (0.6 + i * 0.2);
    });
    if (light.current)
      light.current.intensity =
        (night ? 5 : 0) * (0.85 + Math.sin(t * 17) * 0.1);
  });
  return (
    <group position={[x, groundHeight(x, z), z]}>
      <Boxes items={stones} color="#7c776e" roughness={0.95} />
      <Boxes items={logs} color="#5b3f2a" roughness={0.9} />
      {[
        [0.2, 0.55, "#ff9a3c"],
        [0.13, 0.75, "#ffc35a"],
        [0.07, 0.9, "#fff0b0"],
      ].map(([r, h, color], i) => (
        <mesh key={i} ref={flames[i]} position={[0, 0.12 + h / 2, 0]}>
          <coneGeometry args={[r, h, 7, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85 - i * 0.1}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {night && (
        <pointLight
          ref={light}
          position={[0, 0.7, 0]}
          color="#ffa04a"
          distance={9}
          decay={2}
          intensity={5}
        />
      )}
    </group>
  );
}

function TrailPeople({ animate }) {
  const { tier } = useQuality();
  const agents = useMemo(() => trailLife(tier), [tier]);
  return (
    <Crowd
      src="/models/characters/crowd.glb"
      agents={agents}
      ground={groundHeight}
      animate={animate}
    />
  );
}

// Trampled ground under the camp; sitting above the soil clears the grass.
function Clearing() {
  const { x, z, radius } = campsite;
  return (
    <mesh position={[x, groundHeight(x, z) + 0.015, z]} receiveShadow>
      <cylinderGeometry args={[radius, radius + 0.25, 0.05, 40]} />
      <meshStandardMaterial color="#7d6a52" roughness={1} />
    </mesh>
  );
}

export default function TrailCamp({ night, animate, detailed }) {
  return (
    <group>
      <Clearing />
      <Tent />
      <Fire night={night} animate={animate} />
      {detailed && (
        <Suspense fallback={null}>
          <TrailPeople animate={animate} />
        </Suspense>
      )}
    </group>
  );
}
