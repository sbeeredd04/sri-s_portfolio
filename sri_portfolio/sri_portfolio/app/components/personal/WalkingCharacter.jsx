"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Rod } from "./ScenePrimitives";
import CharacterArm from "./CharacterArm";
import CharacterFace from "./CharacterFace";
import { HikingPack, Shirt, Shoe } from "./CharacterWardrobe";
import { useRoomTexture } from "./RoomMaterials";
import { residentLeg, residentLegLength } from "../../lib/resident-motion.mjs";

// Character.jsx places the head at y=0.97 with scale y=0.62. The hair
// crown in that rig is about 1.47. Scale from the ground so the same
// body, wardrobe, and residentLeg endpoints read as about 1.65 m.
const hairCrown = 1.776;
const headY = 0.97;
const headScaleY = 0.62;
const figureScale = 1.65 / (headY + (hairCrown - headY) * headScaleY);
const hipX = 0.17;
const armSwing = 0.14;

export default function WalkingCharacter({ motion, color = "#7184a6" }) {
  const head = useRef();
  const leftEye = useRef();
  const rightEye = useRef();
  const bones = useRef([]);
  const knees = useRef([]);
  const shoes = useRef([]);
  const elapsed = useRef(0);
  const pose = useRef({
    left: [-0.39, 0.45, 0.03],
    right: [0.39, 0.45, 0.03],
  });
  const fabric = useRoomTexture("fabric", 6);
  const geometry = useMemo(
    () => ({
      upper: new THREE.CylinderGeometry(0.112, 0.094, residentLegLength, 16),
      lower: new THREE.CylinderGeometry(0.086, 0.068, residentLegLength, 14),
      knee: new THREE.SphereGeometry(0.094, 14, 12),
    }),
    [],
  );
  const cloth = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3b4555",
        map: fabric,
        bumpMap: fabric,
        bumpScale: 0.0006,
        roughness: 0.9,
      }),
    [fabric],
  );
  const scratch = useMemo(
    () => ({
      direction: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );
  useEffect(
    () => () => {
      geometry.upper.dispose();
      geometry.lower.dispose();
      geometry.knee.dispose();
      cloth.dispose();
    },
    [geometry, cloth],
  );

  const applyMotion = () => {
    const sample = motion?.current;
    const gait = Number.isFinite(sample?.gait) ? sample.gait : 0;
    const stride = THREE.MathUtils.clamp(
      Number.isFinite(sample?.stride) ? sample.stride : 0,
      0,
      1,
    );
    const swing = Math.cos(gait) * armSwing * stride;
    pose.current.left[2] = 0.03 + swing;
    pose.current.right[2] = 0.03 - swing;
    if (head.current) {
      head.current.rotation.x = 0;
      head.current.rotation.y = Math.sin(gait * 0.5) * 0.04 * stride;
      head.current.rotation.z = Math.sin(gait) * 0.018 * stride;
    }
    [-1, 1].forEach((side, index) => {
      const leg = residentLeg(index === 0 ? gait : gait + Math.PI, stride);
      const x = side * hipX;
      const hip = [x + leg.hip[0], leg.hip[1], leg.hip[2]];
      const knee = [x + leg.knee[0], leg.knee[1], leg.knee[2]];
      const ankle = [x + leg.ankle[0], leg.ankle[1], leg.ankle[2]];
      [
        [bones.current[index * 2], hip, knee],
        [bones.current[index * 2 + 1], knee, ankle],
      ].forEach(([mesh, from, to]) => {
        if (!mesh) return;
        scratch.direction.set(
          to[0] - from[0],
          to[1] - from[1],
          to[2] - from[2],
        );
        mesh.position.set(
          (from[0] + to[0]) * 0.5,
          (from[1] + to[1]) * 0.5,
          (from[2] + to[2]) * 0.5,
        );
        if (scratch.direction.lengthSq() > 1e-10) {
          mesh.quaternion.setFromUnitVectors(
            scratch.up,
            scratch.direction.normalize(),
          );
        }
      });
      if (knees.current[index]) {
        knees.current[index].position.set(knee[0], knee[1], knee[2]);
      }
      if (shoes.current[index]) {
        shoes.current[index].position.set(x, leg.foot[1] - 0.035, leg.foot[2]);
      }
    });
  };

  useLayoutEffect(() => {
    applyMotion();
  }, [motion]);
  useFrame((_, delta) => {
    if (!motion?.current?.paused) elapsed.current += Math.min(delta, 0.05);
    applyMotion();
    const blinkPhase = elapsed.current % 4.7;
    const blink = 1 - Math.sin(Math.min(blinkPhase / 0.17, 1) * Math.PI) * 0.94;
    if (leftEye.current) leftEye.current.scale.y = blink;
    if (rightEye.current) rightEye.current.scale.y = blink;
  }, -1);

  return (
    <group>
      <group scale={figureScale}>
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
        <HikingPack />
        <Box
          position={[0.13, 0.74, 0.205]}
          size={[0.08, 0.032, 0.008]}
          color="#d2d9e6"
          radius={0.007}
        />
        <CharacterArm side={-1} color={color} pose={pose} />
        <CharacterArm side={1} color={color} pose={pose} />
        {[-1, 1].map((side, index) => (
          <group key={side}>
            {[0, 1].map((segment) => (
              <mesh
                key={segment}
                ref={(node) => {
                  bones.current[index * 2 + segment] = node;
                }}
                geometry={segment ? geometry.lower : geometry.upper}
                material={cloth}
                castShadow
                receiveShadow
              />
            ))}
            <mesh
              ref={(node) => {
                knees.current[index] = node;
              }}
              geometry={geometry.knee}
              material={cloth}
              castShadow
            />
            <group
              ref={(node) => {
                shoes.current[index] = node;
              }}
            >
              <Shoe x={0} z={0} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
