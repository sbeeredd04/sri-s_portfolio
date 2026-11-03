import test from "node:test";
import assert from "node:assert/strict";
import { madeProjects } from "../app/lib/made-projects.mjs";
import { madeGalleryStories } from "../app/lib/made-gallery.mjs";
import { visiblePlaceStopGroups } from "../app/lib/place-stops.mjs";
import { madeStop } from "../app/lib/made-campus-views.mjs";
import { projectExhibits } from "../app/lib/project-exhibits.mjs";
import { roomPageHref } from "../app/lib/reading-rooms.mjs";
import { linkedProjectId } from "../app/lib/project-library.mjs";

// The actual selector data must keep identity, physical visit and direct reading
// together; a friendly label must never silently point at a different project.
test("all six Foundry choices identify their purpose and retain camera and reading destinations", () => {
  const groups = visiblePlaceStopGroups("projects");
  assert.deepEqual(groups.map(g => g.label), ["Selected projects", "Collections & tools"]);
  const choices = groups[0].stops;
  assert.deepEqual(choices.map(s => s.project), Object.keys(madeProjects));
  for (const choice of choices) {
    const identity = madeProjects[choice.project];
    assert.equal(choice.id, choice.project);
    assert.equal(choice.label, identity.label);
    assert.equal(choice.purpose, identity.purpose);
    assert(identity.purpose.length >= 10 && identity.purpose.length <= 28);
    assert(projectExhibits[choice.project]);
    const view = madeStop(choice.id);
    for (const shot of [view, view.portrait]) {
      assert(shot.position.every(Number.isFinite));
      assert(shot.target.every(Number.isFinite));
    }
    const reading = new URL(roomPageHref("work", "all", `#project-${choice.project}`), "https://portfolio.test");
    assert.equal(reading.pathname, "/rooms/work");
    assert.equal(linkedProjectId(reading.hash), choice.project);
  }
});

test("gallery and facade metadata share the selector identity instead of independent descriptions", () => {
  assert.equal(Object.keys(madeGalleryStories).length, 5);
  for (const [id, story] of Object.entries(madeGalleryStories)) {
    assert.equal(story, madeProjects[id]);
    assert(story.summary && story.category && story.name && story.accent);
  }
  assert.equal(madeGalleryStories.world, undefined);
  assert.equal(madeGalleryStories.aether, undefined, "Aether retains its existing authored showroom");
});

test("collections keep their useful grouping and are not promoted as additional selected projects", () => {
  const [, collections] = visiblePlaceStopGroups("projects");
  assert(collections.stops.some(s => s.id === "mobile" && s.collection === "mobile"));
  assert(collections.stops.some(s => s.id === "hackathons" && s.collection === "hackathons"));
  assert(collections.stops.some(s => s.id === "workbench" && s.collection === "workbench"));
  for (const stop of collections.stops) {
    assert.equal(stop.project, undefined);
    assert.equal(stop.purpose, undefined);
  }
});
