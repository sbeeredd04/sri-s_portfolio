import test from "node:test";
import {
  Box3,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
  Vector3,
} from "three";
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
import { streetRange, streetRoutes } from "../app/lib/street-view.mjs";
import { authoredModel } from "./helpers/authored-model.mjs";
import { wallClock } from "../app/lib/world-time.mjs";

test("authored Home houses sit on their complete rendered landform pads", async () => {
  const { scene } = await authoredModel("home-landform");
  const architecture = (await authoredModel("home-architecture")).scene;
  const houses = [];
  architecture.traverse((node) => {
    if (/^Rowhouse_\d+_Root$/.test(node.name)) houses.push(node);
  });
  const terrain = scene.getObjectByName("Home_ContinuousHill");
  assert.ok(terrain);
  assert.ok(houses.length === 15, "both Painted Ladies rows are checked");
  const ray = new Raycaster();
  let checked = 0;
  for (const house of houses) {
    const bounds = new Box3().setFromObject(house);
    const [x0, z0, x1, z1] = [
      bounds.min.x,
      bounds.min.z,
      bounds.max.x,
      bounds.max.z,
    ];
    const ground = house.getWorldPosition(new Vector3()).y;
    for (let i = 0; i <= 8; i++)
      for (let j = 0; j <= 10; j++) {
        const x = x0 + ((x1 - x0) * i) / 8,
          z = z0 + ((z1 - z0) * j) / 10;
        ray.set(new Vector3(x, 75, z), new Vector3(0, -1, 0));
        const hit = ray.intersectObject(terrain, true)[0];
        assert.ok(hit, `${house.name}: missing terrain at ${x},${z}`);
        assert.ok(
          hit.point.y >= ground - 0.055 && hit.point.y <= ground + 0.03,
          `${house.name}: ground ${hit.point.y}, foundation ${ground}`,
        );
        checked++;
      }
  }
  assert.ok(checked >= 1200);
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
  const built = buildLandmarks();
  const layout = built.layout;
  const model = {
    boxes: { ...built.market.boxes, ...built.tower.boxes },
    shells: { ...built.market.shells, ...built.tower.shells },
  };
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
    // Authored on level ground; the plan sites are held level above.
    const ground = 0;
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const ray = new Raycaster(new Vector3(x, 5, z), new Vector3(0, -1, 0));
    const foundations = [
      built.tower.boxes.stone,
      built.market.boxes.stone,
      model.shells.pale,
    ].map((g) => new Mesh(g, material));
    const hits = ray.intersectObjects(foundations);
    assert.ok(
      hits.some((hit) => hit.point.y < ground - 0.2) &&
        hits.some((hit) => hit.point.y >= ground - 0.05),
      `foundation does not straddle the ground at ${x}, ${z}`,
    );
    material.dispose();
  }
  disposeLandmarks(built);
});

test("Made walking keeps the campus and the Bay as separate journeys", () => {
  const route = streetRoutes.projects;
  assert.ok(streetRoutes.studio.every((node) => node.group !== "bay"));
  const bay = route
    .map((node, index) => (node.group === "bay" ? index : -1))
    .filter((i) => i >= 0);
  assert.equal(bay.length, 5);
  assert.equal(streetRange("projects", "street:0").end, bay[0] - 1);
  assert.equal(streetRange("projects", `street:${bay[0]}`).start, bay[0]);
  assert.equal(
    streetRange("projects", `street:${bay[0]}`).end,
    route.length - 1,
  );
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
  let triangles = 0,
    parts = 0;
  for (const part of [model.tower, model.market])
    for (const geometry of [
      ...Object.values(part.boxes),
      ...Object.values(part.shells),
    ]) {
      triangles += geometry.attributes.position.count / 3;
      parts++;
    }
  // Added continuous crown louvers and belfry detail: stay under the reviewed 16k budget.
  assert.ok(triangles < 16000, `${triangles} triangles`);
  assert.ok(parts <= 16);
  disposeLandmarks(model);
});
