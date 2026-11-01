// One bounded, travelling field in each biome's metre-scaled X/Z frame.
// Weather bearings indicate where wind comes FROM; +Z is local south.
export function windDirection(degrees = 290) {
  const radians = (Number.isFinite(degrees) ? degrees : 290) * Math.PI / 180;
  return [-Math.sin(radians), Math.cos(radians)];
}
export function windStrength(speed = 4) {
  return Math.min(1, Math.max(0, Number.isFinite(speed) ? speed : 4) / 14);
}
export function windGust(x, z, time) {
  return .6 + .25 * Math.sin(x * .13 + z * .09 - time * 1.1)
    + .15 * Math.sin(x * .31 - z * .17 - time * 1.9);
}
export const windGLSL = `
  uniform float uWindTime, uWindStrength;
  uniform vec2 uWindDirection;
  float worldWindGust(vec2 p) {
    return .6 + .25*sin(p.x*.13+p.y*.09-uWindTime*1.1)
      + .15*sin(p.x*.31-p.y*.17-uWindTime*1.9);
  }
`;
export const coastalWind = { shrub: .035, tree: .12 };

// Pure step used by the render hook and pause/resume regression checks.
export function advanceWind(state, delta, speed, bearing, running = true) {
  if (!running || !Number.isFinite(delta) || delta <= 0) return state;
  const dt = Math.min(delta, .1), blend = 1 - Math.exp(-dt * .8);
  const [x,z] = windDirection(bearing);
  const target = Math.atan2(x,z);
  const turn = Math.atan2(Math.sin(target-state.angle), Math.cos(target-state.angle));
  state.time += dt;
  state.strength += (windStrength(speed)-state.strength)*blend;
  state.angle += turn*blend;
  return state;
}
