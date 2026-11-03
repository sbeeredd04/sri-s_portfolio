import test from "node:test";
import assert from "node:assert/strict";
import { searchSpotlight, spotlightEntries } from "../app/lib/spotlight.mjs";
import {
  biomeRooms,
  roomCovers,
  roomWorldDestination,
} from "../app/lib/reading-rooms.mjs";
import { visiblePlaceStops, visiblePlaceStopGroups } from "../app/lib/place-stops.mjs";
import { readingSections } from "../app/lib/world-story.mjs";

test("search finds pages and views by ordinary names with whitespace and case", () => {
  assert.equal(searchSpotlight("  MUSIC ", "future")[0].room, "music");
  assert.ok(
    searchSpotlight("hello", "future").some((e) => e.room === "contact"),
  );
  assert.ok(
    searchSpotlight("currently reading").some((e) => e.action?.stop === "bookshelf"),
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

test("scenery is absent from discovery, while project reading leads its studio view", () => {
  for (const stop of ["harbor", "bay", "demos", "lookout"])
    assert.equal(spotlightEntries.some((entry) => entry.action?.stop === stop), false);
  for (const id of ["aether", "agentex", "gitcue", "mesa", "csdna", "soda"]) {
    const hits = searchSpotlight(id, "projects");
    assert.equal(hits[0].project, id);
    assert.equal(hits[0].href, `/rooms/work#project-${id}`);
    assert.ok(hits.some((entry) => entry.kind === "View" && entry.action.stop === id));
  }
  assert.ok(spotlightEntries.some((entry) => entry.href === "/story"));
});


test("Made puts the six portfolio projects before supporting collections", () => {
  const groups = visiblePlaceStopGroups("projects");
  assert.equal(groups[0].label, "Selected projects");
  assert.deepEqual(groups[0].stops.map((stop) => stop.project), ["aether", "agentex", "gitcue", "mesa", "csdna", "soda"]);
  assert.ok(groups[1].stops.every((stop) => !stop.project && !stop.scenic));
  assert.deepEqual(visiblePlaceStops("projects"), groups.flatMap((group) => group.stops));
  assert.ok(visiblePlaceStops("trail").some((stop) => stop.id === "camp"));
  assert.ok(visiblePlaceStops("entertainment").some((stop) => stop.id === "cinema"));
});
