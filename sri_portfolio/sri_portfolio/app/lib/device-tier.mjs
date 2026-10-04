// Chooses a rendering budget from what the device reports before the first
// frame, then lets the runtime frame-rate monitor step it down (never above
// the starting ceiling). Pure so it can be unit tested without a GPU.

export const TIERS = ["low", "medium", "high"];

export const tierSettings = {
  low: {
    dpr: [1, 1.25],
    ao: false,
    bloom: false,
    shadows: false,
    shadowMap: 512,
    shadowEvery: 2,
    multisampling: 0,
    smaa: true,
    textureScale: 0.5,
    anisotropy: 2,
  },
  medium: {
    dpr: [1, 1.5],
    ao: false,
    bloom: true,
    shadows: true,
    shadowMap: 1024,
    shadowEvery: 4,
    multisampling: 0,
    smaa: true,
    textureScale: 1,
    anisotropy: 4,
  },
  high: {
    // 1.75x on a Retina laptop is within a few percent of native sharpness
    // (MSAA covers edges) at roughly three quarters of the fill cost of 2x.
    dpr: [1, 1.75],
    ao: true,
    bloom: true,
    shadows: true,
    shadowMap: 2048,
    shadowEvery: 2,
    multisampling: 4,
    smaa: false,
    textureScale: 1,
    anisotropy: 8,
  },
};

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const WEAK_GPU =
  /mali-[gt]?[0-7]\d|adreno \(tm\) [2-5]\d\d|powervr|intel\(r\) (hd|uhd) graphics [2-6]\d\d|intel hd graphics|gma/i;

export function chooseTier({
  renderer = "",
  memory, // navigator.deviceMemory (GB, Chromium only; undefined elsewhere)
  coarse = false,
  saveData = false,
} = {}) {
  if (SOFTWARE.test(renderer) || saveData) return "low";
  if (memory !== undefined && memory <= 2) return "low";
  if (WEAK_GPU.test(renderer)) return coarse ? "low" : "medium";
  // Touch devices include iPads reporting a desktop-sized screen/Apple GPU.
  // Start with a predictable budget; rich graphics remain explicitly opt-in.
  if (coarse) return "low";

  return "medium";
}

export function lowerTier(tier) {
  return TIERS[Math.max(0, TIERS.indexOf(tier) - 1)];
}

export function raiseTier(tier, ceiling) {
  const next = TIERS[Math.min(TIERS.length - 1, TIERS.indexOf(tier) + 1)];
  return TIERS.indexOf(next) > TIERS.indexOf(ceiling) ? tier : next;
}

export function readDevice() {
  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    renderer = String(
      (info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) ||
        gl?.getParameter(gl.RENDERER) ||
        "",
    );
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /* An unknown renderer falls back to the conservative memory/touch heuristics. */
  }
  return {
    renderer,
    cores: navigator.hardwareConcurrency || 4,
    memory: navigator.deviceMemory,
    coarse: matchMedia("(pointer: coarse)").matches,
    width: screen.width,
    height: screen.height,
    saveData: Boolean(navigator.connection?.saveData),
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

// Pixel ratios to try, sharpest first, before a tier drop. Changing the ratio
// only resizes buffers; changing tier recompiles shaders and remounts passes.
export function dprSteps(tier, deviceRatio = 2) {
  const [min, max] = tierSettings[tier].dpr;
  const top = Math.max(min, Math.min(max, deviceRatio));
  const steps = [top];
  for (let r = top - 0.25; r >= Math.max(min, top - 0.5) - 1e-6; r -= 0.25)
    steps.push(+r.toFixed(2));
  return steps;
}

// Cap a single stall's weight without excluding sustained multi-second stalls.
// Ignoring every long frame prevents the weakest devices from ever recovering.
export function sampleFramePressure(sample, delta) {
  const dt = Math.min(Math.max(delta, 0), 0.5);
  return {
    elapsed: sample.elapsed + dt,
    slow: sample.slow + (dt > 1 / 45 ? dt : 0),
  };
}

export function initialTier() {
  try {
    const forced = new URLSearchParams(location.search).get("quality");
    if (forced && tierSettings[forced]) return forced;
    return chooseTier(readDevice());
  } catch {
    return "medium";
  }
}
