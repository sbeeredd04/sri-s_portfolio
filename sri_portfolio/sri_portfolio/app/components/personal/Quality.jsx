"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import {
  chooseTier,
  dprSteps,
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
  // One state so a decline either sheds pixels or, at the last step, a tier.
  const [{ tier, step }, setLevel] = useState({ tier: ceiling, step: 0 });
  const settings = tierSettings[tier];
  const deviceRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  const steps = dprSteps(tier, deviceRatio);
  const dpr = steps[Math.min(step, steps.length - 1)];
  // Shader compilation and texture upload stall the first seconds of every
  // visit; judging frame rate then would downgrade every device.
  // Each change remounts passes and recompiles shaders, which itself stalls a
  // frame; a cooldown after every change prevents a downgrade cascade.
  const [armed, setArmed] = useState(false);
  // A resize settles in a frame or two, so pixel steps need a shorter wait.
  useEffect(() => {
    setArmed(false);
    const timer = setTimeout(() => setArmed(true), step ? 2500 : 6000);
    return () => clearTimeout(timer);
  }, [tier, step]);
  const decline = () =>
    setLevel((l) => {
      if (l.step < dprSteps(l.tier, deviceRatio).length - 1)
        return { ...l, step: l.step + 1 };
      const next = lowerTier(l.tier);
      return next === l.tier ? l : { tier: next, step: 0 };
    });
  const incline = () =>
    setLevel((l) => {
      if (l.step > 0) return { ...l, step: l.step - 1 };
      const next = raiseTier(l.tier, ceiling);
      if (next === l.tier) return l;
      // Climb into the richer tier at its softest ratio, then sharpen.
      return { tier: next, step: dprSteps(next, deviceRatio).length - 1 };
    });
  // The Canvas owns pixel ratio (its dpr prop is re-applied on every render),
  // so the active tier is reported upward and the Canvas prop follows it.
  useEffect(() => {
    onTier?.(tier, dpr);
  }, [tier, dpr, onTier]);
  return (
    <PerformanceMonitor
      // Step down only below ~30 fps sustained (45 on high-refresh displays).
      bounds={(refresh) => (refresh > 90 ? [45, 100] : [30, 57])}
      ms={400}
      iterations={12}
      flipflops={6}
      onDecline={() => armed && decline()}
      onIncline={() => armed && incline()}
    >
      <QualityContext.Provider value={{ tier, ...settings }}>
        {children}
      </QualityContext.Provider>
    </PerformanceMonitor>
  );
}
