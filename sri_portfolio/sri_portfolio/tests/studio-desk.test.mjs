import test from "node:test";
import assert from "node:assert/strict";
import {
  studioDeskFrame,
  studioDeskLight,
  studioSurfaces,
} from "../app/lib/studio-layout.mjs";

const bounds = ({ position, size }) => ({
  min: position.map((p, i) => p - size[i] / 2),
  max: position.map((p, i) => p + size[i] / 2),
});
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8);

test("desk feet land on the rug and connected supports meet the desktop", () => {
  const rug = bounds(studioSurfaces.rug);
  const desktop = bounds(studioSurfaces.desk);
  for (const offset of [0, 4]) {
    const parts = studioDeskFrame.slice(offset, offset + 4).map(bounds);
    close(parts[0].min[1], rug.max[1]);
    close(parts[3].max[1], desktop.min[1]);
    for (const axis of [0, 2]) {
      assert.ok(parts[0].min[axis] >= rug.min[axis]);
      assert.ok(parts[0].max[axis] <= rug.max[axis]);
    }
    for (let i = 1; i < parts.length; i++) {
      for (let axis = 0; axis < 3; axis++) {
        assert.ok(parts[i].min[axis] <= parts[i - 1].max[axis] + 1e-8);
        assert.ok(parts[i].max[axis] >= parts[i - 1].min[axis] - 1e-8);
      }
    }
  }
});

test("the full desk frame clears the seated chair and leaves knee space", () => {
  const chair = bounds(studioSurfaces.chairSeat);
  // A 70 cm wide knee bay, extending below the front of the desktop.
  const knees = bounds({
    position: [-0.5, 0.43, -0.65],
    size: [0.7, 0.45, 0.6],
  });
  for (const part of studioDeskFrame.map(bounds)) {
    for (const obstacle of [chair, knees]) {
      assert.ok(
        [0, 1, 2].some(
          (axis) =>
            part.max[axis] <= obstacle.min[axis] ||
            part.min[axis] >= obstacle.max[axis],
        ),
        "desk structure must not intersect the chair or knee bay",
      );
    }
  }
});

test("task light aims at the work surface beside the keyboard", () => {
  const desk = bounds(studioSurfaces.desk);
  const [x, y, z] = studioDeskLight.target;
  close(y, desk.max[1]);
  assert.ok(x > desk.min[0] && x < desk.max[0]);
  assert.ok(z > desk.min[2] && z < desk.max[2]);
  assert.ok(studioDeskLight.position[1] > y);
  assert.ok(Math.abs(x - studioSurfaces.keyboard.position[0]) < 0.25);
});
