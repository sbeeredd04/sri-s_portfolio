"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { history, beginnings } from "../../json/personal";
import { workStories } from "../../json/work-stories";

// A short label for the margin, taken only from the recorded period.
function marginDate(period) {
  const years = period.match(/\d{4}/g);
  if (years?.length > 1) return `${years[0]}–${years.at(-1).slice(2)}`;
  if (years) return years[0];
  return period.split(/[ ·]/)[0];
}

function IndexCard({ entry, index, projectPage }) {
  const story = workStories[entry.name];
  return (
    <article className="xp-card">
      <header className="xp-card-head">
        <span className="xp-stamp">{entry.period}</span>
        <span className="xp-folio" aria-hidden="true">
          No. {String(index + 1).padStart(2, "0")}
        </span>
      </header>
      <h3>{entry.name}</h3>
      <p className="xp-role">
        {entry.role}
        {story?.setting && <span> · {story.setting}</span>}
      </p>
      {!story && <p className="xp-summary">{entry.description}</p>}
      {story && (
        <ol className="xp-outcomes">
          {story.chapters.map(([title, body]) => (
            <li key={title}>
              <h4>{title}</h4>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      )}
      {index === 0 && (
        <p className="xp-note">
          I care about making useful things feel simple. That question follows
          me from the first conversation to the smallest interaction.
        </p>
      )}
      {story?.image && (
        <figure className="xp-photo">
          <Image
            src={story.image.src}
            alt={story.image.alt}
            width={1600}
            height={1067}
            sizes="(max-width: 700px) 85vw, 560px"
          />
          <figcaption>{story.image.caption}</figcaption>
        </figure>
      )}
      {story?.link && (
        <a className="xp-link" href={`${projectPage}${story.link.href}`}>
          {story.link.label}
          <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}

function Sparks() {
  return (
    <section className="xp-sparks" aria-labelledby="xp-sparks-title">
      <h3 id="xp-sparks-title">Before all that, a spark.</h3>
      <div>
        {beginnings.map((b) => (
          <article key={b.title}>
            <span>{b.period}</span>
            <h4>{b.title}</h4>
            <p>{b.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Project links are in-page anchors; a page without the project library
// passes the room that holds it as projectPage.
export default function ExperienceStory({
  expanded = false,
  projectPage = "",
}) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef([]);
  const move = (e, i) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[
      e.key
    ];
    let next = null;
    if (step) next = (i + step + history.length) % history.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = history.length - 1;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };
  return (
    <div className="experience-story xp">
      <header className="xp-intro">
        <p className="eyebrow">Work, people, and a few turning points</p>
        <h2>
          Building. Learning. <em>Still becoming.</em>
        </h2>
        <p className="xp-lead">
          The work has taken me from molecular-scale images to museum visitors,
          student communities, and now personal wellness. Different problems.
          More ways to see.
        </p>
        <a className="xp-resume" href="/resume">
          Read my résumé <span aria-hidden="true">→</span>
        </a>
      </header>
      {expanded ? (
        <ol className="xp-timeline">
          {history.map((entry, i) => (
            <li key={entry.name}>
              <span className="xp-year" aria-hidden="true">
                {marginDate(entry.period)}
              </span>
              <IndexCard entry={entry} index={i} projectPage={projectPage} />
            </li>
          ))}
        </ol>
      ) : (
        <div className="xp-archive">
          <div
            className="xp-spine"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Work and education"
          >
            {history.map((h, i) => (
              <button
                key={h.name}
                ref={(el) => (tabs.current[i] = el)}
                role="tab"
                id={`xp-tab-${i}`}
                aria-selected={selected === i}
                aria-controls="xp-drawer"
                tabIndex={selected === i ? 0 : -1}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => move(e, i)}
              >
                <span className="xp-tab-date">{marginDate(h.period)}</span>
                <span className="xp-tab-name">{h.name}</span>
                <small>{h.role}</small>
              </button>
            ))}
          </div>
          <div
            id="xp-drawer"
            className="xp-drawer"
            role="tabpanel"
            aria-labelledby={`xp-tab-${selected}`}
            tabIndex={0}
          >
            <div className="xp-drawer-card" key={selected}>
              <IndexCard
                entry={history[selected]}
                index={selected}
                projectPage={projectPage}
              />
            </div>
            <div className="xp-behind" aria-hidden="true">
              <i />
              <i />
            </div>
          </div>
        </div>
      )}
      <Sparks />
    </div>
  );
}
