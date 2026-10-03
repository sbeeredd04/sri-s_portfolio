import { BufferGeometry, Float32BufferAttribute } from "three";

// In Fieldnotes' tangent frame. The island is beyond the garden's entire
// coastal shoulder; its skirt extends below the rendered ocean surface.
export const lookoutVista = {
  center: [-2, 55],
  top: 0.9,
  bottom: -6.8,
  towerHeight: 8.4,
  focus: [-2, 3.3, 55],
};

// Authored outline: a low western shelf, a broad central stack and a narrow
// eastern tail. Layer offsets make rock strata rather than a scaled sphere.
const outline = [
  [-9, -1],
  [-7.2, -4],
  [-3.7, -5.2],
  [-0.5, -4.5],
  [3.2, -3.6],
  [7.3, -1.8],
  [10.5, 0.7],
  [7, 2.4],
  [4.5, 3],
  [1.8, 4.4],
  [-2.7, 4.6],
  [-6.4, 2.7],
];
const layers = [
  { scale: 1.08, y: lookoutVista.bottom },
  { scale: 1.01, y: -3.9 },
  { scale: 0.94, y: -2.8 },
  { scale: 0.98, y: -2.4 },
  { scale: 0.88, y: -0.5 },
  { scale: 0.85, y: -0.4 },
  { scale: 0.35, y: lookoutVista.top },
];
export function buildLookoutIsland() {
  const positions = [],
    colors = [];
  const n = outline.length * 4;
  const point = (ring, i) => {
    const index = (i + n) % n;
    const a = outline[Math.floor(index / 4)],
      b = outline[(Math.floor(index / 4) + 1) % outline.length];
    const t = (index % 4) / 4;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const layer = layers[ring];
    const fissure =
      Math.sin(index * 7.31) * 0.32 +
      Math.cos(index * 2.17 + ring * 0.8) * 0.21;
    const elevation =
      ring === 0 || ring === layers.length - 1
        ? 0
        : Math.sin(index * 2.71 + ring * 0.4) * 0.3;
    return [
      p[0] * layer.scale + fissure,
      layer.y + elevation,
      p[1] * layer.scale + fissure * 0.65,
    ];
  };
  const tri = (a, b, c, color) => {
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(...color);
  };
  for (let ring = 0; ring < layers.length - 1; ring++) {
    for (let i = 0; i < n; i++) {
      const shade = 0.25 + ring * 0.027 + (i % 3) * 0.015;
      const tint = [shade * 0.91, shade, shade * 1.04];
      const a = point(ring, i),
        b = point(ring, i + 1);
      const c = point(ring + 1, i + 1),
        d = point(ring + 1, i);
      tri(a, d, b, tint);
      tri(b, d, c, tint);
    }
  }
  for (let i = 0; i < n; i++) {
    tri(
      [0, lookoutVista.top, 0],
      point(layers.length - 1, i + 1),
      point(layers.length - 1, i),
      [0.29, 0.34, 0.22],
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
