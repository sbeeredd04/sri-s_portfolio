"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Box, Rods } from "./ScenePrimitives";
import {
  cinemaGarden as g,
  cinemaScreen,
} from "../../lib/entertainment-layout.mjs";

const BULB = "#ffd9a0";

// Points along a gently sagging strand between two posts.
function strandPoints([a, b], count, sag = 0.32) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
      a[2] + (b[2] - a[2]) * t,
    ];
  });
}

// Every bulb in the garden, marquee border included, as one instanced draw.
function Bulbs({ points, night }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    points.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [points]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[0.055, 8, 6]} />
      <meshBasicMaterial
        color={night ? "#ffc873" : BULB}
        toneMapped={!night}
      />
    </instancedMesh>
  );
}

function Marquee() {
  const { position, size } = g.marquee;
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 220;
    const x = c.getContext("2d");
    x.fillStyle = "#2a1f2b";
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "#e8c07a";
    x.lineWidth = 6;
    x.strokeRect(34, 34, c.width - 68, c.height - 68);
    x.fillStyle = "#f6e6c8";
    x.textAlign = "center";
    x.font = `italic 600 92px ${getComputedStyle(document.body).fontFamily}`;
    x.fillText("Comfort Cinema", c.width / 2, 142);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <group position={position}>
      <Box
        position={[0, 0, -0.08]}
        size={[size[0] + 0.2, size[1] + 0.2, 0.12]}
        color="#3a2b3a"
        radius={0.03}
      />
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
    </group>
  );
}

// A small projector booth off the aisle; at night its beam reaches the screen.
function Booth({ night }) {
  const { position: [bx, , bz], size: [w, h, d] } = g.booth;
  const lens = [bx + 0.2, h - 0.55, bz - d / 2 - 0.05];
  const beam = useMemo(() => {
    const from = new THREE.Vector3(...lens),
      to = new THREE.Vector3(...cinemaScreen);
    // The beam thins out just before the screen so the picture stays clean.
    const length = from.distanceTo(to) * 0.82;
    const geometry = new THREE.ConeGeometry(1.05, length, 20, 1, true);
    geometry.translate(0, -length / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, -1, 0),
      to.clone().sub(from).normalize(),
    );
    return { geometry, q };
  }, []);
  useEffect(() => () => beam.geometry.dispose(), [beam]);
  return (
    <group>
      <Box position={[bx, h / 2, bz]} size={[w, h, d]} color="#4a3f4c" radius={0.04} />
      <Box position={[bx, h + 0.06, bz]} size={[w + 0.2, 0.12, d + 0.2]} color="#2f2731" radius={0.02} />
      <mesh position={lens} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.14, 16]} />
        <meshBasicMaterial color={night ? "#fff4d8" : "#20242a"} toneMapped={!night} />
      </mesh>
      {night && (
        <mesh position={lens} quaternion={beam.q} geometry={beam.geometry}>
          <meshBasicMaterial
            color="#fff1d0"
            transparent
            opacity={0.035}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// A striped-awning popcorn cart on two wheels.
function Cart() {
  const { position, yaw } = g.cart;
  const stripes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        position: [-0.55 + i * 0.22, 1.72, 0],
        size: [0.22, 0.05, 0.9],
        color: i % 2 ? "#f3ece0" : "#c2473d",
      })),
    [],
  );
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Box position={[0, 0.72, 0]} size={[1.3, 0.7, 0.7]} color="#c2473d" radius={0.04} />
      <Box position={[0, 1.22, 0]} size={[1.2, 0.3, 0.6]} color="#f6e7b8" radius={0.02} metalness={0.1} roughness={0.25} />
      {stripes.map((s, i) => (
        <Box key={i} {...s} radius={0.01} />
      ))}
      <Rods
        color="#7b7f86"
        segments={[-0.6, 0.6].map((x) => ({
          from: [x, 1.05, 0.3],
          to: [x, 1.7, 0.3],
          radius: 0.02,
        }))}
      />
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.24, 0.38]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2, 0.035, 8, 20]} />
          <meshStandardMaterial color="#2c2f34" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function CinemaGarden({ night }) {
  const bulbs = useMemo(() => {
    const points = g.strands.flatMap((s) => strandPoints(s, 11));
    const { position: [mx, my, mz], size: [w, h] } = g.marquee;
    for (let i = 0; i <= 16; i++)
      for (const y of [my - h / 2 - 0.02, my + h / 2 + 0.02])
        points.push([mx - w / 2 + (i / 16) * w, y, mz + 0.02]);
    return points;
  }, []);
  return (
    <group>
      <Marquee />
      {g.beanbags.map((b, i) => (
        <mesh
          key={i}
          position={[b.position[0], b.position[1] + 0.22, b.position[2]]}
          rotation={[0, b.yaw, 0]}
          scale={[0.5, 0.3, 0.46]}
          castShadow
        >
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color={b.color} roughness={0.95} />
        </mesh>
      ))}
      <Rods
        color="#475465"
        segments={g.posts.map(([x, z]) => ({
          from: [x, 0.12, z],
          to: [x, 2.8, z],
          radius: 0.03,
        }))}
      />
      <Bulbs points={bulbs} night={night} />
      <Booth night={night} />
      <Cart />
    </group>
  );
}
