import { campusPaths } from "./campus-layout.mjs";

export const workshops = [
  {
    id: "aether",
    name: "Aether",
    caption: "A different direction.",
    position: [-5, 0, -2.2],
    color: "#a3bbed",
    type: 0,
  },
  {
    id: "agentex",
    name: "Agentex",
    caption: "The person behind the resume.",
    position: [0, 0, -4.8],
    color: "#b5cbbb",
    type: 1,
  },
  {
    id: "gitcue",
    name: "GitCue",
    caption: "A good place to commit.",
    position: [5.5, 0, -2.2],
    color: "#a8c5d9",
    type: 2,
  },
  {
    id: "mesa",
    name: "Mesa",
    caption: "History, made explorable.",
    position: [-6, 0, 3.4],
    color: "#d8b893",
    type: 3,
  },
  {
    id: "csdna",
    name: "csDNA",
    caption: "A closer look at the invisible.",
    position: [6, 0, 3.4],
    color: "#bac9e8",
    type: 4,
  },
  {
    id: "soda",
    name: "SoDA",
    caption: "Better with people.",
    position: [0, 0, 7.5],
    color: "#c3b1d7",
    type: 5,
    rotation: [0, Math.PI, 0],
  },
];

export const projectTownWalks = [
  [[-2.8, 12.1], [-2.8, 5.8], 2],
  [[-2.8, 5.8], [-2.5, 1], 1],
  [[-8.5, 1], [8.5, 1], 2],
  [[-8.5, 1], [-8.5, -7], 2],
  [[-8.5, -7], [7.7, -7], 1],
  [[2.8, -7], [2.8, 5.8], 1],
  [[-2.8, 5.8], [-6, 5.8], 2],
  [[2.8, 5.8], [6, 5.8], 2],
  [[-2.8, 5], [2.8, 5], 1],
  [[-5, 1], [-5, 0], 1],
  [[0, 1], [0, -2.5], 1],
  [[5.5, 1], [5.5, 0], 1],
];
export const projectWalks = [...projectTownWalks, ...campusPaths()];

export const projectLamps = [
  [-1.5, 0, 2.5],
  [3.8, 0, 2.5],
  [-3.8, 0, 7],
  [3.8, 0, 8.5],
  [-9.8, 0, -1],
  [9.7, 0, -1],
];
export const projectIndexPosition = [0, 0, 11];

export const projectGallerySites = {
  mobile: { position: [-8.5, 0, -10.5], width: 6.3, depth: 4.8 },
  hackathons: { position: [7.7, 0, -11.1], width: 8.2, depth: 5.5 },
};
export const districtLamps = [
  [-3.8, 0, -8],
  [1.7, 0, -8],
];
