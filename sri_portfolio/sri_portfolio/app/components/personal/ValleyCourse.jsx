"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildBanks,
  buildTuftGeometry,
  buildWaterRibbon,
} from "../../lib/granite-geometry.mjs";
import { meadowTufts, outdoorsLift } from "../../lib/valley-layout.mjs";
import {
  createBankMaterial,
  createTuftMaterial,
  createWaterMaterial,
} from "../../lib/valley-materials.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";

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
      banks: buildBanks(heightAt),
      tuft: buildTuftGeometry(),
      tuftSpots,
      materials: {
        water: createWaterMaterial(),
        bank: createBankMaterial(),
        tuft: createTuftMaterial(),
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
      assets.banks.dispose();
      assets.tuft.dispose();
      Object.values(assets.materials).forEach((material) => material.dispose());
    },
    [assets],
  );
  useFrame((_, delta) => {
    if (!animate) return;
    assets.materials.water.userData.uniforms.uTime.value += Math.min(
      delta,
      0.05,
    );
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
      {assets.tuftSpots.length > 0 && (
        <instancedMesh
          ref={tufts}
          args={[assets.tuft, assets.materials.tuft, assets.tuftSpots.length]}
        />
      )}
    </group>
  );
}
