// Chooses a rendering budget from what the device reports before the first
// frame, then lets the runtime frame-rate monitor step it down (never above
// the starting ceiling). Pure so it can be unit tested without a GPU.

export const TIERS = ["low", "medium", "high"];

export const tierSettings = {
  low: {
    dpr: [0.75, 1],
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
    shadowEvery: 2,
    multisampling: 0,
    smaa: true,
    textureScale: 1,
    anisotropy: 4,
  },
  high: {
    // 2x keeps a 1920-wide CSS canvas at native 4K on high-density displays.
    dpr: [1, 2],
    ao: true,
    bloom: true,
    shadows: true,
    shadowMap: 2048,
    shadowEvery: 1,
    multisampling: 4,
    smaa: false,
    textureScale: 1,
    anisotropy: 8,
  },
};

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const WEAK_GPU =
  /mali-[gt]?[0-7]\d|adreno \(tm\) [2-5]\d\d|powervr|intel\(r\) (hd|uhd) graphics [2-6]\d\d|intel hd graphics|gma/i;
const STRONG_GPU =
  /apple m[1-9]|apple gpu|nvidia|geforce|rtx|radeon rx|radeon pro|arc a\d|adreno \(tm\) (7[3-9]\d|8\d\d)/i;

export function chooseTier({
  renderer = "",
  cores = 4,
  memory, // navigator.deviceMemory (GB, Chromium only; undefined elsewhere)
  coarse = false,
  width = 1280,
  height = 800,
  saveData = false,
  reducedMotion = false,
} = {}) {
  if (SOFTWARE.test(renderer) || saveData) return "low";
  if (memory !== undefined && memory <= 2) return "low";
  if (WEAK_GPU.test(renderer)) return coarse ? "low" : "medium";
  const phone = coarse && Math.min(width, height) < 600;
  if (phone) {
    // Recent flagship phones handle bloom and 1.5x but not AO at 3x density.
    if (cores >= 6 && (memory === undefined || memory >= 4)) return "medium";
    return "low";
  }
  if (STRONG_GPU.test(renderer) && cores >= 8) return "high";
  if (coarse) return "medium"; // tablets
  if (cores >= 8 && (memory === undefined || memory >= 8))
    return reducedMotion ? "medium" : "high";
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
    /* An unknown renderer falls back to the core/memory heuristics. */
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
