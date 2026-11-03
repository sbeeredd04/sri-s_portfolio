import { madeProjects } from "./made-projects.mjs";
import { Color, Float32BufferAttribute } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundedBox } from "./model-geometry.mjs";

// Compatibility for the five furnished galleries; Aether has its own showroom.
export const madeGalleryStories = Object.fromEntries(
  Object.entries(madeProjects).filter(([id]) => id !== "aether"),
);

// Local Three coordinates, shared by furniture, cameras and clearance tests.
// Each studio keeps a generous, uninterrupted centre approach to its exhibit.
export function madeGalleryLayout(site) {
  const [w, , d] = site.size;
  return {
    floor: 0.194,
    exhibit: [0, 0.194, -2.1],
    bench: [-w / 2 + 1.1, 0.194, 0.5],
    board: [w / 2 - 1.85, 2.65, -d / 2 + 0.6],
    boardSize: [2.4, 2.55],
    identity:
      site.id === "gitcue" ? [0, 8.25, d / 2 + 0.04] : [0, 3.85, d / 2 + 0.04],
    fixture: [0, 3.65, -1],
    aisle: { minX: -2, maxX: 2, minZ: -0.8, maxZ: d / 2 },
  };
}

export function buildMadeGallery(site) {
  const layout = madeGalleryLayout(site),
    [w, , d] = site.size;
  const parts = { wood: [], metal: [], paper: [], light: [] };
  const box = (kind, size, position, color, rotation = 0) => {
    let g = roundedBox(size, Math.min(0.014, ...size.map((v) => v / 4)), 1);
    if (g.index) {
      const next = g.toNonIndexed();
      g.dispose();
      g = next;
    }
    g.rotateY(rotation);
    g.translate(...position);
    g.deleteAttribute("uv");
    const c = new Color(color),
      colors = [];
    for (let i = 0; i < g.attributes.position.count; i++)
      colors.push(c.r, c.g, c.b);
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    parts[kind].push(g);
  };
  // A restrained oak floor gives the working room material warmth. Boards are
  // merged, not independent draw calls, and stop inside the structural shell.
  const length = d - 0.82,
    count = Math.ceil((w - 0.82) / 0.32),
    width = (w - 0.82) / count;
  for (let i = 0; i < count; i++)
    box(
      "wood",
      [width - 0.004, 0.014, length],
      [-(w - 0.82) / 2 + (i + 0.5) * width, 0.187, 0],
      i % 3 ? "#936941" : "#a37950",
    );
  const [bx, by, bz] = layout.bench;
  for (let i = 0; i < 4; i++)
    box(
      "wood",
      [0.12, 0.045, 2.2],
      [bx - 0.19 + i * 0.127, by + 0.435, bz],
      i % 2 ? "#a17850" : "#b38b60",
    );
  for (const z of [-0.83, 0.83]) {
    for (const x of [-0.17, 0.17])
      box(
        "metal",
        [0.035, 0.41, 0.045],
        [bx + x, by + 0.205, bz + z],
        "#383f3b",
      );
    box("metal", [0.44, 0.045, 0.055], [bx, by + 0.39, bz + z], "#383f3b");
  }
  // A small faceted edge and shadow gap frame the real project explanation.
  const [px, py, pz] = layout.board;
  box(
    "wood",
    [layout.boardSize[0] + 0.14, layout.boardSize[1] + 0.14, 0.09],
    [px, py, pz - 0.055],
    "#775638",
  );
  box(
    "paper",
    [layout.boardSize[0] + 0.04, layout.boardSize[1] + 0.04, 0.028],
    [px, py, pz - 0.006],
    "#d7cbb5",
  );
  box(
    "metal",
    [3.5, 0.65, 0.045],
    [...layout.identity.slice(0, 2), layout.identity[2] - 0.025],
    "#303b34",
  );
  // Agentex uses a flush-mounted wash rail on the existing ceiling slab.
  // The pooled point below it supplies light without adding a shadow pass.
  const ceiling =
    site.id !== "gitcue" && site.size[1] > 7.6 ? 4.41 : site.size[1] - 0.8;
  if (site.id === "agentex") {
    box("metal", [3.7, 0.042, 0.11], [0, ceiling - 0.015, -1], "#665645");
    box("light", [3.58, 0.012, 0.072], [0, ceiling - 0.038, -1], "#ffce91");
  } else {
    box("metal", [3.8, 0.08, 0.12], layout.fixture, "#463e31");
    box("light", [3.62, 0.015, 0.09], [0, 3.6, -1], "#ffce91");
    for (const x of [-1.6, 1.6])
      box(
        "metal",
        [0.018, ceiling - 3.69, 0.018],
        [x, (ceiling + 3.69) / 2, -1],
        "#463e31",
      );
  }
  return Object.fromEntries(
    Object.entries(parts).map(([key, list]) => {
      const g = mergeGeometries(list);
      list.forEach((p) => p.dispose());
      g.computeBoundingBox();
      return [key, g];
    }),
  );
}
