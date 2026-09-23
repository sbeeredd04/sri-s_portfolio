import { projectGallerySites } from "./project-town-layout.mjs";
import { trailStops } from "./trail-layout.mjs";
import { bayWalkingNodes } from "./bay-bridge.mjs";
import { fieldnotesStreet } from "./fieldnotes-layout.mjs";
// Authored pedestrian positions, separate from roads, games and furniture.
export const streetRoutes = {
  studio: [
    { label: "The rooftop landing", point: [-4.8, 6.3], look: [-4.8, 4.5] },
    { label: "At the doorway", point: [-4.8, 5.7], look: [-4.8, 2] },
    { label: "Inside the apartment", point: [-4.7, 2.4], look: [-0.4, -1.4] },
    { label: "Beside the desk", point: [-2.5, 0.3], look: [-0.4, -1.4] },
    { label: "The living room", point: [0.1, 3], look: [2.5, 0.7] },
    ...bayWalkingNodes,
  ],
  projects: [
    { label: "The central walk", point: [-2.8, 11.7], look: [-2.8, 4.8] },
    { label: "The makers’ court", point: [-2.8, 5.8], look: [-6, 3.4] },
    { label: "Inside the arcade", point: [-2.5, 1], look: [-5, -2.2] },
    { label: "The western passage", point: [-8.5, 1], look: [-8.5, -5.8] },
    {
      label: "The mobile atelier",
      point: [-8.5, -5.8],
      look: [
        projectGallerySites.mobile.position[0],
        projectGallerySites.mobile.position[2],
      ],
    },
    { label: "Along the workshops", point: [-8.5, -7], look: [2.5, -7] },
    {
      label: "The northern passage",
      point: [2.8, -7],
      look: [
        projectGallerySites.hackathons.position[0],
        projectGallerySites.hackathons.position[2],
      ],
    },
    {
      label: "The hackathon hall",
      point: [2.8, -5.8],
      look: [
        projectGallerySites.hackathons.position[0],
        projectGallerySites.hackathons.position[2],
      ],
    },
    { label: "The other side of an idea", point: [2.8, 1], look: [5.5, -2.2] },
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
  trail: trailStops,
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
