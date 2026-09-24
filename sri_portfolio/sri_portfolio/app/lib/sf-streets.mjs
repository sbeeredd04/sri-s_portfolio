// City streets are painted into the planet surface rather than laid as
// separate meshes: they follow the hills exactly, cost no geometry and never
// z-fight at intersections. The GLSL and the JavaScript twin below are both
// generated from the plan, so what walkers and tests read is what is drawn.
import {
  STREET,
  grids,
  gridFrame,
  marketStreet,
  marketSide,
  parks,
  coastDistance,
} from "./sf-plan.mjs";
import { sfSlope } from "./sf-terrain.mjs";

const band = STREET.road / 2 + STREET.walk;
const lineDistance = (c, pitch) =>
  Math.abs(((((c / pitch + 0.5) % 1) + 1) % 1) - 0.5) * pitch;

function gridCoords(x, z) {
  const grid = marketSide(x, z) > 0 ? grids.north : grids.south;
  const [u, v] = gridFrame(grid).toGrid(x, z);
  return { u, v, pitch: grid.pitch };
}

function inStreetPark(x, z) {
  return parks.some(
    (p) =>
      !p.forest &&
      Math.abs(x - p.x) < p.half[0] &&
      Math.abs(z - p.z) < p.half[1],
  );
}

// "road", "walk" or null at a point in studio tangent metres.
export function streetAt(x, z) {
  if (inStreetPark(x, z)) return null;
  const { u, v, pitch } = gridCoords(x, z);
  const d = Math.min(lineDistance(u, pitch[0]), lineDistance(v, pitch[1]));
  const [fx, fz] = marketStreet.from,
    [dx, dz] = marketStreet.direction;
  const t = Math.max(
    0,
    Math.min(marketStreet.length, (x - fx) * dx + (z - fz) * dz),
  );
  const dm = Math.hypot(x - fx - dx * t, z - fz - dz * t);
  if (d < STREET.road / 2 || dm < marketStreet.width / 2 - STREET.walk)
    return "road";
  if (d < band || dm < marketStreet.width / 2) return "walk";
  return null;
}

// Parenthesised so a negative literal never forms "--" in GLSL.
const f = (n) => `(${Number(n).toFixed(4)})`;

// vec4(road, walk, crosswalk, centre line) at cityLocal p; w is -1 on a
// park lawn and -2 on a paved plaza.
export function streetsGlsl() {
  const { north, south } = grids;
  const c = Math.cos(south.angle),
    s = Math.sin(south.angle);
  const [fx, fz] = marketStreet.from,
    [dx, dz] = marketStreet.direction;
  const parkChecks = parks
    .filter((p) => !p.forest)
    .map(
      (p) =>
        `if(abs(p.x-${f(p.x)})<${f(p.half[0])}&&abs(p.y-${f(p.z)})<${f(p.half[1])})return vec4(0.,0.,0.,${p.plaza ? "-2." : "-1."});`,
    )
    .join("\n");
  return `
  float sfLine(float c,float pitch){return abs(fract(c/pitch+.5)-.5)*pitch;}
  vec4 sfStreets(vec2 p){
    ${parkChecks}
    vec2 F=vec2(${f(fx)},${f(fz)}),MD=vec2(${f(dx)},${f(dz)});
    float side=(p.x-F.x)*MD.y-(p.y-F.y)*MD.x;
    vec2 q,pitch;
    if(side>0.){q=p-vec2(${f(north.origin[0])},${f(north.origin[1])});pitch=vec2(${f(north.pitch[0])},${f(north.pitch[1])});}
    else{vec2 d=p-F;q=vec2(d.x*${f(c)}+d.y*${f(s)},-d.x*${f(s)}+d.y*${f(c)});pitch=vec2(${f(south.pitch[0])},${f(south.pitch[1])});}
    float du=sfLine(q.x,pitch.x),dv=sfLine(q.y,pitch.y),d=min(du,dv);
    float t=clamp(dot(p-F,MD),0.,${f(marketStreet.length)});
    float dm=length(p-F-MD*t);
    float R=${f(STREET.road / 2)},B=${f(band)};
    float road=max(step(d,R),step(dm,${f(marketStreet.width / 2 - STREET.walk)}));
    float walk=max(step(d,B),step(dm,${f(marketStreet.width / 2)}))*(1.-road);
    // Zebra crossings where one road meets the other's corner, and a
    // dashed yellow centre line between them.
    float zebra=0.,centre=0.;
    if(du<R&&dv>B&&dv<B+2.2)zebra=step(.5,fract(q.x/.9));
    if(dv<R&&du>B&&du<B+2.2)zebra=step(.5,fract(q.y/.9));
    if(du<.07&&dv>B+2.4)centre=step(.45,fract(q.y/3.2));
    if(dv<.07&&du>B+2.4)centre=step(.45,fract(q.x/3.2));
    if(dm<.07&&d>B)centre=1.;
    return vec4(road,walk,zebra*road,centre*road);
  }`;
}

// Walkable city: every street is open to visitors kerb to kerb (the city
// has no traffic), split into short runs so the walker hugs the hills.
// Runs stop at the coast, in parks and where a grade is stair-steep.
export function cityWalkRuns(step = 2) {
  const runs = [];
  const flush = (run) => {
    for (let i = 1; i < run.length; i++) runs.push([run[i - 1], run[i]]);
  };
  const lines = [];
  for (const grid of [grids.north, grids.south]) {
    const frame = gridFrame(grid);
    for (let k = -7; k <= 7; k++) {
      lines.push((t) => frame.toWorld(k * grid.pitch[0], t));
      lines.push((t) => frame.toWorld(t, k * grid.pitch[1]));
    }
  }
  const [fx, fz] = marketStreet.from,
    [dx, dz] = marketStreet.direction;
  lines.push((t) => [fx + dx * (t + 200), fz + dz * (t + 200)]);
  for (const line of lines) {
    let run = [];
    for (let t = -200; t <= 200; t += step) {
      const [x, z] = line(t);
      const open =
        streetAt(x, z) === "road" &&
        coastDistance(x, z) > 2.5 &&
        sfSlope(x, z) < 0.36;
      if (open) run.push([x, z]);
      else {
        flush(run);
        run = [];
      }
    }
    flush(run);
  }
  return runs;
}
