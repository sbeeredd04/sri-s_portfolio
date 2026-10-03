"use client";
import { useEffect, useRef, useState } from "react";
import { searchSpotlight } from "../../lib/spotlight.mjs";
import { roomPageHref } from "../../lib/reading-rooms.mjs";
import { dispatchCommandAction } from "./command-events";
import RoomPreview from "./RoomPreview";

const typing = (target) =>
  target?.closest?.("input, textarea, select, [contenteditable='true']");

export default function CommandBar({ biome, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const dialog = useRef(null),
    input = useRef(null),
    trigger = useRef(null);
  const results = searchSpotlight(query, biome);
  const choice = results[Math.min(selected, results.length - 1)];

  useEffect(() => {
    const key = (event) => {
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" &&
          !event.metaKey &&
          !event.ctrlKey &&
          !typing(event.target));
      if (
        !shortcut ||
        event.altKey ||
        (document.querySelector("dialog[open]") && !dialog.current?.open)
      )
        return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    onOpenChange?.(open);
    if (open) {
      dialog.current.showModal();
      input.current?.focus();
    } else if (dialog.current?.open) {
      dialog.current.close();
      trigger.current?.focus({ preventScroll: true });
    }
  }, [open, onOpenChange]);
  useEffect(() => {
    dialog.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selected, query]);
  function close() {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }
  function activate(entry) {
    if (!entry) return;
    // Close the native modal before opening another so focus never gets trapped.
    dialog.current.close();
    trigger.current?.focus({ preventScroll: true });
    close();
    if (entry.href) window.location.assign(entry.href);
    else dispatchCommandAction(entry.action);
  }
  return (
    <div className="command-bar">
      <button
        ref={trigger}
        className="command-toggle"
        type="button"
        aria-label="Search pages and places"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K /"
        onClick={() => setOpen(true)}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Search</span>
      </button>
      <dialog
        ref={dialog}
        className="spotlight"
        aria-label="Search pages and places"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target !== dialog.current) return;
          const rect = dialog.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            close();
        }}
      >
        <div className="spotlight-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={input}
            role="combobox"
            aria-label="Search pages, places and views"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="spotlight-results"
            aria-activedescendant={choice?.id}
            placeholder="Search pages, places, anything…"
            value={query}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (["ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                setSelected((i) =>
                  results.length
                    ? (i + (e.key === "ArrowDown" ? 1 : -1) + results.length) %
                      results.length
                    : 0,
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                activate(choice);
              }
            }}
          />
          <button type="button" onClick={close} aria-label="Close search">
            Esc
          </button>
        </div>
        <div className="spotlight-body">
          <div className="spotlight-list">
            <p>{query ? "Search results" : "Pages & places"}</p>
            <div
              id="spotlight-results"
              role="listbox"
              aria-label="Search results"
            >
              {results.map((entry, i) => (
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  id={entry.id}
                  key={entry.id}
                  aria-selected={choice?.id === entry.id}
                  onPointerMove={() => setSelected(i)}
                  onClick={() => activate(entry)}
                >
                  <span className="spotlight-result-icon" aria-hidden="true">
                    {entry.kind === "Page" ? "▤" : "↗"}
                  </span>
                  <span>
                    {entry.label}
                    <small>{entry.kind}</small>
                  </span>
                  <span aria-hidden="true">↵</span>
                </button>
              ))}
            </div>
            {!results.length && (
              <p className="spotlight-empty" role="status">
                No matches. Try “work”, “music” or “hello”.
              </p>
            )}
          </div>
          {choice && (
            <div className="spotlight-preview">
              {choice.room ? (
                <RoomPreview id={choice.room} />
              ) : (
                <div className="spotlight-place-mark" aria-hidden="true">
                  {choice.kind === "Place" ? "◎" : "↗"}
                </div>
              )}
              <p className="spotlight-kind">{choice.kind}</p>
              <h2>{choice.label}</h2>
              <p>{choice.description}</p>
              <div className="spotlight-actions">
                <button type="button" onClick={() => activate(choice)}>
                  {choice.room
                    ? "Read here"
                    : choice.kind === "Page"
                      ? "Open page"
                      : "Go there"}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
                {choice.room && (
                  <a href={roomPageHref(choice.room)}>Open full page ↗</a>
                )}
              </div>
            </div>
          )}
        </div>
        <footer>
          <span>↑ ↓ to browse · Enter to open</span>
          <a href="/story">Read the whole story ↗</a>
        </footer>
      </dialog>
    </div>
  );
}
