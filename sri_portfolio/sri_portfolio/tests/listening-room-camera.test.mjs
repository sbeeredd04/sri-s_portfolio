import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BoxGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { afterHoursCoastSource, legacyContentLift } from "../app/lib/authored-island-sites.mjs";
import { facingYaw, listeningRoomSign, listeningSeat } from "../app/lib/entertainment-layout.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";
import { regions } from "../app/lib/world-layout.mjs";

const listening = placeStops.entertainment.find(({ id }) => id === "listening");
// Rendered cabinet, speakers, player and first pendant shade, in the same
// pre-lift entertainment frame as the camera. See AfterHours and PaperPendant.
const cabinet = [[-4.2, .155, -3], [.2, .945, -2.15]];
const speakers = [[-3.885, .96, -2.8], [-.115, 1.68, -2.385]];
const recordPlayer = [[-2.64, .985, -3.02], [-1.36, 1.26, -2.08]];
const pendantShade = [[-3.186, 2.69, -.386], [-2.414, 3.45, .386]];

function corners([min, max]) {
  return [min[0], max[0]].flatMap((x) =>
    [min[1], max[1]].flatMap((y) => [min[2], max[2]].map((z) => new Vector3(x, y, z))));
}

test("phone listening stop keeps the entire console and a pendant below the header and above the dock", () => {
  assert.deepEqual(listening.position, [1.8, 2.5, 4.7]);
  assert.deepEqual(listening.target, [-2.3, 1.45, -1.8]);
  const { position, target, fov } = listening.portrait;
  for (const [width, height] of [[390, 844], [390, 896], [320, 568], [375, 812]]) {
    const camera = new PerspectiveCamera(fov, width / height, .1, 500);
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateMatrixWorld();
    const safeBottom = height - 185;
    const [signX, signY, signZ] = listeningRoomSign.position;
    const [signWidth, signHeight] = listeningRoomSign.size;
    for (const dx of [-signWidth / 2, signWidth / 2]) {
      for (const dy of [-signHeight / 2, signHeight / 2]) {
        const projected = new Vector3(signX + dx, signY + dy, signZ).project(camera);
        assert.ok(projected.x < -1, `${width}×${height}: Side B sign intrudes into the frame`);
      }
    }

    for (const subject of [cabinet, speakers, recordPlayer, pendantShade]) {
      for (const corner of corners(subject)) {
        corner.project(camera);
        const x = (corner.x + 1) * width / 2;
        const y = (1 - corner.y) * height / 2;
        assert.ok(x >= 10 && x <= width - 10 && y >= 190 && y <= safeBottom,
          `${width}×${height}: projected subject corner outside clear area (${x}, ${y})`);
      }
    }
  }
});

test("portrait lens and sightlines remain inside the actual authored pavilion shell", async () => {
  const file = afterHoursCoastSource.split("?")[0];
  const bytes = await readFile(new URL(`../public${file}`, import.meta.url));
  const { scene } = await new Promise((resolve, reject) => new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parse(Uint8Array.from(bytes).buffer, "", resolve, reject));
  scene.updateMatrixWorld(true);
  const shell = [
    "AfterHours_Pavilion_DeckAndSkirt",
    "AfterHours_Pavilion_DomeDisc",
    "AfterHours_Pavilion_MullionsAndEave",
    "AfterHours_Pavilion_SmokedGlass",
  ].map((name) => {
    const mesh = scene.getObjectByName(name);
    assert.ok(mesh, name);
    return mesh;
  });
  const court = regions.find(({ id }) => id === "court");
  const room = regions.find(({ id }) => id === "entertainment");
  const offset = room.center.clone().sub(court.center);
  offset.y += legacyContentLift.entertainment;
  const origin = new Vector3(...listening.portrait.position).add(offset);
  const ray = new Raycaster();
  for (const subject of [cabinet, speakers, recordPlayer, pendantShade]) {
    for (const point of corners(subject)) {
      const direction = point.add(offset).sub(origin);
      ray.far = direction.length() - .01;
      ray.set(origin, direction.normalize());
      assert.equal(ray.intersectObjects(shell, true).length, 0,
        `Authored pavilion occludes phone shot toward ${point.toArray()}`);
    }
  }
});

test("Side B sign and the real foreground seat profile leave the console and pendant unobstructed", () => {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const sign = new Mesh(new PlaneGeometry(...listeningRoomSign.size), material);
  sign.position.set(...listeningRoomSign.position);

  // The main volumes of the rendered LoungeChair. The rounded upholstery
  // fits inside these conservative boxes, including the raked back.
  const chair = new Group();
  chair.position.set(...listeningSeat.position);
  chair.rotation.y = facingYaw(listeningSeat.position, listeningSeat.target);
  function chairBox(parent, position, size) {
    const mesh = new Mesh(new BoxGeometry(...size), material);
    mesh.position.set(...position);
    parent.add(mesh);
  }
  chairBox(chair, [0, .39, 0], [1.42, .12, 1.48]);
  chairBox(chair, [0, .59, .07], [1.21, .31, 1.27]);
  for (const x of [-.72, .72]) chairBox(chair, [x, .83, .02], [.15, .095, 1.47]);
  const back = new Group();
  back.position.set(0, 1.12, -.57);
  back.rotation.x = -.14;
  chair.add(back);
  chairBox(back, [0, 0, 0], [1.4, 1.15, .12]);
  chairBox(back, [0, 0, .17], [1.21, 1.02, .3]);
  sign.updateMatrixWorld(true);
  chair.updateMatrixWorld(true);
  const origin = new Vector3(...listening.portrait.position);
  const ray = new Raycaster();
  for (const subject of [cabinet, speakers, recordPlayer, pendantShade]) {
    for (const corner of corners(subject)) {
      const direction = corner.clone().sub(origin);
      ray.far = direction.length() - .01;
      ray.set(origin, direction.normalize());
      assert.equal(ray.intersectObjects([sign, chair], true).length, 0,
        `Foreground fixture occludes the view toward ${corner.toArray()}`);
    }
  }
});
