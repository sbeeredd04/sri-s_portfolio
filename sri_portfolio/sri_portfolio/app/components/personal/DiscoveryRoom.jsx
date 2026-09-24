"use client";
import { useEffect, useRef, useState } from "react";
import {
  discoveries,
  foundDiscoveries,
  discover,
  terminalReply,
} from "../../lib/discoveries.mjs";

const SUGGESTIONS = ["help", "whoami", "now", "ls"];

// A silhouette for each compartment of the cabinet.
const CURIOS = {
  "hello-world": (
    <path d="M22 44c-6-6-9-14-9-20 0-3 3-4 5-2l5 6V12c0-3 5-3 5 0v12-15c0-3 5-3 5 0v15-12c0-3 5-3 5 0v14-8c0-3 5-3 5 0v16c0 9-5 16-13 16-4 0-6-2-8-6Z" />
  ),
  "three-screens": (
    <path d="M4 14h16v12H4zM24 10h16v16H24zM44 14h16v12H44zM30 30h4v6h-8m8 0h4M10 26v4m44-4v4" />
  ),
  curiosity: (
    <path d="M32 32m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M32 32m-12 0a12 7 0 1 0 24 0a12 7 0 1 0-24 0M32 32m-22 0a22 12 0 1 0 44 0a22 12 0 1 0-44 0" />
  ),
  "nine-nine": (
    <path d="M32 6l22 8v14c0 14-10 24-22 30C20 52 10 42 10 28V14Zm0 12l3 7h8l-6 5 2 8-7-5-7 5 2-8-6-5h8Z" />
  ),
  "one-more-thing": (
    <path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7M32 26a6 6 0 1 1 0 12a6 6 0 1 1 0-12" />
  ),
};

export default function DiscoveryRoom() {
  const [found, setFound] = useState([]),
    [fresh, setFresh] = useState(null),
    [command, setCommand] = useState(""),
    [lines, setLines] = useState([
      {
        text: "A small console. A few hidden corners.\nType a command, or pick one below.",
      },
    ]);
  const output = useRef();
  const typing = useRef({ started: false, timer: null });
  useEffect(() => {
    const sync = (event) => {
      setFound(foundDiscoveries());
      if (event?.detail) setFresh(event.detail);
    };
    sync();
    window.addEventListener("sri:discovery", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sri:discovery", sync);
      window.removeEventListener("storage", sync);
      clearInterval(typing.current.timer);
    };
  }, []);
  useEffect(() => {
    output.current?.scrollTo(0, output.current.scrollHeight);
  }, [lines]);
  function run(value) {
    if (!value.trim()) return;
    const reply = terminalReply(value);
    if (reply.discovery) discover(reply.discovery);
    setLines((previous) =>
      reply.clear ? [] : [...previous.slice(-39), { command: value, ...reply }],
    );
    setCommand("");
  }
  // First focus types a starting command, the way a prompt would suggest it.
  function suggest() {
    const state = typing.current;
    if (state.started || command) return;
    state.started = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCommand("help");
      return;
    }
    let i = 0;
    state.timer = setInterval(() => {
      i += 1;
      setCommand("help".slice(0, i));
      if (i >= 4) clearInterval(state.timer);
    }, 110);
  }
  return (
    <div className="curio-room">
      <header className="curio-intro">
        <p className="eyebrow">FOR THE CURIOUS</p>
        <h2>
          Little things,
          <br />
          <em>left to find.</em>
        </h2>
        <p className="app-lead">
          There are a few Easter eggs tucked into this world. No score to chase.
          Just a reason to look a little closer.
        </p>
      </header>
      <div className="curio-layout">
        <div className="curio-console">
          <div className="curio-console-title">
            <span aria-hidden="true" />
            <span>sri / a little console</span>
          </div>
          <div
            className="curio-output"
            ref={output}
            role="log"
            aria-label="Console output"
            aria-live="polite"
          >
            {lines.map((line, i) => (
              <div key={i}>
                {line.command && (
                  <p className="curio-command">
                    <span aria-hidden="true">❯ </span>
                    {line.command}
                  </p>
                )}
                {line.text && <p>{line.text}</p>}
                {line.link && <a href={line.link}>{line.label}</a>}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(command);
            }}
          >
            <span aria-hidden="true">❯</span>
            <label className="sr-only" htmlFor="little-command">
              Console command
            </label>
            <input
              id="little-command"
              value={command}
              maxLength={100}
              autoComplete="off"
              spellCheck="false"
              placeholder=" "
              onFocus={suggest}
              onChange={(e) => {
                clearInterval(typing.current.timer);
                setCommand(e.target.value);
              }}
            />
            <span className="curio-cursor" aria-hidden="true" />
            <button type="submit" aria-label="Run console command">
              ↵
            </button>
          </form>
          <div
            className="curio-suggestions"
            role="group"
            aria-label="Try a command"
          >
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => run(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <section className="curio-cabinet" aria-labelledby="curio-heading">
          <div className="curio-cabinet-heading">
            <h3 id="curio-heading">The cabinet</h3>
            <span>
              {found.length} of {discoveries.length} found
            </span>
          </div>
          <ol className="curio-drawers">
            {discoveries.map((item, i) => {
              const done = found.includes(item.id);
              return (
                <li
                  key={item.id}
                  data-found={done}
                  data-fresh={fresh === item.id || undefined}
                >
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    {CURIOS[item.id]}
                  </svg>
                  <small>
                    No. {String(i + 1).padStart(2, "0")}
                    {done ? " · found" : " · hidden"}
                  </small>
                  <h4>{done ? item.title : item.hint}</h4>
                  {done && <p>{item.note}</p>}
                </li>
              );
            })}
          </ol>
          <p className="curio-footnote">
            Your collection stays on this device. Anonymous discoveries also
            leave a little note for me.
          </p>
        </section>
      </div>
    </div>
  );
}
