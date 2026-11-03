import {
  Vector3,
  Quaternion,
  CatmullRomCurve3,
  MathUtils,
  BufferGeometry,
  Float32BufferAttribute,
  Color,
} from "three";
import { worldPoint, WORLD_RADIUS } from "./world-layout.mjs";
import { outThereEntry } from "./out-there-walk-runtime.mjs";

export const connections = [
  ["studio", "court", [61.4, 2.63, 30], [-40.5, 2.821, 12.3]],
  // The red span joins the working waterfront to the After hours west landing.
  ["projects", "court", [37, 2.224, -38], [-40.5, 2.821, 12.3]],
  ["trail", "projects", outThereEntry, [-44, 2.2, -34]],
  ["trail", "future", outThereEntry, [0, 0.1149818314670128, -8]],
  ["court", "entertainment", [24, 2.8, 13], [24, 2.8, 7]],
];

// The coast shader and the rendered causeway share the same shoulder widths.
export const causeway = { solidHalfWidth: 1.75, shoreHalfWidth: 3.0 };
// Made branches from the existing south-water approach. One physical trunk
// serves both destinations, instead of laying two almost-coincident decks.
const trailApproach = new CatmullRomCurve3([
  worldPoint("trail", outThereEntry),
  ...[[-126,4.05,25],[-132,4.2,34],[-130,3.9,49]].map(([x,y,z]) => new Vector3(x,WORLD_RADIUS+y,z)),
  worldPoint("future", connections.find(([a,b]) => a === "trail" && b === "future")[3]),
]);
export const walkingRoutes = connections.map(
  ([from, to, startLocal, endLocal]) => {
    const branches = from === "trail" && to === "projects";
    const startPoint = branches ? trailApproach.getPointAt(.20) : worldPoint(from, startLocal);
    const endPoint = worldPoint(to, endLocal);
    const start = startPoint.clone().normalize();
    const end = endPoint.clone().normalize();
    const turns = {
      "trail:projects": [[-120, 4.1, 43], [-80, 4.1, 40], [-46, 3.6, 25], [-36.9, 3.2, 26.3], [-36.8, 2.9, 30.2]],
      "trail:future": [[-126, 4.05, 25], [-132, 4.2, 34], [-130, 3.9, 49]],
    }[`${from}:${to}`] ?? [];
    const pts = [
      startPoint,
      ...turns.map(([x, y, z]) => new Vector3(x, WORLD_RADIUS + y, z)),
      endPoint,
    ];
    const curve = from === "trail" && to === "future" ? trailApproach : new CatmullRomCurve3(pts);
    return {
      from,
      to,
      joinsRoute: branches ? { from: "trail", to: "future", t: .20 } : null,
      start,
      end,
      startPoint,
      endPoint,
      curve,
      authored: from === "court" && to === "entertainment",
      turn: new Quaternion().setFromUnitVectors(start, end),
      axis: new Vector3().crossVectors(start, end).normalize(),
      length: curve.getLength(),
    };
  },
);

export const bayCrossing = {
  from: "projects",
  to: "court",
  start: 0.17,
  end: 0.87,
  towers: [0.32, 0.70],
  halfWidth: 1.4,
};
export function isBayCrossing(route) {
  return route.from === bayCrossing.from && route.to === bayCrossing.to;
}
export function crossingLift(route, t) {
  return isBayCrossing(route)
    ? 3.2 *
        MathUtils.smoothstep(t, 0, 0.36) *
        (1 - MathUtils.smoothstep(t, 0.64, 1))
    : route.to === "court"
      ? 1.5 * Math.sin(Math.PI * t) ** 2
      : 0;
}

export function pathSample(route, t, lane = 0, lift = 0.08) {
  const normal = new Vector3(0, 1, 0);
  const position = route.curve.getPointAt(t);
  const tangent = route.curve.getTangentAt(t);
  const side = new Vector3().crossVectors(normal, tangent).normalize();
  position.addScaledVector(side, lane);
  position.y +=
    crossingLift(route, t) + lift - (route.authored ? 0.093 : 0.115);
  return { position, normal };
}
export function pathHalfWidth(route, t) {
  return (
    0.95 +
    (isBayCrossing(route)
      ? (bayCrossing.halfWidth - 0.95) *
        MathUtils.smoothstep(t, 0, bayCrossing.start) *
        (1 - MathUtils.smoothstep(t, bayCrossing.end, 0.92))
      : 0)
  );
}
export function pathPose(route, t, lane = 0, lift = 0.08) {
  const sample = pathSample(route, t, lane, lift);
  const next = pathSample(route, Math.min(1, t + 0.001), lane, lift);
  const previous = pathSample(route, Math.max(0, t - 0.001), lane, lift);
  const forward = next.position.sub(previous.position).normalize();
  const right = new Vector3().crossVectors(sample.normal, forward).normalize();
  const up = new Vector3().crossVectors(forward, right).normalize();
  return { ...sample, forward, right, up };
}

// A continuous bevelled surface following the exact navigation curve.
// Four across the top keeps each triangle small without stacked tile boxes.
export function worldPavingGeometry(routes = walkingRoutes) {
  const positions = [],
    colors = [],
    indices = [];
  const color = new Color("#b7a48b"),
    edge = new Color("#9d8d77");
  for (const route of routes) {
    if (route.authored) continue;
    const steps = Math.ceil(route.length / 0.72);
    const origin = positions.length / 3;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        half = pathHalfWidth(route, t);
      const rows = [
        [-half - 0.055, 0.048],
        [-half, 0.115],
        [-half * 0.34, 0.116],
        [half * 0.34, 0.116],
        [half, 0.115],
        [half + 0.055, 0.048],
      ];
      rows.forEach(([lane, lift], j) => {
        const p = pathSample(route, t, lane, lift).position;
        positions.push(p.x, p.y, p.z);
        const c = (j === 0 || j === 5 ? edge : color)
          .clone()
          .multiplyScalar(0.98 + 0.02 * Math.sin(i * 0.41 + j * 1.2));
        colors.push(c.r, c.g, c.b);
        if (i < steps && j < 5) {
          const a = origin + i * 6 + j,
            b = a + 1,
            c = a + 6,
            d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      });
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  // Arc offset side points have the same up orientation as pathPose.
  g.computeVertexNormals();
  return g;
}

// The same slab, curb and lamp footprints drive rendering and clearance checks.
export function walkwayPlacements() {
  const tiles = [],
    edge = [],
    posts = [],
    lamps = [],
    footings = [];
  const piers=[];
  for (const route of walkingRoutes) {
    if (route.authored) continue;
    const count = Math.ceil(route.length / 0.85);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const pose = pathPose(route, t);
      const before = pathPose(route, i / count).position;
      const after = pathPose(route, (i + 1) / count).position;
      const length = before.distanceTo(after);
      const halfWidth = pathHalfWidth(route, t);
      tiles.push({
        ...pose,
        size: [halfWidth * 2, 0.07, Math.max(0.1, length - 0.035)],
      });
      for (const side of [-1, 1]) {
        edge.push({
          ...pathPose(route, t, side * (halfWidth + 0.08), 0.06),
          size: [0.13, 0.14, length - 0.018],
        });
      }
    }
    const countLamps = Math.max(2, Math.floor(route.length / 9));
    for (let i = 0; i < countLamps; i++) {
      const t = (i + 0.5) / countLamps;
      if (
        isBayCrossing(route) &&
        t >= bayCrossing.start &&
        t <= bayCrossing.end
      )
        continue;
      const pose = pathPose(
        route,
        (i + 0.5) / countLamps,
        (i % 2 ? -1 : 1) * (pathHalfWidth(route, t) + 0.47),
        0.04,
      );
      const raised = (height, size) => ({
        ...pose,
        position: pose.position.clone().addScaledVector(pose.up, height),
        size,
      });
      footings.push(raised(0.035, [0.3, 0.07, 0.3]));
      posts.push(raised(0.48, [0.12, 0.9, 0.12]));
      lamps.push(raised(0.87, [0.135, 0.15, 0.135]));
      posts.push(raised(0.97, [0.19, 0.055, 0.19]));
    }
    const countPiers=Math.max(1,Math.ceil(route.length/7.2));
    for(let i=0;i<countPiers;i++){
      const t=(i+.5)/countPiers;
      if(t<.12||t>.90||(isBayCrossing(route)&&t>bayCrossing.start&&t<bayCrossing.end))continue;
      const pose=pathPose(route,t);
      const length=Math.max(.2,pose.position.y-WORLD_RADIUS+.65);
      piers.push({...pose,position:pose.position.clone().add(new Vector3(0,-length/2,0)),right:new Vector3(1,0,0),up:new Vector3(0,1,0),forward:new Vector3(0,0,1),size:[.72,length,.72]});
    }
  }
  return { tiles, edge, posts, lamps, footings, piers };
}
