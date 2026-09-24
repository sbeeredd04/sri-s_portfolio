"use client";
import { useEffect, useRef } from "react";
import SoundPreferences from "./SoundPreferences";
export default function RoomSoundControls({ audio }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e.type === "keydown" ? e.key === "Escape" : !el.contains(e.target)) {
        el.open = false;
        if (e.type === "keydown") el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  const state = !audio.enabled
    ? "Sound off"
    : audio.foreground
      ? "Paused"
      : "Sound on";
  return (
    <details
      ref={ref}
      className="room-sound-controls"
      data-on={audio.enabled || undefined}
    >
      <summary
        aria-label={`${state}. Sound and levels for ${audio.place.label}`}
      >
        <span className="sound-glyph" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{state}</span>
      </summary>
      <div className="room-sound-panel">
        <SoundPreferences audio={audio} scope="room" />
      </div>
    </details>
  );
}
