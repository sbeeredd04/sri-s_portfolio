import {
  meadowDrifts,
  meadowPathClearance,
  meadowPavingClearance,
} from "./coastal-meadow.mjs";
import { trees } from "./fieldnotes-quarter.mjs";
export const coastalGround = { size: 256, extent: 24 };
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (x, z) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    u = smooth(0, 1, x - ix),
    v = smooth(0, 1, z - iz);
  const a = hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u,
    b = hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u;
  return a * (1 - v) + b * v;
}
// Metre-scaled cover, from the same drifts and full-width walks as the geometry.
// R: meadow base, G: exposed root soil, B: worn path margin. A: reserved.
export function coastalCoverAt(x, z) {
  const variation = noise(x * 0.8, z * 0.8) - 0.5;
  let meadow = 0,
    roots = 0;
  for (const [cx, cz, rx, rz, turn] of meadowDrifts) {
    const dx = x - cx,
      dz = z - cz,
      u = dx * Math.cos(turn) + dz * Math.sin(turn),
      v = -dx * Math.sin(turn) + dz * Math.cos(turn);
    meadow = Math.max(
      meadow,
      1 - smooth(0.65, 1.12, Math.hypot(u / rx, v / rz) + variation * 0.12),
    );
  }
  for (const t of trees)
    roots = Math.max(
      roots,
      1 -
        smooth(
          0.25,
          0.95 * t.s,
          Math.hypot(x - t.x, z - t.z) + variation * 0.16,
        ),
    );
  const clearance = Math.min(
    meadowPathClearance(x, z),
    meadowPavingClearance(x, z),
  );
  const wear = (1 - smooth(0.04, 0.48 + variation * 0.15, clearance)) * 0.72;
  const edge = 1 - smooth(22, 24, Math.max(Math.abs(x), Math.abs(z)));
  return [meadow * edge, roots * edge, wear * edge];
}
export function coastalCoverPixels() {
  const { size, extent } = coastalGround,
    data = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      const cover = coastalCoverAt(
          (((x + 0.5) / size) * 2 - 1) * extent,
          (((z + 0.5) / size) * 2 - 1) * extent,
        ),
        i = (z * size + x) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = Math.round(cover[c] * 255);
      data[i + 3] = 255;
    }
  return data;
}
