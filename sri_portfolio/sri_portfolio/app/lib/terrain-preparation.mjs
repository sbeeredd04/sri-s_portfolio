import {
  installTerrainGeometry,
  prepareTerrainGeometry,
} from "./terrain-geometry.mjs";
import { unpackTerrain } from "./terrain-transfer.mjs";

export function runTerrainWorker(createWorker, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let worker, timer;
    const finish = (error, data) => {
      clearTimeout(timer);
      if (worker) {
        worker.onmessage = worker.onerror = worker.onmessageerror = null;
        worker.terminate();
      }
      if (error) reject(error);
      else resolve(data);
    };
    try {
      worker = createWorker();
      worker.onmessage = ({ data }) => {
        if (data?.error) finish(new Error(data.error));
        else finish(null, data);
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        finish(new Error("Terrain worker unavailable"));
      };
      worker.onmessageerror = () =>
        finish(new Error("Terrain transfer failed"));
      timer = setTimeout(
        () => finish(new Error("Terrain worker timed out")),
        timeoutMs,
      );
      worker.postMessage("prepare");
    } catch (error) {
      finish(error);
    }
  });
}

let preparation;
export function prepareTerrainInBackground() {
  return (preparation ||= (async () => {
    if (typeof window !== "undefined" && typeof Worker !== "undefined") {
      try {
        const data = await runTerrainWorker(
          () =>
            new Worker(new URL("./terrain-worker.mjs", import.meta.url), {
              type: "module",
            }),
        );
        installTerrainGeometry(unpackTerrain(data));
        return "worker";
      } catch {
        // CSP restrictions, missing chunks and unavailable workers must not
        // strand the entrance. The existing yielding builder remains usable.
      }
    }
    await prepareTerrainGeometry();
    return "cooperative";
  })().catch((error) => {
    preparation = undefined;
    throw error;
  }));
}
