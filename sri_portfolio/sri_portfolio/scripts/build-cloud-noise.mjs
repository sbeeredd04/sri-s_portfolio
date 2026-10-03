// Original tileable volume: low-frequency weather + rounded cellular detail.
// Bake offline so opening the world never builds a noise volume on the UI thread.
import { writeFile } from "node:fs/promises";
const size = 64;
const fract = (n) => n - Math.floor(n);
const hash = (x, y, z) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
const wrap = (v, n) => ((v % n) + n) % n;
function noise(x, y, z, n) {
  x *= n;
  y *= n;
  z *= n;
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const smooth = (t) => t * t * (3 - 2 * t);
  const fx = smooth(fract(x)),
    fy = smooth(fract(y)),
    fz = smooth(fract(z));
  let sum = 0;
  for (let dz = 0; dz < 2; dz++)
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++)
        sum +=
          hash(wrap(ix + dx, n), wrap(iy + dy, n), wrap(iz + dz, n)) *
          (dx ? fx : 1 - fx) *
          (dy ? fy : 1 - fy) *
          (dz ? fz : 1 - fz);
  return sum;
}
function cellular(x, y, z, n) {
  x *= n;
  y *= n;
  z *= n;
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  let distance = 2;
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const a = wrap(ix + dx, n),
          b = wrap(iy + dy, n),
          c = wrap(iz + dz, n);
        const px = ix + dx + hash(a, b, c),
          py = iy + dy + hash(a + 13, b + 41, c + 7),
          pz = iz + dz + hash(a + 31, b + 9, c + 29);
        distance = Math.min(distance, Math.hypot(px - x, py - y, pz - z));
      }
  return 1 - Math.min(1, distance);
}
const bytes = new Uint8Array(size ** 3 * 2);
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const p = [x / size, y / size, z / size],
        at = ((z * size + y) * size + x) * 2;
      bytes[at] = Math.round(
        255 *
          (noise(...p, 4) * 0.58 +
            noise(...p, 8) * 0.28 +
            noise(...p, 16) * 0.14),
      );
      bytes[at + 1] = Math.round(255 * cellular(...p, 8));
    }
await writeFile(
  new URL("../public/atmosphere/cloud-noise-64.bin", import.meta.url),
  bytes,
);
console.log(`Cloud volume: ${bytes.length / 1024} KiB, ${size}³ RG8.`);
