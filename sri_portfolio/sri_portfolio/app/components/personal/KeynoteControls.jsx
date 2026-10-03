"use client";
import { keynoteSlides } from "../../lib/keynote.mjs";
export default function KeynoteControls({ index, onChange, onOpen }) {
  const slide = keynoteSlides[index];
  return (
    <section className="keynote-controls" aria-label="Keynote presentation">
      <p className="keynote-eyebrow">
        SELECTED WORK · {String(index + 1).padStart(2, "0")} / 06
      </p>
      <div aria-live="polite" aria-atomic="true">
        <h2>{slide.name}</h2>
        <p>{slide.line}</p>
      </div>
      <div className="keynote-actions">
        <button
          aria-label="Previous project slide"
          onClick={() =>
            onChange((index + keynoteSlides.length - 1) % keynoteSlides.length)
          }
        >
          ←
        </button>
        <button onClick={() => onOpen(slide.id)}>Read the project ↗</button>
        <button
          aria-label="Next project slide"
          onClick={() => onChange((index + 1) % keynoteSlides.length)}
        >
          →
        </button>
      </div>
    </section>
  );
}
