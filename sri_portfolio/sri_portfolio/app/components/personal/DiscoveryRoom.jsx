"use client";
import { useEffect, useRef, useState } from "react";
import {
  discoveries,
  foundDiscoveries,
  discover,
  terminalReply,
} from "../../lib/discoveries.mjs";
export default function DiscoveryRoom() {
  const [found, setFound] = useState([]),
    [command, setCommand] = useState(""),
    [lines, setLines] = useState([
      { text: "A small console. A few hidden corners. Type help to begin." },
    ]);
  const output = useRef();
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
    output.current?.scrollTo(0, output.current.scrollHeight);
  }, [lines]);
  function submit(e) {
    e.preventDefault();
    if (!command.trim()) return;
    const reply = terminalReply(command);
    if (reply.discovery) discover(reply.discovery);
    setLines((previous) =>
      reply.clear ? [] : [...previous.slice(-39), { command, ...reply }],
    );
    setCommand("");
  }
  return (
    <div className="discovery-room">
      <p className="eyebrow">FOR THE CURIOUS</p>
      <h2>
        Little things,
        <br />
        left to find.
      </h2>
      <p className="app-lead">
        There are a few Easter eggs tucked into this world. No score to chase.
        Just a reason to look a little closer.
      </p>
      <div className="little-terminal">
        <div className="terminal-title">
          <span aria-hidden="true">● ● ●</span>
          <span>sri / a little console</span>
        </div>
        <div
          className="terminal-output"
          ref={output}
          role="log"
          aria-label="Console output"
          aria-live="polite"
        >
          {lines.map((line, i) => (
            <div key={i}>
              {line.command && (
                <p className="terminal-command">❯ {line.command}</p>
              )}
              <p>{line.text}</p>
              {line.link && <a href={line.link}>{line.label}</a>}
            </div>
          ))}
        </div>
        <form onSubmit={submit}>
          <span aria-hidden="true">❯</span>
          <label className="visually-hidden" htmlFor="little-command">
            Console command
          </label>
          <input
            id="little-command"
            value={command}
            maxLength={100}
            autoComplete="off"
            spellCheck="false"
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Try help"
          />
          <button type="submit" aria-label="Run console command">
            ↵
          </button>
        </form>
      </div>
      <div className="discovery-heading">
        <h3>Your discoveries</h3>
        <span>
          {found.length} / {discoveries.length}
        </span>
      </div>
      <div className="discovery-list">
        {discoveries.map((item, i) => {
          const done = found.includes(item.id);
          return (
            <article key={item.id} data-found={done}>
              <span aria-hidden="true">
                {done ? "✦" : String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4>{done ? item.title : "A little mystery"}</h4>
                <p>{done ? item.note : item.hint}</p>
              </div>
              {done && <small>Found</small>}
            </article>
          );
        })}
      </div>
      <p className="discovery-footnote">
        Your collection stays on this device. Anonymous discoveries also leave a
        little note for me.
      </p>
    </div>
  );
}
