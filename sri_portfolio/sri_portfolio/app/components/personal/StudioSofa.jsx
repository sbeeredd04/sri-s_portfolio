"use client";
import { Suspense } from "react";
import { studioSurfaces } from "../../lib/studio-layout.mjs";
import { Model } from "./ModelInstances";

// Scanned CC0 leather sofa (Poly Haven), fitted to the shared collision
// volumes in studio-layout so physics props rest on the visible cushions.
const { sofa } = studioSurfaces;
export default function StudioSofa() {
  return (
    <Suspense fallback={null}>
      <Model
        src="/models/sofa-leather.glb"
        position={[sofa.position[0], 0, sofa.position[2]]}
        rotation={-Math.PI / 2}
        scale={1.12}
        envMapIntensity={1.2}
      />
    </Suspense>
  );
}
