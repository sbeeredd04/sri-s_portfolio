"use client";
import { useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  outThereLiveSource,
  outThereCamp as camp,
} from "../../lib/out-there-site.mjs";

export default function CampClearing() {
  const { scene } = useGLTF(outThereLiveSource);
  const geometry = useMemo(() => {
    scene.updateMatrixWorld(true);
    const terrain = scene.getObjectByName("terrain");
    const ray = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, -1, 0),
    );
    const sample = (x, z) => {
      ray.ray.origin.set(x * 1.56, 60, z * 1.56);
      const hit = terrain && ray.intersectObject(terrain, true)[0];
      return hit ? (hit.point.y + 6) / 1.56 : camp.bottom;
    };
    const positions = [],
      colors = [],
      indices = [];
    const tones = ["#a18d65", "#a18d65", "#91804f", "#8e934f"].map(
      (s) => new THREE.Color(s),
    );
    const radii = [0.01, 1.88, camp.radius, 4.5],
      sectors = 24;
    for (let j = 0; j < radii.length; j++)
      for (let i = 0; i < sectors; i++) {
        const angle = (i / sectors) * Math.PI * 2;
        const radius =
          radii[j] +
          (j === 3
            ? 0.19 * Math.sin(angle * 3.0) + 0.12 * Math.sin(angle * 7.0)
            : 0);
        const x = camp.x + Math.cos(angle) * radius,
          z = camp.z + Math.sin(angle) * radius;
        positions.push(x, j === 3 ? sample(x, z) + 0.017 : camp.y, z);
        const c = tones[j]
          .clone()
          .multiplyScalar(0.97 + 0.03 * Math.sin(i * 2.23 + j * 0.7));
        colors.push(c.r, c.g, c.b);
        if (j > 0) {
          const a = (j - 1) * sectors + i,
            b = (j - 1) * sectors + ((i + 1) % sectors),
            c = j * sectors + i,
            d = j * sectors + ((i + 1) % sectors);
          indices.push(a, b, c, b, d, c);
        }
      }
    for (let i = 1; i < sectors - 1; i++) indices.push(0, i + 1, i);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [scene]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}
