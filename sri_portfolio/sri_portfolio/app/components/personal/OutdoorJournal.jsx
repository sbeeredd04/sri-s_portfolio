"use client";

import { useId, useState } from "react";
import styles from "./OutdoorJournal.module.css";

const FRAMES = [
  {
    id: "landscape",
    label: "Landscape",
    viewBox: "0 0 960 640",
    note: "A wide frame holds the path and the sky in one look. You notice where the light falls, and what leads the eye across the walk.",
  },
  {
    id: "detail",
    label: "Detail",
    viewBox: "652 328 224 224",
    note: "A tight crop keeps one thing: an edge of light, a texture, a shadow. That is how you find what is worth keeping.",
  },
  {
    id: "portrait",
    label: "Portrait",
    viewBox: "366 48 270 450",
    note: "A tall frame suits height: trees on a trail, or a street that rises. It leaves air above the subject and asks you to look up.",
  },
];

const PLACES = ["Sequoia", "Sonoma", "Catalina"];

function conifer(x, base, height, spread) {
  const top = base - height;
  const waist = base - height * 0.45;
  const skirt = base - height * 0.16;
  return [
    `M${x} ${base} L${x} ${skirt}`,
    `M${x} ${top} L${x - spread} ${waist} L${x + spread} ${waist} Z`,
    `M${x} ${top + height * 0.32} L${x - spread * 1.2} ${skirt} L${x + spread * 1.2} ${skirt} Z`,
  ];
}

function ViewfinderScene() {
  const trees = [
    ...conifer(482, 440, 230, 34),
    ...conifer(536, 452, 250, 36),
    ...conifer(584, 436, 200, 26),
  ];
  return (
    <>
      <g className={styles.faint}>
        <path d="M48 188 C120 156 190 176 250 148" />
        <path d="M36 230 C130 196 210 220 310 176" />
        <path d="M24 274 C140 236 230 262 340 214" />
        <path d="M420 156 C490 120 560 150 620 128" />
      </g>
      <g className={styles.sun}>
        <circle cx="812" cy="112" r="22" />
        <path d="M812 78 V66 M812 158 V146 M776 112 H764 M848 112 H860 M786 86 L776 76 M838 86 L848 76 M786 138 L776 148 M838 138 L848 148" />
      </g>
      <g className={styles.ink}>
        <path d="M0 500 C220 470 400 520 560 492" />
        <path d="M540 508 C640 536 780 528 920 496" />
        <path d="M0 452 C170 418 320 448 470 428 C560 416 600 428 628 440" />
        <path d="M50 610 C160 560 250 540 340 508 C430 474 490 468 540 452" />
        {trees.map((d) => (
          <path key={d} d={d} />
        ))}
        <path d="M455 448 L449 434 M478 452 L472 436 M508 456 L514 440 M560 448 L554 434 M600 442 L606 428" />
        <path d="M678 424 C708 376 786 370 822 410 C834 440 796 468 736 470 C684 472 662 446 678 424 Z" />
        <path d="M700 430 L758 450 M718 418 L776 440 M738 408 L796 430 M756 400 L810 422" />
        <path d="M668 496 C740 484 800 498 836 476" />
        <path d="M700 504 L706 488 M738 506 L744 488 M778 502 L784 486 M812 496 L818 482" />
      </g>
      <path
        className={styles.lightEdge}
        d="M684 404 C735 362 795 360 824 398"
      />
    </>
  );
}

function ContourPlate() {
  return (
    <svg className={styles.contour} viewBox="0 0 680 400" aria-hidden="true">
      <g className={styles.ink}>
        <path d="M24 48 H48 M24 48 V72 M656 48 H632 M656 48 V72 M24 352 H48 M24 352 V328 M656 352 H632 M656 352 V328" />
        <path d="M70 268 C160 220 230 246 310 196 C390 146 450 176 560 156 C610 146 640 164 656 176" />
        <path d="M58 222 C150 168 230 198 330 150 C420 106 480 136 650 158" />
        <path d="M78 312 C180 268 270 292 360 248 C450 204 510 228 652 236" />
        <path d="M92 348 C200 316 310 334 420 292 C510 258 570 280 654 292" />
        <path d="M118 346 C190 328 250 312 330 322" />
      </g>
      <path
        className={styles.lightEdge}
        d="M300 186 C380 154 460 172 548 160"
      />
    </svg>
  );
}

export default function OutdoorJournal() {
  const [frameId, setFrameId] = useState("landscape");
  const frame = FRAMES.find((item) => item.id === frameId) ?? FRAMES[0];
  const baseId = useId();
  const noteId = `${baseId}-note`;
  const wishId = `${baseId}-wish`;
  const plateId = `${baseId}-plate`;

  return (
    <article className={styles.journal} data-outdoor-journal="">
      <div className={styles.top}>
        <header className={styles.intro}>
          <p className={styles.kicker}>
            <span>Outdoors</span>
            <span>Field notes</span>
          </p>
          <div className={styles.rule} aria-hidden="true" />
          <h2 className={styles.masthead}>
            <span className={styles.line}>A different</span>
            <span className={styles.lineAlt}>
              <em>angle.</em>
            </span>
          </h2>
          <p className={styles.lead}>
            A new city. A good hike. Something worth stopping to look at.
          </p>
          <p className={styles.prose}>
            Photography is another part of my life.
          </p>
        </header>
        <div className={styles.instrument}>
          <div className={styles.instrumentBody}>
            <figure className={styles.figure}>
              <div className={styles.frame} data-frame={frame.id}>
                <svg
                  className={styles.scene}
                  viewBox={frame.viewBox}
                  aria-hidden="true"
                >
                  <ViewfinderScene />
                </svg>
                <span className={styles.brackets} aria-hidden="true" />
              </div>
              <figcaption className={styles.caption}>
                <span>{frame.label} crop</span>
                <span>Illustrated field study</span>
              </figcaption>
            </figure>
            <div>
              <div className={styles.controlLabel} id={`${baseId}-framing`}>
                Framing
              </div>
              <div
                className={styles.controls}
                role="group"
                aria-labelledby={`${baseId}-framing`}
              >
                {FRAMES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.frameButton}
                    aria-pressed={item.id === frame.id}
                    aria-controls={noteId}
                    onClick={() => setFrameId(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <p
              className={styles.note}
              id={noteId}
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="sr-only">{frame.label}. </span>
              {frame.note}
            </p>
          </div>
        </div>
      </div>

      <section className={styles.section} aria-label="On foot">
        <p className={styles.sectionLabel}>On foot</p>
        <div className={styles.interests}>
          <article>
            <h3 className={styles.heading}>A good hike</h3>
            <p className={styles.prose}>
              Hiking belongs in my life alongside the things I make. The valley
              here takes its inspiration from Yosemite.
            </p>
          </article>
          <article className={styles.city}>
            <h3 className={styles.heading}>A new city</h3>
            <p className={styles.prose}>
              I love exploring cities, too. This part of my world connects the
              trail with the Bay and the places I spend my evenings.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby={wishId}>
        <p className={styles.sectionLabel}>Still ahead</p>
        <h3 className={styles.heading} id={wishId}>
          The macOS road trip
        </h3>
        <p className={styles.prose}>
          I want to visit the places in California that inspired the macOS
          names. A very me way of planning an adventure.
        </p>
        <ol className={styles.places}>
          {PLACES.map((name, index) => (
            <li key={name} className={styles.place}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.placeName}>{name}</span>
              <span className={styles.placeMeta}>
                California · On the wish list
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby={plateId}>
        <div className={styles.plate}>
          <div className={styles.plateCopy}>
            <p className={styles.sectionLabel}>Collection to come</p>
            <h3 className={styles.heading} id={plateId}>
              Through my lens.
            </h3>
            <p className={styles.prose}>
              I’ve taken photographs over the years, and I’ll be bringing a
              selection here. A place for the world as I’ve seen it.
            </p>
          </div>
          <figure className={styles.plateFigure}>
            <ContourPlate />
            <figcaption className={styles.plateCaption}>
              Contour study. Drawn for this page.
            </figcaption>
          </figure>
        </div>
      </section>
    </article>
  );
}
