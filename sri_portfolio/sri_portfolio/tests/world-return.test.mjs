import test from "node:test";
import assert from "node:assert/strict";
import {
  worldReturnState,
  withWorldReturn,
  hasEnteredWorld,
  rememberWorldEntry,
} from "../app/lib/world-return.mjs";

test("full-page Back preserves the exact world visit and framework history", () => {
  const framework = { __NA: true, tree: ["", { children: ["__PAGE__", {}] }] };
  const visit = {
    biome: "future",
    stop: "lookout",
    sheet: "writing",
    collection: "all",
    previewsExpanded: false,
    playing: false,
    lightMode: "live",
  };
  const state = withWorldReturn(framework, visit, "/?room=about");
  assert.equal(state.tree, framework.tree);
  assert.equal(state.__NA, true);
  assert.deepEqual(worldReturnState(state, "/?room=about"), {
    ...visit,
    entered: true,
    url: "/?room=about",
  });
  assert.equal(
    worldReturnState(state, "/?room=work"),
    null,
    "a new deep link must not restore an old visit",
  );
  assert.equal(worldReturnState(null, "/"), null);
});

test("entrance is remembered within the tab session without requiring storage", () => {
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
  };
  assert.equal(hasEnteredWorld(storage), false);
  rememberWorldEntry(storage);
  assert.equal(hasEnteredWorld(storage), true);
  const blocked = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(hasEnteredWorld(blocked), false);
  assert.doesNotThrow(() => rememberWorldEntry(blocked));
});
