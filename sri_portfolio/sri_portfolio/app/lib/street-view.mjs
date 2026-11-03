import { projectGallerySites } from "./project-town-layout.mjs";
import { outThereStreet } from "./out-there-site.mjs";
import { bayWalkingNodes } from "./bay-bridge.mjs";
import { fieldnotesStreet } from "./fieldnotes-layout.mjs";
// Authored pedestrian positions, separate from roads, games and furniture.
export const streetRoutes = {
  studio: [
    { label: "The summit room", point: [-4.8, 2.8], look: [-2.5, 0.8] },
    { label: "Along the glass", point: [-4.8, 1.9], look: [-2.5, 0.1] },
    {
      label: "Inside the summit house",
      point: [-3.6, 1.7],
      look: [-0.4, -1.4],
    },
    { label: "Beside the desk", point: [-2.5, 0.3], look: [-0.4, -1.4] },
    { label: "The living room", point: [0.1, 3], look: [2.5, 0.7] },
  ],
  projects: [
    { label: "The waterfront walk", point: [0, 34], look: [30, 46.5], height: 2.208 },
    { label: "Toward the makers’ court", point: [0, 24], look: [0, 5.5], height: 2.208 },
    { label: "The garden turn", point: [-3.12, 19.71], look: [-12, 14], height: 2.208 },
    { label: "Along the planting", point: [-5.49616, 18.5], look: [0, 5.5], height: 2.208 },
    { label: "The western passage", point: [-16.48, 18.5], look: [-24, 14.2], height: 2.208 },
    { label: "Around the garden", point: [-19.12, 17.62], look: [-24, 14.2], height: 2.208 },
    { label: "Tools of the trade", point: [-20, 14.98], look: [-24, 14.2], height: 2.208 },
    { label: "Beside the studios", point: [-20, 0], look: [-27, -12], height: 2.208 },
    { label: "The film courtyard", point: [-20, -4], look: [0, 5.5], height: 2.208 },
    ...bayWalkingNodes,
  ],
  court: [
    { label: "The promenade", point: [-21, 13], look: [-12, 0] },
    { label: "Volleyball sideline", point: [-12, 12.2], look: [-12, 0] },
    { label: "One more rally", point: [0, 12.2], look: [0, 0] },
    { label: "A few shots", point: [14, 12.2], look: [14, -2] },
    { label: "Toward the listening house", point: [24, 13], look: [24, 24] },
  ],
  entertainment: [
    { label: "The garden walk", point: [19, 7], look: [9, -1] },
    { label: "Behind the cinema", point: [12, 7], look: [9, -1] },
    { label: "The listening porch", point: [0, 6], look: [-2, -1] },
    { label: "A record and a view", point: [0, 2.8], look: [-3, 0] },
  ],
  trail: outThereStreet,
  future: fieldnotesStreet,
};
export function streetIndex(stop) {
  return /^street:\d+$/.test(stop) ? Number(stop.split(":")[1]) : null;
}
export function streetStop(world, stop) {
  const index = streetIndex(stop);
  return index === null ? null : streetRoutes[world]?.[index] || null;
}

export function streetRange(world, stop) {
  const route = streetRoutes[world] || [],
    node = streetStop(world, stop),
    group = node?.group;
  const indices = route
    .map((n, i) => (n.group === group ? i : -1))
    .filter((i) => i >= 0);
  return { start: indices[0] || 0, end: indices.at(-1) ?? 0 };
}
