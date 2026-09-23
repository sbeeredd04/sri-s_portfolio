"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function Stars({ daylight }) {
  const geometry = useMemo(() => {
    const positions = [],
      colors = [],
      color = new THREE.Color();
    for (let i = 0; i < 380; i++) {
      const y = 1 - (i / 379) * 2,
        r = Math.sqrt(1 - y * y),
        a = i * 2.399963;
      positions.push(Math.cos(a) * r * 650, y * 650, Math.sin(a) * r * 650);
      color.set(["#b4cce9", "#dad6ec", "#9cbbdc", "#e7dfcd"][i % 4]);
      color.multiplyScalar(0.3 + ((i * 17) % 13) / 20);
      colors.push(color.r, color.g, color.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} renderOrder={-10}>
      <pointsMaterial
        vertexColors
        size={1.25}
        sizeAttenuation={false}
        transparent
        opacity={0.7 - daylight * 0.58}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
