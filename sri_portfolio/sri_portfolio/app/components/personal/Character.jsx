"use client";
import { discover } from "../../lib/discoveries.mjs";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Rod } from "./ScenePrimitives";
import CharacterArm from "./CharacterArm";
import CharacterFace from "./CharacterFace";
import { Shirt, Shoe, Trousers, HikingPack } from "./CharacterWardrobe";
import { typingWrists } from "../../lib/character-motion.mjs";
import SportLegs from "./SportLegs";
export default function Character({
  position = [0, 0, 0],
  rotation = 0,
  color = "#7184a6",
  seated = false,
  animate = false,
  phase = 0,
  pose: externalPose,
  rightHand,
  interactive = false,
  backpack = false,
  onHover,
  sport = false,
}) {
  const group = useRef(),
    body = useRef(),
    head = useRef(),
    leftEye = useRef(),
    rightEye = useRef();
  const wave = useRef(-100);
  useEffect(
    () => () => {
      if (interactive) {
        document.body.style.cursor = "";
        onHover?.("");
      }
    },
    [interactive, onHover],
  );
  const elapsed = useRef(phase),
    idlePose = useRef({}),
    pose = externalPose ?? idlePose;
  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    if (sport) {
      group.current.position.y = position[1] + (pose.current.hop || 0);
      body.current.position.y = -(pose.current.crouch || 0);
    }
    if (!externalPose) {
      pose.current = seated
        ? typingWrists(t)
        : {
            left: [-0.39, 0.45, 0.03 + Math.sin(t * 1.2) * 0.012],
            right: [0.39, 0.45, 0.03 - Math.sin(t * 1.2) * 0.012],
          };
    }
    if (interactive && !externalPose) {
      const age = t - wave.current;
      const weight =
        THREE.MathUtils.smoothstep(age, 0, 0.3) *
        (1 - THREE.MathUtils.smoothstep(age, 1.7, 2.3));
      const target = [0.59 + Math.sin(age * 17) * 0.055, 1.14, 0.1];
      pose.current.right = pose.current.right.map((n, i) =>
        THREE.MathUtils.lerp(n, target[i], weight),
      );
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.7) * 0.024;
      head.current.rotation.x = seated ? 0.07 + Math.sin(t * 0.8) * 0.018 : 0;
      if (sport) head.current.rotation.x = pose.current.look || 0;
      head.current.rotation.y = Math.sin(t * 0.4) * (seated ? 0.1 : 0.045);
    }
    const blinkPhase = t % 4.7;
    const blink = animate
      ? 1 - Math.sin(Math.min(blinkPhase / 0.17, 1) * Math.PI) * 0.94
      : 1;
    if (leftEye.current) leftEye.current.scale.y = blink;
    if (rightEye.current) rightEye.current.scale.y = blink;
  }, -1);
  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        if (!interactive || !animate || e.delta > 4) return;
        e.stopPropagation();
        wave.current = elapsed.current;
        discover("hello-world");
      }}
      onPointerOver={(e) => {
        if (!interactive || !animate) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover?.("Say hi to Sri");
      }}
      onPointerOut={() => {
        if (interactive) {
          document.body.style.cursor = "";
          onHover?.("");
        }
      }}
    >
      <group ref={body}>
        <group ref={head} position={[0, 0.97, 0]} scale={[0.5, 0.62, 0.54]}>
          <group position={[0, -0.97, 0]}>
            <CharacterFace leftEye={leftEye} rightEye={rightEye} />
          </group>
        </group>
        <Rod
          from={[0, 0.88, 0]}
          to={[0, 1.02, 0]}
          radius={0.105}
          color="#bc825d"
        />
        <Shirt color={color} />
        {backpack && <HikingPack />}
        <Box
          position={[0.13, 0.74, 0.205]}
          size={[0.08, 0.032, 0.008]}
          color="#d2d9e6"
          radius={0.007}
        />
        <CharacterArm side={-1} color={color} pose={pose} seated={seated} />
        <CharacterArm side={1} color={color} pose={pose} seated={seated}>
          {rightHand}
        </CharacterArm>
      </group>
      {sport ? (
        <SportLegs pose={pose} />
      ) : (
        [-0.17, 0.17].map((x) => (
          <group key={x}>
            <Trousers x={x} seated={seated} />
            <Shoe x={x} z={seated ? 0.42 : 0.07} />
          </group>
        ))
      )}
    </group>
  );
}
