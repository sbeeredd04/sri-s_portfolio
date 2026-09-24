"use client";
import { Suspense } from "react";
import { Model } from "./ModelInstances";

// Scanned CC0 potted plants (Poly Haven) and ferns replace the procedural
// leaves wherever a plant is placed; scale keeps each call site's footprint.
export function BotanicalPlant({ position = [0, 0, 0], scale = 1, wild = false }) {
  const pick = Math.abs(Math.round(position[0] * 7 + position[2] * 13)) % 2;
  const src = wild
    ? "/models/fern.glb"
    : pick
      ? "/models/plant-tall.glb"
      : "/models/plant-leafy.glb";
  const size = wild ? 0.9 : pick ? 0.9 : 1.3;
  return (
    <Suspense fallback={null}>
      <Model
        src={src}
        position={position}
        rotation={position[0] * 3.1}
        scale={scale * size}
      />
    </Suspense>
  );
}
