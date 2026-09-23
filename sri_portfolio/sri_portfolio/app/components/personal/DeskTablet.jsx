"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Rod } from "./ScenePrimitives";
import { roundedRectangle } from "../../lib/model-geometry.mjs";
// A 13-inch-class tablet, about 28 × 21 cm. The stand sits clear of the keyboard and book.
export default function DeskTablet({ onOpen, onHover }) {
  const { frame, screen, art } = useMemo(() => {
    const frame = new THREE.ExtrudeGeometry(
      roundedRectangle(0.282, 0.216, 0.014),
      {
        depth: 0.006,
        bevelEnabled: true,
        bevelSize: 0.001,
        bevelThickness: 0.001,
        bevelSegments: 3,
        curveSegments: 10,
      },
    );
    const screen = new THREE.ShapeGeometry(
      roundedRectangle(0.263, 0.197, 0.01),
      10,
    );
    const uv = screen.attributes.uv,
      vertices = screen.attributes.position;
    for (let i = 0; i < vertices.count; i++)
      uv.setXY(
        i,
        vertices.getX(i) / 0.263 + 0.5,
        vertices.getY(i) / 0.197 + 0.5,
      );
    const canvas = document.createElement("canvas");
    canvas.width = 840;
    canvas.height = 630;
    const c = canvas.getContext("2d");
    c.fillStyle = "#ece4d5";
    c.fillRect(0, 0, 840, 630);
    c.fillStyle = "#867264";
    c.font = "24px sans-serif";
    c.fillText("FIELDNOTES / SRI", 55, 65);
    c.fillStyle = "#352e2c";
    c.font = "52px serif";
    c.fillText("An idea starts here.", 55, 170);
    c.strokeStyle = "#bdb3a455";
    c.lineWidth = 2;
    for (let y = 260; y < 580; y += 52) {
      c.beginPath();
      c.moveTo(55, y);
      c.lineTo(785, y);
      c.stroke();
    }
    c.fillStyle = "#7e7265";
    c.font = "26px sans-serif";
    c.fillText("A page for what comes next.", 55, 270);
    c.fillText("Open the writing room ↗", 55, 550);
    const art = new THREE.CanvasTexture(canvas);
    art.colorSpace = THREE.SRGBColorSpace;
    art.anisotropy = 4;
    return { frame, screen, art };
  }, []);
  useEffect(
    () => () => {
      frame.dispose();
      screen.dispose();
      art.dispose();
    },
    [frame, screen, art],
  );
  return (
    <group
      position={[-1.05, 0.784, -0.54]}
      onClick={(e) => {
        if (e.delta > 4) return;
        e.stopPropagation();
        onOpen?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.("Open the writing room");
      }}
      onPointerOut={() => onHover?.("")}
    >
      <Box
        position={[0, 0.004, 0]}
        size={[0.18, 0.008, 0.14]}
        color="#60626a"
        metalness={0.8}
        roughness={0.32}
        radius={0.006}
      />
      <Rod
        from={[0, 0.008, -0.015]}
        to={[0, 0.068, -0.017]}
        radius={0.012}
        color="#9a9da2"
      />
      <group position={[0, 0.105, 0]} rotation={[-0.28, 0, 0]}>
        <mesh geometry={frame} castShadow>
          <meshStandardMaterial
            color="#9c9da2"
            metalness={0.8}
            roughness={0.27}
          />
        </mesh>
        <mesh geometry={screen} position={[0, 0, 0.0075]}>
          <meshStandardMaterial
            map={art}
            emissiveMap={art}
            emissive="#ffffff"
            emissiveIntensity={0.25}
            roughness={0.24}
          />
        </mesh>
        <mesh position={[0, 0.103, 0.008]}>
          <circleGeometry args={[0.002, 12]} />
          <meshStandardMaterial color="#111318" />
        </mesh>
        <Box
          position={[0.149, 0, 0]}
          size={[0.007, 0.185, 0.007]}
          radius={0.003}
          color="#ebeae4"
          roughness={0.5}
        />
      </group>
    </group>
  );
}
