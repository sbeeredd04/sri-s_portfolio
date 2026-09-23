"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Box, Boxes, Rod, Rods } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import { pavingPlacements, pavingSize } from "../../lib/paving-layout.mjs";

export function Sign({
  title,
  subtitle = "",
  accent = "#adcae8",
  background = "#101b27",
  foreground = "#e7eef6",
  secondary = "#9dafc4",
  position,
  size = [2.4, 0.9],
  rotation = [0, 0, 0],
  ...props
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = Math.round((768 * size[1]) / size[0]);
    const h = c.height;
    const x = c.getContext("2d");
    x.fillStyle = background;
    x.fillRect(0, 0, 768, h);
    x.fillStyle = accent;
    x.fillRect(36, h * 0.14, 32, Math.max(2, h * 0.013));
    const font = getComputedStyle(document.body).fontFamily;
    x.font = `500 ${Math.min(52, h * 0.29)}px ${font}`;
    x.fillStyle = foreground;
    x.fillText(title, 36, h * 0.52, 694);
    x.font = `${Math.min(22, h * 0.13)}px ${font}`;
    x.fillStyle = secondary;
    x.fillText(subtitle, 38, h * 0.81, 690);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [
    title,
    subtitle,
    accent,
    background,
    foreground,
    secondary,
    size[0],
    size[1],
  ]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation} {...props}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
export function StreetLamp({ position, night, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.19, 0.2, 20]} />
        <meshStandardMaterial
          color="#344251"
          metalness={0.72}
          roughness={0.4}
        />
      </mesh>
      <Rod
        from={[0, 0.12, 0]}
        to={[0, 2.65, 0]}
        radius={0.038}
        color="#52616d"
      />
      <Rod
        from={[0, 2.63, 0]}
        to={[0.38, 2.63, 0]}
        radius={0.035}
        color="#52616d"
      />
      <mesh position={[0.38, 2.6, 0]}>
        <coneGeometry args={[0.26, 0.12, 32]} />
        <meshStandardMaterial
          color="#354451"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.38, 2.5, 0]}>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial
          color="#f3dab8"
          emissive="#ffd1a1"
          emissiveIntensity={night ? 1.6 : 0.15}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.38, 2.36, 0]}>
        <cylinderGeometry args={[0.13, 0.09, 0.045, 24]} />
        <meshStandardMaterial color="#51616c" metalness={0.6} />
      </mesh>
    </group>
  );
}
const benchSlats = [
  ...[0, 1, 2, 3].map((i) => ({
    position: [0, 0.48, -0.25 + i * 0.16],
    size: [1.8, 0.055, 0.14],
    radius: 0.015,
  })),
  ...[0, 1, 2].map((i) => ({
    position: [0, 0.75 + i * 0.14, -0.3],
    size: [1.8, 0.1, 0.05],
    radius: 0.015,
  })),
];
export function Bench({ position, rotation = [0, 0, 0] }) {
  const wood = useRoomTexture("wood", 2);
  return (
    <group position={position} rotation={rotation}>
      <Boxes items={benchSlats} map={wood} color="#8e7969" roughness={0.7} />
      <Rods
        color="#3d4b55"
        segments={[-0.65, 0.65].flatMap((x) => [
          { from: [x, 0.04, -0.22], to: [x, 1.05, -0.3], radius: 0.028 },
          { from: [x, 0.03, 0.28], to: [x, 0.5, 0.2], radius: 0.03 },
          { from: [x, 0.48, -0.28], to: [x, 0.48, 0.35], radius: 0.035 },
        ])}
      />
    </group>
  );
}
export { BotanicalPlant } from "./BotanicalPlant";
export function PavedWalks({ biome, paths }) {
  const mesh = useRef();
  const stones = useMemo(() => pavingPlacements(biome, paths), [biome, paths]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    stones.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.rotation.set(0, s.a, 0);
      o.scale.set(1, s.height / pavingSize[1], 1);
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
      c.set(i % 5 === 0 ? "#627080" : i % 3 === 0 ? "#737e8b" : "#6b7887");
      mesh.current.setColorAt(i, c);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [stones]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, stones.length]}
      receiveShadow
    >
      <boxGeometry args={pavingSize} />
      <meshStandardMaterial roughness={0.82} />
    </instancedMesh>
  );
}
