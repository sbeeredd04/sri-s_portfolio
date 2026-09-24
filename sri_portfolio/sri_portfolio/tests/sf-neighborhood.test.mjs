import test from "node:test";
import assert from "node:assert/strict";
import { apartmentBaseBatches } from "../app/lib/sf-neighborhood.mjs";
import { APARTMENT_LEVEL, apartmentPoint } from "../app/lib/studio-layout.mjs";
import { streetRoutes } from "../app/lib/street-view.mjs";
import {
  worldPoint,
  surfaceHeight,
  groundColliderData,
} from "../app/lib/world-layout.mjs";

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
