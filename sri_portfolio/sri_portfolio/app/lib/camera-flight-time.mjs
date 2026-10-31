// Camera interpolation follows visible elapsed time, not a physics timestep.
// Dropping slow-frame time makes the trip longer precisely on slower devices.
export function advanceFlightTime(elapsed, delta, duration, animate = true) {
  if (!animate) return duration;
  const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;
  return Math.min(duration, elapsed + step);
}
