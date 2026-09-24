"use client";
import Image from "next/image";
import ProjectDemo from "./ProjectDemo";
import ProjectVisual from "./ProjectVisual";
import ProjectFieldbook from "./ProjectFieldbook";
import WorkLink from "./WorkLink";
import { projectDemos } from "../../json/project-demos.mjs";
import { projectId } from "../../lib/project-library.mjs";

// One selected build: the same frame every time, so the eye learns it once.
export default function WorkCaseFile({ p, index, open, onToggle }) {
  const id = projectId(p);
  const notes = `case-notes-${id}`;
  const demo = projectDemos[id];
  return (
    <article
      id={`project-${id}`}
      tabIndex={-1}
      className="case-file"
      data-project={id}
      data-open={open || undefined}
      data-reveal=""
    >
      <div className="case-visual">
        <ProjectVisual id={id} />
      </div>
      <div className="case-body">
        <p className="case-meta">
          <span className="case-no">{String(index + 1).padStart(2, "0")}</span>
          <span>{p.category}</span>
          {p.year && <span className="case-year">{p.year}</span>}
        </p>
        <h3>{p.name}</h3>
        <p className="case-summary">{p.description}</p>
        {p.stack && (
          <ul className="case-stack" aria-label={`Tools used in ${p.name}`}>
            {p.stack.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        )}
        <div className="case-actions">
          {(p.story?.length > 0 || demo) && (
            <button
              className="case-toggle"
              aria-expanded={open}
              aria-controls={notes}
              onClick={() => onToggle(id)}
            >
              <span>
                {open ? "Close the build story" : "Read the build story"}
              </span>
              {demo && !open && <small>+ demo</small>}
              <i aria-hidden="true">{open ? "−" : "+"}</i>
            </button>
          )}
          <WorkLink p={p} className="case-link" />
        </div>
      </div>
      <div className="case-notes" id={notes} hidden={!open}>
        {open && (
          <>
            {p.story?.length > 0 && (
              <ProjectFieldbook name={p.name} story={p.story}>
                {p.id === "mesa" && (
                  <figure className="project-screenshot">
                    <Image
                      src="/experiences/experience-screenshot-1.png"
                      alt="A screen from the Mesa exhibit with a historical biography, video, and quiz"
                      width={1200}
                      height={720}
                      sizes="(max-width: 700px) 90vw, 520px"
                    />
                    <figcaption>
                      An interface from the museum exhibit.
                    </figcaption>
                  </figure>
                )}
              </ProjectFieldbook>
            )}
            <ProjectDemo id={id} name={p.name} />
          </>
        )}
      </div>
    </article>
  );
}
