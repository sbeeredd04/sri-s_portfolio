"use client";
import { useEffect, useRef, useState } from "react";
import HarnessFigure from "./HarnessFigure";
import { readingMinutes } from "../../lib/reading-time.mjs";
import FieldnoteDoodle from "./FieldnoteDoodle";
import RoomSoundControls from "./RoomSoundControls";
import useSoundscape from "./useSoundscape";
import PersonalSignature from "./PersonalSignature";

function NoteBlock({ block, onCue }) {
  if (block.type === "paragraph")
    return (
      <p>
        {block.text}
        {block.sources?.map((id) => (
          <sup key={id}>
            <a href={`#source-${id}`} aria-label={`Source ${id}`}>
              {id}
            </a>
          </sup>
        ))}
      </p>
    );
  if (block.type === "harness")
    return (
      <figure className="fn-figure">
        <HarnessFigure onCue={onCue} />
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  if (block.type === "callout")
    return (
      <aside className="fn-callout">
        <span aria-hidden="true">✳</span>
        <div>
          <small>{block.label || "A NOTE"}</small>
          <p>{block.text}</p>
        </div>
      </aside>
    );
  if (block.type === "quote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "diagram")
    return (
      <figure className="fn-figure">
        <div className="fn-diagram">
          <FieldnoteDoodle kind={block.kind} />
        </div>
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  if (block.type === "image")
    return (
      <figure className="fn-figure">
        <img
          src={block.src}
          alt={block.alt}
          width={block.width}
          height={block.height}
          loading="lazy"
        />
        <figcaption>
          {block.caption}
          {block.source && (
            <>
              {" "}
              ·{" "}
              <a href={block.source}>
                Source <span aria-hidden="true">↗</span>
              </a>
            </>
          )}
        </figcaption>
      </figure>
    );
  if (block.type === "chart") {
    const maximum = Math.max(
      1,
      ...block.rows.map((row) => Math.abs(row.value)),
    );
    return (
      <figure className="fn-data">
        <h3>{block.title}</h3>
        <div className="fn-bars" aria-hidden="true">
          {block.rows.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <i
                style={{ width: `${(Math.abs(row.value) / maximum) * 100}%` }}
              />
              <b>
                {row.value}
                {block.unit}
              </b>
            </div>
          ))}
        </div>
        <figcaption>
          {block.caption}
          {block.source && (
            <>
              {" "}
              ·{" "}
              <a href={block.source}>
                Source <span aria-hidden="true">↗</span>
              </a>
            </>
          )}
        </figcaption>
        <details>
          <summary>Read the data</summary>
          <table>
            <caption>{block.title}</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Value {block.unit && `(${block.unit})`}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    );
  }
  return null;
}

export default function FieldnoteArticle({ note }) {
  const audio = useSoundscape("future", "writing");
  const root = useRef(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [active, setActive] = useState(note.sections[0]?.id);
  useEffect(() => {
    if (!motionPaused) return;
    const page = document.documentElement;
    const previous = page.style.scrollBehavior;
    page.style.scrollBehavior = "auto";
    return () => {
      page.style.scrollBehavior = previous;
    };
  }, [motionPaused]);
  useEffect(() => {
    const sections = root.current.querySelectorAll(
      ".fn-article-body > section",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActive(entry.target.id);
          if (!entry.target.dataset.seen) {
            entry.target.dataset.seen = "true";
            if (
              root.current?.dataset.motion !== "paused" &&
              !matchMedia("(prefers-reduced-motion: reduce)").matches
            )
              audio.cue("reveal");
          }
        });
      },
      { rootMargin: "-12% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [note, audio.cue]);
  const minutes = readingMinutes(note);
  const chapterLinks = note.sections.map((section, i) => (
    <a
      href={`#${section.id}`}
      key={section.id}
      aria-current={active === section.id ? "location" : undefined}
    >
      <small>{String(i + 1).padStart(2, "0")}</small>
      <span>{section.nav || section.title}</span>
    </a>
  ));
  return (
    <div
      className="fn-article"
      ref={root}
      data-motion={motionPaused ? "paused" : "playing"}
    >
      <a className="room-skip" href="#note-body">
        Skip to the note
      </a>
      <aside className="fn-story-rail" aria-label="Fieldnote navigation">
        <a className="site-mark" href="/" aria-label="Sri — enter the world">
          <PersonalSignature />
        </a>
        <a className="fn-back-note" href="/rooms/writing">
          ← Fieldnotes
        </a>
        <nav className="fn-desktop-chapters" aria-label="On this page">
          {chapterLinks}
        </nav>
        <a className="fn-world-link" href="/?room=writing">
          Back to the world ↗
        </a>
      </aside>
      <div className="fn-story-tools">
        <button
          className="fn-motion-toggle"
          aria-pressed={motionPaused}
          onClick={() => setMotionPaused(!motionPaused)}
        >
          {motionPaused ? "Resume motion" : "Pause motion"}
        </button>
        <RoomSoundControls audio={audio} />
      </div>
      <main>
        <header className="fn-story-opening">
          <div className="fn-story-scene">
            {note.cover ? (
              <img
                src={note.cover.src}
                srcSet={note.cover.srcSet}
                sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
                alt={note.cover.alt}
                width="1600"
                height="900"
                fetchPriority="high"
              />
            ) : (
              <div className="fn-cover-sketch" aria-hidden="true">
                <FieldnoteDoodle kind={note.art || "notice"} />
              </div>
            )}
          </div>
          <div className="fn-article-header">
            <div>
              <p className="fn-story-folio">
                Fieldnotes /{" "}
                {note.category.toLowerCase().replace(/\bai\b/g, "AI")}
              </p>
              <h1>
                {note.title.split("\n").map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </h1>
              <p className="fn-deck">{note.summary}</p>
            </div>
          </div>
          <a className="fn-begin" href="#note-body" data-sound="open">
            <span>Scroll to read · {minutes} min</span>
            <span aria-hidden="true">↓</span>
          </a>
          {(note.preview || note.draft) && (
            <span className="fn-draft-label">
              {note.draft
                ? "Working draft · for Sri’s review"
                : "Reading format · preview"}
            </span>
          )}
        </header>
        <div className="fn-article-layout">
          <details className="fn-mobile-chapters">
            <summary>
              In this note <span aria-hidden="true">+</span>
            </summary>
            <nav aria-label="On this page">{chapterLinks}</nav>
          </details>
          <article className="fn-article-body" id="note-body" tabIndex={-1}>
            {note.opening && <p className="fn-opening-line">{note.opening}</p>}
            <div className="fn-byline">
              <span>Words by Sri Ujjwal Reddy</span>
              <span>{minutes} minute read</span>
              {note.publishedAt && (
                <time dateTime={note.publishedAt}>
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(note.publishedAt))}
                </time>
              )}
            </div>
            {note.sections.map((section, i) => (
              <section id={section.id} key={section.id}>
                <span className="fn-section-number">
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(note.sections.length).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
                {section.blocks.map((block, j) => (
                  <NoteBlock key={j} block={block} onCue={audio.cue} />
                ))}
              </section>
            ))}
            {note.takeaway && (
              <div className="fn-thesis">
                <small>THE THOUGHT I’M TAKING WITH ME</small>
                <p>{note.takeaway}</p>
              </div>
            )}
            {note.sources && (
              <aside
                className="fn-sources"
                aria-label="Sources and further reading"
              >
                <h2>Keep following the thread.</h2>
                <ol>
                  {note.sources.map((source) => (
                    <li key={source.id} id={`source-${source.id}`}>
                      <a href={source.href} target="_blank" rel="noreferrer">
                        {source.title} ↗
                      </a>
                      <span>{source.publisher}</span>
                    </li>
                  ))}
                </ol>
              </aside>
            )}
            {note.editorialNote && (
              <aside className="fn-editorial-note">{note.editorialNote}</aside>
            )}
            <footer className="fn-note-footer">
              <p>
                {note.draft
                  ? "A thought in progress. More to come."
                  : note.preview
                    ? "The format is ready. The stories come next."
                    : "Thanks for spending a little time here."}
              </p>
              <a href="/rooms/writing">← The writing room</a>
              <a href="/rooms/contact">Start a conversation ↗</a>
              {note.linkedIn && (
                <a href={note.linkedIn} target="_blank" rel="noreferrer">
                  Continue on LinkedIn ↗
                </a>
              )}
            </footer>
          </article>
        </div>
      </main>
    </div>
  );
}
