"use client";
import { useEffect, useRef, useState } from "react";
import { completions, runCommand } from "../../lib/commands.mjs";
import {
  discover,
  discoveries,
  foundDiscoveries,
} from "../../lib/discoveries.mjs";
import { dispatchCommandAction } from "./command-events";

const promptPath = {
  planet: "~",
  studio: "~/home",
  projects: "~/made",
  entertainment: "~/after-hours",
  court: "~/after-hours",
  trail: "~/out-there",
  future: "~/fieldnotes",
};
const typing = (target) =>
  target?.closest?.("input, textarea, select, [contenteditable='true']");

// The dock's command line: "/" opens it anywhere, Enter runs, Tab
// completes, arrows walk the history, Escape closes.
export default function CommandBar({ biome }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [reply, setReply] = useState(null);
  const [found, setFound] = useState([]);
  const history = useRef({ items: [], at: -1 });
  const input = useRef(null);
  const button = useRef(null);
  const closing = useRef(null);

  useEffect(() => {
    const sync = () => setFound(foundDiscoveries());
    sync();
    window.addEventListener("sri:discovery", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sri:discovery", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (typing(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
    return () => clearTimeout(closing.current);
  }, [open]);

  function close({ restoreFocus = true } = {}) {
    setOpen(false);
    setValue("");
    if (restoreFocus) button.current?.focus();
  }
  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    history.current = {
      items: [text, ...history.current.items].slice(0, 20),
      at: -1,
    };
    const result = runCommand(text, {
      found: foundDiscoveries(),
      total: discoveries.length,
    });
    if (result.discovery) discover(result.discovery);
    setValue("");
    if (result.clear) return setReply(null);
    setReply({ command: text, ...result });
    if (result.action) {
      dispatchCommandAction(result.action);
      closing.current = setTimeout(() => close({ restoreFocus: false }), 900);
    }
  }
  function onKeyDown(event) {
    const h = history.current;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab" && suggestions[0]) {
      event.preventDefault();
      setValue(suggestions[0] + " ");
    } else if (event.key === "ArrowUp" && h.items.length) {
      event.preventDefault();
      h.at = Math.min(h.items.length - 1, h.at + 1);
      setValue(h.items[h.at]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      h.at = Math.max(-1, h.at - 1);
      setValue(h.at < 0 ? "" : h.items[h.at]);
    }
  }
  const suggestions = open ? completions(value) : [];
  const path = promptPath[biome] || "~";

  return (
    <div className="command-bar">
      <button
        ref={button}
        type="button"
        className={`command-toggle ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls="command-panel"
        aria-keyshortcuts="/"
        aria-label="Open the command line (press /)"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span aria-hidden="true" className="command-glyph">
          &gt;_
        </span>
        <span>
          {found.length}/{discoveries.length}
        </span>
      </button>
      {open && (
        <div
          id="command-panel"
          className="command-panel"
          role="dialog"
          aria-label="Command line"
        >
          {reply && (
            <div className="command-output" role="status" aria-live="polite">
              <p className="command-echo">
                <span>{path} $</span> {reply.command}
              </p>
              {reply.text && <pre>{reply.text}</pre>}
              {reply.link && (
                <a href={reply.link} target="_blank" rel="noreferrer">
                  {reply.label}
                </a>
              )}
            </div>
          )}
          <form
            className="command-line"
            onSubmit={(event) => {
              event.preventDefault();
              run(value);
            }}
          >
            <label htmlFor="command-input">
              <span className="command-user">sri@world</span>
              <span className="command-path">{path}</span>
              <span aria-hidden="true">$</span>
              <span className="visually-hidden">Command</span>
            </label>
            <input
              id="command-input"
              ref={input}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="try help, cd made, go keynote"
            />
          </form>
          {suggestions.length > 0 && (
            <ul className="command-suggestions" aria-label="Suggestions">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => run(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
