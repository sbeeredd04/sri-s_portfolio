// Camera stops out in the city. Studio stops are authored in the
// apartment's frame, so ground-level points drop by APARTMENT_LEVEL.
import { APARTMENT_LEVEL } from "./studio-layout.mjs";
import { landmarkSites, marketStreet } from "./sf-plan.mjs";
import { surfaceHeight } from "./world-layout.mjs";

const at = (x, lift, z) => [
  x,
  surfaceHeight("studio", x, z) + lift - APARTMENT_LEVEL,
  z,
];
const [fx, fz] = marketStreet.from,
  [dx, dz] = marketStreet.direction;
const alongMarket = (t, side = 0) => [
  fx + dx * t - dz * side,
  fz + dz * t + dx * side,
];
const { ferry, coit } = landmarkSites;

export const cityViews = [
  {
    id: "market",
    label: "Down Market Street",
    position: at(...insert(alongMarket(62, -2), 5.5)),
    target: at(ferry.x - 2, 11, ferry.z),
    portrait: {
      position: at(...insert(alongMarket(74, -1), 7)),
      target: at(ferry.x - 2, 10, ferry.z),
      fov: 62,
    },
    content: "work",
    prompt: "Where the city gets busy",
    hint: "Market Street runs down to the ferry clock, towers on either side.",
  },
  {
    id: "telegraph",
    label: "Up to Coit",
    position: at(coit.x - 21, 3.2, coit.z + 1),
    target: at(coit.x, 6, coit.z),
    portrait: {
      position: at(coit.x - 25, 3.6, coit.z + 1),
      target: at(coit.x, 7, coit.z),
      fov: 62,
    },
    content: "about",
    prompt: "A hill worth the climb",
    hint: "Stone steps up Telegraph Hill to the white tower on top.",
  },
  {
    id: "ladies",
    label: "Painted Ladies",
    position: at(-40, 4.5, -31),
    target: at(-8, 5, -29),
    portrait: {
      position: at(-44, 6, -31),
      target: at(-8, 5, -29),
      fov: 62,
    },
    content: "about",
    prompt: "Across from the park",
    hint: "A row of painted Victorians, facing Alamo Square.",
  },
];

function insert([x, z], lift) {
  return [x, lift, z];
}
