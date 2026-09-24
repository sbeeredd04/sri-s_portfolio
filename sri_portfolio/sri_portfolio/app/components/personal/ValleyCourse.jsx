"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildBanks,
  buildTuftGeometry,
  buildWaterRibbon,
} from "../../lib/granite-geometry.mjs";
import {
  meadowTufts,
  outdoorsLift,
  watercoursePoints,
} from "../../lib/valley-layout.mjs";
import {
  createBankMaterial,
  createMistMaterial,
  createTuftMaterial,
  createWaterMaterial,
} from "../../lib/valley-materials.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";

const MIST_COUNT = 70;
// Spawn points scattered across the landing where the fall meets the pool.
function mistGeometry() {
  const toe = watercoursePoints().find((point) => point.ground);
  const positions = [],
    seeds = [];
  for (let i = 0; i < MIST_COUNT; i++) {
    const a = i * 2.39996,
      r = 0.5 * Math.sqrt((i + 0.5) / MIST_COUNT);
    positions.push(
      toe.x + Math.cos(a) * r,
      toe.y + 0.05,
      toe.z + Math.sin(a) * r,
    );
    seeds.push((i * 0.61803) % 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
  return geometry;
}

export default function ValleyCourse({ animate }) {
  const tufts = useRef(null);
  const assets = useMemo(() => {
    const heightAt = (x, z) =>
      renderedSurfaceHeight("trail", x, z) - outdoorsLift;
    const tuftSpots = meadowTufts().map((tuft) => ({
      ...tuft,
      y: heightAt(tuft.x, tuft.z),
    }));
    return {
      water: buildWaterRibbon(),
      mist: mistGeometry(),
      banks: buildBanks(heightAt),
      tuft: buildTuftGeometry(),
      tuftSpots,
      materials: {
        water: createWaterMaterial(),
        bank: createBankMaterial(),
        tuft: createTuftMaterial(),
        mist: createMistMaterial(),
      },
    };
  }, []);
  useLayoutEffect(() => {
    if (!tufts.current) return;
    const object = new THREE.Object3D();
    assets.tuftSpots.forEach((tuft, index) => {
      object.position.set(tuft.x, tuft.y, tuft.z);
      object.rotation.set(0, tuft.turn, 0);
      object.scale.setScalar(tuft.s);
      object.updateMatrix();
      tufts.current.setMatrixAt(index, object.matrix);
    });
    tufts.current.instanceMatrix.needsUpdate = true;
    tufts.current.computeBoundingSphere();
  }, [assets]);
  useEffect(
    () => () => {
      assets.water.dispose();
      assets.mist.dispose();
      assets.banks.dispose();
      assets.tuft.dispose();
      Object.values(assets.materials).forEach((material) => material.dispose());
    },
    [assets],
  );
  useFrame((state, delta) => {
    assets.materials.mist.userData.uniforms.uScale.value =
      state.size.height * state.viewport.dpr * 0.26;
    if (!animate) return;
    const step = Math.min(delta, 0.05);
    assets.materials.water.userData.uniforms.uTime.value += step;
    assets.materials.mist.userData.uniforms.uTime.value += step;
  });
  return (
    <group>
      <mesh
        geometry={assets.banks}
        material={assets.materials.bank}
        receiveShadow
      />
      <mesh
        geometry={assets.water}
        material={assets.materials.water}
        renderOrder={2}
      />
      <points
        geometry={assets.mist}
        material={assets.materials.mist}
        renderOrder={3}
        frustumCulled={false}
      />
      {assets.tuftSpots.length > 0 && (
        <instancedMesh
          ref={tufts}
          args={[assets.tuft, assets.materials.tuft, assets.tuftSpots.length]}
        />
      )}
    </group>
  );
}
