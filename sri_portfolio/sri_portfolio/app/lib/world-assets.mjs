// Shared first-view resources. Warm the browser cache during the introduction,
// without decoding models or starting GPU work on the animation's main thread.
export const startupAssets = [
  "/materials/grass/color.webp",
  "/materials/grass/normal.webp",
  "/materials/grass/arm.webp",
  "/background/stars-4k.webp",
  "/atmosphere/cloud-noise-64.bin",
  "/materials/walnut-albedo.webp",
  "/models/tree-small-broadleaf.glb",
  "/models/tree-broadleaf.glb",
  "/models/tree-pine-dense.glb",
  "/models/tree-fir.glb",
];

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
