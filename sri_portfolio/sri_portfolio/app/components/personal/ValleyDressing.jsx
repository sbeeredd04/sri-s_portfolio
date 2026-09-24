"use client";
import { Suspense, useMemo } from "react";
import ModelInstances from "./ModelInstances";
import { useQuality } from "./Quality";
import { valleyDressing } from "../../lib/valley-dressing.mjs";
import { outdoorsLift } from "../../lib/valley-layout.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";

// How far each asset settles into the ground, as a share of its scale, so
// rocks read as embedded rather than set down on the grass.
const sink = {
  "boulder-granite": 0.18,
  "boulder-lichen": 0.22,
  "rock-small": 0.04,
};
// Small stones only on devices that can spare the draw calls.
const detailOnly = new Set(["rock-small", "stones-pebbles", "tree-stump"]);

function Kind({ kind, spots, lod }) {
  const items = useMemo(
    () =>
      spots.map((spot) => ({
        position: [
          spot.x,
          renderedSurfaceHeight("trail", spot.x, spot.z) -
            outdoorsLift -
            (sink[kind] || 0) * spot.s,
          spot.z,
        ],
        rotation: spot.turn,
        scale: spot.s,
      })),
    [kind, spots],
  );
  return (
    <Suspense fallback={null}>
      <ModelInstances
        src={`/models/${kind}.glb`}
        items={items}
        lod={lod}
        envMapIntensity={0.6}
      />
    </Suspense>
  );
}

export default function ValleyDressing({ detailed }) {
  const { tier } = useQuality();
  const dressing = useMemo(valleyDressing, []);
  const lod = detailed && tier !== "low" ? 0 : 1;
  return (
    <group>
      {Object.entries(dressing).map(([kind, spots]) =>
        (detailOnly.has(kind) && (!detailed || tier === "low")) ||
        !spots.length ? null : (
          <Kind key={kind} kind={kind} spots={spots} lod={lod} />
        ),
      )}
    </group>
  );
}
