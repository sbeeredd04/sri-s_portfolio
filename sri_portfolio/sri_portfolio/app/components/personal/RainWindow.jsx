"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box } from "./ScenePrimitives";

// Streaks beyond the glass follow the live weather: none on a dry day.
export default function RainWindow({ animate, night, rain = 0 }) {
  const streaks = useRef();
  const positions = useMemo(() => {
    const data = new Float32Array(220 * 6);
    for (let i = 0; i < 220; i++) {
      const x = ((i * 0.61803398875) % 1) * 18 - 9;
      const y = ((i * 0.41421356) % 1) * 8;
      const z = -5 - (i % 13) * 0.5;
      data.set([x, y, z, x - 0.03, y + 0.19, z], i * 6);
    }
    return data;
  }, []);
  useFrame((_, delta) => {
    if (!animate || rain < 0.03) return;
    const dt = Math.min(delta, 0.05);
    const a = streaks.current.geometry.attributes.position;
    for (let i = 0; i < 220; i++) {
      let y = a.array[i * 6 + 1] - dt * (2.5 + (i % 5) * 0.23);
      if (y < -0.8) y = 8;
      a.array[i * 6 + 1] = y;
      a.array[i * 6 + 4] = y + 0.19;
    }
    a.needsUpdate = true;
  });
  return (
    <group>
      {[-6.25, -3.12, 0, 3.12, 6.25].map((x) => (
        <Box
          key={x}
          position={[x, 1.82, -3.96]}
          size={[0.065, 3.34, 0.1]}
          color="#455568"
          metalness={0.6}
          radius={0.009}
        />
      ))}
      {[0.22, 3.43].map((y) => (
        <Box
          key={y}
          position={[0, y, -3.96]}
          size={[12.6, 0.12, 0.18]}
          color="#455568"
          metalness={0.6}
          radius={0.015}
        />
      ))}
      <mesh position={[0, 1.82, -3.98]}>
        <planeGeometry args={[12.45, 3.1]} />
        <meshPhysicalMaterial
          color="#adc5de"
          transparent
          opacity={0.08}
          roughness={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments ref={streaks} frustumCulled={false} visible={rain >= 0.03}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#c8e3ff"
          transparent
          opacity={(night ? 0.3 : 0.16) * Math.min(1, 0.4 + rain)}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
