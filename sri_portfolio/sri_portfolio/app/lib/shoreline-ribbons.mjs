import { BufferGeometry, Float32BufferAttribute } from "three";
import { shorelines, shorelineSeaHeight } from "./shoreline-contours.mjs";

export const shorelineRibbonWidth = 3.2;
const innerWidth = -0.12;
const maxMiter = 1.65;
const minimumArea = 0.00001;

function cross([ax, az], [bx, bz], [cx, cz]) {
  return (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
}

function crosses(a, b, c, d) {
  return (
    cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0
  );
}

function ribbonSections(points) {
  const sections = points.map(([x, z], i) => {
    const a = points[(i + points.length - 1) % points.length];
    const c = points[(i + 1) % points.length];
    const length = Math.hypot(x - a[0], z - a[1]);
    const nextLength = Math.hypot(c[0] - x, c[1] - z);
    const n0 = [(z - a[1]) / length, -(x - a[0]) / length];
    const n1 = [(c[1] - z) / nextLength, -(c[0] - x) / nextLength];
    const sum = [n0[0] + n1[0], n0[1] + n1[1]];
    const norm = Math.hypot(...sum);
    const [nx, nz] = norm < 1e-5 ? n1 : sum.map((value) => value / norm);
    const miter = Math.min(
      maxMiter,
      1 / Math.max(0.25, nx * n1[0] + nz * n1[1]),
    );
    return { x, z, nx: nx * miter, nz: nz * miter, length, scale: 1 };
  });
  // Concave corners and short edges can fold a wide offset quad over itself.
  // Taper both edges locally until each strip cell is convex and faces up.
  // Adjacent cells still share exactly the same cross section and wave phase.
  const point = ({ x, z, nx, nz, scale }, width) => [
    x + nx * width * scale,
    z + nz * width * scale,
  ];
  const count = sections.length;
  for (let pass = 0; pass < 48; pass++) {
    const taper = new Set();
    for (let i = 0; i < count; i++) {
      const a = sections[i],
        b = sections[(i + 1) % count];
      const quad = [
        point(a, innerWidth),
        point(b, innerWidth),
        point(b, shorelineRibbonWidth),
        point(a, shorelineRibbonWidth),
      ];
      const folded = quad.some(
        (corner, j) =>
          cross(corner, quad[(j + 1) % 4], quad[(j + 2) % 4]) >= -minimumArea,
      );
      if (folded) {
        taper.add(a);
        taper.add(b);
      }
    }
    // Separate nonadjacent offset edges where a narrow cove turns back.
    const outer = sections.map((section) =>
      point(section, shorelineRibbonWidth),
    );
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      for (let j = i + 2; j < (i ? count : count - 1); j++) {
        const after = (j + 1) % count;
        if (crosses(outer[i], outer[next], outer[j], outer[after])) {
          taper.add(sections[i]);
          taper.add(sections[next]);
          taper.add(sections[j]);
          taper.add(sections[after]);
        }
      }
    }
    if (!taper.size) return sections;
    for (const section of taper) section.scale *= 0.75;
  }
  throw new Error("Shoreline contour is too tight to form a continuous ribbon");
}

// CCW in X/Z means the water is to the right of each coast segment.
export function createShorelineRibbons() {
  const positions = [],
    uv = [],
    perimeters = [],
    indices = [];
  for (const { points } of shorelines) {
    const sections = ribbonSections(points);
    const base = positions.length / 3;
    const perimeter = sections.reduce(
      (total, section) => total + section.length,
      0,
    );
    let length = 0;
    for (let i = 0; i <= sections.length; i++) {
      const {
        x,
        z,
        nx,
        nz,
        scale,
        length: edgeLength,
      } = sections[i % sections.length];
      if (i) length += edgeLength;
      for (const width of [innerWidth, shorelineRibbonWidth]) {
        const distance = width * scale;
        positions.push(
          x + nx * distance,
          shorelineSeaHeight + 0.025,
          z + nz * distance,
        );
        uv.push(distance, length);
        perimeters.push(perimeter);
      }
      if (i < sections.length) {
        const j = base + i * 2;
        indices.push(j, j + 2, j + 1, j + 2, j + 3, j + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setAttribute(
    "shorePerimeter",
    new Float32BufferAttribute(perimeters, 1),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
