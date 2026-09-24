"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A dome of stars that travels with the eye, like the sky, so no star can
// sit between the camera and the ground: a fixed shell inside the grown
// planet's reach used to scatter specks over the land.
const STAR_DISTANCE = 900;
export function Stars({ daylight }) {
  const dome = useRef();
  useFrame(({ camera }) => dome.current?.position.copy(camera.position));
  const geometry = useMemo(() => {
    const positions = [],
      colors = [],
      color = new THREE.Color();
    for (let i = 0; i < 380; i++) {
      const y = 1 - (i / 379) * 2,
        r = Math.sqrt(1 - y * y),
        a = i * 2.399963;
      positions.push(
        Math.cos(a) * r * STAR_DISTANCE,
        y * STAR_DISTANCE,
        Math.sin(a) * r * STAR_DISTANCE,
      );
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
    <points
      ref={dome}
      geometry={geometry}
      renderOrder={-10}
      frustumCulled={false}
      userData={{ sky: true }}
    >
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
