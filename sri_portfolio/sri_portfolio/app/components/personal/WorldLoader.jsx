"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import PersonalSignature from "./PersonalSignature";

// A short brand introduction with an explicit sound choice. The world prepares
// underneath; neither a stalled asset nor the animation locks the visitor out.
export default function WorldLoader({ ready, onChooseAudio, onEnter }) {
  const { progress, total } = useProgress();
  const dialog = useRef(null);
  const choice = useRef(null);
  const timer = useRef(null);
  const highest = useRef(0);
  const [leaving, setLeaving] = useState(false);
  highest.current = Math.max(
    highest.current,
    ready ? 100 : Math.min(96, total ? progress : 0),
  );
  useEffect(() => {
    dialog.current.showModal();
    return () => clearTimeout(timer.current);
  }, []);
  const finish = () => {
    if (choice.current === null) return;
    clearTimeout(timer.current);
    onEnter();
  };
  const enter = (withAudio) => {
    if (choice.current !== null) return;
    choice.current = withAudio;
    // AudioContext.resume must run inside this gesture, not after the exit.
    onChooseAudio(withAudio);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(finish, 620);
  };
  return (
    <dialog
      ref={dialog}
      className="world-loader"
      data-leaving={leaving}
      data-quiet
      aria-label="Welcome to Sri’s world"
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
      <div className="entrance-folio" aria-hidden="true">
        <span>SRI / A PERSONAL WORLD</span>
        <span>SAN FRANCISCO, CA</span>
      </div>
      <div className="world-loader-inner">
        <div className="entrance-map" aria-hidden="true">
          <svg viewBox="0 0 600 260" fill="none">
            <path
              className="entrance-route"
              pathLength="1"
              d="M50 180C110 25 210 15 300 130S505 245 550 80"
            />
            <ellipse
              className="entrance-orbit"
              cx="300"
              cy="130"
              rx="190"
              ry="95"
            />
            {[
              [50, 180],
              [158, 62],
              [300, 130],
              [433, 198],
              [550, 80],
            ].map(([cx, cy], i) => (
              <circle key={cx} cx={cx} cy={cy} r="3" style={{ "--mark": i }} />
            ))}
          </svg>
        </div>
        <div className="entrance-signature" aria-hidden="true">
          <PersonalSignature />
        </div>
        <p className="entrance-eyebrow">SRI UJJWAL REDDY</p>
        <h2>
          A little world,
          <br />
          <span>coming together.</span>
        </h2>
        <p className="entrance-description">
          AI engineering. Things I make. Life in between.
        </p>
        <div className="entrance-actions">
          <button
            className="entrance-audio"
            autoFocus
            onClick={() => enter(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4zM17 8c2 2 2 6 0 8M20 5c4 4 4 10 0 14" />
            </svg>
            Enter with audio <span aria-hidden="true">↗</span>
          </button>
          <button className="entrance-quiet" onClick={() => enter(false)}>
            Enter quietly
          </button>
        </div>
        <div className="entrance-readiness" aria-live="polite">
          <span>
            {ready
              ? "Ready when you are."
              : `Preparing the world · ${Math.round(highest.current)}%`}
          </span>
          {!ready && (
            <span className="world-loader-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${highest.current / 100})` }} />
            </span>
          )}
        </div>
        <a className="entrance-story" href="/story">
          Prefer a page? Read the story <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="entrance-places" aria-hidden="true">
        <span>01 Home</span>
        <span>02 Made</span>
        <span>03 After hours</span>
        <span>04 Out there</span>
        <span>05 Fieldnotes</span>
      </div>
    </dialog>
  );
}
