"use client";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Boxes, Rods } from "./ScenePrimitives";
import usePbrSet from "./usePbrSet";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import { roundedBox } from "../../lib/model-geometry.mjs";
import CourtPlay from "./CourtPlay";
import BadmintonRally from "./BadmintonRally";
import { useRoomTexture } from "./RoomMaterials";
import { courts } from "../../lib/court-layout.mjs";

function line(x1, z1, x2, z2, thickness = 0.04) {
  return {
    position: [(x1 + x2) / 2, 0.05, (z1 + z2) / 2],
    size: [
      Math.abs(x2 - x1) || thickness,
      0.008,
      Math.abs(z2 - z1) || thickness,
    ],
  };
}
const courtColor = {
  badminton: "#577893",
  volleyball: "#88807a",
  basketball: "#567572",
};
// Photographed acrylic court and concrete apron (CC0) laid on in world space,
// keeping each court's palette colour and adding real grain and wear.
function TexturedSlab({ position, size, color, set, scale, strength }) {
  const maps = usePbrSet(set);
  const geometry = useMemo(() => roundedBox(size, 0.008), [size]);
  const material = useMemo(
    () =>
      applyTriplanar(
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
        {
          ...maps,
          mode: "detail",
          scale,
          strength,
          normalStrength: 0.8,
          meanLuminance: 0.45,
        },
      ),
    [maps, color, scale, strength],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      receiveShadow
    />
  );
}
function PlainSurface({ id, apron, play }) {
  const texture = useRoomTexture("stone", 14);
  return (
    <>
      <Box
        {...apron}
        radius={0.01}
        color="#3d4d5d"
        roughness={0.98}
        map={texture}
        bumpMap={texture}
        bumpScale={0.0015}
      />
      <Box
        {...play}
        radius={0.005}
        color={courtColor[id]}
        roughness={0.94}
        map={texture}
        bumpMap={texture}
        bumpScale={0.001}
      />
    </>
  );
}
function Surface({ id, lines }) {
  const court = courts[id];
  const apron = useMemo(
    () => ({
      position: [0, 0.008, 0],
      size: [
        court.width + court.apron * 2,
        0.03,
        court.depth + court.apron * 2,
      ],
    }),
    [court],
  );
  const play = useMemo(
    () => ({
      position: [0, 0.034, 0],
      size: [court.width, 0.018, court.depth],
    }),
    [court],
  );
  return (
    <>
      <Suspense fallback={<PlainSurface {...{ id, apron, play }} />}>
        <TexturedSlab
          {...apron}
          color="#48515a"
          set="concrete"
          scale={0.35}
          strength={0.9}
        />
        <TexturedSlab
          {...play}
          color={courtColor[id]}
          set="court-painted"
          scale={0.6}
          strength={0.7}
        />
      </Suspense>
      <Boxes items={lines} color="#e4e5de" />
    </>
  );
}
function Net({ width, height, depth, posts, color }) {
  const mesh = useMemo(
    () => [
      ...Array.from({ length: Math.ceil(width / 0.16) + 1 }, (_, i, all) => ({
        from: [-width / 2 + i * 0.16, height - depth, 0],
        to: [-width / 2 + i * 0.16, height, 0],
        radius: 0.005,
      })).filter((s) => s.from[0] <= width / 2),
      ...Array.from({ length: Math.floor(depth / 0.14) + 1 }, (_, i) => ({
        from: [-width / 2, height - i * 0.14, 0],
        to: [width / 2, height - i * 0.14, 0],
        radius: 0.005,
      })),
    ],
    [width, height, depth],
  );
  return (
    <>
      <Rods segments={mesh} color="#d2d5d3" />
      <Rods
        segments={[-posts, posts].map((x) => ({
          from: [x, 0.03, 0],
          to: [x, height + 0.04, 0],
          radius: 0.045,
        }))}
        color={color}
      />
      <Boxes
        color="#ece9dd"
        items={[height, height - depth].map((y) => ({
          position: [0, y, 0],
          size: [width, 0.045, 0.022],
        }))}
      />
      {[-posts, posts].map((x) => (
        <Box
          key={x}
          position={[x, 0.52, 0]}
          size={[0.18, 0.98, 0.18]}
          color={color}
          radius={0.05}
        />
      ))}
    </>
  );
}
function Boundary({ width, depth }) {
  return [
    line(-width / 2, -depth / 2, width / 2, -depth / 2),
    line(-width / 2, depth / 2, width / 2, depth / 2),
    line(-width / 2, -depth / 2, -width / 2, depth / 2),
    line(width / 2, -depth / 2, width / 2, depth / 2),
  ];
}
export function BadmintonCourt({ animate, detailed }) {
  const c = courts.badminton;
  const lines = useMemo(
    () => [
      ...Boundary(c),
      ...[-2.59, 2.59].map((x) => line(x, -6.7, x, 6.7)),
      ...[-5.94, -1.98, 1.98, 5.94].map((z) => line(-3.05, z, 3.05, z)),
      line(0, -6.7, 0, -1.98),
      line(0, 1.98, 0, 6.7),
    ],
    [c],
  );
  return (
    <group position={[c.center[0], 0, c.center[1]]}>
      <Surface id="badminton" lines={lines} />
      <Net
        width={6.1}
        height={1.55}
        depth={0.76}
        posts={3.08}
        color="#738995"
      />
      {detailed && (
        <group position={[0, 0.047, 0]}>
          <BadmintonRally animate={animate} />
        </group>
      )}
    </group>
  );
}
export function VolleyballCourt({
  animate,
  detailed,
  request,
  ...interaction
}) {
  const c = courts.volleyball;
  const antennae = useMemo(() => {
    const strips = [-4.5, 4.5].flatMap((x) =>
      Array.from({ length: 8 }, (_, i) => ({
        position: [x, c.net + i * 0.1 + 0.05, 0],
        size: [0.018, 0.1, 0.018],
      })),
    );
    return [
      strips.filter((_, i) => i % 2 === 0),
      strips.filter((_, i) => i % 2 === 1),
    ];
  }, [c]);
  const lines = useMemo(
    () => [...Boundary(c), ...[-3, 0, 3].map((z) => line(-4.5, z, 4.5, z))],
    [c],
  );
  return (
    <group position={[c.center[0], 0, c.center[1]]}>
      <Surface id="volleyball" lines={lines} />
      <Net width={9.5} height={c.net} depth={1} posts={4.85} color="#657e81" />
      <Boxes items={antennae[0]} color="#d0d9de" />
      <Boxes items={antennae[1]} color="#b57377" />
      {detailed && (
        <CourtPlay
          animate={animate}
          variant="volleyball"
          request={request}
          {...interaction}
        />
      )}
    </group>
  );
}
function Arc({ radius, center, start = 0, length = Math.PI * 2 }) {
  return (
    <mesh
      position={[center[0], 0.057, center[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry
        args={[radius - 0.025, radius + 0.025, 80, 1, start, length]}
      />
      <meshStandardMaterial color="#e4e5de" roughness={0.92} />
    </mesh>
  );
}
export function BasketballCourt({
  animate,
  detailed,
  request,
  ...interaction
}) {
  const c = courts.basketball,
    rimZ = -c.depth / 2 + 1.575;
  const lines = useMemo(
    () => [
      ...Boundary(c),
      line(-2.45, -5.5, -2.45, 0.3),
      line(2.45, -5.5, 2.45, 0.3),
      line(-2.45, 0.3, 2.45, 0.3),
      line(-6.6, -5.5, -6.6, -2.51),
      line(6.6, -5.5, 6.6, -2.51),
    ],
    [c],
  );
  const frame = useMemo(
    () => [
      { from: [0, 0.08, -6.25], to: [0, 3.85, -6.25], radius: 0.095 },
      { from: [0, 3.7, -6.25], to: [0, 3.5, -4.3], radius: 0.065 },
      { from: [0, 2.65, -6.25], to: [0, 3.25, -4.3], radius: 0.04 },
    ],
    [],
  );
  return (
    <group position={[c.center[0], 0, c.center[1]]}>
      <Surface id="basketball" lines={lines} />
      <Arc radius={1.8} center={[0, 0.3]} />
      <Arc
        radius={6.75}
        center={[0, rimZ]}
        start={Math.PI + 0.219}
        length={Math.PI - 0.438}
      />
      <Arc radius={1.25} center={[0, rimZ]} start={Math.PI} length={Math.PI} />
      <Rods segments={frame} color="#596b7b" />
      <Box
        position={[0, 0.6, -6.25]}
        size={[0.35, 1.1, 0.35]}
        radius={0.08}
        color="#738793"
      />
      <Box
        position={[0, 3.5, -4.3]}
        size={[1.84, 1.09, 0.075]}
        radius={0.02}
        color="#bdcbd1"
        metalness={0.18}
        roughness={0.2}
      />
      <Box
        position={[0, 3.43, -4.253]}
        size={[0.6, 0.47, 0.018]}
        color="#e3e4da"
        radius={0.002}
      />
      <Box
        position={[0, 3.43, -4.241]}
        size={[0.51, 0.38, 0.018]}
        color="#96aab4"
        radius={0.002}
      />
      <Box
        position={[0, 3.04, -4.19]}
        size={[0.17, 0.065, 0.17]}
        color="#b57252"
        radius={0.01}
      />
      <mesh
        position={[0, c.hoop, rimZ]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.225, 0.017, 10, 48]} />
        <meshStandardMaterial
          color="#bd7956"
          roughness={0.42}
          metalness={0.35}
        />
      </mesh>
      {detailed && (
        <CourtPlay
          animate={animate}
          variant="basketball"
          request={request}
          {...interaction}
        />
      )}
    </group>
  );
}
