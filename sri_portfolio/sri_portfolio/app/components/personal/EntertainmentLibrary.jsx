"use client";
import { useEffect, useState } from "react";
import MusicCard from "./MusicCard";
import RemoteVideo from "./RemoteVideo";
import { showClips } from "../../json/show-clips.mjs";
import { showArtwork } from "../../json/official-artwork.mjs";
import { shows } from "../../json/personal";
export default function EntertainmentLibrary({
  initialSection = "music",
  channel: sharedChannel,
  onChannelChange,
  expanded = false,
  onSoundRoomChange,
}) {
  const [localChannel, setLocalChannel] = useState(0);
  const [section, setSection] = useState(
    initialSection === "shows" ? "shows" : "music",
  );
  const channel = sharedChannel ?? localChannel;
  const setChannel = onChannelChange || setLocalChannel;
  useEffect(() => {
    onSoundRoomChange?.(section);
  }, [section, onSoundRoomChange]);
  return (
    <div className="entertainment-library" data-room={section}>
      <header className="listening-intro">
        <div>
          <p className="eyebrow">AFTER HOURS · A LITTLE COMPANY</p>
          <h2>
            Leave something
            <br />
            <em>good on.</em>
          </h2>
        </div>
        <p className="app-lead">
          A song while I build. A familiar episode while I unwind. Some things
          are better on repeat.
        </p>
      </header>
      {!expanded && (
        <div
          className="entertainment-sections"
          role="group"
          aria-label="Explore music and shows"
        >
          <button
            aria-pressed={section === "music"}
            onClick={() => setSection("music")}
          >
            <small>SIDE A</small> Music
          </button>
          <button
            aria-pressed={section === "shows"}
            onClick={() => setSection("shows")}
          >
            <small>SIDE B</small> Comfort shows
          </button>
        </div>
      )}
      {(expanded || section === "music") && (
        <section className="listening-shelf">
          <div className="shelf-heading">
            <span className="shelf-dot" />
            <h3>The listening room</h3>
          </div>
          <MusicCard />
          <div className="music-tastes">
            <article>
              <span>01 / LATELY</span>
              <h4>Fred again..</h4>
              <p>A lot of repeat listens lately.</p>
            </article>
            <article>
              <span>02 / ALWAYS ROOM FOR</span>
              <h4>Tollywood</h4>
              <p>Always part of the mix.</p>
            </article>
          </div>
          <a
            className="app-list-link spotify-link"
            href="https://open.spotify.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/official/spotify-white.webp"
              width="110"
              height="30"
              alt="Spotify"
            />{" "}
            <span>Open Spotify ↗</span>
          </a>
        </section>
      )}
      {(expanded || section === "shows") && (
        <section className="cinema-shelf">
          <div className="shelf-heading">
            <span className="shelf-dot" />
            <h3>The comfort cinema</h3>
          </div>
          <div className={`comfort-screen screen-${channel}`}>
            <img
              className="comfort-cover"
              src={showArtwork[channel].src}
              alt={`${shows[channel]} official artwork`}
            />
            <div>
              <span className="eyebrow">IN MY ROTATION</span>
              <h4 aria-live="polite">{shows[channel]}</h4>
              <p>Yes, I’ve seen this one. That’s the point.</p>
              <a
                className="official-show-link"
                href={showArtwork[channel].url}
                target="_blank"
                rel="noreferrer"
              >
                Explore the show ↗
              </a>
              <button onClick={() => setChannel((channel + 1) % shows.length)}>
                Next in the rotation <span>→</span>
              </button>
            </div>
          </div>
          <RemoteVideo key={channel} {...showClips[channel]} />
          <div
            className="show-rotation"
            role="group"
            aria-label="Choose a comfort show"
          >
            {shows.map((show, i) => (
              <button
                key={show}
                aria-pressed={channel === i}
                onClick={() => setChannel(i)}
              >
                <span className={`show-art screen-${i}`}>
                  <img src={showArtwork[i].src} alt="" loading="lazy" />
                  <strong>{show}</strong>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
