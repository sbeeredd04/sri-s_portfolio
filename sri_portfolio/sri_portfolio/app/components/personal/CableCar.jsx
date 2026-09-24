"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Boxes } from "./ScenePrimitives";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { cableLine } from "../../lib/sf-plan.mjs";

const ground = (x, z) => surfaceHeight("studio", x, z);

// A Powell-style car, 8.3 m long: maroon lower panels, cream upper body,
// an open grip section with outward benches, and a clerestory roof.
function carParts() {
  const maroon = [],
    cream = [],
    dark = [],
    wood = [];
  const L = 8.3,
    W = 2.4;
  maroon.push({ position: [0, 0.8, 0], size: [W, 0.8, L] });
  cream.push({ position: [0, 1.75, -1.9], size: [W - 0.06, 1.1, 4.4] });
  cream.push({ position: [0, 1.75, 3.45], size: [W - 0.06, 1.1, 1.3] });
  for (const z of [-3.9, -2.9, -1.9, -0.9, 0.1])
    dark.push({ position: [0, 1.85, z], size: [W - 0.02, 0.62, 0.7] });
  // Open grip section: posts and outward-facing benches.
  for (const z of [0.55, 1.35, 2.15, 2.8])
    for (const side of [-1, 1])
      cream.push({ position: [side * (W / 2 - 0.05), 1.75, z], size: [0.08, 1.1, 0.08] });
  for (const side of [-1, 1])
    wood.push({ position: [side * 0.55, 1.28, 1.7], size: [0.5, 0.08, 2.4] });
  // Roof, clerestory and end dashes.
  dark.push({ position: [0, 2.38, 0], size: [W + 0.18, 0.12, L + 0.2] });
  cream.push({ position: [0, 2.55, -0.4], size: [1.1, 0.22, L - 1.6] });
  maroon.push({ position: [0, 1.4, L / 2 - 0.08], size: [W - 0.2, 0.5, 0.16] });
  maroon.push({ position: [0, 1.4, -L / 2 + 0.08], size: [W - 0.2, 0.5, 0.16] });
  // Trucks with wheels on the rails, and running boards along both sides.
  for (const z of [-2.6, 2.6]) {
    dark.push({ position: [0, 0.3, z], size: [1.5, 0.3, 1.6] });
    for (const dz of [-0.55, 0.55])
      for (const side of [-1, 1])
        dark.push({ position: [side * 0.8, 0.27, z + dz], size: [0.12, 0.54, 0.54], radius: 0.25 });
  }
  for (const side of [-1, 1])
    wood.push({ position: [side * (W / 2 + 0.16), 0.48, 0.3], size: [0.3, 0.06, L - 1.2] });
  // End windows, the destination board and a headlamp at each end.
  for (const end of [-1, 1]) {
    dark.push({ position: [0, 1.85, end * (L / 2 - 0.02)], size: [1.6, 0.6, 0.06] });
    cream.push({ position: [0, 2.12, end * (L / 2 + 0.02)], size: [1.2, 0.2, 0.06] });
    cream.push({ position: [0, 1.3, end * (L / 2 + 0.1)], size: [0.22, 0.22, 0.12], radius: 0.1 });
  }
  return { maroon, cream, dark, wood };
}

// Rails and the cable slot, laid on the street surface along the line.
function railItems() {
  const [x, z0, z1] = [cableLine.x, cableLine.from, cableLine.to];
  const items = [];
  for (let z = z0; z < z1; z += 1) {
    const y = (ground(x, z) + ground(x, z + 1)) / 2 + 0.012;
    const pitch = -Math.atan2(ground(x, z + 1) - ground(x, z), 1);
    for (const dx of [-0.8, -0.05, 0.05, 0.8])
      items.push({
        position: [x + dx, y, z + 0.5],
        size: [dx === -0.05 || dx === 0.05 ? 0.04 : 0.07, 0.02, 1.01],
        rotation: [pitch, 0, 0],
      });
  }
  return items;
}

// Runs the line end to end, dwelling a few seconds at each terminus.
export default function CableCar({ animate }) {
  const parts = useMemo(carParts, []);
  const rails = useMemo(railItems, []);
  const car = useRef();
  const state = useRef({ z: cableLine.from + 20, dir: 1, dwell: 0 });
  const place = () => {
    const s = state.current,
      x = cableLine.x;
    const y0 = ground(x, s.z - 3),
      y1 = ground(x, s.z + 3);
    car.current.position.set(x, (y0 + y1) / 2, s.z);
    car.current.rotation.set(-Math.atan2(y1 - y0, 6), s.dir > 0 ? 0 : Math.PI, 0);
  };
  useFrame((_, dt) => {
    if (!car.current) return;
    const s = state.current;
    if (animate) {
      if (s.dwell > 0) s.dwell -= dt;
      else {
        s.z += s.dir * cableLine.speed * Math.min(dt, 0.05);
        if (s.z > cableLine.to - 5 || s.z < cableLine.from + 5) {
          s.z = THREE.MathUtils.clamp(s.z, cableLine.from + 5, cableLine.to - 5);
          s.dir *= -1;
          s.dwell = 6;
        }
      }
    }
    place();
  });
  return (
    <group>
      <Boxes items={rails} color="#5d6064" metalness={0.7} roughness={0.35} />
      <group ref={car}>
        <Boxes items={parts.maroon} color="#6e1f23" roughness={0.45} />
        <Boxes items={parts.cream} color="#e8dcc0" roughness={0.6} />
        <Boxes items={parts.dark} color="#26292c" roughness={0.3} metalness={0.2} />
        <Boxes items={parts.wood} color="#8a5a34" roughness={0.7} />
      </group>
    </group>
  );
}
