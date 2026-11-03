export const afterHoursCoastSource =
  "/models/islands/after-hours-coast.glb?v=ee19a01d9a5362ea4";
export const legacyContentLift = { court: 2.8, entertainment: 2.8 };
export const afterHoursArrival = {
  position: [-53, 44, -52],
  target: [0, 3.8, 21],
  fov: 48,
  portrait: { position: [-62, 62, -78], target: [0, 3.6, 21], fov: 65 },
};
export function raisedContentPoint(id, [x, y, z]) {
  return [x, y + (legacyContentLift[id] || 0), z];
}
