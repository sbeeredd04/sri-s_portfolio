"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Ball } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import {
  characterFace,
  characterHair,
  faceSurface,
  irisDome,
} from "../../lib/character-geometry.mjs";

function Eye({ x, blink, dome }) {
  const iris = useRoomTexture("iris");
  const lid = useMemo(() => {
    const points = Array.from({ length: 19 }, (_, i) => {
      const a = (i / 18) * Math.PI;
      return new THREE.Vector3(Math.cos(a) * 0.087, Math.sin(a) * 0.116, 0.014);
    });
    return new THREE.CatmullRomCurve3(points);
  }, []);
  return (
    <group
      position={[x, 1.23, 0.327]}
      rotation={[0, x * 0.7, 0]}
      scale={[0.9, 0.67, 1]}
    >
      <group ref={blink}>
        <mesh scale={[0.84, 1.13, 0.3]}>
          <sphereGeometry args={[0.105, 32, 24]} />
          <meshPhysicalMaterial
            color="#f1e8d8"
            roughness={0.35}
            clearcoat={0.35}
          />
        </mesh>
        <mesh
          geometry={dome}
          position={[0.006, -0.002, 0.032]}
          scale={[0.84, 1, 1]}
        >
          <meshPhysicalMaterial
            map={iris}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>
        <mesh>
          <tubeGeometry args={[lid, 24, 0.0065, 6, false]} />
          <meshStandardMaterial color="#513727" roughness={0.72} />
        </mesh>
        <Ball
          position={[0.029, 0.032, 0.046]}
          size={0.007}
          scale={[0.8, 1, 0.23]}
          color="#fffaf0"
        />
        <Ball
          position={[-0.013, -0.029, 0.046]}
          size={0.0045}
          scale={[1, 1, 0.25]}
          color="#ddc9b2"
        />
      </group>
    </group>
  );
}

export default function CharacterFace({ leftEye, rightEye }) {
  const hair = useRoomTexture("hair");
  const geometry = useMemo(
    () => ({ face: characterFace(), hair: characterHair(), iris: irisDome() }),
    [],
  );
  useEffect(
    () => () => Object.values(geometry).forEach((g) => g.dispose()),
    [geometry],
  );
  const smile = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 21 }, (_, i) => {
          const t = i / 20,
            x = (t - 0.5) * 0.205,
            y = 1.076 - Math.sin(t * Math.PI) * 0.043;
          return new THREE.Vector3(x, y, faceSurface(x, y, 0.006));
        }),
      ),
    [],
  );
  return (
    <group>
      <mesh geometry={geometry.face} castShadow receiveShadow>
        {/* Skin: soft oily clearcoat, warm red sheen at grazing angles and a
            faint warm emissive lift that stands in for subsurface scattering,
            so shadowed cheeks read as flesh rather than painted plastic. */}
        <meshPhysicalMaterial
          vertexColors
          roughness={0.52}
          clearcoat={0.12}
          clearcoatRoughness={0.55}
          sheen={0.4}
          sheenColor="#ff9f82"
          sheenRoughness={0.55}
          emissive="#5a2616"
          emissiveIntensity={0.12}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * 0.393, 1.185, 0.012]}
          rotation={[0, s * 0.28, s * -0.1]}
        >
          <Ball size={0.088} scale={[0.73, 1.12, 0.66]} color="#c28c6c" />
          <Ball
            position={[s * 0.008, 0.004, 0.05]}
            size={0.052}
            scale={[0.69, 1, 0.17]}
            color="#aa7056"
          />
          <mesh position={[s * 0.008, 0.007, 0.05]} scale={[0.65, 1, 0.75]}>
            <torusGeometry args={[0.046, 0.009, 8, 28, Math.PI * 1.6]} />
            <meshStandardMaterial color="#d29b79" roughness={0.7} />
          </mesh>
          <Ball
            position={[s * -0.014, -0.025, 0.052]}
            size={0.025}
            scale={[0.6, 1, 0.45]}
            color="#c28c6c"
          />
        </group>
      ))}
      <Eye x={-0.145} blink={leftEye} dome={geometry.iris} />
      <Eye x={0.145} blink={rightEye} dome={geometry.iris} />
      <Ball
        position={[0, 1.134, 0.353]}
        size={0.032}
        scale={[0.78, 1.18, 0.79]}
        color="#c58b66"
      />
      <mesh>
        <tubeGeometry args={[smile, 28, 0.007, 7, false]} />
        <meshStandardMaterial color="#81513c" roughness={0.76} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball
            position={[s * 0.1025, 1.076, faceSurface(0.1025, 1.076, 0.007)]}
            size={0.012}
            scale={[0.7, 1, 0.5]}
            color="#935e46"
          />
          <group
            position={[s * 0.149, 1.335, 0.333]}
            rotation={[0, 0, -s * 0.09]}
          >
            <Ball size={0.084} scale={[1, 0.235, 0.18]} color="#3b2d23" />
          </group>
        </group>
      ))}
      <mesh geometry={geometry.hair} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          map={hair}
          bumpMap={hair}
          bumpScale={0.004}
          roughness={0.6}
          anisotropy={0.5}
          anisotropyRotation={Math.PI / 2}
          sheen={0.35}
          sheenColor="#9c7a5e"
          sheenRoughness={0.5}
        />
      </mesh>
    </group>
  );
}
