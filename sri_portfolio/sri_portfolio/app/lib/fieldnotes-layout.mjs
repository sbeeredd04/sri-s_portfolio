import { regions } from "./world-layout.mjs";
import { walkingRoutes, pathPose } from "./world-paths.mjs";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";

// One publishing garden. Paths, furniture, cameras and paving share these metres.
export const fieldnotesRoute = {
  west: -6.35,
  east: 5.15,
  south: -4.7,
  north: 5.45,
  loopWidth: 1.85,
  spurZ: 0.95,
  spurEnd: -3.72,
  spurWidth: 1.64,
  pavingStart: -7.7,
};

export const fieldnotesSpawn = [0, -7.2];

export const fieldnotesCanopy = {
  x0: -4.18,
  x1: -0.22,
  zBack: 3.98,
  zFront: 2.1,
  thickness: 0.04,
};

export const fieldnotesWall = {
  x0: -4.22,
  x1: -0.18,
  z: 3.98,
  thickness: 0.18,
};

export const fieldnotesReturn = {
  x: -4.14,
  thickness: 0.16,
  z0: 2.2,
  z1: 3.89,
};

export const fieldnotesDesk = {
  x: -2.15,
  z: 3.46,
  hx: 0.7,
  hz: 0.34,
  top: 0.74,
};

export const fieldnotesChair = {
  x: -2.15,
  z: 2.5,
  hx: 0.26,
  back: 0.34,
  front: 0.24,
};

export const fieldnotesLoungeScale = 0.64;
export const fieldnotesTerraces = [
  { x: -2.2, z: 2.96, width: 4.45, depth: 2.48 },
  { x: 0.1, z: -2.12, width: 3.95, depth: 2.38 },
  { x: 3.55, z: 0.4, width: 1.34, depth: 2.05 },
];
export const fieldnotesWalkEntries = {
  writing: { point: [-5.7, 0.95], aim: [-3.72, 0.95] },
  socials: { point: [5.15, -1.8], aim: [5.15, 0.4] },
  collaborate: { point: [-2.7, -4.7], aim: [0.1, -4.7] },
};
export const fieldnotesLamp = { position: [2.65, 0.022, -2.12], scale: 0.72 };
export const fieldnotesDeskLamp = {
  base: [-1.62, 0.748, 3.5],
  bulb: [-1.73, 1.2, 3.43],
};

export const fieldnotesLounge = [
  { x: -1.22, z: -2.12, yaw: Math.PI / 2 },
  { x: 1.42, z: -2.12, yaw: -Math.PI / 2 },
];

export const fieldnotesTable = {
  x: 0.1,
  z: -2.12,
  radius: 0.34,
  top: 0.5,
};

export const fieldnotesDisplay = {
  x: 3.25,
  z: 0.4,
  depth: 0.56,
  width: 1.5,
  plinth: 0.72,
  panelT: 0.05,
  panelH: 1.05,
};

export const fieldnotesBeds = [
  { x: -3.95, z: -1.8, w: 1.85, d: 2.4 },
  { x: 2.05, z: 3.2, w: 2.9, d: 1.35 },
];

export const fieldnotesPlants = [
  { x: -4.35, z: -2.4, r: 0.38, kind: "clump" },
  { x: -3.55, z: -1.15, r: 0.28, kind: "grass" },
  { x: 1.35, z: 3.2, r: 0.4, kind: "shrub" },
  { x: 2.8, z: 3.25, r: 0.3, kind: "grass" },
];

const route = fieldnotesRoute;
export const fieldnotesPaths = [
  [[0, -8], [0, route.south], route.loopWidth],
  [[0, route.south], [route.west, route.south], route.loopWidth],
  [[route.west, route.south], [route.west, route.north], route.loopWidth],
  [[route.west, route.north], [route.east, route.north], route.loopWidth],
  [[route.east, route.north], [route.east, route.south], route.loopWidth],
  [[route.east, route.south], [0, route.south], route.loopWidth],
  [[route.west, route.spurZ], [route.spurEnd, route.spurZ], route.spurWidth],
];

let bridgeY;
export function fieldnotesBridgeY() {
  if (bridgeY !== undefined) return bridgeY;
  const future = regions.find((region) => region.id === "future");
  const crossing = walkingRoutes.find(
    (item) => item.from === "trail" && item.to === "future",
  );
  const point = pathPose(crossing, 1, 0, 0.115)
    .position.clone()
    .sub(future.center)
    .applyQuaternion(future.rotation.clone().invert());
  bridgeY = point.y;
  return bridgeY;
}

export function fieldnotesDeckHeight() {
  return fieldnotesBridgeY();
}

export function fieldnotesCanopyY(x, z) {
  const { x0, x1, zBack, zFront } = fieldnotesCanopy;
  const u = (x - x0) / (x1 - x0);
  const v = (z - zBack) / (zFront - zBack);
  const fold = Math.cos((u - 0.28) * Math.PI) * 0.18;
  return 2.78 - v * 0.4 + fold * (1 - v * 0.25);
}

export function fieldnotesColumnPoints() {
  const { x0, x1, zBack, zFront } = fieldnotesCanopy;
  return [0.08, 0.92].map((u) => ({
    x: x0 + (x1 - x0) * u,
    z: zBack + (zFront - zBack) * 0.82,
    size: 0.11,
  }));
}

export function fieldnotesPathQuery(x, z) {
  let best = Infinity,
    width = route.loopWidth;
  for (const [a, b, segmentWidth] of fieldnotesPaths) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.min(
      1,
      Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / len2),
    );
    const distance = Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
    if (distance < best) {
      best = distance;
      width = segmentWidth;
    }
  }
  return { distance: best, half: width / 2, width };
}

export function onFieldnotesPath(x, z, margin = 0) {
  const query = fieldnotesPathQuery(x, z);
  return query.distance <= query.half + margin;
}

export function fieldnotesFootHeight(x, z) {
  if (onFieldnotesPath(x, z, 0.04)) return fieldnotesDeckHeight() + 0.004;
  return renderedSurfaceHeight("future", x, z) + 0.031;
}

export function fieldnotesExpectsPaving(x, z) {
  if (!onFieldnotesPath(x, z, -0.05)) return false;
  if (z < route.pavingStart + 0.04 && Math.abs(x) < route.loopWidth / 2 + 0.08)
    return false;
  return true;
}

export function fieldnotesPathSamples(step = 0.4) {
  const samples = [];
  for (const [a, b, width] of fieldnotesPaths) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const length = Math.hypot(dx, dz) || 1;
    const count = Math.max(1, Math.ceil(length / step));
    const nx = -dz / length,
      nz = dx / length;
    for (let i = 0; i <= count; i++) {
      const x = a[0] + (dx * i) / count,
        z = a[1] + (dz * i) / count;
      for (const side of [-1, 0, 1]) {
        const offset = side * (width / 2 - 0.05);
        samples.push({ x: x + nx * offset, z: z + nz * offset });
      }
    }
  }
  return samples;
}

function footprint(x, z, yaw, hx, back, front) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const corners = [
    [-hx, -back],
    [hx, -back],
    [hx, front],
    [-hx, front],
  ].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
  const xs = corners.map((point) => point[0]),
    zs = corners.map((point) => point[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

export function fieldnotesDisplayFrame() {
  const display = fieldnotesDisplay;
  const y0 = display.plinth,
    y1 = display.plinth + display.panelH;
  return {
    plinth: {
      x: display.x,
      z: display.z,
      hx: display.depth / 2,
      hz: display.width / 2,
      hy: display.plinth / 2,
    },
    panel: {
      x: display.x + display.depth / 2 + display.panelT / 2,
      z: display.z,
      hx: display.panelT / 2,
      hz: display.width / 2 - 0.06,
      y: (y0 + y1) / 2,
      hy: (y1 - y0) / 2,
    },
  };
}

export function fieldnotesSignPoses() {
  const frame = fieldnotesDisplayFrame();
  const wallSouth = fieldnotesWall.z - fieldnotesWall.thickness / 2;
  const cardZ = fieldnotesTable.z - 0.22;
  return {
    writing: {
      position: [fieldnotesDesk.x, 1.64, wallSouth - 0.014],
      rotation: [0, Math.PI, 0],
      normal: [0, 0, -1],
      size: [1.46, 0.58],
      title: "Field notes by Sri",
      subtitle: "WRITING & CONTENT / COMING SOON",
      accent: "#c6b39a",
    },
    socials: {
      position: [
        frame.panel.x + frame.panel.hx + 0.012,
        frame.panel.y,
        frame.panel.z,
      ],
      rotation: [0, Math.PI / 2, 0],
      normal: [1, 0, 0],
      size: [1.2, 0.72],
      title: "Elsewhere, together.",
      subtitle: "LINKEDIN · GITHUB · SAY HELLO",
      accent: "#8aa399",
    },
    collaborate: {
      position: [fieldnotesTable.x, 0.74, cardZ - 0.01 - 0.014],
      rotation: [0, Math.PI, 0],
      normal: [0, 0, -1],
      size: [0.46, 0.28],
      title: "Say hello.",
      subtitle: "LET’S MAKE SOMETHING",
      accent: "#c6b39a",
    },
  };
}

export function fieldnotesObstacles() {
  const boxes = [
    footprint(
      fieldnotesDesk.x,
      fieldnotesDesk.z,
      0,
      fieldnotesDesk.hx,
      fieldnotesDesk.hz,
      fieldnotesDesk.hz,
    ),
    footprint(
      fieldnotesChair.x,
      fieldnotesChair.z,
      0,
      fieldnotesChair.hx,
      fieldnotesChair.back,
      fieldnotesChair.front,
    ),
    {
      minX: fieldnotesWall.x0,
      maxX: fieldnotesWall.x1,
      minZ: fieldnotesWall.z - fieldnotesWall.thickness / 2,
      maxZ: fieldnotesWall.z + fieldnotesWall.thickness / 2,
    },
    {
      minX: fieldnotesReturn.x - fieldnotesReturn.thickness / 2,
      maxX: fieldnotesReturn.x + fieldnotesReturn.thickness / 2,
      minZ: fieldnotesReturn.z0,
      maxZ: fieldnotesReturn.z1,
    },
  ];
  for (const seat of fieldnotesLounge)
    boxes.push(
      footprint(
        seat.x,
        seat.z,
        seat.yaw,
        0.82 * fieldnotesLoungeScale,
        0.9 * fieldnotesLoungeScale,
        0.78 * fieldnotesLoungeScale,
      ),
    );
  for (const column of fieldnotesColumnPoints())
    boxes.push({
      minX: column.x - 0.12,
      maxX: column.x + 0.12,
      minZ: column.z - 0.12,
      maxZ: column.z + 0.12,
    });
  const frame = fieldnotesDisplayFrame();
  boxes.push({
    minX: frame.plinth.x - frame.plinth.hx,
    maxX: frame.panel.x + frame.panel.hx,
    minZ: frame.plinth.z - frame.plinth.hz,
    maxZ: frame.plinth.z + frame.plinth.hz,
  });
  return {
    boxes,
    circles: [
      fieldnotesTable,
      {
        x: fieldnotesLamp.position[0],
        z: fieldnotesLamp.position[2],
        radius: 0.21,
      },
      ...fieldnotesPlants.map((plant) => ({
        x: plant.x,
        z: plant.z,
        radius: plant.r,
      })),
    ],
  };
}

export function fieldnotesBlocks(x, z, pad = 0.03) {
  const { boxes, circles } = fieldnotesObstacles();
  for (const box of boxes)
    if (
      x >= box.minX - pad &&
      x <= box.maxX + pad &&
      z >= box.minZ - pad &&
      z <= box.maxZ + pad
    )
      return true;
  for (const circle of circles)
    if (Math.hypot(x - circle.x, z - circle.z) <= circle.radius + pad)
      return true;
  return false;
}

export const fieldnotesArrival = {
  position: [6.4, 4.8, -9.2],
  target: [-0.5, 1.3, 1.0],
  portrait: { position: [4.6, 10.7, -20], target: [-0.3, 1.1, 0.6] },
};

export const fieldnotesCameras = {
  socials: {
    position: [6.9, 2.05, 1.6],
    target: [3.45, 1.15, 0.4],
    portrait: { position: [7.3, 2.7, 2.5], target: [3.4, 1.05, 0.4] },
  },
  writing: {
    position: [-2.15, 2.25, -2.2],
    target: [-2.15, 1.3, 3.2],
    portrait: { position: [-2.9, 2.1, -2], target: [-2.15, 1.3, 3.2] },
  },
  collaborate: {
    position: [0.1, 1.95, -6.3],
    target: [0.1, 0.7, -2.12],
    portrait: { position: [1.6, 2.55, -7.1], target: [0.1, 0.65, -2.12] },
  },
};

export const fieldnotesStreet = [
  { label: "The publishing garden", point: [0, -6.2], look: [-0.4, 1.2] },
  { label: "Along the pavilion", point: [-6.35, -0.2], look: [-2.2, 2.5] },
  { label: "A place to write", point: [-4.9, 0.95], look: [-2.15, 2.8] },
  { label: "Pull up a chair", point: [0.1, -4.7], look: [0.1, -2.12] },
  { label: "Say hello", point: [5.15, 0.4], look: [3.25, 0.4] },
];

export const fieldnotesMaterialNames = [
  "stone",
  "timber",
  "charcoal",
  "copper",
  "ivory",
  "garden",
  "paving",
];
