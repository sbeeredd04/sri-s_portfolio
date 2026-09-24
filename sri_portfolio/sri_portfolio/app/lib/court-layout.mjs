// Playing rectangles follow the sports' real proportions. These are neighborhood
// courts, not a claim of competition-certified venues or full safety runoffs.
export const courts = {
  badminton: {
    center: [0, 0],
    width: 6.1,
    depth: 13.4,
    apron: 1.15,
    net: 1.55,
  },
  volleyball: { center: [-12, 0], width: 9, depth: 18, apron: 1.4, net: 2.43 },
  basketball: {
    center: [14, 0],
    width: 15,
    depth: 11,
    apron: 1.25,
    hoop: 3.05,
  },
};
export const courtEntrance = [-21, 0, 13];
export const courtPaths = [
  [[-21, 13], [24, 13], 3],
  [[-12, 13], [-12, 10.8], 2],
  [[0, 13], [0, 8.1], 2],
  [[14, 13], [14, 7.2], 2],
];
export const courtBenches = [
  { position: [-19.1, 0, 5], rotation: [0, Math.PI / 2, 0] },
  { position: [-5.6, 0, 3.5], rotation: [0, Math.PI / 2, 0] },
  { position: [24, 0, 2], rotation: [0, -Math.PI / 2, 0] },
];
// Scanned CC0 park furniture on the far side of the promenade (z = 13):
// picnic tables turned long-side to the courts, bins by each court path.
export const courtPicnicTables = [
  { position: [-6, 0, 17.2], rotation: Math.PI / 2 },
  { position: [7.5, 0, 17.4], rotation: Math.PI / 2 + 0.12 },
];
export const courtBins = [
  { position: [-10.3, 0, 15.3], rotation: 0.3 },
  { position: [1.7, 0, 15.3], rotation: -0.2 },
  { position: [15.7, 0, 15.3], rotation: 0.1 },
];
export const courtTrees = Array.from({ length: 22 }, (_, i) => ({
  x: -23 + i * 2.25,
  z: -13.8 - (i % 3) * 1.3,
  s: 0.85 + (i % 7) * 0.1,
}));
export function courtFootprint(id, padding = 0) {
  const c = courts[id];
  return {
    x: c.center[0],
    z: c.center[1],
    halfWidth: c.width / 2 + padding,
    halfDepth: c.depth / 2 + padding,
  };
}
export function overlapsCourt(x, z, halfX, halfZ, id, padding = 0) {
  const c = courtFootprint(id, padding);
  return (
    Math.abs(x - c.x) < c.halfWidth + halfX &&
    Math.abs(z - c.z) < c.halfDepth + halfZ
  );
}
export const courtViews = {
  arrival: {
    position: [26, 25, 39],
    target: [1, 0.8, 1],
    portrait: { position: [20, 37, 58], target: [1, 0.8, 1], fov: 70 },
  },
  badminton: {
    position: [7.1, 5.8, 12.2],
    target: [0, 1.2, 0],
    portrait: { position: [5, 8, 19], target: [0, 1, 0], fov: 62 },
  },
  volleyball: {
    position: [-4.5, 7.7, 16],
    target: [-12, 1.2, 0],
    portrait: { position: [-10, 10, 23], target: [-12, 1, 0], fov: 62 },
  },
  basketball: {
    position: [20.8, 5.8, 10.4],
    target: [14, 1.35, -0.8],
    portrait: { position: [17.3, 7.2, 17], target: [14, 1.5, -0.8], fov: 58 },
  },
};

// Shared planting and practical-light locations are outside every playable apron.
export const courtPlanting = Array.from({ length: 100 }, (_, i) => ({
  x: -23 + i * 0.48,
  z: -12.1 - (i % 3) * 0.24,
}));
export const courtLamps = [
  [-19, 6, -4],
  [-5.5, 6, -8],
  [5.5, 6, -8],
  [23.5, 6, -4],
];
