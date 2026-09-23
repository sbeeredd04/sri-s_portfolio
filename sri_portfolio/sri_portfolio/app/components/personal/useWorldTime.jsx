"use client";
import { useEffect, useState } from "react";
import { worldTime } from "../../lib/world-time.mjs";

export default function useWorldTime() {
  const [time, setTime] = useState(null);
  useEffect(() => {
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      setTime(worldTime(new Date()));
      timer = setTimeout(refresh, 30000);
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return time;
}
