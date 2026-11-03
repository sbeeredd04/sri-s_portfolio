import { chapters, readingSections } from "./world-story.mjs";
import { placeStops } from "./place-stops.mjs";
import { biomeRooms } from "./reading-rooms.mjs";

export const spotlightEntries = [
  ...readingSections.map((room) => ({
    id: `room-${room.id}`,
    label: room.name,
    description: room.caption,
    kind: "Page",
    room: room.id,
    action: { type: "open", content: room.id },
  })),
  {
    id: "resume",
    label: "Résumé",
    description: "Experience, education and selected work.",
    kind: "Page",
    href: "/resume",
  },
  {
    id: "story",
    label: "Read the story",
    description: "All the content in a directly accessible reading view.",
    kind: "Page",
    href: "/story",
  },
  {
    id: "world",
    label: "The whole world",
    description: "Return to the overview.",
    kind: "Place",
    action: { type: "travel", biome: "planet" },
  },
  ...chapters.map((c) => ({
    id: `place-${c.id}`,
    label: c.short,
    description: c.description,
    kind: "Place",
    biome: c.id,
    action: { type: "travel", biome: c.id },
  })),
  ...Object.entries(placeStops).flatMap(([biome, stops]) =>
    stops.map((s) => ({
      id: `stop-${biome}-${s.id}`,
      label: s.label,
      description: s.hint || "Look a little closer.",
      kind: "View",
      biome,
      action: { type: "stop", biome, stop: s.id },
    })),
  ),
];
export function searchSpotlight(query, biome) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const local = biomeRooms[biome] || [];
  return spotlightEntries
    .filter((entry) =>
      words.every((word) =>
        `${entry.label} ${entry.description} ${entry.room || ""} ${entry.biome || ""}`
          .toLocaleLowerCase()
          .includes(word),
      ),
    )
    .sort((a, b) => {
      // Keep professional work first; local pages follow for an empty search.
      const rank = (e) =>
        e.room === "work"
          ? 0
          : local.includes(e.room)
            ? 1
            : e.kind === "Page"
              ? 2
              : 3;
      return rank(a) - rank(b);
    })
    .slice(0, 18);
}
