"use client";
import * as THREE from "three";

export default function StudioLamp({ night }) {
  return (
    <group position={[1.98, 0, -2.2]}>
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.215, 0.24, 0.065, 48]} />
        <meshStandardMaterial
          color="#3b454f"
          metalness={0.6}
          roughness={0.38}
        />
      </mesh>
      <mesh position={[0, 1.37, 0]} castShadow>
        <cylinderGeometry args={[0.019, 0.022, 2.65, 24]} />
        <meshStandardMaterial
          color="#a08e75"
          metalness={0.73}
          roughness={0.31}
        />
      </mesh>
      <group position={[0, 2.8, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.078, 0.36, 0.35, 48, 1, true]} />
          <meshStandardMaterial
            color="#34414c"
            roughness={0.44}
            metalness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.004, 0]}>
          <cylinderGeometry args={[0.071, 0.352, 0.337, 48, 1, true]} />
          <meshStandardMaterial
            color="#d4ba94"
            roughness={0.58}
            metalness={0.2}
            side={THREE.BackSide}
            emissive="#f5c381"
            emissiveIntensity={night ? 0.45 : 0.04}
          />
        </mesh>
        <mesh position={[0, -0.175, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.356, 0.006, 8, 48]} />
          <meshStandardMaterial
            color="#bd9c70"
            roughness={0.32}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0, 0.176, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.016, 28]} />
          <meshStandardMaterial
            color="#3b454f"
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0, -0.095, 0]}>
          <sphereGeometry args={[0.057, 24, 16]} />
          <meshStandardMaterial
            color="#f7e6c9"
            emissive="#ffd7a1"
            emissiveIntensity={night ? 2 : 0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
