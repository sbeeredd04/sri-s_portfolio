import test from "node:test";
import assert from "node:assert/strict";
import {
  roomPageHref,
  roomWorldHref,
  roomWorldDestination,
  continuations,
  entertainmentSectionHref,
} from "../app/lib/reading-rooms.mjs";
import { readingSections } from "../app/lib/world-story.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { biomeMoods } from "../app/lib/world-time.mjs";
test("standalone After-hours tabs preserve URL state and survive reload or copying", () => {
  let href = "/rooms/music?collection=shows&light=night&quality=high&tag=one&tag=two&q=a%26b#room-content";
  for (const section of ["music", "shows", "music", "shows"]) {
    href = entertainmentSectionHref(href, section);
    const copied = new URL(href, "https://portfolio.test");
    assert.equal(copied.pathname, "/rooms/music");
    assert.equal(copied.searchParams.get("collection"), section === "shows" ? "shows" : null);
    assert.equal(copied.searchParams.get("light"), "night");
    assert.equal(copied.searchParams.get("quality"), "high");
    assert.deepEqual(copied.searchParams.getAll("tag"), ["one", "two"]);
    assert.equal(copied.searchParams.get("q"), "a&b");
    assert.equal(copied.hash, "#room-content");
    assert.equal(entertainmentSectionHref(href, section), href, "settled URL is idempotent");
    assert.equal(roomWorldDestination("music", copied.searchParams.get("collection")).stop,
      section === "shows" ? "cinema" : "listening");
  }
  assert.equal(entertainmentSectionHref("/rooms/music?collection=shows&collection=bad", "shows"),
    "/rooms/music?collection=shows");
  assert.equal(entertainmentSectionHref("/rooms/music?collection=shows#room-content", "arbitrary"),
    "/rooms/music#room-content");
});
test("every narrative continuation has a real standalone destination", () => {
  for (const s of readingSections) {
    assert.ok(continuations[s.id]);
    assert.ok(readingSections.some((t) => t.id === continuations[s.id].id));
    assert.equal(roomPageHref(s.id), `/rooms/${s.id}`);
  }
});
test("standalone links preserve collection and safe project anchors", () => {
  assert.equal(
    roomPageHref("work", "hackathons", "#project-safeside"),
    "/rooms/work?collection=hackathons#project-safeside",
  );
  assert.equal(
    roomPageHref("about", "all", "#project-safeside"),
    "/rooms/about",
  );
  assert.equal(roomPageHref("work", "all", "#<script>"), "/rooms/work");
  assert.equal(
    roomPageHref("work", "one&two"),
    "/rooms/work?collection=one%26two",
  );
});

test("world return links preserve collections and safe project anchors", () => {
  assert.equal(
    roomWorldHref("work", "mobile"),
    "/?room=work&collection=mobile",
  );
  assert.equal(
    roomWorldHref("work", "all", "#project-safeside"),
    "/?room=work#project-safeside",
  );
  assert.equal(
    roomWorldHref("about", "mobile", "#project-safeside"),
    "/?room=about",
  );
  assert.equal(
    roomWorldHref("work", "one&two", "#<script>"),
    "/?room=work&collection=one%26two",
  );
});

test("independent rooms return to an existing world and stop", () => {
  for (const { id } of readingSections) {
    const destination = roomWorldDestination(id);
    assert.ok(biomeMoods[destination.world], id);
    assert.ok(
      destination.stop === "arrival" ||
        placeStops[destination.world]?.some((s) => s.id === destination.stop),
      `${id} -> ${destination.world}/${destination.stop}`,
    );
  }
  for (const [id, stop] of [
    ["writing", "writing"],
    ["socials", "socials"],
    ["contact", "collaborate"],
  ])
    assert.deepEqual(roomWorldDestination(id), { world: "future", stop });
  assert.deepEqual(roomWorldDestination("work", "hackathons"), {
    world: "projects",
    stop: "hackathons",
  });
  assert.deepEqual(roomWorldDestination("work", "mobile"), {
    world: "projects",
    stop: "mobile",
  });
  assert.deepEqual(roomWorldDestination("unknown"), {
    world: "planet",
    stop: "arrival",
  });
});

test("After-hours section survives the full-page and world-return route", () => {
  for (const [section, stop] of [['music', 'listening'], ['shows', 'cinema']]) {
    const page = new URL(roomPageHref('music', section), 'https://portfolio.test');
    assert.equal(page.pathname, '/rooms/music');
    const pageCollection = page.searchParams.get('collection') || 'all';
    const returned = new URL(roomWorldHref('music', pageCollection), page);
    assert.equal(returned.searchParams.get('room'), 'music');
    const destination = roomWorldDestination('music', returned.searchParams.get('collection'));
    assert.deepEqual(destination, {world:'entertainment', stop});
    const selected = placeStops.entertainment.find(s=>s.id===destination.stop);
    assert.equal(selected.content, 'music');
    assert.equal(selected.collection, section);
  }
});

test("After-hours routes reject unsupported section values instead of carrying arbitrary collection state", async () => {
  const {entertainmentSection}=await import('../app/lib/reading-rooms.mjs');
  for (const invalid of ['all', 'workbench', 'SHOWS', 'shows&room=work', '', null, undefined]) {
    assert.equal(entertainmentSection(invalid), 'music');
    assert.equal(roomPageHref('music', invalid), '/rooms/music');
    assert.equal(roomWorldHref('music', invalid), '/?room=music');
    assert.equal(roomWorldDestination('music', invalid).stop, 'listening');
  }
  // Switching tabs changes both link directions, not just the entry selection.
  for (const section of ['shows', 'music', 'shows']) {
    const selected=entertainmentSection(section);
    assert.equal(new URL(roomPageHref('music',selected),'https://portfolio.test').searchParams.get('collection')==='shows',section==='shows');
    assert.equal(new URL(roomWorldHref('music',selected),'https://portfolio.test').searchParams.get('collection')==='shows',section==='shows');
  }
});
