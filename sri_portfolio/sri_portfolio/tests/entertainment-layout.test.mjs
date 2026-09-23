import test from "node:test";
import assert from "node:assert/strict";
import {
  cinemaOrigin,
  cinemaScreen,
  cinemaSeats,
  entertainmentPaths,
  listeningSeat,
  facingYaw,
} from "../app/lib/entertainment-layout.mjs";
import { pavingCells } from "../app/lib/paving-layout.mjs";

test("cinema chairs and the listening chair face the thing they are there for", () => {
  for (const seat of cinemaSeats) {
    const dx = cinemaScreen[0] - seat.position[0],
      dz = cinemaScreen[2] - seat.position[2];
    assert.ok(
      (Math.sin(seat.yaw) * dx + Math.cos(seat.yaw) * dz) / Math.hypot(dx, dz) >
        0.999,
    );
  }
  const yaw = facingYaw(listeningSeat.position, listeningSeat.target);
  assert.ok(
    Math.cos(yaw) < -0.9,
    "the listening chair should face the turntable and lake",
  );
});
test("the entire cinema entrance paving clears every rotated chair footprint", () => {
  for (const stone of pavingCells(entertainmentPaths))
    for (const seat of cinemaSeats) {
      const dx = stone.x - cinemaOrigin[0] - seat.position[0];
      const dz = stone.z - cinemaOrigin[2] - seat.position[2];
      const x = Math.cos(seat.yaw) * dx - Math.sin(seat.yaw) * dz;
      const z = Math.sin(seat.yaw) * dx + Math.cos(seat.yaw) * dz;
      // A circumscribed radius covers all four corners of each paving stone.
      assert.ok(
        Math.abs(x) > 0.56 + 0.45 || Math.abs(z) > 0.62 + 0.45,
        `paving intersects a chair at ${stone.x},${stone.z}`,
      );
    }
});
