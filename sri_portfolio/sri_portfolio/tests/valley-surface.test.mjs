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
  graniteForms,
} from "../app/lib/valley-layout.mjs";
import {
  createTerrainGeometry,
  renderedSurfaceHeight,
} from "../app/lib/terrain-geometry.mjs";
import {
  localTrailGround,
} from "../app/lib/trail-surface.mjs";
import { makeWalkNetwork, nearestWalk } from "../app/lib/walk-network.mjs";
import { worldPoint } from "../app/lib/world-layout.mjs";

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

test("authored trail feet and full paving widths agree with the current decoded GLB", async () => {
  const { readFile } = await import("node:fs/promises");
  const { createHash } = await import("node:crypto");
  const { NodeIO } = await import("@gltf-transform/core");
  const { ALL_EXTENSIONS } = await import("@gltf-transform/extensions");
  const { MeshoptDecoder } = await import("meshoptimizer");
  const { Matrix4, Triangle } = await import("three");
  const { outThereWalkSource, outThereWalks } = await import("../app/lib/out-there-walk-runtime.mjs");
  const { outThereLiveSource } = await import("../app/lib/out-there-site.mjs");
  const audit = JSON.parse(await readFile(new URL("../app/lib/out-there-refined-walk-profiles.json", import.meta.url)));
  const bytes = await readFile(new URL("../public/models/islands/out-there-refined.glb", import.meta.url));
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.equal(audit.modelSha256, digest, "the clearance certificate must cover the model actually shipped");
  assert.equal(outThereWalkSource, digest);
  assert.ok(outThereLiveSource.endsWith(digest.slice(0, 16)));
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.readBinary(bytes);
  const cells = new Map();
  const size = 2;
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    let owner = node;
    while (!owner.getName() && owner.getParentNode()) owner = owner.getParentNode();
    if (owner.getName() !== "trail_continuous") continue;
    const matrix = new Matrix4().fromArray(node.getWorldMatrix());
    for (const p of node.getMesh().listPrimitives()) {
      const position = p.getAttribute("POSITION"), indices = p.getIndices();
      const point = (i) => new Vector3().fromArray(position.getElement(indices ? indices.getScalar(i) : i, [])).applyMatrix4(matrix).add(new Vector3(0, 6, 0)).multiplyScalar(1 / 1.56);
      for (let i = 0; i < (indices?.getCount() ?? position.getCount()); i += 3) {
        const triangle = new Triangle(point(i), point(i + 1), point(i + 2));
        if (triangle.getNormal(new Vector3()).y < 0.2) continue;
        const vertices = [triangle.a, triangle.b, triangle.c];
        for (let x = Math.floor(Math.min(...vertices.map((p) => p.x)) / size); x <= Math.floor(Math.max(...vertices.map((p) => p.x)) / size); x++)
          for (let z = Math.floor(Math.min(...vertices.map((p) => p.z)) / size); z <= Math.floor(Math.max(...vertices.map((p) => p.z)) / size); z++) {
            const key = `${x},${z}`;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(triangle);
          }
      }
    }
  }
  const support = (x, y, z) => {
    for (const t of cells.get(`${Math.floor(x / size)},${Math.floor(z / size)}`) || []) {
      const a = t.a, b = t.b, c = t.c;
      const den = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
      if (Math.abs(den) < 1e-10) continue;
      const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / den;
      const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / den;
      if (Math.min(u, v, 1 - u - v) >= -1e-5 && Math.abs(u * a.y + v * b.y + (1 - u - v) * c.y - y) < 0.23) return true;
    }
    return false;
  };
  const network = makeWalkNetwork().filter((s) => s.world === "trail" && !s.connection);
  const reachable = new Set(["ENTRY"]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of audit.profiles.filter((p) => p.usable))
      if (reachable.has(p.from) || reachable.has(p.to))
        for (const node of [p.from, p.to]) if (!reachable.has(node)) { reachable.add(node); changed = true; }
  }
  assert.deepEqual(outThereWalks.map((w) => w.id).sort(), audit.profiles.filter((p) => p.usable && reachable.has(p.from)).map((p) => p.id).sort());
  let probes = 0;
  for (const walk of outThereWalks) {
    const profile = audit.profiles.find((p) => p.id === walk.id);
    assert.equal(profile.usable, true);
    assert.deepEqual(profile.problems, []);
    assert.deepEqual(profile.obstacles, []);
    assert.equal(walk.points.length, profile.points.length);
    for (let i = 0; i < walk.points.length; i++) {
      const point = profile.points[i], [x, y, z] = point.position;
      assert.deepEqual(walk.points[i], [...point.position, point.halfWidth]);
      for (let offset = -point.rawPavingHalfWidth; offset <= point.rawPavingHalfWidth + 0.00001; offset += 0.1) {
        assert.ok(support(x + point.normalXZ[0] * offset, y, z + point.normalXZ[1] * offset), `${walk.id} full paving width lacks support at ${i}/${offset}`);
        probes++;
      }
      const foot = worldPoint("trail", [x, y + 0.004, z]);
      assert.ok(nearestWalk(foot, network).distance < 1e-10, `${walk.id} foot datum diverges from exported paving`);
    }
  }
  assert.ok(probes > 15000, "the whole enabled paving width must be sampled");
});
