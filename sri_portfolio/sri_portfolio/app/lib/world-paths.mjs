import { Vector3, Quaternion, MathUtils } from "three";
import { courtEntrance } from "./court-layout.mjs";
import { worldPoint, planetRadiusAt, WORLD_RADIUS } from "./world-layout.mjs";

export const connections = [
  ["studio", "court", [5.5, 0, 7], courtEntrance],
  ["studio", "trail", [-4, 0, 10], [2, 0, 9]],
  ["studio", "projects", [0, 0, 9], [0, 0, -16]],
  ["trail", "future", [2, 0, 9], [0, 0, -8]],
  ["court", "entertainment", [24, 0, 13], [24, 0, 7]],
];

// The coast shader and the rendered causeway share the same shoulder widths.
export const causeway = { solidHalfWidth: 1.75, shoreHalfWidth: 3.0 };
export const walkingRoutes = connections.map(
  ([from, to, startLocal, endLocal]) => {
    const start = worldPoint(from, startLocal).normalize();
    const end = worldPoint(to, endLocal).normalize();
    return {
      from,
      to,
      start,
      end,
      turn: new Quaternion().setFromUnitVectors(start, end),
      axis: new Vector3().crossVectors(start, end).normalize(),
      length: start.angleTo(end) * WORLD_RADIUS,
    };
  },
);

export const bayCrossing = {
  from: "studio",
  to: "trail",
  start: 0.36,
  end: 0.87,
  towers: [0.44, 0.74],
  halfWidth: 1.4,
};
export function isBayCrossing(route) {
  return route.from === bayCrossing.from && route.to === bayCrossing.to;
}
export function crossingLift(route, t) {
  return isBayCrossing(route)
    ? 3.2 *
        MathUtils.smoothstep(t, 0.25, 0.43) *
        (1 - MathUtils.smoothstep(t, 0.75, 0.94))
    : 0;
}

export function pathSample(route, t, lane = 0, lift = 0.08) {
  const rotation = new Quaternion().identity().slerp(route.turn, t);
  const normal = route.start.clone().applyQuaternion(rotation);
  normal
    .addScaledVector(
      route.axis,
      Math.sin(t * Math.PI * 2) * 0.018 + lane / WORLD_RADIUS,
    )
    .normalize();
  const position = normal
    .clone()
    .multiplyScalar(planetRadiusAt(normal) + crossingLift(route, t) + lift);
  return { position, normal };
}
export function pathHalfWidth(route, t) {
  return (
    0.95 +
    (isBayCrossing(route)
      ? (bayCrossing.halfWidth - 0.95) *
        MathUtils.smoothstep(t, 0.31, bayCrossing.start) *
        (1 - MathUtils.smoothstep(t, bayCrossing.end, 0.92))
      : 0)
  );
}
export function pathPose(route, t, lane = 0, lift = 0.08) {
  const sample = pathSample(route, t, lane, lift);
  const next = pathSample(route, Math.min(1, t + 0.001), lane, lift);
  const previous = pathSample(route, Math.max(0, t - 0.001), lane, lift);
  const forward = next.position.sub(previous.position).normalize();
  const right = new Vector3().crossVectors(sample.normal, forward).normalize();
  const up = new Vector3().crossVectors(forward, right).normalize();
  return { ...sample, forward, right, up };
}

// The same slab, curb and lamp footprints drive rendering and clearance checks.
export function walkwayPlacements() {
  const tiles = [],
    edge = [],
    posts = [],
    lamps = [],
    footings = [];
  for (const route of walkingRoutes) {
    const count = Math.ceil(route.length / 0.85);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const pose = pathPose(route, t);
      const before = pathPose(route, i / count).position;
      const after = pathPose(route, (i + 1) / count).position;
      const length = before.distanceTo(after);
      const halfWidth = pathHalfWidth(route, t);
      tiles.push({
        ...pose,
        size: [halfWidth * 2, 0.07, Math.max(0.1, length - 0.035)],
      });
      for (const side of [-1, 1]) {
        edge.push({
          ...pathPose(route, t, side * (halfWidth + 0.08), 0.06),
          size: [0.13, 0.14, length - 0.018],
        });
      }
    }
    const countLamps = Math.max(2, Math.floor(route.length / 9));
    for (let i = 0; i < countLamps; i++) {
      const t = (i + 0.5) / countLamps;
      if (
        isBayCrossing(route) &&
        t >= bayCrossing.start &&
        t <= bayCrossing.end
      )
        continue;
      const pose = pathPose(
        route,
        (i + 0.5) / countLamps,
        (i % 2 ? -1 : 1) * (pathHalfWidth(route, t) + 0.47),
        0.04,
      );
      const raised = (height, size) => ({
        ...pose,
        position: pose.position.clone().addScaledVector(pose.up, height),
        size,
      });
      footings.push(raised(0.035, [0.3, 0.07, 0.3]));
      posts.push(raised(0.48, [0.12, 0.9, 0.12]));
      lamps.push(raised(0.87, [0.135, 0.15, 0.135]));
      posts.push(raised(0.97, [0.19, 0.055, 0.19]));
    }
  }
  return { tiles, edge, posts, lamps, footings };
}
