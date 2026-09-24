"use client";
import ProjectVisual from "./ProjectVisual";
import WorkLink from "./WorkLink";
import { projectId } from "../../lib/project-library.mjs";

// A grid of smaller builds. "Details" opens the entry in the index below.
export default function WorkShelf({ group, onRead }) {
  return (
    <ul className="shelf-grid" data-collection={group.id}>
      {group.items.map((p) => {
        const id = projectId(p);
        return (
          <li key={id} className="shelf-card" data-reveal="">
            <ProjectVisual id={id} />
            <div className="shelf-body">
              <p className="shelf-meta">
                <span>{p.category}</span>
                {p.year && <span>{p.year}</span>}
              </p>
              <h4>{p.name}</h4>
              {p.status && <p className="shelf-status">{p.status}</p>}
              {p.description && <p className="shelf-text">{p.description}</p>}
              <div className="shelf-actions">
                {(p.description || p.story?.length > 0) && (
                  <button onClick={() => onRead(id)}>
                    Details<span className="sr-only"> on {p.name}</span>{" "}
                    <span aria-hidden="true">↓</span>
                  </button>
                )}
                <WorkLink p={p} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
