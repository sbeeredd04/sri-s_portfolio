import test from "node:test";
import assert from "node:assert/strict";
import {
  roomPageHref,
  roomWorldHref,
  roomWorldDestination,
  continuations,
} from "../app/lib/reading-rooms.mjs";
import { readingSections } from "../app/lib/world-story.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { biomeMoods } from "../app/lib/world-time.mjs";
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
