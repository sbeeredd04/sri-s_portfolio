"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import {
  buildDeck,
  buildGraniteForm,
  buildTalusGeometry,
  embedBase,
} from "../../lib/granite-geometry.mjs";
import {
  graniteForms,
  outdoorsLift,
  talusSpots,
} from "../../lib/valley-layout.mjs";
import { createGraniteMaterial } from "../../lib/valley-materials.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import usePbrSet from "./usePbrSet";

// Blender-sculpted formations (scripts/blender): fractured faces, sheeting
// and ledges baked to normal maps; every vertex stays inside the same
// exclusion envelope as the procedural forms, so trail clearance holds.
const sculpted = {
  wall: "/models/granite-wall.glb",
  dome: "/models/granite-dome.glb",
  ridge: "/models/granite-ridge.glb",
};
function SculptedForm({ form, granite, heightAt }) {
  const { scene } = useGLTF(sculpted[form.kind]);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = node.receiveShadow = true;
      // Keep the baked sculpt normals; take colour/roughness from the scan.
      node.material = applyTriplanar(node.material.clone(), {
        albedo: granite.albedo,
        roughness: granite.roughness,
        scale: 0.16,
        strength: 0.85,
      });
    });
    return clone;
  }, [scene, granite]);
  // Seat the base on the lowest ground under the footprint so no edge floats.
  const y = useMemo(() => {
    let low = Infinity;
    for (const sx of [-1, 0, 1])
      for (const sz of [-1, 0, 1])
        low = Math.min(low, heightAt(form.x + sx * form.hx * 0.7, form.z + sz * form.hz * 0.7));
    return low;
  }, [form, heightAt]);
  return (
    <primitive
      object={object}
      position={[form.x, y, form.z]}
      rotation={[0, -form.turn, 0]}
    />
  );
}
function SculptedForms({ granite, heightAt }) {
  return graniteForms.map((form) => (
    <SculptedForm key={form.kind} {...{ form, granite, heightAt }} />
  ));
}

export default function GraniteValley() {
  const talusRef = useRef(null);
  const granite = usePbrSet("granite");
  const assets = useMemo(() => {
    const heightAt = (x, z) =>
      renderedSurfaceHeight("trail", x, z) - outdoorsLift;
    return {
      heightAt,
      // Photographed granite over the procedural weathering: the scan gives
      // crystal grain and fractures, the procedural pass keeps streaks.
      material: applyTriplanar(createGraniteMaterial(), {
        ...granite,
        scale: 0.16,
        strength: 0.9,
        normalStrength: 1.4,
      }),
      forms: graniteForms.map((form) =>
        embedBase(buildGraniteForm(form), heightAt),
      ),
      talus: buildTalusGeometry(),
      deck: buildDeck(heightAt),
      spots: talusSpots().map((spot) => ({
        ...spot,
        y: heightAt(spot.x, spot.z) - 0.06,
      })),
    };
  }, [granite]);
  useLayoutEffect(() => {
    if (!talusRef.current) return;
    const object = new THREE.Object3D();
    assets.spots.forEach((spot, index) => {
      object.position.set(spot.x, spot.y, spot.z);
      object.rotation.set(0, spot.turn, 0);
      object.scale.setScalar(spot.scale);
      object.updateMatrix();
      talusRef.current.setMatrixAt(index, object.matrix);
    });
    talusRef.current.instanceMatrix.needsUpdate = true;
    talusRef.current.computeBoundingSphere();
  }, [assets]);
  useEffect(
    () => () => {
      assets.material.dispose();
      assets.forms.forEach((geometry) => geometry.dispose());
      assets.talus.dispose();
      assets.deck.dispose();
    },
    [assets],
  );
  return (
    <group>
      <SculptedForms granite={granite} heightAt={assets.heightAt} />
      <mesh
        geometry={assets.deck}
        material={assets.material}
        receiveShadow
        castShadow
      />
      {assets.spots.length > 0 && (
        <instancedMesh
          ref={talusRef}
          args={[assets.talus, assets.material, assets.spots.length]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
