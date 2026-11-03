import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Raycaster, Vector3 } from "three";
import { homeSite } from "../app/lib/home-site.mjs";
import { authoredModel } from "./helpers/authored-model.mjs";
import {
  avenueDistance,
  coastDistance,
  inPark,
  marketDistance,
  marketStreet,
  sfLots,
} from "../app/lib/sf-plan.mjs";
import { streetAt } from "../app/lib/sf-streets.mjs";
import { buildCity, SETBACK } from "../app/lib/sf-buildings.mjs";

function corners(lot, grow = 0) {
  const c = Math.cos(lot.facing),
    s = Math.sin(lot.facing);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([a, b]) => {
    const lx = (a * (lot.width + grow)) / 2,
      lz = (b * (lot.depth + grow)) / 2;
    return [lot.x + lx * c + lz * s, lot.z - lx * s + lz * c];
  });
}
// Separating-axis test for two oriented rectangles.
function overlap(a, b) {
  for (const poly of [a, b])
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = poly[i],
        [x2, z2] = poly[(i + 1) % 4];
      const nx = z2 - z1,
        nz = x1 - x2;
      const project = (p) => p.map(([x, z]) => x * nx + z * nz);
      const pa = project(a),
        pb = project(b);
      if (
        Math.max(...pa) <= Math.min(...pb) ||
        Math.max(...pb) <= Math.min(...pa)
      )
        return false;
    }
  return true;
}

test("authored Home has two inhabited rows of correctly scaled Painted Ladies", async () => {
  const { scene } = await authoredModel("home-architecture");
  const houses = [];
  scene.traverse((node) => {
    if (/^Rowhouse_\d+_Root$/.test(node.name)) houses.push(node);
  });
  assert.equal(houses.length, 15);
  assert.equal(
    houses.filter((house) => house.userData.row === "front").length,
    9,
  );
  assert.equal(
    houses.filter((house) => house.userData.row === "back").length,
    6,
  );
  for (const house of houses) {
    const bounds = new Box3().setFromObject(house),
      size = bounds.getSize(new Vector3());
    assert.ok(
      size.x > 6 &&
        size.x < 12 &&
        size.y > 9 &&
        size.y < 15 &&
        size.z > 10 &&
        size.z < 18,
      `${house.name}: human-scale width, height and stoop depth`,
    );
  }
});

test("no two lots overlap", () => {
  const lots = sfLots().map((lot) => corners(lot));
  for (let i = 0; i < lots.length; i++)
    for (let j = i + 1; j < lots.length; j++)
      assert.ok(!overlap(lots[i], lots[j]), `lots ${i} and ${j} overlap`);
});

test("every lot stays off avenues, Market, parks, streets and the coast", () => {
  for (const lot of sfLots())
    for (const [x, z] of corners(lot, -0.1)) {
      assert.ok(avenueDistance(x, z) > 3.3, `avenue at ${x},${z}`);
      assert.ok(
        marketDistance(x, z) > marketStreet.width / 2,
        `market at ${x},${z}`,
      );
      assert.ok(!inPark(x, z), `park at ${x},${z}`);
      assert.ok(coastDistance(x, z) > 4.5, `coast at ${x},${z}`);
      assert.notEqual(streetAt(x, z), "road", `roadway at ${x},${z}`);
    }
});

test("building fronts leave the sidewalk clear for stoops inside the setback", () => {
  for (const lot of sfLots()) {
    const c = Math.cos(lot.facing),
      s = Math.sin(lot.facing);
    const x = lot.x + (lot.depth / 2 + 0.3) * s,
      z = lot.z + (lot.depth / 2 + 0.3) * c;
    assert.ok(
      streetAt(x, z) !== null || inPark(x, z) || lot.ladies || lot.infill,
      `lot at ${lot.x},${lot.z} does not front a street`,
    );
  }
  assert.ok(SETBACK >= 1);
});

test("authored Home summit is supported across its whole building and pool footprint", async () => {
  const { scene } = await authoredModel("home-landform");
  const summitFloorHeight = homeSite.anchors.Summit_EntryAnchor[1];
  const terrain = scene.getObjectByName("Home_ContinuousHill"),
    ray = new Raycaster();
  assert.ok(terrain);
  assert.ok(summitFloorHeight > 20 && summitFloorHeight < 30);
  let count = 0;
  for (let x = -14; x <= 10; x += 1)
    for (let z = -29; z <= -8.4; z += 0.85) {
      ray.set(new Vector3(x, 75, z), new Vector3(0, -1, 0));
      const hit = ray.intersectObject(terrain, true)[0];
      assert.ok(hit, `missing summit support ${x},${z}`);
      assert.ok(
        hit.point.y >= summitFloorHeight - 1.36 &&
          hit.point.y <= summitFloorHeight - 0.04,
        `summit terrain protrudes or misses foundation ${x},${z}: ${hit.point.y}`,
      );
      if (z >= -13.3)
        assert.ok(
          Math.abs(hit.point.y - (summitFloorHeight - 1.27)) < 0.09,
          `pool foundation support ${x},${z}`,
        );
      count++;
    }
  assert.ok(count >= 600);
});

test("the whole city stays a few merged batches under its triangle budget", () => {
  for (const detail of [true, false]) {
    const { geometries, lots } = buildCity({ detail });
    assert.ok(lots > 60);
    assert.ok(Object.keys(geometries).length <= 7);
    let triangles = 0;
    for (const g of Object.values(geometries)) {
      triangles += g.attributes.position.count / 3;
      g.dispose();
    }
    assert.ok(triangles < (detail ? 70000 : 45000), `${triangles} triangles`);
  }
});

test("street dressing stands on sidewalks, clear of roadways and doorsteps", async () => {
  const { sfDressing, dressingBudget } =
    await import("../app/lib/sf-dressing.mjs");
  for (const tier of ["low", "medium", "high"]) {
    const d = sfDressing(tier);
    for (const key of ["trees", "lamps", "hydrants"]) {
      assert.ok(d[key].length <= dressingBudget[tier][key]);
      for (const p of d[key])
        assert.equal(streetAt(p.x, p.z), "walk", `${key} at ${p.x},${p.z}`);
    }
    for (const t of d.forest) assert.ok(avenueDistance(t.x, t.z) >= 5);
  }
});

test("the crowd walks sidewalks and stays inside its tier budget", async () => {
  const { sfCrowd, crowdBudget } = await import("../app/lib/sf-crowd.mjs");
  for (const tier of ["low", "medium", "high"]) {
    const crowd = sfCrowd(tier);
    assert.ok(crowd.length <= crowdBudget[tier]);
    for (const a of crowd.filter((a) => a.path))
      for (const [x, z] of a.path)
        assert.equal(
          streetAt(x, z),
          "walk",
          `walker off the sidewalk at ${x},${z}`,
        );
  }
});

test("the cable car line runs down the middle of a street, gauge and all", async () => {
  const { cableLine } = await import("../app/lib/sf-plan.mjs");
  for (let z = cableLine.from; z <= cableLine.to; z += 1)
    for (const dx of [-1.3, 0, 1.3])
      assert.equal(
        streetAt(cableLine.x + dx, z),
        "road",
        `off road at ${dx}, ${z}`,
      );
});
