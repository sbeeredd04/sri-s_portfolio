"use client";
import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

const SRC = "/models/characters/sri.glb";

// The rigged character built in scripts/blender/character. Clips: idle, walk,
// typing, wave (one-shot) and sit. `clip` picks the loop; an interactive
// character waves when tapped and eases back into its loop.
export default function SriCharacter({
  position = [0, 0, 0],
  rotation = 0,
  clip = "idle",
  animate = false,
  interactive = false,
  onHover,
  shirt = "#2c3a4f",
}) {
  const { scene, animations } = useGLTF(SRC);
  const model = useMemo(() => {
    const copy = cloneSkinned(scene);
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      // Skinned bounds follow the bind pose; the seated clip leaves them.
      node.frustumCulled = false;
      node.material = node.material.clone();
      if (node.material.name === "shirt") node.material.color.set(shirt);
      // Anisotropic specular under close practical lights produced invalid
      // highlights that bloom into a glowing disc (as on the old rig's hair).
      if (node.material.anisotropy) node.material.anisotropy = 0;
    });
    return copy;
  }, [scene, shirt]);
  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  useEffect(() => {
    const loop = actions[clip] || actions.idle;
    loop?.reset().fadeIn(0.3).play();
    return () => loop?.fadeOut(0.3);
  }, [actions, clip]);
  useEffect(() => {
    const done = (event) => {
      if (event.action !== actions.wave) return;
      actions.wave.fadeOut(0.35);
      (actions[clip] || actions.idle)?.reset().fadeIn(0.35).play();
    };
    mixer.addEventListener("finished", done);
    return () => mixer.removeEventListener("finished", done);
  }, [actions, mixer, clip]);
  // useAnimations advances the mixer on rendered frames; with motion off the
  // loop holds its first pose instead of drifting on camera-driven frames.
  useEffect(() => {
    mixer.timeScale = animate ? 1 : 0;
  }, [mixer, animate]);
  const wave = (event) => {
    event.stopPropagation();
    const action = actions.wave;
    if (!action || action.isRunning()) return;
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    (actions[clip] || actions.idle)?.fadeOut(0.25);
    action.fadeIn(0.25).play();
  };
  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={interactive ? wave : undefined}
      onPointerOver={
        interactive
          ? (event) => {
              event.stopPropagation();
              document.body.style.cursor = "pointer";
              onHover?.("Say hi to Sri");
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              document.body.style.cursor = "";
              onHover?.("");
            }
          : undefined
      }
    >
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(SRC);
