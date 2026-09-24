"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  chooseTier,
  lowerTier,
  raiseTier,
  readDevice,
  tierSettings,
} from "../../lib/device-tier.mjs";

const QualityContext = createContext({
  tier: "medium",
  ...tierSettings.medium,
});
export const useQuality = () => useContext(QualityContext);

export function initialTier() {
  try {
    const forced = new URLSearchParams(location.search).get("quality");
    if (forced && tierSettings[forced]) return forced;
    return chooseTier(readDevice());
  } catch {
    return "medium";
  }
}

// Lives inside the Canvas. Starts at the device's ceiling and steps down when
// sustained frame rate falls, so an overloaded phone recovers instead of
// stuttering; it only climbs back toward the original ceiling.
export function QualityProvider({ ceiling, onTier, children }) {
  const [tier, setTier] = useState(ceiling);
  const setDpr = useThree((s) => s.setDpr);
  const settings = tierSettings[tier];
  useEffect(() => {
    const [min, max] = settings.dpr;
    setDpr(Math.max(min, Math.min(max, window.devicePixelRatio || 1)));
    onTier?.(tier);
  }, [tier, settings, setDpr, onTier]);
  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [50, 90] : [38, 58])}
      flipflops={3}
      onDecline={() => setTier((t) => lowerTier(t))}
      onIncline={() => setTier((t) => raiseTier(t, ceiling))}
    >
      <QualityContext.Provider value={{ tier, ...settings }}>
        {children}
      </QualityContext.Provider>
    </PerformanceMonitor>
  );
}
