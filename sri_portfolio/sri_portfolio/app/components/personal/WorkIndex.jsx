"use client";
import ProjectDemo from "./ProjectDemo";
import ProjectFieldbook from "./ProjectFieldbook";
import WorkLink from "./WorkLink";
import { projectId } from "../../lib/project-library.mjs";

export const shelves = ["drafts", "references"];
export const columns = [
  ["collection", "No."],
  ["name", "Name"],
  ["kind", "Kind"],
  ["year", "Year"],
];
const intros = {
  projects:
    "The selected builds above, each with its full story. Jump to any of them to read how it came together.",
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

function IndexRow({ p, number, group, open, onToggle }) {
  const id = projectId(p);
  const drawer = `drawer-${id}`;
  const selected = group.id === "projects";
  const expandable =
    !selected &&
    !shelves.includes(group.id) &&
    (p.description || p.story?.length);
  return (
    <tbody
      id={selected ? `index-${id}` : `project-${id}`}
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
          ) : selected ? (
            <a href={`#project-${id}`}>
              <span>{p.name}</span>
              <i aria-hidden="true">↑</i>
            </a>
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
          <WorkLink p={p} />
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

export default function WorkIndex({
  groups,
  rows,
  query,
  onQuery,
  filter,
  onFilter,
  tool,
  onClearTool,
  sort,
  onSort,
  openRow,
  onToggle,
  shelvesShown,
  onShelves,
  hiddenShelves,
  onReset,
}) {
  const count = rows.length;
  return (
    <>
      <div className="index-controls">
        <label className="index-search">
          <span className="sr-only">Search the index</span>
          <span className="index-search-glyph" aria-hidden="true">
            /
          </span>
          <input
            type="search"
            placeholder="Search: AI, music, Swift…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <div
          className="index-filters"
          role="group"
          aria-label="Filter by collection"
          data-scroll-x=""
        >
          {[["all", "All", null], ...groups.map((g) => [g.id, g.label, g])].map(
            ([id, name, g]) => (
              <button
                key={id}
                onClick={() => onFilter(id)}
                aria-pressed={filter === id}
              >
                {name}
                {g && <small>{g.items.length}</small>}
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
            <button className="index-chip" onClick={onClearTool}>
              {tool} <span aria-hidden="true">×</span>
              <span className="sr-only">Clear tool filter</span>
            </button>
          )}
          {filter === "all" && (
            <button
              className="index-chip"
              aria-pressed={shelvesShown}
              onClick={onShelves}
            >
              {shelvesShown ? "Hide" : "Show"} forks & early drafts (
              {hiddenShelves})
            </button>
          )}
        </div>
        {intros[filter] && <p className="index-intro">{intros[filter]}</p>}
      </div>
      {count > 0 && (
        <div className="index-sort" role="group" aria-label="Sort the index">
          <span aria-hidden="true">Sort</span>
          {columns.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={sort.key === key}
              onClick={() => onSort(key)}
            >
              {key === "collection" ? "Collection" : label}
            </button>
          ))}
        </div>
      )}
      {count > 0 && (
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
                  <button onClick={() => onSort(key)}>
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
              onToggle={onToggle}
            />
          ))}
        </table>
      )}
      {count === 0 && (
        <div className="index-empty">
          <strong>Nothing matches that yet.</strong>
          <button className="index-chip" onClick={onReset}>
            Show everything
          </button>
        </div>
      )}
    </>
  );
}
