import test from "node:test";
import assert from "node:assert/strict";
import { navigationStop } from "../app/lib/mobile-navigation.mjs";

test("phone navigation returns old first-person visits to an authored camera", () => {
  assert.equal(navigationStop("studio", "roam:roof", true), "arrival");
  assert.equal(navigationStop("future", "roam:writing", true), "writing");
  assert.equal(navigationStop("trail", "roam:overlook", true), "overlook");
  assert.equal(navigationStop("studio", "street:4", true), "arrival");
  assert.equal(navigationStop("court", "roam", true), "arrival");
});

test("authored closeups, cinematic views and desktop walking remain available", () => {
  for (const stop of ["arrival", "desk", "bookshelf", "walk"])
    assert.equal(navigationStop("studio", stop, true), stop);
  for (const stop of ["roam", "roam:roof", "street:4"])
    assert.equal(navigationStop("studio", stop, false), stop);
});
