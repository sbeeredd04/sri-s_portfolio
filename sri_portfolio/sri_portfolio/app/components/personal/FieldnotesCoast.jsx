"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { fieldnotesCoastSource } from "../../lib/fieldnotes-coast-site.mjs";

const bladeName = "Fieldnotes_SignalBlade";
const amberName = "Fieldnotes_AmberSlot";
const shadowCasters = new Set([bladeName, "Fieldnotes_Cypress", "Fieldnotes_Pier"]);

function ignoreRaycast() {}

export default function FieldnotesCoast({ night }) {
  const { scene } = useGLTF(fieldnotesCoastSource);
  const coast = useMemo(() => {
    const root = scene.clone(true);
    const materials = new Map();
    let amber;
    root.traverse((object) => {
      if (!object.isMesh) return;
      const original = object.material;
      if (!materials.has(original)) {
        const material = original.clone();
        material.roughness = 0.9;
        material.metalness = 0;
        material.envMapIntensity = 0.35;
        materials.set(original, material);
      }
      object.material = materials.get(original);
      object.receiveShadow = true;
      object.castShadow = shadowCasters.has(object.name);
      // These static meshes have no actions. Skip their rays so close plant
      // and terrain triangles do not intercept writing or lounge controls.
      object.raycast = ignoreRaycast;
      if (object.name === amberName) {
        amber = object.material;
        amber.emissive.set("#ffb547");
      }
    });
    return { root, materials, amber };
  }, [scene]);

  useEffect(() => {
    if (coast.amber) coast.amber.emissiveIntensity = night ? 2.35 : 0.8;
  }, [coast, night]);

  useEffect(
    () => () => {
      for (const material of coast.materials.values()) material.dispose();
    },
    [coast],
  );

  return <primitive object={coast.root} />;
}
