// Shared built-waterfront envelope in the Foundry tangent frame. Keep the
// incoming northern bridge and eastern venue on their existing foundations.
export const foundryLandCenter = [(-7 * 450) / 190, (-10 * 450) / 190];
export const foundryLandBounds = { west: -44, east: 66, north: -52, south: 44 };
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function foundryCoastEdges(x, z, inner, outer) {
  const d = Math.max(0.001, Math.hypot(x, z)),
    nx = x / d,
    nz = z / d;
  const inlet = smooth(0.15, 0.65, -nx) * smooth(-0.15, 0.45, -nz);
  const original = [inner + (46 - inner) * inlet, outer + (96 - outer) * inlet];
  const [cx, cz] = foundryLandCenter,
    b = foundryLandBounds;
  const tx =
    (nx < 0 ? cx - b.west : b.east - cx) / Math.max(0.001, Math.abs(nx));
  const tz =
    (nz < 0 ? cz - b.north : b.south - cz) / Math.max(0.001, Math.abs(nz));
  const shortest = Math.min(tx, tz);
  const edge = shortest * (1 + (shortest / Math.max(tx, tz)) ** 8) ** (-1 / 8);
  // The bridge follows a slightly east-leaning northern approach. Preserve a
  // broad sector, including its slab, kerbs, lights and coastal grade.
  const bridge = smooth(-0.55, -0.1, nx) * smooth(-0.15, 0, -nz);
  const venue = smooth(0.65, 0.8, nx);
  const keep = Math.max(bridge, venue);
  const compact = [
    Math.min(original[0], edge),
    Math.min(original[1], edge + 44),
  ];
  return compact.map((v, i) => v + (original[i] - v) * keep);
}
const [cx, cz] = foundryLandCenter,
  b = foundryLandBounds;
export const foundryCoastGLSL = `
vec2 foundryCoastEdges(vec2 local,vec2 original){
  float d=max(.001,length(local));
  vec2 n=local/d;
  float inlet=smoothstep(.15,.65,-n.x)*smoothstep(-.15,.45,-n.y);
  vec2 prior=mix(original,vec2(46.,96.),inlet);
  float tx=(n.x<0. ? ${(cx - b.west).toFixed(8)} : ${(b.east - cx).toFixed(8)})/max(.001,abs(n.x));
  float tz=(n.y<0. ? ${(cz - b.north).toFixed(8)} : ${(b.south - cz).toFixed(8)})/max(.001,abs(n.y));
  float shortest=min(tx,tz);
  float edge=shortest*pow(1.+pow(shortest/max(tx,tz),8.),-.125);
  float keep=max(smoothstep(-.55,-.1,n.x)*smoothstep(-.15,0.,-n.y),smoothstep(.65,.80,n.x));
  return mix(min(prior,vec2(edge,edge+44.)),prior,keep);
}
`;
