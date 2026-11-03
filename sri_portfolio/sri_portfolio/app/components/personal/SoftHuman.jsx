"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { AnimationMixer, MathUtils } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export const softHumanSource =
  "/models/characters/soft-human.glb?v=bbc320a5d6381c76";
// Metre-scale reference: y=0 soles, 1.75m crown, +Z forward.
export default function SoftHuman({
  animate = true,
  motion,
  color,
  phase = 0,
}) {
  const { scene, animations } = useGLTF(softHumanSource);
  const actions = useRef(null);
  const person = useMemo(() => {
    const root = clone(scene);
    const materials = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (color && o.name === "Human_Shirt") {
        o.material = o.material.clone();
        o.material.color.set(color);
        materials.push(o.material);
      }
    });
    const mixer = new AnimationMixer(root);
    return { root, materials, mixer };
  }, [scene, animations, color]);
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
    return () => {
      person.mixer.stopAllAction();
      person.mixer.uncacheRoot(person.root);
      actions.current = null;
      person.materials.forEach((m) => m.dispose());
    };
  }, [person, phase, animations]);
  useFrame((_, delta) => {
    if (!animate || motion?.current?.paused || !actions.current) return;
    const action = actions.current;
    const dt = Math.min(0.05, delta);
    const speed = motion?.current?.speed || 0;
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
  });
  return <primitive object={person.root} />;
}
