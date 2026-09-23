"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Shoe } from "./CharacterWardrobe";
import { useRoomTexture } from "./RoomMaterials";

// Feet stay planted while the hips lower and the knees bend into a ready stance.
export default function SportLegs({ pose }) {
  const limbs = useRef([]),
    fabric = useRoomTexture("fabric", 6);
  const v = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const bend = pose.current.crouch || 0;
    [-1, 1].forEach((side, i) => {
      const hip = new THREE.Vector3(side * 0.17, 0.45 - bend, 0);
      const ankle = new THREE.Vector3(side * 0.23, 0.12, 0.015);
      const knee = hip.clone().add(ankle).multiplyScalar(0.5);
      knee.z += Math.sqrt(
        Math.max(0, 0.18 ** 2 - hip.distanceTo(ankle) ** 2 / 4),
      );
      [
        [hip, knee],
        [knee, ankle],
      ].forEach(([from, to], j) => {
        const mesh = limbs.current[i * 2 + j];
        mesh.position.copy(from).add(to).multiplyScalar(0.5);
        v.subVectors(to, from);
        mesh.scale.set(1, v.length(), 1);
        mesh.quaternion.setFromUnitVectors(up, v.normalize());
      });
    });
  });
  return (
    <group>
      {[-1, 1].map((side, i) => (
        <group key={side}>
          {[0, 1].map((j) => (
            <mesh
              key={j}
              ref={(g) => {
                limbs.current[i * 2 + j] = g;
              }}
              castShadow
            >
              <cylinderGeometry
                args={[j ? 0.073 : 0.118, j ? 0.062 : 0.106, 1, 16]}
              />
              <meshStandardMaterial
                color={j ? "#c38a64" : "#293747"}
                map={j ? null : fabric}
                roughness={0.88}
              />
            </mesh>
          ))}
          <mesh position={[side * 0.23, 0.127, 0.015]} castShadow>
            <cylinderGeometry args={[0.068, 0.066, 0.105, 16]} />
            <meshStandardMaterial
              color="#dde5ed"
              roughness={0.9}
              map={fabric}
            />
          </mesh>
          <Shoe x={side * 0.23} z={0.07} />
        </group>
      ))}
    </group>
  );
}
