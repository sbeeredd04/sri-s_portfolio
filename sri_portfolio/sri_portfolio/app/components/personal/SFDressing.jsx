"use client";
import { Suspense, useMemo } from "react";
import ModelInstances from "./ModelInstances";
import { useQuality } from "./Quality";
import { sfDressing } from "../../lib/sf-dressing.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";

const lampGlow = /bulb|glass/i;
const ground = (x, z, sink = 0) => surfaceHeight("studio", x, z) - sink;
const place = (spots, scale, sink = 0) =>
  spots.map((p) => ({
    position: [p.x, ground(p.x, p.z, sink), p.z],
    rotation: p.turn,
    scale: (p.s || 1) * scale,
  }));

function Instances({ src, items, lod = 1, glow, shadow = true }) {
  if (!items.length) return null;
  return (
    <Suspense fallback={null}>
      <ModelInstances
        castShadow={shadow}
        src={src}
        items={items}
        lod={lod}
        glow={glow}
        envMapIntensity={0.7}
      />
    </Suspense>
  );
}

// Sidewalk trees, lamps and hydrants, park trees and the headland forest,
// one instanced draw per material and budgeted by tier.
export default function SFDressing({ night }) {
  const { tier } = useQuality();
  const d = useMemo(() => sfDressing(tier), [tier]);
  const glow = useMemo(
    () => ({
      match: lampGlow,
      color: "#ffc98f",
      intensity: night ? 3.2 : 0.05,
    }),
    [night],
  );
  const forest = (kind) => d.forest.filter((t) => t.kind === kind);
  return (
    <group>
      <Instances
        src="/models/tree-small-broadleaf.glb"
        items={place(d.trees, 1.05, 0.05)}
      />
      <Instances
        src="/models/street-lamp.glb"
        items={place(d.lamps, 1)}
        lod={0}
        glow={glow}
        shadow={false}
      />
      <Instances
        src="/models/fire-hydrant.glb"
        items={place(d.hydrants, 1)}
        lod={0}
        shadow={false}
      />
      <Instances
        src="/models/tree-broadleaf.glb"
        items={place(d.parkTrees, 0.3, 0.1)}
      />
      <Instances
        src="/models/tree-pine-dense.glb"
        items={place(forest("tree-pine-dense"), 1.5, 0.1)}
        shadow={false}
      />
      <Instances
        src="/models/tree-fir.glb"
        items={place(forest("tree-fir"), 0.55, 0.1)}
        shadow={false}
      />
    </group>
  );
}
