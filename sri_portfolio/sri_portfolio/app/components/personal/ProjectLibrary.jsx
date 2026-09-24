"use client";
import Image from "next/image";
import FoundryDesk from "./FoundryDesk";
import ProjectDemo from "./ProjectDemo";
import ProjectVisual from "./ProjectVisual";
import ProjectFieldbook from "./ProjectFieldbook";
import { useEffect, useRef, useState } from "react";
import { projectCollections as groups, allProjects } from "../../json/personal";
import {
  projectId,
  linkedProjectId,
  matchesProject,
} from "../../lib/project-library.mjs";
export default function ProjectLibrary({
  initialCollection = "all",
  onLocationChange,
}) {
  const validCollection = groups.some((g) => g.id === initialCollection)
    ? initialCollection
    : "all";
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(validCollection),
    [collectionsOpen, setCollectionsOpen] = useState(validCollection === "all"),
    [requested, setRequested] = useState(null);
  const library = useRef();
  useEffect(() => {
    onLocationChange?.({ collection: filter, hash: window.location.hash });
  }, [filter, query, requested, onLocationChange]);
  function clearProjectAnchor() {
    if (!linkedProjectId(window.location.hash)) return;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }
  function reveal(id) {
    setQuery("");
    setFilter("all");
    setRequested(id);
  }
  useEffect(() => {
    const followLink = () => {
      const id = linkedProjectId(window.location.hash);
      if (allProjects.some((project) => projectId(project) === id)) reveal(id);
    };
    // An explicit project address wins over a collection filter.
    followLink();
    window.addEventListener("hashchange", followLink);
    return () => window.removeEventListener("hashchange", followLink);
  }, []);
  useEffect(() => {
    if (!requested || query || filter !== "all") return;
    const article = library.current.querySelector(`#project-${requested}`);
    if (!article) return;
    const detail = article.querySelector("details");
    if (detail) detail.open = true;
    const pane = article
      .closest(".app-window")
      ?.querySelector(".window-content");
    if (pane) {
      pane.scrollTo({
        behavior: "instant",
        top:
          pane.scrollTop +
          article.getBoundingClientRect().top -
          pane.getBoundingClientRect().top -
          16,
      });
    } else {
      article.scrollIntoView({ block: "start", behavior: "instant" });
    }
    article.focus({ preventScroll: true });
    setRequested(null);
  }, [requested, query, filter]);
  const visible = groups
    .filter((g) => filter === "all" || filter === g.id)
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => matchesProject(item, query)),
    }));
  const count = visible.reduce((n, g) => n + g.items.length, 0);
  const collection = groups.find((group) => group.id === filter);
  const showDesk = filter === "all" || filter === "projects";
  return (
    <div ref={library} className="project-library">
      <header className="foundry-heading">
        <div>
          <p className="eyebrow">THE FOUNDRY / SRI’S WORKING COLLECTION</p>
          {showDesk ? (
            <h2>
              Curiosity, <em>put to work.</em>
            </h2>
          ) : (
            <h2>{collection.label}</h2>
          )}
        </div>
        <div className="foundry-links">
          <a href="#foundry-archive">
            {filter === "all"
              ? `Browse all ${allProjects.length} entries`
              : `Explore ${collection.label}`}{" "}
            ↓
          </a>
          <a href="/resume">My résumé</a>
        </div>
      </header>
      {showDesk && <FoundryDesk onRead={reveal} />}
      <div
        className={showDesk ? "foundry-archive-heading" : undefined}
        id="foundry-archive"
      >
        {showDesk && (
          <>
            <h3>The working collection</h3>
            <p>
              Products, hackathon weekends, experiments, and the beginnings that
              stayed with me.
            </p>
          </>
        )}
      </div>
      <div className="project-library-controls">
        <label className="project-search">
          <span>Find something</span>
          <input
            type="search"
            placeholder="Try AI, music, or developer tools"
            value={query}
            onChange={(e) => {
              clearProjectAnchor();
              setQuery(e.target.value);
            }}
          />
        </label>
        <details
          className="project-collection-picker"
          open={collectionsOpen}
          onToggle={(event) => setCollectionsOpen(event.currentTarget.open)}
        >
          <summary>Change collection</summary>
          <div
            className="project-filters"
            role="group"
            aria-label="Filter projects"
          >
            {[["all", "All work"], ...groups.map((g) => [g.id, g.label])].map(
              ([id, name]) => (
                <button
                  key={id}
                  onClick={() => {
                    clearProjectAnchor();
                    setFilter(id);
                  }}
                  aria-pressed={filter === id}
                >
                  {name}
                </button>
              ),
            )}
          </div>
        </details>
        <span className="project-result-count" role="status">
          {count} {count === 1 ? "entry" : "entries"}
        </span>
      </div>
      {visible.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.id} aria-label={g.label}>
              {showDesk && <h3 className="project-group-heading">{g.label}</h3>}
              {g.id === "hackathons" && (
                <p className="collection-intro">
                  I took part in Devils Invent three times, as well as AZ Spark
                  and a Voxel51 hackathon. Three Devils Invent team awards, Mine
                  Alliance’s Principled Innovation recognition, and PosturePro’s
                  Voxel51 win—alongside the ideas, prototypes, and people behind
                  them.
                </p>
              )}
              {g.id === "drafts" && (
                <p className="collection-intro">
                  The beginnings count, too. These repositories have not yet
                  developed enough public detail for a full project story.
                </p>
              )}
              {g.id === "references" && (
                <p className="collection-intro">
                  Open source is part of the learning process. These are forks
                  of external projects, not original builds or evidence of an
                  upstream contribution.
                </p>
              )}
              {g.id === "workbench" && (
                <p className="collection-intro">
                  Not every idea becomes a product. These are the prototypes,
                  small personal tools, and learning projects that sit around
                  the bigger builds.
                </p>
              )}
              {g.id === "earlier" && (
                <p>
                  Ideas I explored along the way. Part of the story, even as my
                  focus moves forward.
                </p>
              )}
              <div
                className={
                  g.id === "projects"
                    ? "selected-projects"
                    : ["references", "drafts"].includes(g.id)
                      ? "project-grid repository-grid"
                      : "project-grid"
                }
              >
                {g.items.map((p, projectIndex) => (
                  <article
                    id={`project-${projectId(p)}`}
                    tabIndex={-1}
                    className={`app-project ${g.id === "projects" ? "featured-project" : ""}`}
                    data-project={projectId(p)}
                    data-collection={g.id}
                    key={p.id || p.name}
                  >
                    <span className="project-folio">
                      {g.label} / {String(projectIndex + 1).padStart(2, "0")}
                    </span>
                    <ProjectVisual id={projectId(p)} />
                    <div className="project-meta">
                      <span className="eyebrow">{p.category}</span>
                      {p.year && <span>{p.year}</span>}
                    </div>
                    <div className="project-title-row">
                      <h3>{p.name}</h3>
                      <a
                        className="project-permalink"
                        href={`#project-${projectId(p)}`}
                        aria-label={`Link to ${p.name}`}
                        onClick={(event) => {
                          event.preventDefault();
                          const hash = `#project-${projectId(p)}`;
                          if (window.location.hash !== hash)
                            window.history.pushState(null, "", hash);
                          reveal(projectId(p));
                        }}
                      >
                        Link <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                    {g.id !== "drafts" && <p>{p.description}</p>}
                    {p.status && !["references", "drafts"].includes(g.id) && (
                      <span className="project-status">{p.status}</span>
                    )}
                    {p.stack && (
                      <ul
                        className="project-stack"
                        aria-label={`Tools used in ${p.name}`}
                      >
                        {p.stack.map((tool) => (
                          <li key={tool}>{tool}</li>
                        ))}
                      </ul>
                    )}
                    {p.story && (
                      <details className="project-detail">
                        <summary>
                          Read the project <span aria-hidden="true">+</span>
                        </summary>
                        <ProjectFieldbook name={p.name} story={p.story}>
                          {p.id === "mesa" && (
                            <figure className="project-screenshot">
                              <Image
                                src="/experiences/experience-screenshot-1.png"
                                alt="A screen from the Mesa exhibit with a historical biography, video, and quiz"
                                width={1200}
                                height={720}
                                sizes="(max-width: 700px) 80vw, 560px"
                              />
                              <figcaption>
                                An interface from the museum exhibit.
                              </figcaption>
                            </figure>
                          )}
                        </ProjectFieldbook>
                      </details>
                    )}
                    <ProjectDemo id={projectId(p)} name={p.name} />
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.linkLabel || "View repository"}{" "}
                        <span className="sr-only">for {p.name}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {p.sourceUrl && (
                      <a
                        className="project-source"
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {p.sourceLabel} ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ),
      )}
      {count === 0 && (
        <div className="app-note">
          <strong>No projects match that yet.</strong>
          <p>Try a different word or choose All work.</p>
          <button
            className="app-action"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Show everything
          </button>
        </div>
      )}
      <a
        className="app-action"
        href="https://github.com/sbeeredd04?tab=repositories"
        target="_blank"
        rel="noreferrer"
      >
        Explore all my repositories ↗
      </a>
    </div>
  );
}
