import { bridgeView } from "./bay-bridge.mjs";
import { aetherView, aetherSite } from "./made-stage.mjs";
import { madeCampus } from "./made-campus-data.mjs";
import { madeGalleryLayout } from "./made-gallery.mjs";
export const madeSites = [aetherSite, ...madeCampus.studios];
export function madeSitePoint(site, [x, y, z]) {
  const c = Math.cos(site.yaw),
    s = Math.sin(site.yaw);
  return [
    site.center[0] + x * c + z * s,
    site.center[1] + y,
    site.center[2] - x * s + z * c,
  ];
}
const shot = (
  position,
  target,
  fov,
  portraitPosition = position,
  portraitFov = 64,
  portraitTarget = target,
) => ({
  position,
  target,
  fov,
  portrait: { position: portraitPosition, target: portraitTarget, fov: portraitFov },
});
const camera = {
  // Account for the desktop reading-panel offset and preserve the whole quay.
  arrival: shot([8, 72, 115], [5, 3, 8], 48, [3, 98, 166], 66, [0, 3, 8]),
  campus: shot([34, 28, 60], [-1, 5, 4], 49, [36, 41, 88], 65),
  ring: shot([17, 18, 34], [0, 4, -1], 50, [23, 26, 49], 65),
  keynote: shot([0, 4.25, 15.7], [0, 4.45, -6.72], 40, [0, 4.45, 17.2], 65),
  workbench: shot([21, 7.3, 51], [30, 2.8, 46.5], 49, [17, 8.7, 52], 66),
  mobile: shot([12.5, 5.9, 40], [8, 3.7, 30], 45, [14, 7, 42], 65),
  hackathons: shot([28, 6.8, -14], [30, 4.25, -29], 48, [28, 9, -9], 66),
  tools: shot([-17, 4.3, 16], [-24, 3.7, 14.2], 48, [-14, 5.4, 16.5], 66),
  demos: shot([6, 12, 16], [0, 4.1, -14], 45, [11, 19, 32], 66),
};
export function madeStop(id) {
  if (id === "bay") return bridgeView;
  if (id === "aether")
    return { ...aetherView("inside"), portrait: aetherView("inside", true) };
  const site = madeSites.find((s) => s.id === id);
  if (site) {
    return {
      ...madeProjectView(site.id, "inside"),
      portrait: madeProjectView(site.id, "inside", true),
    };
  }
  return camera[id] || null;
}

// Entry and reading views share the same real doorway and gallery datum. Keep
// the camera at adult eye level, inside the glass, looking toward the work.
export function madeProjectView(id, phase = "inside", portrait = false) {
  if (id === "aether") return aetherView(phase, portrait);
  const site = madeSites.find((s) => s.id === id);
  if (!site) return null;
  const layout = madeGalleryLayout(site);
  const localEye = phase === "entry"
    ? [0, layout.floor + 1.65, site.size[2] / 2 + 3.8]
    : portrait ? [0, layout.floor + 1.85, 4.0] : [0.45, layout.floor + 1.85, 2.6];
  return {
    position: madeSitePoint(site, localEye),
    target: madeSitePoint(site, [portrait ? 0 : 0.85, layout.exhibit[1] + 1.99, layout.exhibit[2] - 0.22]),
    fov: phase === "entry" ? (portrait ? 65 : 48) : (portrait ? 60 : 55),
  };
}

// A gallery is an occupied room, not an unconstrained island orbit. The eye
// stays in the clear central approach, below the real first-floor slab and
// suspended lighting, and behind the console without reaching the glazing.
export function madeGalleryOrbitLimits(site, distance, targetHeight) {
  const layout = madeGalleryLayout(site);
  const ceiling = site.id === "gitcue" || site.size[1] <= 7.6
    ? site.size[1] - 0.8 : 4.41;
  const minHeight = layout.floor + 1.25;
  const maxHeight = Math.min(layout.floor + 2.85, ceiling - 0.55);
  const minDistance = 3.2;
  const maxDistance = site.size[2] / 2 - 0.65 - (layout.exhibit[2] - 0.22);
  const radius = Math.max(minDistance, Math.min(maxDistance, distance));
  const angle = (height) => Math.acos(Math.max(-1, Math.min(1, (height - targetHeight) / radius)));
  return {
    minHeight, maxHeight, minDistance, maxDistance,
    minPolar: angle(maxHeight), maxPolar: angle(minHeight),
    minAzimuth: site.yaw - 0.42, maxAzimuth: site.yaw + 0.42,
  };
}
