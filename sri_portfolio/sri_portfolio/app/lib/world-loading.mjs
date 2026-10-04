// Progress measures completed preparation milestones, not elapsed time or bytes.
// New asset batches cannot move it backwards, and only the settled render gate
// may complete it. Keep updates outside the scene's React tree.
export function createWorldLoading() {
  const listeners = new Set();
  const initial = { progress: 0, label: "Preparing your world…" };
  let state = {},
    snapshot = initial;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    report(patch) {
      state = { ...state, ...patch };
      const fraction = state.total
        ? Math.min(1, (state.assembly || 0) / state.total)
        : 0;
      const progress = state.ready
        ? 100
        : Math.floor(
            (state.downloadTotal
              ? (state.downloads / state.downloadTotal) * 20
              : 0) +
              (state.terrain ? 20 : 0) +
              (state.code ? 10 : 0) +
              (state.surface ? 10 : 0) +
              fraction * 35,
          );
      const label = state.ready
        ? "Ready when you are."
        : fraction === 1
          ? "Settling into place…"
          : state.surface
            ? "Bringing the places to life…"
            : state.code
              ? "Loading textures and light…"
              : state.terrain
                ? "Loading the places…"
                : "Preparing your world…";
      const next = Math.max(snapshot.progress, progress);
      if (next === snapshot.progress && label === snapshot.label) return;
      snapshot = { progress: next, label };
      listeners.forEach((listener) => listener());
    },
  };
}

export const worldLoading = createWorldLoading();

export function entranceReadiness({ ready, progress }) {
  // The animation is optional: a prepared world can be entered immediately.
  // Replaying the introduction must not make a ready world unavailable again.
  const available = Boolean(ready);
  return { available, progress: available ? 100 : Math.min(99, progress) };
}
