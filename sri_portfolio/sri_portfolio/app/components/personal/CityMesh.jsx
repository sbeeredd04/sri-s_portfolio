"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import usePbrSet from "./usePbrSet";

// One vertex-coloured batch of merged building boxes, finished by tone:
// triplanar plaster or concrete, clear or curtain glass, lit windows.
const cityLook = {
  paint: { roughness: 0.84, set: "plaster", scale: 0.9, strength: 0.8 },
  stone: { roughness: 0.9, set: "concrete", scale: 0.7, strength: 0.9 },
  glass: { roughness: 0.12, metalness: 0.3, color: "#9fb3c2" },
  lit: { roughness: 0.2, metalness: 0.1, color: "#d9c7a3", glow: "#ffc27a" },
  curtain: { roughness: 0.08, metalness: 0.55, color: "#b9cad6", env: 1.6 },
  door: { roughness: 0.6 },
  roof: { roughness: 0.95 },
};
export default function CityMesh({ tone, geometry, night }) {
  const look = cityLook[tone];
  const maps = usePbrSet(look.set || "plaster");
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: look.roughness,
      metalness: look.metalness || 0,
      envMapIntensity: look.env || 1,
    });
    if (look.color) m.color.set(look.color);
    if (!look.set) return m;
    return applyTriplanar(m, {
      ...maps,
      mode: "detail",
      scale: look.scale,
      strength: look.strength,
      normalStrength: look.strength,
      meanLuminance: 0.45,
    });
  }, [look, maps]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    if (!look.glow) return;
    material.emissive.set(look.glow);
    material.emissiveIntensity = night ? 0.85 : 0.04;
  }, [material, look, night]);
  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  );
}
