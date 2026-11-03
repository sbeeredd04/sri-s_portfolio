import { Vector3, MathUtils } from "three";
import { regions, worldPoint } from "./world-layout.mjs";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import { walkingRoutes, pathPose, pathHalfWidth } from "./world-paths.mjs";
import { courtPaths } from "./court-layout.mjs";
import { projectWalks } from "./project-town-layout.mjs";
import { entertainmentPaths } from "./entertainment-layout.mjs";
import { streetRoutes } from "./street-view.mjs";
import { cityWalkRuns } from "./sf-streets.mjs";
import { STREET } from "./sf-plan.mjs";
import { pavingPlacements, pavingSize } from "./paving-layout.mjs";
import { APARTMENT_LEVEL, apartmentPoint } from "./studio-layout.mjs";
import { homeSite } from "./home-site.mjs";
import { afterHoursLandingWalk } from "./afterhours-landing-walk.mjs";
import { outThereWalks } from "./out-there-walk-runtime.mjs";
import { madeCampus } from "./made-campus-data.mjs";
import { legacyContentLift } from "./authored-island-sites.mjs";
import {
  fieldnotesFootHeight,
  fieldnotesPaths,
  fieldnotesSpawn,
  fieldnotesWalkEntries,
} from "./fieldnotes-layout.mjs";

export const WALK_SPEED = 3.0;
export const WALK_RADIUS = 0.5;
// Missing short joins, rendered by the same coordinates as navigation. No
// inferred straight lines through the apartment, sports courts or workshops.
export const walkingJoins = {
  studio: [],
  projects: [],
  entertainment: [[[24, 7], [13, 6], 2]],
};
function localSegments(world, paths, roof = false) {
  const r = regions.find((r) => r.id === world),
    result = [];
  const stones =
    roof || world === "trail" || world === "future" || world === "projects"
      ? []
      : pavingPlacements(world, paths);
  const floor = (x, z) => {
    if (roof) return APARTMENT_LEVEL + (z > 5.1 ? 0.004 : 0.144);
    if (world === "future") return fieldnotesFootHeight(x, z);
    if (world === "projects") return 2.208;
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
      if (roof) return worldPoint(world, apartmentPoint([x, 0.15, z]));
      return worldPoint(world, [
        x,
        floor(x, z) + (legacyContentLift[world] || 0),
        z,
      ]);
    };
    for (let i = 0; i < count; i++)
      result.push({
        a: at(i / count),
        b: at((i + 1) / count),
        up: r.normal.clone(),
        half: (roof || world === "trail" || world === "projects" ? width : width * 0.64) / 2,
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
  const locals = {
    studio: [],
    court: courtPaths,
    projects: madeCampus.walks,
    entertainment: entertainmentPaths,
    trail: [],
    future: fieldnotesPaths,
  };
  const network = Object.entries(locals).flatMap(([id, paths]) =>
    localSegments(id, [...paths, ...(walkingJoins[id] || [])]),
  );
  const trailRegion = regions.find((r) => r.id === "trail");
  for (const walk of outThereWalks)
    for (let i = 1; i < walk.points.length; i++) {
      const a = walk.points[i - 1],
        b = walk.points[i];
      network.push({
        a: worldPoint("trail", [a[0], a[1] + 0.004, a[2]]),
        b: worldPoint("trail", [b[0], b[1] + 0.004, b[2]]),
        up: trailRegion.normal.clone(),
        half: Math.min(a[3], b[3]) + 0.3,
        world: "trail",
        authoredPath: walk.id,
      });
    }
  const studio = regions.find((r) => r.id === "studio");
  for (const path of homeSite.walks)
    for (let i = 1; i < path.points.length; i++)
      network.push({
        a: worldPoint("studio", path.points[i - 1]),
        b: worldPoint("studio", path.points[i]),
        up: studio.normal.clone(),
        half: path.width / 2,
        world: "studio",
      });
  for (let i = 1; i < afterHoursLandingWalk.points.length; i++)
    network.push({
      a: worldPoint("court", afterHoursLandingWalk.points[i - 1]),
      b: worldPoint("court", afterHoursLandingWalk.points[i]),
      up: regions.find((r) => r.id === "court").normal.clone(),
      half: afterHoursLandingWalk.width / 2,
      world: "court",
    });
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
  if (world === "trail" && !roof) {
    const p = outThereWalks[0].points[0],
      q = outThereWalks[0].points[1],
      r = regions.find((r) => r.id === "trail");
    return {
      position: worldPoint("trail", [p[0], p[1] + 0.004, p[2]]),
      velocity: new Vector3(),
      forward: worldPoint("trail", q.slice(0, 3))
        .sub(worldPoint("trail", p.slice(0, 3)))
        .normalize(),
      up: r.normal.clone(),
      distance: 0,
    };
  }
  const gardenEntry = world === "future" ? fieldnotesWalkEntries[entry] : null;
  const points = {
    studio: [0, 44.3],
    court: [-21, 13],
    projects: [0, 18],
    entertainment: [12.8, 6],
    future: gardenEntry?.point || fieldnotesSpawn,
  };
  const [x, z] = roof
    ? streetRoutes.studio[2].point
    : points[world] || points.studio;
  const position = worldPoint(
    world,
    roof
      ? apartmentPoint([x, 0.15, z])
      : [
          x,
          world === "studio"
            ? 2.613
            : world === "projects"
                ? 2.208
                : world === "future"
                  ? fieldnotesFootHeight(x, z)
                  : renderedSurfaceHeight(world, x, z) + 0.1,
          z,
        ],
  );
  const r = regions.find((r) => r.id === world);
  if (legacyContentLift[world])
    position.addScaledVector(r.normal, legacyContentLift[world]);
  const forward =
    world === "court"
      ? r.east.clone()
      : world === "future"
        ? r.north.clone()
        : r.north.clone().negate();
  if (world === "studio" && !roof) forward.copy(r.east);
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
export function advanceWalker(state, desired, delta, network, speed = WALK_SPEED) {
  const dt = Math.min(Math.max(delta, 0), 0.06),
    steps = Math.max(1, Math.ceil(dt / (1 / 90)));
  let nearest = nearestWalk(state.position, network);
  for (let i = 0; i < steps; i++) {
    const h = dt / steps,
      target = desired
        .clone()
        .addScaledVector(state.up, -desired.dot(state.up));
    if (target.lengthSq() > 1) target.normalize();
    target.multiplyScalar(speed);
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
