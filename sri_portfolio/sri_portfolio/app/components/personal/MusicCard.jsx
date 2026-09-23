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
      <div className="turntable" aria-hidden="true">
        <div className="turntable-plaque">SRI / ORIGINAL RECORDING</div>
        <div className={`record ${playing ? "record-playing" : ""}`}>
          <div>
            <span>sri.</span>
            <small>v4 / ORIGINAL</small>
          </div>
        </div>
        <div className="tonearm" />
        <span className="turntable-light" />
        <span className="turntable-speed">33⅓</span>
      </div>
      <div className="music-copy">
        <p className="eyebrow">THE ONE I MADE</p>
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
          <span>
            v4 <span>·</span> Sri
          </span>
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
          onLoadedMetadata={() =>
            setDuration(
              Number.isFinite(audio.current.duration)
                ? audio.current.duration
                : 0,
            )
          }
          onTimeUpdate={() => setPosition(audio.current.currentTime)}
        />
      </div>
    </article>
  );
}
