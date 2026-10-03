"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

// Authored clip speeds (see public/models/characters/README.md).
const WALK = 1.2,
  JOG = 2.6;

// The visitor's avatar on the rig. Idle, walk and jog play together and
// crossfade by the walker's actual speed; each clip's rate follows that
// speed so feet stay planted instead of skating.
export default function RiggedWalker({ src, motion, color, scale = 1.28 }) {
  const { scene, animations } = useGLTF(src);
  const model = useMemo(() => {
    const copy = cloneSkinned(scene);
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      node.material = node.material.clone();
      if (node.material.name === "shirt" && color) node.material.color.set(color);
      if (node.material.anisotropy) node.material.anisotropy = 0;
    });
    return copy;
  }, [scene, color]);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const blend = useRef({ walk: 0, jog: 0 });
  useEffect(() => {
    for (const name of ["idle", "walk", "jog"]) {
      const action = actions[name];
      if (!action) continue;
      action.reset().play();
      action.setEffectiveWeight(name === "idle" ? 1 : 0);
    }
  }, [actions]);
  useFrame((_, dt) => {
    const speed = motion.current.speed || 0;
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 8);
    const moving = THREE.MathUtils.smoothstep(speed, 0.08, 0.5);
    const running = THREE.MathUtils.smoothstep(speed, 1.7, 2.3);
    const b = blend.current;
    b.walk += (moving * (1 - running) - b.walk) * k;
    b.jog += (moving * running - b.jog) * k;
    const { idle, walk, jog } = actions;
    idle?.setEffectiveWeight(Math.max(0, 1 - b.walk - b.jog));
    if (walk) {
      walk.setEffectiveWeight(b.walk);
      walk.timeScale = THREE.MathUtils.clamp(speed / (WALK * scale), 0.5, 2);
    }
    if (jog) {
      jog.setEffectiveWeight(b.jog);
      jog.timeScale = THREE.MathUtils.clamp(speed / (JOG * scale), 0.6, 1.8);
    }
  });
  return (
    <group ref={group} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
