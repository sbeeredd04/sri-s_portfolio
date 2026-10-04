"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { observeStartup } from "../../lib/entrance-diagnostics.mjs";
import PersonalSignature from "./PersonalSignature";
import { playEntrance, entranceChapters } from "../../lib/entrance-motion.mjs";
import { worldLoading, entranceReadiness } from "../../lib/world-loading.mjs";

// Prepare alongside the intro. Entry is a single gesture after real readiness;
// reading remains immediate while a cold scene prepares behind this surface.
export default function WorldLoader({
  ready,
  onPreload,
  onPrepare,
  onChooseAudio,
  onEnter,
}) {
  const dialog = useRef(null);
  const choice = useRef(null);
  const timer = useRef(null);
  const motion = useRef(null);
  const enterCallback = useRef(onEnter);
  enterCallback.current = onEnter;
  const finished = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [settled, setSettled] = useState(false);
  const [replay, setReplay] = useState(0);
  const [requested, setRequested] = useState(false);
  const loading = useSyncExternalStore(
    worldLoading.subscribe,
    worldLoading.getSnapshot,
    worldLoading.getServerSnapshot,
  );
  const { available, progress } = entranceReadiness({
    ready,
    settled,
    progress: loading.progress,
  });

  // Overlap network/terrain work with the score. Keep final GPU construction
  // after the motion: compiling the full scene during it causes visible hitches.
  useEffect(() => {
    const frame = requestAnimationFrame(onPreload);
    return () => cancelAnimationFrame(frame);
  }, [onPreload]);
  useEffect(() => {
    if (!settled) return;
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(onPrepare);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [settled, onPrepare]);

  useLayoutEffect(() => observeStartup(dialog.current), []);
  useLayoutEffect(() => {
    dialog.current.showModal();
    dialog.current.focus({ preventScroll: true });
    return () => clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (available && document.activeElement === dialog.current)
      dialog.current
        .querySelector(".entrance-audio")
        ?.focus({ preventScroll: true });
  }, [available]);
  useLayoutEffect(() => {
    motion.current = playEntrance(dialog.current, () => setSettled(true));
    return () => motion.current?.cancel();
  }, [replay]);
  useEffect(() => {
    if (settled) motion.current?.cancel();
  }, [settled]);

  const finish = useCallback(() => {
    if (choice.current === null || finished.current) return;
    finished.current = true;
    clearTimeout(timer.current);
    enterCallback.current();
  }, []);
  const enter = (withAudio) => {
    if (!available || choice.current !== null) return;
    choice.current = withAudio;
    // The world is already ready. Commit before unlocking optional audio.
    setRequested(true);
    setSettled(true);
    motion.current?.finish();
    // Resume inside the gesture; browsers reject audio unlocked after an exit.
    onChooseAudio(withAudio);
  };
  useEffect(() => {
    if (!requested || !ready) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(finish, 540);
    return () => clearTimeout(timer.current);
  }, [requested, ready, finish]);
  const entryLabel = (
    <span className="entrance-button-content">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4" />
      </svg>
      <span>
        {requested && choice.current
          ? "Entering…"
          : available
            ? "Enter with audio"
            : "Loading your world"}
      </span>
      <span className="entrance-button-end" aria-hidden="true">
        {available ? "↗" : `${progress}%`}
      </span>
    </span>
  );
  return (
    <dialog
      ref={dialog}
      className="world-loader"
      data-leaving={leaving}
      data-settled={settled}
      data-ready={ready}
      data-progress={progress}
      data-quiet
      aria-labelledby="entrance-title"
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        if (available) enter(false);
        else motion.current?.finish();
      }}
      onAnimationEnd={(event) => {
        if (
          event.target === dialog.current &&
          event.animationName === "entrance-depart"
        )
          finish();
      }}
    >
      <header className="entrance-masthead">
        <span>SRI UJJWAL REDDY</span>
        <button
          className="entrance-replay"
          disabled={requested}
          onClick={() => {
            if (settled) {
              setSettled(false);
              setReplay((value) => value + 1);
            } else motion.current?.finish();
          }}
        >
          {settled ? "Replay introduction ↻" : "Skip introduction ↗"}
        </button>
      </header>
      <div className="entrance-composition">
        <div className="entrance-stage" aria-hidden="true">
          <div className="entrance-halo" />
          <svg className="entrance-art" viewBox="0 0 660 340" fill="none">
            <g className="entrance-object">
              <rect
                className="entrance-material"
                x="282"
                y="36"
                width="96"
                height="96"
                rx="24"
              />
              <g className="entrance-detail entrance-detail-home">
                <path d="M314 70h32v29h-32zM330 70v29M314 84h32" />
              </g>
              <g className="entrance-detail entrance-detail-build">
                <path d="m304 70 14 14-14 14M330 98h24" />
              </g>
              <g className="entrance-detail entrance-detail-play">
                <circle cx="330" cy="84" r="34" />
                <circle cx="330" cy="84" r="27" />
                <circle cx="330" cy="84" r="19" />
                <circle cx="330" cy="84" r="4" />
              </g>
              <g className="entrance-detail entrance-detail-wander">
                <path d="M304 110 354 60M318 96v-18M332 82h17" />
              </g>
              <g className="entrance-detail entrance-detail-write">
                <path d="M307 65h46M307 78h46M307 91h33M307 104h23" />
              </g>
            </g>
          </svg>
          {entranceChapters.map((chapter) => (
            <div
              className={`entrance-chapter entrance-chapter-${chapter.id}`}
              key={chapter.id}
            >
              <span className="entrance-chapter-word">{chapter.word}</span>
              <span className="entrance-chapter-label">{chapter.label}</span>
            </div>
          ))}
          <div className="entrance-signature">
            <PersonalSignature />
          </div>
        </div>
        <h2 id="entrance-title">A little world of my own.</h2>
        <p className="entrance-description">
          AI engineering. A life in between.
        </p>
      </div>
      <footer className="entrance-footer">
        <div className="entrance-actions">
          <button
            className="entrance-audio"
            disabled={!available || requested}
            aria-busy={!available}
            aria-describedby="entrance-status"
            onClick={() => enter(true)}
          >
            {entryLabel}
            <span
              className="entrance-fill"
              aria-hidden="true"
              style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
            >
              {entryLabel}
            </span>
          </button>
          <button
            className="entrance-quiet"
            disabled={!available || requested}
            onClick={() => enter(false)}
          >
            {requested && !choice.current ? "Entering…" : "Enter quietly"}
          </button>
        </div>
        <div
          className="visually-hidden"
          role="progressbar"
          aria-label="World preparation"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${progress}% — ${available ? "Ready" : loading.label}`}
        />
        <div className="entrance-readiness">
          <span id="entrance-status" role="status">
            {requested
              ? "Come on in."
              : available
                ? "Ready when you are."
                : ready
                  ? "Finishing the introduction…"
                  : loading.label}
          </span>
        </div>
        <a className="entrance-story" href="/story">
          Read the story <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </dialog>
  );
}
