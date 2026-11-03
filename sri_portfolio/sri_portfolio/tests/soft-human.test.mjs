import test from "node:test";
import assert from "node:assert/strict";
import { AnimationMixer, Box3, Vector3, Raycaster, DoubleSide } from "three";
import { readFileSync } from "node:fs";
import { shippedModel } from "./helpers/authored-model.mjs";
import {
  adultAppearances,
  createAdultModel,
  applyAdultPose,
  solveAdultLimb,
} from "../app/lib/soft-human-rig.mjs";

const { scene } = await shippedModel("/models/characters/soft-human.glb");
test("all adult variants preserve human scale and one shared skin draw", () => {
  for (let variation = 0; variation < adultAppearances.length; variation++) {
    const model = createAdultModel(scene, variation);
    const size = new Box3().setFromObject(model.root).getSize(new Vector3());
    assert.ok(size.y > 1.73 && size.y < 1.77, `height ${size.y}`);
    assert.ok(size.x < 0.65, "shoulders remain human width");
    let draws = 0;
    model.root.traverse((n) => {
      if (n.isMesh) draws++;
    });
    assert.equal(draws, 1);
    assert.equal(model.body.geometry.index.count / 3, 2506);
    for (const value of model.body.geometry.getAttribute("color").array)
      assert.ok(Number.isFinite(value));
    model.dispose();
  }
});
test("seated adult feet remain grounded and wrists reach the desk without stretched limbs", () => {
  const model = createAdultModel(scene),
    b = model.bones;
  const limbLength = (a, c) =>
    b[a]
      .getWorldPosition(new Vector3())
      .distanceTo(b[c].getWorldPosition(new Vector3()));
  model.root.updateWorldMatrix(true, true);
  const upper = limbLength("UpperArm_L", "Forearm_L"),
    lower = limbLength("Forearm_L", "Hand_L");
  applyAdultPose(model.root, b, {
    seated: true,
    pose: { left: [-0.2, 0.79, 0.38], right: [0.2, 0.79, 0.38] },
  });
  for (const side of ["L", "R"]) {
    assert.ok(
      Math.abs(b[`Foot_${side}`].getWorldPosition(new Vector3()).y - 0.09) <
        0.001,
    );
  }
  assert.ok(
    b.Hand_L.getWorldPosition(new Vector3()).distanceTo(
      new Vector3(0.2, 0.79, 0.38),
    ) < 0.001,
  );
  assert.ok(Math.abs(limbLength("UpperArm_L", "Forearm_L") - upper) < 0.0001);
  assert.ok(Math.abs(limbLength("Forearm_L", "Hand_L") - lower) < 0.0001);
  model.dispose();
});
test("adult posing respects scaled rotated parent frames", () => {
  const model = createAdultModel(scene);
  model.root.scale.setScalar(1.18);
  model.root.rotation.y = 1.2;
  model.root.position.set(10, 3, -4);
  model.root.updateWorldMatrix(true, true);
  const target = [0.34, 1.35, 0.3];
  solveAdultLimb(
    model.root,
    model.bones.UpperArm_L,
    model.bones.Forearm_L,
    model.bones.Hand_L,
    target,
    [1, -0.3, -0.6],
  );
  const actual = model.root.worldToLocal(
    model.bones.Hand_L.getWorldPosition(new Vector3()),
  );
  assert.ok(actual.distanceTo(new Vector3(...target)) < 0.001);
  model.dispose();
});
test("all remaining runtime human entry points use the softly faceted adult", () => {
  for (const file of ["Character", "WalkingCharacter", "WorldResidents"]) {
    const source = readFileSync(
      new URL(`../app/components/personal/${file}.jsx`, import.meta.url),
      "utf8",
    );
    assert.ok(source.includes("SoftHuman"));
    assert.ok(!/CharacterFace|characterFace|CharacterWardrobe/.test(source));
  }
});

test("distant crowds bake the same adult silhouette and all body colors into one draw", async () => {
  const { scene, animations } = await shippedModel(
    "/models/characters/soft-human.glb",
  );
  const { bakeVat } = await import("../app/lib/vat.mjs");
  const vat = bakeVat(scene, animations, [
    { name: "Walk", frames: 18 },
    { name: "Idle", frames: 24 },
  ]);
  assert.ok(vat.layout.Walk && vat.layout.Idle);
  assert.equal(vat.geometry.index.count / 3, 2506);
  const parts = new Set(vat.geometry.getAttribute("part").array);
  assert.deepEqual([...parts].sort(), [0, 1, 2, 3, 4]);
  let minY = Infinity,
    maxY = -Infinity;
  const data = vat.positions.image.data;
  for (let i = 0; i < data.length; i += 4)
    if (data[i + 3]) {
      minY = Math.min(minY, data[i + 1]);
      maxY = Math.max(maxY, data[i + 1]);
    }
  assert.ok(minY > -0.025 && minY < 0.025, `soles ${minY}`);
  assert.ok(maxY > 1.73 && maxY < 1.8, `crown ${maxY}`);
  assert.ok(
    vat.positions.image.data.byteLength + vat.normals.image.data.byteLength <
      6_000_000,
  );
  vat.positions.dispose();
  vat.normals.dispose();
  vat.geometry.dispose();
});

test("adult court wrists follow ball and racket contacts with planted feet throughout each play", async () => {
  const { adultCourtPose } = await import("../app/lib/soft-human-rig.mjs");
  const { basketballPlay, volleyballPlay, basketTimes, volleyTimes } =
    await import("../app/lib/court-play.mjs");
  const { racketPose, RALLY_DURATION } =
    await import("../app/lib/character-motion.mjs");
  const sequences = [
    [basketTimes.duration, basketballPlay, 1 / 1.18],
    [volleyTimes.duration, volleyballPlay, 1 / 1.18],
    [
      RALLY_DURATION * 2,
      (t) => ({
        poses: [{ right: racketPose(t).wrist, left: [-0.27, 0.86, 0.12] }],
      }),
      1,
    ],
  ];
  for (const [duration, play, scale] of sequences) {
    const model = createAdultModel(scene);
    const rest = Object.fromEntries(
      Object.entries(model.bones).map(([name, bone]) => [
        name,
        { p: bone.position.clone(), q: bone.quaternion.clone() },
      ]),
    );
    for (let time = 0; time < duration; time += 0.05) {
      for (const source of play(time).poses) {
        for (const [name, bone] of Object.entries(model.bones)) {
          bone.position.copy(rest[name].p);
          bone.quaternion.copy(rest[name].q);
        }
        const pose = adultCourtPose(source, scale);
        applyAdultPose(model.root, model.bones, { pose });
        for (const [key, side] of [
          ["left", "R"],
          ["right", "L"],
        ]) {
          const hand = model.bones[`Hand_${side}`].getWorldPosition(
            new Vector3(),
          );
          assert.ok(
            hand.distanceTo(new Vector3(...pose[key])) < 0.002,
            `wrist misses ${key} at ${time}`,
          );
          const ankle = model.bones[`Foot_${side}`].getWorldPosition(
            new Vector3(),
          );
          assert.ok(Math.abs(ankle.y - 0.09) < 0.002, `foot floats at ${time}`);
          const shoulder = model.bones[`UpperArm_${side}`].getWorldPosition(
            new Vector3(),
          );
          const elbow = model.bones[`Forearm_${side}`].getWorldPosition(
            new Vector3(),
          );
          assert.ok(shoulder.distanceTo(elbow) < 0.29);
          assert.ok(elbow.distanceTo(hand) < 0.25);
        }
      }
    }
    model.dispose();
  }
});

test("forest replacement adult soles rest on the shipped full paving or dock surface", async () => {
  const { outThereResidents } =
    await import("../app/lib/out-there-residents.mjs");
  const { scene } = await shippedModel("/models/islands/out-there-refined.glb");
  scene.scale.setScalar(1 / 1.56);
  scene.position.y = 6 / 1.56;
  scene.updateMatrixWorld(true);
  for (const resident of outThereResidents) {
    const support = scene.getObjectByName(resident.support);
    assert.ok(support?.isMesh);
    support.material = support.material.clone();
    support.material.side = DoubleSide;
    const [x, y, z] = resident.position;
    for (const dx of [-0.093, 0.093]) {
      const px = x + Math.cos(resident.rotation) * dx;
      const pz = z - Math.sin(resident.rotation) * dx;
      const hit = new Raycaster(
        new Vector3(px, y + 0.08, pz),
        new Vector3(0, -1, 0),
      ).intersectObject(support)[0];
      assert.ok(hit, "each foot has visible mesh support");
      assert.ok(
        Math.abs(hit.point.y - y) < 0.035,
        `sole offset ${hit.point.y - y}`,
      );
    }
    support.material.dispose();
  }
});
