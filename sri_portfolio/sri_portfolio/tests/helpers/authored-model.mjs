import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { homeSite } from "../../app/lib/home-site.mjs";

export async function authoredModel(name) {
  const source = {
    "home-landform": homeSite.landform,
    "home-architecture": homeSite.architecture,
  }[name];
  assert.ok(source, `Unknown authored model ${name}`);
  const model = await shippedModel(source.split("?")[0]);
  const version = new URL(source, "https://local.invalid").searchParams.get(
    "v",
  );
  assert.ok(
    version && version.length >= 16,
    "shipped model has a content version",
  );
  assert.equal(
    createHash("sha256")
      .update(model.bytes)
      .digest("hex")
      .slice(0, version.length),
    version,
    `${name}: shipped version must describe the rendered asset`,
  );
  return model;
}

export async function shippedModel(path) {
  assert.ok(path.startsWith("/models/") && !path.includes(".."));
  const bytes = await readFile(new URL(`../../public${path}`, import.meta.url));
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene, animations } = await new Promise((resolve, reject) =>
    loader.parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
      resolve,
      reject,
    ),
  );
  scene.updateMatrixWorld(true);
  return { scene, bytes, animations };
}
