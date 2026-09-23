import test from "node:test";
import assert from "node:assert/strict";
import {
  sfBlocks,
  coitSite,
  sfNeighborhoodBatches,
  apartmentBaseBatches,
  cityBatchGeometry,
} from "../app/lib/sf-neighborhood.mjs";
import { APARTMENT_LEVEL, apartmentPoint } from "../app/lib/studio-layout.mjs";
import { streetRoutes } from "../app/lib/street-view.mjs";
import {
  worldPoint,
  surfaceHeight,
  groundColliderData,
} from "../app/lib/world-layout.mjs";

test("SF full building projections and landmark plaza clear the street carriageways", () => {
  for (const block of sfBlocks) {
    // Include the cornice and the front sill, not merely the wall box.
    const minX = block.x - block.width / 2 - 0.25,
      maxX = block.x + block.width / 2 + 0.25;
    const minZ = block.z - block.depth / 2 - 0.25,
      maxZ = block.z + block.depth / 2 + 0.55;
    assert.ok(maxX < 9.9 || minX > 13.1);
    for (const z of [-10, -22]) assert.ok(maxZ < z - 1.6 || minZ > z + 1.6);
  }
  assert.ok(coitSite.x - coitSite.radius > 13.3);
});

test("apartment base stops below the visible apartment floor and roof walk clears the railing", () => {
  const b = apartmentBaseBatches();
  const roof = b.roof[0];
  assert.ok(roof.position[1] + roof.size[1] / 2 < APARTMENT_LEVEL + 0.1275);
  for (const n of streetRoutes.studio.filter((n) => !n.worldPosition)) {
    assert.ok(n.point[0] > -6.42 && n.point[0] < 6.42);
    assert.ok(n.point[1] < 6.8);
  }
  const p = worldPoint("studio", apartmentPoint([0, 1.68, 0]));
  assert.ok(
    Math.abs(p.y - worldPoint("studio", [0, 1.68, 0]).y - APARTMENT_LEVEL) <
      1e-8,
  );
});

test("elevated physics terrain still agrees with the outdoor ground", () => {
  const [v] = groundColliderData("studio", APARTMENT_LEVEL + 0.15);
  for (let i = 0; i < v.length; i += 3)
    assert.ok(
      Math.abs(
        v[i + 1] +
          APARTMENT_LEVEL +
          0.15 -
          surfaceHeight("studio", v[i], v[i + 2]),
      ) < 1e-5,
    );
});

test("city detail uses bounded merged geometry rather than one draw per window", () => {
  const data = sfNeighborhoodBatches();
  assert.ok(Object.keys(data).length <= 12);
  let triangles = 0;
  for (const items of Object.values(data)) {
    const g = cityBatchGeometry(items);
    triangles += g.attributes.position.count / 3;
    g.dispose();
  }
  assert.ok(triangles < 30000, `city geometry has ${triangles} triangles`);
});
