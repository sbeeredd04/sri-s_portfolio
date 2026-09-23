import { MathUtils, Quaternion } from "three";
import { walkingRoutes, pathPose } from "./world-paths.mjs";
import { safeCameraPoint } from "./world-layout.mjs";

export const localWandererIndex = 10;

export const residentLegLength = 0.265;

// A small, grounded two-bone gait. Both segments retain their length while the
// lifted foot clears the paving; the stance foot stays on the walking surface.
export function residentLeg(phase, stride = 1) {
  const amount = MathUtils.clamp(stride, 0, 1);
  const lift = Math.max(0, Math.sin(phase)) * 0.07 * amount;
  const hip = [0, 0.55, 0];
  const ankle = [0, 0.075 + lift, -Math.cos(phase) * 0.11 * amount];
  const dy = ankle[1] - hip[1],
    dz = ankle[2],
    distance = Math.hypot(dy, dz),
    bend = Math.sqrt(Math.max(0, residentLegLength ** 2 - (distance / 2) ** 2));
  const knee = [
    0,
    (hip[1] + ankle[1]) / 2 + (dz / distance) * bend,
    dz / 2 - (dy / distance) * bend,
  ];
  return { hip, knee, ankle, foot: [0, 0.035 + lift, ankle[2] + 0.045] };
}

export function residentJourney(phase) {
  const p = ((phase % 1) + 1) % 1;
  const turn =
    p < 0.04 || p > 0.96
      ? Math.PI +
        Math.PI * MathUtils.smoothstep(p < 0.04 ? p + 1 : p, 0.96, 1.04)
      : Math.PI * MathUtils.smoothstep(p, 0.46, 0.54);
  return {
    progress: 0.08 + (0.5 - 0.5 * Math.cos(p * Math.PI * 2)) * 0.84,
    stride: Math.abs(Math.sin(p * Math.PI * 2)),
    heading: turn,
  };
}

export function residentRoutePose(time, index) {
  const route = walkingRoutes[index % walkingRoutes.length];
  const speed = 0.6 + (index % 3) * 0.13;
  const phase = (index * 0.271 + (time * speed) / (route.length * 2)) % 1;
  const journey = residentJourney(phase);
  const pose = pathPose(
    route,
    journey.progress,
    index % 2 ? -0.42 : 0.42,
    0.115,
  );
  pose.forward
    .addScaledVector(pose.normal, -pose.forward.dot(pose.normal))
    .normalize()
    .applyQuaternion(
      new Quaternion().setFromAxisAngle(pose.normal, journey.heading),
    );
  pose.right.crossVectors(pose.normal, pose.forward).normalize();
  return { pose, stride: journey.stride, gait: time * speed * 6 + index };
}

export function wandererCamera(time) {
  const { pose } = residentRoutePose(time, localWandererIndex);
  const target = pose.position.clone().addScaledVector(pose.normal, 0.9);
  const position = target
    .clone()
    .addScaledVector(pose.forward, -4.1)
    .addScaledVector(pose.right, 1.8)
    .addScaledVector(pose.normal, 1.8);
  return { position: safeCameraPoint(position), target, up: pose.normal };
}
