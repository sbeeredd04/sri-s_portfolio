"use client";
import { useEffect, useState } from "react";

const DAY_KEY = "sri-visit-day";
let shared = null;

// The site-wide visitor total. The first page of the day counts this
// browser once; after that it only reads. null while unknown or resting.
export default function useVisitorCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let alive = true;
    const today = new Date().toISOString().slice(0, 10);
    let counted = true;
    try {
      counted = localStorage.getItem(DAY_KEY) === today;
    } catch {}
    shared ||= fetch("/api/visits", {
      method: counted ? "GET" : "POST",
      headers: counted ? undefined : { "Content-Type": "application/json" },
    })
      .then((r) => (r.ok ? r.json() : { count: null }))
      .then((data) => {
        if (!counted && Number.isInteger(data.count))
          try {
            localStorage.setItem(DAY_KEY, today);
          } catch {}
        return Number.isInteger(data.count) ? data.count : null;
      })
      .catch(() => null);
    shared.then((value) => alive && setCount(value));
    return () => {
      alive = false;
    };
  }, []);
  return count;
}
