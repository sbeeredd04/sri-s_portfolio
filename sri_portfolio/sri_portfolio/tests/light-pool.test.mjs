import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// three.js compiles the light count into every lit shader. A light mounted or
// culled with a biome recompiles every material in the world, so all lights
// live in WorldLighting's fixed pool.
test("only WorldLighting mounts lights", () => {
  const dir = new URL("../app/components/personal/", import.meta.url);
  const LIGHT = /<(point|spot|directional|hemisphere|ambient|rectArea)Light\b|new THREE\.\w+Light\(/;
  const offenders = readdirSync(dir)
    .filter((f) => f.endsWith(".jsx") && f !== "WorldLighting.jsx")
    .filter((f) => LIGHT.test(readFileSync(new URL(f, dir), "utf8")));
  assert.deepEqual(offenders, []);
});
