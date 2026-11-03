import test from "node:test";
import assert from "node:assert/strict";
import { Box3, PerspectiveCamera, Raycaster, Vector3 } from "three";
import { shippedModel } from "./helpers/authored-model.mjs";
import { outThereFrame } from "../app/lib/out-there-p11.mjs";
import { outThereLiveSource, outThereStop } from "../app/lib/out-there-site.mjs";
import { worldPoint } from "../app/lib/world-layout.mjs";

const { scene } = await shippedModel(outThereLiveSource.split("?")[0]);
const { unitsPerMetre, seaLevel } = outThereFrame;
const offset = new Vector3(0, -seaLevel, 0);
const local = (point) => point.clone().add(offset).divideScalar(unitsPerMetre);
const authored = (point) => point.clone().multiplyScalar(unitsPerMetre).sub(offset);
const lake = outThereStop("lake");

function pointsOf(name) {
  const node = scene.getObjectByName(name);
  assert.ok(node, `Missing exported lake subject ${name}`);
  const points = [];
  node.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      points.push(local(new Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld)));
    }
  });
  assert.ok(points.length > 0);
  return points;
}

const cliff = pointsOf("rock");
const falls = pointsOf("waterfall");
const roof = [...pointsOf("lookout_vc"), ...pointsOf("lookout_metal")];
const glazing = pointsOf("lookout_glass");
const boat = pointsOf("lake_skiff_1");

function screenBox(camera, points, width, height) {
  const projected = points.map((point) => worldPoint("trail", point.toArray()).project(camera));
  const box = new Box3().setFromPoints(projected);
  return {
    left: (box.min.x + 1) * width / 2,
    right: (box.max.x + 1) * width / 2,
    top: (1 - box.max.y) * height / 2,
    bottom: (1 - box.min.y) * height / 2,
  };
}

test("lake frame keeps the decoded cliff, lookout, waterfall and foreground skiff in view", () => {
  for (const [width, height, shot] of [[1280, 720, lake], [390, 844, lake.portrait]]) {
    const camera = new PerspectiveCamera(shot.fov, width / height, .1, 600);
    camera.position.copy(worldPoint("trail", shot.position));
    camera.lookAt(worldPoint("trail", shot.target));
    camera.updateMatrixWorld(true);
    const head = screenBox(camera, roof, width, height);
    const rock = screenBox(camera, cliff, width, height);
    const water = screenBox(camera, falls, width, height);
    const skiff = screenBox(camera, boat, width, height);
    const phone = width < height;

    assert.ok(head.top > (phone ? 190 : 82), "Lookout roof should clear the header");
    assert.ok(rock.left > 0 && rock.right < width && head.left > 0 && head.right < width);
    assert.ok(skiff.left > 12 && skiff.right < width - 12);
    assert.ok(skiff.bottom < height - (phone ? 190 : 110), "Skiff should clear the bottom controls");
    assert.ok(skiff.top > water.bottom, "Water and the skiff should read below the falls");
    const waterfallCenter = (water.left + water.right) / (2 * width);
    assert.ok(waterfallCenter > .48 && waterfallCenter < .66, "Waterfall should stay near the visual center");
    assert.ok(water.bottom - water.top > height * .18, "The waterfall should remain the subject");
  }
});

test("shipped forest trees do not block the lake subjects from either camera", () => {
  const forest = scene.children.filter((node) => /^(redwood|pine)/.test(node.name));
  assert.ok(forest.length > 12);
  const fallsBox = new Box3().setFromPoints(falls);
  const windowBox = new Box3().setFromPoints(glazing);
  const boatBox = new Box3().setFromPoints(boat);
  const samples = [];
  for (const [box, offsets] of [[fallsBox, [.16, .5, .84]], [windowBox, [.12, .5, .88]]]) {
    for (const u of offsets) for (const v of [.18, .5, .82]) {
      samples.push(new Vector3(
        box.min.x + (box.max.x - box.min.x) * u,
        box.min.y + (box.max.y - box.min.y) * v,
        box.max.z,
      ));
    }
  }
  samples.push(boatBox.getCenter(new Vector3()));
  const ray = new Raycaster();
  for (const shot of [lake, lake.portrait]) {
    const eye = authored(new Vector3(...shot.position));
    for (const point of samples) {
      const direction = authored(point).sub(eye);
      ray.far = direction.length() - .04;
      ray.set(eye, direction.normalize());
      assert.equal(ray.intersectObjects(forest, true).length, 0,
        `A forest mesh occludes lake subject at ${point.toArray()} from ${shot.position}`);
    }
  }
});
