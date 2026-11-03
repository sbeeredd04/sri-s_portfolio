"use client";
import { useId, useState } from "react";
const layers = [
  {
    name: "Context",
    label: "What should it know?",
    text: "The task, relevant evidence, constraints, and the state worth carrying forward.",
  },
  {
    name: "Tools",
    label: "What can it do?",
    text: "Clear inputs, bounded permissions, and results the agent can use on its next turn.",
  },
  {
    name: "Feedback",
    label: "Did it actually work?",
    text: "Tests and traces turn an outcome into evidence. That evidence becomes context for the next step.",
  },
];
export default function HarnessFigure({ onCue, cover = false }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div
      className={`harness-figure ${cover ? "is-cover" : ""}`}
      data-layer={active}
    >
      <svg
        viewBox="0 0 540 410"
        role="img"
        aria-label="The model surrounded by context, tools and feedback in a continuous loop"
      >
        <defs>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#e2b878" stopOpacity=".18" />
            <stop offset="1" stopColor="#e2b878" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-model`} x2="0" y2="1">
            <stop stopColor="#334751" />
            <stop offset="1" stopColor="#152832" />
          </linearGradient>
        </defs>
        <circle cx="270" cy="205" r="200" fill={`url(#${id}-light)`} />
        <g className="harness-orbits" fill="none" stroke="currentColor">
          <ellipse cx="270" cy="205" rx="194" ry="141" opacity=".12" />
          <ellipse cx="270" cy="205" rx="140" ry="96" opacity=".12" />
          <path
            d="M130 205H210M330 205H411M270 245V319M270 165V82"
            opacity=".25"
          />
          <path
            className="harness-flow"
            d="M129 190C151 45 413 45 413 201C413 289 364 335 277 335"
            strokeDasharray="3 8"
            opacity=".5"
          />
        </g>
        <g className="harness-model">
          <rect
            x="204"
            y="163"
            width="132"
            height="84"
            rx="15"
            fill={`url(#${id}-model)`}
            stroke="#acc3c3"
            strokeOpacity=".6"
          />
          <text
            x="270"
            y="200"
            textAnchor="middle"
            fill="#f0eee5"
            fontSize="25"
            fontFamily="var(--type-editorial)"
          >
            model
          </text>
          <text
            x="270"
            y="224"
            textAnchor="middle"
            fill="#9eb4b8"
            fontSize="9"
            letterSpacing="2"
          >
            DECIDE
          </text>
        </g>
        {[
          ["CONTEXT", 130, 205],
          ["TOOLS", 413, 205],
          ["FEEDBACK", 270, 335],
        ].map(([name, x, y], i) => (
          <g
            className="harness-node"
            data-active={cover || active === i}
            key={name}
          >
            <circle cx={x} cy={y} r="6" fill="currentColor" />
            <text
              x={x}
              y={y === 335 ? y + 27 : y - 25}
              textAnchor="middle"
              fontSize="10"
              letterSpacing="1.5"
              fill="currentColor"
            >
              {name}
            </text>
          </g>
        ))}
        <text
          x="270"
          y="57"
          textAnchor="middle"
          fill="#a5b7ba"
          fontSize="9"
          letterSpacing="3"
        >
          THE HARNESS
        </text>
      </svg>
      {!cover && (
        <>
          <div
            className="harness-tabs"
            role="group"
            aria-label="Explore the harness layers"
          >
            {layers.map((layer, i) => (
              <button
                key={layer.name}
                aria-pressed={active === i}
                aria-controls={`${id}-detail`}
                onClick={() => {
                  if (active !== i) {
                    setActive(i);
                    onCue?.("reveal");
                  }
                }}
              >
                <span>0{i + 1}</span> {layer.name}
              </button>
            ))}
          </div>
          <div
            className="harness-detail"
            id={`${id}-detail`}
            aria-live="polite"
            aria-atomic="true"
          >
            <div key={active}>
              <h3>{layers[active].label}</h3>
              <p>{layers[active].text}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
