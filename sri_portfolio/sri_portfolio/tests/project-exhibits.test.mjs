import test from "node:test";
import assert from "node:assert/strict";
import {
  projectExhibits,
  exhibitActionAt,
  exhibitCanvas,
  exhibitStep,
} from "../app/lib/project-exhibits.mjs";

test("physical exhibit hit targets agree with each accessible step, including the book UVs", () => {
  const { width, height } = exhibitCanvas;
  for (const [id, exhibit] of Object.entries(projectExhibits)) {
    const ids = exhibit.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes(exhibit.initial));
    for (const [index, step] of exhibit.steps.entries()) {
      const uv = { x: (48 + index * 402 + 189) / width, y: 1 - 768 / height };
      assert.equal(exhibitActionAt(id, uv), step.id);
      assert.equal(
        exhibitStep(id, exhibitActionAt(id, uv)).result,
        step.result,
      );
      // The gutter between buttons must never select the neighboring step.
      assert.equal(
        exhibitActionAt(id, { x: (48 + index * 402 + 389) / width, y: uv.y }),
        null,
      );
    }
    assert.equal(exhibitActionAt(id, { x: 0.5, y: 0.5 }), null);
    assert.equal(exhibitActionAt(id, { x: NaN, y: 0 }), null);
    assert.equal(exhibitActionAt(id, null), null);
  }
});
