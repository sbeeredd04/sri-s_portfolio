import { outThereViews, outThereNode } from "./out-there-p11.mjs";
// Asset revision is independent of the retained, separately audited walk graph.
export const outThereLiveSource = "/models/islands/out-there-refined.glb?v=fc67d387f6707a2c";

// One metre frame for the actual portfolio region, camp, cameras and paths.
export const outThereCamp = {
  x: 32,
  y: 4.34,
  z: 34,
  radius: 3.766,
  bottom: 3.68,
};
export const outThereArrival = {
  position: [53, 52, 106],
  target: [-3, 13, 11],
  fov: 42,
  portrait: { position: [64, 69, 149], target: [-3, 12, 11], fov: 64 },
};
export function outThereStop(id) {
  if (id === "arrival") return outThereArrival;
  if (id === "trailhead")
    return {
      ...outThereViews.trail,
      portrait: { ...outThereViews.trail, fov: 62 },
    };
  if (id === "lake")
    return {
      position: [-16, 12.5, 36],
      target: [-11.8, 7.4, 13],
      fov: 54,
      portrait: { position: [-17, 15, 46], target: [-9.5, 7.8, 14], fov: 68 },
    };
  if (id === "overlook")
    return {
      ...outThereViews.lookout,
      portrait: { ...outThereViews.lookout, fov: 68 },
    };
  if (id === "camp")
    return {
      position: [25, 8.6, 41],
      target: [32, 5.25, 34],
      fov: 49,
      portrait: { position: [23, 9, 44], target: [32, 5.25, 34], fov: 66 },
    };
  return null;
}
export const outThereStreet = [
  ["At the trailhead", "ENTRY", "J1"],
  ["Under the redwoods", "J1", "T1"],
  ["The lakeside turn", "T1", "J1"],
].map(([label, at, aim]) => {
  const p = outThereNode(at),
    t = outThereNode(aim);
  return {
    label,
    point: [p[0], p[2]],
    height: p[1],
    look: [t[0], t[2]],
    lookHeight: t[1],
  };
});
