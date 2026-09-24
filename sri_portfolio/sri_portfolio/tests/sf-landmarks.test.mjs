import test from "node:test";
import { Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import assert from "node:assert/strict";
import {
  buildLandmarks,
  clockHandRadians,
  disposeLandmarks,
  landmarkLayout,
  marketSite,
  towerPlanScale,
  towerSite,
} from "../app/lib/sf-landmarks.mjs";
import { sfBlocks, coitSite } from "../app/lib/sf-neighborhood.mjs";
import { streetRange, streetRoutes } from "../app/lib/street-view.mjs";
import {
  WORLD_RADIUS,
  regions,
  surfaceHeight,
  regionDistance,
} from "../app/lib/world-layout.mjs";
import { renderedSurfaceHeight } from "../app/lib/terrain-geometry.mjs";
import { wallClock } from "../app/lib/world-time.mjs";

function rect(x, z, hx, hz) {
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}
function overlaps(a, b, gap = 0) {
  return (
    a.minX < b.maxX + gap &&
    a.maxX > b.minX - gap &&
    a.minZ < b.maxZ + gap &&
    a.maxZ > b.minZ - gap
  );
}
function hitsCircle(cx, cz, radius, box) {
  const x = Math.min(Math.max(cx, box.minX), box.maxX);
  const z = Math.min(Math.max(cz, box.minZ), box.maxZ);
  return Math.hypot(x - cx, z - cz) < radius;
}
function homes() {
  return sfBlocks.map((block) =>
    rect(block.x, block.z, block.width / 2 + 0.3, block.depth / 2 + 0.6),
  );
}

test("the enlarged SF plateau stays flat under the tower, hall and overlook", () => {
  assert.equal(WORLD_RADIUS, 450);
  const studio = regions.find((region) => region.id === "studio");
  assert.ok(
    studio.landCenter,
    "the city expands toward the landmarks, away from the Bay",
  );
  assert.ok(studio.outer - studio.inner >= 22);
  const { length, depth } = marketSite;
  const corners = [
    [towerSite.x - towerSite.width / 2, towerSite.z - towerSite.depth / 2],
    [towerSite.x + towerSite.width / 2, towerSite.z + towerSite.depth / 2],
    [marketSite.x - length / 2, marketSite.z - depth / 2],
    [marketSite.x + length / 2, marketSite.z + depth / 2],
    [36.2, -40.4],
  ];
  for (const [x, z] of corners) {
    assert.ok(
      regionDistance(studio, x, z) < studio.inner - 0.8,
      `footprint leaves the flat plateau at ${x}, ${z}`,
    );
    assert.ok(Math.abs(surfaceHeight("studio", x, z)) < 0.03);
  }
});

test("the tower plan is a rounded taper rather than a cylinder or a cone", () => {
  const mid = towerPlanScale(0.5);
  const top = towerPlanScale(1);
  const linear = {
    x: 1 + (top.x - 1) * 0.5,
    z: 1 + (top.z - 1) * 0.5,
  };
  assert.ok(Math.abs(mid.x - linear.x) > 0.02);
  assert.ok(top.x < 0.9 && top.z < top.x);
  const face = towerSite.width / 2;
  const corner = Math.hypot(
    towerSite.width / 2 - towerSite.corner + towerSite.corner * Math.SQRT1_2,
    towerSite.depth / 2 - towerSite.corner + towerSite.corner * Math.SQRT1_2,
  );
  assert.ok(corner > face + 0.8);
});

test("landmark meshes keep their footprints, a real door and ground contact", () => {
  const model = buildLandmarks();
  const layout = model.layout;
  const glass = model.shells.towerGlass.attributes.position;
  let baseMin = Infinity,
    baseMax = 0,
    topRadius = 0,
    topCount = 0,
    doorBlocked = false,
    peak = 0;
  for (let i = 0; i < glass.count; i++) {
    const x = glass.getX(i),
      y = glass.getY(i),
      z = glass.getZ(i);
    peak = Math.max(peak, y);
    const radius = Math.hypot(x - towerSite.x, z - towerSite.z);
    if (y < layout.towerPad.plinthTop + 0.4) {
      baseMin = Math.min(baseMin, radius);
      baseMax = Math.max(baseMax, radius);
    }
    if (y > 24) {
      topRadius += radius;
      topCount += 1;
    }
    if (
      y > 0.5 &&
      y < 2.6 &&
      Math.hypot(x - (towerSite.x - towerSite.width / 2), z - towerSite.z) <
        0.35
    )
      doorBlocked = true;
  }
  assert.ok(baseMax - baseMin > 0.7, "base reads as a rounded rectangle");
  assert.ok(topCount > 0 && topRadius / topCount < (baseMin + baseMax) / 2);
  assert.equal(doorBlocked, false);
  for (const geometry of Object.values(model.shells))
    peak = Math.max(peak, geometry.boundingBox.max.y);
  for (const geometry of Object.values(model.boxes))
    peak = Math.max(peak, geometry.boundingBox.max.y);
  assert.ok(peak > 29.4 && peak < 30.6, `tower height ${peak}`);
  for (const [x, z] of [
    [towerSite.x, towerSite.z],
    [
      marketSite.x + marketSite.length / 2 - 0.4,
      marketSite.z - marketSite.depth / 2 + 0.4,
    ],
  ]) {
    const ground = Math.min(
      surfaceHeight("studio", x, z),
      renderedSurfaceHeight("studio", x, z),
    );
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const ray = new Raycaster(new Vector3(x, 5, z), new Vector3(0, -1, 0));
    const foundations = [model.boxes.stone, model.shells.pale].map(
      (g) => new Mesh(g, material),
    );
    const hits = ray.intersectObjects(foundations);
    assert.ok(
      hits.some((hit) => hit.point.y < ground - 0.2) &&
        hits.some((hit) => hit.point.y >= ground - 0.05),
      `foundation does not straddle the ground at ${x}, ${z}`,
    );
    material.dispose();
  }
  const occupied = [
    "trim",
    "pale",
    "oxide",
    "towerGlass",
    "shade",
    "crown",
    "glass",
  ];
  for (const tone of occupied) {
    const geometry = model.boxes[tone] || model.shells[tone];
    if (!geometry) continue;
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      if (y < 0.2) continue;
      for (const road of layout.carriageways)
        assert.ok(
          x < road.minX - 0.05 ||
            x > road.maxX + 0.05 ||
            z < road.minZ - 0.05 ||
            z > road.maxZ + 0.05,
          `${tone} stands in a carriageway at ${x}, ${z}`,
        );
    }
  }
  disposeLandmarks(model);
});

test("new streets clear the houses, Coit and the apartment, and meet the old east street", () => {
  const { tower, market, carriageways, approaches } = landmarkLayout();
  const apartment = rect(0, 1.2, 6.9, 6.2);
  for (const building of [tower, market]) {
    assert.ok(!overlaps(building, apartment, 0.8));
    for (const home of homes()) assert.ok(!overlaps(building, home, 0.8));
    assert.ok(
      !hitsCircle(coitSite.x, coitSite.z, coitSite.radius + 0.9, building),
    );
    for (const road of carriageways) assert.ok(!overlaps(building, road, 0.15));
  }
  for (const road of carriageways) {
    for (const home of homes()) assert.ok(!overlaps(road, home, 0.2));
    assert.ok(!overlaps(road, apartment, 0.4));
    assert.ok(!hitsCircle(coitSite.x, coitSite.z, coitSite.radius + 0.7, road));
  }
  for (const approach of approaches) {
    const meetsDoor =
      overlaps(approach, tower, 0.05) || overlaps(approach, market, 0.05);
    const meetsRoad = carriageways.some((road) =>
      overlaps(approach, road, 0.05),
    );
    assert.ok(meetsDoor && meetsRoad, "door approach must join a street");
  }
  const model = buildLandmarks();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const roadMesh = new Mesh(model.boxes.asphalt, material);
  for (const x of [10.2, 11.5, 12.8]) {
    const ray = new Raycaster(new Vector3(x, 1, -22.5), new Vector3(0, -1, 0));
    assert.ok(
      ray.intersectObject(roadMesh).length,
      "east street extension leaves a gap at the existing curb",
    );
  }
  material.dispose();
  disposeLandmarks(model);
});

test("home walking keeps the apartment and the Bay as separate journeys", () => {
  const route = streetRoutes.studio;
  const bay = route
    .map((node, index) => (node.group === "bay" ? index : -1))
    .filter((i) => i >= 0);
  assert.equal(bay.length, 5);
  assert.equal(streetRange("studio", "street:0").end, bay[0] - 1);
  assert.equal(streetRange("studio", `street:${bay[0]}`).start, bay[0]);
  assert.equal(streetRange("studio", `street:${bay[0]}`).end, route.length - 1);
  assert.ok(route.every((node) => !node.group || node.group === "bay"));
});

test("clock hands follow the San Francisco wall clock across the DST jump", () => {
  const before = new Date("2026-03-08T09:59:00Z");
  const after = new Date("2026-03-08T10:00:00Z");
  assert.deepEqual(wallClock(before), { hour: 1, minute: 59 });
  assert.deepEqual(wallClock(after), { hour: 3, minute: 0 });
  const early = clockHandRadians(before);
  const jumped = clockHandRadians(after);
  assert.ok(Math.abs(early.minute + (59 * Math.PI) / 30) < 1e-8);
  assert.ok(Math.abs(early.hour + ((1 + 59 / 60) * Math.PI) / 6) < 1e-8);
  assert.ok(Math.abs(jumped.minute) < 1e-8);
  assert.ok(Math.abs(jumped.hour + Math.PI / 2) < 1e-8);
});

test("landmark geometry stays merged and bounded", () => {
  const model = buildLandmarks();
  let triangles = 0;
  for (const geometry of [
    ...Object.values(model.boxes),
    ...Object.values(model.shells),
  ])
    triangles += geometry.attributes.position.count / 3;
  // Added continuous crown louvers and belfry detail: stay under the reviewed 16k budget.
  assert.ok(triangles < 16000, `${triangles} triangles`);
  assert.ok(
    Object.keys(model.boxes).length + Object.keys(model.shells).length <= 16,
  );
  disposeLandmarks(model);
});
