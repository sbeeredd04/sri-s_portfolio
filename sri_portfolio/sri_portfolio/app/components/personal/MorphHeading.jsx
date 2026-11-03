"use client";
import { useLayoutEffect, useRef } from "react";
import { biomeSkinStyle } from "../../lib/biome-skins.mjs";
import {
  MORPH,
  decodedGlyph,
  glyphStart,
  skinIdentity,
} from "../../lib/biome-morph.mjs";

const easing = "cubic-bezier(.22,1,.36,1)";

/** A bounded letter/layout transition. Controls stay mounted and focus never moves. */
export default function MorphHeading({
  biome,
  stop,
  eyebrow,
  title,
  description,
  compact,
  motion,
}) {
  const stage = useRef(null);
  const copy = useRef(null);
  const ghost = useRef(null);
  const previous = useRef(null);

  useLayoutEffect(() => {
    const surface = stage.current;
    const content = copy.current;
    const layer = ghost.current;
    const inks = [...content.querySelectorAll(".biome-glyph-ink")];
    const letters = [...title].filter((letter) => !/\s/u.test(letter));
    const animations = [];
    let timer,
      finishTimer,
      disposed = false,
      running = false;
    const restore = () =>
      inks.forEach((ink, i) => {
        ink.textContent = letters[i];
      });
    const capture = () => {
      const origin = surface.getBoundingClientRect();
      const clone = content.cloneNode(true);
      clone.style.textAlign = getComputedStyle(content).textAlign;
      for (const selector of [
        ".biome-title",
        ".eyebrow",
        ".biome-heading-number",
        ".biome-heading-label",
        ".narrative-copy",
      ]) {
        const original = content.querySelector(selector);
        const duplicate = clone.querySelector(selector);
        if (original && duplicate) {
          const style = getComputedStyle(original);
          duplicate.style.font = style.font;
          duplicate.style.letterSpacing = style.letterSpacing;
          duplicate.style.margin = style.margin;
          duplicate.style.padding = style.padding;
          duplicate.style.display = style.display;
          duplicate.style.gap = style.gap;
        }
      }
      previous.current = {
        biome,
        stop,
        height: content.getBoundingClientRect().height,
        clone,
        glyphs: inks.map((ink) => {
          const box = ink.getBoundingClientRect();
          return {
            x: box.x - origin.x,
            y: box.y - origin.y,
            height: box.height,
          };
        }),
      };
    };
    const before = previous.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      clearInterval(timer);
      clearTimeout(finishTimer);
      animations.forEach((animation) => animation.cancel());
      layer.replaceChildren();
      restore();
      running = false;
      delete surface.dataset.morphing;
      if (!disposed) capture();
    };
    if (
      before &&
      (before.biome !== biome || before.stop !== stop) &&
      motion &&
      !reduced.matches
    ) {
      running = true;
      surface.dataset.morphing = "true";
      const changingSkin = skinIdentity(before.biome) !== skinIdentity(biome);
      const duration = changingSkin ? MORPH.duration : 300;
      const origin = surface.getBoundingClientRect();
      const height = content.getBoundingClientRect().height;
      capture();
      const leaving = before.clone;
      // The departing layer contains no heading semantics or focusable content.
      leaving.querySelector("h1")?.remove();
      layer.append(leaving);
      animations.push(
        leaving.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-4px)" },
          ],
          { duration: changingSkin ? 190 : 130, fill: "forwards" },
        ),
      );
      animations.push(
        surface.animate(
          [{ height: `${before.height}px` }, { height: `${height}px` }],
          { duration, easing },
        ),
      );
      if (changingSkin) {
        // All reads precede animation writes. Glyph boxes retain the final word
        // widths, so the decoder cannot make the paragraph or card jitter.
        const targets = inks.map((ink) => ink.getBoundingClientRect());
        inks.forEach((ink, i) => {
          const from = before.glyphs[Math.min(i, before.glyphs.length - 1)];
          const target = targets[i];
          const dx = Math.max(
            -24,
            Math.min(24, (from?.x ?? 0) - (target.x - origin.x)),
          );
          const dy = Math.max(
            -12,
            Math.min(12, (from?.y ?? 0) - (target.y - origin.y)),
          );
          const scale = Math.max(
            0.75,
            Math.min(1.3, (from?.height || target.height) / target.height),
          );
          animations.push(
            ink.animate(
              [
                {
                  opacity: 0,
                  transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
                },
                { opacity: 0.7, offset: 0.35 },
                { opacity: 1, transform: "translate(0,0) scale(1)" },
              ],
              {
                duration: 330,
                delay: glyphStart(i, inks.length),
                easing,
                fill: "both",
              },
            ),
          );
        });
        const started = performance.now();
        const decode = () =>
          inks.forEach((ink, i) => {
            ink.textContent = decodedGlyph(
              letters[i],
              i,
              inks.length,
              performance.now() - started,
              biome,
            );
          });
        decode();
        timer = setInterval(decode, 50);
        for (const element of content.querySelectorAll(
          ".eyebrow,.narrative-copy",
        )) {
          animations.push(
            element.animate(
              [
                { opacity: 0, transform: "translateY(5px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 430, delay: 220, easing, fill: "both" },
            ),
          );
        }
      } else {
        animations.push(
          content.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration,
            easing,
          }),
        );
      }
      finishTimer = setTimeout(finish, duration);
    } else capture();
    const onPreference = () => {
      if (reduced.matches) finish();
    };
    reduced.addEventListener("change", onPreference);
    const resize = new ResizeObserver(() => {
      if (!running) capture();
    });
    resize.observe(content);
    // Refresh positions if a local font arrives after the first render.
    document.fonts.ready.then(() => {
      if (!disposed && !running) capture();
    });
    return () => {
      disposed = true;
      finish();
      resize.disconnect();
      reduced.removeEventListener("change", onPreference);
    };
    // Weather/clock renders don't replay the score.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome, stop, motion, title]);

  return (
    <div className="biome-heading-stage" ref={stage}>
      <div className="biome-heading-ghost" ref={ghost} aria-hidden="true" />
      <div
        className="biome-heading-copy"
        style={biomeSkinStyle(biome)}
        ref={copy}
      >
        <p className="eyebrow">
          <span className="biome-heading-number">
            {eyebrow.split(" / ")[0]}
          </span>
          <span className="biome-heading-slash" aria-hidden="true">
            {" "}
            /{" "}
          </span>
          <span className="biome-heading-label">
            {eyebrow.split(" / ").slice(1).join(" / ")}
          </span>
        </p>
        <h1 className="biome-heading-accessible">{title}</h1>
        <div className="biome-title" aria-hidden="true">
          <span aria-hidden="true" key={title}>
            {title.split(/(\s+)/u).map((word, i) =>
              /\s/u.test(word) ? (
                word
              ) : (
                <span className="biome-heading-word" key={i}>
                  {[...word].map((letter, j) => (
                    <span className="biome-heading-glyph" key={j}>
                      <span className="biome-glyph-measure">{letter}</span>
                      <span className="biome-glyph-ink">{letter}</span>
                    </span>
                  ))}
                </span>
              ),
            )}
          </span>
        </div>
        {!compact && <p className="narrative-copy">{description}</p>}
      </div>
    </div>
  );
}
