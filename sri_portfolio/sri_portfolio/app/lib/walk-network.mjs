import { Vector3, MathUtils } from "three";
import { regions, worldPoint } from "./world-layout.mjs";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import { walkingRoutes, pathPose, pathHalfWidth } from "./world-paths.mjs";
import { courtPaths } from "./court-layout.mjs";
import { projectWalks } from "./project-town-layout.mjs";
import { entertainmentPaths } from "./entertainment-layout.mjs";
import { overlookSegments, trailCenter } from "./trail-layout.mjs";
import { overlookDeck, overlookPolyline } from "./valley-layout.mjs";
import { campusCenter, campusFeet, onCampusPath } from "./campus-layout.mjs";
import { campusPavingHeight } from "./campus-surface.mjs";
import { trailFootHeight } from "./trail-surface.mjs";
import { streetRoutes } from "./street-view.mjs";
import { pavingPlacements, pavingSize } from "./paving-layout.mjs";
import { APARTMENT_LEVEL } from "./studio-layout.mjs";
import {
  fieldnotesFootHeight,
  fieldnotesPaths,
  fieldnotesSpawn,
  fieldnotesWalkEntries,
} from "./fieldnotes-layout.mjs";

export const WALK_SPEED = 4.2;
export const WALK_RADIUS = 0.5;
// Missing short joins, rendered by the same coordinates as navigation. No
// inferred straight lines through the apartment, sports courts or workshops.
export const walkingJoins = {
  studio: [
    [[-4, 10], [0, 10], 3],
    [[0, 10], [0, 9], 3],
    [[0, 10], [5.5, 7], 3],
  ],
  projects: [
    [[0, -16], [2.8, -16], 2],
    [[2.8, -16], [2.8, -7], 2],
  ],
  entertainment: [[[24, 7], [13, 6], 2]],
};
function localSegments(world, paths, roof = false) {
  const r = regions.find((r) => r.id === world),
    result = [];
  const stones =
    roof || world === "trail" || world === "future"
      ? []
      : pavingPlacements(world, paths);
  const floor = (x, z) => {
    if (roof) return APARTMENT_LEVEL + (z > 5.1 ? 0.004 : 0.144);
    if (world === "future") return fieldnotesFootHeight(x, z);
    if (world === "trail") return trailFootHeight(x, z);
    if (world === "projects" && onCampusPath(x, z))
      return campusPavingHeight() + 0.004;
    let height = renderedSurfaceHeight(world, x, z) + 0.031;
    for (const s of stones)
      if (
        Math.abs(s.x - x) <= pavingSize[0] / 2 + 0.05 &&
        Math.abs(s.z - z) <= pavingSize[2] / 2 + 0.05
      )
        height = Math.max(height, s.y + s.height / 2 + 0.004);
    return height;
  };
  for (const [a, b, width] of paths) {
    const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
    const at = (t) => {
      const x = MathUtils.lerp(a[0], b[0], t),
        z = MathUtils.lerp(a[1], b[1], t);
      return worldPoint(world, [x, floor(x, z), z]);
    };
    for (let i = 0; i < count; i++)
      result.push({
        a: at(i / count),
        b: at((i + 1) / count),
        up: r.normal.clone(),
        half: (roof || world === "trail" ? width : width * 0.64) / 2,
        world,
      });
  }
  return result;
}
export function makeWalkNetwork(roof = false) {
  if (roof) {
    const nodes = streetRoutes.studio.filter((n) => !n.group);
    return localSegments(
      "studio",
      nodes.slice(1).map((n, i) => [nodes[i].point, n.point, 0.92]),
      true,
    );
  }
  const trail = Array.from({ length: 64 }, (_, i) => {
    const z = 10 - i * 0.45;
    return [[trailCenter(z), z], [trailCenter(z - 0.45), z - 0.45], 1.3];
  });
  const locals = {
    studio: [],
    court: courtPaths,
    projects: projectWalks,
    entertainment: entertainmentPaths,
    trail: [
      [[2, 9], [trailCenter(9), 9], 1.3],
      ...trail,
      ...overlookSegments(),
    ],
    future: fieldnotesPaths,
  };
  const network = Object.entries(locals).flatMap(([id, paths]) =>
    localSegments(id, [...paths, ...(walkingJoins[id] || [])]),
  );
  for (const route of walkingRoutes) {
    const count = Math.ceil(route.length / 0.8);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count,
        p = pathPose(route, t, 0, 0.115);
      network.push({
        a: pathPose(route, i / count, 0, 0.115).position,
        b: pathPose(route, (i + 1) / count, 0, 0.115).position,
        up: p.up,
        half: pathHalfWidth(route, t),
        world: t < 0.5 ? route.from : route.to,
        connection: `${route.from}:${route.to}`,
      });
    }
  }
  return network;
}
export function nearestWalk(point, network) {
  let best = null,
    bestDistance = Infinity,
    bestT = 0;
  for (const segment of network) {
    const dx = segment.b.x - segment.a.x,
      dy = segment.b.y - segment.a.y,
      dz = segment.b.z - segment.a.z;
    const t = MathUtils.clamp(
      ((point.x - segment.a.x) * dx +
        (point.y - segment.a.y) * dy +
        (point.z - segment.a.z) * dz) /
        (dx * dx + dy * dy + dz * dz),
      0,
      1,
    );
    const distance =
      (point.x - segment.a.x - dx * t) ** 2 +
      (point.y - segment.a.y - dy * t) ** 2 +
      (point.z - segment.a.z - dz * t) ** 2;
    if (distance < bestDistance) {
      best = segment;
      bestDistance = distance;
      bestT = t;
    }
  }
  return best
    ? {
        segment: best,
        center: best.a.clone().lerp(best.b, bestT),
        distance: bestDistance,
        t: bestT,
      }
    : null;
}
export function walkStart(world, roof = false, entry) {
  const gardenEntry = world === "future" ? fieldnotesWalkEntries[entry] : null;
  const atOverlook = world === "trail" && entry === "overlook";
  const campusEntry =
    world === "projects" && (entry === "campus" || entry === "ring")
      ? campusFeet()[entry]
      : null;
  const points = {
    studio: [-4, 10],
    court: [-21, 13],
    trail: [trailCenter(9), 9],
    projects: [-2.8, 11.7],
    entertainment: [12.8, 6],
    future: gardenEntry?.point || fieldnotesSpawn,
  };
  const [x, z] = roof
    ? streetRoutes.studio[2].point
    : atOverlook
      ? [overlookDeck().x, overlookDeck().z]
      : campusEntry
        ? [campusEntry.x, campusEntry.z]
        : points[world] || points.studio;
  const position = worldPoint(world, [
    x,
    roof
      ? APARTMENT_LEVEL + 0.15
      : world === "trail"
        ? trailFootHeight(x, z)
        : world === "future"
          ? fieldnotesFootHeight(x, z)
          : campusEntry
            ? campusPavingHeight() + 0.004
            : renderedSurfaceHeight(world, x, z) + 0.1,
    z,
  ]);
  const r = regions.find((r) => r.id === world);
  const forward =
    world === "court"
      ? r.east.clone()
      : world === "future"
        ? r.north.clone()
        : r.north.clone().negate();
  if (atOverlook) {
    const prior = overlookPolyline().at(-2);
    forward
      .copy(r.east)
      .multiplyScalar(prior[0] - x)
      .addScaledVector(r.north, prior[1] - z)
      .normalize();
  }
  if (world === "studio" && !roof)
    forward.copy(
      pathPose(
        walkingRoutes.find((r) => r.to === "trail"),
        0,
      ).forward,
    );
  if (campusEntry) {
    const aim = entry === "campus" ? { x: x + 4, z } : campusCenter;
    forward
      .copy(r.east)
      .multiplyScalar(aim.x - x)
      .addScaledVector(r.north, aim.z - z)
      .normalize();
  }
  if (gardenEntry) {
    forward
      .copy(r.east)
      .multiplyScalar(gardenEntry.aim[0] - x)
      .addScaledVector(r.north, gardenEntry.aim[1] - z)
      .normalize();
  }
  return {
    position,
    velocity: new Vector3(),
    forward,
    up: r.normal.clone(),
    distance: 0,
  };
}
export function advanceWalker(state, desired, delta, network) {
  const dt = Math.min(Math.max(delta, 0), 0.06),
    steps = Math.max(1, Math.ceil(dt / (1 / 90)));
  let nearest = nearestWalk(state.position, network);
  for (let i = 0; i < steps; i++) {
    const h = dt / steps,
      target = desired
        .clone()
        .addScaledVector(state.up, -desired.dot(state.up));
    if (target.lengthSq() > 1) target.normalize();
    target.multiplyScalar(WALK_SPEED);
    state.velocity.lerp(
      target,
      1 - Math.exp(-h * (target.lengthSq() ? 14 : 20)),
    );
    const candidate = state.position.clone().addScaledVector(state.velocity, h);
    nearest = nearestWalk(candidate, network);
    const offset = candidate.clone().sub(nearest.center);
    offset.addScaledVector(nearest.segment.up, -offset.dot(nearest.segment.up));
    offset.clampLength(0, Math.max(0.08, nearest.segment.half - WALK_RADIUS));
    const next = nearest.center.clone().add(offset),
      movement = next.clone().sub(state.position);
    state.distance += movement.length();
    state.position.copy(next);
    state.up.copy(nearest.segment.up);
    if (movement.lengthSq() > 0.0000005)
      state.forward
        .lerp(movement.normalize(), 1 - Math.exp(-h * 15))
        .normalize();
  }
  return nearest;
}
export function isWalkingInputTarget(target) {
  return !!target?.closest?.(
    "input,textarea,select,[contenteditable=true],[role=dialog],dialog,[role=menu],.world-settings",
  );
}
