import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { buildLookoutIsland, lookoutVista } from "../app/lib/lookout-vista.mjs";
import { lookout, quarterViews } from "../app/lib/fieldnotes-quarter.mjs";
import { fieldnotesPaths } from "../app/lib/fieldnotes-layout.mjs";
import { renderedSurfaceHeight } from "../app/lib/terrain-geometry.mjs";

test("the entire offshore mesh clears garden walks and meets the sea", () => {
  const mesh = buildLookoutIsland();
  const p = mesh.attributes.position;
  // Include both ends and the full width of every rendered garden path.
  const pathEdge = Math.max(
    ...fieldnotesPaths.flatMap(([a, b, width]) => [
      a[1] + width / 2,
      b[1] + width / 2,
    ]),
  );
  let submerged = 0;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + lookoutVista.center[0];
    const z = p.getZ(i) + lookoutVista.center[1];
    assert.ok(
      z > pathEdge + 25,
      "offshore rock enters the garden or its approach",
    );
    assert.ok(Number.isFinite(p.getY(i)));
    if (Math.abs(p.getY(i) - lookoutVista.bottom) < 0.001) {
      assert.ok(
        p.getY(i) < renderedSurfaceHeight("future", x, z) - 0.5,
        "exposed skirt would make the island float",
      );
      submerged++;
    }
  }
  assert.ok(submerged > 0);
  assert.ok(p.count / 3 < 700, "vista cliff exceeds its triangle budget");
  mesh.dispose();
});

test("the seat has a clear sightline over the wall to the beacon", () => {
  const eye = [lookout.x, 1.2, lookout.bench];
  const t = (lookout.z - eye[2]) / (lookoutVista.focus[2] - eye[2]);
  const heightAtWall = eye[1] + t * (lookoutVista.focus[1] - eye[1]);
  assert.ok(heightAtWall > 0.88 + 0.2);
  assert.ok(lookoutVista.focus[2] > lookout.z, "beacon is behind the seat");
});

test("desktop and phone cameras look past the garden at the actual island", () => {
  const view = quarterViews.find((v) => v.id === "lookout");
  for (const shot of [view, view.portrait]) {

    assert.ok(shot.position[2] < lookout.bench);
    for (let z = lookout.z; z < lookoutVista.center[1] - 6; z += 0.5) {
      const t = (z - shot.position[2]) / (lookoutVista.focus[2] - shot.position[2]);
      const x = shot.position[0] + t * (lookoutVista.focus[0] - shot.position[0]);
      const y = shot.position[1] + t * (lookoutVista.focus[1] - shot.position[1]);
      assert.ok(
        y > renderedSurfaceHeight("future", x, z) + 0.5,
        "terrain blocks the focal point",
      );
    }
  }
});


test("phone lookout keeps seating above the navigation drawer", () => {
  const shot = quarterViews.find((v) => v.id === "lookout").portrait;
  const camera = new PerspectiveCamera(shot.fov, 390 / 844, 0.1, 1000);
  camera.position.set(...shot.position);
  camera.lookAt(...shot.target);
  camera.updateMatrixWorld();
  // Entire bench width and height, not merely its center.
  for (const x of [-0.9, 0.9]) for (const y of [0, 0.95]) {
    const p = new Vector3(x, y, lookout.bench).project(camera);
    assert.ok(Math.abs(p.x) < 0.9, "seat outside phone sides");
    assert.ok(p.y > -0.52 && p.y < 0.5, "seat hidden by phone chrome");
  }
});
