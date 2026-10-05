// Shared first-view resources. Warm the browser cache during the introduction,
// without decoding models or starting GPU work on the animation's main thread.
export const startupAssets = [
  "/materials/grass/color.webp",
  "/materials/grass/normal.webp",
  "/materials/grass/arm.webp",
  "/atmosphere/cloud-noise-64.bin",
  "/materials/walnut-albedo.webp",
  "/models/compact/tree-small-broadleaf.glb",
  "/models/compact/tree-broadleaf.glb",
  "/models/compact/tree-pine-dense.glb",
  "/models/compact/tree-fir.glb",
];

export function startupAssetsForTier(tier) {
  return tier === "low"
    ? startupAssets.map((url) =>
        url.startsWith("/materials/grass/")
          ? url.replace("/materials/", "/materials/mobile/")
          : url,
      )
    : startupAssets;
}

const compactModels = new Set(
  startupAssets
    .filter((url) => url.includes("/compact/"))
    .map((url) => url.replace("/compact/", "/")),
);
export function modelSource(src, lod) {
  return lod > 0 && compactModels.has(src)
    ? src.replace("/models/", "/models/compact/")
    : src;
}

export function createAssetPreloader({
  assets = startupAssets,
  fetchAsset = (...args) => fetch(...args),
  onProgress = () => {},
} = {}) {
  let pending;
  return () =>
    (pending ||= (async () => {
      let next = 0,
        loaded = 0;
      const worker = async () => {
        while (next < assets.length) {
          const url = assets[next++];
          try {
            const response = await fetchAsset(url);
            if (!response.ok) continue;
            await response.arrayBuffer();
            onProgress({ downloads: ++loaded, downloadTotal: assets.length });
          } catch {
            // The real scene loader can retry; a failed preload is not completion.
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(3, assets.length) }, worker),
      );
    })());
}
