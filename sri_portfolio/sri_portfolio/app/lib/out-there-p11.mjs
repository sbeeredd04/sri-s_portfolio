// Supplied Blender p11 coordinates, converted once to metres / Three Y-up.
// Every view and future interaction/navigation hook uses this same frame.
import hooks from "./out-there-p11-hooks.json" with { type: "json" };
export const outThereHooks = hooks;
export const outThereFrame = { unitsPerMetre: 1.56, seaLevel: -6 };
export function outTherePoint([x, y, z]) {
  const s = outThereFrame.unitsPerMetre;
  return [x / s, (z - outThereFrame.seaLevel) / s, -y / s];
}
const shot = (label, eye, target, fov) => ({
  label,
  position: outTherePoint(eye),
  target: outTherePoint(target),
  fov,
});
export function outThereNode(id) {
  const node = hooks.path_nodes[id];
  if (!node) throw Error(`Unknown p11 path node: ${id}`);
  return outTherePoint(node.blender);
}
export const outThereViews = {
  island: shot("Island", [68, -296, 230], [8, -8, 4], 32.3),
  waterfall: shot("Waterfall", [12, -158.4, 52], [12, 0, 10.46], 25.4),
  trail: shot("The trail", [45, -44, 7.2], [4, -7, 11], 45.7),
  // Deck boards measured from the shipped geometry: centre [-28,-12,1.1].
  lake: shot("Lake & dock", [-47, -38, 16], [-28, -12, 1.1], 45.8),
  lookout: shot("The lookout", [5.5, 3.9, 31.7], [0, -40, 22], 49.4),
  cable: shot("Cable car", [80, -10, 48], [29, 26, 20], 32.3),
};
