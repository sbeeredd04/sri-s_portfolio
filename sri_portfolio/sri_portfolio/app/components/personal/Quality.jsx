"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  chooseTier,
  dprSteps,
  lowerTier,
  readDevice,
  tierSettings,
  sampleFramePressure,
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
// stuttering. Pixel clarity can recover after a long stable period.
export function QualityProvider({ ceiling, onTier, active, children }) {
  // One state so a decline either sheds pixels or, at the last step, a tier.
  const [{ tier, step }, setLevel] = useState({ tier: ceiling, step: 0 });
  const settings = tierSettings[tier];
  const deviceRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio;
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
  // The Canvas owns pixel ratio (its dpr prop is re-applied on every render),
  // so the active tier is reported upward and the Canvas prop follows it.
  useEffect(() => {
    onTier?.(tier, dpr);
  }, [tier, dpr, onTier]);
  const sample = useRef({ elapsed: 0, slow: 0 });
  const stable = useRef(0);
  useFrame((_, dt) => {
    // Paused/hidden demand frames and first-use shader compilation are not
    // steady-state GPU pressure. Do not turn them into permanent downgrades.
    if (!active || !armed) {
      sample.current = { elapsed: 0, slow: 0 };
      stable.current = 0;
      return;
    }
    const s = sampleFramePressure(sample.current, dt);
    sample.current = s;
    if (s.elapsed < 3) return;
    const pressure = s.slow / s.elapsed;
    if (pressure > 0.7) {
      stable.current = 0;
      decline();
    } else if (pressure < 0.08) {
      stable.current += s.elapsed;
      // Recover only pixels within the current tier. Expensive effects stay off.
      if (stable.current >= 15 && step > 0) {
        stable.current = 0;
        setLevel((level) => ({ ...level, step: Math.max(0, level.step - 1) }));
      }
    } else stable.current = 0;
    sample.current = { elapsed: 0, slow: 0 };
  });
  return (
    <QualityContext.Provider value={{ tier, ...settings }}>
      {children}
    </QualityContext.Provider>
  );
}
