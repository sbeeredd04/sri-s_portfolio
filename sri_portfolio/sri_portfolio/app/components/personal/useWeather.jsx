"use client";
import { useEffect, useState } from "react";
import { fallbackWeather, weatherOverride } from "../../lib/weather.mjs";

const REFRESH = 15 * 60 * 1000;

// Live SF weather, refreshed while the page is visible. `?weather=` pins a
// preset for review; a failed request keeps the labelled clear fallback.
export default function useWeather() {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    const forced = weatherOverride(window.location.search);
    if (forced) {
      setWeather(forced);
      return;
    }
    let timer,
      controller,
      fetchedAt = 0;
    const refresh = async () => {
      clearTimeout(timer);
      if (document.hidden) return;
      const wait = fetchedAt + REFRESH - Date.now();
      if (wait > 0) {
        timer = setTimeout(refresh, wait);
        return;
      }
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/weather", {
          signal: controller.signal,
        });
        setWeather(response.ok ? await response.json() : fallbackWeather);
      } catch (error) {
        if (error?.name === "AbortError") return;
        setWeather(fallbackWeather);
      }
      fetchedAt = Date.now();
      timer = setTimeout(refresh, REFRESH);
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return weather;
}
