import test from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK,
  completions,
  places,
  runCommand,
} from "../app/lib/commands.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { readingSections } from "../app/lib/world-story.mjs";

test("cd and bare place names travel to real biomes", () => {
  for (const place of places) {
    for (const name of place.names) {
      assert.deepEqual(runCommand(`cd ${name}`).action, {
        type: "travel",
        biome: place.biome,
      });
    }
  }
  assert.equal(runCommand("fieldnotes").action.biome, "future");
  assert.equal(runCommand("cd ..").action.biome, "planet");
});

test("go finds every labelled stop by id or label", () => {
  for (const [biome, stops] of Object.entries(placeStops))
    for (const stop of stops.filter((s) => s.label)) {
      const byId = runCommand(`go ${stop.id}`).action;
      assert.equal(byId.type, "stop");
      assert.ok(placeStops[byId.biome].some((s) => s.id === byId.stop));
    }
  assert.deepEqual(runCommand("go the newsstand").action, {
    type: "stop",
    biome: "future",
    stop: "newsstand",
  });
});

test("open only reaches rooms the shell knows", () => {
  const known = new Set([...readingSections.map((r) => r.id), "index"]);
  for (const room of [
    "work",
    "about",
    "tools",
    "music",
    "writing",
    "contact",
    "eggs",
  ]) {
    const { action } = runCommand(`open ${room}`);
    assert.ok(known.has(action.content), `${room} -> ${action.content}`);
  }
  assert.equal(runCommand("open resume").link, "/resume");
});

test("unknown or hostile input never produces an action", () => {
  for (const input of [
    "rm -rf /",
    "cd /etc",
    "open <script>",
    "go ../../",
    "$(ls)",
  ]) {
    const reply = runCommand(input);
    assert.equal(reply.action, undefined, input);
    assert.ok(reply.text);
  }
  assert.equal(runCommand("xyz").text, FALLBACK);
});

test("eggs reports progress and completions suggest", () => {
  assert.match(
    runCommand("eggs", { found: ["hello-world"], total: 5 }).text,
    /1 of 5/,
  );
  assert.ok(completions("go key").some((c) => c.startsWith("go keynote")));
  assert.ok(completions("").length > 0);
});
