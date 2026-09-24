"use client";
import { useTexture } from "@react-three/drei";

// Loads a CC0 texture set from public/materials/<name>/ (color, normal,
// arm = ambient occlusion / roughness / metalness packed in R/G/B).
// Callers must sit inside a local Suspense boundary: suspending up to the
// canvas root remounts the whole scene.
export default function usePbrSet(name) {
  const [albedo, normal, arm] = useTexture([
    `/materials/${name}/color.webp`,
    `/materials/${name}/normal.webp`,
    `/materials/${name}/arm.webp`,
  ]);
  return { albedo, normal, roughness: arm };
}
