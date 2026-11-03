"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useWorldTime from "./useWorldTime";
import { outThereViews } from "../../lib/out-there-p11.mjs";
import { rememberWorldEntry } from "../../lib/world-return.mjs";
import { GraphicsGate } from "./GraphicsHealth";
import IslandSceneBoundary from "./IslandSceneBoundary";
const Scene = dynamic(() => import("./OutThereCanvas"), { ssr: false });
export default function OutThereVisit() {
  const [view, setView] = useState("island");
  const [animate, setAnimate] = useState(true);
  const [lighting, setLighting] = useState("live");
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback(() => setUnavailable(true), []);
  const clock = useWorldTime();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (["day", "night"].includes(params.get("light")))
      setLighting(params.get("light"));
    const requested = params.get("view");
    if (outThereViews[requested]) setView(requested);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setAnimate(false);
  }, []);
  const onReady = useCallback(() => {
    setReady(true);
    try {
      rememberWorldEntry(window.sessionStorage);
    } catch {}
  }, []);
  const openJournal = useCallback(() => {
    location.href = "/rooms/notes";
  }, []);
  const daylight =
    lighting === "day" ? 1 : lighting === "night" ? 0 : (clock?.daylight ?? 1);
  return (
    <main
      className="out-there-visit"
      data-night={daylight < 0.3}
      aria-label="Out there island"
    >
      <div className="out-there-canvas" aria-label="Interactive redwood island">
        {!unavailable && (
          <GraphicsGate onUnavailable={onUnavailable}>
            <IslandSceneBoundary onUnavailable={onUnavailable}>
              <Scene
                view={view}
                animate={animate}
                daylight={daylight}
                onJournalOpen={openJournal}
                onReady={onReady}
                onUnavailable={onUnavailable}
              />
            </IslandSceneBoundary>
          </GraphicsGate>
        )}
      </div>
      <header className="out-there-header">
        <a
          href="/"
          className="out-there-wordmark"
          aria-label="Sri — return to the whole world"
        >
          Sri.
        </a>
        <div className="out-there-heading">
          <p>04 · OUT THERE</p>
          <h1>Take the scenic route.</h1>
        </div>
        <div className="out-there-time">
          <span>San Francisco</span>
          <time dateTime={clock?.iso}>
            {clock?.label || "San Francisco time"}
          </time>
        </div>
        <a href="/rooms/notes" className="out-there-journal">
          The outdoor journal <span aria-hidden="true">↗</span>
        </a>
      </header>
      {!ready && !unavailable && (
        <p className="out-there-loading" role="status">
          Finding the trail…
        </p>
      )}
      {unavailable && (
        <p className="out-there-loading" role="status">
          The 3D view is unavailable.{" "}
          <a href="/rooms/notes">Read the outdoor journal.</a>
        </p>
      )}
      <footer className="out-there-footer">
        <p className="out-there-note">
          Sequoia, Sonoma, Catalina. Still on the list.
        </p>
        <nav aria-label="Views of Out there">
          {Object.entries(outThereViews).map(([id, shot]) => (
            <button
              key={id}
              aria-pressed={view === id}
              onClick={() => {
                setView(id);
                history.replaceState(null, "", `?light=${lighting}&view=${id}`);
              }}
            >
              {shot.label}
            </button>
          ))}
        </nav>
        <div className="out-there-options">
          <a href="/">← Whole world</a>
          <div>
            <label>
              Light{" "}
              <select
                value={lighting}
                onChange={(e) => {
                  setLighting(e.target.value);
                  history.replaceState(
                    null,
                    "",
                    `?light=${e.target.value}&view=${view}`,
                  );
                }}
              >
                <option value="live">Live SF</option>
                <option value="day">Golden light</option>
                <option value="night">Night</option>
              </select>
            </label>
            <button
              onClick={() => setAnimate((v) => !v)}
              aria-pressed={!animate}
            >
              {animate ? "Pause motion" : "Resume motion"}
            </button>
            <a href="/story">Read the story</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
