import { Vector3, Quaternion, MathUtils } from "three";
import { carvedTrailHeight, valleyFloorWeight } from "./valley-layout.mjs";
import { sfCoastFade, sfTerrainHeight } from "./sf-terrain.mjs";

// Props stay at true metres (a 1.3 m character, 7-10 m row houses). The
// radius sets how large the world feels at eye level: at 450 m the horizon
// sits about 34 m away from a walker instead of 22 m, and each biome's level
// floor is large enough for a district rather than a vignette.
export const WORLD_RADIUS = 450;
// Plateaus, land centres and offsets grew with the radius from their 190 m
// originals; authored content inside each biome is unchanged.
const GROW = WORLD_RADIUS / 190;
const up = new Vector3(0, 1, 0);
export const regions = [
  {
    id: "studio",
    label: "Home",
    normal: [0, 1, 0],
    // Expand toward the skyline and market, leaving the western Bay open.
    // This moves the land envelope, not the apartment or district coordinates.
    landCenter: [12 * GROW, -10 * GROW],
    inner: 40 * GROW,
    outer: 72 * GROW,
  },
  {
    id: "court",
    label: "After hours",
    normal: [0.56, 0.8, 0.12],
    inner: 29 * GROW,
    outer: 46 * GROW,
  },
  {
    id: "trail",
    label: "The outdoors",
    normal: [-0.66, 0.7, 0.27],
    inner: 23 * GROW,
    outer: 42 * GROW,
    landCenter: [-2 * GROW, -5 * GROW],
  },
  {
    id: "projects",
    label: "The Foundry",
    normal: [-0.15, 0.55, 0.82],
    // Shift the level pad north so the ring campus sits behind the workshops.
    landCenter: [-7 * GROW, -10 * GROW],
    inner: 35 * GROW,
    // A wider coastal shoulder keeps the incoming bridge below an 18° grade.
    outer: 68 * GROW,
  },
  {
    id: "entertainment",
    label: "After hours",
    normal: [0.56, 0.8, 0.12],
    // Shares the courts' tangent plane: one island, so the offset stays in
    // authored metres while the island itself grows.
    offset: [0, 0, 43],
    inner: 26 * GROW,
    outer: 78 * GROW,
    shoreInner: 26 * GROW,
    // A broad, visible headland gives the shared tangent plane enough room to
    // ease back to the globe without turning the coast into a steep berm.
    shoreOuter: 56 * GROW,
  },
  {
    id: "future",
    label: "Fieldnotes",
    normal: [-0.65, 0.35, 0.67],
    inner: 10 * GROW,
    outer: 22 * GROW,
  },
].map((region) => {
  const normal = new Vector3(...region.normal).normalize();
  const rotation = new Quaternion().setFromUnitVectors(up, normal);
  return {
    ...region,
    normal,
    rotation,
    center: normal
      .clone()
      .multiplyScalar(WORLD_RADIUS)
      .add(
        new Vector3(...(region.offset || [0, 0, 0])).applyQuaternion(rotation),
      ),
    east: new Vector3(1, 0, 0).applyQuaternion(rotation),
    north: new Vector3(0, 0, 1).applyQuaternion(rotation),
  };
});

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

function plateauRadius(region, x, z) {
  const distance = Math.hypot(x, z);
  const [cx, cz] = region.landCenter || [0, 0];
  const along = distance > 0 ? (x * cx + z * cz) / distance : 0;
  // Intersection of this radial line with the translated clearing boundary.
  // Cap at that edge so the coastal shoulder never rises into an ocean berm.
  const edge =
    along +
    Math.sqrt(
      Math.max(0, region.inner ** 2 - cx * cx - cz * cz + along * along),
    );
  return Math.hypot(WORLD_RADIUS, Math.min(distance, edge));
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

// The clearings deform the planet itself. There are no disks or slabs beneath biomes.
export function planetRadiusAt(normal) {
  let radius = WORLD_RADIUS;
  for (const r of regions) {
    const d = normal.dot(r.normal);
    if (d < 0.6) continue;
    const x = (normal.dot(r.east) * WORLD_RADIUS) / d - (r.offset?.[0] || 0);
    const z = (normal.dot(r.north) * WORLD_RADIUS) / d - (r.offset?.[2] || 0);
    // The visible shoreline and the physical shoulder must end together.
    // Entertainment deliberately has a wider logical footprint for scene
    // visibility, but lifting that full footprint made the surrounding ocean
    // climb into a giant, solid-looking wave.
    const physicalOuter = r.shoreOuter || r.outer;
    const blend =
      1 - MathUtils.smoothstep(regionDistance(r, x, z), r.inner, physicalOuter);
    if (!blend) continue;
    const height =
      r.id === "trail"
        ? trailHeight(x, z)
        : r.id === "entertainment"
          ? listeningShoreHeight(x, z)
          : r.id === "studio"
            ? sfTerrainHeight(x, z) *
              sfCoastFade(regionDistance(r, x, z), r.inner)
            : 0;
    // Keep the flat footprint, then ease a capped shoulder back into the sphere.
    // Extending the tangent plane through the whole blend creates steep rims.
    const plateau = r.offset ? WORLD_RADIUS / d : plateauRadius(r, x, z);
    radius = Math.max(
      radius,
      WORLD_RADIUS + (plateau + Math.max(0, height) / d - WORLD_RADIUS) * blend,
    );
    if (height < 0) radius += (height / d) * blend;
  }
  return radius;
}

// Solve the surface below a prop in its biome's tangent coordinates.
export function surfaceHeight(id, x, z) {
  let y =
    Math.sqrt(Math.max(0, WORLD_RADIUS ** 2 - x * x - z * z)) - WORLD_RADIUS;
  for (let i = 0; i < 6; i++) {
    const normal = worldPoint(id, [x, y, z]).normalize();
    const radius = planetRadiusAt(normal);
    y = Math.sqrt(Math.max(0, radius * radius - x * x - z * z)) - WORLD_RADIUS;
  }
  const residual = (height) => {
    const point = worldPoint(id, [x, height, z]);
    return point.length() - planetRadiusAt(point.clone().normalize());
  };
  // Fixed-point iteration is cheap on a clearing, but can oscillate on a steep
  // ridge. Bracket the radial surface so trees and camera ground agree there too.
  if (Math.abs(residual(y)) > 0.001) {
    let low = -WORLD_RADIUS + 0.01,
      high = Math.max(32, y + 8);
    for (let i = 0; i < 22; i++) {
      const middle = (low + high) / 2;
      if (residual(middle) > 0) high = middle;
      else low = middle;
    }
    y = (low + high) / 2;
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
