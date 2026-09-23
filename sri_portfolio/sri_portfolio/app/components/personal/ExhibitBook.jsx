"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Rods } from "./ScenePrimitives";
import {
  exhibitActionAt,
  projectExhibits,
} from "../../lib/project-exhibits.mjs";

function pageGeometry(width, height) {
  const positions = [],
    uv = [],
    indices = [],
    columns = 48,
    rows = 12;
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= columns; x++) {
      const u = x / columns,
        v = y / rows;
      const bend =
        0.32 * Math.abs(u - 0.5) * 2 + 0.035 * Math.sin(u * Math.PI * 2) ** 2;
      positions.push((u - 0.5) * width, (v - 0.5) * height, bend);
      uv.push(u, v);
      if (x < columns && y < rows) {
        const k = y * (columns + 1) + x;
        indices.push(
          k,
          k + 1,
          k + columns + 1,
          k + 1,
          k + columns + 2,
          k + columns + 1,
        );
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
const legs = [-1, 1].flatMap((side) =>
  [-0.32, 0.32].map((z) => ({
    from: [side * 0.98, 0.15, z],
    to: [side * 0.98, 0.97, z],
    radius: 0.035,
  })),
);
export default function ExhibitBook({ id, screen, onChange, onHover, wood }) {
  const paper = useMemo(() => pageGeometry(2.58, 1.72), []);
  const cover = useMemo(() => pageGeometry(2.7, 1.84), []);
  useEffect(
    () => () => {
      paper.dispose();
      cover.dispose();
    },
    [paper, cover],
  );
  return (
    <group>
      <Box
        position={[0, 0.94, -0.05]}
        size={[2.9, 0.11, 1.25]}
        color="#b1a18a"
        map={wood}
        radius={0.045}
      />
      <Rods segments={legs} color="#6e655a" />
      <group position={[0, 1.91, -0.17]} rotation={[-0.14, 0, 0]}>
        <mesh
          geometry={cover}
          position={[0, 0, -0.047]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#8d6950"
            roughness={0.87}
            side={THREE.DoubleSide}
          />
        </mesh>
        {[-0.025, -0.015, -0.005].map((z, i) => (
          <mesh key={z} geometry={paper} position={[0, 0, z]}>
            <meshStandardMaterial
              color={i % 2 ? "#b8ac92" : "#ddceaf"}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        <mesh
          geometry={paper}
          position={[0, 0, 0.002]}
          onPointerMove={(e) => {
            e.stopPropagation();
            const idAt = exhibitActionAt(id, e.uv);
            const step = projectExhibits[id].steps.find((s) => s.id === idAt);
            onHover(
              step
                ? step.label
                : "Choose a chapter along the bottom of the book.",
            );
          }}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={() => onHover("")}
          onClick={(e) => {
            e.stopPropagation();
            const action = exhibitActionAt(id, e.uv);
            if (e.delta <= 4 && action) onChange(id, action);
          }}
        >
          <meshBasicMaterial
            map={screen}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Box
          position={[0, -0.67, 0.022]}
          size={[0.008, 0.46, 0.012]}
          color="#c4a17e"
          radius={0.002}
        />
      </group>
      <Box
        position={[0, 1.022, 0.28]}
        size={[2.73, 0.05, 0.085]}
        color="#88715a"
        map={wood}
        radius={0.012}
      />
    </group>
  );
}
