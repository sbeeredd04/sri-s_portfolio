"use client";
import { useId } from "react";
import { biomeRooms, roomPageHref } from "../../lib/reading-rooms.mjs";
import { readingSections } from "../../lib/world-story.mjs";
import UiIcon from "./UiIcon";
import RoomPreview from "./RoomPreview";

export default function BiomePages({
  biome,
  onOpen,
  expanded,
  onExpandedChange,
}) {
  const listId = useId();
  const ids = biomeRooms[biome];
  if (!ids) return null;
  return (
    <aside className="biome-pages" aria-label="Pages in this place">
      <button
        className="biome-pages-toggle"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="biome-pages-toggle-label">
          {expanded ? "Hide previews" : "Show previews"}
        </span>
        <span className="biome-pages-count">
          {ids.length} {ids.length === 1 ? "page" : "pages"}
        </span>
        <svg
          className="biome-pages-toggle-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M3 8h10" />
          {!expanded && <path d="M8 3v10" />}
        </svg>
      </button>
      <div
        className="biome-pages-reveal"
        data-expanded={expanded}
        inert={!expanded}
        id={listId}
      >
        <div className="biome-pages-list">
          {ids.map((id) => {
            const room = readingSections.find((r) => r.id === id);
            return (
              <article className="biome-page" key={id}>
                <button
                  className="biome-page-preview"
                  onClick={() => onOpen(id)}
                  aria-label={`Read ${room.name}`}
                >
                  <RoomPreview id={id} />
                </button>
                <div className="biome-page-actions">
                  <button onClick={() => onOpen(id)}>
                    {room.name} <UiIcon />
                  </button>
                  <a
                    href={roomPageHref(id)}
                    aria-label={`Open ${room.name} as a full page`}
                  >
                    <span>Open page</span>
                    <UiIcon className="biome-page-link-icon" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
