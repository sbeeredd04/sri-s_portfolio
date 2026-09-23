"use client";
import { useId, useState } from "react";

export default function ProjectFieldbook({ name, story, children }) {
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const panelId = useId();
  return (
    <div className="project-fieldbook">
      <div className="fieldbook-heading">
        <span>INSIDE {name}</span>
        <button aria-pressed={all} onClick={() => setAll(!all)}>
          {all ? "One chapter at a time" : "Read all chapters"}
        </button>
      </div>
      {!all && (
        <div
          className="fieldbook-chapters"
          role="group"
          aria-label={`${name} chapters`}
        >
          {story.map((chapter, i) => (
            <button
              key={chapter.title}
              aria-pressed={page === i}
              aria-controls={panelId}
              onClick={() => setPage(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {chapter.title}
            </button>
          ))}
        </div>
      )}
      <div
        id={panelId}
        className="fieldbook-pages"
        aria-live={all ? undefined : "polite"}
      >
        {(all ? story : [story[page]]).map((chapter, i) => (
          <section className="project-story" key={chapter.title}>
            <span className="folio-number" aria-hidden="true">
              {String((all ? i : page) + 1).padStart(2, "0")}
            </span>
            <div>
              <h4>{chapter.title}</h4>
              <p>{chapter.body}</p>
            </div>
          </section>
        ))}
      </div>
      {children}
    </div>
  );
}
