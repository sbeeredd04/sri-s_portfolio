"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
  const settings = tierSettings[tier];
  // Shader compilation and texture upload stall the first seconds of every
  // visit; judging frame rate then would downgrade every device.
  // Each change remounts passes and recompiles shaders, which itself stalls a
  // frame; a cooldown after every change prevents a downgrade cascade.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    const timer = setTimeout(() => setArmed(true), 6000);
    return () => clearTimeout(timer);
  }, [tier]);
  // The Canvas owns pixel ratio (its dpr prop is re-applied on every render),
  // so the active tier is reported upward and the Canvas prop follows it.
  useEffect(() => {
    onTier?.(tier);
  }, [tier, onTier]);
  return (
    <PerformanceMonitor
      // Step down only below ~30 fps sustained (45 on high-refresh displays).
      bounds={(refresh) => (refresh > 90 ? [45, 100] : [30, 57])}
      ms={400}
      iterations={12}
      flipflops={3}
      onDecline={() => armed && setTier((t) => lowerTier(t))}
      onIncline={() => armed && setTier((t) => raiseTier(t, ceiling))}
    >
      <QualityContext.Provider value={{ tier, ...settings }}>
        {children}
      </QualityContext.Provider>
    </PerformanceMonitor>
  );
}
