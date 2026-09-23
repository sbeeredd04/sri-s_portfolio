// Two small-angle axes around a fixed ceiling attachment. State is in radians.
export function stepPendant(state, delta) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const duration = Math.min(delta, 0.05),
    steps = Math.ceil(duration / (1 / 120)),
    dt = duration / steps;
  for (let n = 0; n < steps; n++) {
    for (let axis = 0; axis < 2; axis++) {
      state.velocity[axis] +=
        ((-9.81 / 0.93) * Math.sin(state.angle[axis]) -
          1.8 * state.velocity[axis]) *
        dt;
      state.angle[axis] += state.velocity[axis] * dt;
    }
  }
}
