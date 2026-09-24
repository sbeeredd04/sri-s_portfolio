"use client";
import { useEffect, useRef, useState } from "react";
import { drawExhibit } from "../../lib/exhibit-art.mjs";
import { exhibitCanvas, projectExhibits } from "../../lib/project-exhibits.mjs";

const editions = [
  {
    id: "aether",
    note: "For a thought that won’t fit in one straight line.",
    type: "AI / branching conversations",
    color: "#b8c7ff",
  },
  {
    id: "mesa",
    note: "For a story that deserves a room of its own.",
    type: "Museum / spatial storytelling",
    color: "#e4c294",
  },
  {
    id: "csdna",
    note: "For the patterns hiding in a field of points.",
    type: "Research / scientific tools",
    color: "#a9cfbb",
  },
  {
    id: "gitcue",
    note: "For the small chores between making things.",
    type: "Developer tools / Git",
    color: "#efb4a5",
  },
];

export default function FoundryDesk({ onRead }) {
  const [selected, setSelected] = useState("aether");
  const [values, setValues] = useState({});
  const canvas = useRef(null);
  const edition = editions.find((e) => e.id === selected);
  const exhibit = projectExhibits[selected];
  const value = values[selected] || exhibit.initial;
  const step = exhibit.steps.find((s) => s.id === value);
  useEffect(() => {
    let cancelled = false;
    const paint = () => {
      if (cancelled || !canvas.current) return;
      const font = getComputedStyle(canvas.current).fontFamily;
      drawExhibit(canvas.current.getContext("2d"), selected, value, font);
    };
    paint();
    document.fonts.ready.then(paint);
    return () => {
      cancelled = true;
    };
  }, [selected, value]);
  return (
    <section
      className="foundry-desk"
      aria-label="Inside a few ideas"
      style={{ "--edition": edition.color }}
    >
      <div className="desk-editions" role="group" aria-label="Choose an idea">
        {editions.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
          >
            <small>0{i + 1}</small>
            <span>{projectExhibits[item.id].name}</span>
          </button>
        ))}
      </div>
      <div className="desk-spread">
        <div className="desk-caption">
          <span className="eyebrow">{edition.type}</span>
          <h3>{edition.note}</h3>
          <p>
            I like making an idea tangible. Here’s a small sketch of how this
            one works.
          </p>
          <button className="desk-read" onClick={() => onRead(selected)}>
            The {exhibit.name} story <span aria-hidden="true">↓</span>
          </button>
          <span className="desk-margin-note">From Sri’s workbench</span>
        </div>
        <div className="desk-experiment">
          <div className="desk-art" aria-hidden="true">
            <canvas
              ref={canvas}
              width={exhibitCanvas.width}
              height={exhibitCanvas.height}
            />
          </div>
          <div
            className="desk-steps"
            role="group"
            aria-label={`${exhibit.name} walkthrough`}
          >
            {exhibit.steps.map((item, i) => (
              <button
                key={item.id}
                aria-pressed={value === item.id}
                onClick={() =>
                  setValues((old) => ({ ...old, [selected]: item.id }))
                }
              >
                <small>0{i + 1}</small>
                {item.label}
              </button>
            ))}
          </div>
          <p className="desk-result" aria-live="polite">
            {step.result}
          </p>
          <small className="desk-disclosure">
            Illustrated walkthrough · original demos in the project stories
          </small>
        </div>
      </div>
    </section>
  );
}
