import { BoxGeometry, Matrix4, Quaternion, Euler, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { surfaceHeight } from "./world-layout.mjs";

import { APARTMENT_LEVEL } from "./studio-layout.mjs";
export const sfBlocks = [
  ...[-17, -11, -5, 1, 7].map((x, i) => ({
    x,
    z: -16,
    width: 4.9,
    depth: 6,
    height: 7.2 + (i % 3) * 1.2,
    tone: i % 3,
  })),
  ...[-14, -8, -2, 4].map((x, i) => ({
    x,
    z: -28,
    width: 4.9,
    depth: 6,
    height: 7.8 + (i % 2) * 2.4,
    tone: (i + 1) % 3,
  })),
];
export const coitSite = { x: 18, z: -20, radius: 3.7 };
export const sfPalette = {
  ivory: "#cabfae",
  sage: "#91a69e",
  clay: "#b49384",
  trim: "#e0d7c4",
  stone: "#757d83",
  roof: "#48525a",
  glass: "#233a49",
  glow: "#a88d62",
  paving: "#898d8d",
  asphalt: "#3a424b",
  rail: "#394752",
  door: "#5c716d",
};
function box(batches, material, position, size, rotation = [0, 0, 0]) {
  (batches[material] ||= []).push({ position, size, rotation });
}
// Full façade bays, sills and structural cornices, composed in shared metre units.
function facade(
  b,
  { x, z, width, depth, height, tone },
  ground = 0,
  apartment = false,
) {
  const material = ["ivory", "sage", "clay"][tone];
  box(b, material, [x, ground + height / 2, z], [width, height, depth]);
  box(b, "stone", [x, ground + 0.24, z], [width + 0.12, 0.48, depth + 0.12]);
  const front = z + depth / 2;
  const floors = Math.round(height / 3.2);
  const bays = apartment ? [-4.6, -2.3, 2.3, 4.6] : [-1.28, 1.28];
  for (let f = 0; f < floors; f++) {
    const y = ground + 1.85 + f * 3.2;
    box(
      b,
      "trim",
      [x, ground + (f + 1) * 3.2 - 0.12, z],
      [width + 0.22, 0.18, depth + 0.22],
    );
    for (const bx of bays) {
      const wx = x + bx;
      // Recessed outer opening plus shallow projecting bay with two angled cheeks.
      box(b, "trim", [wx, y, front + 0.16], [1.55, 1.95, 0.42]);
      box(
        b,
        (f + Math.round(bx)) % 3 === 0 ? "glow" : "glass",
        [wx, y, front + 0.385],
        [1.27, 1.65, 0.025],
      );
      box(b, "trim", [wx, y, front + 0.407], [0.065, 1.7, 0.035]);
      box(b, "trim", [wx, y + 0.13, front + 0.409], [1.28, 0.06, 0.035]);
      box(b, "trim", [wx, y - 0.98, front + 0.23], [1.72, 0.12, 0.62]);
      for (const side of [-1, 1]) {
        box(
          b,
          "glass",
          [wx + side * 0.7, y, front + 0.08],
          [0.31, 1.63, 0.025],
          [0, (side * Math.PI) / 4, 0],
        );
      }
    }
  }
  for (const side of [-1, 1])
    for (let f = 0; f < floors; f++)
      for (const wz of [-depth * 0.24, depth * 0.24]) {
        box(
          b,
          "trim",
          [x + side * (width / 2 + 0.05), ground + 1.85 + f * 3.2, z + wz],
          [0.12, 1.9, 1.52],
        );
        box(
          b,
          "glass",
          [x + side * (width / 2 + 0.12), ground + 1.85 + f * 3.2, z + wz],
          [0.025, 1.64, 1.26],
        );
        box(
          b,
          "trim",
          [x + side * (width / 2 + 0.14), ground + 1.85 + f * 3.2, z + wz],
          [0.035, 1.66, 0.065],
        );
        box(
          b,
          "trim",
          [x + side * (width / 2 + 0.14), ground + 1.98 + f * 3.2, z + wz],
          [0.035, 0.065, 1.28],
        );
      }
  // A centered door has an unbroken approach from the front pavement.
  box(b, "trim", [x, ground + 1.12, front + 0.065], [1.38, 2.24, 0.14]);
  box(b, "door", [x, ground + 1.06, front + 0.15], [1.12, 2.12, 0.08]);
  box(b, "glass", [x, ground + 1.55, front + 0.2], [0.78, 0.82, 0.025]);
  box(b, "trim", [x + 0.38, ground + 1.04, front + 0.215], [0.045, 0.28, 0.03]);
  box(
    b,
    "roof",
    [x, ground + height + (apartment ? -0.2 : 0.08), z],
    [width + 0.5, 0.16, depth + 0.45],
  );
  if (!apartment) {
    for (const side of [-1, 1])
      box(
        b,
        "trim",
        [x + (side * width) / 2, ground + height + 0.3, z],
        [0.16, 0.48, depth],
      );
    box(
      b,
      "trim",
      [x, ground + height + 0.3, z - depth / 2],
      [width, 0.48, 0.16],
    );
    box(
      b,
      "trim",
      [x, ground + height + 0.34, front],
      [width + 0.22, 0.52, 0.22],
    );
  }
}
export function sfNeighborhoodBatches() {
  const b = {};
  for (const block of sfBlocks) {
    const corners = [-1, 1].flatMap((a) =>
      [-1, 1].map((c) =>
        surfaceHeight(
          "studio",
          block.x + (a * block.width) / 2,
          block.z + (c * block.depth) / 2,
        ),
      ),
    );
    const ground = Math.max(...corners);
    facade(b, block, ground);
    box(
      b,
      "stone",
      [block.x, ground - 0.5, block.z],
      [block.width, 1, block.depth],
    );
    box(
      b,
      "paving",
      [block.x, ground + 0.035, block.z + block.depth / 2 + 0.9],
      [5.9, 0.07, 1.8],
    );
  }
  // Two parallel east-west streets, with an eastern connection to home.
  for (const z of [-10, -22])
    for (let x = -20; x <= 10; x += 1) {
      const y = surfaceHeight("studio", x, z);
      box(b, "asphalt", [x, y + 0.025, z], [1.02, 0.05, 3.2]);
      for (const side of [-1, 1])
        box(b, "paving", [x, y + 0.09, z + side * 1.7], [1.02, 0.18, 0.2]);
    }
  for (let z = -22; z <= 8; z += 1) {
    const y = surfaceHeight("studio", 11.5, z);
    box(b, "asphalt", [11.5, y + 0.025, z], [2.8, 0.05, 1.02]);
    for (const side of [-1, 1]) {
      // The tower street enters from the east. Drop that curb so the turn is open.
      if (side === 1 && z >= 2 && z <= 5) continue;
      box(b, "paving", [11.5 + side * 1.5, y + 0.09, z], [0.2, 0.18, 1.02]);
    }
  }
  for (let x = 13.3; x <= 18; x += 0.5)
    box(
      b,
      "paving",
      [x, surfaceHeight("studio", x, -20) + 0.06, -20],
      [0.51, 0.12, 1.5],
    );
  // Main door joins the world causeways through a continuous front walk.
  for (let z = 5.4; z <= 9.4; z += 0.5)
    box(
      b,
      "paving",
      [0, surfaceHeight("studio", 0, z) + 0.055, z],
      [1.8, 0.11, 0.51],
    );
  return b;
}
export function apartmentBaseBatches() {
  const b = {};
  facade(
    b,
    { x: 0, z: 0.5, width: 13, depth: 9, height: APARTMENT_LEVEL, tone: 0 },
    0,
    true,
  );
  // Front landing and roof terrace outside the top-floor doorway.
  box(b, "stone", [0, APARTMENT_LEVEL - 0.16, 5.8], [13.5, 0.32, 2.6]);
  for (const z of [7.04]) {
    box(b, "rail", [0, APARTMENT_LEVEL + 1.05, z], [13.5, 0.07, 0.065]);
    for (let x = -6.6; x <= 6.6; x += 0.55)
      box(b, "rail", [x, APARTMENT_LEVEL + 0.53, z], [0.035, 1.06, 0.035]);
  }
  return b;
}
export function cityBatchGeometry(items) {
  const matrix = new Matrix4();
  const pieces = items.map(({ position, size, rotation }) => {
    const g = new BoxGeometry(...size).toNonIndexed();
    matrix.compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)),
      new Vector3(1, 1, 1),
    );
    return g.applyMatrix4(matrix);
  });
  const result = mergeGeometries(pieces);
  pieces.forEach((g) => g.dispose());
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}
