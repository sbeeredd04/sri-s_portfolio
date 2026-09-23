import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import {
  inGraniteFootprint,
  inOverlookDeck,
  lake,
  lakeDistance,
  meadowTufts,
  outdoorsLift,
  overlookDeck,
  renderedTrail,
  talusSpots,
  trailCenter,
  trailView,
  watercoursePoints,
} from "../app/lib/valley-layout.mjs";
import {
  buildBanks,
  buildGraniteForm,
  buildWaterRibbon,
  embedBase,
  valleyMeshBudget,
} from "../app/lib/granite-geometry.mjs";
import { graniteForms, wall } from "../app/lib/valley-layout.mjs";
import { valleyMaterialCount } from "../app/lib/valley-materials.mjs";
import { overlookSegments, trailTrees } from "../app/lib/trail-layout.mjs";
import { streetRoutes } from "../app/lib/street-view.mjs";
import { renderedSurfaceHeight } from "../app/lib/terrain-geometry.mjs";
import { WORLD_RADIUS } from "../app/lib/world-layout.mjs";

const heightAt = (x, z) => renderedSurfaceHeight("trail", x, z) - outdoorsLift;

function ribbonEdges(points, halfAt) {
  const edges = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next[0] - previous[0],
      dz = next[1] - previous[1];
    const length = Math.hypot(dx, dz) || 1;
    const half = halfAt(index);
    for (const sign of [-1, 1])
      edges.push([
        point[0] + (-dz / length) * sign * half,
        point[1] + (dx / length) * sign * half,
      ]);
  });
  return edges;
}
function routeEdges() {
  const main = [];
  for (
    let z = renderedTrail.start;
    z >= renderedTrail.end - 1e-4;
    z -= renderedTrail.step
  )
    main.push([trailCenter(z), z]);
  const spur = overlookSegments();
  return [
    ...ribbonEdges(main, () => renderedTrail.half),
    ...ribbonEdges(
      [spur[0][0], ...spur.map((segment) => segment[1])],
      (index) => (index === 0 ? spur[0][2] : spur[index - 1][2]) / 2,
    ),
  ];
}
function project(cameraPosition, cameraTarget, fov, aspect, point) {
  const camera = new PerspectiveCamera(fov, aspect, 0.1, 200);
  camera.position.set(...cameraPosition);
  camera.up.set(0, 1, 0);
  camera.lookAt(new Vector3(...cameraTarget));
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return new Vector3(...point).project(camera);
}

test("the world radius stays at the completed SF size", () => {
  assert.equal(WORLD_RADIUS, 190);
});

test("granite, water and the deck clear the full rendered trail width", () => {
  const edges = routeEdges();
  for (const [x, z] of edges) {
    assert.ok(
      !inGraniteFootprint(x, z, 0.8),
      `granite crosses the trail at ${x.toFixed(2)},${z.toFixed(2)}`,
    );
    assert.ok(
      !inOverlookDeck(x, z, -0.15) ||
        Math.hypot(x - overlookDeck().x, z - overlookDeck().z) < 1.7,
      "deck blocks the approach",
    );
  }
  const course = watercoursePoints().filter((point) => point.ground);
  for (const [x, z] of edges)
    for (const sample of course) {
      const gap = Math.hypot(x - sample.x, z - sample.z);
      assert.ok(
        gap > sample.half + 0.85,
        `stream meets the trail (${gap.toFixed(2)})`,
      );
    }
  for (let i = 1; i < streetRoutes.trail.length; i++)
    for (let j = 0; j <= 24; j++) {
      const t = j / 24;
      const a = streetRoutes.trail[i - 1].point;
      const b = streetRoutes.trail[i].point;
      const x = a[0] + (b[0] - a[0]) * t;
      const z = a[1] + (b[1] - a[1]) * t;
      for (const side of [-0.65, 0, 0.65])
        assert.ok(!inGraniteFootprint(x + side, z, 0.8));
    }
});

test("the waterfall drops into a stream that joins the lake", () => {
  const points = watercoursePoints();
  const lip = points[0];
  const toe = points.find((point) => point.ground);
  assert.ok(lip.y - toe.y > 5, `fall is only ${(lip.y - toe.y).toFixed(2)}`);
  for (let i = 1; i < points.length; i++)
    assert.ok(
      points[i].y <= points[i - 1].y + 1e-6,
      `water rises from ${points[i - 1].y} to ${points[i].y}`,
    );
  const end = points.at(-1);
  assert.equal(end.y, lake.level);
  assert.ok(lakeDistance(end.x, end.z) < lake.radius - 0.8);
  assert.ok(lakeDistance(points.at(-2).x, points.at(-2).z) < lake.radius);
  const ribbon = buildWaterRibbon();
  const position = ribbon.attributes.position;
  let minEdge = Infinity;
  for (let i = 0; i < position.count; i++) {
    assert.ok(Number.isFinite(position.getY(i)));
    minEdge = Math.min(
      minEdge,
      Math.hypot(position.getX(i) - lake.x, position.getZ(i) - lake.z),
    );
  }
  assert.ok(minEdge < lake.radius - 0.5, "ribbon never enters the lake");
  ribbon.dispose();
});

test("valley rocks, banks and water stay under the triangle and material budget", () => {
  const triangles = valleyMeshBudget(heightAt);
  assert.ok(triangles < 35000, `valley uses ${triangles} triangles`);
  assert.ok(valleyMaterialCount <= 8);
  assert.ok(trailTrees.length >= 8, `only ${trailTrees.length} framing trees`);
  assert.ok(meadowTufts().length >= 4, "meadow is empty");
  assert.ok(talusSpots().length >= 3, "talus is empty");
});

test("rendered rock bases and stream banks sit in the ground", () => {
  for (const form of graniteForms) {
    const geometry = embedBase(buildGraniteForm(form), heightAt);
    const position = geometry.attributes.position;
    let lowest = Infinity;
    for (let i = 0; i < position.count; i++)
      lowest = Math.min(lowest, position.getY(i));
    let contacts = 0;
    for (let i = 0; i < position.count; i++) {
      if (position.getY(i) > lowest + 0.25) continue;
      contacts += 1;
      const ground = heightAt(position.getX(i), position.getZ(i));
      assert.ok(
        position.getY(i) < ground - 0.05,
        `${form.kind} floats at ${position.getX(i).toFixed(1)},${position.getZ(i).toFixed(1)}`,
      );
      assert.ok(
        position.getY(i) > ground - 1.8,
        `${form.kind} spikes through the ground`,
      );
    }
    assert.ok(contacts > 8, `${form.kind} has no grounded base`);
    geometry.dispose();
  }
  const banks = buildBanks(heightAt);
  const position = banks.attributes.position;
  for (let i = 1; i < position.count; i += 2) {
    const ground = heightAt(position.getX(i), position.getZ(i));
    assert.ok(
      Math.abs(position.getY(i) - (ground - 0.03)) < 1e-4,
      "bank outer edge leaves the terrain",
    );
  }
  banks.dispose();
  for (const spot of talusSpots()) {
    const ground = heightAt(spot.x, spot.z);
    assert.ok(Math.abs(spot.x - trailCenter(spot.z)) > 1.5);
    assert.ok(ground > -0.4, "talus sits in the lake");
  }
});

test("arrival and overlook cameras frame the valley outside the rock", () => {
  const view = trailView();
  const lip = watercoursePoints()[0];
  const dome = graniteForms.find((form) => form.kind === "dome");
  const marks = [
    [lip.x, lip.y, lip.z],
    [dome.x, dome.height * 0.7, dome.z],
    [lake.x, 0.2, lake.z],
    [graniteForms[2].x, 2.2, graniteForms[2].z],
  ];
  const desktop = view.arrival;
  for (const mark of marks) {
    const ndc = project(desktop.position, desktop.target, 45, 1280 / 800, mark);
    assert.ok(Math.abs(ndc.x) < 0.92 && Math.abs(ndc.y) < 0.9, ndc.toArray());
  }
  const framed = marks
    .slice(0, 2)
    .map((mark) =>
      project(desktop.position, desktop.target, 45, 1280 / 800, mark),
    );
  assert.ok((framed[0].x + framed[1].x) / 2 > -0.05);
  const phone = view.arrival.portrait;
  for (const mark of marks) {
    const ndc = project(
      phone.position,
      phone.target,
      phone.fov,
      390 / 844,
      mark,
    );
    assert.ok(
      Math.abs(ndc.x) < 0.9 && ndc.y < 0.78 && ndc.y > -0.82,
      `phone crop ${ndc.toArray()}`,
    );
  }
  for (const camera of [desktop, view.overlook, view.overlook.portrait]) {
    assert.ok(!inGraniteFootprint(camera.position[0], camera.position[2], 0.4));
    assert.ok(
      camera.position[1] >
        renderedSurfaceHeight("trail", camera.position[0], camera.position[2]) +
          1,
    );
  }
  const overlook = project(
    view.overlook.position,
    view.overlook.target,
    45,
    1280 / 800,
    [lip.x, lip.y * 0.7, lip.z],
  );
  assert.ok(Math.abs(overlook.x) < 0.85 && Math.abs(overlook.y) < 0.85);
});

test("the sheer wall faces the valley", () => {
  const geometry = buildGraniteForm(graniteForms[0]);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const c = Math.cos(wall.turn),
    s = Math.sin(wall.turn);
  const outward = { x: c, z: s };
  let score = 0,
    count = 0;
  for (let i = 0; i < position.count; i++) {
    if (position.getY(i) < 2 || position.getY(i) > 8) continue;
    const dx = position.getX(i) - wall.x,
      dz = position.getZ(i) - wall.z;
    if (dx * c + dz * s < -1.2) continue;
    score += normal.getX(i) * outward.x + normal.getZ(i) * outward.z;
    count += 1;
  }
  assert.ok(count > 20);
  assert.ok(score / count > 0.35, `wall faces away (${score / count})`);
  geometry.dispose();
});
