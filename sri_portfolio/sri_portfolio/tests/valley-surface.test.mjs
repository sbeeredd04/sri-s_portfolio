import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import {
  buildDeck,
  buildWaterRibbon,
  buildBanks,
  buildGraniteForm,
} from "../app/lib/granite-geometry.mjs";
import {
  valleyFloorWeight,
  watercoursePoints,
  outdoorsLift,
  wall,
  wallOutward,
  overlookDeck,
  graniteForms,
} from "../app/lib/valley-layout.mjs";
import {
  createTerrainGeometry,
  renderedSurfaceHeight,
} from "../app/lib/terrain-geometry.mjs";
import {
  localTrailGround,
  trailFootHeight,
} from "../app/lib/trail-surface.mjs";
import { makeWalkNetwork, nearestWalk } from "../app/lib/walk-network.mjs";
import { worldPoint, regions } from "../app/lib/world-layout.mjs";

test("the valley floor blend is finite and confined to its intended region", () => {
  assert.equal(valleyFloorWeight(-4, -10), 1);
  for (const [x, z] of [
    [-30, -10],
    [20, -10],
    [0, 10],
    [0, -30],
  ])
    assert.equal(valleyFloorWeight(x, z), 0);
  for (let x = -30; x <= 20; x++)
    for (let z = -30; z <= 10; z++) {
      const w = valleyFloorWeight(x, z);
      assert.ok(Number.isFinite(w) && w >= 0 && w <= 1);
    }
});

test("all generated landscape meshes contain valid vertex indices and normals", () => {
  const meshes = [
    buildDeck(localTrailGround),
    buildWaterRibbon(),
    buildBanks(localTrailGround),
    ...graniteForms.map(buildGraniteForm),
  ];
  for (const g of meshes) {
    assert.ok(g.index.count > 0);
    for (const i of g.index.array)
      assert.ok(
        i >= 0 && i < g.attributes.position.count,
        `index ${i} exceeds ${g.attributes.position.count}`,
      );
    for (const attr of Object.values(g.attributes))
      for (const n of attr.array) assert.ok(Number.isFinite(n));
    g.dispose();
  }
});

test("the whole falling ribbon has width and stays in front of the rendered cliff", () => {
  const water = buildWaterRibbon(),
    p = water.attributes.position,
    points = watercoursePoints();
  const mesh = new Mesh(
    buildGraniteForm(wall),
    new MeshBasicMaterial({ side: DoubleSide }),
  );
  mesh.updateMatrixWorld();
  const outward = wallOutward(),
    n = new Vector3(outward.x, 0, outward.z),
    ray = new Raycaster();
  const left = new Vector3(),
    right = new Vector3(),
    sample = new Vector3();
  for (let i = 0; i < points.length; i++) {
    left.fromBufferAttribute(p, i * 2);
    right.fromBufferAttribute(p, i * 2 + 1);
    assert.ok(
      Math.abs(left.distanceTo(right) - points[i].half * 2) < 0.0001,
      `collapsed water at ${i}`,
    );
    if (points[i].ground) continue;
    for (const t of [0.05, 0.5, 0.95]) {
      sample.copy(left).lerp(right, t);
      ray.set(sample.clone().addScaledVector(n, 2), n.clone().negate());
      const hits = ray.intersectObject(mesh);
      assert.ok(
        hits.length && hits[0].distance > 2.012,
        `water intersects rock at ${i},${t}`,
      );
    }
  }
  water.dispose();
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test("the stream clears the actual refined terrain across its full wet channel", () => {
  const water = buildWaterRibbon(),
    p = water.attributes.position,
    points = watercoursePoints();
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    d = new Vector3();
  for (let i = 0; i < points.length - 1; i++) {
    if (!points[i].ground) continue;
    a.fromBufferAttribute(p, i * 2);
    b.fromBufferAttribute(p, i * 2 + 1);
    c.fromBufferAttribute(p, (i + 1) * 2);
    d.fromBufferAttribute(p, (i + 1) * 2 + 1);
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9])
      for (const u of [0.2, 0.5, 0.8]) {
        const point = a.clone().lerp(c, t).lerp(b.clone().lerp(d, t), u);
        const floor =
          renderedSurfaceHeight("trail", point.x, point.z) - outdoorsLift;
        assert.ok(
          point.y - floor > 0.004,
          `buried stream at ${point.x},${point.z}: ${point.y - floor}`,
        );
      }
  }
  water.dispose();
  const terrain = createTerrainGeometry();
  // 320x200 globe; relief cells in every biome are refined, so the budget
  // covers all biomes rather than the valley alone. One draw call.
  assert.ok(terrain.userData.refinedTriangleCount <= 190000);
  assert.ok(terrain.index.count / 3 < 320000);
  terrain.dispose();
});

test("the visitor feet and level overlook agree with the rendered platform", () => {
  const mesh = new Mesh(buildDeck(localTrailGround), new MeshBasicMaterial());
  mesh.updateMatrixWorld();
  const deck = overlookDeck(),
    ray = new Raycaster(new Vector3(deck.x, 10, deck.z), new Vector3(0, -1, 0));
  const hit = ray.intersectObject(mesh)[0];
  assert.ok(hit);
  const foot = trailFootHeight(deck.x, deck.z) - outdoorsLift;
  assert.ok(foot >= hit.point.y && foot - hit.point.y < 0.012);
  const network = makeWalkNetwork(),
    region = regions.find((r) => r.id === "trail");
  const location = nearestWalk(
    worldPoint("trail", [deck.x, foot + outdoorsLift, deck.z]),
    network,
  );
  const actual =
    location.center.clone().sub(region.center).dot(region.normal) -
    outdoorsLift;
  assert.ok(
    actual >= hit.point.y && actual - hit.point.y < 0.025,
    `feet ${actual}, platform ${hit.point.y}`,
  );
  mesh.geometry.dispose();
  mesh.material.dispose();
});
