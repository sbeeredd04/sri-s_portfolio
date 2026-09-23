"use client";
import { exhibitStep, projectExhibits } from "../../lib/project-exhibits.mjs";

export default function ProjectExhibitControls({
  id,
  value,
  onChange,
  onBack,
}) {
  const exhibit = projectExhibits[id],
    step = exhibitStep(id, value);
  return (
    <div className="exhibit-controls">
      <button className="exhibit-back" onClick={onBack}>
        <span aria-hidden="true">←</span> Project Town
      </button>
      <p className="exhibit-invitation">{exhibit.title}</p>
      <div
        className="exhibit-steps"
        role="group"
        aria-label={`Try ${exhibit.name}`}
      >
        {exhibit.steps.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={step.id === item.id}
            onClick={() => onChange(id, item.id)}
          >
            <span aria-hidden="true">0{i + 1}</span>
            {item.label}
          </button>
        ))}
      </div>
      <p className="exhibit-result" aria-live="polite" aria-atomic="true">
        {step.result}
      </p>
    </div>
  );
}
