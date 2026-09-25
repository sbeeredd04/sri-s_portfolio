"use client";
import { useState } from "react";
import { allProjects, projectCollections, toolkit } from "../../json/personal";
import { projectId } from "../../lib/project-library.mjs";
import {
  logoCredit,
  toolkitLogos,
  wideLogos,
} from "../../lib/official-logos.mjs";

// The official mark on a light chip, so it reads on either tag state.
function Mark({ name }) {
  const src = toolkitLogos[name];
  if (!src) return null;
  return [src].flat().map((one) => (
    <span
      key={one}
      className="peg-mark"
      data-wide={wideLogos.has(name) || undefined}
    >
      <img src={one} alt="" width="20" height="20" loading="lazy" />
    </span>
  ));
}

// A toolkit name can cover several stack labels, or a kind of work named in
// the project's category. Only listed evidence counts; nothing is inferred.
const evidence = {
  "HTML & CSS": { stack: ["HTML", "CSS"] },
  CUDA: { stack: ["CUDA / cuML"] },
  "Computer vision": {
    stack: ["OpenCV", "MediaPipe"],
    category: /computer vision/i,
  },
};
const shelves = new Set(
  projectCollections
    .filter((g) => ["drafts", "references"].includes(g.id))
    .flatMap((g) => g.items),
);
const practices = "The way I work";

export function usesTool(project, tool) {
  if (shelves.has(project)) return false;
  const rule = evidence[tool] || { stack: [tool] };
  return (
    rule.stack.some((s) => project.stack?.includes(s)) ||
    Boolean(rule.category?.test(project.category || ""))
  );
}

const projectsFor = (tool) => allProjects.filter((p) => usesTool(p, tool));

export default function ToolkitPegboard() {
  const [tool, setTool] = useState("Python");
  const used = projectsFor(tool);
  return (
    <div className="pegboard">
      <div className="pegboard-intro">
        <p className="eyebrow">THE TOOL WALL</p>
        <h2>Whatever the idea needs.</h2>
        <p className="app-lead">
          I work across interfaces, AI, and the systems behind them. Pick a tool
          to see where it went.
        </p>
      </div>
      <div className="pegboard-layout">
        <div className="pegboard-boards">
          {toolkit.map((g, gi) => (
            <section
              className="peg-panel"
              key={g.title}
              style={{ order: gi * 2 }}
              aria-labelledby={`peg-${gi}`}
            >
              <h3 id={`peg-${gi}`}>{g.title}</h3>
              <ul>
                {g.items.map((item) => {
                  const n =
                    g.title === practices ? 0 : projectsFor(item).length;
                  return (
                    <li key={item}>
                      {n > 0 ? (
                        <button
                          className="peg-tag"
                          aria-pressed={tool === item}
                          onClick={() => setTool(item)}
                        >
                          <Mark name={item} />
                          <span>{item}</span>
                          <small>
                            {n}
                            <span className="sr-only">
                              {n === 1 ? " project" : " projects"}
                            </span>
                          </small>
                        </button>
                      ) : (
                        <span className="peg-tag" data-quiet>
                          <Mark name={item} />
                          <span>{item}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {g.title === practices && (
                <p className="peg-note">
                  Habits, not libraries, so there’s nothing to count.
                </p>
              )}
            </section>
          ))}
          <aside
            className="peg-tray"
            aria-live="polite"
            style={{
              "--tray-order":
                toolkit.findIndex((g) => g.items.includes(tool)) * 2 + 1,
            }}
          >
            <span className="peg-tray-count">
              {String(used.length).padStart(2, "0")}
            </span>
            <p>
              {used.length === 1 ? "project uses" : "projects use"}{" "}
              <strong>{tool}</strong>
            </p>
            <ul>
              {used.map((p) => (
                <li key={projectId(p)}>
                  <a href={`/rooms/work#project-${projectId(p)}`}>
                    <span>{p.name}</span>
                    <small>{p.category}</small>
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="peg-tray-all"
              href={`/rooms/work?tool=${encodeURIComponent(tool)}#foundry-archive`}
            >
              Open these in the index <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
        <p className="peg-credit">{logoCredit}</p>
      </div>
    </div>
  );
}
