import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ExtrudeGeometry,
  CylinderGeometry,
  Vector3,
  Quaternion,
  Euler,
} from "three";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import {
  campusBench,
  campusCenter,
  campusExhibits,
  campusMeadow,
  campusPoint,
  campusRadii,
  entryAngle,
  innerGlassSpans,
  ribAngles,
  ribThickness,
  solidSpan,
  campusTree,
} from "./campus-layout.mjs";

const ARC = 128;

function groundAt(x, z) {
  return renderedSurfaceHeight("projects", x, z);
}
function bucket() {
  return { positions: [], normals: [] };
}
function addTri(target, a, b, c, direction) {
  const len = Math.hypot(direction.x, direction.y, direction.z) || 1;
  const nx = direction.x / len,
    ny = direction.y / len,
    nz = direction.z / len;
  target.positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  target.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
}
function triNormal(a, b, c) {
  return {
    x: (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y),
    y: (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z),
    z: (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
  };
}
function addQuad(target, a, b, c, d, direction) {
  const n = triNormal(a, b, c);
  const align = n.x * direction.x + n.y * direction.y + n.z * direction.z;
  if (align >= 0) {
    addTri(target, a, b, c, direction);
    addTri(target, a, c, d, direction);
  } else {
    addTri(target, a, c, b, direction);
    addTri(target, a, d, c, direction);
  }
}
function toGeometry(target) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(target.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new Float32BufferAttribute(target.normals, 3),
  );
  const uv = [];
  for (let i = 0; i < target.positions.length; i += 3) {
    const [x, y, z] = target.positions.slice(i, i + 3);
    const ny = Math.abs(target.normals[i + 1]);
    uv.push(x * 0.35, (ny > 0.5 ? z : y) * 0.35);
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return geometry;
}
function addSector(target, r0, r1, y, t0, t1, up) {
  const n = Math.max(1, Math.round((ARC * (t1 - t0)) / (Math.PI * 2)));
  const dir = { x: 0, y: up ? 1 : -1, z: 0 };
  for (let i = 0; i < n; i++) {
    const a0 = t0 + ((t1 - t0) * i) / n;
    const a1 = t0 + ((t1 - t0) * (i + 1)) / n;
    addQuad(
      target,
      campusPoint(a0, r0, y),
      campusPoint(a1, r0, y),
      campusPoint(a1, r1, y),
      campusPoint(a0, r1, y),
      dir,
    );
  }
}
function addWall(target, radius, y0, y1, t0, t1, outward) {
  const n = Math.max(1, Math.round((ARC * (t1 - t0)) / (Math.PI * 2)));
  const sign = outward ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a0 = t0 + ((t1 - t0) * i) / n;
    const a1 = t0 + ((t1 - t0) * (i + 1)) / n;
    const mid = (a0 + a1) / 2;
    addQuad(
      target,
      campusPoint(a0, radius, y0),
      campusPoint(a1, radius, y0),
      campusPoint(a1, radius, y1),
      campusPoint(a0, radius, y1),
      { x: Math.cos(mid) * sign, y: 0, z: Math.sin(mid) * sign },
    );
  }
}
function addCap(target, angle, r0, r1, y0, y1, facing) {
  addQuad(
    target,
    campusPoint(angle, r0, y0),
    campusPoint(angle, r1, y0),
    campusPoint(angle, r1, y1),
    campusPoint(angle, r0, y1),
    { x: -Math.sin(angle) * facing, y: 0, z: Math.cos(angle) * facing },
  );
}
function addSkirt(target, radius, yTop, t0, t1, outward) {
  const n = Math.max(1, Math.round((ARC * (t1 - t0)) / (Math.PI * 2)));
  const sign = outward ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a0 = t0 + ((t1 - t0) * i) / n;
    const a1 = t0 + ((t1 - t0) * (i + 1)) / n;
    const p0 = campusPoint(a0, radius);
    const p1 = campusPoint(a1, radius);
    const mid = (a0 + a1) / 2;
    addQuad(
      target,
      { x: p0.x, y: groundAt(p0.x, p0.z) - 0.05, z: p0.z },
      { x: p1.x, y: groundAt(p1.x, p1.z) - 0.05, z: p1.z },
      { x: p1.x, y: yTop, z: p1.z },
      { x: p0.x, y: yTop, z: p0.z },
      { x: Math.cos(mid) * sign, y: 0, z: Math.sin(mid) * sign },
    );
  }
}
function addBox(target, cx, cy, cz, hx, hy, hz, yaw = 0) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const axes = [
    { x: c, y: 0, z: s },
    { x: 0, y: 1, z: 0 },
    { x: -s, y: 0, z: c },
  ];
  const sizes = [hx, hy, hz];
  const at = (sx, sy, sz) => {
    const k = [sx, sy, sz];
    return {
      x: cx + axes[0].x * hx * k[0] + axes[2].x * hz * k[2],
      y: cy + hy * k[1],
      z: cz + axes[0].z * hx * k[0] + axes[2].z * hz * k[2],
    };
  };
  for (let axis = 0; axis < 3; axis++)
    for (const sign of [-1, 1]) {
      const u = (axis + 1) % 3,
        v = (axis + 2) % 3;
      const corner = (su, sv) => {
        const k = [0, 0, 0];
        k[axis] = sign;
        k[u] = su;
        k[v] = sv;
        return at(k[0], k[1], k[2]);
      };
      addQuad(
        target,
        corner(-1, -1),
        corner(1, -1),
        corner(1, 1),
        corner(-1, 1),
        {
          x: axes[axis].x * sign,
          y: axes[axis].y * sign,
          z: axes[axis].z * sign,
        },
      );
    }
  return sizes;
}
function addPlate(target, r0, r1, y0, y1, t0, t1) {
  addSector(target, r0, r1, y1, t0, t1, true);
  addSector(target, r0, r1, y0, t0, t1, false);
  addWall(target, r0, y0, y1, t0, t1, false);
  addWall(target, r1, y0, y1, t0, t1, true);
  addCap(target, t0, r0, r1, y0, y1, -1);
  addCap(target, t1, r0, r1, y0, y1, 1);
}
function addShrub(target, plant) {
  const sides = 8;
  const ground = groundAt(plant.x, plant.z);
  const profile = [
    [0.04 * plant.s, 0],
    [0.32 * plant.s, 0.06 * plant.s],
    [0.26 * plant.s, 0.28 * plant.s],
    [0.1 * plant.s, 0.5 * plant.s],
    [0, 0.66 * plant.s],
  ];
  const rings = profile.map(([radius, y]) =>
    Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2;
      return {
        x: plant.x + Math.cos(a) * radius,
        y: ground - 0.02 + y,
        z: plant.z + Math.sin(a) * radius,
      };
    }),
  );
  for (let r = 0; r < profile.length - 1; r++)
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      const mid = ((i + 0.5) / sides) * Math.PI * 2;
      addQuad(
        target,
        rings[r][i],
        rings[r][j],
        rings[r + 1][j],
        rings[r + 1][i],
        {
          x: Math.cos(mid) * (profile[r][0] + profile[r + 1][0]),
          y: 0.45,
          z: Math.sin(mid) * (profile[r][0] + profile[r + 1][0]),
        },
      );
    }
}
function part(size) {
  const geometry = new BoxGeometry(...size);
  geometry.userData.instances = 1;
  return geometry;
}
function roundedPanel(width, height, depth, radius) {
  const s = new Shape(),
    x = -width / 2,
    y = -height / 2,
    r = radius;
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
    bevelSegments: 2,
    curveSegments: 8,
  });
  g.translate(0, 0, -depth / 2);
  g.userData.instances = 1;
  return g;
}
function screenPart(width, height, tile) {
  const g = roundedPanel(width, height, 0.005, 0.025),
    p = g.attributes.position,
    u = g.attributes.uv;
  for (let i = 0; i < p.count; i++)
    u.setXY(
      i,
      (tile * 256 +
        Math.max(0, Math.min(1, p.getX(i) / width + 0.5)) *
          (tile === 2 ? 512 : 256)) /
        1024,
      1 -
        (1 - Math.max(0, Math.min(1, p.getY(i) / height + 0.5))) *
          (tile === 2 ? 354 / 512 : 1),
    );
  return g;
}
function appendGeometry(target, geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  target.positions.push(...g.attributes.position.array);
  target.normals.push(...g.attributes.normal.array);
  if (g !== geometry) g.dispose();
  geometry.dispose();
}
function gardenTree(wood, garden) {
  const root = new Vector3(
    campusTree.x,
    groundAt(campusTree.x, campusTree.z) - 0.02,
    campusTree.z,
  );
  const branch = (a, b, r0, r1) => {
    const delta = b.clone().sub(a),
      g = new CylinderGeometry(r1, r0, delta.length(), 8);
    g.applyQuaternion(
      new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        delta.clone().normalize(),
      ),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    appendGeometry(wood, g);
  };
  const fork = root.clone().add(new Vector3(0.04, 1.15, -0.06));
  branch(root, fork, 0.075, 0.037);
  for (let arm = 0; arm < 9; arm++) {
    const angle = arm * 2.39996,
      reach = 0.35 + (arm % 3) * 0.12;
    const end = root
      .clone()
      .add(
        new Vector3(
          Math.cos(angle) * reach,
          1.8 + (arm % 4) * 0.18,
          Math.sin(angle) * reach,
        ),
      );
    branch(fork, end, 0.027, 0.009);
    for (let j = 0; j < 15; j++) {
      const a = j * 2.39996 + arm,
        r = 0.16 * Math.sqrt((j + 0.5) / 15);
      const origin = end
        .clone()
        .add(
          new Vector3(
            Math.cos(a) * r,
            Math.sin(j * 3.1) * 0.19,
            Math.sin(a) * r,
          ),
        );
      const rotation = new Quaternion().setFromEuler(
        new Euler(0.4 + Math.sin(a) * 0.6, a, Math.cos(a) * 0.5),
      );
      const point = (t, side) =>
        new Vector3(Math.sin(Math.PI * t) * 0.055 * side, t * 0.3, t * t * 0.05)
          .applyQuaternion(rotation)
          .add(origin);
      for (let k = 0; k < 5; k++) {
        const t = k / 5,
          u = (k + 1) / 5;
        const p0 = point(t, -1),
          p1 = point(t, 1),
          p2 = point(u, 1),
          p3 = point(u, -1);
        let n = triNormal(p0, p1, p2);
        if (Math.hypot(n.x, n.y, n.z) < 1e-8) n = triNormal(p0, p2, p3);
        addQuad(garden, p0, p1, p2, p3, n);
        addQuad(garden, p3, p2, p1, p0, { x: -n.x, y: -n.y, z: -n.z });
      }
    }
  }
}

export function campusFloorY() {
  const [t0, t1] = solidSpan();
  let high = -Infinity;
  for (let i = 0; i <= 36; i++) {
    const angle = t0 + ((t1 - t0) * i) / 36;
    for (const radius of [campusRadii.floorInner, campusRadii.floorOuter]) {
      const p = campusPoint(angle, radius);
      high = Math.max(high, groundAt(p.x, p.z));
    }
  }
  return high + 0.06;
}

export function buildCampusGeometry() {
  const floorY = campusFloorY();
  const story = floorY + 2.24;
  const canopy = bucket();
  const stone = bucket();
  const wood = bucket();
  const metal = bucket();
  const glass = bucket();
  const garden = bucket();
  const [t0, t1] = solidSpan();
  addPlate(
    canopy,
    campusRadii.eaveInner,
    campusRadii.eaveOuter,
    story + 0.1,
    story + 0.18,
    t0,
    t1,
  );
  addPlate(
    wood,
    campusRadii.lowerInner,
    campusRadii.lowerOuter,
    story - 0.02,
    story + 0.05,
    t0,
    t1,
  );
  addPlate(
    canopy,
    campusRadii.floorInner,
    campusRadii.floorOuter,
    floorY - 0.03,
    floorY,
    t0,
    t1,
  );
  addSkirt(stone, campusRadii.floorOuter + 0.08, floorY, t0, t1, true);
  addSkirt(stone, campusRadii.floorInner - 0.06, floorY, t0, t1, false);
  addWall(
    glass,
    campusRadii.glassOuter,
    floorY - 0.01,
    story + 0.01,
    t0,
    t1,
    true,
  );
  for (const [a, b] of innerGlassSpans())
    addWall(
      glass,
      campusRadii.glassInner,
      floorY - 0.01,
      story + 0.01,
      a,
      b,
      false,
    );
  const ribInner = campusRadii.glassInner + 0.1;
  const ribOuter = campusRadii.glassOuter - 0.1;
  for (const angle of ribAngles()) {
    for (const radius of [ribInner, ribOuter]) {
      const p = campusPoint(angle, radius, (floorY + story) / 2);
      addBox(
        metal,
        p.x,
        p.y,
        p.z,
        0.048,
        (story - floorY) / 2,
        ribThickness(angle),
        angle,
      );
    }
    const p = campusPoint(angle, (ribInner + ribOuter) / 2, story - 0.035);
    addBox(
      metal,
      p.x,
      p.y,
      p.z,
      (ribOuter - ribInner) / 2,
      0.045,
      ribThickness(angle),
      angle,
    );
  }
  // Inset photovoltaic strips leave a light continuous fascia around the roof.
  for (let i = 0; i < 52; i++) {
    const a = t0 + 0.055 + ((t1 - t0 - 0.11) * i) / 52;
    const b = t0 + 0.055 + ((t1 - t0 - 0.11) * (i + 1)) / 52 - 0.014;
    addSector(metal, 6.02, 8.45, story + 0.184, a, b, true);
  }
  const benchGround = groundAt(campusBench.x, campusBench.z);
  addBox(
    wood,
    campusBench.x,
    benchGround + 0.46,
    campusBench.z,
    0.66,
    0.028,
    0.2,
  );
  addBox(
    wood,
    campusBench.x,
    benchGround + 0.72,
    campusBench.z + 0.2,
    0.66,
    0.16,
    0.028,
  );
  for (const x of [-0.52, 0.52])
    for (const z of [-0.12, 0.12])
      addBox(
        metal,
        campusBench.x + x,
        benchGround + 0.22,
        campusBench.z + z,
        0.025,
        0.22,
        0.025,
      );
  // The collection sign hangs from the canopy, rather than floating over the devices.
  const shelf = campusPoint(-Math.PI / 2, campusRadii.stand);
  for (const offset of [-0.48, 0.48])
    addBox(
      metal,
      shelf.x + offset,
      floorY + 2.09,
      shelf.z + 0.3,
      0.008,
      0.13,
      0.008,
    );
  for (const plant of campusMeadow()) addShrub(garden, plant);
  gardenTree(wood, garden);
  const phone = roundedPanel(0.4, 0.78, 0.045, 0.047);
  const phoneScreen = screenPart(0.365, 0.74, 0);
  const photoScreen = screenPart(0.365, 0.74, 1);
  const tablet = roundedPanel(0.56, 0.4, 0.04, 0.025);
  const tabletScreen = screenPart(0.52, 0.36, 2);
  const plinth = part([0.62, 0.7, 0.46]);
  const widePlinth = part([1.2, 0.7, 0.5]);
  phone.userData.instances = campusExhibits.length;
  phoneScreen.userData.instances = campusExhibits.length - 1;
  photoScreen.userData.instances = 1;
  tablet.userData.instances = 1;
  tabletScreen.userData.instances = 1;
  plinth.userData.instances = campusExhibits.length - 1;
  widePlinth.userData.instances = 1;
  return {
    floorY,
    canopy: toGeometry(canopy),
    stone: toGeometry(stone),
    wood: toGeometry(wood),
    metal: toGeometry(metal),
    glass: toGeometry(glass),
    garden: toGeometry(garden),
    parts: {
      phone,
      phoneScreen,
      photoScreen,
      tablet,
      tabletScreen,
      plinth,
      widePlinth,
    },
  };
}
export function triangleCount(geometry) {
  const index = geometry.getIndex();
  return index ? index.count / 3 : geometry.attributes.position.count / 3;
}
export function disposeCampus(built) {
  for (const key of ["canopy", "stone", "wood", "metal", "glass", "garden"])
    built[key].dispose();
  for (const part of Object.values(built.parts)) part.dispose();
}
export function campusMeshBudget() {
  const built = buildCampusGeometry();
  let triangles = [
    "canopy",
    "stone",
    "wood",
    "metal",
    "glass",
    "garden",
  ].reduce((sum, key) => sum + triangleCount(built[key]), 2);
  for (const part of Object.values(built.parts))
    triangles += triangleCount(part) * part.userData.instances;
  disposeCampus(built);
  return { triangles, materials: 8, floorY: campusFloorY() };
}
