"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { AnimationMixer, MathUtils } from "three";
import { createAdultModel, applyAdultPose } from "../../lib/soft-human-rig.mjs";

export const softHumanSource =
  "/models/characters/soft-human.glb?v=bbc320a5d6381c76";
// Metre-scale reference: y=0 soles, 1.75m crown, +Z forward.
export default function SoftHuman({
  animate = true,
  motion,
  color,
  phase = 0,
  variation = 0,
  seated = false,
  seatHeight = 0.44,
  pose,
  rightHand,
}) {
  const { scene, animations } = useGLTF(softHumanSource);
  const actions = useRef(null),
    attachment = useRef();
  const person = useMemo(() => {
    const model = createAdultModel(scene, variation, color);
    return { ...model, mixer: new AnimationMixer(model.root) };
  }, [scene, variation, color]);
  useEffect(() => {
    const idle = person.mixer.clipAction(
      animations.find((a) => a.name === "Idle"),
    );
    const walk = person.mixer.clipAction(
      animations.find((a) => a.name === "Walk"),
    );
    idle.reset().setEffectiveWeight(1).play();
    idle.time = phase % idle.getClip().duration;
    walk.reset().setEffectiveWeight(0).play();
    actions.current = { idle, walk, blend: 0 };
    person.mixer.update(0);
    applyAdultPose(person.root, person.bones, {
      seated,
      seatHeight,
      pose: pose?.current,
    });
    return () => {
      person.mixer.stopAllAction();
      person.mixer.uncacheRoot(person.root);
      actions.current = null;
    };
  }, [person, phase, animations, seated, seatHeight, pose]);
  useEffect(() => () => person.dispose(), [person]);
  useFrame((_, delta) => {
    if (!actions.current) return;
    const action = actions.current,
      paused = !animate || motion?.current?.paused;
    const dt = paused ? 0 : Math.min(0.05, delta),
      speed = seated ? 0 : motion?.current?.speed || 0;
    action.blend = MathUtils.damp(
      action.blend,
      MathUtils.smoothstep(speed, 0.05, 0.28),
      13,
      dt,
    );
    action.idle.setEffectiveWeight(1 - action.blend);
    action.walk
      .setEffectiveWeight(action.blend)
      .setEffectiveTimeScale(Math.min(3.6, speed / 0.875));
    person.mixer.update(dt);
    applyAdultPose(person.root, person.bones, {
      seated,
      seatHeight,
      pose: pose?.current,
      waveAge: motion?.current?.waveAge,
    });
    if (attachment.current && pose?.current?.right)
      attachment.current.position.set(...pose.current.right);
  }, -0.5);
  return (
    <group>
      <primitive object={person.root} />
      {rightHand && <group ref={attachment}>{rightHand}</group>}
    </group>
  );
}
