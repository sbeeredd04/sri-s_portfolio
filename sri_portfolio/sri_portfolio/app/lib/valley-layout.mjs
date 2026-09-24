// Miniature glacial valley: a sheer wall, a set-back dome, and a ridge.
// Authored scenery inspired by those landform relationships, not a map
// replica and not a record of a visit.
export const outdoorsLift = 0.035;
export const lake = { x: -8, z: -3, radius: 6, level: -0.02 };
export const trailCenter = (z) => Math.sin(z * 0.14) * 2.2;

export const wall = {
  kind: "wall",
  x: -14.8,
  z: -14.6,
  turn: 0.38,
  length: 11.2,
  height: 10.6,
  thickness: 4.6,
  talus: 2.5,
  fallU: 0.57,
  seed: 1,
  hx: 4.75,
  hz: 5.8,
};
export const dome = {
  kind: "dome",
  x: 5.35,
  z: -16.15,
  turn: -0.34,
  width: 8.15,
  depth: 6.7,
  height: 8.7,
  seed: 3,
  hx: 4.25,
  hz: 3.52,
};
export const ridge = {
  kind: "ridge",
  x: -1.6,
  z: -23.15,
  turn: 0.08,
  width: 14.2,
  depth: 3.35,
  height: 4.35,
  seed: 5,
  hx: 6.9,
  hz: 1.85,
};
export const graniteForms = [wall, dome, ridge];

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}
function smooth(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function wallOutward() {
  return { x: Math.cos(wall.turn), z: Math.sin(wall.turn) };
}
export function wallPoint(lx, y, lz) {
  const c = Math.cos(wall.turn),
    s = Math.sin(wall.turn);
  return {
    x: wall.x + lx * c - lz * s,
    y,
    z: wall.z + lx * s + lz * c,
    lx,
    lz,
  };
}
export function wallFrame(u, v) {
  const crest =
    wall.height * (0.74 + 0.26 * Math.sin(Math.PI * clamp01(u)) ** 1.15);
  const y = -0.48 + v * crest;
  const lz = (u - 0.5) * wall.length;
  const apron = v < 0.18 ? (1 - v / 0.18) ** 1.4 * wall.talus : 0;
  const batter = Math.max(0, v - 0.14) * 0.42;
  const joint =
    Math.sin(u * 19 + wall.seed) * 0.05 * Math.sin(v * Math.PI) +
    0.2 *
      Math.pow(Math.abs(Math.cos(u * 22 + wall.seed)), 10) *
      Math.sin(v * Math.PI) +
    Math.sin(v * 27 + 2) * 0.018;
  const du = (u - wall.fallU) / 0.065;
  const lip =
    0.82 * Math.exp(-du * du * 2) * Math.exp(-(((v - 0.83) / 0.035) ** 2));
  return wallPoint(apron - batter + joint + lip, y, lz);
}

function fallColumn() {
  const lipV = 0.83,
    toeV = 0.055,
    steps = 48;
  const lip = wallFrame(wall.fallU, lipV);
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const v = lerp(lipV, toeV, i / steps);
    const face = wallFrame(wall.fallU, v);
    const lx = Math.max(face.lx + 0.1, lip.lx + 0.055);
    const p = wallPoint(lx, face.y, face.lz);
    samples.push({
      x: p.x,
      y: p.y,
      z: p.z,
      half: lerp(0.2, 0.46, (i / steps) ** 1.4),
      bank: 0,
      ground: false,
    });
  }
  const toe = samples[samples.length - 1];
  toe.ground = true;
  toe.half = 0.52;
  toe.bank = 0.72;
  return samples;
}

let course;
export function watercoursePoints() {
  if (course) return course;
  const fall = fallColumn();
  const toe = fall[fall.length - 1];
  const n = wallOutward();
  const bend = { x: toe.x + n.x * 2.7, z: toe.z + n.z * 2.7 };
  const dx = bend.x - lake.x,
    dz = bend.z - lake.z;
  const len = Math.hypot(dx, dz) || 1;
  const toward = { x: dx / len, z: dz / len };
  const marks = [
    { x: bend.x, z: bend.z, half: 0.44, bank: 0.85 },
    {
      x: lerp(bend.x, lake.x + toward.x * 5.25, 0.48),
      z: lerp(bend.z, lake.z + toward.z * 5.25, 0.48),
      half: 0.4,
      bank: 0.9,
    },
    {
      x: lake.x + toward.x * 5.25,
      z: lake.z + toward.z * 5.25,
      half: 0.36,
      bank: 0.9,
    },
    {
      x: lake.x + toward.x * 4.5,
      z: lake.z + toward.z * 4.5,
      half: 0.32,
      bank: 0,
    },
  ];
  const ground = marks.map((mark, i) => ({
    ...mark,
    y: lerp(toe.y, lake.level, (i + 1) / marks.length),
    ground: true,
  }));
  ground[ground.length - 1].y = lake.level;
  for (let i = 1; i < ground.length; i++)
    if (ground[i].y > ground[i - 1].y) ground[i].y = ground[i - 1].y;
  // A smooth centerline changes direction gradually; height is independently
  // interpolated downward so the curve cannot introduce an uphill water bulge.
  const anchors = [toe, ...ground],
    dense = [];
  const curve = (a, b, c, d, t) =>
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t * t +
      (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i < anchors.length - 1; i++)
    for (let j = 1; j <= 12; j++) {
      const t = j / 12,
        a = anchors[Math.max(0, i - 1)],
        b = anchors[i],
        c = anchors[i + 1],
        d = anchors[Math.min(anchors.length - 1, i + 2)];
      dense.push({
        x: curve(a.x, b.x, c.x, d.x, t),
        z: curve(a.z, b.z, c.z, d.z, t),
        y: lerp(b.y, c.y, t),
        half: lerp(b.half, c.half, t),
        bank: lerp(b.bank, c.bank, t),
        ground: true,
      });
    }
  course = [...fall, ...dense];
  return course;
}

function nearestGround(x, z) {
  const points = watercoursePoints().filter((p) => p.ground);
  let best = null,
    bestDist = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const dx = b.x - a.x,
      dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = clamp01(((x - a.x) * dx + (z - a.z) * dz) / len2);
    const px = a.x + dx * t,
      pz = a.z + dz * t;
    const dist = Math.hypot(x - px, z - pz);
    if (dist < bestDist) {
      bestDist = dist;
      best = {
        x: px,
        z: pz,
        y: lerp(a.y, b.y, t),
        half: lerp(a.half, b.half, t),
        bank: Math.min(a.bank, b.bank),
        dist,
      };
    }
  }
  return best;
}

export function nearValleyWater(x, z, margin = 0) {
  const hit = nearestGround(x, z);
  return !!hit && hit.dist <= hit.half + margin;
}

export function lakeDistance(x, z) {
  return Math.hypot(x - lake.x, z - lake.z);
}

export function lakeSurface(shore, d) {
  const plane = lake.level + outdoorsLift;
  if (d >= 6.6) return shore;
  if (d <= 2.15) return -1.24;
  if (d <= 4.55) return lerp(-1.24, -0.32, smooth(2.15, 4.55, d));
  if (d <= 5.65) return lerp(-0.32, plane, smooth(4.55, 5.65, d));
  return lerp(plane, shore, smooth(5.65, 6.6, d));
}

export function valleyFloorWeight(x, z) {
  const across = smooth(-20, -15.5, x) * (1 - smooth(8, 12, x));
  const along = (1 - smooth(0.2, 4.2, z)) * smooth(-25.5, -21, z);
  return across * along;
}

// Planet-space height contribution for the lake bowl and the stream bed.
export function carvedTrailHeight(x, z, shore) {
  const d = lakeDistance(x, z);
  let height = d < 6.75 ? lakeSurface(shore, d) : shore;
  const sample = nearestGround(x, z);
  if (!sample || d < 4.85) return height;
  const reach = sample.half + sample.bank;
  if (sample.dist > reach || sample.bank <= 0) return height;
  const plane = sample.y + outdoorsLift;
  if (sample.dist <= sample.half) {
    const t = sample.dist / Math.max(0.001, sample.half);
    return plane - 0.2 * (1 - t * t);
  }
  const t = (sample.dist - sample.half) / sample.bank;
  const s = t * t * (3 - 2 * t);
  return lerp(plane + 0.02, height, s);
}

function inForm(form, x, z, margin) {
  const dx = x - form.x,
    dz = z - form.z;
  const c = Math.cos(form.turn),
    s = Math.sin(form.turn);
  const lx = dx * c + dz * s;
  const lz = -dx * s + dz * c;
  if (form.kind === "wall")
    return Math.abs(lx) <= form.hx + margin && Math.abs(lz) <= form.hz + margin;
  const hx = form.hx + margin,
    hz = form.hz + margin;
  return (lx / hx) ** 2 + (lz / hz) ** 2 <= 1;
}
export function inGraniteFootprint(x, z, margin = 0) {
  return graniteForms.some((form) => inForm(form, x, z, margin));
}

export function overlookPolyline() {
  const joinZ = -1.15;
  const joinX = trailCenter(joinZ);
  return [
    [joinX, joinZ],
    [joinX + 1.15, joinZ - 1.15],
    [2.55, -3.85],
    [4.15, -5.45],
    [4.95, -6.55],
  ];
}
export function overlookSegments() {
  const pts = overlookPolyline();
  const widths = [1.55, 1.35, 1.3, 1.3];
  return pts.slice(1).map((p, i) => [pts[i], p, widths[i]]);
}
export function overlookDeck() {
  const pts = overlookPolyline();
  const end = pts.at(-1),
    prev = pts.at(-2);
  const dx = end[0] - prev[0],
    dz = end[1] - prev[1];
  return {
    x: end[0],
    z: end[1],
    turn: Math.atan2(dz, dx),
    hx: 1.35,
    hz: 0.9,
  };
}
export function inOverlookDeck(x, z, margin = 0) {
  const deck = overlookDeck();
  const dx = x - deck.x,
    dz = z - deck.z;
  const c = Math.cos(deck.turn),
    s = Math.sin(deck.turn);
  const lx = dx * c + dz * s;
  const lz = -dx * s + dz * c;
  return Math.abs(lx) <= deck.hx + margin && Math.abs(lz) <= deck.hz + margin;
}

// The level lookout and its short ramp share one height with paving and feet.
// heightAt is local to the outdoors group, so callers account for its lift once.
export function overlookElevation(heightAt) {
  const deck = overlookDeck(),
    c = Math.cos(deck.turn),
    s = Math.sin(deck.turn);
  let top = -Infinity;
  for (let j = 0; j <= 4; j++)
    for (let i = 0; i <= 6; i++) {
      const x = -deck.hx + (deck.hx * i) / 3,
        z = -deck.hz + (deck.hz * j) / 2;
      top = Math.max(
        top,
        heightAt(deck.x + x * c - z * s, deck.z + x * s + z * c),
      );
    }
  return top + 0.07;
}
export function trailPavingHeight(
  x,
  z,
  heightAt,
  deckY = overlookElevation(heightAt),
) {
  const deck = overlookDeck(),
    dx = x - deck.x,
    dz = z - deck.z;
  const lx = dx * Math.cos(deck.turn) + dz * Math.sin(deck.turn);
  const lz = -dx * Math.sin(deck.turn) + dz * Math.cos(deck.turn);
  const base = heightAt(x, z) + 0.027;
  if (Math.abs(lz) > deck.hz + 0.2 || lx > deck.hx || lx < -deck.hx - 2)
    return base;
  return lerp(base, deckY + 0.003, smooth(-deck.hx - 2, -deck.hx, lx));
}
export function distanceToOverlook(x, z) {
  const pts = overlookPolyline();
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0],
      az = pts[i - 1][1],
      bx = pts[i][0],
      bz = pts[i][1];
    const dx = bx - ax,
      dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = clamp01(((x - ax) * dx + (z - az) * dz) / len2);
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

export function inViewpoint(x, z, crown = 0) {
  const lip = watercoursePoints()[0],
    deck = overlookDeck();
  const views = [
    [deck.x, deck.z],
    [deck.x + 2.15, deck.z + 2.35],
    [-1.6, 16.6],
  ];
  return views.some(([ax, az]) => {
    const dx = lip.x - ax,
      dz = lip.z - az,
      len = dx * dx + dz * dz;
    const t = ((x - ax) * dx + (z - az) * dz) / len;
    return (
      t > 0 &&
      t < 1.05 &&
      Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.05 + crown
    );
  });
}

export function blocksValleyPlanting(x, z, margin = 0) {
  return (
    inGraniteFootprint(x, z, margin) ||
    nearValleyWater(x, z, margin) ||
    inOverlookDeck(x, z, margin) ||
    lakeDistance(x, z) < lake.radius + margin
  );
}

function clearOfRoutes(x, z, margin) {
  return (
    !nearValleyWater(x, z, margin) &&
    lakeDistance(x, z) > lake.radius + margin &&
    Math.abs(x - trailCenter(z)) > 1.7 + margin &&
    distanceToOverlook(x, z) > 1.45
  );
}
export function talusSpots() {
  const spots = [];
  const n = wallOutward();
  for (const u of [0.18, 0.36, 0.7, 0.86]) {
    const p = wallFrame(u, 0.05);
    const x = p.x + n.x * 0.95;
    const z = p.z + n.z * 0.95;
    if (!clearOfRoutes(x, z, 0.2)) continue;
    spots.push({
      x,
      z,
      scale: 0.38 + (u > 0.6 ? 0.18 : 0.06),
      turn: wall.turn + u * 3,
    });
  }
  const face = { x: -Math.cos(dome.turn), z: -Math.sin(dome.turn) };
  for (const [along, scale] of [
    [-1.6, 0.46],
    [0.4, 0.34],
    [1.8, 0.3],
  ]) {
    const x = dome.x + face.x * 3.4 + -face.z * along;
    const z = dome.z + face.z * 3.4 + face.x * along;
    if (!clearOfRoutes(x, z, 0.2)) continue;
    spots.push({ x, z, scale, turn: dome.turn + along });
  }
  return spots;
}

export function meadowTufts() {
  const clusters = [
    { x: 1.7, z: -10.4, n: 8, spread: 1.35 },
    { x: -4.6, z: -10.6, n: 7, spread: 1.05 },
  ];
  const out = [];
  clusters.forEach((c, cluster) => {
    for (let i = 0; i < c.n; i++) {
      const a = i * 2.39996 + cluster;
      const x = c.x + Math.cos(a) * c.spread * (0.4 + (i % 3) * 0.22);
      const z = c.z + Math.sin(a) * c.spread * 0.85;
      if (blocksValleyPlanting(x, z, 0.45)) continue;
      if (Math.abs(x - trailCenter(z)) < 1.45) continue;
      if (distanceToOverlook(x, z) < 1.35) continue;
      out.push({ x, z, s: 0.72 + (i % 4) * 0.16, turn: a });
    }
  });
  return out;
}

export const renderedTrail = { start: 12, end: -18.6, step: 0.42, half: 0.65 };

export function trailView() {
  const lip = watercoursePoints()[0];
  const deck = overlookDeck();
  const aim = [lip.x + 0.4, Math.min(5.4, lip.y * 0.62), lip.z + 0.3];
  return {
    arrival: {
      position: [-1.6, 5.5, 16.6],
      target: [-5.4, 3.35, -14.2],
      portrait: {
        position: [-1, 8.6, 20.4],
        target: [-5, 2.7, -14.4],
        fov: 84,
      },
    },
    overlook: {
      position: [deck.x + 0.35, 1.78, deck.z + 0.15],
      target: aim,
      portrait: {
        position: [deck.x + 2.15, 2.85, deck.z + 2.35],
        target: [aim[0], aim[1] - 0.4, aim[2]],
        fov: 68,
      },
    },
  };
}
