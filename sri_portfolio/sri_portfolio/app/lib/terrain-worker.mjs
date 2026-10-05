import { createTerrainGeometry } from "./terrain-geometry.mjs";
import { packTerrain } from "./terrain-transfer.mjs";

self.onmessage = () => {
  try {
    const data = packTerrain(createTerrainGeometry());
    self.postMessage(
      data,
      Object.values(data).map((array) => array.buffer),
    );
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
