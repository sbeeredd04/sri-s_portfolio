"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";
import {
  blocksValleyPlanting,
  distanceToOverlook,
  trailCenter,
} from "../../lib/valley-layout.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";

import { courtPlanting } from "../../lib/court-layout.mjs";

const fraction = (n) => n - Math.floor(n);
const random = (i, salt = 0) =>
  fraction(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453);

function plantingBeds(biome) {
  const plants = [];
  const add = (x, z, i) =>
    plants.push({
      x,
      z,
      y:
        biome === "trail"
          ? renderedSurfaceHeight(biome, x, z)
          : surfaceHeight(biome, x, z),
      height:
        biome === "trail"
          ? 0.13 + random(i, 2) * 0.16
          : 0.24 + random(i, 2) * 0.26,
      angle: random(i, 3) * Math.PI * 2,
      flower: i % (biome === "trail" ? 13 : 4) === 0,
    });
  if (biome === "studio") {
    // Low borders beside the house leave the porch and stepping stones clear.
    for (let i = 0; i < 66; i++) {
      const side = i % 2 ? 1 : -1;
      add(side * (7.05 + random(i) * 1.1), -3.4 + Math.floor(i / 2) * 0.3, i);
    }
    for (let i = 0; i < 32; i++)
      add(-2.5 + i * 0.25, 6.1 + random(i, 4) * 0.7, i + 70);
  } else if (biome === "court") {
    courtPlanting.forEach(({ x, z }, i) => add(x, z, i));
  } else if (biome === "projects") {
    // Perennial borders frame the square and the two larger workshops.
    // Keep all approach paths, doorways, and local cameras clear.
    for (let i = 0; i < 110; i++) {
      const side = i % 2 ? 1 : -1;
      add(side * (10.8 + random(i) * 1.1), -4.3 + Math.floor(i / 2) * 0.25, i);
    }
    for (let i = 0; i < 96; i++)
      add(-12.5 + i * 0.28, -14 + random(i, 4) * 1.1, i + 120);
  } else {
    // Uneven meadow pockets leave breathing room beside water and the route.
    const pockets = [
      [-5, 3],
      [-3, -10],
      [1, -10],
      [4, 1],
      [6, -3],
      [-12, 2],
      [-15, -5],
      [4, -10],
    ];
    pockets.forEach(([cx, cz], cluster) => {
      for (let n = 0; n < 14; n++) {
        const i = cluster * 14 + n,
          angle = random(i, 7) * Math.PI * 2,
          r = 0.25 + random(i, 8) * 1.2;
        const x = cx + Math.cos(angle) * r,
          z = cz + Math.sin(angle) * r;
        if (
          blocksValleyPlanting(x, z, 0.32) ||
          Math.abs(x - trailCenter(z)) < 1.15 ||
          distanceToOverlook(x, z) < 1.15
        )
          continue;
        add(x, z, i);
      }
    });
  }
  return plants;
}

// A tapered, curved leaf is more legible than a flat billboard at close range.
function leafGeometry() {
  const positions = [],
    indices = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6,
      width = Math.sin(Math.PI * t) * 0.105 + 0.004;
    positions.push(-width, t, t * t * 0.35, width, t, t * t * 0.35);
    if (i < 6) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function TerrainPlanting({ biome, visible, animate }) {
  const leaves = useRef(),
    flowers = useRef(),
    time = useRef(0);
  const plants = useMemo(() => plantingBeds(biome), [biome]);
  const flowering = useMemo(() => plants.filter((p) => p.flower), [plants]);
  const geometry = useMemo(leafGeometry, []);
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.92,
      side: THREE.DoubleSide,
    });
    const wind = { value: 0 };
    mat.userData.wind = wind;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = wind;
      shader.vertexShader =
        "uniform float uWindTime;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        float phase=instanceMatrix[3].x*.53+instanceMatrix[3].z*.37;
        transformed.x+=sin(uWindTime*.85+phase)*.075*position.y*position.y;`,
        );
    };
    return mat;
  }, []);
  useLayoutEffect(() => {
    const object = new THREE.Object3D(),
      color = new THREE.Color();
    plants.forEach((plant, i) => {
      for (let j = 0; j < 5; j++) {
        object.position.set(plant.x, plant.y + 0.015, plant.z);
        object.rotation.set(0.16 + j * 0.035, plant.angle + j * 2.4, 0);
        object.scale.setScalar(plant.height * (0.7 + (j % 3) * 0.18));
        object.updateMatrix();
        leaves.current.setMatrixAt(i * 5 + j, object.matrix);
        color.set(
          (biome === "trail"
            ? ["#60683d", "#7c8150", "#949363", "#54603c"]
            : ["#718e91", "#829a9b", "#9eafb7", "#818baa"])[i % 4],
        );
        leaves.current.setColorAt(i * 5 + j, color);
      }
    });
    flowering.forEach((plant, i) => {
      object.position.set(plant.x, plant.y + plant.height * 0.88, plant.z);
      object.rotation.set(0.1, plant.angle, 0.15);
      object.scale.set(0.055, 0.095, 0.055);
      object.updateMatrix();
      flowers.current.setMatrixAt(i, object.matrix);
      color.set(i % 3 ? "#b5a9d3" : "#dce4e7");
      flowers.current.setColorAt(i, color);
    });
    for (const mesh of [leaves.current, flowers.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [plants, flowering, biome]);
  useFrame((_, delta) => {
    if (animate) time.current += Math.min(delta, 0.05);
    material.userData.wind.value = time.current;
  });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <group visible={visible}>
      <instancedMesh
        ref={leaves}
        args={[geometry, material, plants.length * 5]}
        receiveShadow
      />
      <instancedMesh
        ref={flowers}
        args={[undefined, undefined, flowering.length]}
        receiveShadow
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial roughness={0.87} />
      </instancedMesh>
    </group>
  );
}
