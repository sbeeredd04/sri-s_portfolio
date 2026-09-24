"use client";
import { useId, useRef, useState } from "react";
import FieldnoteDoodle from "./FieldnoteDoodle";
import {
  fieldnoteShelves,
  publishedFieldnotes,
} from "../../lib/fieldnotes.mjs";

export default function WritingRoom() {
  const [active, setActive] = useState(0);
  const covers = useRef([]),
    pointer = useRef(null),
    swiped = useRef(false);
  const id = useId(),
    current = fieldnoteShelves[active];
  const [opening, setOpening] = useState(false);
  // A note opens like a page turning; reduced motion and new-tab clicks go straight there.
  function openNote(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    event.preventDefault();
    const href = event.currentTarget.href;
    setOpening(true);
    setTimeout(() => window.location.assign(href), 520);
  }
  function select(index, focus = false) {
    const next = (index + fieldnoteShelves.length) % fieldnoteShelves.length;
    setActive(next);
    if (focus) covers.current[next]?.focus({ preventScroll: true });
  }
  function navigate(event) {
    const index = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: fieldnoteShelves.length - 1,
    }[event.key];
    if (index !== undefined) {
      event.preventDefault();
      select(index, true);
    }
  }
  return (
    <div className="writing-room fn-index">
      <header className="fn-index-heading">
        <div className="fn-folio">
          <span>FIELDNOTES · BY SRI</span>
          <span>
            {String(fieldnoteShelves.length).padStart(2, "0")} NOTEBOOKS
          </span>
        </div>
        <div className="fn-intro-grid">
          <h2>
            Notes from
            <br />
            <em>the in-between.</em>
          </h2>
          <p>
            Things I build. Details I notice.
            <br />A few thoughts from away from the desk.
          </p>
        </div>
      </header>
      <section
        className="fn-notebooks"
        aria-label="Explore the notebooks"
        aria-roledescription="carousel"
      >
        <div
          className="fn-ribbon"
          onKeyDown={navigate}
          onPointerDown={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY };
            swiped.current = false;
          }}
          onPointerUp={(event) => {
            const start = pointer.current;
            pointer.current = null;
            if (!start) return;
            const x = event.clientX - start.x,
              y = event.clientY - start.y;
            if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.5) {
              swiped.current = true;
              select(active + (x < 0 ? 1 : -1));
            }
          }}
          onPointerCancel={() => {
            pointer.current = null;
          }}
        >
          {fieldnoteShelves.map((shelf, index) => {
            let offset =
              (index - active + fieldnoteShelves.length) %
              fieldnoteShelves.length;
            if (offset > fieldnoteShelves.length / 2)
              offset -= fieldnoteShelves.length;
            return (
              <button
                className="fn-notebook"
                data-active={active === index}
                style={{
                  "--fn-offset": offset,
                  "--fn-notebook-accent": shelf.accent,
                }}
                key={shelf.id}
                ref={(element) => {
                  covers.current[index] = element;
                }}
                tabIndex={active === index ? 0 : -1}
                aria-label={`Select ${shelf.title} notebook`}
                aria-pressed={active === index}
                aria-describedby={`${id}-description`}
                onClick={() => {
                  if (swiped.current) {
                    swiped.current = false;
                    return;
                  }
                  select(index);
                }}
              >
                <span className="fn-cover-top">
                  <span>{shelf.eyebrow}</span>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                </span>
                <FieldnoteDoodle kind={shelf.art} />
                <span className="fn-cover-bottom">
                  <strong>{shelf.title}</strong>
                  <small>Opening soon</small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="fn-gallery-footer">
          <div
            className="fn-gallery-caption"
            id={`${id}-description`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span>{current.eyebrow}</span>
            <p>{current.description}</p>
          </div>
          <div className="fn-gallery-nav">
            <button
              aria-label="Previous notebook"
              onClick={() => select(active - 1)}
            >
              ←
            </button>
            <span
              aria-label={`Notebook ${active + 1} of ${fieldnoteShelves.length}`}
            >
              {String(active + 1).padStart(2, "0")} <i>/</i>{" "}
              {String(fieldnoteShelves.length).padStart(2, "0")}
            </span>
            <button
              aria-label="Next notebook"
              onClick={() => select(active + 1)}
            >
              →
            </button>
          </div>
        </div>
      </section>
      <section className="fn-published" aria-labelledby={`${id}-published`}>
        <h3 id={`${id}-published`} className="fn-published-title">
          {publishedFieldnotes.length ? "Published notes" : "The first page"}
        </h3>
        {publishedFieldnotes.length ? (
          <ol>
            {publishedFieldnotes.map((note) => (
              <li key={note.slug}>
                <a href={`/fieldnotes/${note.slug}`} onClick={openNote}>
                  <span>{note.category}</span>
                  <strong>{note.title}</strong>
                  <p>{note.summary}</p>
                  <small>{note.publishedAt}</small>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <a className="fn-first" href="/fieldnotes/preview" onClick={openNote}>
            <span className="fn-first-sketch" aria-hidden="true">
              <FieldnoteDoodle kind="notice" />
            </span>
            <span className="fn-first-copy">
              <strong>The first note is still taking shape.</strong>
              <span>
                Until then, here’s how one will read. Images, sketches,
                evidence, and a little less text.
              </span>
              <em>
                See the reading format <span aria-hidden="true">→</span>
              </em>
            </span>
          </a>
        )}
      </section>
      <footer className="fn-index-footer">
        <span>Thoughts can start as conversations, too.</span>
        <a
          href="https://linkedin.com/in/sriujjwal"
          target="_blank"
          rel="noreferrer"
        >
          Find me on LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </footer>
      {opening && <div className="fn-page-turn" aria-hidden="true" />}
    </div>
  );
}
