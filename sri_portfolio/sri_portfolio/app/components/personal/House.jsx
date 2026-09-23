"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { houseSection as h } from "../../lib/studio-layout.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { Box, Boxes, Rod } from "./ScenePrimitives";
import { BotanicalPlant as Plant } from "./BotanicalPlant";
import { useRoomTexture } from "./RoomMaterials";
import RainWindow from "./RainWindow";
import { WoodFloor } from "./ListeningFurniture";

const pitch = Math.atan((h.ridge - h.eave) / h.halfWidth);
const roofWidth = (h.halfWidth + 0.42) / Math.cos(pitch);
const battens = [-1, 1].flatMap((side) =>
  Array.from({ length: 42 }, (_, i) => ({
    position: [side * 6.315, 1.83, -3.91 + i * 0.214],
    size: [0.036, 3.3, 0.064],
    radius: 0.005,
  })),
);
const trim = [-1, 1].flatMap((side) => [
  {
    position: [side * 6.3, 0.235, 0.5],
    size: [0.06, 0.18, 8.9],
    radius: 0.008,
  },
  {
    position: [side * 6.3, 3.43, 0.5],
    size: [0.15, 0.16, 9.05],
    radius: 0.012,
  },
]);
const seams = Array.from({ length: 23 }, (_, i) => ({
  // Standing seams follow drainage, from the ridge down to the eave.
  position: [0, 0.09, -4.62 + i * 0.42],
  size: [roofWidth, 0.028, 0.018],
  radius: 0.004,
}));
function Gable({ z }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-h.halfWidth, h.eave);
    shape.lineTo(0, h.ridge);
    shape.lineTo(h.halfWidth, h.eave);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={[0, 0, z]} geometry={geometry}>
      <meshPhysicalMaterial
        color="#b7c8d8"
        transparent
        opacity={0.12}
        roughness={0.17}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
export default function House({ children, animate, night }) {
  const shell = useRef(),
    roof = useRef();
  const wood = useRoomTexture("walnut", 2);
  const charredTimber = useRoomTexture("charred", 2);
  const center = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!shell.current || !roof.current) return;
    shell.current.getWorldPosition(center);
    const opacity = THREE.MathUtils.smoothstep(
      center.distanceTo(camera.position),
      9,
      14,
    );
    roof.current.traverse((object) => {
      if (!object.isMesh) return;
      object.material.transparent = true;
      object.material.opacity = opacity;
      object.material.depthWrite = opacity > 0.98;
      object.castShadow = opacity > 0.5;
      object.visible = opacity > 0.015;
    });
  });
  return (
    <group ref={shell}>
      {/* A deep plinth meets the curved terrain at the corners, not a floating slab. */}
      <Box
        position={[0, -0.31, 0.5]}
        size={[13.04, 0.82, 9.04]}
        color="#515963"
        roughness={0.94}
        radius={0.035}
      />
      <Box
        position={[0, 0.08, 0.5]}
        size={[13.16, 0.1, 9.16]}
        color="#92989c"
        roughness={0.82}
        radius={0.015}
      />
      <group position={[0, 0, 0.5]}>
        <WoodFloor width={13} depth={9} y={0.1275} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * h.halfWidth, 1.82, 0.5]}
            size={[0.18, 3.36, 9]}
            color="#555650"
            map={charredTimber}
            bumpMap={charredTimber}
            bumpScale={0.0015}
            roughness={0.93}
            radius={0.014}
          />
          <group
            position={[(side * h.halfWidth) / 2, (h.eave + h.ridge) / 2, 0.5]}
            rotation={[0, 0, -side * pitch]}
          >
            {/* Underside is only visible from indoors; it never hides the room from above. */}
            <mesh
              position={[0, -0.084, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[roofWidth, 9.75]} />
              <meshStandardMaterial
                color="#b7a087"
                map={wood}
                roughness={0.83}
              />
            </mesh>
          </group>
        </group>
      ))}
      <Boxes items={battens} color="#958477" map={wood} roughness={0.77} />
      <Boxes items={trim} color="#3b414a" roughness={0.54} />
      <group ref={roof}>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[(side * h.halfWidth) / 2, (h.eave + h.ridge) / 2, 0.5]}
            rotation={[0, 0, -side * pitch]}
          >
            <Box
              size={[roofWidth, 0.16, 9.8]}
              color="#414747"
              radius={0.012}
              metalness={0.55}
              roughness={0.58}
            />
            <Boxes
              items={seams}
              color="#505858"
              metalness={0.55}
              roughness={0.52}
            />
          </group>
        ))}
        <Box
          position={[0, h.ridge + 0.05, 0.5]}
          size={[0.17, 0.12, 9.83]}
          color="#4d5868"
          metalness={0.5}
          radius={0.04}
        />
      </group>
      {/* Actual rafters join ridge, wall plates and posts. */}
      {[-3.95, 0.5, 4.96].map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box
                position={[(side * h.halfWidth) / 2, 4.09, z]}
                rotation={[0, 0, -side * pitch]}
                size={[6.57, 0.16, 0.16]}
                map={wood}
                color="#ac9077"
                radius={0.008}
              />
              <Box
                position={[side * 6.24, 1.84, z]}
                size={[0.16, 3.4, 0.16]}
                color="#3d4651"
                radius={0.012}
              />
            </group>
          ))}
        </group>
      ))}
      <Box
        position={[0, 4.65, 0.5]}
        size={[0.19, 0.19, 9.15]}
        map={wood}
        color="#ac9077"
        radius={0.008}
      />
      <Gable z={5} />
      <Gable z={-4} />
      <RainWindow animate={animate} night={night} />
      {/* Front glass is split around a real doorway. The open leaf clears the approach. */}
      {[
        [1.2, 10.2],
        [-6, 0.4],
      ].map(([x, width]) => (
        <mesh key={x} position={[x, 1.82, 5]}>
          <planeGeometry args={[width, 3.2]} />
          <meshPhysicalMaterial
            color="#bed0e3"
            transparent
            opacity={0.045}
            roughness={0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {[-5.8, -3.9, 0, 3.15, 6.3].map((x) => (
        <Box
          key={x}
          position={[x, 1.82, 5.02]}
          size={[0.065, 3.36, 0.09]}
          color="#414c5b"
          metalness={0.65}
          radius={0.01}
        />
      ))}
      <Box
        position={[0, 3.49, 5.02]}
        size={[12.65, 0.15, 0.14]}
        color="#45505f"
        radius={0.015}
      />
      <group position={[-5.78, 0.15, 5.08]} rotation={[0, -Math.PI / 2, 0]}>
        <Box
          position={[0.9, 1.55, 0]}
          size={[1.8, 3.1, 0.075]}
          color="#a08a70"
          map={wood}
          radius={0.016}
        />
        <Rod
          from={[1.57, 1.25, 0.08]}
          to={[1.57, 1.73, 0.08]}
          radius={0.024}
          color="#bdc7d2"
        />
      </group>
      <Box
        position={[-4.85, 0.035, 5.68]}
        size={[2.45, 0.19, 1.35]}
        color="#92999f"
        roughness={0.8}
        radius={0.025}
      />
      <Box
        position={[-4.85, -0.045, 6.3]}
        size={[2.8, 0.11, 0.55]}
        color="#92999f"
        radius={0.02}
      />
      <Plant animate={animate} position={[-6.02, 0.15, 5.65]} scale={0.75} />
      <Plant animate={animate} position={[5.9, 0.15, 5.55]} scale={1} />
      {[-6.24, 6.24].map((x) => (
        <group key={x}>
          <Box
            position={[x, 2.4, 5.16]}
            size={[0.18, 0.42, 0.14]}
            color="#364250"
            radius={0.025}
          />
          <mesh position={[x, 2.23, 5.18]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.065, 20]} />
            <meshBasicMaterial color="#f7dbb3" />
          </mesh>
        </group>
      ))}
      {children}
    </group>
  );
}
