import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import {
  fieldnotesArrival,
  fieldnotesBlocks,
  fieldnotesBridgeY,
  fieldnotesCameras,
  fieldnotesCanopy,
  fieldnotesCanopyY,
  fieldnotesChair,
  fieldnotesWalkEntries,
  fieldnotesLoungeScale,
  fieldnotesTerraces,
  fieldnotesColumnPoints,
  fieldnotesDeckHeight,
  fieldnotesDesk,
  fieldnotesExpectsPaving,
  fieldnotesMaterialNames,
  fieldnotesPathSamples,
  fieldnotesPaths,
  fieldnotesSignPoses,
  fieldnotesSpawn,
  fieldnotesStreet,
  onFieldnotesPath,
} from "../app/lib/fieldnotes-layout.mjs";
import {
  buildFieldnotesGeometry,
  fieldnotesMeshBudget,
  triangleCount,
} from "../app/lib/fieldnotes-geometry.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { streetRoutes } from "../app/lib/street-view.mjs";
import {
  makeWalkNetwork,
  advanceWalker,
  nearestWalk,
  walkingJoins,
  walkStart,
} from "../app/lib/walk-network.mjs";
import {
  WORLD_RADIUS,
  regions,
  surfaceHeight,
  worldPoint,
} from "../app/lib/world-layout.mjs";

const region = regions.find((item) => item.id === "future");
const built = buildFieldnotesGeometry();
const material = new MeshBasicMaterial();
const meshes = Object.values(built).map(
  (geometry) => new Mesh(geometry, material),
);
meshes.forEach((mesh) => mesh.updateMatrixWorld());
const paving = new Mesh(built.paving, material);
paving.updateMatrixWorld();

function localOf(position) {
  return position
    .clone()
    .sub(region.center)
    .applyQuaternion(region.rotation.clone().invert());
}
function rayDown(x, z, objects = meshes) {
  return new Raycaster(
    new Vector3(x, 8, z),
    new Vector3(0, -1, 0),
  ).intersectObjects(objects, false);
}

test("the publishing garden stays on the level pad and the bridge height", () => {
  assert.equal(WORLD_RADIUS, 450);
  assert.ok(regions.find((item) => item.id === "future").inner >= 10);
  const deck = fieldnotesDeckHeight();
  assert.ok(Math.abs(deck - fieldnotesBridgeY()) < 1e-6);
  for (const [x, z] of [
    fieldnotesSpawn,
    [fieldnotesDesk.x, fieldnotesDesk.z],
    [fieldnotesChair.x, fieldnotesChair.z],
    [0, -4.7],
    [-6.35, 5.45],
    [5.15, 0.4],
  ])
    assert.ok(Math.abs(surfaceHeight("future", x, z)) < 0.02, `${x},${z}`);
});

test("future keeps the three rooms, the garden stops and coming-soon copy", () => {
  assert.deepEqual(
    placeStops.future.map((stop) => stop.id),
    ["socials", "writing", "newsstand", "lookout", "collaborate"],
  );
  assert.deepEqual(
    placeStops.future.map((stop) => stop.content),
    ["socials", "writing", "writing", "writing", "contact"],
  );
  const writing = placeStops.future.find((stop) => stop.id === "writing");
  assert.match(writing.hint, /Coming soon/);
  assert.equal(writing.position[0], fieldnotesCameras.writing.position[0]);
  const copy = [
    writing.hint,
    ...Object.values(fieldnotesSignPoses()).flatMap((sign) => [
      sign.title,
      sign.subtitle,
    ]),
  ].join(" ");
  assert.equal(/\bfollowers\b|published|20\d\d/i.test(copy), false);
  assert.deepEqual(streetRoutes.future, fieldnotesStreet);
});

test("one path joins the bridge and does not enter the furniture", () => {
  assert.equal(walkingJoins.future, undefined);
  assert.deepEqual(fieldnotesPaths[0][0], [0, -8]);
  const network = makeWalkNetwork().filter(
    (segment) => segment.world === "future",
  );
  const bridge = worldPoint("future", [0, fieldnotesDeckHeight(), -8]);
  assert.ok(nearestWalk(bridge, network).distance < 0.05);
  for (const sample of fieldnotesPathSamples(0.35))
    assert.equal(
      fieldnotesBlocks(sample.x, sample.z),
      false,
      `path enters furniture at ${sample.x},${sample.z}`,
    );
  for (const stop of fieldnotesStreet)
    assert.equal(
      onFieldnotesPath(stop.point[0], stop.point[1], 0.02),
      true,
      stop.label,
    );
});

test("continuous paving supports feet and leaves the bridge joint clear", () => {
  let hits = 0;
  for (const sample of fieldnotesPathSamples(0.45)) {
    const hit = new Raycaster(
      new Vector3(sample.x, 5, sample.z),
      new Vector3(0, -1, 0),
    ).intersectObject(paving)[0];
    if (!fieldnotesExpectsPaving(sample.x, sample.z)) continue;
    assert.ok(hit, `missing paving at ${sample.x},${sample.z}`);
    assert.ok(Math.abs(hit.point.y - fieldnotesDeckHeight()) < 0.004);
    hits += 1;
  }
  assert.ok(hits > 40);
  assert.equal(rayDown(0, 0, [paving]).length, 0);
  assert.ok(rayDown(0, -6.2, [paving]).length > 0);
  const court = rayDown(-2.15, 2.5, [paving]);
  assert.equal(court.length, 0);
});

test("the writing chair faces the desk with room to approach", () => {
  const knee =
    fieldnotesDesk.z -
    fieldnotesDesk.hz -
    (fieldnotesChair.z + fieldnotesChair.front);
  const approach = fieldnotesChair.z - fieldnotesChair.back - (0.95 + 1.64 / 2);
  assert.ok(knee > 0.32 && knee < 0.55, `knee ${knee}`);
  assert.ok(approach > 0.3, `approach ${approach}`);
  assert.ok(fieldnotesDesk.z > fieldnotesChair.z);
});

test("signs sit on a physical support and columns meet the soffit", () => {
  const signs = fieldnotesSignPoses();
  for (const sign of Object.values(signs)) {
    const origin = new Vector3(...sign.position);
    const direction = new Vector3(...sign.normal).multiplyScalar(-1);
    const hit = new Raycaster(origin, direction, 0, 0.05).intersectObjects(
      meshes,
    )[0];
    assert.ok(hit, `${sign.title} is unsupported`);
    assert.ok(hit.distance < 0.04);
  }
  for (const column of fieldnotesColumnPoints()) {
    const soffit =
      fieldnotesCanopyY(column.x, column.z) - fieldnotesCanopy.thickness;
    const hit = new Raycaster(
      new Vector3(column.x, 0.2, column.z),
      new Vector3(0, 1, 0),
    ).intersectObjects(meshes)[0];
    assert.ok(hit, "column misses the canopy");
    assert.ok(
      Math.abs(hit.point.y - soffit) < 0.03,
      `${hit.point.y} vs ${soffit}`,
    );
  }
});

test("architecture stays off the incoming bridge and under the triangle budget", async () => {
  const { walkwayPlacements } = await import("../app/lib/world-paths.mjs");
  let checked = 0;
  for (const pieces of Object.values(walkwayPlacements()))
    for (const piece of pieces) {
      const center = localOf(piece.position);
      if (Math.hypot(center.x, center.z) > 18) continue;
      const nx = Math.max(2, Math.ceil(piece.size[0] / 0.2));
      const nz = Math.max(2, Math.ceil(piece.size[2] / 0.2));
      for (let ix = 0; ix <= nx; ix++)
        for (let iz = 0; iz <= nz; iz++) {
          const point = piece.position
            .clone()
            .addScaledVector(piece.right, (ix / nx - 0.5) * piece.size[0])
            .addScaledVector(piece.forward, (iz / nz - 0.5) * piece.size[2]);
          const local = localOf(point);
          if (local.z < -16) continue;
          assert.equal(
            rayDown(local.x, local.z).length,
            0,
            `bridge hits the garden at ${local.x},${local.z}`,
          );
          checked += 1;
        }
    }
  assert.ok(checked > 40);
  const budget = fieldnotesMeshBudget(built);
  assert.ok(budget.triangles < 20000, `triangles ${budget.triangles}`);
  assert.ok(budget.triangles > 400);
  assert.ok(budget.materials <= 8);
  assert.equal(fieldnotesMaterialNames.length, 7);
  const source = readFileSync(
    new URL("../app/components/personal/FutureStudio.jsx", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("transmission"), false);
  assert.equal(source.includes("PavedWalks"), false);
});

test("walking spawn faces into the garden with a clear camera boom", () => {
  const state = walkStart("future");
  const feet = localOf(state.position);
  const heading = state.forward
    .clone()
    .applyQuaternion(region.rotation.clone().invert());
  assert.ok(Math.abs(feet.x - fieldnotesSpawn[0]) < 0.02);
  assert.ok(Math.abs(feet.z - fieldnotesSpawn[1]) < 0.02);
  assert.ok(Math.abs(feet.y - fieldnotesDeckHeight() - 0.004) < 0.02);
  assert.ok(heading.z > 0.9);
  const target = feet.clone().add(new Vector3(0, 1.05, 0));
  const boom = heading
    .clone()
    .multiplyScalar(-4.1)
    .add(new Vector3(0, 4.1 * 0.46, 0));
  const hit = new Raycaster(
    target,
    boom.clone().normalize(),
    0.15,
    boom.length(),
  ).intersectObjects(meshes)[0];
  assert.ok(!hit || hit.distance > 3.8, `boom ${hit?.distance}`);
  for (const view of [fieldnotesArrival, ...Object.values(fieldnotesCameras)])
    for (const frame of [view, view.portrait]) {
      const distance = Math.hypot(
        frame.position[0] - frame.target[0],
        frame.position[1] - frame.target[1],
        frame.position[2] - frame.target[2],
      );
      assert.ok(distance > 3.4, distance);
      assert.ok(
        frame.position[1] >
          surfaceHeight("future", frame.position[0], frame.position[2]) + 1,
      );
    }
});

test("fieldnotes attributes stay finite", () => {
  for (const geometry of Object.values(built)) {
    assert.ok(triangleCount(geometry) > 0);
    for (const attribute of Object.values(geometry.attributes))
      assert.ok([...attribute.array].every(Number.isFinite));
    assert.ok(geometry.getAttribute("uv"));
    assert.ok(geometry.getAttribute("normal"));
  }
  material.dispose();
});

test("destination walking starts stay on the visible paving and clear the camera boom", () => {
  const m = new MeshBasicMaterial();
  const objects = Object.values(built).map((g) => new Mesh(g, m));
  objects.forEach((o) => o.updateMatrixWorld());
  for (const [id, entry] of Object.entries(fieldnotesWalkEntries)) {
    const state = walkStart("future", false, id),
      feet = localOf(state.position);
    assert.ok(
      Math.hypot(feet.x - entry.point[0], feet.z - entry.point[1]) < 0.02,
      id,
    );
    const hit = rayDown(feet.x, feet.z, [paving])[0];
    assert.ok(hit, id + " missing pavement");
    assert.ok(
      Math.abs(feet.y - hit.point.y) < 0.015,
      id + " feet not grounded",
    );
    const forward = state.forward
      .clone()
      .applyQuaternion(region.rotation.clone().invert());
    const target = feet.clone().add(new Vector3(0, 1.05, 0));
    const boom = forward
      .multiplyScalar(-4.1)
      .add(new Vector3(0, 4.1 * 0.46, 0));
    const collision = new Raycaster(
      target,
      boom.clone().normalize(),
      0.15,
      boom.length(),
    ).intersectObjects(objects)[0];
    assert.ok(!collision, id + " camera blocked at " + collision?.distance);
  }
  m.dispose();
});

test("furniture pads have front-facing tops and lounge seat height is human scale", () => {
  const m = new MeshBasicMaterial(),
    deck = new Mesh(built.terraces, m);
  deck.updateMatrixWorld();
  for (const t of fieldnotesTerraces) {
    const hit = rayDown(t.x, t.z, [deck])[0];
    assert.ok(hit);
    assert.ok(Math.abs(hit.point.y - 0.022) < 0.002);
  }
  const seatHeight = 0.022 + (0.59 + 0.31 / 2) * fieldnotesLoungeScale;
  assert.ok(seatHeight > 0.42 && seatHeight < 0.51, seatHeight);
  m.dispose();
});

test("canopy normals follow its slope and textured side walls have two-dimensional UVs", () => {
  const normals = built.timber.getAttribute("normal");
  assert.ok(
    Array.from({ length: normals.count }, (_, i) =>
      Math.abs(normals.getZ(i)),
    ).some((v) => v > 0.08 && v < 0.7),
  );
  for (const geometry of [built.stone, built.desk, built.chair]) {
    const p = geometry.getAttribute("position"),
      uv = geometry.getAttribute("uv"),
      n = geometry.getAttribute("normal");
    let sides = 0;
    for (let i = 0; i + 2 < p.count; i += 3) {
      if (Math.abs(n.getX(i)) < 0.95) continue;
      const yz =
        (p.getY(i + 1) - p.getY(i)) * (p.getZ(i + 2) - p.getZ(i)) -
        (p.getZ(i + 1) - p.getZ(i)) * (p.getY(i + 2) - p.getY(i));
      if (Math.abs(yz) < 1e-8) continue;
      const area =
        (uv.getX(i + 1) - uv.getX(i)) * (uv.getY(i + 2) - uv.getY(i)) -
        (uv.getY(i + 1) - uv.getY(i)) * (uv.getX(i + 2) - uv.getX(i));
      assert.ok(Math.abs(area) > 1e-10, "collapsed side UV");
      sides++;
    }
    assert.ok(sides > 0);
  }
});


test("each destination starts with useful forward travel instead of facing a path edge", () => {
  const network=makeWalkNetwork();
  for(const id of Object.keys(fieldnotesWalkEntries)) {
    const state=walkStart("future",false,id), direction=state.forward.clone();
    for(let i=0;i<45;i++) advanceWalker(state,direction,1/60,network);
    assert.ok(state.distance>1.8, `${id}: ${state.distance} metres`);
  }
});
