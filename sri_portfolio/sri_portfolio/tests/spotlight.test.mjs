import test from "node:test";
import assert from "node:assert/strict";
import { searchSpotlight, spotlightEntries } from "../app/lib/spotlight.mjs";
import {
  biomeRooms,
  roomCovers,
  roomWorldDestination,
} from "../app/lib/reading-rooms.mjs";
import { readingSections } from "../app/lib/world-story.mjs";

test("search finds pages and views by ordinary names with whitespace and case", () => {
  assert.equal(searchSpotlight("  MUSIC ", "future")[0].room, "music");
  assert.ok(
    searchSpotlight("hello", "future").some((e) => e.room === "contact"),
  );
  assert.ok(
    searchSpotlight("lookout").some((e) => e.action?.stop === "lookout"),
  );
  assert.deepEqual(searchSpotlight("not-a-real-destination"), []);
});
test("professional work leads; every reading page is searchable and every biome page has a cover", () => {
  assert.equal(searchSpotlight("", "future")[0].room, "work");
  assert.equal(
    new Set(spotlightEntries.map((e) => e.id)).size,
    spotlightEntries.length,
  );
  for (const room of readingSections)
    assert.ok(spotlightEntries.some((e) => e.room === room.id));
  for (const ids of Object.values(biomeRooms)) {
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.ok(readingSections.some((r) => r.id === id));
      assert.ok(roomCovers[id]);
      assert.notEqual(roomWorldDestination(id).world, "planet");
    }
  }
  assert.deepEqual(biomeRooms.future, ["writing", "socials", "contact"]);
  assert.deepEqual(biomeRooms.court, biomeRooms.entertainment);
});
