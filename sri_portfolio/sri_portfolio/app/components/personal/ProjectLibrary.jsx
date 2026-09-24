"use client";
import Image from "next/image";
import FoundryDesk from "./FoundryDesk";
import ProjectDemo from "./ProjectDemo";
import ProjectVisual from "./ProjectVisual";
import ProjectFieldbook from "./ProjectFieldbook";
import { usesTool } from "./ToolkitPegboard";
import { useEffect, useMemo, useRef, useState } from "react";
import { projectCollections as groups, allProjects } from "../../json/personal";
import {
  projectId,
  linkedProjectId,
  matchesProject,
} from "../../lib/project-library.mjs";

const shelves = ["drafts", "references"];
const intros = {
  hackathons:
    "I took part in Devils Invent three times, as well as AZ Spark and a Voxel51 hackathon. Three Devils Invent team awards, Mine Alliance’s Principled Innovation recognition, and PosturePro’s Voxel51 win—alongside the ideas, prototypes, and people behind them.",
  drafts:
    "The beginnings count, too. These repositories have not yet developed enough public detail for a full project story.",
  references:
    "Open source is part of the learning process. These are forks of external projects, not original builds or evidence of an upstream contribution.",
  workbench:
    "Not every idea becomes a product. These are the prototypes, small personal tools, and learning projects that sit around the bigger builds.",
  earlier:
    "Ideas I explored along the way. Part of the story, even as my focus moves forward.",
};
const columns = [
  ["collection", "No."],
  ["name", "Name"],
  ["kind", "Kind"],
  ["year", "Year"],
];

function yearOf(p) {
  const m = /\d{4}/.exec(p.year || "");
  return m ? +m[0] : null;
}
function linkFor(p) {
  if (!p.url) return null;
  const host = [
    ["github.com", "Code"],
    ["apps.apple.com", "App Store"],
    ["devpost.com", "Devpost"],
    [".pdf", "Slides"],
  ].find(([match]) => p.url.includes(match));
  return host ? host[1] : "Open";
}
function ExternalLink({ p, className }) {
  const label = linkFor(p);
  if (!label) return null;
  return (
    <a className={className} href={p.url} target="_blank" rel="noreferrer">
      {label}
      <span className="sr-only"> for {p.name}</span>{" "}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function Spread({ p, index }) {
  const id = projectId(p);
  return (
    <article
      id={`project-${id}`}
      tabIndex={-1}
      className="work-spread"
      data-project={id}
    >
      <div className="spread-sketch">
        <span className="spread-folio" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <ProjectVisual id={id} />
        {p.stack && (
          <ul className="spread-parts" aria-label={`Tools used in ${p.name}`}>
            {p.stack.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="spread-sheet">
        <p className="spread-spec">
          <span>{p.category}</span>
          {p.year && <span>{p.year}</span>}
        </p>
        <h3>{p.name}</h3>
        <p className="spread-summary">{p.description}</p>
        {p.story && (
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
                <figcaption>An interface from the museum exhibit.</figcaption>
              </figure>
            )}
          </ProjectFieldbook>
        )}
        <ProjectDemo id={id} name={p.name} />
        <ExternalLink p={p} className="spread-link" />
      </div>
    </article>
  );
}

function IndexRow({ p, number, group, open, onToggle }) {
  const id = projectId(p);
  const drawer = `drawer-${id}`;
  const expandable =
    !shelves.includes(group.id) && (p.description || p.story?.length);
  return (
    <tbody
      id={`project-${id}`}
      tabIndex={-1}
      data-collection={group.id}
      data-open={open || undefined}
    >
      <tr>
        <td className="index-no">{String(number).padStart(2, "0")}</td>
        <th scope="row" className="index-name">
          {expandable ? (
            <button
              aria-expanded={open}
              aria-controls={drawer}
              onClick={() => onToggle(id)}
            >
              <span>{p.name}</span>
              <i aria-hidden="true">{open ? "−" : "+"}</i>
            </button>
          ) : (
            <span>{p.name}</span>
          )}
        </th>
        <td className="index-kind">{p.category}</td>
        <td className="index-year">{p.year || "—"}</td>
        <td className="index-stack">
          {p.stack?.slice(0, 3).join(" · ") ||
            (shelves.includes(group.id) ? p.status : "—")}
        </td>
        <td className="index-shelf">{group.label}</td>
        <td className="index-link">
          <ExternalLink p={p} />
        </td>
      </tr>
      {expandable && (
        <tr className="index-drawer-row" hidden={!open}>
          <td colSpan={7}>
            <div className="index-drawer" id={drawer}>
              <div>
                {p.status && <span className="index-status">{p.status}</span>}
                <p>{p.description}</p>
                {p.stack && (
                  <p className="index-tools">{p.stack.join(" · ")}</p>
                )}
                {p.sourceUrl && (
                  <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                    {p.sourceLabel} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              {open && p.story?.length > 0 && (
                <ProjectFieldbook name={p.name} story={p.story} />
              )}
              {open && <ProjectDemo id={id} name={p.name} />}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
}

export default function ProjectLibrary({
  initialCollection = "all",
  onLocationChange,
  compact = false,
}) {
  const validCollection = groups.some((g) => g.id === initialCollection)
    ? initialCollection
    : "all";
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(validCollection),
    [tool, setTool] = useState(null),
    [sort, setSort] = useState({ key: "collection", dir: 1 }),
    [openRow, setOpenRow] = useState(null),
    [shelvesShown, setShelvesShown] = useState(false),
    [requested, setRequested] = useState(null),
    [indexRevealed, setIndexRevealed] = useState(false);
  const library = useRef();
  useEffect(() => {
    onLocationChange?.({ collection: filter, hash: window.location.hash });
  }, [filter, query, requested, openRow, onLocationChange]);
  function setAnchor(id) {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", id ? `${base}#project-${id}` : base);
  }
  function clearProjectAnchor() {
    if (linkedProjectId(window.location.hash)) setAnchor(null);
  }
  function reveal(id) {
    setQuery("");
    setTool(null);
    setFilter("all");
    const group = groups.find((g) => g.items.some((p) => projectId(p) === id));
    if (shelves.includes(group?.id)) setShelvesShown(true);
    if (group?.id !== "projects") {
      setOpenRow(id);
      setIndexRevealed(true);
    }
    setRequested(id);
  }
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tool");
    if (t) setTool(t.slice(0, 40));
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
    const target = library.current.querySelector(`#project-${requested}`);
    if (!target) return;
    const pane = target
      .closest(".app-window")
      ?.querySelector(".window-content");
    if (pane) {
      pane.scrollTo({
        behavior: "instant",
        top:
          pane.scrollTop +
          target.getBoundingClientRect().top -
          pane.getBoundingClientRect().top -
          16,
      });
    } else {
      // Clear the sticky header; table sections ignore scroll-margin.
      const place = () => {
        const header = document.querySelector(".site-header");
        window.scrollTo({
          behavior: "instant",
          top:
            window.scrollY +
            target.getBoundingClientRect().top -
            (header?.offsetHeight || 0) -
            24,
        });
      };
      place();
      // Keep the row in place while late fonts and media settle above it.
      const settle = new ResizeObserver(place);
      const stop = () => settle.disconnect();
      settle.observe(library.current);
      setTimeout(stop, 1500);
      for (const type of ["wheel", "touchstart", "keydown"])
        window.addEventListener(type, stop, { once: true, passive: true });
    }
    target.focus({ preventScroll: true });
    setRequested(null);
  }, [requested, query, filter, shelvesShown, indexRevealed]);

  const matches = (p) =>
    matchesProject(p, query) && (!tool || usesTool(p, tool));
  const selected = groups[0].items.filter(matches);
  const showSpreads = filter === "all" || filter === "projects";
  const showDesk = showSpreads && !query && !tool && !compact;
  const forceShelves = shelves.includes(filter);
  const rows = useMemo(() => {
    const list = groups
      .filter((g) => g.id !== "projects")
      .filter((g) => filter === "all" || filter === g.id)
      .filter((g) => forceShelves || shelvesShown || !shelves.includes(g.id))
      .flatMap((g) =>
        g.items.filter(matches).map((p, i) => ({ p, g, order: i })),
      );
    const groupIndex = (g) => groups.indexOf(g);
    const value = {
      collection: (r) => groupIndex(r.g) * 1000 + r.order,
      name: (r) => r.p.name.toLowerCase(),
      kind: (r) => (r.p.category || "").toLowerCase(),
      year: (r) => yearOf(r.p) ?? -Infinity,
    }[sort.key];
    return [...list].sort((a, b) => {
      const x = value(a),
        y = value(b);
      if (x === y)
        return groupIndex(a.g) - groupIndex(b.g) || a.order - b.order;
      return (x > y ? 1 : -1) * (sort.key === "year" ? -sort.dir : sort.dir);
    });
    // `matches` changes only with query and tool, which are listed.
  }, [filter, query, tool, sort, shelvesShown, forceShelves]);
  const hiddenShelves = groups
    .filter((g) => shelves.includes(g.id))
    .reduce((n, g) => n + g.items.length, 0);
  const count = (showSpreads ? selected.length : 0) + rows.length;
  const collection = groups.find((group) => group.id === filter);
  const toggleRow = (id) => {
    const next = openRow === id ? null : id;
    setOpenRow(next);
    setAnchor(next);
  };
  const sortBy = (key) =>
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));

  return (
    <div
      ref={library}
      className="project-library"
      data-compact={compact || undefined}
    >
      <header className="foundry-heading">
        <div>
          <p className="eyebrow">THE FOUNDRY / SRI’S WORKING COLLECTION</p>
          {filter === "all" || filter === "projects" ? (
            <h2>
              Curiosity, <em>put to work.</em>
            </h2>
          ) : (
            <h2>{collection.label}</h2>
          )}
        </div>
        {!compact && (
          <div className="foundry-links">
            <a href="#foundry-archive">
              The index · {allProjects.length} entries{" "}
              <span aria-hidden="true">↓</span>
            </a>
            <a href="/resume">My résumé</a>
          </div>
        )}
      </header>
      {showDesk && <FoundryDesk onRead={reveal} />}
      {showSpreads && selected.length > 0 && (
        <section className="work-spreads" aria-labelledby="selected-work">
          <div className="work-section-head">
            <h3 id="selected-work">Selected work</h3>
            <span>
              {String(selected.length).padStart(2, "0")} builds, each with its
              story
            </span>
          </div>
          {selected.map((p, i) => (
            <Spread key={p.id} p={p} index={i} />
          ))}
        </section>
      )}
      {compact && !indexRevealed ? (
        <a className="work-index-cta" href="/rooms/work#foundry-archive">
          <span>
            The full index: hackathons, iPhone apps, experiments and early
            builds
          </span>
          <span aria-hidden="true">→</span>
        </a>
      ) : (
        <section
          className="work-index"
          id="foundry-archive"
          aria-labelledby="work-index-title"
        >
          <div className="work-section-head">
            <h3 id="work-index-title">The index</h3>
            <span>
              Hackathon weekends, iPhone apps, experiments and the beginnings
              that stayed with me.
            </span>
          </div>
          <div className="index-controls">
            <label className="index-search">
              <span className="sr-only">Find something</span>
              <input
                type="search"
                placeholder="Search: AI, music, Swift…"
                value={query}
                onChange={(e) => {
                  clearProjectAnchor();
                  setQuery(e.target.value);
                }}
              />
            </label>
            <div
              className="index-filters"
              role="group"
              aria-label="Filter by collection"
            >
              {[["all", "All"], ...groups.map((g) => [g.id, g.label])].map(
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
            <div className="index-status-line">
              <span role="status">
                {count} {count === 1 ? "entry" : "entries"}
                {tool && ` using ${tool}`}
              </span>
              {tool && (
                <button className="index-chip" onClick={() => setTool(null)}>
                  {tool} <span aria-hidden="true">×</span>
                  <span className="sr-only">Clear tool filter</span>
                </button>
              )}
              {filter === "all" && (
                <button
                  className="index-chip"
                  aria-pressed={shelvesShown}
                  onClick={() => setShelvesShown((v) => !v)}
                >
                  {shelvesShown ? "Hide" : "Show"} forks & early drafts (
                  {hiddenShelves})
                </button>
              )}
            </div>
            {intros[filter] && <p className="index-intro">{intros[filter]}</p>}
          </div>
          {rows.length > 0 && (
            <div
              className="index-sort"
              role="group"
              aria-label="Sort the index"
            >
              <span aria-hidden="true">Sort</span>
              {columns.map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={sort.key === key}
                  onClick={() => sortBy(key)}
                >
                  {key === "collection" ? "Collection" : label}
                </button>
              ))}
            </div>
          )}
          {rows.length > 0 && (
            <table className="index-table">
              <caption className="sr-only">
                Every project, sortable by collection, name, kind and year
              </caption>
              <thead>
                <tr>
                  {columns.map(([key, label]) => (
                    <th
                      key={key}
                      scope="col"
                      aria-sort={
                        sort.key === key
                          ? (key === "year" ? -sort.dir : sort.dir) > 0
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button onClick={() => sortBy(key)}>
                        {label}
                        <span aria-hidden="true">
                          {sort.key === key ? (sort.dir > 0 ? "↓" : "↑") : ""}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th scope="col">Stack</th>
                  <th scope="col">Shelf</th>
                  <th scope="col">
                    <span className="sr-only">Link</span>
                  </th>
                </tr>
              </thead>
              {rows.map(({ p, g }, i) => (
                <IndexRow
                  key={projectId(p)}
                  p={p}
                  group={g}
                  number={i + 1}
                  open={openRow === projectId(p)}
                  onToggle={toggleRow}
                />
              ))}
            </table>
          )}
          {count === 0 && (
            <div className="index-empty">
              <strong>Nothing matches that yet.</strong>
              <button
                className="index-chip"
                onClick={() => {
                  setQuery("");
                  setTool(null);
                  setFilter("all");
                }}
              >
                Show everything
              </button>
            </div>
          )}
        </section>
      )}
      <a
        className="work-github"
        href="https://github.com/sbeeredd04?tab=repositories"
        target="_blank"
        rel="noreferrer"
      >
        Every repository on GitHub <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
