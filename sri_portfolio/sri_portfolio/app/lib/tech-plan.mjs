// The Foundry's tech district, in the projects biome's tangent frame
// (+x east, +z south). An invented Valley: a keynote hall across a plaza
// from the workshops, a row of tool pylons, palms along a boulevard and a
// few low glass offices. Everything here is data; the scene reads it.

export const plaza = { x: 18.5, z: 4, half: [5.5, 9] };

// Door on the west wall, facing the plaza; the stage is on the east wall.
export const hall = {
  x: 36,
  z: 4,
  size: [24, 20],
  height: 9,
  wall: 0.35,
  door: { z: 4, width: 6, height: 4.2 },
  stage: { x: 45.5, depth: 4, width: 14, height: 1 },
  screen: { width: 13, height: 6.5, y: 5.4 },
};
export const hallBounds = {
  x0: hall.x - hall.size[0] / 2,
  x1: hall.x + hall.size[0] / 2,
  z0: hall.z - hall.size[1] / 2,
  z1: hall.z + hall.size[1] / 2,
};

// Wordmarks only: names as type, no logos. Roles stay general.
export const tools = [
  { id: "notion", name: "Notion", role: "Plans and docs" },
  { id: "obsidian", name: "Obsidian", role: "Notes that link up" },
  { id: "cursor", name: "Cursor", role: "Where the code gets written" },
  { id: "claude", name: "Claude", role: "A pair on every build" },
  { id: "codex", name: "Codex", role: "A second set of eyes" },
  // A row along the plaza's town edge, faces turned toward the hall.
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
export const techWalks = [
  [[2.8, BOULEVARD_Z], [plaza.x, BOULEVARD_Z], 3],
  [[plaza.x, BOULEVARD_Z], [46, BOULEVARD_Z], 3],
  [[plaza.x, BOULEVARD_Z], [plaza.x, plaza.z - plaza.half[1]], 3],
  [[8.5, 1], [plaza.x, 1], 2],
  [[plaza.x, plaza.z - plaza.half[1]], [plaza.x, plaza.z + plaza.half[1]], 3],
  [[plaza.x, hall.door.z], [hallBounds.x1 - 6, hall.door.z], 2],
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
    rect(hall.x, hall.z, hall.size[0] / 2, hall.size[1] / 2),
    rect(27, BOULEVARD_Z, 22, 3.5),
    ...offices.map((o) => rect(o.x, o.z, o.size[0] / 2, o.size[1] / 2)),
  ];
}
export const inTechFootprint = (x, z, margin) =>
  techFootprints(margin).some(
    (r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1,
  );

// Standing audience facing the stage, with an aisle kept on the door line.
export const audienceBudget = { low: 18, medium: 40, high: 72 };
export function audience(tier = "medium") {
  const count = audienceBudget[tier] ?? audienceBudget.medium;
  const spots = [];
  let seed = 17;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (
    let x = hall.stage.x - hall.stage.depth / 2 - 2.2;
    x > hallBounds.x0 + 7;
    x -= 1.15
  )
    for (let z = hallBounds.z0 + 1.6; z < hallBounds.z1 - 1.5; z += 1.05) {
      if (Math.abs(z - hall.door.z) < 1.5) continue;
      spots.push({
        x: x + (rand() - 0.5) * 0.35,
        z: z + (rand() - 0.5) * 0.3,
        yaw: Math.PI / 2 + (rand() - 0.5) * 0.5,
      });
    }
  // Fill from the stage back so small tiers still read as a crowd up front.
  return spots.slice(0, count);
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
      [plaza.x, hall.door.z + 0.5],
      [hallBounds.x0 - 0.5, hall.door.z + 0.5],
    ],
  ];
  const count = strollBudget[tier] ?? strollBudget.medium;
  return Array.from({ length: count }, (_, i) => {
    const path = lanes[i % lanes.length];
    const length = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]);
    return { path, length, speed: 1.05 + (i % 4) * 0.12 };
  });
}

export const techViews = [
  {
    id: "keynote",
    label: "Keynote hall",
    position: [hallBounds.x0 + 4.5, 4.8, hall.z + 0.3],
    target: [hall.stage.x, hall.screen.y - 0.6, hall.z],
    portrait: {
      position: [hallBounds.x0 + 3, 4.6, hall.z],
      target: [hall.stage.x, hall.screen.y - 0.8, hall.z],
      fov: 70,
    },
    content: "work",
    prompt: "What I've been making, on the big screen",
    hint: "A full house for the projects. Open one to read how it was built.",
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
    id: "valley",
    label: "The valley",
    position: [-4, 24, 30],
    target: [26, 0, -6],
    portrait: { position: [-2, 34, 40], target: [24, 0, -4], fov: 64 },
    content: "work",
    prompt: "A small valley of things being built",
    hint: "Workshops, a keynote hall across the plaza, and offices along the palms.",
  },
];
