"use client";
import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Rod } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import { stepPendant } from "../../lib/pendulum-motion.mjs";

export default function PaperPendant({
  position,
  night,
  animate,
  onHover,
  onCue,
}) {
  const pivot = useRef(),
    hoops = useRef(),
    motion = useRef({ angle: [0, 0], velocity: [0, 0] }),
    paper = useRoomTexture("fabric", 12);
  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    for (let i = 0; i < 11; i++) {
      const latitude = -1.16 + i * 0.232,
        r = Math.cos(latitude) * 0.386;
      object.position.set(0, -0.93 + Math.sin(latitude) * 0.386 * 0.98, 0);
      object.rotation.set(Math.PI / 2, 0, 0);
      object.scale.setScalar(r);
      object.updateMatrix();
      hoops.current.setMatrixAt(i, object.matrix);
    }
    hoops.current.instanceMatrix.needsUpdate = true;
    hoops.current.computeBoundingSphere();
  }, []);
  useFrame((_, dt) => {
    if (!animate) return;
    const state = motion.current;
    if (
      state.angle.every(
        (a, i) => Math.abs(a) + Math.abs(state.velocity[i]) < 0.00002,
      )
    )
      return;
    stepPendant(state, dt);
    pivot.current.rotation.set(state.angle[0], 0, state.angle[1]);
  });
  return (
    <group position={position}>
      <group
        ref={pivot}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.("Give the pendant a gentle nudge.");
        }}
        onPointerOut={() => onHover?.("")}
        onClick={(e) => {
          e.stopPropagation();
          if (!animate) return;
          const hit = pivot.current.worldToLocal(e.point.clone());
          motion.current.velocity[0] = THREE.MathUtils.clamp(
            motion.current.velocity[0] + hit.z * 1.5 + 0.25,
            -1.3,
            1.3,
          );
          motion.current.velocity[1] = THREE.MathUtils.clamp(
            motion.current.velocity[1] - hit.x * 1.5 - 0.15,
            -1.3,
            1.3,
          );
          onCue?.("object");
        }}
      >
        <Rod
          from={[0, 0, 0]}
          to={[0, -0.55, 0]}
          radius={0.009}
          color="#59616c"
        />
        <mesh position={[0, -0.93, 0]} scale={[1, 0.98, 1]} castShadow>
          <sphereGeometry args={[0.38, 40, 28]} />
          <meshStandardMaterial
            color="#e4d6be"
            map={paper}
            bumpMap={paper}
            bumpScale={0.0008}
            roughness={0.94}
            emissive="#ffd39d"
            emissiveIntensity={night ? 0.45 : 0.08}
          />
        </mesh>
        <instancedMesh ref={hoops} args={[undefined, undefined, 11]}>
          <torusGeometry args={[1, 0.012, 6, 64]} />
          <meshStandardMaterial
            color="#bcad93"
            roughness={0.8}
            emissive="#d6b78e"
            emissiveIntensity={night ? 0.14 : 0}
          />
        </instancedMesh>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.032, 0.045, 0.028, 20]} />
          <meshStandardMaterial
            color="#6c706e"
            roughness={0.5}
            metalness={0.45}
          />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <cylinderGeometry args={[0.025, 0.021, 0.012, 20]} />
          <meshStandardMaterial color="#a99d87" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
