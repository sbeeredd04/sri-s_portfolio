// Fieldnotes' northern headland starts beyond the lookout; the southern
// bridge shoulder keeps its original grade. Shared by physical terrain and
// the material mask so water cannot be painted over raised land.
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function fieldnotesCoastEdges(x, z, inner, outer) {
  const d = Math.hypot(x, z);
  const north = smooth(-0.15, 0.8, z / Math.max(d, 0.001));
  const angle = Math.atan2(z, x);
  return [
    inner + (19 - inner) * north,
    outer + (30 - 2 * Math.cos(angle * 3) - outer) * north,
  ];
}
export const fieldnotesCoastGlsl = `
vec2 fieldnotesCoastEdges(vec2 local, vec2 original) {
  float north=smoothstep(-.15,.8,local.y/max(length(local),.001));
  float angle=atan(local.y,local.x);
  return mix(original,vec2(19.,30.-2.*cos(angle*3.)),north);
}
`;
