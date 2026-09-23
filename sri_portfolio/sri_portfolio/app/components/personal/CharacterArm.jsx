"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ARM_LENGTH,
  solveArm,
  typingHand,
} from "../../lib/character-motion.mjs";
import { Box, Ball } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";

export default function CharacterArm({ side, color, pose, children, seated }) {
  const fabric = useRoomTexture("fabric", 5);
  const sleeve = useRef(),
    forearm = useRef(),
    hand = useRef(),
    joint = useRef();
  const shoulder = useMemo(() => [side * 0.35, 0.85, 0], [side]);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const wrist = pose.current?.[side < 0 ? "left" : "right"] ?? [
      side * 0.39,
      0.45,
      0.025,
    ];
    const arm = solveArm(shoulder, wrist, side);
    for (const [mesh, from, to] of [
      [sleeve.current, arm.shoulder, arm.elbow],
      [forearm.current, arm.elbow, arm.wrist],
    ]) {
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      direction.subVectors(to, from).normalize();
      mesh.quaternion.setFromUnitVectors(up, direction);
    }
    joint.current.position.copy(arm.elbow);
    hand.current.position.copy(arm.wrist);
    hand.current.rotation.x = seated ? typingHand.tilt : 0;
  });
  return (
    <group>
      <mesh ref={sleeve} castShadow>
        <capsuleGeometry args={[0.099, ARM_LENGTH - 0.15, 7, 18]} />
        <meshPhysicalMaterial
          color={color}
          map={fabric}
          bumpMap={fabric}
          bumpScale={0.0008}
          roughness={0.88}
          sheen={0.25}
          sheenColor={color}
          sheenRoughness={0.85}
        />
      </mesh>
      <mesh ref={forearm} castShadow>
        <capsuleGeometry args={[0.066, ARM_LENGTH - 0.1, 5, 12]} />
        <meshStandardMaterial color="#c38a64" roughness={0.77} />
      </mesh>
      <group ref={joint}>
        <Ball size={0.074} color="#c38a64" />
      </group>
      <group ref={hand}>
        <Ball
          size={typingHand.radius}
          scale={seated ? typingHand.scale : [0.83, 1, 0.84]}
          color="#c78f69"
        />
        <Ball
          position={[side * -0.057, -0.006, 0.045]}
          size={0.032}
          color="#c78f69"
        />
        {side === 1 && (
          <Box
            position={[0, 0.06, -0.035]}
            size={[0.1, 0.038, 0.09]}
            color="#26313e"
            radius={0.02}
          />
        )}
        {children}
      </group>
    </group>
  );
}
