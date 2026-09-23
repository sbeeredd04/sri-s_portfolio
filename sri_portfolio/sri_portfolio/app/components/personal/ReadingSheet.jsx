"use client";
import { useEffect, useRef, useState } from "react";
import AppContent from "./AppContent";
import RoomSoundControls from "./RoomSoundControls";
import RoomPageLink from "./RoomPageLink";
import { continuations } from "../../lib/reading-rooms.mjs";
import { chapters, readingSections } from "../../lib/world-story.mjs";

export default function ReadingSheet({
  id,
  collection = "all",
  onClose,
  onOpen,
  onTravel,
  channel,
  onChannelChange,
  audio,
  onSoundRoomChange,
}) {
  const dialog = useRef(null);
  const [projectLocation, setProjectLocation] = useState({
    collection,
    hash: null,
  });
  useEffect(() => {
    setProjectLocation({ collection, hash: null });
  }, [id, collection]);
  const name =
    id === "index"
      ? "Find your way"
      : readingSections.find((s) => s.id === id)?.name;
  useEffect(() => {
    const prior = document.activeElement;
    dialog.current.showModal();
    return () => {
      if (prior?.isConnected) prior.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const content = dialog.current?.querySelector(".window-content");
    content?.scrollTo(0, 0);
    content?.focus({ preventScroll: true });
  }, [id]);
  return (
    <dialog
      ref={dialog}
      data-section={id}
      className={`app-window reading-sheet ${id === "index" ? "index-sheet" : ""}`}
      aria-label={name}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="sheet-bar">
        <span>{name}</span>
        <div>
          {id !== "index" && (
            <RoomPageLink
              id={id}
              collection={
                id === "work" ? projectLocation.collection : collection
              }
              projectHash={id === "work" ? projectLocation.hash : null}
            />
          )}
          {id !== "index" && (
            <button onClick={() => onOpen("index")}>Index</button>
          )}
          <button
            className="sheet-close"
            aria-label={`Close ${name}`}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      <div className="window-content" tabIndex={-1} key={id}>
        {audio && <RoomSoundControls audio={audio} />}
        {id === "index" ? (
          <>
            <p className="eyebrow">A FEW WAYS INTO MY WORLD</p>
            <h2>Follow your curiosity.</h2>
            <p className="app-lead">
              A quick look at my work, or a little time to explore. Make
              yourself at home.
            </p>
            <a className="app-action" href="/resume">
              Read my résumé ↗
            </a>
            <div className="reading-index">
              {readingSections.map((s, i) => (
                <button key={s.id} onClick={() => onOpen(s.id)}>
                  <span className="index-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.caption}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <a className="app-list-link" href="/rooms">
              Browse the standalone pages ↗
            </a>
            <h3>Go somewhere</h3>
            <div className="index-places">
              {chapters.map((c) => (
                <button key={c.id} onClick={() => onTravel(c.id)}>
                  <span>{c.label}</span>
                  <small>{c.upcoming ? "Not open yet" : c.number}</small>
                </button>
              ))}
            </div>
            <a className="app-list-link" href="/story">
              Read the whole story on one page ↗
            </a>
          </>
        ) : (
          <>
            <AppContent
              id={id}
              collection={collection}
              channel={channel}
              onChannelChange={onChannelChange}
              onSoundRoomChange={onSoundRoomChange}
              onProjectLocationChange={setProjectLocation}
            />
            {continuations[id] && (
              <footer className="detail-continuation">
                <span className="eyebrow">FOLLOW THE THREAD</span>
                <p>{continuations[id].note}</p>
                <button onClick={() => onOpen(continuations[id].id)}>
                  {continuations[id].label}
                  <span aria-hidden="true">→</span>
                </button>
              </footer>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
