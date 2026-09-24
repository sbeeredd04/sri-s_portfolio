"use client";
import { useEffect, useId, useRef, useState } from "react";
import { claimMedia, releaseMedia } from "../../lib/media-focus.mjs";
export default function MusicCard() {
  const id = useId();
  const audio = useRef(null),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(false),
    [duration, setDuration] = useState(0),
    [position, setPosition] = useState(0);
  const pendingDrop = useRef(null);
  const progress = duration ? Math.min(1, position / duration) : 0;
  const timestamp = (seconds) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  useEffect(() => {
    if (!playing) return;
    claimMedia(id);
    return () => releaseMedia(id);
  }, [playing, id]);
  useEffect(() => {
    const yieldToPlayer = (event) => {
      if (event.detail !== id) audio.current?.pause();
    };
    window.addEventListener("sri:media-owner", yieldToPlayer);
    return () => window.removeEventListener("sri:media-owner", yieldToPlayer);
  }, [id]);
  useEffect(() => {
    const element = audio.current;
    const pauseWhenHidden = () => {
      if (document.hidden) element?.pause();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      element?.pause();
    };
  }, []);
  // Outer groove is the start, the label edge is the end.
  async function dropNeedle(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const radius = Math.hypot(dx, dy) / (box.width / 2);
    if (radius > 1 || radius < 0.38) return;
    const fraction = Math.min(1, Math.max(0, (1 - radius) / 0.62));
    const element = audio.current;
    if (!element) return;
    if (duration) {
      element.currentTime = fraction * duration;
      setPosition(fraction * duration);
    } else pendingDrop.current = fraction;
    if (element.paused) {
      try {
        await element.play();
        setError(false);
      } catch {
        setError(true);
      }
    }
  }
  async function toggle() {
    if (!audio.current) return;
    if (playing) {
      audio.current.pause();
      return;
    }
    try {
      await audio.current.play();
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <article className="music-card" data-playing={playing}>
      <figure className="music-alcove">
        <div
          className="turntable"
          style={{ "--progress": progress }}
          data-cued={playing || position > 0 || undefined}
        >
          <span className="turntable-plaque" aria-hidden="true">
            Sri · original recording
          </span>
          <div
            className={`record ${playing ? "record-playing" : ""}`}
            onPointerDown={dropNeedle}
            aria-hidden="true"
          >
            <div>
              <span>sri.</span>
              <small>v4</small>
            </div>
          </div>
          <div className="tonearm" aria-hidden="true" />
          <span className="turntable-light" aria-hidden="true" />
          <span className="turntable-speed" aria-hidden="true">
            33⅓
          </span>
        </div>
        <figcaption>Drop the needle anywhere on the record.</figcaption>
      </figure>
      <div className="music-copy">
        <p className="eyebrow">LINER NOTES · THE ONE I MADE</p>
        <h3>
          v4 <em>by Sri.</em>
        </h3>
        <p>
          I tried music production, and this is something I made. Lately, I’ve
          been listening to a lot of Fred again.., with Tollywood always in the
          mix.
        </p>
        <div className="music-controls">
          <button
            aria-label={playing ? "Pause v4 by Sri" : "Play v4 by Sri"}
            aria-pressed={playing}
            onClick={toggle}
          >
            <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{" "}
            {playing ? "Pause" : "Play my track"}
          </button>
        </div>
        <div className="record-progress">
          <label htmlFor={`${id}-seek`}>Track position</label>
          <input
            id={`${id}-seek`}
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={position}
            disabled={!duration}
            aria-valuetext={`${timestamp(position)} of ${timestamp(duration)}`}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audio.current && duration) audio.current.currentTime = next;
              setPosition(next);
            }}
          />
          <div>
            <span>{timestamp(position)}</span>
            <span>
              {duration ? timestamp(duration) : "Press play to listen"}
            </span>
          </div>
        </div>
        {error && (
          <p role="status">
            The track couldn’t play.{" "}
            <a href="/music/v4.mp3">Open the audio file</a>.
          </p>
        )}
        <audio
          ref={audio}
          src="/music/v4.mp3"
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={() => {
            const length = Number.isFinite(audio.current.duration)
              ? audio.current.duration
              : 0;
            setDuration(length);
            if (length && pendingDrop.current !== null) {
              audio.current.currentTime = pendingDrop.current * length;
              pendingDrop.current = null;
            }
          }}
          onTimeUpdate={() => setPosition(audio.current.currentTime)}
        />
      </div>
    </article>
  );
}
