import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import {
  ARM_LENGTH,
  RACKET_CONTACT_HEIGHT,
  RALLY_DURATION,
  solveArm,
  typingWrists,
  typingHand,
  racketPose,
  racketContact,
  rallyPlayers,
} from "../app/lib/character-motion.mjs";
import {
  studioCharacter,
  studioSurfaces,
  studioKeycaps,
} from "../app/lib/studio-layout.mjs";
import { shuttleFlight } from "../app/lib/shuttle-flight.mjs";

test("typing palms clear the keycaps while wrists remain reachable", () => {
  const [kx, ky, kz] = studioSurfaces.keyboard.position;
  const keyTop = ky + studioKeycaps.centerY + studioKeycaps.height / 2;
  const palmRadiusY = Math.hypot(
    typingHand.radius * typingHand.scale[1] * Math.cos(typingHand.tilt),
    typingHand.radius * typingHand.scale[2] * Math.sin(typingHand.tilt),
  );
  for (let t = 0; t < 10; t += 0.017) {
    const wrists = typingWrists(t);
    for (const [side, wrist] of [
      [-1, wrists.left],
      [1, wrists.right],
    ]) {
      const solved = solveArm([side * 0.35, 0.85, 0], wrist, side);
      assert.ok(solved.wrist.distanceTo(new Vector3(...wrist)) < 1e-9);
      const p = solved.wrist
        .clone()
        .applyAxisAngle(new Vector3(0, 1, 0), studioCharacter.rotation)
        .add(new Vector3(...studioCharacter.position));
      assert.ok(Math.abs(p.x - kx) < studioSurfaces.keyboard.size[0] / 2);
      assert.ok(Math.abs(p.z - kz) < studioSurfaces.keyboard.size[2] / 2);
      assert.ok(
        p.y - palmRadiusY >= keyTop,
        "the palm must not sink into the keys",
      );
      assert.ok(
        p.y - palmRadiusY < keyTop + 0.025,
        "typing should stay close to the keys",
      );
    }
  }
});

test("the arm solver keeps both bone lengths and handles unreachable targets", () => {
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.35, 0.85, 0];
    for (const target of [
      shoulder,
      [10, 10, 10],
      [0, 0, 0],
      [side * 0.62, 0.78, 0.34],
    ]) {
      const arm = solveArm(shoulder, target, side);
      assert.ok(
        Math.abs(arm.shoulder.distanceTo(arm.elbow) - ARM_LENGTH) < 1e-9,
      );
      assert.ok(Math.abs(arm.elbow.distanceTo(arm.wrist) - ARM_LENGTH) < 1e-9);
      assert.ok(arm.wrist.toArray().every(Number.isFinite));
    }
  }
});

test("every shuttle endpoint meets the held racket's string center", () => {
  for (const player of rallyPlayers) {
    const stroke = racketPose(0);
    const arm = solveArm([0.35, 0.85, 0], stroke.wrist);
    const stringCenter = new Vector3(0, RACKET_CONTACT_HEIGHT, 0)
      .applyAxisAngle(new Vector3(1, 0, 0), stroke.angle)
      .add(arm.wrist)
      .applyAxisAngle(new Vector3(0, 1, 0), player.rotation)
      .add(new Vector3(...player.position));
    assert.ok(stringCenter.distanceTo(racketContact(player)) < 1e-9);
    assert.ok(Math.abs(stringCenter.y - shuttleFlight(0).height) < 1e-9);
    assert.ok(
      Math.abs(stringCenter.y - shuttleFlight(RALLY_DURATION).height) < 1e-9,
    );
    assert.ok(
      Math.abs(stringCenter.x - player.position[0]) > 0.405 + 0.1,
      "the shuttle must clear the player's head",
    );
  }
});

test("racket recovery stays reachable and continuous across repeated strikes", () => {
  let last;
  for (let t = 0; t < RALLY_DURATION * 8; t += 0.005) {
    const pose = racketPose(t);
    const arm = solveArm([0.35, 0.85, 0], pose.wrist);
    assert.ok(arm.wrist.distanceTo(new Vector3(...pose.wrist)) < 1e-9);
    if (last) {
      assert.ok(Math.abs(pose.angle - last.angle) < 0.05);
      assert.ok(
        new Vector3(...pose.wrist).distanceTo(new Vector3(...last.wrist)) <
          0.005,
      );
    }
    last = pose;
  }
});
