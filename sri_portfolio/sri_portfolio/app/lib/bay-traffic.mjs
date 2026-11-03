import { CatmullRomCurve3, Vector3 } from "three";

const route = (points) =>
  new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), true);

// Positions are in shared bay metres. Loops keep each hull facing its heading.
export const bayTraffic = [
  {
    id: "ferry", root: "Ferry_Root", speed: 3.3, phase: .018,
    wake: [5.2, 14, 4.6], envelope: [1.9, 5.7, 5.1],
    line: route([[5, 130], [-38, 148], [-79, 153], [-143, 150],
      [-167, 135], [-162, 111], [-152, 118], [-133, 138], [-91, 140], [-41, 129], [-15, 123]]),
  },
  {
    id: "harbor-launch", root: "Launch_Root", speed: 2.7, phase: .15,
    wake: [2.6, 8.5, 2.7], envelope: [1.1, 2.7, 2],
    line: route([[-25, -15], [13, -8], [45, -1], [56, 12], [40, 18],
      [3, 11], [-25, 2], [-35, -7]]),
  },
  {
    id: "south-launch", root: "Launch_Root", speed: 2.6, phase: .42,
    wake: [2.6, 8.5, 2.7], envelope: [1.1, 2.7, 2],
    line: route([[73, 98], [101, 101], [146, 96], [161, 116], [128, 133], [81, 124]]),
  },
  {
    id: "east-sail", root: "Sailboat_Root", speed: 1.25, phase: .24,
    wake: [2, 5, 2.1], envelope: [.8, 2.15, 4],
    line: route([[88, -109], [105, -107], [116, -87], [105, -72], [88, -82]]),
  },
  {
    id: "quay-sail", root: "Sailboat_Root", speed: 1.15, phase: .46,
    wake: [2, 5, 2.1], envelope: [.8, 2.15, 4],
    line: route([[31, 142], [63, 142], [94, 152], [79, 174], [40, 172]]),
  },
  {
    id: "channel-sail", root: "Sailboat_Root", speed: 1.20, phase: .19,
    wake: [2, 5, 2.1], envelope: [.8, 2.15, 4],
    line: route([[65, 27], [76, 39], [77, 65], [68, 73], [63, 53], [63, 35]]),
  },
  {
    id: "redwood-sail", root: "Sailboat_Root", speed: 1.3, phase: .17,
    wake: [2, 5, 2.1], envelope: [.8, 2.15, 4],
    line: route([[-222,-103],[-211,-139],[-172,-145],[-171,-126],[-202,-105]]),
  },
  {
    id: "north-launch", root: "Launch_Root", speed: 2.4, phase: .67,
    wake: [2.6,8.5,2.7], envelope: [1.1,2.7,2],
    line: route([[-100,-175],[-57,-183],[5,-177],[47,-167],[6,-163],[-55,-167]]),
  },
  {
    id: "outer-bay-ferry", root: "Ferry_Root", speed: 3.1, phase: .4,
    wake: [5.2,14,4.6], envelope: [1.9,5.7,5.1],
    line: route([[219,-93],[235,-56],[231,-5],[218,38],[209,8],[214,-45]]),
  },
  {
    id: "moored-launch", root: "Launch_Root", at: [9, 0, -14.8], yaw: Math.PI / 2,
    envelope: [1.1, 2.7, 2],
  },
];
