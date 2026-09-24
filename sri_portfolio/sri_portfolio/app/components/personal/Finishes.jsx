"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import usePbrSet from "./usePbrSet";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import { roundedBox } from "../../lib/model-geometry.mjs";

// Photographed CC0 finishes laid on in world space, keeping each surface's
// palette colour and adding real grain (concrete, metal roofs, timber,
// plaster, pavers). Callers sit inside a local Suspense.
export function useFinish(set, color, { scale = 0.5, strength = 0.8 } = {}) {
  const maps = usePbrSet(set);
  const material = useMemo(
    () =>
      applyTriplanar(
        new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
        {
          ...maps,
          mode: "detail",
          scale,
          strength,
          normalStrength: 0.9,
          meanLuminance: 0.45,
        },
      ),
    [maps, color, scale, strength],
  );
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

export function FinishBox({
  position,
  size,
  rotation = [0, 0, 0],
  radius = 0.02,
  material,
}) {
  const geometry = useMemo(
    () => roundedBox(size, radius),
    // Sizes are authored literals; compare by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size[0], size[1], size[2], radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}
