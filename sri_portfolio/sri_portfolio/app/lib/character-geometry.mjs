import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const skin = new THREE.Color("#c99270"),
  cheek = new THREE.Color("#cc876f");
export function faceSurface(x, y, offset = 0) {
  return (
    Math.sqrt(
      Math.max(0, 1 - (x / 0.405) ** 2 - ((y - 1.235) / 0.42525) ** 2),
    ) *
      0.36855 +
    offset
  );
}

export function characterFace() {
  const g = new THREE.SphereGeometry(0.405, 48, 36);
  g.scale(1, 1.05, 0.91);
  g.translate(0, 1.235, 0);
  const p = g.attributes.position,
    colors = [],
    color = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const blush =
      Math.exp(
        -(((Math.abs(x) - 0.24) / 0.09) ** 2 + ((y - 1.09) / 0.065) ** 2),
      ) * THREE.MathUtils.smoothstep(z, 0.12, 0.3);
    color.copy(skin).lerp(cheek, blush * 0.7);
    colors.push(color.r, color.g, color.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return g;
}

function tint(g, hex) {
  const c = new THREE.Color(hex),
    count = g.attributes.position.count;
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    a[i * 3] = c.r;
    a[i * 3 + 1] = c.g;
    a[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

function sweptLock(points, width, depth, color) {
  const curve = new THREE.CubicBezierCurve3(
    ...points.map((p) => new THREE.Vector3(...p)),
  );
  const positions = [],
    indices = [],
    uv = [],
    axis = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    front = new THREE.Vector3(0, 0, 1);
  const rows = 24,
    sides = 14;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows,
      center = curve.getPoint(t),
      tangent = curve.getTangent(t);
    axis.crossVectors(front, tangent).normalize();
    if (axis.lengthSq() < 0.01) axis.set(1, 0, 0);
    normal.crossVectors(tangent, axis).normalize();
    const taper =
      Math.max(0.008, Math.pow(1 - t, 0.62)) *
      (0.85 + Math.sin(t * Math.PI) * 0.2);
    for (let j = 0; j <= sides; j++) {
      const angle = (j / sides) * Math.PI * 2,
        crease = 1 + Math.cos(angle * 6) * 0.028;
      const p = center
        .clone()
        .addScaledVector(axis, Math.cos(angle) * width * taper)
        .addScaledVector(normal, Math.sin(angle) * depth * taper * crease);
      positions.push(p.x, p.y, p.z);
      uv.push(j / sides, t);
      if (i < rows && j < sides) {
        const a = i * (sides + 1) + j,
          b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  // Close both ends of a lock. Some roots sit above the cap silhouette; an
  // open tube there showed bright pinholes when viewed from behind.
  for (const end of [0, 1]) {
    const center = curve.getPoint(end);
    const index = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    uv.push(0.5, end);
    const ring = end * rows * (sides + 1);
    for (let j = 0; j < sides; j++) {
      if (end) indices.push(index, ring + j, ring + j + 1);
      else indices.push(index, ring + j + 1, ring + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return tint(g, color);
}

export function characterHair() {
  const positions = [],
    indices = [],
    uv = [],
    segments = 64,
    rows = 30;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI * 2,
        front = Math.sin(phi),
        side = Math.abs(Math.cos(phi));
      const end =
        1.66 -
        Math.max(0, front) * 0.38 +
        Math.max(0, -front) * 0.29 +
        side * 0.03;
      const theta = (j / rows) * end;
      const ripple =
        Math.sin(phi * 9 + theta * 3) * 0.0018 +
        Math.cos(phi * 4 - theta) * 0.001;
      const s = Math.sin(theta),
        crown = Math.sin(theta * 1.5) * 0.018;
      positions.push(
        Math.cos(phi) * s * (0.417 + ripple),
        1.252 + Math.cos(theta) * (0.439 + crown),
        Math.sin(phi) * s * (0.38 + ripple) - 0.016,
      );
      uv.push(i / segments, j / rows);
      if (i < segments && j < rows) {
        const a = j * (segments + 1) + i,
          b = a + segments + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const cap = new THREE.BufferGeometry();
  cap.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  cap.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  cap.setIndex(indices);
  cap.computeVertexNormals();
  tint(cap, "#302720");
  // Broad, tapered locks are joined into one mesh. Their roots sit inside the
  // cap; the asymmetrical fringe gives the same silhouette from every biome.
  const locks = [
    [
      [
        [-0.11, 1.65, 0.12],
        [-0.32, 1.61, 0.28],
        [-0.36, 1.43, 0.32],
        [-0.32, 1.27, 0.22],
      ],
      0.105,
      0.045,
      "#352b24",
    ],
    [
      [
        [0.04, 1.67, 0.13],
        [-0.11, 1.66, 0.32],
        [-0.23, 1.46, 0.41],
        [-0.27, 1.32, 0.31],
      ],
      0.125,
      0.055,
      "#3b2f27",
    ],
    [
      [
        [0.19, 1.65, 0.13],
        [0.05, 1.64, 0.36],
        [-0.08, 1.48, 0.435],
        [-0.17, 1.34, 0.355],
      ],
      0.125,
      0.051,
      "#342a22",
    ],
    [
      [
        [0.3, 1.6, 0.13],
        [0.23, 1.63, 0.32],
        [0.1, 1.45, 0.425],
        [0, 1.31, 0.37],
      ],
      0.105,
      0.05,
      "#392d24",
    ],
    [
      [
        [0.32, 1.54, 0.2],
        [0.31, 1.56, 0.34],
        [0.27, 1.38, 0.385],
        [0.21, 1.3, 0.31],
      ],
      0.081,
      0.037,
      "#302720",
    ],
    [
      [
        [0.36, 1.43, 0.13],
        [0.43, 1.37, 0.18],
        [0.405, 1.23, 0.13],
        [0.37, 1.15, 0.085],
      ],
      0.053,
      0.034,
      "#302720",
    ],
    [
      [
        [-0.36, 1.43, 0.1],
        [-0.44, 1.38, 0.14],
        [-0.418, 1.23, 0.12],
        [-0.375, 1.16, 0.08],
      ],
      0.05,
      0.033,
      "#302720",
    ],
    [
      [
        [0.13, 1.65, -0.1],
        [0.19, 1.74, -0.035],
        [0.32, 1.72, 0.065],
        [0.34, 1.65, 0.12],
      ],
      0.058,
      0.032,
      "#392d25",
    ],
  ].map(([points, w, d, c]) => sweptLock(points, w, d, c));
  const parts = [cap, ...locks],
    result = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  result.computeBoundingSphere();
  return result;
}

export function irisDome() {
  const g = new THREE.SphereGeometry(
    0.074,
    36,
    18,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  g.rotateX(Math.PI / 2);
  const p = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, p.getX(i) / 0.148 + 0.5, p.getY(i) / 0.148 + 0.5);
    p.setZ(i, p.getZ(i) * 0.16);
  }
  p.needsUpdate = uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export function characterShirt(rows = 36, segments = 40) {
  const profile = [
    [0, 0.397],
    [0.215, 0.397],
    [0.253, 0.41],
    [0.265, 0.46],
    [0.275, 0.63],
    [0.315, 0.8],
    [0.337, 0.85],
    [0.308, 0.897],
    [0.2, 0.94],
    [0.117, 0.95],
  ];
  const path = new THREE.CatmullRomCurve3(
    profile.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    "centripetal",
  );
  const g = new THREE.LatheGeometry(
    path.getPoints(rows).map((p) => new THREE.Vector2(p.x, p.y)),
    segments,
  );
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      angle = Math.atan2(z, x);
    const fold =
      Math.max(0, 1 - Math.abs(y - 0.47) / 0.16) *
      0.006 *
      (Math.sin(angle * 5 + y * 9) + 0.4 * Math.sin(angle * 9));
    p.setXYZ(
      i,
      x + Math.cos(angle) * fold,
      y,
      (z + Math.sin(angle) * fold) * 0.7,
    );
  }
  g.computeVertexNormals();
  return g;
}
