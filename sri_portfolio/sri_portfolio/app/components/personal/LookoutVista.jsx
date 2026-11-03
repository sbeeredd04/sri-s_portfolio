"use client";
import { useMemo, useEffect } from "react";
import { Vector2, MeshStandardMaterial } from "three";
import usePbrSet from "./usePbrSet";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import { Boxes, Rods } from "./ScenePrimitives";
import {
  buildLookoutIsland,
  lookoutVista as vista,
} from "../../lib/lookout-vista.mjs";

// A single coastal landmark: tapered limewashed tower, copper lantern roof,
// gallery rail and an exposed rock shelf. Reuses the world’s granite set; no
// shadow lights, transparency layers or continuous animation are required.
export default function LookoutVista({ night }) {
  const island = useMemo(buildLookoutIsland, []);
  const stone = usePbrSet("granite-cliff");
  const cliffMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      vertexColors: true,
      color: "#687773",
      roughness: 0.97,
    });
    applyTriplanar(material, {
      ...stone,
      scale: 0.32,
      mode: "detail",
      strength: 0.85,
      normalStrength: 0.7,
    });
    return material;
  }, [stone]);
  useEffect(() => () => cliffMaterial.dispose(), [cliffMaterial]);
  useEffect(() => () => island.dispose(), [island]);
  const profile = useMemo(
    () =>
      [
        [0, 0],
        [1.38, 0],
        [1.38, 0.24],
        [1.2, 0.32],
        [1.14, 0.55],
        [0.81, 6.2],
        [0.86, 6.28],
        [0.86, 6.45],
        [1.22, 6.58],
        [1.22, 6.78],
        [0, 6.78],
      ].map(([x, y]) => new Vector2(x, y)),
    [],
  );
  const rails = useMemo(() => {
    const result = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        b = ((i + 1) * Math.PI) / 8;
      const x = Math.sin(a) * 1.13,
        z = Math.cos(a) * 1.13;
      result.push({ from: [x, 6.78, z], to: [x, 7.39, z], radius: 0.022 });
      for (const y of [7.05, 7.39])
        result.push({
          from: [x, y, z],
          to: [Math.sin(b) * 1.13, y, Math.cos(b) * 1.13],
          radius: 0.024,
        });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      result.push({
        from: [Math.sin(a) * 0.64, 6.8, Math.cos(a) * 0.64],
        to: [Math.sin(a) * 0.64, 7.94, Math.cos(a) * 0.64],
        radius: 0.035,
      });
    }
    return result;
  }, []);
  const openings = useMemo(
    () => [
      { position: [0, 0.85, -1.11], size: [0.48, 1.35, 0.075], radius: 0.09 },
      { position: [0, 3.2, -0.99], size: [0.26, 0.65, 0.075], radius: 0.035 },
      { position: [0, 5.15, -0.88], size: [0.26, 0.65, 0.075], radius: 0.035 },
    ],
    [],
  );
  return (
    <group position={[vista.center[0], 0, vista.center[1]]}>
      <mesh geometry={island} material={cliffMaterial} receiveShadow />
      <group position={[0, vista.top, 0]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[profile, 40]} />
          <meshStandardMaterial color="#e6dfcc" roughness={0.88} />
        </mesh>
        <mesh position={[0, 5.72, 0]}>
          <cylinderGeometry args={[0.853, 0.88, 0.52, 40]} />
          <meshStandardMaterial color="#9b4c38" roughness={0.8} />
        </mesh>
        <Boxes items={openings} color="#263438" roughness={0.7} />
        <Rods segments={rails} color="#28393c" />
        <mesh position={[0, 7.36, 0]}>
          <cylinderGeometry args={[0.61, 0.61, 1.1, 8]} />
          <meshStandardMaterial
            color={night ? "#dbb77f" : "#739093"}
            emissive="#ffc780"
            emissiveIntensity={night ? 1.8 : 0.08}
            roughness={0.28}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 7.96, 0]}>
          <cylinderGeometry args={[0.81, 0.81, 0.12, 32]} />
          <meshStandardMaterial
            color="#314c4b"
            roughness={0.58}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[0, 8.2, 0]}>
          <coneGeometry args={[0.84, 0.48, 32]} />
          <meshStandardMaterial
            color="#46635c"
            roughness={0.7}
            metalness={0.25}
          />
        </mesh>
      </group>
    </group>
  );
}
