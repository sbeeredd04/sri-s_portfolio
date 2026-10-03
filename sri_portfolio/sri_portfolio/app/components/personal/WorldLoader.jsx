"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import PersonalSignature from "./PersonalSignature";
import { playEntrance, entranceChapters } from "../../lib/entrance-motion.mjs";

// One finite introduction. Entry, quiet entry and reading never wait for it.
export default function WorldLoader({ ready, onChooseAudio, onEnter }) {
  const { progress, total } = useProgress();
  const dialog = useRef(null);
  const choice = useRef(null);
  const timer = useRef(null);
  const motion = useRef(null);
  const highest = useRef(0);
  const finished = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [settled, setSettled] = useState(false);
  const [replay, setReplay] = useState(0);
  highest.current = Math.max(
    highest.current,
    ready ? 100 : Math.min(96, total ? progress : 0),
  );

  useLayoutEffect(() => {
    dialog.current.showModal();
    dialog.current
      .querySelector(".entrance-audio")
      ?.focus({ preventScroll: true });
    return () => clearTimeout(timer.current);
  }, []);
  useLayoutEffect(() => {
    motion.current = playEntrance(dialog.current, () => setSettled(true));
    return () => motion.current?.cancel();
  }, [replay]);
  useEffect(() => {
    if (settled) motion.current?.cancel();
  }, [settled]);

  const finish = () => {
    if (choice.current === null || finished.current) return;
    finished.current = true;
    clearTimeout(timer.current);
    onEnter();
  };
  const enter = (withAudio) => {
    if (choice.current !== null) return;
    choice.current = withAudio;
    // Resume inside the gesture; browsers reject audio unlocked after an exit.
    onChooseAudio(withAudio);
    motion.current?.finish();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    setLeaving(true);
    timer.current = setTimeout(finish, 540);
  };
  return (
    <dialog
      ref={dialog}
      className="world-loader"
      data-leaving={leaving}
      data-settled={settled}
      data-quiet
      aria-labelledby="entrance-title"
      onCancel={(event) => {
        event.preventDefault();
        enter(false);
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
            autoFocus
            onClick={() => enter(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4" />
            </svg>
            Enter with audio <span aria-hidden="true">↗</span>
          </button>
          <button className="entrance-quiet" onClick={() => enter(false)}>
            Enter quietly
          </button>
        </div>
        <div className="entrance-readiness">
          <span role="status">
            {ready ? "Ready when you are." : "Preparing the world…"}
          </span>
          {!ready && (
            <span
              className="world-loader-bar"
              role="progressbar"
              aria-label="World loading"
              aria-valuenow={Math.round(highest.current)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ transform: `scaleX(${highest.current / 100})` }} />
            </span>
          )}
        </div>
        <a className="entrance-story" href="/story">
          Read the story <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </dialog>
  );
}
