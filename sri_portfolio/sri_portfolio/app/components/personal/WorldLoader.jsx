"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

const tierLabel = {
  low: "Light mode for this device",
  medium: "Balanced for this device",
  high: "Full detail for this device",
};

// Covers the page until assets have loaded and the first real frame is drawn.
// Progress comes from three's shared loading manager, so every texture, model
// and HDRI counts. The overlay never blocks the reading routes: Skip ahead
// reveals the interface immediately.
export default function WorldLoader({ ready, tier }) {
  const { progress, active, total } = useProgress();
  const [shown, setShown] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const started = useRef(0);
  const smooth = useRef(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  // Ease the number so it never jumps backwards when new loaders register.
  useEffect(() => {
    const target = ready ? 100 : Math.min(96, total ? progress : 12);
    smooth.current = Math.max(smooth.current, target);
    setDisplay(Math.round(smooth.current));
  }, [progress, total, ready]);
  useEffect(() => {
    if (!ready || active) return;
    const wait = Math.max(0, 700 - (performance.now() - started.current));
    const leave = setTimeout(() => setLeaving(true), wait);
    const done = setTimeout(() => setShown(false), wait + 900);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [ready, active]);
  if (!shown) return null;
  return (
    <div
      className={`world-loader${leaving ? " world-loader-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading the world, ${display} percent`}
    >
      <div className="world-loader-inner">
        <span className="world-loader-mark" aria-hidden="true">
          sri<i>.</i>
        </span>
        <p className="world-loader-line">Building a little world</p>
        <div className="world-loader-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${display / 100})` }} />
        </div>
        <p className="world-loader-meta">
          <span>{String(display).padStart(2, "0")}%</span>
          {tier && <span>{tierLabel[tier]}</span>}
        </p>
        <button
          type="button"
          className="world-loader-skip"
          onClick={() => {
            setLeaving(true);
            setTimeout(() => setShown(false), 400);
          }}
        >
          Skip ahead
        </button>
      </div>
    </div>
  );
}
