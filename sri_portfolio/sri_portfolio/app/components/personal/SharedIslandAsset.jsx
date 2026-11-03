"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export default function SharedIslandAsset({
  source,
  onClick,
  onPointerMove,
  onPointerOut,
  configure,
  night = false,
}) {
  const { scene } = useGLTF(source);
  const asset = useMemo(() => {
    const root = scene.clone(true),
      materials = new Map(),
      configured = new Set();
    const prepare = (original) => {
      if (materials.has(original)) return materials.get(original);
      const m = original.clone();
      m.envMapIntensity = 0.45;
      if (/glass|glaz/i.test(m.name)) {
        m.transmission = 0;
        m.transparent = true;
        m.opacity = 0.27;
        m.depthWrite = false;
        m.roughness = 0.2;
      }
      materials.set(original, m);
      return m;
    };
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.material = Array.isArray(o.material)
        ? o.material.map(prepare)
        : prepare(o.material);
      o.castShadow = !/glaz|glass|water/i.test(o.name);
      o.receiveShadow = true;
      configure?.(o);
      for (const material of [o.material].flat()) configured.add(material);
    });
    return { root, materials: [...new Set([...materials.values(), ...configured])] };
  }, [scene, configure]);
  useEffect(() => () => asset.materials.forEach((m) => m.dispose()), [asset]);
  useFrame(() => {
    for (const material of asset.materials) {
      if (/AmberEave/i.test(material.name)) {
        material.emissive.set("#ffb65b");
        material.emissiveIntensity = night ? 2.3 : 0.18;
      }
    }
  });
  return (
    <primitive
      object={asset.root}
      {...{ onClick, onPointerMove, onPointerOut }}
    />
  );
}
