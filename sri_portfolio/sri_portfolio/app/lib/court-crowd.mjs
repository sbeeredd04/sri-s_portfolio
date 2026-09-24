// People around the courts, in the court biome's frame: spectators on the
// far sidelines facing the play, and walkers on the promenade (z = 13).
import { courtPaths, courts } from "./court-layout.mjs";

export const courtCrowdBudget = { low: 8, medium: 16, high: 26 };

function spectators() {
  const v = courts.volleyball,
    b = courts.basketball,
    m = courts.badminton;
  const spots = [];
  const farEnd = -(v.depth / 2 + v.apron + 1);
  for (let i = 0; i < 5; i++)
    spots.push({ x: v.center[0] - 3 + i * 1.5, z: farEnd, yaw: 0 });
  const farSide = -(b.depth / 2 + b.apron + 1);
  for (let i = 0; i < 7; i++)
    spots.push({ x: b.center[0] - 6 + i * 2, z: farSide, yaw: 0 });
  const east = m.center[0] + m.width / 2 + m.apron + 0.9;
  for (let i = 0; i < 4; i++)
    spots.push({ x: east, z: -4.5 + i * 2.6, yaw: -Math.PI / 2 });
  // Small turns so a row never reads as a drill line.
  return spots.map((s, i) => ({
    ...s,
    x: s.x + (((i * 0.37) % 1) - 0.5) * 0.5,
    yaw: s.yaw + (((i * 0.61) % 1) - 0.5) * 0.6,
  }));
}

function walkers(count) {
  const [[ax, az], [bx]] = courtPaths[0];
  return Array.from({ length: count }, (_, i) => {
    const lane = az + (i % 2 ? 0.6 : -0.6);
    const path =
      i % 2
        ? [
            [bx - 1, lane],
            [ax + 1, lane],
          ]
        : [
            [ax + 1, lane],
            [bx - 1, lane],
          ];
    return { path, length: Math.abs(bx - ax) - 2, speed: 1 + (i % 4) * 0.13 };
  });
}

export function courtCrowd(tier = "medium") {
  const count = courtCrowdBudget[tier] ?? courtCrowdBudget.medium;
  const watching = spectators().slice(0, Math.ceil(count * 0.62));
  return [...watching, ...walkers(count - watching.length)];
}
