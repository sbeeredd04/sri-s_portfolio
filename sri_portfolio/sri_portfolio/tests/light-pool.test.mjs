import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// three.js compiles the light count into every lit shader. A light mounted or
// culled with a biome recompiles every material in the world, so all lights
// live in WorldLighting's fixed pool.
test("the shared world keeps a fixed light pool; isolated preview canvases own their lights", () => {
  const dir = new URL("../app/components/personal/", import.meta.url);
  const LIGHT = /<(point|spot|directional|hemisphere|ambient|rectArea)Light\b|new THREE\.\w+Light\(/;
  const offenders = readdirSync(dir)
    .filter((f) => f.endsWith(".jsx") && ![
      "WorldLighting.jsx", "OutThereCanvas.jsx", "MadeVisitCanvas.jsx",
      "AuthoredOutThere.jsx",
    ].includes(f))
    .filter((f) => LIGHT.test(readFileSync(new URL(f, dir), "utf8")));
  assert.deepEqual(offenders, []);
  // Shared assets also serve separate preview canvases. Verify their local
  // lighting is explicitly disabled when embedded in the portfolio world.
  const source = (file) => readFileSync(new URL(file, dir), "utf8");
  assert.match(source("AuthoredOutThere.jsx"), /night && !embedded && \(\s*<pointLight/);
  assert.match(source("OutThereRegion.jsx"), /<AuthoredOutThere\s+embedded\b/);
  assert.match(source("MadeVisitCanvas.jsx"), /fill && \(\s*<pointLight/);
  assert.match(source("MadeCampusRegion.jsx"), /<AetherShowroom[\s\S]*?fill=\{false\}/);
});
