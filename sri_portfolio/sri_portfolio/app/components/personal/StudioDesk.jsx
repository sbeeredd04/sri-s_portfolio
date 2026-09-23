"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Box, Boxes } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import {
  studioSurfaces,
  studioDeskFrame,
  studioDeskLight,
} from "../../lib/studio-layout.mjs";

export default function StudioDesk({ night }) {
  const walnut = useRoomTexture("walnut");
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(...studioDeskLight.target);
    return object;
  }, []);
  return (
    <group>
      <Box
        {...studioSurfaces.desk}
        color="#c9ae90"
        radius={0.025}
        map={walnut}
        bumpMap={walnut}
        bumpScale={0.0007}
        roughness={0.55}
      />
      <Boxes
        items={studioDeskFrame}
        color="#505b62"
        metalness={0.65}
        roughness={0.36}
      />
      <group position={studioDeskLight.position}>
        {/* A clamp rests on the centre display; the shield faces the keys. */}
        <Box
          position={[0, -0.007, -0.029]}
          size={[0.057, 0.025, 0.095]}
          color="#383c42"
          radius={0.008}
          metalness={0.65}
        />
        <Box
          position={[0, -0.036, -0.065]}
          size={[0.065, 0.057, 0.027]}
          color="#333941"
          radius={0.01}
        />
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, studioDeskLight.width, 24]} />
          <meshStandardMaterial
            color="#58616a"
            metalness={0.8}
            roughness={0.28}
          />
        </mesh>
        <mesh
          position={[0, -0.011, 0.004]}
          rotation={[-Math.PI / 2 + 0.28, 0, 0]}
        >
          <planeGeometry args={[0.38, 0.012]} />
          <meshBasicMaterial
            color={night ? "#ffe0b4" : "#eee4d4"}
            toneMapped={false}
          />
        </mesh>
      </group>
      <primitive object={target} />
      <spotLight
        position={[
          studioDeskLight.position[0],
          studioDeskLight.position[1] - 0.025,
          studioDeskLight.position[2] + 0.035,
        ]}
        target={target}
        color="#ffdeb0"
        intensity={night ? 1.4 : 0.5}
        distance={1.7}
        angle={0.72}
        penumbra={0.85}
        decay={2}
      />
    </group>
  );
}
