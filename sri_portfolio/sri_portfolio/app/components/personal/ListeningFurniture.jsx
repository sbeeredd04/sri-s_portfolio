"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Box, Rods } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import { Sign } from "./StreetFurniture";

export function WoodFloor({ width = 10, depth = 7.5, y = 0.13 }) {
  const mesh = useRef(),
    wood = useRoomTexture("walnut");
  const boards = useMemo(() => {
    const result = [],
      columns = Math.ceil(width / 0.23),
      boardWidth = width / columns;
    for (let column = 0; column < columns; column++) {
      const offset = (column % 3) * 0.7;
      for (let row = -1; row < Math.ceil(depth / 2.1); row++) {
        const a = Math.max(-depth / 2, -depth / 2 + row * 2.1 + offset);
        const b = Math.min(depth / 2, -depth / 2 + (row + 1) * 2.1 + offset);
        if (b - a > 0.05)
          result.push({
            x: -width / 2 + (column + 0.5) * boardWidth,
            z: (a + b) / 2,
            width: boardWidth - 0.002,
            depth: b - a - 0.002,
          });
      }
    }
    return result;
  }, [width, depth]);
  useLayoutEffect(() => {
    const object = new THREE.Object3D(),
      color = new THREE.Color();
    boards.forEach((b, i) => {
      object.position.set(b.x, y, b.z);
      object.scale.set(b.width, 0.025, b.depth);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
      const shade = 0.84 + (Math.sin(i * 137.2) * 0.5 + 0.5) * 0.13;
      color.setRGB(shade, shade, shade);
      mesh.current.setColorAt(i, color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [boards, y]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, boards.length]}
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#eee2d1"
        map={wood}
        roughness={0.64}
        metalness={0.015}
      />
    </instancedMesh>
  );
}

export function Upholstery({ position, rotation, size, color, radius = 0.1 }) {
  const fabric = useRoomTexture("fabric", 9);
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        ...size,
        4,
        Math.min(radius, ...size.map((v) => v / 2 - 0.001)),
      ),
    [size[0], size[1], size[2], radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        roughness={0.96}
        map={fabric}
        bumpMap={fabric}
        bumpScale={0.003}
        sheen={0.65}
        sheenColor="#acb6c0"
        sheenRoughness={0.85}
      />
    </mesh>
  );
}

export function Piping({
  width,
  height,
  position,
  rotation,
  color = "#77818b",
}) {
  const geometry = useMemo(() => {
    const w = width / 2,
      h = height / 2,
      r = 0.09,
      s = new THREE.Shape();
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h);
    s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r);
    s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h);
    s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r);
    s.quadraticCurveTo(-w, -h, -w + r, -h);
    const points = s
      .getPoints(12)
      .slice(0, -1)
      .map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, true),
      80,
      0.007,
      5,
      true,
    );
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
    >
      <meshStandardMaterial color={color} roughness={0.98} />
    </mesh>
  );
}

export function LoungeChair({ position, rotation }) {
  const wood = useRoomTexture("walnut");
  return (
    <group position={position} rotation={rotation}>
      <Box
        position={[0, 0.39, 0]}
        size={[1.42, 0.12, 1.48]}
        color="#b7a28c"
        map={wood}
        roughness={0.55}
        radius={0.055}
      />
      <Upholstery
        position={[0, 0.59, 0.07]}
        size={[1.21, 0.31, 1.27]}
        color="#54616e"
        radius={0.15}
      />
      <Piping
        width={1.06}
        height={1.11}
        position={[0, 0.711, 0.07]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <group position={[0, 1.12, -0.57]} rotation={[-0.14, 0, 0]}>
        <Box
          size={[1.4, 1.15, 0.12]}
          color="#b4a08a"
          map={wood}
          radius={0.055}
        />
        <Upholstery
          position={[0, 0, 0.17]}
          size={[1.21, 1.02, 0.3]}
          color="#53616e"
          radius={0.14}
        />
        <Piping width={1.05} height={0.84} position={[0, 0, 0.307]} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 0.72, 0.83, 0.02]}
            size={[0.15, 0.095, 1.47]}
            color="#c2ad93"
            map={wood}
            radius={0.045}
            roughness={0.42}
          />
          <Rods
            color="#66717a"
            segments={[-0.49, 0.47].map((z) => ({
              from: [side * 0.68, 0.12, z + 0.08],
              to: [side * 0.65, 0.79, z],
              radius: 0.024,
            }))}
          />
          <Box
            position={[side * 0.57, 0.19, 0.56]}
            rotation={[0, 0, side * 0.08]}
            size={[0.1, 0.36, 0.11]}
            map={wood}
            color="#af9880"
            radius={0.025}
          />
          <Box
            position={[side * 0.57, 0.19, -0.55]}
            rotation={[0.1, 0, -side * 0.08]}
            size={[0.1, 0.36, 0.11]}
            map={wood}
            color="#af9880"
            radius={0.025}
          />
        </group>
      ))}
      <group position={[0.21, 0.88, -0.25]} rotation={[0.2, 0.1, -0.13]}>
        <Upholstery size={[0.65, 0.62, 0.2]} color="#a09ba8" radius={0.095} />
        <Piping
          width={0.51}
          height={0.48}
          position={[0, 0, 0.087]}
          color="#b6abbc"
        />
      </group>
    </group>
  );
}

export function RecordCrate({ position, onOpen }) {
  const wood = useRoomTexture("walnut");
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onOpen("music");
      }}
    >
      <Box
        position={[0, 0.1, 0]}
        size={[1.16, 0.12, 0.68]}
        color="#bca28b"
        map={wood}
        radius={0.018}
      />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          position={[side * 0.55, 0.32, 0]}
          size={[0.06, 0.52, 0.68]}
          color="#bca28b"
          map={wood}
          radius={0.018}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          position={[0, 0.2 + i * 0.14, 0.32]}
          size={[1.1, 0.095, 0.05]}
          color="#bca28b"
          map={wood}
          radius={0.015}
        />
      ))}
      {["v4", "Fred again..", "Tollywood"].map((title, i) => (
        <group
          key={title}
          position={[0.02 + i * 0.015, 0.55, -0.17 + i * 0.13]}
          rotation={[-0.14 - i * 0.04, 0, -0.025 + i * 0.015]}
        >
          <Box
            size={[0.83, 0.84, 0.035]}
            radius={0.008}
            color={["#adc4b8", "#aaa2b3", "#bda58a"][i]}
          />
          <Sign
            title={title}
            subtitle={i === 0 ? "MY FIRST MUSIC EXPLORATION" : "ON ROTATION"}
            position={[0, 0, 0.02]}
            size={[0.78, 0.79]}
            accent="#adc4b8"
          />
        </group>
      ))}
    </group>
  );
}
