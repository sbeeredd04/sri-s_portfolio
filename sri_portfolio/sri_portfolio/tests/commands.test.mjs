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

test("scenic stops keep explicit legacy access without being suggested", () => {
  assert.deepEqual(completions("go harbor"), []);
  assert.deepEqual(completions("go red span"), []);
  assert.deepEqual(runCommand("go harbor").action, { type: "stop", biome: "studio", stop: "harbor" });
  assert.deepEqual(runCommand("go bay").action, { type: "stop", biome: "projects", stop: "bay" });
  assert.ok(completions("go life in").includes("go life in san francisco"));
});

test("Fieldnotes promotes one writing view while preserving the kiosk camera command", async () => {
  const { visiblePlaceStops } = await import('../app/lib/place-stops.mjs');
  const { spotlightEntries } = await import('../app/lib/spotlight.mjs');
  const { biomeRooms, roomPageHref } = await import('../app/lib/reading-rooms.mjs');
  assert.deepEqual(visiblePlaceStops('future').filter(s=>s.content==='writing').map(s=>s.id), ['writing']);
  assert.deepEqual(runCommand('go the newsstand').action, {type:'stop',biome:'future',stop:'newsstand'});
  assert.deepEqual(completions('go newsstand'), []);
  assert.ok(completions('go writing').some(command => runCommand(command).action?.stop === 'writing'));
  assert.ok(!spotlightEntries.some(s=>s.id==='stop-future-newsstand'));
  assert.ok(spotlightEntries.some(s=>s.id==='stop-future-writing'));
  assert.ok(spotlightEntries.some(s=>s.room==='writing' && s.action.content==='writing'));
  assert.ok(biomeRooms.future.includes('writing'));
  assert.equal(roomPageHref('writing'), '/rooms/writing');
  const kiosk=placeStops.future.find(s=>s.id==='newsstand');
  assert.ok(kiosk.position && kiosk.target && kiosk.portrait.position, 'Saved kiosk camera remains complete');
});
