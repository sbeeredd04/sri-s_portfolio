"use client";
import { useState } from "react";
import Image from "next/image";
import { history, beginnings } from "../../json/personal";
import { workStories } from "../../json/work-stories";
// Project links are in-page anchors; a page without the project library
// passes the room that holds it as projectPage.
export default function ExperienceStory({
  expanded = false,
  projectPage = "",
}) {
  const [selected, setSelected] = useState(0),
    item = history[selected];
  return (
    <div className="experience-story">
      <p className="eyebrow">WORK, PEOPLE, AND A FEW TURNING POINTS</p>
      <h2>
        Building. Learning.
        <br />
        Still becoming.
      </h2>
      <p className="app-lead">
        The work has taken me from molecular-scale images to museum visitors,
        student communities, and now personal wellness. Different problems. More
        ways to see.
      </p>
      <a className="app-action" href="/resume">
        Read my résumé ↗
      </a>
      {!expanded && (
        <div
          className="experience-selector"
          role="group"
          aria-label="Explore work and education"
        >
          {history.map((h, i) => (
            <button
              key={h.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>0{i + 1}</span>
              {h.name}
            </button>
          ))}
        </div>
      )}
      {(expanded ? history : [item]).map((entry, n) => {
        const entryIndex = expanded ? n : selected;
        const story = workStories[entry.name];
        return (
          <article
            className="experience-feature"
            key={entry.name}
            aria-live={expanded ? undefined : "polite"}
          >
            <span className="eyebrow">{entry.period}</span>
            <h3>{entry.name}</h3>
            <p className="experience-role">{entry.role}</p>
            {!story && <p>{entry.description}</p>}
            {story && (
              <div className="work-dossier">
                <p className="work-setting">{story.setting}</p>
                <div className="work-chapters">
                  {story.chapters.map(([title, body], i) => (
                    <section key={title}>
                      <span className="work-chapter-number" aria-hidden="true">
                        0{i + 1}
                      </span>
                      <div>
                        <h4>{title}</h4>
                        <p>{body}</p>
                      </div>
                    </section>
                  ))}
                </div>
                {story.image && (
                  <figure className="work-photo">
                    <Image
                      src={story.image.src}
                      alt={story.image.alt}
                      width={1600}
                      height={1067}
                      sizes="(max-width: 600px) 85vw, 700px"
                    />
                    <figcaption>{story.image.caption}</figcaption>
                  </figure>
                )}
                {story.link && (
                  <a
                    className="work-project-link"
                    href={`${projectPage}${story.link.href}`}
                  >
                    {story.link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            )}
            {entryIndex === 0 && (
              <p className="experience-note">
                I care about making useful things feel simple. That question
                follows me from the first conversation to the smallest
                interaction.
              </p>
            )}
          </article>
        );
      })}
      <h3 className="experience-sparks-title">Before all that, a spark.</h3>
      {beginnings.map((b) => (
        <article className="app-history" key={b.title}>
          <span className="eyebrow">{b.period}</span>
          <h3>{b.title}</h3>
          <p>{b.description}</p>
        </article>
      ))}
    </div>
  );
}
