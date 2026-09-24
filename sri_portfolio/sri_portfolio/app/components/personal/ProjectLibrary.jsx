"use client";
import FoundryDesk from "./FoundryDesk";
import WorkCaseFile from "./WorkCaseFile";
import WorkIndex, { shelves } from "./WorkIndex";
import WorkNav from "./WorkNav";
import WorkShelf from "./WorkShelf";
import useWorkMotion from "./useWorkMotion";
import { usesTool } from "./ToolkitPegboard";
import { useEffect, useMemo, useRef, useState } from "react";
import { projectCollections as groups, allProjects } from "../../json/personal";
import {
  projectId,
  linkedProjectId,
  matchesProject,
} from "../../lib/project-library.mjs";

const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
const pad = (n) => String(n).padStart(2, "0");
const sections = [
  {
    id: "selected-work",
    label: "Selected work",
    count: byId.projects.items.length,
  },
  {
    id: "shelf-mobile",
    label: "iPhone & iPad",
    count: byId.mobile.items.length,
  },
  {
    id: "shelf-hackathons",
    label: "Hackathons",
    count: byId.hackathons.items.length,
  },
  { id: "foundry-desk", label: "Try an idea" },
  { id: "foundry-archive", label: "The index", count: allProjects.length },
];

function yearOf(p) {
  const m = /\d{4}/.exec(p.year || "");
  return m ? +m[0] : null;
}

function SectionHead({ id, no, title, note }) {
  return (
    <div className="work-section-head" data-reveal="">
      <span className="work-section-no" aria-hidden="true">
        {no}
      </span>
      <h3 id={id}>{title}</h3>
      {note && <p>{note}</p>}
    </div>
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
    [openCase, setOpenCase] = useState(null),
    [shelvesShown, setShelvesShown] = useState(false),
    [requested, setRequested] = useState(null),
    [indexRevealed, setIndexRevealed] = useState(false);
  const library = useRef();
  useWorkMotion(library);
  useEffect(() => {
    onLocationChange?.({ collection: filter, hash: window.location.hash });
  }, [filter, query, requested, openRow, openCase, onLocationChange]);
  function setAnchor(id) {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", id ? `${base}#project-${id}` : base);
  }
  function clearProjectAnchor() {
    if (linkedProjectId(window.location.hash)) setAnchor(null);
  }
  function reveal(id) {
    const group = groups.find((g) => g.items.some((p) => projectId(p) === id));
    if (group?.id === "projects") setOpenCase(id);
    else {
      setQuery("");
      setTool(null);
      setFilter("all");
      if (shelves.includes(group?.id)) setShelvesShown(true);
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
    if (
      !linkedProjectId(window.location.hash) &&
      (t || validCollection !== "all")
    )
      setRequested("archive");
    window.addEventListener("hashchange", followLink);
    return () => window.removeEventListener("hashchange", followLink);
  }, []);
  useEffect(() => {
    if (!requested) return;
    const target = library.current.querySelector(
      requested === "archive" ? "#foundry-archive" : `#project-${requested}`,
    );
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
      // Clear the sticky header and section rail; tables ignore scroll-margin.
      const place = () => {
        const header = document.querySelector(".site-header");
        const rail = library.current?.querySelector(".work-nav");
        const railOffset =
          rail && getComputedStyle(rail).position === "sticky"
            ? rail.offsetHeight
            : 0;
        window.scrollTo({
          behavior: "instant",
          top:
            window.scrollY +
            target.getBoundingClientRect().top -
            (header?.offsetHeight || 0) -
            railOffset -
            20,
        });
      };
      place();
      // Keep the entry in place while late fonts and media settle above it.
      const settle = new ResizeObserver(place);
      const stop = () => settle.disconnect();
      settle.observe(library.current);
      setTimeout(stop, 1500);
      for (const type of ["wheel", "touchstart", "keydown"])
        window.addEventListener(type, stop, { once: true, passive: true });
    }
    target.focus({ preventScroll: true });
    setRequested(null);
  }, [requested, query, filter, shelvesShown, indexRevealed, openCase]);

  const matches = (p) =>
    matchesProject(p, query) && (!tool || usesTool(p, tool));
  const forceShelves = shelves.includes(filter);
  const rows = useMemo(() => {
    const list = groups
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
  const selected = byId.projects.items;
  const toggleRow = (id) => {
    const next = openRow === id ? null : id;
    setOpenRow(next);
    setAnchor(next);
  };
  const toggleCase = (id) => {
    const next = openCase === id ? null : id;
    setOpenCase(next);
    setAnchor(next);
  };
  const sortBy = (key) =>
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
  const showIndex = !compact || indexRevealed;
  const stats = [
    [selected.length, "selected builds"],
    [byId.hackathons.items.length, "hackathon entries"],
    [byId.mobile.items.length, "iPhone & iPad"],
    [allProjects.length, "entries in the index"],
  ];

  return (
    <div
      ref={library}
      className="project-library work-room"
      data-compact={compact || undefined}
    >
      <header className="foundry-heading">
        <p className="eyebrow">THE FOUNDRY / SRI’S WORKING COLLECTION</p>
        <h2>
          Curiosity, <em>put to work.</em>
        </h2>
        {!compact && (
          <>
            <div className="foundry-aside">
              <p className="foundry-lede">
                Builds, hackathon weekends, iPhone apps and experiments. The
                finished ones come first; everything else is in the index.
              </p>
              <p className="foundry-links">
                <a href="/resume">My résumé</a>
                <a
                  href="https://github.com/sbeeredd04?tab=repositories"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub <span aria-hidden="true">↗</span>
                </a>
              </p>
            </div>
            <dl className="foundry-stats">
              {stats.map(([n, label]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{pad(n)}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </header>
      {!compact && <WorkNav items={sections} />}

      <section
        className="work-block work-cases"
        aria-labelledby="selected-work"
      >
        <SectionHead
          id="selected-work"
          no="01"
          title="Selected work"
          note={`${pad(selected.length)} builds, each with its story.`}
        />
        <div className="case-list">
          {selected.map((p, i) => (
            <WorkCaseFile
              key={p.id}
              p={p}
              index={i}
              open={openCase === p.id}
              onToggle={toggleCase}
            />
          ))}
        </div>
      </section>

      {!compact && (
        <>
          <section className="work-block" aria-labelledby="shelf-mobile">
            <SectionHead
              id="shelf-mobile"
              no="02"
              title={byId.mobile.label}
              note="One app on the App Store, a Swift exploration, and a SwiftUI learning project."
            />
            <WorkShelf group={byId.mobile} onRead={reveal} />
          </section>
          <section className="work-block" aria-labelledby="shelf-hackathons">
            <SectionHead
              id="shelf-hackathons"
              no="03"
              title={byId.hackathons.label}
              note="Ideas I tested through hackathons, from Devils Invent to AZ Spark and Voxel51."
            />
            <WorkShelf group={byId.hackathons} onRead={reveal} />
          </section>
          <section className="work-block" aria-labelledby="foundry-desk">
            <SectionHead
              id="foundry-desk"
              no="04"
              title="Try an idea"
              note="A small, illustrated walkthrough of how four of the builds work."
            />
            <FoundryDesk onRead={reveal} />
          </section>
        </>
      )}

      {showIndex ? (
        <section
          className="work-block work-index"
          id="foundry-archive"
          aria-labelledby="work-index-title"
        >
          <SectionHead
            id="work-index-title"
            no={compact ? "02" : "05"}
            title="The index"
            note="Everything in one sortable list: hackathons, iPhone apps, experiments and the beginnings that stayed with me."
          />
          <WorkIndex
            groups={groups}
            rows={rows}
            query={query}
            onQuery={(value) => {
              clearProjectAnchor();
              setQuery(value);
            }}
            filter={filter}
            onFilter={(id) => {
              clearProjectAnchor();
              setFilter(id);
            }}
            tool={tool}
            onClearTool={() => setTool(null)}
            sort={sort}
            onSort={sortBy}
            openRow={openRow}
            onToggle={toggleRow}
            shelvesShown={shelvesShown}
            onShelves={() => setShelvesShown((v) => !v)}
            hiddenShelves={hiddenShelves}
            onReset={() => {
              setQuery("");
              setTool(null);
              setFilter("all");
            }}
          />
        </section>
      ) : (
        <a className="work-index-cta" href="/rooms/work#foundry-archive">
          <span>
            The full index: hackathons, iPhone apps, experiments and early
            builds
          </span>
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}
