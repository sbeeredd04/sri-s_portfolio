import test from "node:test";
import {
  BufferGeometry,
  BufferAttribute,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
  Vector3,
} from "three";
import assert from "node:assert/strict";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { stat } from "node:fs/promises";
import { workshops, projectWalks } from "../app/lib/project-town-layout.mjs";
import { walkingJoins } from "../app/lib/walk-network.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
test("authored workshop shell stays inside all six sites and keeps full paving clear", async () => {
  const d = await new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .read("public/models/workshop-shell.glb");
  const b = getBounds(d.getRoot().listScenes()[0]);
  assert.ok(Math.abs(b.min[1]) < 0.001);
  assert.ok(b.max[1] < 4.08);
  assert.ok(
    b.min[0] >= -1.846 &&
      b.max[0] <= 1.846 &&
      b.min[2] >= -1.721 &&
      b.max[2] <= 1.821,
  );
  for (const site of workshops) {
    const yaw = site.rotation?.[1] || 0;
    const corners = [];
    for (const x of [b.min[0], b.max[0]])
      for (const z of [b.min[2], b.max[2]])
        corners.push([
          site.position[0] + x * Math.cos(yaw) + z * Math.sin(yaw),
          site.position[2] - x * Math.sin(yaw) + z * Math.cos(yaw),
        ]);
    const x0 = Math.min(...corners.map((c) => c[0])),
      x1 = Math.max(...corners.map((c) => c[0]));
    const z0 = Math.min(...corners.map((c) => c[1])),
      z1 = Math.max(...corners.map((c) => c[1]));
    for (const stone of pavingCells([
      ...projectWalks,
      ...walkingJoins.projects,
    ])) {
      assert.ok(
        stone.x + pavingSize[0] / 2 <= x0 ||
          stone.x - pavingSize[0] / 2 >= x1 ||
          stone.z + pavingSize[2] / 2 <= z0 ||
          stone.z - pavingSize[2] / 2 >= z1,
        `${site.id} paving intersects shell including roof`,
      );
    }
  }
  // Raycast the shipped geometry across the actual clear entrance aperture.
  const material = new MeshBasicMaterial({ side: DoubleSide }),
    meshes = [];
  for (const node of d.getRoot().listNodes())
    for (const p of node.getMesh()?.listPrimitives() || []) {
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(
          new Float32Array(p.getAttribute("POSITION").getArray()),
          3,
        ),
      );
      geometry.setIndex(
        new BufferAttribute(new Uint32Array(p.getIndices().getArray()), 1),
      );
      geometry.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));
      meshes.push(new Mesh(geometry, material));
    }
  for (const x of [-1.35, 0, 1.35])
    for (const y of [0.25, 1.3, 2.95]) {
      const ray = new Raycaster(
        new Vector3(x, y, 2.3),
        new Vector3(0, 0, -1),
        0,
        1.25,
      );
      assert.equal(
        ray.intersectObjects(meshes).length,
        0,
        `entry blocked at ${x},${y}`,
      );
    }
  // Roof and soffit must stay behind the visible fascia, not cut through its label.
  for (const x of [-1.4, 0, 1.4])
    for (const y of [3.3, 3.46, 3.6, 3.95]) {
      const ray = new Raycaster(
        new Vector3(x, y, 2.3),
        new Vector3(0, 0, -1),
        0,
        0.74,
      );
      assert.equal(
        ray.intersectObjects(meshes).length,
        0,
        `fascia obscured at ${x},${y}`,
      );
    }
  for (const mesh of meshes) mesh.geometry.dispose();
  material.dispose();
  const primitives = d
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives());
  const tris = primitives.reduce(
    (n, p) => n + p.getIndices().getCount() / 3,
    0,
  );
  assert.ok(tris < 12000);
  assert.equal(d.getRoot().listMaterials().length, 3);
  for (const name of ["oiled_timber", "mineral_plinth"]) {
    const m = d
      .getRoot()
      .listMaterials()
      .find((m) => m.getName() === name);
    assert.ok(
      m.getBaseColorTexture() &&
        m.getNormalTexture() &&
        m.getMetallicRoughnessTexture(),
    );
  }
  assert.ok((await stat("public/models/workshop-shell.glb")).size < 1100000);
  console.log({
    bounds: b,
    triangles: tris,
    bytes: (await stat("public/models/workshop-shell.glb")).size,
  });
});
