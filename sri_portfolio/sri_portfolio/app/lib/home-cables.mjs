// Cable stations and supports use the same surveyed Home frame as the GLBs.
import { CatmullRomCurve3, Vector3 } from "three";
import { homeSite } from "./home-site.mjs";
import { worldPoint, WORLD_RADIUS } from "./world-layout.mjs";

const station = (name, height) => {
  const [x, ground, z] = homeSite.anchors[name];
  const point = worldPoint("studio", [x, ground + height, z]);
  point.y -= WORLD_RADIUS;
  return { name, point, ground, height };
};
const hillTop = station("Home_HillLineTop", 6.2);
const summitSupports = [
  station("Home_SummitLineLower", 5.5),
  station("Home_CableWestSupport", 10),
  station("Home_CableHillSupport", 17),
  station("Home_CableNorthWestSupport", 20),
  station("Home_CableNorthEastSupport", 17),
  station("Home_SummitLineUpper", 6.2),
];
export const homeCableSupports = [hillTop, ...summitSupports];
const curve = (points) => new CatmullRomCurve3(points, false, "centripetal");
const hill = curve([
  new Vector3(-112.03, 22.4, -35.79),
  new Vector3(-87, 28, -61),
  new Vector3(-58, 32, -88),
  hillTop.point,
]);
// The upper run goes behind the building. A diagonal from the west pylon to
// the east station would pass straight through the inhabited summit room.
const summit = curve(summitSupports.map(({ point }) => point));
export const homeCableLanes = [
  { line: hill, offset: -.87, period: 76, phase: .1 },
  { line: hill, offset: .87, period: 76, phase: .57 },
  { line: summit, offset: 0, period: 82, phase: .21 },
];
