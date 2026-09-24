// The Foundry's tech district, in the projects biome's tangent frame
// (+x east, +z south). An invented Valley: an open-air keynote stage
// across a plaza from the workshops, a row of tool pylons, palms along a
// boulevard and a few low glass offices. Everything here is data; the
// scene reads it.
import {
  bowlOuter,
  seats,
  stage,
  venueBounds,
} from "./amphitheatre.mjs";

export { stage, venueBounds };

export const plaza = { x: 18.5, z: 4, half: [5.5, 9] };

// Wordmarks only: names as type, no logos. Roles stay general.
export const tools = [
  { id: "notion", name: "Notion", role: "Plans and docs" },
  { id: "obsidian", name: "Obsidian", role: "Notes that link up" },
  { id: "cursor", name: "Cursor", role: "Where the code gets written" },
  { id: "claude", name: "Claude", role: "A pair on every build" },
  { id: "codex", name: "Codex", role: "A second set of eyes" },
  // A row along the plaza's town edge, faces turned toward the stage.
].map((tool, i) => ({
  ...tool,
  x: plaza.x - plaza.half[0] + 0.8,
  z: 3.4 + (4 - i) * 2.2,
  yaw: Math.PI / 2,
}));

export const offices = [
  { id: "north-a", x: 22, z: -26, size: [16, 11], floors: 4, tone: 0 },
  { id: "north-b", x: 42, z: -26, size: [12, 12], floors: 5, tone: 1 },
  { id: "south", x: 16, z: 27, size: [14, 9], floors: 3, tone: 2 },
  { id: "west", x: -30, z: 8, size: [12, 10], floors: 3, tone: 1 },
];

const BOULEVARD_Z = -16;
// Demo row: one booth per project just north of the amphitheatre, facing
// a walk off the boulevard link. Projects are assigned in order by the scene.
export const DEMO_Z = -9.6;
export const booths = Array.from({ length: 6 }, (_, i) => ({
  x: 27.4 + i * 3.3,
  z: -7.25,
  width: 2.8,
  depth: 1.8,
}));
export const techWalks = [
  [[2.8, BOULEVARD_Z], [plaza.x, BOULEVARD_Z], 3],
  [[plaza.x, BOULEVARD_Z], [46, BOULEVARD_Z], 3],
  [[plaza.x, BOULEVARD_Z], [plaza.x, plaza.z - plaza.half[1]], 3],
  [[8.5, 1], [plaza.x, 1], 2],
  [[plaza.x, plaza.z - plaza.half[1]], [plaza.x, plaza.z + plaza.half[1]], 3],
  // Up the centre aisle to the front of the stage.
  [[plaza.x, stage.z], [stage.x - stage.depth / 2 - 4, stage.z], 2],
  [[plaza.x, DEMO_Z], [46, DEMO_Z], 2],
  [[-2.8, 12.1], [-2.8, 19], 2],
  [[-2.8, 19], [22, 19], 2],
  [[-8.5, 1], [-23, 1], 2],
];

// Palms line both kerbs of the boulevard and the plaza's outer corners.
export function techPalms() {
  const palms = [];
  for (let x = 13.5; x <= 46; x += 5.5)
    for (const side of [-1, 1])
      if (Math.abs(x - plaza.x) > 2.6)
        palms.push({
          x,
          z: BOULEVARD_Z + side * 2.6,
          s: 0.9 + ((x * 7) % 3) * 0.1,
        });
  for (const [x, z] of [
    [plaza.x - plaza.half[0] - 0.8, plaza.z + plaza.half[1] - 1],
    [plaza.x + plaza.half[0] - 1, plaza.z + plaza.half[1] + 0.8],
    [plaza.x - plaza.half[0] - 0.8, plaza.z - plaza.half[1] + 1],
  ])
    palms.push({ x, z, s: 1.05 });
  return palms;
}

// Rectangles no grove tree may take, with a margin.
export function techFootprints(margin = 2.5) {
  const rect = (x, z, hx, hz) => ({
    x0: x - hx - margin,
    x1: x + hx + margin,
    z0: z - hz - margin,
    z1: z + hz + margin,
  });
  return [
    rect(plaza.x, plaza.z, ...plaza.half),
    rect(
      (venueBounds.x0 + venueBounds.x1) / 2,
      (venueBounds.z0 + venueBounds.z1) / 2,
      (venueBounds.x1 - venueBounds.x0) / 2,
      (venueBounds.z1 - venueBounds.z0) / 2,
    ),
    rect(27, BOULEVARD_Z, 22, 3.5),
    ...offices.map((o) => rect(o.x, o.z, o.size[0] / 2, o.size[1] / 2)),
  ];
}
export const inTechFootprint = (x, z, margin) =>
  techFootprints(margin).some(
    (r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1,
  );

// A full house on the tiers, everyone turned toward the stage. Seats are
// drawn with a bias to the front so a small tier still fills the good rows.
export const audienceBudget = { low: 24, medium: 56, high: 110 };
export function audience(tier = "medium") {
  const count = audienceBudget[tier] ?? audienceBudget.medium;
  let seed = 17;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return seats()
    .map((s) => ({ ...s, order: s.row + rand() * 3.5 }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ x, z }) => ({
      x,
      z,
      yaw: Math.atan2(stage.x - x, stage.z - z) + (rand() - 0.5) * 0.3,
    }));
}
// Visitors crossing the plaza and walking the boulevard.
export const strollBudget = { low: 6, medium: 12, high: 20 };
export function strollers(tier = "medium") {
  const lanes = [
    [
      [plaza.x - 2.5, plaza.z - 6],
      [plaza.x - 2.5, plaza.z + 7],
    ],
    [
      [plaza.x + 3.5, plaza.z + 7],
      [plaza.x + 3.5, plaza.z - 6],
    ],
    [
      [4, BOULEVARD_Z - 0.6],
      [45, BOULEVARD_Z - 0.6],
    ],
    [
      [45, BOULEVARD_Z + 0.6],
      [4, BOULEVARD_Z + 0.6],
    ],
    [
      [plaza.x, stage.z + 0.5],
      [stage.x - bowlOuter - 1, stage.z + 0.5],
    ],
  ];
  const count = strollBudget[tier] ?? strollBudget.medium;
  return Array.from({ length: count }, (_, i) => {
    const path = lanes[i % lanes.length];
    const length = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]);
    return { path, length, speed: 1.05 + (i % 4) * 0.12 };
  });
}

// A few people stopping at the booths.
export const browserBudget = { low: 3, medium: 6, high: 10 };
export function browsers(tier = "medium") {
  const count = browserBudget[tier] ?? browserBudget.medium;
  return Array.from({ length: count }, (_, i) => {
    const booth = booths[(i * 5) % booths.length];
    return {
      x: booth.x + ((i % 3) - 1) * 0.7,
      z: DEMO_Z + 0.55 + (i % 2) * 0.25,
      yaw: ((i % 3) - 1) * 0.3,
    };
  });
}

export const techViews = [
  {
    id: "keynote",
    label: "Keynote stage",
    // From the back rows, a little off the aisle, over the crowd's heads.
    position: [stage.x - 17.1, 7.8, stage.z + 3.4],
    target: [stage.x + 1, 2.2, stage.z - 0.2],
    portrait: {
      position: [stage.x - 15.5, 8, stage.z + 1.6],
      target: [stage.x + 1, 2.6, stage.z],
      fov: 74,
    },
    content: "work",
    prompt: "What I've been making, on the big screen",
    hint: "A full house under the canopy. Tap the screen to open the project that's up.",
  },
  {
    id: "tools",
    label: "Tools of the trade",
    position: [plaza.x + 4.5, 2.2, 7.8],
    target: [tools[0].x, 1.4, 7.8],
    portrait: {
      position: [plaza.x + 5.3, 2.8, 7.8],
      target: [tools[0].x, 1.4, 7.8],
      fov: 80,
    },
    content: "skills",
    prompt: "The tools I reach for every day",
    hint: "Notion, Obsidian, Cursor, Claude and Codex, beside the stack behind the builds.",
  },
  {
    id: "demos",
    label: "Demo row",
    position: [booths[1].x, 2.5, DEMO_Z - 3.5],
    target: [booths[3].x, 1.4, booths[0].z],
    portrait: {
      position: [booths[1].x, 2.8, DEMO_Z - 3.5],
      target: [booths[1].x + 0.8, 1.4, booths[0].z],
      fov: 78,
    },
    content: "work",
    prompt: "Every project gets a booth",
    hint: "Walk the row, then open one to see how it was built.",
  },
  {
    id: "valley",
    label: "The valley",
    position: [6, 25, 33],
    target: [33, 0, -1],
    portrait: { position: [10, 36, 42], target: [34, 0, 0], fov: 64 },
    content: "work",
    prompt: "A small valley of things being built",
    hint: "Workshops, an open-air stage across the plaza, and offices along the palms.",
  },
];
