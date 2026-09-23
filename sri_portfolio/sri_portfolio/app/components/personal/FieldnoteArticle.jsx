"use client";
import FieldnoteDoodle from "./FieldnoteDoodle";
import RoomSoundControls from "./RoomSoundControls";
import useSoundscape from "./useSoundscape";

function NoteBlock({ block }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
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
              · <a href={block.source}>Source ↗</a>
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
              · <a href={block.source}>Source ↗</a>
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
  return (
    <div className="fn-article">
      <a className="room-skip" href="#note-body">
        Skip to the note
      </a>
      <header className="fn-article-nav">
        <a href="/rooms/writing" aria-label="Fieldnotes — all notes">
          <span className="fn-wordmark">
            fieldnotes<span>.</span>
          </span>
          <small>BY SRI</small>
        </a>
        <nav aria-label="Article navigation">
          <a href="/rooms/writing">All notes</a>
          <a href="/?room=writing">In the world ↗</a>
        </nav>
      </header>
      <main>
        {note.preview && (
          <div className="fn-preview-notice">
            <span>READING FORMAT / PREVIEW</span>
            <p>
              This is a layout example, not a published blog post. The first
              story is still to come.
            </p>
          </div>
        )}
        <div className="fn-article-header">
          <div>
            <p className="fn-kicker">
              {note.category}
              {note.publishedAt && (
                <>
                  {" "}
                  ·{" "}
                  <time dateTime={note.publishedAt}>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(note.publishedAt))}
                  </time>
                </>
              )}
            </p>
            <h1>
              {note.title.split("\n").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h1>
            <p className="fn-deck">{note.summary}</p>
          </div>
          <div className="fn-cover-sketch" aria-hidden="true">
            <FieldnoteDoodle kind={note.art || "notice"} />
          </div>
        </div>
        <div className="fn-article-sound">
          <RoomSoundControls audio={audio} />
        </div>
        <div className="fn-article-layout">
          <aside className="fn-toc">
            <span>ON THIS PAGE</span>
            <nav aria-label="On this page">
              {note.sections.map((section, i) => (
                <a href={`#${section.id}`} key={section.id}>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                  {section.title}
                </a>
              ))}
            </nav>
            <a className="fn-back-note" href="/rooms/writing">
              ← Back to Fieldnotes
            </a>
          </aside>
          <article className="fn-article-body" id="note-body" tabIndex={-1}>
            {note.takeaway && (
              <div className="fn-thesis">
                <small>THE SHORT VERSION</small>
                <p>{note.takeaway}</p>
              </div>
            )}
            {note.sections.map((section, i) => (
              <section id={section.id} key={section.id}>
                <span className="fn-section-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
                {section.blocks.map((block, j) => (
                  <NoteBlock key={j} block={block} />
                ))}
              </section>
            ))}
            <footer className="fn-note-footer">
              <span aria-hidden="true">✳</span>
              <p>
                {note.preview
                  ? "The format is ready. The stories come next."
                  : "Thanks for spending a little time here."}
              </p>
              <a href="/rooms/writing">Back to the notebooks ↗</a>
              {note.linkedIn && (
                <a href={note.linkedIn} target="_blank" rel="noreferrer">
                  Continue the conversation on LinkedIn ↗
                </a>
              )}
            </footer>
          </article>
        </div>
      </main>
      <footer className="fn-colophon">
        <a href="/">sri.</a>
        <span>Made with a little curiosity.</span>
        <a href="/rooms/contact">Say hello ↗</a>
      </footer>
    </div>
  );
}
