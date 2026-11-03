import { bridgeView } from "./bay-bridge.mjs";
import { aetherView, aetherSite } from "./made-stage.mjs";
import { madeCampus } from "./made-campus-data.mjs";
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
) => ({
  position,
  target,
  fov,
  portrait: { position: portraitPosition, target, fov: portraitFov },
});
const camera = {
  arrival: shot([33, 52, 95], [0, 5, 4], 46, [26, 81, 147], 64),
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
    const depth = site.size[2] / 2;
    return shot(
      madeSitePoint(site, [2.1, 3.7, depth + 6.1]),
      madeSitePoint(site, [0, 2.25, 1]),
      46,
      madeSitePoint(site, [0.6, 4.5, depth + 9.5]),
      64,
    );
  }
  return camera[id] || null;
}
