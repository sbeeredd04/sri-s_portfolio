import { Vector3 } from "three";
import {
  studioCharacter,
  studioSurfaces,
  studioKeycaps,
} from "./studio-layout.mjs";

export const typingHand = {
  radius: 0.086,
  scale: [0.83, 0.45, 1.02],
  tilt: -0.1,
};
const palmHeight = Math.hypot(
  typingHand.radius * typingHand.scale[1] * Math.cos(typingHand.tilt),
  typingHand.radius * typingHand.scale[2] * Math.sin(typingHand.tilt),
);
const typingWristY =
  studioSurfaces.keyboard.position[1] +
  studioKeycaps.centerY +
  studioKeycaps.height / 2 +
  palmHeight +
  0.002 -
  studioCharacter.position[1];

export const ARM_LENGTH = 0.24;
export const RACKET_CONTACT_HEIGHT = 0.57;
export const RALLY_DURATION = 1.35;
export const rallyPlayers = [
  { position: [0.95, 0, 1.95], rotation: Math.PI },
  { position: [-0.95, 0, -1.95], rotation: 0 },
];
export const strikeWrist = [0.62, 0.78, 0.34];

// Two equal arm segments meet a reachable wrist target. The elbow bends outward
// instead of flipping when the hand crosses the shoulder's center line.
export function solveArm(shoulder, requested, side = 1) {
  const origin = new Vector3(...shoulder);
  const direction = new Vector3(...requested).sub(origin);
  const distance = Math.max(
    0.001,
    Math.min(direction.length(), ARM_LENGTH * 2 - 0.001),
  );
  if (direction.lengthSq() < 1e-8) direction.set(0, -1, 0);
  direction.normalize();
  const wrist = origin.clone().addScaledVector(direction, distance);
  const bend = new Vector3(side, -0.75, -0.25);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < 1e-8)
    bend.set(0, 0, 1).addScaledVector(direction, -direction.z);
  bend.normalize();
  const elbow = origin
    .clone()
    .addScaledVector(direction, distance / 2)
    .addScaledVector(bend, Math.sqrt(ARM_LENGTH ** 2 - (distance / 2) ** 2));
  return { shoulder: origin, elbow, wrist };
}

export function typingWrists(time) {
  const tap = (phase) => Math.max(0, Math.sin(time * 12 + phase)) ** 4;
  // Brief rests make this a person working, rather than a continuous tremor.
  const resting = Math.max(0, Math.sin(time * 0.72) - 0.6) / 0.4;
  return {
    left: [-0.15, typingWristY + tap(0) * 0.022 * (1 - resting), 0.39],
    right: [0.15, typingWristY + tap(1.9) * 0.02 * (1 - resting), 0.39],
  };
}

export function racketPose(timeSinceHit) {
  // Follow-through, recovery, then a short backswing before the next strike.
  const cycle = RALLY_DURATION * 2;
  const t = ((timeSinceHit % cycle) + cycle) % cycle;
  const follow = Math.sin(Math.PI * Math.min(t / 0.46, 1)) * Math.exp(-t * 3.5);
  const anticipation = Math.max(0, (t - (cycle - 0.38)) / 0.38);
  const windup = Math.sin(anticipation * Math.PI);
  return {
    angle: follow * 0.75 - windup * 0.48,
    wrist: [
      strikeWrist[0],
      strikeWrist[1] + follow * 0.025,
      strikeWrist[2] + follow * 0.045 - windup * 0.04,
    ],
  };
}

export function racketContact(player) {
  const local = new Vector3(
    strikeWrist[0],
    strikeWrist[1] + RACKET_CONTACT_HEIGHT,
    strikeWrist[2],
  );
  local.applyAxisAngle(new Vector3(0, 1, 0), player.rotation);
  return local.add(new Vector3(...player.position));
}
