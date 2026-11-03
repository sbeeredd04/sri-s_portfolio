import { dprSteps, lowerTier, TIERS } from './device-tier.mjs';

export const graphicsModes = ['auto', ...TIERS];
export const graphicsMode = value => graphicsModes.includes(value) ? value : 'auto';
export const requestedTier = (mode, ceiling) => TIERS.includes(mode) ? mode : ceiling;

// A preference change restarts its budget. Returning to Auto re-evaluates the
// device ceiling rather than inheriting a previously forced High/Low choice.
export function qualityLevel(previous, preference, ceiling) {
  const mode = graphicsMode(preference);
  if (previous?.preference === mode && previous?.ceiling === ceiling) return previous;
  return { tier: requestedTier(mode, ceiling), step: 0, preference: mode, ceiling };
}
export function declineQuality(level, deviceRatio) {
  if (level.preference !== 'auto') return level;
  if (level.step < dprSteps(level.tier, deviceRatio).length - 1)
    return { ...level, step: level.step + 1 };
  const next = lowerTier(level.tier);
  return next === level.tier ? level : { ...level, tier: next, step: 0 };
}
