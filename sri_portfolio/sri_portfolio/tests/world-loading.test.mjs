import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorldLoading,
  entranceReadiness,
} from "../app/lib/world-loading.mjs";
import {
  createAssetPreloader,
  startupAssets,
} from "../app/lib/world-assets.mjs";
import { access } from "node:fs/promises";

test("loading advances only on completed work and reserves completion for the render gate", () => {
  const loading = createWorldLoading();
  const reports = [];
  const unsubscribe = loading.subscribe(() =>
    reports.push(loading.getSnapshot().progress),
  );
  const initial = loading.getSnapshot();
  assert.equal(initial.progress, 0);
  loading.report({ terrain: true });
  loading.report({ downloads: 10, downloadTotal: 10 });
  loading.report({ code: true });
  loading.report({ surface: true, assembly: 0, total: 7 });
  for (let assembly = 1; assembly <= 7; assembly++)
    loading.report({ assembly });
  assert.ok(
    loading.getSnapshot().progress < 100,
    "assets alone cannot enable entry",
  );
  const before = loading.getSnapshot();
  loading.report({ assembly: 7 });
  assert.equal(
    loading.getSnapshot(),
    before,
    "no work means no cosmetic progress",
  );
  loading.report({ ready: true });
  assert.equal(loading.getSnapshot().progress, 100);
  assert.ok(
    reports.every((value, index) => !index || value >= reports[index - 1]),
  );
  unsubscribe();
});

test("preload progress waits for the whole response and repeated calls share work", async () => {
  let finishBody,
    calls = 0;
  const reports = [];
  const preload = createAssetPreloader({
    assets: ["/texture"],
    fetchAsset: async () => {
      calls++;
      return {
        ok: true,
        arrayBuffer: () =>
          new Promise((resolve) => {
            finishBody = resolve;
          }),
      };
    },
    onProgress: (value) => reports.push(value),
  });
  const pending = preload();
  assert.equal(preload(), pending);
  await Promise.resolve();
  assert.equal(
    reports.length,
    0,
    "response headers are not a downloaded asset",
  );
  finishBody(new ArrayBuffer(0));
  await pending;
  assert.equal(calls, 1);
  assert.deepEqual(reports, [{ downloads: 1, downloadTotal: 1 }]);
});

test("failed preloads never inflate completion and the manifest names real assets", async () => {
  const reports = [];
  await createAssetPreloader({
    assets: ["/ok", "/missing", "/offline"],
    fetchAsset: async (url) => {
      if (url === "/offline") throw new Error("offline");
      return { ok: url === "/ok", arrayBuffer: async () => new ArrayBuffer(0) };
    },
    onProgress: (value) => reports.push(value),
  })();
  assert.deepEqual(reports, [{ downloads: 1, downloadTotal: 3 }]);
  await Promise.all(
    startupAssets.map((path) =>
      access(new URL(`../public${path}`, import.meta.url)),
    ),
  );
});

test("discovering another asset batch cannot rewind progress or claim readiness", () => {
  const loading = createWorldLoading();
  loading.report({
    terrain: true,
    code: true,
    surface: true,
    assembly: 4,
    total: 7,
  });
  const prior = loading.getSnapshot().progress;
  loading.report({ total: 9 });
  assert.equal(loading.getSnapshot().progress, prior);
  assert.ok(loading.getSnapshot().progress < 100);
});

test("both real world readiness and the completed or skipped intro are required to enter", () => {
  for (const [ready, settled] of [
    [false, false],
    [true, false],
    [false, true],
  ]) {
    const state = entranceReadiness({ ready, settled, progress: 100 });
    assert.equal(state.available, false);
    assert.equal(state.progress, 99);
  }
  assert.deepEqual(
    entranceReadiness({ ready: true, settled: true, progress: 95 }),
    {
      available: true,
      progress: 100,
    },
  );
});
