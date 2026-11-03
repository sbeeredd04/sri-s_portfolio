"use client";
import { useMemo } from "react";
import { useQuality } from "./Quality";
import { useTexture } from "@react-three/drei";

// Loads a CC0 texture set from public/materials/<name>/ (color, normal,
// arm = ambient occlusion / roughness / metalness packed in R/G/B).
// Callers must sit inside a local Suspense boundary: suspending up to the
// canvas root remounts the whole scene.
export default function usePbrSet(name) {
  const { tier, anisotropy } = useQuality();
  const folder = tier === "low" ? "mobile/" : "";
  const [albedo, normal, arm] = useTexture([
    `/materials/${folder}${name}/color.webp`,
    `/materials/${folder}${name}/normal.webp`,
    `/materials/${folder}${name}/arm.webp`,
  ]);
  return useMemo(
    () => ({ albedo, normal, roughness: arm, anisotropy }),
    [albedo, normal, arm, anisotropy],
  );
}
