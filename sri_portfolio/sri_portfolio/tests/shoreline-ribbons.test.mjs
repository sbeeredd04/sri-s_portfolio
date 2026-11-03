import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import {
  shorelines,
  shorelineSeaHeight,
} from "../app/lib/shoreline-contours.mjs";
import {
  createShorelineRibbons,
  shorelineRibbonWidth,
} from "../app/lib/shoreline-ribbons.mjs";

const geometry = createShorelineRibbons();
const { position, normal, uv, shorePerimeter } = geometry.attributes;
const vertex = (i) => new Vector3().fromBufferAttribute(position, i);

test("every rendered ribbon triangle is nondegenerate and faces the sky", () => {
  assert.equal(
    geometry.index.count,
    6 * shorelines.reduce((sum, { points }) => sum + points.length, 0),
  );
  for (let i = 0; i < geometry.index.count; i += 3) {
    const [a, b, c] = [0, 1, 2].map((j) => vertex(geometry.index.getX(i + j)));
    assert.ok(
      b.sub(a).cross(c.sub(a)).y > 0.00001,
      `triangle ${i / 3} is folded or degenerate`,
    );
  }
  for (let i = 0; i < position.count; i++) {
    assert.ok(
      Math.abs(position.getY(i) - (shorelineSeaHeight + 0.025)) < 0.00002,
    );
    assert.equal(normal.getY(i), 1);
  }
});

function orientation(a, b, c) {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}
function crosses(a, b, c, d) {
  return (
    orientation(a, b, c) * orientation(a, b, d) < -1e-10 &&
    orientation(c, d, a) * orientation(c, d, b) < -1e-10
  );
}

test("ribbons follow the coast on the water side with bounded, continuous sections", () => {
  let base = 0;
  for (const { id, points } of shorelines) {
    const count = points.length;
    const inner = [],
      outer = [];
    let perimeter = 0;
    for (let i = 0; i < count; i++) {
      const [x, z] = points[i],
        next = points[(i + 1) % count];
      const point = new Vector3(x, shorelineSeaHeight + 0.025, z);
      const edgeEnd = new Vector3(next[0], point.y, next[1]);
      const k = base + i * 2;
      inner.push(vertex(k));
      outer.push(vertex(k + 1));
      assert.ok(
        orientation(point, edgeEnd, outer[i]) < 0,
        `${id} section ${i} is not seaward`,
      );
      assert.ok(orientation(point, edgeEnd, inner[i]) > 0);
      assert.ok(inner[i].distanceTo(point) <= 0.12 * 1.65 + 0.00002);
      assert.ok(
        outer[i].distanceTo(point) <= shorelineRibbonWidth * 1.65 + 0.00002,
      );
      assert.ok(outer[i].distanceTo(point) >= 0.1);
      assert.ok(uv.getX(k) < 0 && uv.getX(k + 1) > 0);
      assert.equal(uv.getY(k), uv.getY(k + 1));
      assert.ok(Math.abs(uv.getY(k) - perimeter) < 0.00004);
      perimeter += point.distanceTo(edgeEnd);
    }
    for (const boundary of [inner, outer]) {
      for (let i = 0; i < count; i++) {
        for (let j = i + 2; j < (i ? count : count - 1); j++) {
          assert.ok(
            !crosses(
              boundary[i],
              boundary[(i + 1) % count],
              boundary[j],
              boundary[(j + 1) % count],
            ),
            `${id} overlapping offset ${i}/${j}`,
          );
        }
      }
    }
    for (let i = 0; i < count; i++)
      for (let j = 0; j < count; j++) {
        assert.ok(
          !crosses(
            inner[i],
            inner[(i + 1) % count],
            outer[j],
            outer[(j + 1) % count],
          ),
          `${id} opposing boundaries cross at ${i}/${j}`,
        );
      }
    for (let side = 0; side < 2; side++) {
      const first = base + side,
        seam = base + count * 2 + side;
      assert.ok(
        vertex(first).equals(vertex(seam)),
        `${id} seam positions differ`,
      );
      assert.equal(uv.getX(first), uv.getX(seam));
      assert.equal(shorePerimeter.getX(first), shorePerimeter.getX(seam));
      assert.ok(Math.abs(shorePerimeter.getX(first) - perimeter) < 0.00004);
      assert.ok(Math.abs(uv.getY(seam) - perimeter) < 0.00004);
    }
    base += (count + 1) * 2;
  }
  assert.equal(base, position.count);
});
