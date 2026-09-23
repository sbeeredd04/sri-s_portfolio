import { renderedSurfaceHeight } from "./terrain-geometry.mjs";

export const pavingSize = [0.62, 0.025, 0.64];

// Shared by rendering and layout checks, including the snapped edge cells.
export function pavingCells(paths) {
  const cells = new Map();
  for (const [from, to, width = 3] of paths) {
    const dx = to[0] - from[0],
      dz = to[1] - from[1];
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.4));
    const angle = Math.atan2(dx, dz);
    for (let i = 0; i <= n; i++)
      for (let j = 0; j < width; j++) {
        const offset = (j - (width - 1) / 2) * 0.64;
        const gx = Math.round(
          (from[0] + (dx * i) / n + Math.cos(angle) * offset) / 0.64,
        );
        const gz = Math.round(
          (from[1] + (dz * i) / n - Math.sin(angle) * offset) / 0.64,
        );
        cells.set(`${gx}:${gz}`, { x: gx * 0.64, z: gz * 0.64, a: 0 });
      }
  }
  return [...cells.values()];
}

// Each tread has a level top and a buried foundation. Sampling its full
// footprint prevents sloping ground from slicing through the exposed face.
export function pavingPlacements(biome, paths) {
  return pavingCells(paths).map((stone) => {
    const heights = [];
    for (const dx of [-pavingSize[0] / 2, 0, pavingSize[0] / 2])
      for (const dz of [-pavingSize[2] / 2, 0, pavingSize[2] / 2])
        heights.push(renderedSurfaceHeight(biome, stone.x + dx, stone.z + dz));
    const top = Math.max(...heights) + 0.025;
    const bottom = Math.min(...heights) - 0.035;
    return { ...stone, y: (top + bottom) / 2, height: top - bottom };
  });
}
