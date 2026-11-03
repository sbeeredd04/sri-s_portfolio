"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
// Static views render on demand. Ambient animation schedules frames only while
// visible, and never spends a 120Hz panel's full refresh budget.
export default function IslandAnimationDriver({ active }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let frame,
      previous = 0;
    const tick = (now) => {
      if (document.hidden || !active) return;
      if (now - previous >= 1000 / 60 - 0.3) {
        previous = now;
        invalidate();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      invalidate();
      if (active && !document.hidden) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, invalidate]);
  return null;
}
