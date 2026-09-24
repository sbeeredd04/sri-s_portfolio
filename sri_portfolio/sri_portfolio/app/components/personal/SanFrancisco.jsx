"use client";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import usePbrSet from "./usePbrSet";
import {
  sfNeighborhoodBatches,
  apartmentBaseBatches,
  cityBatchGeometry,
  sfPalette,
  coitSite,
} from "../../lib/sf-neighborhood.mjs";
import {
  buildLandmarks,
  clockHandRadians,
  disposeLandmarks,
  marketClockMounts,
} from "../../lib/sf-landmarks.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { Boxes } from "./ScenePrimitives";

const landmarkFinish = {
  stone: { color: "#b7ad9f", roughness: 0.88 },
  pale: { color: "#d9d1c3", roughness: 0.84 },
  trim: { color: "#ebe3d4", roughness: 0.78 },
  oxide: { color: "#6d7b70", roughness: 0.7, metalness: 0.16 },
  towerGlass: {
    color: "#7b94a6",
    roughness: 0.18,
    metalness: 0.14,
    emissive: "#93aebb",
    intensity: 0.025,
  },
  shade: { color: "#617484", roughness: 0.4, metalness: 0.5 },
  glass: {
    color: "#314858",
    roughness: 0.28,
    metalness: 0.05,
    emissive: "#d5e2ea",
    intensity: 0.04,
  },
  glow: {
    color: "#e7c39a",
    roughness: 0.48,
    emissive: "#ffb56a",
    intensity: 0.4,
  },
  crown: {
    color: "#f4efe4",
    roughness: 0.62,
    emissive: "#ffd7a6",
    intensity: 0.26,
    day: 0.12,
  },
  louver: { color: "#c9d3db", roughness: 0.32, metalness: 0.62 },
  asphalt: { color: "#3a424b", roughness: 0.92 },
  paving: { color: "#8d9191", roughness: 0.9 },
  ink: { color: "#243038", roughness: 0.5 },
};

// Photographed finishes by tone: stucco facades and trim, metal roofs,
// asphalt streets and concrete pavers. "detail" keeps each tone's palette
// colour and adds the scan's structure; glass, rails and glow stay smooth.
const cityFinish = {
  ivory: ["plaster", 0.9, 1.1],
  sage: ["plaster", 0.9, 1.1],
  clay: ["plaster", 0.9, 1.1],
  trim: ["plaster", 1.4, 0.7],
  stone: ["concrete", 0.7, 1],
  door: ["plaster", 1.4, 0.6],
  roof: ["roof-metal", 0.6, 1],
  paving: ["pavers", 0.55, 1],
  asphalt: ["asphalt", 0.35, 1],
};
function TexturedCityBatch({ geometry, tone, night }) {
  const [set, scale, strength] = cityFinish[tone];
  const maps = usePbrSet(set);
  const material = useMemo(
    () =>
      applyTriplanar(
        new THREE.MeshStandardMaterial({
          color: sfPalette[tone],
          roughness: 0.86,
        }),
        {
          ...maps,
          mode: "detail",
          scale,
          strength: 0.8 * strength,
          normalStrength: strength,
          meanLuminance: 0.45,
        },
      ),
    [maps, tone, scale, strength],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  );
}
function PlainCityBatch({ geometry, tone, night }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={sfPalette[tone]}
        roughness={tone === "glass" ? 0.08 : 0.86}
        metalness={tone === "rail" ? 0.6 : tone === "glass" ? 0.2 : 0}
        emissive={tone === "glow" ? "#ffc883" : "#000"}
        emissiveIntensity={night ? 0.2 : 0}
      />
    </mesh>
  );
}
function CityMaterialBatch({ items, tone, night }) {
  const geometry = useMemo(() => cityBatchGeometry(items), [items]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const plain = <PlainCityBatch {...{ geometry, tone, night }} />;
  if (!cityFinish[tone]) return plain;
  return (
    <Suspense fallback={plain}>
      <TexturedCityBatch {...{ geometry, tone, night }} />
    </Suspense>
  );
}
function Batches({ data, night }) {
  return (
    <>
      {Object.entries(data).map(([tone, items]) => (
        <CityMaterialBatch key={tone} {...{ tone, items, night }} />
      ))}
    </>
  );
}
function FinishMesh({ geometry, tone, night }) {
  const finish = landmarkFinish[tone];
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={finish.color}
        roughness={finish.roughness}
        metalness={finish.metalness || 0}
        emissive={finish.emissive || "#000000"}
        emissiveIntensity={
          (finish.intensity || 0) * (night ? 1 : finish.day || 0)
        }
      />
    </mesh>
  );
}
function MarketClocks({ y, iso }) {
  const mounts = useMemo(() => marketClockMounts(y), [y]);
  const angles = useMemo(
    () => clockHandRadians(iso ? new Date(iso) : new Date()),
    [iso],
  );
  return mounts.map((mount) => (
    <group
      key={mount.position.join(":")}
      position={mount.position}
      quaternion={mount.quaternion}
    >
      <mesh>
        <circleGeometry args={[0.7, 28]} />
        <meshStandardMaterial color="#f4f0e8" roughness={0.7} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.74, 0.035, 8, 28]} />
        <meshStandardMaterial color="#2b3338" roughness={0.5} metalness={0.2} />
      </mesh>
      <group rotation={[0, 0, angles.hour]}>
        <mesh position={[0, 0.2, 0.03]}>
          <boxGeometry args={[0.045, 0.4, 0.02]} />
          <meshStandardMaterial color="#243038" />
        </mesh>
      </group>
      <group rotation={[0, 0, angles.minute]}>
        <mesh position={[0, 0.3, 0.045]}>
          <boxGeometry args={[0.028, 0.6, 0.016]} />
          <meshStandardMaterial color="#243038" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#243038" />
      </mesh>
    </group>
  ));
}
function Landmarks({ night, clockIso }) {
  const model = useMemo(() => buildLandmarks(), []);
  useEffect(() => () => disposeLandmarks(model), [model]);
  return (
    <group>
      {Object.entries(model.boxes).map(([tone, geometry]) => (
        <FinishMesh key={`box-${tone}`} {...{ geometry, tone, night }} />
      ))}
      {Object.entries(model.shells).map(([tone, geometry]) => (
        <FinishMesh key={`shell-${tone}`} {...{ geometry, tone, night }} />
      ))}
      <MarketClocks
        y={model.layout.marketPad.plinthTop + 15.15}
        iso={clockIso}
      />
    </group>
  );
}
function CoitTower() {
  const y = surfaceHeight("studio", coitSite.x, coitSite.z);
  const ribs = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return {
          position: [Math.sin(a) * 0.91, 5.8, Math.cos(a) * 0.91],
          size: [0.1, 8.8, 0.15],
          rotation: [0, a, 0],
          radius: 0.025,
        };
      }),
    [],
  );
  return (
    <group position={[coitSite.x, y, coitSite.z]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[3.7, 3.7, 0.24, 64]} />
        <meshStandardMaterial color="#8f9690" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.95, 1.1, 32]} />
        <meshStandardMaterial color="#ccc6b7" roughness={0.86} />
      </mesh>
      <mesh position={[0, 5.6, 0]} castShadow>
        <cylinderGeometry args={[0.82, 1.06, 9, 48]} />
        <meshStandardMaterial color="#d7d2c6" roughness={0.82} />
      </mesh>
      <Boxes items={ribs} color="#ddd6c8" roughness={0.86} />
      <mesh position={[0, 10.2, 0]}>
        <cylinderGeometry args={[1.16, 1.16, 1.35, 48]} />
        <meshStandardMaterial color="#384348" roughness={0.8} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 1.13, 10.3, Math.cos(a) * 1.13]}
            castShadow
          >
            <cylinderGeometry args={[0.17, 0.19, 1.9, 12]} />
            <meshStandardMaterial color="#d7d2c6" roughness={0.82} />
          </mesh>
        );
      })}
      {[9.5, 11.15].map((v) => (
        <mesh key={v} position={[0, v, 0]} castShadow>
          <cylinderGeometry args={[1.28, 1.28, 0.22, 48]} />
          <meshStandardMaterial color="#ded8ca" />
        </mesh>
      ))}
      <mesh position={[0, 11.4, 0]}>
        <sphereGeometry args={[1.18, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b8b6ad" roughness={0.84} />
      </mesh>
    </group>
  );
}
export function ApartmentBase({ night }) {
  const data = useMemo(apartmentBaseBatches, []);
  return <Batches data={data} night={night} />;
}
export default function SanFrancisco({ night, clockIso }) {
  const data = useMemo(sfNeighborhoodBatches, []);
  return (
    <group>
      <Batches data={data} night={night} />
      <CoitTower />
      <Landmarks night={night} clockIso={clockIso} />
    </group>
  );
}
