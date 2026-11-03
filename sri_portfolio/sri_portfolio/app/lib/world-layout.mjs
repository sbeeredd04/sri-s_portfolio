import { Vector3, Quaternion, MathUtils } from "three";
import { carvedTrailHeight, valleyFloorWeight } from "./valley-layout.mjs";

// Props stay at true metres (a 1.3 m character, 7-10 m row houses). The
// radius sets how large the world feels at eye level: at 450 m the horizon
// sits about 34 m away from a walker instead of 22 m, and each biome's level
// floor is large enough for a district rather than a vignette.
export const WORLD_RADIUS = 450;
// Five islands share the upper sea plane of the invented globe. Their local
// metre frames stay literal; only the bay placements change.
const up = new Vector3(0, 1, 0);
export const regions = [
  { id: "studio", label: "Home", offset: [0, 0, -88], inner: 82, outer: 100 },
  {
    id: "court",
    label: "After hours",
    offset: [133, 0, -39],
    inner: 57,
    outer: 87,
  },
  {
    id: "trail",
    label: "Out there",
    offset: [-129, 0, -21],
    inner: 65,
    outer: 86,
  },
  { id: "projects", label: "Made", offset: [9, 0, 72], inner: 61, outer: 78 },
  {
    id: "entertainment",
    label: "After hours",
    offset: [133, 0, 4],
    inner: 33,
    outer: 54,
  },
  {
    id: "future",
    label: "Fieldnotes",
    offset: [-104, 0, 92],
    inner: 38,
    outer: 64,
  },
].map((region) => ({
  landCenter: [0, 0],
  ...region,
  normal: up.clone(),
  rotation: new Quaternion(),
  center: new Vector3(region.offset[0], WORLD_RADIUS, region.offset[2]),
  east: new Vector3(1, 0, 0),
  north: new Vector3(0, 0, 1),
}));

export function worldPoint(id, local) {
  const r = regions.find((r) => r.id === id);
  return new Vector3(...local).applyQuaternion(r.rotation).add(r.center);
}
export function regionDistance(region, x, z) {
  return Math.hypot(
    x - (region.landCenter?.[0] || 0),
    z - (region.landCenter?.[1] || 0),
  );
}

export function trailHeight(x, z) {
  const clearing = MathUtils.smoothstep(Math.hypot(x, z), 9, 18);
  const wave =
    Math.sin(x * 0.17) * Math.cos(z * 0.14) * 0.72 +
    Math.sin(x * 0.39 + z * 0.22) * 0.14;
  const rolled = MathUtils.lerp(
    Math.max(0, wave) * clearing,
    0.06,
    valleyFloorWeight(x, z),
  );
  let shore = 0.16 + rolled;
  const landing =
    MathUtils.smoothstep(z, 5, 9.5) *
    (1 - MathUtils.smoothstep(Math.abs(x - 2), 1.5, 6));
  shore = MathUtils.lerp(shore, 0.32, landing);
  return carvedTrailHeight(x, z, shore);
}

export function listeningShoreHeight(x, z) {
  const basin = 1 - MathUtils.smoothstep(Math.hypot(x + 2, z + 11), 5.3, 6.6);
  const ridge = MathUtils.smoothstep(-z, 16.5, 20);
  const hills =
    7 * Math.exp(-(((x + 9) / 6.5) ** 2 + ((z + 23) / 6) ** 2)) +
    6 * Math.exp(-(((x - 7) / 7) ** 2 + ((z + 24) / 5.5) ** 2));
  // The wooded rise belongs behind the listening house. Its far shoulder
  // ends before the sports promenade on the shared island, keeping the
  // courts and their approach level instead of pushing hills under paving.
  const sportsClearance = 1 - MathUtils.smoothstep(-z, 23, 26.5);
  return -1.1 * basin + ridge * hills * sportsClearance;
}

// One level bay on the globe, easing over a broad shoulder outside the
// islands. The coast meshes, not the planet, provide all dry relief.
export function planetRadiusAt(normal) {
  if (normal.y < 0.55) return WORLD_RADIUS;
  const d = (WORLD_RADIUS * Math.hypot(normal.x, normal.z)) / normal.y;
  const cap = 1 - MathUtils.smoothstep(d, 255, 495);
  return MathUtils.lerp(WORLD_RADIUS, WORLD_RADIUS / normal.y, cap);
}

// Solve the surface below a prop in its biome's tangent coordinates.
export function surfaceHeight(id, x, z) {
  const r = regions.find((r) => r.id === id);
  const px = r.center.x + x,
    pz = r.center.z + z;
  if (Math.hypot(px, pz) <= 255) return 0;
  let y =
    Math.sqrt(Math.max(0, WORLD_RADIUS ** 2 - px ** 2 - pz ** 2)) -
    WORLD_RADIUS;
  for (let i = 0; i < 8; i++) {
    const radius = planetRadiusAt(worldPoint(id, [x, y, z]).normalize());
    y = Math.sqrt(Math.max(0, radius ** 2 - px ** 2 - pz ** 2)) - WORLD_RADIUS;
  }
  return y;
}

export function safeCameraPoint(point, clearance = 1.2) {
  const direction =
    point.lengthSq() < 0.000001
      ? new Vector3(0, 1, 0)
      : point.clone().normalize();
  const minimum = planetRadiusAt(direction) + clearance;
  return point.length() < minimum ? direction.multiplyScalar(minimum) : point;
}

export function groundColliderData(id, offsetY = 0.15) {
  const vertices = [],
    indices = [],
    steps = 40;
  for (let z = 0; z <= steps; z++)
    for (let x = 0; x <= steps; x++) {
      const px = (x / steps - 0.5) * 50,
        pz = (z / steps - 0.5) * 50;
      vertices.push(px, surfaceHeight(id, px, pz) - offsetY, pz);
      if (x < steps && z < steps) {
        const i = z * (steps + 1) + x;
        indices.push(
          i,
          i + steps + 1,
          i + 1,
          i + 1,
          i + steps + 1,
          i + steps + 2,
        );
      }
    }
  return [new Float32Array(vertices), new Uint32Array(indices)];
}
