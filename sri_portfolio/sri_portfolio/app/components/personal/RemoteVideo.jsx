"use client";
import { useEffect, useId, useRef, useState } from "react";
import { claimMedia, releaseMedia } from "../../lib/media-focus.mjs";

export default function RemoteVideo({
  video,
  title,
  label = "Watch the clip",
  source,
}) {
  const id = useId();
  const launch = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    claimMedia(id);
    const hidden = () => {
      if (document.hidden) setLoaded(false);
    };
    const yieldToPlayer = (event) => {
      if (event.detail !== id) setLoaded(false);
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("sri:media-owner", yieldToPlayer);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("sri:media-owner", yieldToPlayer);
      releaseMedia(id);
    };
  }, [loaded, id]);
  return (
    <div className="remote-video" data-quiet>
      {loaded ? (
        <>
          <div className="demo-player">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video}?rel=0&playsinline=1&autoplay=1`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <button
            className="demo-stop"
            onClick={() => {
              setLoaded(false);
              requestAnimationFrame(() => launch.current?.focus());
            }}
          >
            Close video
          </button>
        </>
      ) : (
        <button
          ref={launch}
          className="demo-play"
          onClick={() => setLoaded(true)}
        >
          <span aria-hidden="true">▶</span> {label}
        </button>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${video}`}
        target="_blank"
        rel="noreferrer"
      >
        {source ? `${source} · Watch on YouTube` : "Open on YouTube"} ↗
      </a>
      <p className="video-footnote">
        {loaded
          ? "Not playing here? Open the original above."
          : "Loads YouTube when you choose to watch."}
      </p>
    </div>
  );
}
