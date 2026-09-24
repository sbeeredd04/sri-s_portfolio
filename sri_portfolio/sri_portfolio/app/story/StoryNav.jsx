"use client";
import { useEffect, useState } from "react";

// Section links that mark where the reader is, and a way back to the top.
export default function StoryNav({ sections }) {
  const [current, setCurrent] = useState(sections[0][0]);
  const [past, setPast] = useState(false);
  useEffect(() => {
    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = sections.find(([id]) => seen.get(id));
        if (first) setCurrent(first[0]);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const [id] of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 1.2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sections]);
  useEffect(() => {
    // Keep the current link in view horizontally without moving the page.
    const link = document.querySelector(`.story-nav a[href="#${current}"]`);
    const strip = link?.parentElement;
    if (!strip) return;
    const { left, right } = link.getBoundingClientRect();
    const box = strip.getBoundingClientRect();
    if (left < box.left || right > box.right)
      strip.scrollBy({ left: left - box.left - 20 });
  }, [current]);
  return (
    <>
      <nav className="story-nav" aria-label="Story sections">
        <div>
          {sections.map(([id, name], i) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={current === id ? "location" : undefined}
            >
              <small aria-hidden="true">{String(i + 1).padStart(2, "0")}</small>
              {name}
            </a>
          ))}
        </div>
      </nav>
      <a className="story-top" href="#top" data-visible={past || undefined}>
        Back to top <span aria-hidden="true">↑</span>
      </a>
    </>
  );
}
