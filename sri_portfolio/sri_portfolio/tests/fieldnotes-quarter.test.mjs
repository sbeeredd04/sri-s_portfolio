import test from "node:test";
import assert from "node:assert/strict";
import {
  hedges,
  lanternPosts,
  lookout,
  newsstand,
  paperPlanes,
  planePose,
  quarterViews,
  trees,
} from "../app/lib/fieldnotes-quarter.mjs";
import { onFieldnotesPath } from "../app/lib/fieldnotes-layout.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";

test("garden props keep off every Fieldnotes walk", () => {
  const [w, d] = newsstand.size;
  for (const dx of [-d / 2, d / 2])
    for (const dz of [-w / 2, 0, w / 2])
      assert.ok(
        !onFieldnotesPath(newsstand.x + dx, newsstand.z + dz, 0.2),
        "newsstand on a walk",
      );
  for (const [x, z] of lanternPosts())
    assert.ok(!onFieldnotesPath(x, z, 0.15), `post at ${x},${z}`);
  for (const h of hedges())
    assert.ok(!onFieldnotesPath(h.x, h.z, 1.1), `hedge at ${h.x},${h.z}`);
  for (const t of trees)
    assert.ok(!onFieldnotesPath(t.x, t.z, 1.5), `tree at ${t.x},${t.z}`);
});

test("the lookout walk reaches the bench", () => {
  assert.ok(onFieldnotesPath(0, lookout.bench - 0.8));
  assert.ok(!onFieldnotesPath(0, lookout.z));
});

test("paper planes fly above head height and face their direction of travel", () => {
  for (const p of paperPlanes("high")) {
    const a = planePose(p, 3),
      b = planePose(p, 3.05);
    assert.ok(a.y > 3.2, "plane too low");
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    assert.ok(
      Math.abs(
        Math.atan2(Math.sin(heading - a.yaw), Math.cos(heading - a.yaw)),
      ) < 0.1,
    );
  }
});

test("garden stops are listed in Fieldnotes", () => {
  const ids = placeStops.future.map((s) => s.id);
  for (const v of quarterViews) assert.ok(ids.includes(v.id));
});
