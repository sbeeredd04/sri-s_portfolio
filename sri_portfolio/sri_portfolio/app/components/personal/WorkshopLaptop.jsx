"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Box } from "./ScenePrimitives";
import { hackathonArt, drawHackathonArt } from "../../lib/hackathon-art.mjs";

// The display is a sketch of the idea, never a fabricated product screenshot.
function useSketch(id, name) {
  const texture = useMemo(() => {
    const art = hackathonArt[id],
      canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 420;
    const c = canvas.getContext("2d"),
      font = getComputedStyle(document.body).fontFamily;
    c.fillStyle = "#101c2b";
    c.fillRect(0, 0, 720, 420);
    c.fillStyle = "#263445";
    c.fillRect(0, 0, 720, 32);
    ["#b48790", "#c5b297", "#94b6ab"].forEach((color, i) => {
      c.beginPath();
      c.arc(18 + i * 17, 16, 4, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
    });
    c.fillStyle = "#d7e5f3";
    c.font = `500 34px ${font}`;
    c.fillText(name, 37, 89, 640);
    c.save();
    c.translate(35, 115);
    c.scale(1.08, 1.08);
    drawHackathonArt(c, art);
    c.restore();
    c.fillStyle = "#9faec1";
    c.font = `400 18px ${font}`;
    c.fillText("A SMALL IDEA, MADE WITH A TEAM.", 37, 390);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [id, name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
export default function WorkshopLaptop({ id, name, position, rotation }) {
  const keys = useRef(),
    screen = useSketch(id, name);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    let n = 0;
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 12; col++) {
        o.position.set((col - 5.5) * 0.049, 0.025, -0.139 + row * 0.045);
        o.scale.set(0.042, 0.009, 0.033);
        o.updateMatrix();
        keys.current.setMatrixAt(n++, o.matrix);
      }
    for (const [x, w] of [
      [-0.266, 0.042],
      [-0.217, 0.042],
      [-0.165, 0.042],
      [0, 0.233],
      [0.165, 0.042],
      [0.217, 0.042],
      [0.266, 0.042],
    ]) {
      o.position.set(x, 0.025, -0.004);
      o.scale.set(w, 0.009, 0.033);
      o.updateMatrix();
      keys.current.setMatrixAt(n++, o.matrix);
    }
    keys.current.instanceMatrix.needsUpdate = true;
    keys.current.computeBoundingSphere();
  }, []);
  return (
    <group position={position} rotation={rotation}>
      <Box
        size={[0.75, 0.035, 0.52]}
        color="#9eabb8"
        radius={0.014}
        metalness={0.78}
        roughness={0.32}
      />
      <mesh
        position={[0, 0.037, -0.22]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.016, 0.016, 0.61, 16]} />
        <meshStandardMaterial
          color="#536273"
          metalness={0.8}
          roughness={0.33}
        />
      </mesh>
      <group position={[0, 0.245, -0.22]} rotation={[-0.18, 0, 0]}>
        <Box
          size={[0.75, 0.46, 0.026]}
          color="#758391"
          radius={0.012}
          metalness={0.75}
          roughness={0.35}
        />
        <Box
          position={[0, 0, 0.016]}
          size={[0.722, 0.432, 0.008]}
          color="#131c28"
          radius={0.004}
        />
        <mesh position={[0, -0.003, 0.021]}>
          <planeGeometry args={[0.691, 0.403]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.208, 0.022]}>
          <circleGeometry args={[0.0035, 12]} />
          <meshStandardMaterial color="#4c5b70" metalness={0.8} />
        </mesh>
      </group>
      <instancedMesh ref={keys} args={[undefined, undefined, 43]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#28323f" roughness={0.65} />
      </instancedMesh>
      <Box
        position={[0, 0.019, 0.129]}
        size={[0.24, 0.006, 0.132]}
        color="#647487"
        radius={0.002}
        metalness={0.65}
      />
      <Box
        position={[0, 0.022, 0.129]}
        size={[0.234, 0.005, 0.126]}
        color="#99a8b8"
        radius={0.002}
        metalness={0.65}
        roughness={0.35}
      />
      <mesh position={[0, -0.006, 0.259]}>
        <planeGeometry args={[0.09, 0.009]} />
        <meshStandardMaterial color="#536174" />
      </mesh>
    </group>
  );
}
