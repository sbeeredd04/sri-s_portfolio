// Metre-scale crossed swell shared by hull buoyancy and the visible sea.
// Spatial phase bending prevents uniform wallpaper bands across the bay.
export function seaHeight(x, z, time, wind = 4) {
  const strength = 0.025 + Math.min(1, Math.max(0, wind) / 15) * 0.065;
  const bend = Math.sin(x * 0.027 + z * 0.019) * 1.7;
  return strength * (
    Math.sin(x * 0.52 + z * 0.28 + bend - time * 1.15) +
    0.43 * Math.sin(-x * 0.91 + z * 1.37 + Math.sin(z * 0.043) - time * 1.8) +
    0.23 * Math.sin(x * 1.86 + z * 2.17 + bend * 0.6 - time * 2.2)
  );
}
export const seaHeightGLSL = `
float bayHeight(vec2 q, float t, float wind) {
  float bend=sin(q.x*.027+q.y*.019)*1.7;
  return (.025+clamp(wind,0.,1.)*.065)*(
    sin(dot(q,vec2(.52,.28))+bend-t*1.15)+
    .43*sin(dot(q,vec2(-.91,1.37))+sin(q.y*.043)-t*1.8)+
    .23*sin(dot(q,vec2(1.86,2.17))+bend*.6-t*2.2));
}
`;
