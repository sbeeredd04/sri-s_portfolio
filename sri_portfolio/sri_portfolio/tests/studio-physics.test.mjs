import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import {
  studioSurfaces,
  studioProps,
  studioMonitors,
  studioMonitorScale,
} from "../app/lib/studio-layout.mjs";
import { groundColliderData } from "../app/lib/world-layout.mjs";
await RAPIER.init();
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  for (const surface of Object.values(studioSurfaces)) {
    const [x, y, z] = surface.position,
      [w, h, d] = surface.size;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
        .setTranslation(x, y, z)
        .setFriction(0.7),
    );
  }
  for (const monitor of studioMonitors) {
    const [x, y, z] = monitor.position;
    const angle = monitor.rotation / 2;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        ...[0.779, 0.514, 0.048].map((n) => n * studioMonitorScale),
      )
        .setTranslation(x, y, z)
        .setRotation({ x: 0, y: Math.sin(angle), z: 0, w: Math.cos(angle) }),
    );
  }
  world.createCollider(
    RAPIER.ColliderDesc.trimesh(...groundColliderData("studio")).setFriction(
      0.7,
    ),
  );
  return world;
}
function mug(world, position = studioProps.mug.position) {
  const [x, y, z] = position,
    p = studioProps.mug;
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setCcdEnabled(true)
      .setLinearDamping(0.5)
      .setAngularDamping(1.2),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cylinder(p.halfHeight, p.radius)
      .setMass(p.mass)
      .setFriction(0.65)
      .setRestitution(0.12),
    body,
  );
  return body;
}
test("the mug rests on the same desktop used by the visible model", () => {
  const world = setup();
  try {
    const body = mug(world);
    for (let i = 0; i < 240; i++) world.step();
    const expected =
      studioSurfaces.desk.position[1] +
      studioSurfaces.desk.size[1] / 2 +
      studioProps.mug.halfHeight;
    assert.ok(Math.abs(body.translation().y - expected) < 0.012);
    assert.ok(body.isSleeping());
  } finally {
    world.free();
  }
});
test("a mug thrown toward the sofa settles on its seat", () => {
  const world = setup();
  try {
    const body = mug(world, [1.7, 1.7, 0.3]);
    body.setLinvel({ x: 2, y: 1, z: 3 }, true);
    for (let i = 0; i < 600; i++) world.step();
    const p = body.translation();
    assert.ok(p.z > 0.8);
    assert.ok(
      Math.abs(
        p.y -
          (studioSurfaces.sofaSeat.position[1] +
            studioSurfaces.sofaSeat.size[1] / 2 +
            studioProps.mug.halfHeight),
      ) < 0.015,
      JSON.stringify(p),
    );
    assert.ok(Number.isFinite(p.x));
    assert.ok(body.isSleeping());
  } finally {
    world.free();
  }
});
test("the book rests fully on the desktop with room in front of the monitor foot", () => {
  const desk = studioSurfaces.desk,
    book = studioProps.book;
  for (const axis of [0, 2]) {
    assert.ok(
      Math.abs(book.position[axis] - desk.position[axis]) +
        book.halfSize[axis] <
        desk.size[axis] / 2 - 0.035,
    );
  }
  const leftDisplayFront =
    studioMonitors[0].position[2] + (-0.075 + 0.205) * studioMonitorScale;
  assert.ok(book.position[2] - book.halfSize[2] > leftDisplayFront + 0.08);
});

test("the coffee table catches a dropped mug and clears the sofa", () => {
  const world = setup(),
    table = studioSurfaces.coffeeTable;
  try {
    const body = mug(world, [table.position[0], 1.5, table.position[2]]);
    for (let i = 0; i < 240; i++) world.step();
    assert.ok(
      Math.abs(
        body.translation().y -
          (table.position[1] + table.size[1] / 2 + studioProps.mug.halfHeight),
      ) < 0.02,
    );
    assert.ok(
      table.position[0] + table.size[0] / 2 <
        studioSurfaces.sofa.position[0] - studioSurfaces.sofa.size[0] / 2 - 0.3,
    );
  } finally {
    world.free();
  }
});

test("the reading book settles on its visible desk surface", () => {
  const world = setup();
  try {
    const [x, y, z] = studioProps.book.position;
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(...studioProps.book.halfSize)
        .setMass(studioProps.book.mass)
        .setFriction(0.65),
      body,
    );
    for (let i = 0; i < 240; i++) world.step();
    const desktop =
      studioSurfaces.desk.position[1] + studioSurfaces.desk.size[1] / 2;
    assert.ok(
      Math.abs(
        body.translation().y - (desktop + studioProps.book.halfSize[1]),
      ) < 0.012,
    );
  } finally {
    world.free();
  }
});

test("a mug thrown into the open room settles on the floor", () => {
  const world = setup();
  try {
    const body = mug(world, [-2, 1.7, 0.3]);
    body.setLinvel({ x: -0.8, y: 1, z: 3 }, true);
    for (let i = 0; i < 600; i++) world.step();
    const p = body.translation();
    assert.ok(p.z > 0.8);
    assert.ok(p.y > -0.04 && p.y < 0.21, JSON.stringify(p));
    assert.ok(body.isSleeping());
  } finally {
    world.free();
  }
});

test("a mug outside the house lands on the surrounding planet", () => {
  const world = setup();
  try {
    const body = mug(world, [4, 1.5, 7]);
    for (let i = 0; i < 480; i++) world.step();
    const p = body.translation();
    assert.ok(
      Math.abs(p.y - (-0.15 + studioProps.mug.halfHeight)) < 0.025,
      JSON.stringify(p),
    );
    assert.ok(body.isSleeping());
  } finally {
    world.free();
  }
});
