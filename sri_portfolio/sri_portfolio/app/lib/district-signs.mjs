// Wayfinding: one finger post per district, in each biome's own frame and
// lettering. Every board points at a real place, read from the layouts,
// so a sign can never name somewhere that isn't there.
import { stage } from "./amphitheatre.mjs";
import { booths, plaza, tools } from "./tech-plan.mjs";
import { campsite, lake, overlookDeck } from "./valley-layout.mjs";
import { lookout, newsstand } from "./fieldnotes-quarter.mjs";
import { cinemaOrigin, listeningSeat } from "./entertainment-layout.mjs";

// Lettering per biome: the CSS variable of its display face, and style.
export const signType = {
  projects: { font: "--font-manrope", weight: 700, style: "normal", board: "#1f252d", ink: "#f2efe9", accent: "#ffae98" },
  trail: { font: "--font-instrument", weight: 400, style: "normal", board: "#5a4331", ink: "#f3ead8", accent: "#c9a46a" },
  future: { font: "--font-newsreader", weight: 500, style: "italic", board: "#2f4a3c", ink: "#f4efe2", accent: "#e3c58a" },
  entertainment: { font: "--font-fraunces", weight: 600, style: "italic", board: "#3a2b3a", ink: "#f6e6c8", accent: "#e8c07a" },
};

const deck = overlookDeck();
export const districtSigns = {
  projects: {
    x: plaza.x + 2.2,
    z: plaza.z - plaza.half[1] + 1.2,
    boards: [
      { label: "Keynote stage", to: [stage.x, stage.z] },
      { label: "Demo row", to: [booths[2].x, booths[2].z] },
      { label: "Tools of the trade", to: [tools[2].x, tools[2].z] },
      { label: "Workshops", to: [0, 0] },
    ],
  },
  trail: {
    x: -1.4,
    z: 4.5,
    boards: [
      { label: "Camp", to: [campsite.x, campsite.z] },
      { label: "The lake", to: [lake.x, lake.z] },
      { label: "Overlook", to: [deck.x, deck.z] },
    ],
  },
  future: {
    x: -1.5,
    z: -8.2,
    boards: [
      { label: "Newsstand", to: [newsstand.x, newsstand.z] },
      { label: "Writing studio", to: [-2.15, 3.2] },
      { label: "The lookout", to: [lookout.x, lookout.z] },
    ],
  },
  entertainment: {
    x: 1.9,
    z: 7.4,
    boards: [
      { label: "Listening room", to: [listeningSeat.position[0], listeningSeat.position[2]] },
      { label: "Comfort cinema", to: [cinemaOrigin[0], cinemaOrigin[2]] },
    ],
  },
};

// Heading of a board: its pointed end faces the place it names.
export const boardYaw = (sign, [tx, tz]) =>
  Math.atan2(tz - sign.z, tx - sign.x);
