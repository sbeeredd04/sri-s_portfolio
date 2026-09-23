"use client";
import { useArtworkTexture } from "./ArtworkTexture";
import * as THREE from "three";
import { studioProps } from "../../lib/studio-layout.mjs";
import { Box, Boxes } from "./ScenePrimitives";

export function Mug() {
  return (
    <group scale={studioProps.mug.scale}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.145, 0.127, 0.29, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#b4c5df"
          roughness={0.25}
          clearcoat={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.132, 0]} receiveShadow>
        <cylinderGeometry args={[0.126, 0.123, 0.024, 28]} />
        <meshStandardMaterial color="#99aac6" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.139, 0.012, 8, 36]} />
        <meshPhysicalMaterial
          color="#d3dff1"
          roughness={0.22}
          clearcoat={0.5}
        />
      </mesh>
      <mesh
        position={[0.17, 0.015, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      >
        <torusGeometry args={[0.092, 0.027, 10, 28]} />
        <meshPhysicalMaterial
          color="#b4c5df"
          roughness={0.25}
          clearcoat={0.55}
        />
      </mesh>
    </group>
  );
}
const pageEdges = Array.from({ length: 24 }, (_, i) => ({
  position: [0.008, -0.03 + i * 0.0025, 0.309],
  size: [0.392, 0.0005, 0.001],
  radius: 0.0001,
}));
export function ReadingBook() {
  const texture = useArtworkTexture("/official/steve-jobs.webp");
  return (
    <group scale={studioProps.book.scale}>
      <Box
        size={[0.414, 0.09, 0.63]}
        color="#f2efe9"
        radius={0.012}
        roughness={0.88}
      />
      <Box
        position={[0.008, 0, 0.004]}
        size={[0.396, 0.063, 0.608]}
        color="#e3e5ec"
        radius={0.003}
        roughness={0.98}
      />
      <Boxes items={pageEdges} color="#bcb5a9" roughness={1} />
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.414, 0.63]} />
        <meshStandardMaterial map={texture} roughness={0.58} />
      </mesh>
      <Box
        position={[0.05, 0.012, 0.33]}
        size={[0.045, 0.008, 0.08]}
        color="#9495bd"
        radius={0.003}
      />
    </group>
  );
}
export function Cushion() {
  return (
    <group>
      <Box
        size={[0.48, 0.48, 0.2]}
        color="#c8c2e0"
        radius={0.095}
        roughness={0.98}
      />
      <Box
        size={[0.445, 0.445, 0.206]}
        color="#b8b2d2"
        radius={0.088}
        roughness={0.98}
      />
      <Box
        size={[0.428, 0.428, 0.218]}
        color="#d0cae5"
        radius={0.085}
        roughness={0.98}
      />
    </group>
  );
}
export function StaticStudioProps() {
  return (
    <>
      <group position={studioProps.mug.position}>
        <Mug />
      </group>
      <group position={studioProps.book.position}>
        <ReadingBook />
      </group>
      <group position={studioProps.cushion.position} rotation={[0, 0.2, 0.1]}>
        <Cushion />
      </group>
    </>
  );
}
