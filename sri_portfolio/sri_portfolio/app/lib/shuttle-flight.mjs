// Linear air resistance produces a shuttle's quick rise and steeper fall.
// Solve launch velocity for a chosen endpoint, instead of snapping a sine wave.
export function shuttleFlight(time, duration = 1.35) {
  const t = Math.max(0, Math.min(time, duration));
  const drag = 0.8,
    gravity = 9.81;
  const terminalFactor = (1 - Math.exp(-drag * duration)) / drag;
  const factor = (1 - Math.exp(-drag * t)) / drag;
  const launchY =
    (gravity * duration) / (drag * terminalFactor) - gravity / drag;
  const decay = Math.exp(-drag * t);
  return {
    progress: factor / terminalFactor,
    height: 1.35 + (launchY + gravity / drag) * factor - (gravity * t) / drag,
    progressVelocity: decay / terminalFactor,
    verticalVelocity: (launchY + gravity / drag) * decay - gravity / drag,
  };
}
