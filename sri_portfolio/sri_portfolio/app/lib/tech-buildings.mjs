// Geometry for the tech district, merged by tone like the city: the
// keynote hall, low glass offices and the tool pylons' bodies. Wordmarks
// and the stage screen are textured separately in the scene.
import { Batch, FLOOR, frame, rgb } from "./sf-buildings.mjs";
import {
  booths,
  hall,
  offices,
  plaza,
  techWalks,
  tools,
} from "./tech-plan.mjs";

export const techTones = ["stone", "glass", "curtain", "paint", "roof", "lit"];

const concrete = "#c9c5bd",
  darkConcrete = "#8f8b85",
  mullion = "#3b4148",
  stageBlack = "#1d1f22";
const officeGlass = ["#9fb7c4", "#a9bcc0", "#98aabb"];

function keynoteHall(box) {
  const [W, D] = hall.size,
    H = hall.height,
    t = hall.wall;
  const hx = W / 2,
    hz = D / 2;
  box("stone", rgb(darkConcrete), [0, 0, 0], [W, 0.06, D]);
  // Back wall behind the stage, and solid end bays on the long sides.
  box("stone", rgb(concrete), [hx - t / 2, H / 2, 0], [t, H, D]);
  for (const side of [-1, 1]) {
    const z = side * (hz - t / 2);
    box("stone", rgb(concrete), [0, 0.6, z], [W, 1.2, t]);
    box("stone", rgb(concrete), [0, H - 0.75, z], [W, 1.5, t]);
    box("stone", rgb(concrete), [hx - 2, H / 2, z], [4, H, t]);
    box("curtain", rgb("#b9cad6"), [-2, 4.35, z], [W - 4, 6.3, 0.08]);
    for (let x = -hx + 2; x < hx - 4; x += 2.4)
      box("paint", rgb(mullion), [x, 4.35, z + side * 0.08], [0.1, 6.3, 0.12]);
  }
  // Glass front with a door opening onto the plaza, and a deep canopy.
  const door = hall.door,
    dz = door.z - hall.z;
  const left = dz - door.width / 2 + hz,
    right = hz - (dz + door.width / 2);
  box("glass", rgb("#a8bcc8"), [-hx, H / 2, -hz + left / 2], [0.1, H, left]);
  box("glass", rgb("#a8bcc8"), [-hx, H / 2, hz - right / 2], [0.1, H, right]);
  box(
    "glass",
    rgb("#a8bcc8"),
    [-hx, (H + door.height) / 2, dz],
    [0.1, H - door.height, door.width],
  );
  for (let z = -hz; z <= hz; z += 2.5)
    box("paint", rgb(mullion), [-hx - 0.06, H / 2, z], [0.14, H, 0.1]);
  box(
    "paint",
    rgb(mullion),
    [-hx - 0.06, door.height, dz],
    [0.16, 0.18, door.width],
  );
  box("roof", rgb("#e7e4de"), [-hx - 2.4, 4.9, dz], [5.2, 0.35, 14], 0, true);
  for (const s of [-1, 1])
    box(
      "paint",
      rgb(mullion),
      [-hx - 4.6, 2.45, dz + s * 6.8],
      [0.22, 4.9, 0.22],
    );
  // Roof with a fascia band.
  box(
    "roof",
    rgb("#a6a39d"),
    [0, H + 0.25, 0],
    [W + 0.8, 0.5, D + 0.8],
    0,
    true,
  );
  box(
    "paint",
    rgb("#e8e6e1"),
    [0, H + 0.1, 0],
    [W + 0.9, 0.3, D + 0.9],
    0,
    true,
  );

  // Stage, screen frame, lectern, truss and speaker stacks.
  const sx = hall.stage.x - hall.x,
    sw = hall.stage.width;
  box(
    "paint",
    rgb(stageBlack),
    [sx, hall.stage.height / 2, 0],
    [hall.stage.depth, hall.stage.height, sw],
  );
  for (let i = 0; i < 3; i++)
    box(
      "paint",
      rgb("#2a2c30"),
      [sx - hall.stage.depth / 2 - 0.25 - i * 0.3, (i + 0.5) * 0.25 + 0.03, 0],
      [0.3 + i * 0.3, (3 - i) * 0.25, 3],
    );
  const sc = hall.screen;
  box(
    "paint",
    rgb("#101113"),
    [hx - t - 0.2, sc.y, 0],
    [0.25, sc.height + 0.5, sc.width + 0.5],
  );
  box(
    "paint",
    rgb("#2c2e31"),
    [sx - 0.6, hall.stage.height + 0.55, -3.5],
    [0.6, 1.1, 0.8],
  );
  box("paint", rgb("#3a3d42"), [sx - 2.5, H - 1.2, 0], [0.3, 0.3, sw + 2]);
  for (let z = -sw / 2; z <= sw / 2; z += 2)
    box(
      "lit",
      rgb("#fff1d6"),
      [sx - 2.5, H - 1.5, z],
      [0.3, 0.3, 0.3],
      0,
      true,
    );
  for (const s of [-1, 1])
    box(
      "paint",
      rgb("#191a1c"),
      [sx, hall.stage.height + 1.2, s * (sw / 2 + 0.6)],
      [1, 2.4 + hall.stage.height, 0.9],
    );
  // A low wall of ceiling lights across the room.
  for (let x = -hx + 3; x < sx - 3; x += 3)
    box("lit", rgb("#fff4e0"), [x, H - 0.1, 0], [0.5, 0.08, D - 3], 0, true);
}

function office(box, o) {
  const [w, d] = o.size,
    h = o.floors * FLOOR;
  const glass = rgb(officeGlass[o.tone % officeGlass.length]);
  box("curtain", glass, [0, h / 2, 0], [w - 0.3, h, d - 0.3]);
  for (let f = 0; f <= o.floors; f++)
    box(
      "stone",
      rgb(f ? "#e5e2dc" : darkConcrete),
      [0, f * FLOOR + (f ? 0 : 0.3), 0],
      [w, f ? 0.35 : 0.6, d],
    );
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 1.6)
    for (const s of [-1, 1])
      box(
        "paint",
        rgb("#d9d6d0"),
        [x, h / 2, s * (d / 2 - 0.05)],
        [0.12, h, 0.2],
      );
  // Lit bays behind the glass: a steady, uneven pattern per floor.
  for (let f = 0; f < o.floors; f++)
    for (let x = -w / 2 + 0.8; x < w / 2; x += 1.6)
      for (const s of [-1, 1])
        if (
          (Math.sin(x * 12.9898 + f * 78.233 + s * 3.7 + o.x) * 43758.5453) %
            1 >
          0.35
        )
          box(
            "lit",
            rgb("#f3e6cc"),
            [x, f * FLOOR + 1.6, s * (d / 2 - 0.1)],
            [1.4, 1.9, 0.06],
          );
  box("roof", rgb("#9b988f"), [0, h + 0.2, 0], [w - 0.8, 0.4, d - 0.8]);
  box("stone", rgb("#b8b4ad"), [w / 5, h + 1, -d / 6], [w / 3, 1.6, d / 3]);
  // Entry canopy toward the nearest walk (north-facing offices face -z).
  const face = o.z < 0 ? 1 : -1;
  box(
    "roof",
    rgb("#e7e4de"),
    [0, 3.1, face * (d / 2 + 1.1)],
    [5, 0.25, 2.2],
    0,
    true,
  );
}

// An expo booth facing -z: back wall with a screen, a counter, side fins
// and a header that carries the project's name (textured in the scene).
function booth(box, b) {
  const { width: w, depth: d } = b;
  box("stone", rgb("#d8d5cf"), [0, 0.04, 0], [w, 0.08, d]);
  box("paint", rgb("#2a2e35"), [0, 1.3, d / 2 - 0.06], [w, 2.6, 0.12]);
  for (const s of [-1, 1])
    box(
      "paint",
      rgb("#e6e3dd"),
      [s * (w / 2 - 0.04), 1.3, d / 2 - 0.35],
      [0.08, 2.6, 0.7],
    );
  box("stone", rgb("#f1efea"), [0, 0.52, -d / 2 + 0.35], [w * 0.7, 1.04, 0.5]);
  box("paint", rgb("#ffae98"), [0, 1.02, -d / 2 + 0.1], [w * 0.7, 0.04, 0.02]);
  box(
    "paint",
    rgb("#e6e3dd"),
    [0, 2.75, -d / 2 + 0.3],
    [w, 0.4, 0.12],
    0,
    true,
  );
}

function pylon(box) {
  box("stone", rgb(darkConcrete), [0, 0.12, 0], [1.9, 0.24, 0.7]);
  box("paint", rgb("#22262c"), [0, 1.55, 0], [1.7, 2.6, 0.3]);
}

// Paving: the plaza slab and a strip under every tech walk.
function paving(batches) {
  const box = frame(batches, 0, 0, 0, 0);
  box(
    "stone",
    rgb("#b3b0aa"),
    [plaza.x, 0.012, plaza.z],
    [plaza.half[0] * 2, 0.024, plaza.half[1] * 2],
  );
  for (const [[ax, az], [bx, bz], width] of techWalks) {
    const length = Math.hypot(bx - ax, bz - az);
    const b = frame(
      batches,
      (ax + bx) / 2,
      0,
      (az + bz) / 2,
      Math.atan2(bx - ax, bz - az),
    );
    b(
      "stone",
      rgb("#a9a7a2"),
      [0, 0.01, 0],
      [width + 0.4, 0.02, length + width * 0.5],
    );
  }
}

export function buildTechDistrict() {
  const batches = Object.fromEntries(techTones.map((t) => [t, new Batch()]));
  keynoteHall(frame(batches, hall.x, 0, hall.z, 0));
  for (const o of offices) office(frame(batches, o.x, 0, o.z, 0), o);
  for (const b of booths) booth(frame(batches, b.x, 0, b.z, 0), b);
  for (const t of tools) pylon(frame(batches, t.x, 0, t.z, t.yaw));
  paving(batches);
  return Object.fromEntries(
    Object.entries(batches)
      .filter(([, b]) => b.p.length)
      .map(([tone, b]) => [tone, b.geometry()]),
  );
}
