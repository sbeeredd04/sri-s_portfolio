// Sri's Foundry ring. The low circular court borrows a canopy, curved glass
// and an interior garden. It is not an Apple workplace, logo or site plan.
export const campusCenter = { x: -15.5, z: -27.4 };
export const entryAngle = Math.PI / 2;
export const entryGap = 0.58;
export const visitorShoulder = 0.42;
export const campusRadii = {
  court: 3.35,
  glassInner: 5.62,
  glassOuter: 8.12,
  floorInner: 5.4,
  floorOuter: 8.32,
  eaveInner: 5.05,
  eaveOuter: 9.05,
  lowerInner: 5.28,
  lowerOuter: 8.68,
  stand: 6.82,
};
export const campusGlassSpec = {
  transmission: 0,
  opacity: 0.17,
  roughness: 0.07,
  metalness: 0.18,
};
export const campusBatches = [
  "canopy",
  "stone",
  "wood",
  "metal",
  "glass",
  "garden",
  "screen",
  "sign",
];
export const campusExhibits = [
  {
    id: "shelf",
    name: "iPhone & iPad",
    angle: -Math.PI / 2,
    half: 0.2,
    collection: "mobile",
  },
  {
    id: "aatram",
    name: "Aatram",
    angle: Math.PI,
    half: 0.14,
    project: "aatram",
  },
  {
    id: "simsim",
    name: "SimSim",
    angle: 0,
    half: 0.14,
    project: "simsim",
  },
];
export const campusBench = {
  x: campusCenter.x,
  z: campusCenter.z + 0.95,
  hx: 0.7,
  hz: 0.32,
};

const TAU = Math.PI * 2;

export function angleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
export function inOpening(angle, center, half) {
  return Math.abs(angleDelta(angle, center)) < half;
}
export function campusPoint(angle, radius, y = 0) {
  const x = campusCenter.x + Math.cos(angle) * radius;
  const z = campusCenter.z + Math.sin(angle) * radius;
  return {
    x: Math.abs(x) < 1e-8 ? 0 : x,
    y,
    z: Math.abs(z) < 1e-8 ? 0 : z,
  };
}
export function campusRadius(x, z) {
  return Math.hypot(x - campusCenter.x, z - campusCenter.z);
}
export function radialAngle(x, z) {
  return Math.atan2(z - campusCenter.z, x - campusCenter.x);
}
export function solidSpan() {
  return [entryAngle + entryGap, entryAngle - entryGap + TAU];
}
function wrapToSpan(angle, start, end) {
  let value = angle;
  while (value < start) value += TAU;
  while (value > end) value -= TAU;
  return value;
}
export function innerGlassSpans() {
  const [start, end] = solidSpan();
  const cuts = [];
  for (const exhibit of campusExhibits) {
    const angle = wrapToSpan(exhibit.angle, start, end);
    if (angle <= start || angle >= end) continue;
    cuts.push({ open: angle - exhibit.half, close: angle + exhibit.half });
  }
  cuts.sort((a, b) => a.open - b.open);
  const spans = [];
  let cursor = start;
  for (const cut of cuts) {
    if (cut.open > cursor + 0.02) spans.push([cursor, cut.open]);
    cursor = Math.max(cursor, cut.close);
  }
  if (end > cursor + 0.02) spans.push([cursor, end]);
  return spans;
}
export function ribAngles() {
  const angles = [];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI + (i * TAU) / count;
    if (inOpening(angle, entryAngle, entryGap)) continue;
    if (campusExhibits.some((item) => inOpening(angle, item.angle, item.half)))
      continue;
    angles.push(angle);
  }
  const frames = [
    entryAngle - entryGap,
    entryAngle + entryGap,
    ...campusExhibits.flatMap((item) => [
      item.angle - item.half,
      item.angle + item.half,
    ]),
  ];
  for (const angle of frames)
    if (!angles.some((have) => Math.abs(angleDelta(have, angle)) < 0.04))
      angles.push(angle);
  return angles;
}
export function courtyardLoop(count = 20) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const p = campusPoint(entryAngle + (i * TAU) / count, campusRadii.court);
    points.push([p.x, p.z]);
  }
  return points;
}
export function campusPaths() {
  const loop = courtyardLoop();
  const approach = [campusCenter.x, -18.05];
  const paths = [
    [[0, -16], [campusCenter.x, -16], 3],
    [[campusCenter.x, -16], approach, 3],
    [approach, loop[0], 3],
  ];
  for (let i = 0; i < loop.length; i++)
    paths.push([loop[i], loop[(i + 1) % loop.length], 3]);
  return paths;
}
export function campusFeet() {
  const loop = courtyardLoop();
  const north = loop[loop.length / 2];
  return {
    ring: { x: campusCenter.x, z: -16.7 },
    campus: { x: north[0], z: north[1] },
  };
}
export function campusMeadow() {
  return [
    [0, -0.72, 1.2],
    [-1.02, -0.18, 0.78],
    [1.08, -0.12, 0.7],
    [-0.58, -0.98, 0.62],
    [0.72, -0.92, 0.55],
    [-1.18, 0.42, 0.5],
    [1.2, 0.38, 0.48],
  ].map(([x, z, s]) => ({
    x: campusCenter.x + x * 0.78,
    z: campusCenter.z + z * 0.78,
    s,
    radius: 0.34 * s,
  }));
}
export function exhibitPose(exhibit) {
  const p = campusPoint(exhibit.angle, campusRadii.stand, 0);
  return {
    ...exhibit,
    x: p.x,
    z: p.z,
    radius: exhibit.id === "shelf" ? 0.62 : 0.42,
    yaw: Math.atan2(-Math.cos(exhibit.angle), -Math.sin(exhibit.angle)),
  };
}
export function exhibitPoses() {
  return campusExhibits.map(exhibitPose);
}
export function insideCampusMass(x, z) {
  const radius = campusRadius(x, z);
  if (radius < campusRadii.floorInner || radius > campusRadii.floorOuter)
    return false;
  return !inOpening(radialAngle(x, z), entryAngle, entryGap);
}
export function ribThickness(angle) {
  const framed =
    Math.abs(Math.abs(angleDelta(angle, entryAngle)) - entryGap) < 0.045 ||
    campusExhibits.some(
      (item) =>
        Math.abs(Math.abs(angleDelta(angle, item.angle)) - item.half) < 0.045,
    );
  return framed ? 0.05 : 0.032;
}
export function hitsRib(x, z, pad = 0) {
  const radius = campusRadius(x, z);
  const inner = campusRadii.glassInner + 0.08 - pad;
  const outer = campusRadii.glassOuter - 0.08 + pad;
  if (radius < inner || radius > outer) return false;
  const angle = radialAngle(x, z);
  return ribAngles().some(
    (rib) =>
      Math.abs(angleDelta(angle, rib)) * radius < ribThickness(rib) + pad,
  );
}
export function nearGlass(x, z, which, pad = 0.08) {
  const radius = campusRadius(x, z);
  const target =
    which === "outer" ? campusRadii.glassOuter : campusRadii.glassInner;
  if (Math.abs(radius - target) > pad) return false;
  const angle = radialAngle(x, z);
  if (inOpening(angle, entryAngle, entryGap)) return false;
  if (
    which === "inner" &&
    campusExhibits.some((item) => inOpening(angle, item.angle, item.half))
  )
    return false;
  return true;
}
export function campusView() {
  const shelf = campusPoint(-Math.PI / 2, campusRadii.stand);
  const feet = campusFeet();
  return {
    overview: {
      position: [campusCenter.x + 10, 11, campusCenter.z + 24],
      target: [campusCenter.x, 0.8, campusCenter.z],
      portrait: {
        position: [campusCenter.x + 2, 13, campusCenter.z + 24],
        target: [campusCenter.x, 1, campusCenter.z],
        fov: 78,
      },
    },
    court: {
      position: [feet.campus.x + 0.72, 1.66, feet.campus.z + 0.42],
      target: [shelf.x, 1.2, shelf.z],
      portrait: {
        position: [feet.campus.x, 2.0, feet.campus.z + 0.1],
        target: [shelf.x, 1.3, shelf.z],
        fov: 58,
      },
    },
  };
}
export function exhibitFacing(exhibit) {
  const yaw = exhibitPose(exhibit).yaw;
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}
export const campusArrival = {
  position: [28, 29, 37],
  target: [-7, 0.8, -11],
  portrait: { position: [20, 44, 57], target: [-8, 0, -11], fov: 76 },
};
export const campusTree = {
  x: campusCenter.x - 0.5,
  z: campusCenter.z - 0.6,
  radius: 0.86,
};

export function campusPathContours() {
  const half = 0.96,
    outer = campusRadii.court + half;
  const alpha = Math.asin(half / outer);
  const outline = [];
  for (let i = 0; i <= 112; i++) {
    const p = campusPoint(
      Math.PI / 2 + alpha + ((TAU - alpha * 2) * i) / 112,
      outer,
    );
    outline.push([p.x, p.z]);
  }
  outline.push(
    [campusCenter.x + half, -16 - half],
    [0.4, -16 - half],
    [0.4, -16 + half],
    [campusCenter.x - half, -16 + half],
  );
  const hole = Array.from({ length: 96 }, (_, i) => {
    const p = campusPoint((-TAU * i) / 96, campusRadii.court - half);
    return [p.x, p.z];
  });
  return { outline, hole };
}
export function onCampusPath(x, z) {
  return campusPaths().some(([a, b]) => {
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)),
    );
    return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < 0.98;
  });
}
