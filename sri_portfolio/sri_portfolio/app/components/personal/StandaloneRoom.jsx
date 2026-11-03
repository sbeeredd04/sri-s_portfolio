"use client";
import { useEffect, useState } from "react";
import AppContent from "./AppContent";
import RoomSoundControls from "./RoomSoundControls";
import SiteHeader from "./SiteHeader";
import useSoundscape from "./useSoundscape";
import { readingSections } from "../../lib/world-story.mjs";
import {
  continuations,
  roomPageHref,
  roomWorldHref,
  entertainmentSectionHref,
} from "../../lib/reading-rooms.mjs";
import { replaceWorldHistory } from "../../lib/world-return.mjs";
export default function StandaloneRoom({ id, initialCollection = "all" }) {
  const room = readingSections.find((s) => s.id === id);
  const [detail, setDetail] = useState(null),
    [channel, setChannel] = useState(0);
  const [projectLocation, setProjectLocation] = useState({
    collection: initialCollection,
    hash: "",
  });
  const audio = useSoundscape("planet", id, detail);
  useEffect(() => {
    // Wait for the library's actual selection; null must not erase an incoming
    // shows deep link during the first render. No navigation or component key.
    if (id !== "music" || detail === null) return;
    const { pathname, search, hash } = window.location;
    const current = `${pathname}${search}${hash}`;
    const nextHref = entertainmentSectionHref(current, detail);
    if (nextHref !== current) replaceWorldHistory(window.history, nextHref);
  }, [id, detail]);
  const next = continuations[id];
  return (
    <div className="reading-sheet standalone-room" data-section={id}>
      <a className="room-skip" href="#room-content">
        Skip to content
      </a>
      <SiteHeader
        place={room.name}
        worldHref={roomWorldHref(
          id,
          id === "music" ? (detail ?? initialCollection) : projectLocation.collection,
          projectLocation.hash,
        )}
      >
        <RoomSoundControls audio={audio} />
      </SiteHeader>
      <main id="room-content" className="window-content" tabIndex={-1}>
        <h1 className="sr-only">{room.name} — Sri Ujjwal Reddy</h1>
        {
          <AppContent
            id={id}
            collection={initialCollection}
            onProjectLocationChange={setProjectLocation}
            projectPage={roomPageHref("work")}
            channel={channel}
            onChannelChange={setChannel}
            onSoundRoomChange={setDetail}
          />
        }
        {next && (
          <footer className="detail-continuation">
            <span className="eyebrow">FOLLOW THE THREAD</span>
            <p>{next.note}</p>
            <a href={roomPageHref(next.id)}>
              <span className="continuation-label">{next.label}</span>{" "}
              <span aria-hidden="true">→</span>
            </a>
          </footer>
        )}
      </main>
    </div>
  );
}
