// Three initial frames are not readiness: nested Suspense assets and the first
// environment map can arrive later and invalidate already-compiled materials.
// Wait for a short quiet run after those dependencies are present. The bounded
// settling window also lets a slow GPU enter instead of waiting forever for 60fps.
export function sampleSceneStartup(
  previous,
  { now, pending, surface, lighting },
) {
  if (pending || !surface || !lighting)
    return { started: now, quiet: now, previous: now, frames: 0, ready: false };
  const state = previous || {
    started: now,
    quiet: now,
    previous: now,
    frames: 0,
  };
  const quiet = now - state.previous > 120 ? now : state.quiet;
  const frames = state.frames + 1;
  return {
    started: state.started,
    quiet,
    previous: now,
    frames,
    ready: frames >= 3 && (now - quiet >= 500 || now - state.started >= 3000),
  };
}
