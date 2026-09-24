"use client";
import { useEffect, useRef, useState } from "react";

// Section jump links; the one in view is marked as current.
export default function WorkNav({ items }) {
  const [current, setCurrent] = useState(items[0]?.id);
  const rail = useRef(null);
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    // The current section is the last one whose top has passed 40% of the view.
    const pick = () => {
      const line = window.innerHeight * 0.4;
      const passed = targets.filter(
        (t) => t.getBoundingClientRect().top < line,
      );
      setCurrent((passed.at(-1) || targets[0])?.id);
    };
    const seen = new IntersectionObserver(pick, {
      rootMargin: "-35% 0px -60% 0px",
    });
    targets.forEach((t) => seen.observe(t));
    pick();
    return () => seen.disconnect();
  }, [items]);
  useEffect(() => {
    const list = rail.current;
    const link = list?.querySelector("[aria-current]");
    if (!link || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: link.offsetLeft - 16,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [current]);
  return (
    <nav className="work-nav" aria-label="Sections">
      <ol ref={rail} data-scroll-x="">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={current === item.id ? "true" : undefined}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              {item.label}
              {item.count != null && <span>{item.count}</span>}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
