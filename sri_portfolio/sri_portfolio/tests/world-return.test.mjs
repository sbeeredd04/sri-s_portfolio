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

// Mirrors the documented native History integration's distinguishing branch
// in the installed Next app-router: internal writes bypass canonical updates.
function nextHistoryFixture() {
  const tree = { tree: ['home'], renderedSearch: '' };
  const history = {
    state: { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: tree, sriPreference: 'keep' },
    address: '/', canonical: '/',
    replaceState(data, _unused, url) {
      const internal = data?.__NA || data?._N;
      if (!internal) {
        this.canonical = url;
        data = { ...data, __NA: this.state.__NA,
          __PRIVATE_NEXTJS_INTERNALS_TREE: this.state.__PRIVATE_NEXTJS_INTERNALS_TREE };
      }
      this.state = data;
      this.address = url;
    },
    render() { this.replaceState(this.state, '', this.canonical); },
  };
  return { history, tree };
}
test('preview and graphics URLs survive a later Next router render', async () => {
  const { replaceWorldHistory } = await import('../app/lib/world-return.mjs');
  const { history, tree } = nextHistoryFixture();
  const original = history.state;
  // Reproduce the original bug: the address changes but the router reverts it.
  history.replaceState(history.state, '', '/?light=day');
  history.render();
  assert.equal(history.address, '/');

  for (const url of ['/?quality=high', '/?quality=high&light=day', '/?quality=high&light=day#project-aether', '/?quality=high&light=day', '/?quality=high']) {
    replaceWorldHistory(history, url);
    history.render();
    assert.equal(history.address, url);
    assert.equal(history.canonical, url);
    assert.equal(history.state.__PRIVATE_NEXTJS_INTERNALS_TREE, tree);
    assert.equal(history.state.sriPreference, 'keep');
  }
  assert.equal(original.__NA,true,'never mutate the router-owned source state');
});
test('project anchors retain the exact saved visit while Next restores its own internals', async () => {
  const { replaceWorldHistory } = await import('../app/lib/world-return.mjs');
  const { history, tree } = nextHistoryFixture();
  const visit = { biome: 'projects', stop: 'keynote', sheet: 'work' };
  const url = '/?quality=medium&light=night#project-aether';
  replaceWorldHistory(history, url, withWorldReturn(history.state, visit, url));
  history.render();
  assert.equal(history.state.__PRIVATE_NEXTJS_INTERNALS_TREE,tree);
  assert.equal(worldReturnState(history.state,url).stop,'keynote');
  assert.equal(worldReturnState(history.state,url).sheet,'work');
  assert.equal(history.address,url);
});
