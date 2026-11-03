"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { projects } from "../../json/personal";
import { exhibitStep, projectExhibits } from "../../lib/project-exhibits.mjs";
import useWorldTime from "./useWorldTime";
import { rememberWorldEntry } from "../../lib/world-return.mjs";
import { GraphicsGate } from "./GraphicsHealth";
import IslandSceneBoundary from "./IslandSceneBoundary";
const Studio = dynamic(() => import("./MadeVisitCanvas"), { ssr: false });
const project = projects.find((p) => p.id === "aether");
const exhibit = projectExhibits.aether;
export default function MadeVisit() {
  const [inside, setInside] = useState(false),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [reduced, setReduced] = useState(false),
    [value, setValue] = useState(exhibit.initial);
  const [hover, setHover] = useState(false);
  const enterButton = useRef(null),
    selectedControl = useRef(null),
    returnFocus = useRef(false);
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback(() => setUnavailable(true), []);
  const clock = useWorldTime();
  const onReady = useCallback(() => {
    setReady(true);
    try {
      rememberWorldEntry(window.sessionStorage);
    } catch {}
  }, []);
  const onEnter = useCallback(() => {
    setInside(true);
    history.replaceState(null, "", "?view=inside");
  }, []);
  const onLeave = useCallback(() => {
    returnFocus.current = true;
    setInside(false);
    history.replaceState(null, "", "?view=outside");
    if (reduced)
      requestAnimationFrame(() => {
        enterButton.current?.focus({ preventScroll: true });
        returnFocus.current = false;
      });
  }, [reduced]);
  useEffect(() => {
    if (!busy && returnFocus.current) {
      enterButton.current?.focus({ preventScroll: true });
      returnFocus.current = false;
    }
  }, [busy]);
  useEffect(() => {
    if (inside) selectedControl.current?.focus({ preventScroll: true });
  }, [inside]);
  useEffect(() => {
    if (ready && new URLSearchParams(location.search).get("view") === "inside")
      setInside(true);
  }, [ready]);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const key = (e) => {
      if (e.key === "Escape") onLeave();
    };
    window.addEventListener("keydown", key);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("keydown", key);
    };
  }, [onLeave]);
  const step = exhibitStep("aether", value);
  return (
    <main className="made-visit" aria-label="Made — Aether studio">
      <div className="made-visit-canvas">
        {!unavailable && (
          <GraphicsGate onUnavailable={onUnavailable}>
            <IslandSceneBoundary onUnavailable={onUnavailable}>
              <Studio
                inside={inside}
                reduced={reduced}
                hover={hover}
                value={value}
                onValue={setValue}
                onEnter={onEnter}
                onBusy={setBusy}
                onReady={onReady}
                onUnavailable={onUnavailable}
              />
            </IslandSceneBoundary>
          </GraphicsGate>
        )}
      </div>
      <header className="made-visit-header">
        <a
          className="made-wordmark"
          href="/"
          aria-label="Sri — return to the whole world"
        >
          Sri.
        </a>
        <div>
          <p>02 · MADE / STUDIO 01</p>
          <h1>Aether</h1>
        </div>
        <div className="made-clock">
          <span>San Francisco</span>
          <time dateTime={clock?.iso}>
            {clock?.label || "San Francisco time"}
          </time>
        </div>
        <a href="/rooms/work#project-aether">Read the project ↗</a>
      </header>
      {!ready && !unavailable && (
        <p className="made-loading" role="status">
          Opening the studio…
        </p>
      )}
      {unavailable && (
        <p className="made-loading" role="status">
          The 3D view is unavailable.{" "}
          <a href="/rooms/work#project-aether">Read Aether's story.</a>
        </p>
      )}
      {!inside && (
        <aside className="made-project-caption">
          <p>{project.category}</p>
          <h2>{exhibit.title}</h2>
          <p>{project.description}</p>
        </aside>
      )}
      <footer className="made-visit-footer">
        {inside ? (
          <section className="made-exhibit" aria-label="Try Aether">
            <div className="made-exhibit-choices">
              {exhibit.steps.map((s) => (
                <button
                  key={s.id}
                  ref={value === s.id ? selectedControl : null}
                  aria-pressed={value === s.id}
                  onClick={() => setValue(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p aria-live="polite">{step.result}</p>
          </section>
        ) : (
          <div className="made-entry">
            <button
              ref={enterButton}
              disabled={!ready || busy || unavailable}
              onMouseEnter={() => {
                setHover(true);
              }}
              onMouseLeave={() => {
                setHover(false);
              }}
              onFocus={() => {
                setHover(true);
              }}
              onBlur={() => {
                setHover(false);
              }}
              onClick={onEnter}
            >
              Step inside <span aria-hidden="true">↗</span>
            </button>
            <p>One question can lead to more than one good idea.</p>
          </div>
        )}
        <div className="made-visit-actions">
          <a href="/">← Whole world</a>
          {inside && (
            <button onClick={onLeave} disabled={busy}>
              Leave the studio <span aria-hidden="true">↗</span>
            </button>
          )}
          <a href="/rooms/work">All projects ↗</a>
          <a href="/islands/out-there?light=day">Out there ↗</a>
        </div>
      </footer>
    </main>
  );
}
