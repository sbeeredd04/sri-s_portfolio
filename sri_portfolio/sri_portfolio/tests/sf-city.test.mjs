import test from "node:test";
import assert from "node:assert/strict";
import {
  avenueDistance,
  coastDistance,
  inPark,
  landmarkSites,
  marketDistance,
  marketStreet,
  sfLots,
} from "../app/lib/sf-plan.mjs";
import { streetAt } from "../app/lib/sf-streets.mjs";
import { buildCity, SETBACK } from "../app/lib/sf-buildings.mjs";
import { sfTerrainHeight, sfHills } from "../app/lib/sf-terrain.mjs";
import { surfaceHeight } from "../app/lib/world-layout.mjs";

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

test("the city fills its districts with lots in every style", () => {
  const lots = sfLots();
  assert.ok(lots.length > 60, `${lots.length} lots`);
  const districts = new Set(lots.map((l) => l.district));
  for (const d of ["western", "russian", "soma"])
    assert.ok(districts.has(d), d);
  assert.ok(lots.filter((l) => l.ladies).length >= 3, "painted ladies row");
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

test("Coit stands on a level crest and hills fade before the flat city", () => {
  const { coit } = landmarkSites;
  const top = surfaceHeight("studio", coit.x, coit.z);
  assert.ok(top > 9, `crest ${top}`);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const h = surfaceHeight(
      "studio",
      coit.x + Math.cos(a) * coit.radius,
      coit.z + Math.sin(a) * coit.radius,
    );
    assert.ok(Math.abs(h - top) < 0.2, `pad tilts ${h - top}`);
  }
  const { ferry, salesforce, transamerica } = landmarkSites;
  for (const site of [ferry, salesforce, transamerica])
    assert.equal(sfTerrainHeight(site.x, site.z), 0);
  assert.ok(sfHills.every((h) => h.height > 0));
  assert.equal(sfTerrainHeight(0, 2), 0, "apartment ground is level");
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
