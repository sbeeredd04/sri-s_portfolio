import {
  BoxGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  TubeGeometry,
  CatmullRomCurve3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { walkingRoutes, pathPose, bayCrossing } from "./world-paths.mjs";
import { WORLD_RADIUS } from "./world-layout.mjs";
import { APARTMENT_LEVEL } from "./studio-layout.mjs";

export const bayRoute = walkingRoutes.find(
  (r) => r.from === bayCrossing.from && r.to === bayCrossing.to,
);
const vertical = new Vector3(0, 1, 0);
export function bridgePoint(t, side = 0, height = 0) {
  const p = pathPose(bayRoute, t);
  return p.position
    .clone()
    .addScaledVector(p.right, side)
    .addScaledVector(p.normal, height);
}
// A distributed deck load produces a parabolic main span. Approach cables
// descend to anchor blocks; hangers meet this same curve, never float nearby.
export function cableHeight(t) {
  const [a, b] = bayCrossing.towers;
  if (t < a)
    return 1.1 + (11.3 * (t - bayCrossing.start)) / (a - bayCrossing.start);
  if (t > b) return 12.4 - (11.3 * (t - b)) / (bayCrossing.end - b);
  return 3.5 + 8.9 * ((t - (a + b) / 2) / ((b - a) / 2)) ** 2;
}
export function bridgeGeometry() {
  const groups = { steel: [], cable: [], stone: [], light: [] };
  const members = [];
  function beam(kind, a, b, width, depth = width) {
    const along = b.clone().sub(a).normalize();
    let right = pathPose(bayRoute, 0.59).right;
    right.addScaledVector(along, -right.dot(along));
    if (right.lengthSq() < 0.001)
      right = new Vector3().crossVectors(along, vertical);
    right.normalize();
    const forward = new Vector3().crossVectors(right, along).normalize();
    const q = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(right, along, forward),
    );
    const g = new BoxGeometry(width, a.distanceTo(b), depth).toNonIndexed();
    g.applyMatrix4(
      new Matrix4().compose(
        a.clone().add(b).multiplyScalar(0.5),
        q,
        new Vector3(1, 1, 1),
      ),
    );
    groups[kind].push(g);
    members.push({ kind, a: a.toArray(), b: b.toArray(), width, depth });
  }
  const { start, end, towers } = bayCrossing;
  const steps = 70;
  for (const side of [-1, 1]) {
    const cablePoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = start + ((end - start) * i) / 100;
      cablePoints.push(bridgePoint(t, side * 2.25, cableHeight(t)));
    }
    groups.cable.push(
      new TubeGeometry(
        new CatmullRomCurve3(cablePoints),
        120,
        0.085,
        6,
        false,
      ).toNonIndexed(),
    );
    for (let i = 0; i < steps; i++) {
      const t = start + ((end - start) * i) / steps,
        n = start + ((end - start) * (i + 1)) / steps;
      beam(
        "steel",
        bridgePoint(t, side * 1.53, -0.25),
        bridgePoint(n, side * 1.53, -0.25),
        0.22,
        0.34,
      );
      beam(
        "steel",
        bridgePoint(t, side * 1.58, 1.1),
        bridgePoint(n, side * 1.58, 1.1),
        0.065,
      );
      beam(
        "steel",
        bridgePoint(t, side * 1.58, 0.5),
        bridgePoint(n, side * 1.58, 0.5),
        0.045,
      );
      beam(
        "steel",
        bridgePoint(t, side * 1.58, 0.07),
        bridgePoint(t, side * 1.58, 1.1),
        0.045,
      );
      if (i % 3 === 0) {
        beam(
          "cable",
          bridgePoint(t, side * 2.25, -0.25),
          bridgePoint(t, side * 2.25, cableHeight(t)),
          0.043,
        );
        beam(
          "steel",
          bridgePoint(t, 0, -0.25),
          bridgePoint(t, side * 2.35, -0.25),
          0.13,
          0.18,
        );
      }
    }
    for (const t of [start, end]) {
      beam(
        "stone",
        bridgePoint(t, side * 2.25, -1.4),
        bridgePoint(t, side * 2.25, 1.25),
        1.25,
        1.7,
      );
    }
  }
  for (const t of towers) {
    const p = pathPose(bayRoute, t);
    const footingHeight = p.position.length() - WORLD_RADIUS + 1.5;
    for (const side of [-1, 1]) {
      beam(
        "stone",
        bridgePoint(t, side * 2.25, -footingHeight),
        bridgePoint(t, side * 2.25, -0.25),
        1.75,
        2.2,
      );
      // Stepped portal columns and projecting ribs give the silhouette depth.
      for (let level = 0; level < 4; level++) {
        const bottom = level * 3.15 - 0.35,
          top = (level + 1) * 3.15;
        beam(
          "steel",
          bridgePoint(t, side * 2.25, bottom),
          bridgePoint(t, side * 2.25, top),
          0.62 - level * 0.06,
          1.12 - level * 0.1,
        );
        for (const rib of [-0.22, 0.22]) {
          const shift = p.forward.clone().multiplyScalar(rib);
          beam(
            "steel",
            bridgePoint(t, side * 2.25, bottom).add(shift),
            bridgePoint(t, side * 2.25, top).add(shift),
            0.7 - level * 0.06,
            0.06,
          );
        }
      }
    }
    for (const h of [4.2, 8.7, 12.25])
      beam(
        "steel",
        bridgePoint(t, -2.25, h),
        bridgePoint(t, 2.25, h),
        0.58,
        0.86,
      );
  }
  // Warm, unanimated lamps sit beyond the full pedestrian envelope.
  for (let i = 0; i < 8; i++) {
    const t = start + ((end - start) * (i + 0.5)) / 8,
      side = i % 2 ? 1 : -1;
    beam(
      "steel",
      bridgePoint(t, side * 1.9, -0.3),
      bridgePoint(t, side * 1.9, 2.9),
      0.085,
    );
    beam(
      "steel",
      bridgePoint(t, side * 1.9, 2.9),
      bridgePoint(t, side * 1.48, 3.1),
      0.075,
    );
    beam(
      "light",
      bridgePoint(t, side * 1.48, 3.08),
      bridgePoint(t, side * 1.48, 2.96),
      0.27,
      0.35,
    );
  }
  const geometries = Object.fromEntries(
    Object.entries(groups).map(([k, pieces]) => {
      const g = mergeGeometries(pieces);
      pieces.forEach((p) => p.dispose());
      g.computeBoundingSphere();
      g.computeBoundingBox();
      return [k, g];
    }),
  );
  return { geometries, members };
}
// Studio cameras use apartment-local height. Convert once here, while the
// bridge itself remains in world coordinates shared with residents and paving.
function studioCamera(v) {
  return [v.x, v.y - WORLD_RADIUS - APARTMENT_LEVEL, v.z];
}
const middle = pathPose(bayRoute, 0.59);
export const bridgeView = {
  position: studioCamera(
    middle.position
      .clone()
      .addScaledVector(middle.right, 76)
      .addScaledVector(middle.normal, 39)
      .addScaledVector(middle.forward, 9),
  ),
  target: studioCamera(
    middle.position.clone().addScaledVector(middle.normal, 3.5),
  ),
  portrait: {
    position: studioCamera(
      middle.position
        .clone()
        .addScaledVector(middle.right, 60)
        .addScaledVector(middle.normal, 38)
        .addScaledVector(middle.forward, 68),
    ),
    target: studioCamera(
      middle.position.clone().addScaledVector(middle.normal, 4),
    ),
    fov: 66,
  },
};

export const bayWalkingNodes = [0.4, 0.48, 0.59, 0.7, 0.81].map((t, i) => {
  const p = pathPose(bayRoute, t),
    ahead = pathPose(bayRoute, t + 0.012);
  return {
    label: [
      "The city anchorage",
      "Under the first tower",
      "Above the bay",
      "Toward the trails",
      "The far anchorage",
    ][i],
    group: "bay",
    point: [p.position.x, p.position.z],
    worldPosition: p.position.toArray(),
    worldLook: ahead.position.toArray(),
    up: p.normal.toArray(),
  };
});
