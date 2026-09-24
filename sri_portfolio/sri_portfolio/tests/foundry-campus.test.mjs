import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import {
  campusBatches,
  campusBench,
  campusCenter,
  campusExhibits,
  campusFeet,
  campusGlassSpec,
  campusMeadow,
  campusPaths,
  campusPoint,
  campusRadii,
  campusRadius,
  campusView,
  courtyardLoop,
  entryAngle,
  entryGap,
  exhibitFacing,
  exhibitPoses,
  hitsRib,
  inOpening,
  insideCampusMass,
  nearGlass,
  radialAngle,
  visitorShoulder,
} from "../app/lib/campus-layout.mjs";
import {
  buildCampusGeometry,
  campusMeshBudget,
  disposeCampus,
  triangleCount,
} from "../app/lib/campus-geometry.mjs";
import {
  projectGallerySites,
  projectWalks,
  workshops,
} from "../app/lib/project-town-layout.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
import { renderedSurfaceHeight } from "../app/lib/terrain-geometry.mjs";
import {
  WORLD_RADIUS,
  regions,
  surfaceHeight,
} from "../app/lib/world-layout.mjs";
import {
  advanceWalker,
  makeWalkNetwork,
  nearestWalk,
  walkStart,
} from "../app/lib/walk-network.mjs";

const network = makeWalkNetwork();
const region = regions.find((item) => item.id === "projects");

function project(cameraPosition, cameraTarget, fov, aspect, point) {
  const camera = new PerspectiveCamera(fov, aspect, 0.1, 200);
  camera.position.set(...cameraPosition);
  camera.up.set(0, 1, 0);
  camera.lookAt(new Vector3(...cameraTarget));
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return new Vector3(...point).project(camera);
}
function localOf(position) {
  const relative = position.clone().sub(region.center);
  return [relative.dot(region.east), relative.dot(region.north)];
}
function steer(state, dx, dz) {
  const desired = region.east
    .clone()
    .multiplyScalar(dx)
    .add(region.north.clone().multiplyScalar(dz));
  if (desired.lengthSq() > 0) desired.normalize();
  advanceWalker(state, desired, 1 / 60, network);
}

test("the Foundry pad stays level under the workshops and the new ring", () => {
  assert.equal(WORLD_RADIUS, 450);
  const far = campusPoint(entryAngle + Math.PI, campusRadii.eaveOuter);
  for (const [x, z] of [
    [0, 0],
    [0, 11],
    [-5, -2.2],
    [6, 3.4],
    [-8.5, -10.5],
    [7.7, -11.1],
    [0, -16],
    [campusCenter.x, campusCenter.z],
    [far.x, far.z],
    [campusRadii.eaveOuter, campusCenter.z],
  ])
    assert.ok(
      Math.abs(surfaceHeight("projects", x, z)) < 0.03,
      `sloping ground at ${x}, ${z}`,
    );
});

test("the ring keeps the existing studios, galleries and mobile shelf", () => {
  assert.equal(workshops.length, 6);
  assert.deepEqual(projectGallerySites.mobile.position, [-8.5, 0, -10.5]);
  assert.deepEqual(projectGallerySites.hackathons.position, [7.7, 0, -11.1]);
  for (const id of [
    "workbench",
    "mobile",
    "hackathons",
    "aether",
    "agentex",
    "gitcue",
    "mesa",
    "csdna",
    "soda",
  ])
    assert.ok(placeStops.projects.some((stop) => stop.id === id));
  const mobile = readFileSync(
    new URL("../app/json/more-work.js", import.meta.url),
    "utf8",
  );
  for (const id of ["aatram", "simsim", "ios-101"])
    assert.match(mobile, new RegExp(`id: "${id}"`));
  assert.match(mobile, /id6760587556/);
  for (const id of ["ring", "campus"]) {
    const stop = placeStops.projects.find((item) => item.id === id);
    assert.equal(stop.collection, "mobile");
    assert.equal(stop.content, "work");
  }
  assert.deepEqual(placeStops.projects.find((s) => s.id === "ring").position, [
    ...campusView().overview.position,
  ]);
  assert.deepEqual(
    placeStops.projects.find((s) => s.id === "campus").position,
    [...campusView().court.position],
  );
});

test("campus paths join the Foundry walk and only cross the ring at the entry", () => {
  const join = campusPaths()[0][0];
  assert.deepEqual(join, [0, -16]);
  const projects = network.filter((segment) => segment.world === "projects");
  let hits = 0;
  for (const segment of projects) {
    const localA = localOf(segment.a);
    const localB = localOf(segment.b);
    if (
      Math.hypot(localA[0] - join[0], localA[1] - join[1]) < 0.2 ||
      Math.hypot(localB[0] - join[0], localB[1] - join[1]) < 0.2
    )
      hits += 1;
  }
  assert.ok(hits >= 2, "campus approach is not tied into the passage");
  for (const [a, b] of campusPaths())
    for (let step = 0; step <= 12; step++) {
      const t = step / 12;
      const x = a[0] + (b[0] - a[0]) * t;
      const z = a[1] + (b[1] - a[1]) * t;
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      for (const side of [-1.35, 0, 1.35]) {
        const px = x + (-dz / len) * side;
        const pz = z + (dx / len) * side;
        assert.equal(
          nearGlass(px, pz, "inner"),
          false,
          `inner glass ${px},${pz}`,
        );
        assert.equal(
          nearGlass(px, pz, "outer"),
          false,
          `outer glass ${px},${pz}`,
        );
        assert.equal(insideCampusMass(px, pz), false, `floor ${px},${pz}`);
        assert.equal(hitsRib(px, pz), false, `rib ${px},${pz}`);
        const radius = campusRadius(px, pz);
        if (radius > campusRadii.floorInner && radius < campusRadii.floorOuter)
          assert.ok(
            inOpening(radialAngle(px, pz), entryAngle, entryGap - 0.04),
            `path misses the entry at ${px},${pz}`,
          );
      }
    }
});

test("full paving width and a visitor shoulder clear columns, planting and exhibits", () => {
  const hx = pavingSize[0] / 2 + visitorShoulder;
  const hz = pavingSize[2] / 2 + visitorShoulder;
  const obstacles = [
    ...campusMeadow().map((plant) => ({
      x: plant.x,
      z: plant.z,
      hx: plant.radius,
      hz: plant.radius,
    })),
    ...exhibitPoses().map((pose) => ({
      x: pose.x,
      z: pose.z,
      hx: pose.radius,
      hz: pose.radius,
    })),
    {
      x: campusBench.x,
      z: campusBench.z,
      hx: campusBench.hx,
      hz: campusBench.hz,
    },
  ];
  for (const stone of pavingCells(campusPaths())) {
    for (const x of [stone.x - hx, stone.x, stone.x + hx])
      for (const z of [stone.z - hz, stone.z, stone.z + hz]) {
        assert.equal(insideCampusMass(x, z), false, `mass ${x},${z}`);
        assert.equal(hitsRib(x, z, 0.02), false, `rib ${x},${z}`);
      }
    for (const obstacle of obstacles) {
      const dx = Math.max(0, Math.abs(stone.x - obstacle.x) - hx - obstacle.hx);
      const dz = Math.max(0, Math.abs(stone.z - obstacle.z) - hz - obstacle.hz);
      assert.ok(
        Math.hypot(dx, dz) > 0,
        `obstacle ${obstacle.x},${obstacle.z} meets ${stone.x},${stone.z}`,
      );
    }
  }
  assert.ok(projectWalks.length > campusPaths().length);
});

test("each exhibit bay has an open approach and faces the courtyard", () => {
  for (const exhibit of campusExhibits) {
    assert.equal(
      inOpening(exhibit.angle, entryAngle, entryGap + exhibit.half),
      false,
    );
    const facing = exhibitFacing(exhibit);
    const inward = {
      x: -Math.cos(exhibit.angle),
      z: -Math.sin(exhibit.angle),
    };
    assert.ok(facing.x * inward.x + facing.z * inward.z > 0.98);
    for (
      let radius = campusRadii.court + 0.8;
      radius <= campusRadii.floorInner - 0.08;
      radius += 0.3
    ) {
      const p = campusPoint(exhibit.angle, radius);
      assert.equal(insideCampusMass(p.x, p.z), false);
      assert.equal(nearGlass(p.x, p.z, "inner"), false);
      assert.equal(hitsRib(p.x, p.z), false);
    }
  }
  const shelf = campusPoint(-Math.PI / 2, campusRadii.stand);
  assert.ok(shelf.z < campusBench.z);
  assert.ok(campusBench.z > campusCenter.z);
});

test("on foot starts at the selected campus stop and can reach the courtyard", () => {
  const feet = campusFeet();
  for (const entry of ["campus", "ring"]) {
    const [x, z] = localOf(walkStart("projects", false, entry).position);
    assert.ok(
      Math.hypot(x - feet[entry].x, z - feet[entry].z) < 0.05,
      `${entry} starts at ${x}, ${z}`,
    );
  }
  const home = localOf(walkStart("projects").position);
  assert.ok(Math.hypot(home[0] + 2.8, home[1] - 11.7) < 0.05);
  const state = walkStart("projects", false, "ring");
  const loop = courtyardLoop();
  const goals = [[campusCenter.x, -18.05], loop[0], ...loop.slice(1, 11)];
  for (const [tx, tz] of goals) {
    let reached = false;
    for (let i = 0; i < 280; i++) {
      const [x, z] = localOf(state.position);
      if (Math.hypot(x - tx, z - tz) < 0.6) {
        reached = true;
        break;
      }
      steer(state, tx - x, tz - z);
    }
    const [x, z] = localOf(state.position);
    assert.ok(
      reached,
      `stopped at ${x.toFixed(2)}, ${z.toFixed(2)} before ${tx}, ${tz}`,
    );
  }
  const court = nearestWalk(state.position, network);
  assert.equal(court.segment.world, "projects");
  assert.ok(Math.sqrt(court.distance) < 0.2);
});

test("the ring floor clears rendered ground and the skirt is buried", () => {
  const built = buildCampusGeometry();
  const stone = built.stone.attributes.position;
  const lows = new Map();
  for (let i = 0; i < stone.count; i++) {
    const key = `${stone.getX(i).toFixed(2)}:${stone.getZ(i).toFixed(2)}`;
    const y = stone.getY(i);
    const span = lows.get(key) || { min: Infinity, max: -Infinity };
    span.min = Math.min(span.min, y);
    span.max = Math.max(span.max, y);
    lows.set(key, span);
  }
  for (const [key, span] of lows) {
    const [x, z] = key.split(":").map(Number);
    const ground = renderedSurfaceHeight("projects", x, z);
    assert.ok(span.min < ground - 0.02, `skirt floats at ${key}`);
    assert.ok(span.max > ground + 0.03, `skirt misses the floor at ${key}`);
  }
  const canopy = built.canopy.attributes.position;
  let checked = 0;
  for (let i = 0; i < canopy.count; i++) {
    if (canopy.getY(i) > 1) continue;
    const ground = renderedSurfaceHeight(
      "projects",
      canopy.getX(i),
      canopy.getZ(i),
    );
    assert.ok(canopy.getY(i) > ground + 0.02);
    checked += 1;
  }
  assert.ok(checked > 100);
  const glass = built.glass.attributes;
  let outward = 0,
    outer = 0;
  for (let i = 0; i < glass.position.count; i++) {
    const x = glass.position.getX(i),
      z = glass.position.getZ(i);
    if (Math.abs(campusRadius(x, z) - campusRadii.glassOuter) > 0.2) continue;
    outer += 1;
    const nx = glass.normal.getX(i),
      nz = glass.normal.getZ(i);
    if (nx * (x - campusCenter.x) + nz * (z - campusCenter.z) > 0.5)
      outward += 1;
  }
  assert.ok(outward / outer > 0.9, "outer glass faces inward");
  disposeCampus(built);
});

test("overview and courtyard cameras frame the ring on desktop and phone", () => {
  const view = campusView();
  const shelfPoint = campusPoint(-Math.PI / 2, campusRadii.stand, 1.2);
  const entry = campusPoint(entryAngle, campusRadii.eaveOuter, 2.55);
  const shelf = [shelfPoint.x, shelfPoint.y, shelfPoint.z];
  const gate = [entry.x, entry.y, entry.z];
  const meadow = [campusCenter.x, 0.45, campusCenter.z];
  const east = [campusCenter.x + campusRadii.eaveOuter, 2.45, campusCenter.z];
  const west = [campusCenter.x - campusRadii.eaveOuter, 2.45, campusCenter.z];
  const desktopMarks = [shelf, gate, meadow, east, west];
  for (const mark of desktopMarks) {
    const ndc = project(
      view.overview.position,
      view.overview.target,
      45,
      1280 / 800,
      mark,
    );
    assert.ok(
      Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.88,
      `desktop overview ${ndc.toArray()}`,
    );
  }
  for (const mark of [shelf, [entry.x, entry.y, entry.z], meadow]) {
    const ndc = project(
      view.overview.portrait.position,
      view.overview.portrait.target,
      view.overview.portrait.fov,
      390 / 844,
      mark,
    );
    assert.ok(
      Math.abs(ndc.x) < 0.88 && ndc.y < 0.82 && ndc.y > -0.86,
      `phone overview ${ndc.toArray()}`,
    );
  }
  const close = project(
    view.court.position,
    view.court.target,
    45,
    1280 / 800,
    shelf,
  );
  assert.ok(Math.abs(close.x) < 0.55 && Math.abs(close.y) < 0.55);
  const phone = project(
    view.court.portrait.position,
    view.court.portrait.target,
    view.court.portrait.fov,
    390 / 844,
    shelf,
  );
  assert.ok(Math.abs(phone.x) < 0.62 && Math.abs(phone.y) < 0.7);
  for (const camera of [
    view.overview,
    view.overview.portrait,
    view.court,
    view.court.portrait,
  ]) {
    assert.equal(
      insideCampusMass(camera.position[0], camera.position[2]),
      false,
    );
    assert.ok(
      camera.position[1] >
        renderedSurfaceHeight(
          "projects",
          camera.position[0],
          camera.position[2],
        ) +
          1,
    );
  }
});

test("the campus stays inside the structural budget without glass transmission", () => {
  const budget = campusMeshBudget();
  assert.ok(budget.triangles < 24000, `triangles ${budget.triangles}`);
  assert.ok(budget.triangles > 1000);
  assert.equal(budget.materials, campusBatches.length);
  assert.ok(campusBatches.length <= 8);
  assert.equal(campusGlassSpec.transmission, 0);
  const source = readFileSync(
    new URL("../app/components/personal/FoundryCampus.jsx", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("transmission"), false);
  assert.equal(source.includes("Light"), false);
  const built = buildCampusGeometry();
  assert.ok(triangleCount(built.glass) > 0);
  disposeCampus(built);
});

// Use the same boxes as WorldPaths, not a centerline proxy: the previous
// placement passed local-courtyard checks while a complete bridge crossed it.
test("every connecting deck, curb and lamp clears the rendered campus", async () => {
  const { walkwayPlacements } = await import("../app/lib/world-paths.mjs");
  const { Mesh, MeshBasicMaterial, Raycaster } = await import("three");
  const built = buildCampusGeometry();
  const material = new MeshBasicMaterial();
  const campus = [built.canopy, built.stone, built.wood, built.metal].map(
    (g) => new Mesh(g, material),
  );
  campus.forEach((mesh) => mesh.updateMatrixWorld());
  let checked = 0;
  for (const pieces of Object.values(walkwayPlacements()))
    for (const piece of pieces) {
      const [x, z] = localOf(piece.position);
      if (campusRadius(x, z) > campusRadii.eaveOuter + 10) continue;
      const nx = Math.max(2, Math.ceil(piece.size[0] / 0.18));
      const nz = Math.max(2, Math.ceil(piece.size[2] / 0.18));
      for (let ix = 0; ix <= nx; ix++)
        for (let iz = 0; iz <= nz; iz++) {
          const p = piece.position
            .clone()
            .addScaledVector(piece.right, (ix / nx - 0.5) * piece.size[0])
            .addScaledVector(piece.forward, (iz / nz - 0.5) * piece.size[2]);
          const [px, pz] = localOf(p);
          const ray = new Raycaster(
            new Vector3(px, 20, pz),
            new Vector3(0, -1, 0),
            0,
            25,
          );
          assert.equal(
            ray.intersectObjects(campus).length,
            0,
            `connecting infrastructure intersects campus at ${px}, ${pz}`,
          );
          checked++;
        }
    }
  assert.ok(checked > 50, "the full bridge approach was not examined");
  material.dispose();
  disposeCampus(built);
});

test("continuous courtyard paving supports visitor feet and full corridor width", async () => {
  const { buildCampusPaving, campusPavingHeight } =
    await import("../app/lib/campus-surface.mjs");
  const { Mesh, MeshBasicMaterial, Raycaster } = await import("three");
  const geometry = buildCampusPaving(),
    material = new MeshBasicMaterial();
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  for (const [a, b] of campusPaths()) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz);
    for (let step = 0; step <= 20; step++)
      for (const side of [-0.82, 0, 0.82]) {
        const x = a[0] + (dx * step) / 20 - (dz / length) * side;
        const z = a[1] + (dz * step) / 20 + (dx / length) * side;
        const ray = new Raycaster(new Vector3(x, 5, z), new Vector3(0, -1, 0));
        const hit = ray.intersectObject(mesh)[0];
        assert.ok(hit, `missing FrontSide paving at ${x},${z}`);
        assert.ok(Math.abs(hit.point.y - campusPavingHeight()) < 0.0001);
        assert.ok(
          hit.point.y > renderedSurfaceHeight("projects", x, z) + 0.01,
          `terrain above path at ${x},${z}`,
        );
      }
  }
  for (const id of ["ring", "campus"]) {
    const state = walkStart("projects", false, id),
      relative = state.position.clone().sub(region.center);
    assert.ok(
      Math.abs(relative.dot(region.normal) - campusPavingHeight() - 0.004) <
        0.0001,
    );
  }
  geometry.dispose();
  material.dispose();
});

test("actual curved path mesh clears the architecture, tree and seating", async () => {
  const { buildCampusPaving } = await import("../app/lib/campus-surface.mjs");
  const { Mesh, MeshBasicMaterial, Raycaster } = await import("three");
  const built = buildCampusGeometry(),
    paving = buildCampusPaving(),
    material = new MeshBasicMaterial();
  const mesh = new Mesh(paving, material);
  mesh.updateMatrixWorld();
  for (const key of ["canopy", "stone", "wood", "metal", "garden"]) {
    const p = built[key].attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < 0.1) continue;
      const hit = new Raycaster(
        new Vector3(p.getX(i), 10, p.getZ(i)),
        new Vector3(0, -1, 0),
      ).intersectObject(mesh);
      assert.equal(
        hit.length,
        0,
        `${key} overhangs path at ${p.getX(i)},${p.getZ(i)}`,
      );
    }
  }
  paving.dispose();
  material.dispose();
  disposeCampus(built);
});

test("all campus attributes and screen atlas UVs stay finite", () => {
  const built = buildCampusGeometry();
  for (const geometry of [
    ...["canopy", "stone", "wood", "metal", "garden", "glass"].map(
      (key) => built[key],
    ),
    ...Object.values(built.parts),
  ]) {
    for (const attribute of Object.values(geometry.attributes))
      assert.ok([...attribute.array].every(Number.isFinite));
    assert.ok(geometry.attributes.uv);
  }
  const uv = built.parts.tabletScreen.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    assert.ok(uv.getX(i) >= 0.5 && uv.getX(i) <= 1);
    assert.ok(uv.getY(i) >= 1 - 354 / 512 && uv.getY(i) <= 1);
  }
  disposeCampus(built);
});

test("campus walking entries leave a clear third-person camera boom", async () => {
  const { Mesh, MeshBasicMaterial, Raycaster } = await import("three");
  const built = buildCampusGeometry(),
    material = new MeshBasicMaterial();
  const solids = ["canopy", "stone", "wood", "metal", "garden"].map(
    (key) => new Mesh(built[key], material),
  );
  solids.forEach((mesh) => mesh.updateMatrixWorld());
  for (const entry of ["ring", "campus"]) {
    const s = walkStart("projects", false, entry);
    const inverse = region.rotation.clone().invert();
    const feet = s.position.clone().sub(region.center).applyQuaternion(inverse);
    const heading = s.forward.clone().applyQuaternion(inverse);
    const target = feet.clone().add(new Vector3(0, 1.05, 0));
    const boom = heading
      .multiplyScalar(-4.1)
      .add(new Vector3(0, 4.1 * 0.46, 0));
    const hit = new Raycaster(
      target,
      boom.clone().normalize(),
      0.15,
      boom.length(),
    ).intersectObjects(solids)[0];
    assert.ok(
      !hit || hit.distance > 3.8,
      `${entry} camera collapses to ${hit?.distance}`,
    );
  }
  material.dispose();
  disposeCampus(built);
});
