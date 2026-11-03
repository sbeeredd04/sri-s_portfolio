import { Vector3 } from "three";
import { homeArrival, homeHarbor, homePromenade, homeSite } from "./home-site.mjs";
import { apartmentPoint } from "./studio-layout.mjs";
import { afterHoursArrival } from "./authored-island-sites.mjs";

export const closeShadowProjection = { offset: 180, near: 3, far: 400 };

export const homeStreetLenses = [
  [-49, 5.823, 49.1], [-37, 6.375, 49.1], [-25, 6.4, 49.1],
  [-13, 6.4, 49.1], [-1, 6.4, 49.1], [12, 6.4, 49.1],
  [24, 6.4, 49.1], [36, 6.4, 49.1], [48, 6.253, 49.1],
];

// Same installed island, expressed in its Court frame, with authored y
// already included. The listening frame begins 43 metres farther south.
export const afterHoursThresholdLenses = [
  [-7, 3.712, 49.4], [3, 3.712, 51.8], [14.4, 3.712, 45.9],
];

export const isHomeInterior = (stop) => stop === "desk" || stop === "bookshelf";

export function homeStreetPracticals(stop) {
  const cameraX = (stop === "harbor" ? homeHarbor : homePromenade).position[0];
  const lenses = stop === "arrival"
    ? [1, 3, 5, 7].map((index) => homeStreetLenses[index])
    : homeStreetLenses.slice()
        .sort((a, b) => Math.abs(a[0] - cameraX) - Math.abs(b[0] - cameraX))
        .slice(0, 4);
  return lenses.map((position) => [position, "#ffd19b", 33, 12, "exterior", "studio"]);
}

export function afterHoursThresholdPracticals(stop) {
  const lenses = stop === "cinema"
    ? afterHoursThresholdLenses.slice(1)
    : afterHoursThresholdLenses.slice(0, 2);
  return lenses.map((position) => [position, "#ffbd7d", 8, 7, "exterior", "court"]);
}

const summitBase = homeSite.anchors.Summit_EntryAnchor[1];
const homeBounds = {
  arrival: { min: [-54.1, 1.95, -29.1], max: [53.1, summitBase + 14.9, 51], focus: homeArrival.target },
  promenade: { min: [-54.1, 1.95, 0.55], max: [53.1, 18.4, 51], focus: homePromenade.target },
  harbor: { min: [-13, -1, 39], max: [25, 7.1, 73], focus: homeHarbor.target },
};
const afterHoursBounds = {
  court: {
    arrival: { min: [-42, 2.6, -15], max: [28, 10, 54], focus: afterHoursArrival.target },
    courts: { min: [-25, 2.6, -15], max: [28, 9, 22], focus: [0, 4, 0] },
  },
  entertainment: { min: [-9, 2.6, -8], max: [17, 10, 11], focus: [2, 5, 1] },
};

export function lightingShadowSubject(world, stop) {
  if (world === "studio") {
    if (isHomeInterior(stop)) {
      return {
        min: [-13.5, summitBase + 3.55, -28.35],
        max: [5.5, summitBase + 6.8, -18.9],
        focus: apartmentPoint([0, 1.25, 0]),
      };
    }
    return homeBounds[stop] ?? homeBounds.promenade;
  }
  if (world === "court") return stop === "arrival" ? afterHoursBounds.court.arrival : afterHoursBounds.court.courts;
  if (world === "entertainment") return afterHoursBounds.entertainment;
  return null;
}

export function shadowFit(subject, direction) {
  // Match Three's orthographic shadow camera with +Y up. Fit the subject's
  // eight actual bounds corners in light space around the existing stop focus.
  const sun = new Vector3(...direction).normalize();
  const right = new Vector3(0, 1, 0).cross(sun);
  // At zenith lookAt has no unique roll. Fit a square around the
  // horizontal radius so Three's fallback basis cannot clip the subject.
  const zenith = right.lengthSq() < 1e-8;
  if (zenith) right.set(1, 0, 0);
  right.normalize();
  const up = new Vector3().crossVectors(sun, right).normalize();
  const point = new Vector3();
  const focus = new Vector3(...subject.focus);
  let width = 0;
  let height = 0;
  for (const x of [subject.min[0], subject.max[0]])
    for (const y of [subject.min[1], subject.max[1]])
      for (const z of [subject.min[2], subject.max[2]]) {
        point.set(x, y, z).sub(focus);
        const horizontal = point.dot(right);
        const vertical = point.dot(up);
        const radius = zenith ? Math.hypot(horizontal, vertical) : 0;
        width = Math.max(width, Math.abs(horizontal), radius);
        height = Math.max(height, Math.abs(vertical), radius);
      }
  return { focus: subject.focus, width: Math.ceil(width + 2), height: Math.ceil(height + 2) };
}
