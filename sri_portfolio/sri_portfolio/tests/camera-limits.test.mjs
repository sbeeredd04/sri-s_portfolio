import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraLimits, SKY_RADIUS } from "../app/lib/camera-limits.mjs";
import { WORLD_RADIUS } from "../app/lib/world-layout.mjs";

test("maximum zoom keeps the world inside the clip range for wide and narrow overviews", () => {
  for (const overviewDistance of [330, 600, 1000, 1800]) {
    const limits = cameraLimits(overviewDistance);
    assert.ok(limits.maxDistance > overviewDistance);
    const camera = new PerspectiveCamera(60, 1, 2, limits.far);
    for (const targetOffset of [0, WORLD_RADIUS + 40]) {
      camera.position.set(0, 0, limits.maxDistance + targetOffset);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      for (const z of [-WORLD_RADIUS - 30, 0, WORLD_RADIUS + 30]) {
        const projected = new Vector3(0, 0, z).project(camera);
        assert.ok(projected.z > -1 && projected.z < 1);
      }
      const skyPoint = camera.position.clone().add(new Vector3(0, 0, -SKY_RADIUS));
      assert.ok(Math.abs(skyPoint.project(camera).z) < 1);
    }
  }
});
