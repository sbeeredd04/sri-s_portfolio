// Opt-in local QA only: sample the actual browser timeline without a test driver.
// Normal visits create no observer, frame callback or diagnostic output.
export function observeEntrance(root, animations) {
  if (
    typeof location === "undefined" ||
    !["localhost", "127.0.0.1"].includes(location.hostname) ||
    !new URLSearchParams(location.search).has("diagnostics")
  )
    return () => {};
  const gaps = [],
    snapshots = [],
    tasks = [];
  let frame,
    previous,
    lastSnapshot = -Infinity,
    ended = false;
  const started = performance.now();
  const observer =
    typeof PerformanceObserver !== "undefined"
      ? new PerformanceObserver((list) => {
          tasks.push(
            ...list
              .getEntries()
              .map((e) => ({
                start: Math.round(e.startTime - started),
                duration: Math.round(e.duration),
              })),
          );
        })
      : null;
  try {
    observer?.observe({ type: "longtask", buffered: false });
  } catch {}
  const sample = (now) => {
    if (document.hidden) {
      previous = undefined;
    } else {
      if (previous !== undefined) gaps.push(now - previous);
      previous = now;
      if (now - lastSnapshot >= 250) {
        lastSnapshot = now;
        snapshots.push({
          at: Math.round(now - started),
          background: getComputedStyle(root).backgroundColor,
          elements: [
            ...root.querySelectorAll(
              ".entrance-chapter, #entrance-title, .entrance-replay, .entrance-quiet",
            ),
          ].map((e) => ({
            target: e.id || e.className,
            opacity: getComputedStyle(e).opacity,
            color: getComputedStyle(e).color,
            animations: e
              .getAnimations()
              .map((a) => ({
                time: Math.round(a.currentTime),
                state: a.playState,
              })),
          })),
        });
      }
    }
    frame = requestAnimationFrame(sample);
  };
  frame = requestAnimationFrame(sample);
  return () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    const sorted = [...gaps].sort((a, b) => a - b);
    const report = {
      duration: Math.round(performance.now() - started),
      frames: gaps.length,
      median: Math.round(sorted[Math.floor(sorted.length * 0.5)] || 0),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0),
      max: Math.round(sorted.at(-1) || 0),
      over50: gaps.filter((n) => n > 50).length,
      tasks,
      snapshots,
      timelines: animations.map((a) => ({
        target:
          a.effect.target.id ||
          a.effect.target.className?.baseVal ||
          a.effect.target.className,
        time: a.currentTime,
        start: a.startTime,
        state: a.playState,
      })),
    };
    root.dataset.entranceDiagnostics = JSON.stringify(report);
    console.info("Entrance diagnostics", JSON.stringify(report));
  };
}

export function observeStartup(root) {
  if (
    typeof location === "undefined" ||
    !["localhost", "127.0.0.1"].includes(location.hostname) ||
    !new URLSearchParams(location.search).has("diagnostics")
  )
    return () => {};
  const started = performance.now(),
    phases = {};
  let previous,
    frame,
    phase,
    ended = false;
  const classify = () =>
    root.dataset.leaving === "true"
      ? "exit"
      : root.dataset.ready === "true"
        ? "ready"
        : root.dataset.settled === "true"
          ? "preparing"
          : "intro";
  const sample = (now) => {
    const next = classify();
    if (!document.hidden) {
      const bucket = (phases[phase || next] ||= {
        gaps: [],
        started: Math.round(now - started),
      });
      if (previous !== undefined) bucket.gaps.push(now - previous);
      previous = now;
    } else previous = undefined;
    phase = next;
    frame = requestAnimationFrame(sample);
  };
  const report = () => {
    const summary = Object.fromEntries(
      Object.entries(phases).map(([name, { gaps, started }]) => {
        const sorted = [...gaps].sort((a, b) => a - b);
        return [
          name,
          {
            started,
            frames: gaps.length,
            median: Math.round(sorted[Math.floor(sorted.length * 0.5)] || 0),
            p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0),
            max: Math.round(sorted.at(-1) || 0),
            over50: gaps.filter((g) => g > 50).length,
          },
        ];
      }),
    );
    root.dataset.startupDiagnostics = JSON.stringify(summary);
  };
  frame = requestAnimationFrame(sample);
  const timer = setInterval(report, 1000);
  return () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    clearInterval(timer);
    report();
    console.info("Startup diagnostics", root.dataset.startupDiagnostics);
  };
}
