import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, DirectionalLight, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { regions, worldPoint } from "../app/lib/world-layout.mjs";
import { homeSite } from "../app/lib/home-site.mjs";
import { afterHoursCoastSource } from "../app/lib/authored-island-sites.mjs";
import {
  afterHoursThresholdLenses,
  afterHoursThresholdPracticals,
  closeShadowProjection,
  homeStreetLenses,
  homeStreetPracticals,
  lightingShadowSubject,
  shadowFit,
} from "../app/lib/world-lighting-sites.mjs";

async function asset(source) {
  const bytes = await readFile(new URL(`../public${source.split("?")[0]}`, import.meta.url));
  const { scene } = await new Promise((resolve, reject) => new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parse(Uint8Array.from(bytes).buffer, "", resolve, reject));
  scene.updateMatrixWorld(true);
  return scene;
}
const loaded = Promise.all([
  asset(homeSite.architecture), asset(homeSite.landform), asset(afterHoursCoastSource),
]);
const directions = [[-.72, .56, .41], [-.91, .16, .41], [-.5, .8, .5], [0, 1, 0]];
const bounds = (root, name) => {
  const mesh = root.getObjectByName(name);
  assert.ok(mesh, name);
  return new Box3().setFromObject(mesh, true);
};

function fits(world, stop, boxes) {
  const subject = lightingShadowSubject(world, stop);
  const region = regions.find(({ id }) => id === world);
  for (const direction of directions) {
    const fit = shadowFit(subject, direction);
    const light = new DirectionalLight();
    const camera = light.shadow.camera;
    const { offset, near, far } = closeShadowProjection;
    const focus = worldPoint(world, fit.focus);
    const ray = new Vector3(...direction).normalize().applyQuaternion(region.rotation);
    light.position.copy(focus).addScaledVector(ray, offset);
    light.target.position.copy(focus);
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
    camera.up.copy(region.normal);
    Object.assign(camera, {
      left: -fit.width, right: fit.width, top: fit.height, bottom: -fit.height,
      near, far,
    });
    camera.updateProjectionMatrix();
    light.shadow.updateMatrices(light);
    for (const { min, max } of boxes) {
      for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
        const point = worldPoint(world, [x, y, z]);
        const depth = -point.clone().applyMatrix4(camera.matrixWorldInverse).z;
        assert.ok(depth >= near && depth <= far,
          `${world}/${stop} misses depth ${depth}m at ${[x, y, z]} for ${direction}`);
        point.project(camera);
        assert.ok(Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)) <= 1,
          `${world}/${stop} misses subject corner ${[x, y, z]} for ${direction}`);
      }
    }
  }
}

test("Home shadow frusta cover decoded front/back houses, paving and stop-specific subjects", async () => {
  const [architecture, landform] = await loaded;
  const rows = Array.from({ length: 15 }, (_, i) =>
    bounds(architecture, `Rowhouse_${String(i + 1).padStart(2, "0")}_Root`));
  const promenade = bounds(landform, "Home_HarborPromenade");
  const street = bounds(landform, "Home_HarborPromenadeLamps");
  fits("studio", "arrival", [...rows, promenade, street, bounds(architecture, "Summit_Root")]);
  fits("studio", "promenade", [...rows, promenade, street]);
  fits("studio", "harbor", [
    bounds(landform, "Home_HarborPierAndStairs"),
    bounds(landform, "Home_HarborShelterAndMoorings"),
  ]);
});

test("After hours arrival includes courts and pavilion, and the close view includes exterior threshold", async () => {
  const [, , coast] = await loaded;
  const courts = bounds(coast, "AfterHours_CourtHedge_NW_ClippedHedge");
  const pavilion = bounds(coast, "AfterHours_Pavilion_DomeDisc");
  const threshold = bounds(coast, "AfterHours_Garden_LanternGlow_0");
  fits("court", "arrival", [courts, pavilion, threshold]);
  fits("court", "badminton", [courts]);
  const toListeningFrame = new Vector3(0, 0, -43);
  fits("entertainment", "listening",
    [pavilion, threshold].map((box) => box.clone().translate(toListeningFrame)));
});

test("pooled exterior lights sit at the decoded lantern lenses", async () => {
  const [, landform, coast] = await loaded;
  const lamp = landform.getObjectByName("Home_HarborPromenadeLamps");
  const { position, color } = lamp.geometry.attributes;
  const point = new Vector3();
  for (const anchor of homeStreetLenses) {
    const lens = new Box3();
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(lamp.matrixWorld);
      if (Math.abs(point.x - anchor[0]) < .13 && color.getX(i) > .7) lens.expandByPoint(point);
    }
    assert.ok(!lens.isEmpty() && lens.getCenter(new Vector3()).distanceTo(new Vector3(...anchor)) < .01);
  }
  for (const [i, anchor] of afterHoursThresholdLenses.entries()) {
    const center = bounds(coast, `AfterHours_Garden_LanternGlow_${i}`).getCenter(new Vector3());
    assert.ok(center.distanceTo(new Vector3(...anchor)) < .01);
  }
  assert.deepEqual(homeStreetPracticals("arrival").map(([p]) => p[0]), [-37, -13, 12, 36]);
  assert.deepEqual(homeStreetPracticals("promenade").map(([p]) => p[0]), [24, 36, 12, 48]);
  assert.equal(afterHoursThresholdPracticals("listening").length, 2);
  assert.equal(afterHoursThresholdPracticals("cinema").length, 2);
});
