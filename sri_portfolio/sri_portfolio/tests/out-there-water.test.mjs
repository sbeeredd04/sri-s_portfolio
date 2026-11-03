import test from "node:test";
import assert from "node:assert/strict";
import { Matrix4, MeshStandardMaterial, ShaderLib, Vector3 } from "three";
import { outThereFrame } from "../app/lib/out-there-p11.mjs";
import { outThereLiveSource } from "../app/lib/out-there-site.mjs";
import {
  outThereFall,
  outThereFallImpactNative,
  outThereFallRole,
  prepareOutThereWater,
} from "../app/lib/out-there-water.mjs";
import { shippedModel } from "./helpers/authored-model.mjs";

test("refined fall roles and splash datum match the shipped sheet, creek join and impact", async () => {
  const { scene } = await shippedModel(outThereLiveSource.split("?")[0]);
  const points = (name) => {
    const node = scene.getObjectByName(name);
    const mesh = node.isMesh ? node : node.children.find((child) => child.isMesh);
    assert.equal(mesh.material.name, "PT_Falls");
    const { position } = mesh.geometry.attributes;
    return Array.from({ length: position.count }, (_, i) =>
      new Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
  };
  const toNative = ([x, y, z]) => new Vector3(
    x * outThereFrame.unitsPerMetre,
    y * outThereFrame.unitsPerMetre + outThereFrame.seaLevel,
    z * outThereFrame.unitsPerMetre,
  );
  const nearest = (list, p) => Math.min(...list.map((v) => v.distanceTo(p)));
  assert.deepEqual(Object.keys(outThereFallRole).sort(), ["falls_foam", "falls_lip", "waterfall"]);
  assert.ok(nearest(points("waterfall"), toNative(outThereFall.lip)) < 0.06);
  assert.ok(nearest(points("falls_lip"), toNative(outThereFall.lip)) < 0.06);
  const impact = new Vector3(...outThereFallImpactNative);
  assert.ok(nearest(points("waterfall"), impact) < 0.06);
  assert.ok(nearest(points("falls_foam"), impact) < 0.65);
});

test("sheet, feeder and foam use independent shader programs on the same water clock", () => {
  const uniforms = {
    time: { value: 2.5 }, wind: { value: 0.2 }, inverse: { value: new Matrix4() },
  };
  const shaders = new Map();
  const cacheKeys = new Set();
  for (const kind of Object.values(outThereFallRole)) {
    const material = new MeshStandardMaterial();
    const shader = { vertexShader: ShaderLib.standard.vertexShader,
      fragmentShader: ShaderLib.standard.fragmentShader, uniforms: {} };
    prepareOutThereWater(material, kind, uniforms);
    material.onBeforeCompile(shader);
    cacheKeys.add(material.customProgramCacheKey());
    assert.equal(shader.uniforms.uP11Time, uniforms.time);
    assert.equal(shader.uniforms.uP11Inverse, uniforms.inverse);
    assert.equal(shader.uniforms.uP11Time.value, 2.5);
    shaders.set(kind, shader.fragmentShader);
    material.dispose();
  }
  assert.equal(cacheKeys.size, 3);
  const sheet = shaders.get("sheet");
  assert.match(sheet, /sqrt\([^\n]+drop\)/);
  assert.match(sheet, /fallAge-uP11Time/);
  assert.match(sheet, /fallNoise\(threads\).*fallNoise\(grains\)/);
  assert.match(sheet, /diffuseColor\.a\*=edge/);
  assert.match(shaders.get("feeder"), /vP11\.z\*21\.-uP11Time/);
  assert.match(shaders.get("foam"), /r\*7\.-uP11Time/);
  assert.doesNotMatch(shaders.get("foam"), /fallAge/);
});
