"use client";
import { useEffect } from "react";

// Measures the sticky header for the section rail and fades blocks in once
// as they enter view. Reduced motion skips the reveal entirely.
export default function useWorkMotion(root) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const header = document.querySelector(".site-header");
    const sync = () =>
      el.style.setProperty("--work-header", `${header?.offsetHeight || 0}px`);
    sync();
    const resize = header ? new ResizeObserver(sync) : null;
    resize?.observe(header);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      return () => resize?.disconnect();
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.dataset.shown = "";
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    el.querySelectorAll("[data-reveal]:not([data-shown])").forEach((node) =>
      reveal.observe(node),
    );
    el.dataset.motion = "";
    return () => {
      resize?.disconnect();
      reveal.disconnect();
    };
  }, [root]);
}
