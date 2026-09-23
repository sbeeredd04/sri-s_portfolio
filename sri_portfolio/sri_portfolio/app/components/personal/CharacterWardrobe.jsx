"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box } from "./ScenePrimitives";
import { characterShirt } from "../../lib/character-geometry.mjs";
import { useRoomTexture } from "./RoomMaterials";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundedRectangle } from "../../lib/model-geometry.mjs";

function disposeGeometry(geometry) {
  geometry.dispose();
}
function curve(points, radius, closed = false) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      closed,
    ),
    Math.max(16, Math.min(48, points.length * 3)),
    radius,
    7,
    closed,
  );
}

export function HikingPack() {
  const fabric = useRoomTexture("fabric", 5);
  const straps = useMemo(() => {
    const parts = [-1, 1].map((s) =>
      curve(
        [
          [s * 0.18, 0.84, -0.24],
          [s * 0.245, 0.955, -0.065],
          [s * 0.235, 0.83, 0.155],
          [s * 0.205, 0.64, 0.145],
          [s * 0.22, 0.46, 0.115],
          [s * 0.2, 0.44, -0.21],
        ],
        0.023,
      ),
    );
    parts.push(
      curve(
        [
          [-0.072, 0.955, -0.23],
          [-0.064, 1.01, -0.23],
          [0.064, 1.01, -0.23],
          [0.072, 0.955, -0.23],
        ],
        0.014,
      ),
    );
    const g = mergeGeometries(parts);
    parts.forEach(disposeGeometry);
    return g;
  }, []);
  const seam = useMemo(
    () =>
      curve(
        [
          [-0.15, 0.71, -0.387],
          [-0.12, 0.77, -0.387],
          [0.12, 0.77, -0.387],
          [0.15, 0.71, -0.387],
        ],
        0.003,
      ),
    [],
  );
  useEffect(
    () => () => {
      straps.dispose();
      seam.dispose();
    },
    [straps, seam],
  );
  return (
    <group>
      <Box
        position={[0, 0.7, -0.245]}
        size={[0.47, 0.5, 0.23]}
        radius={0.09}
        color="#718f89"
        map={fabric}
        roughness={0.94}
      />
      <Box
        position={[0, 0.615, -0.363]}
        size={[0.35, 0.28, 0.07]}
        radius={0.055}
        color="#587771"
        map={fabric}
        roughness={0.94}
      />
      <mesh geometry={straps} castShadow>
        <meshStandardMaterial color="#536d6b" map={fabric} roughness={0.95} />
      </mesh>
      <mesh geometry={seam}>
        <meshStandardMaterial color="#bbc6bb" roughness={0.8} />
      </mesh>
      <Box
        position={[0.142, 0.717, -0.392]}
        size={[0.015, 0.04, 0.008]}
        color="#b9c2c8"
        metalness={0.8}
        radius={0.004}
      />
      <Box
        position={[0, 0.637, -0.405]}
        size={[0.08, 0.035, 0.005]}
        color="#b7c8bc"
        radius={0.005}
      />
    </group>
  );
}

export function Shirt({ color }) {
  const fabric = useRoomTexture("fabric", 5);
  const geometry = useMemo(characterShirt, []);
  const hem = useMemo(
    () =>
      curve(
        Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          return [Math.cos(a) * 0.255, 0.414, Math.sin(a) * 0.179];
        }),
        0.0035,
        true,
      ),
    [],
  );
  useEffect(
    () => () => {
      disposeGeometry(geometry);
      disposeGeometry(hem);
    },
    [geometry, hem],
  );
  const seam = useMemo(
    () => new THREE.Color(color).multiplyScalar(0.76),
    [color],
  );
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          map={fabric}
          bumpMap={fabric}
          bumpScale={0.0008}
          roughness={0.88}
          sheen={0.25}
          sheenColor={color}
          sheenRoughness={0.85}
        />
      </mesh>
      <mesh geometry={hem}>
        <meshStandardMaterial color={seam} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0.947, 0.015]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 0.75, 1]}
      >
        <torusGeometry args={[0.113, 0.015, 10, 32]} />
        <meshStandardMaterial color={seam} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Trousers({ x, seated }) {
  const fabric = useRoomTexture("fabric", 6);
  const geometry = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(
      (seated
        ? [
            [x, 0.44, -0.01],
            [x, 0.36, 0.19],
            [x, 0.32, 0.31],
            [x, 0.11, 0.32],
          ]
        : [
            [x, 0.44, 0],
            [x, 0.3, 0.008],
            [x, 0.15, 0],
          ]
      ).map((p) => new THREE.Vector3(...p)),
      false,
      "centripetal",
    );
    const segments = seated ? 24 : 12;
    const g = new THREE.TubeGeometry(path, segments, 0.112, 20, false),
      p = g.attributes.position;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments,
        center = path.getPointAt(t),
        taper = 1 - t * 0.16 + Math.exp(-(((t - 0.57) / 0.1) ** 2)) * 0.025;
      for (let j = 0; j <= 20; j++) {
        const n = i * 21 + j;
        p.setXYZ(
          n,
          center.x + (p.getX(n) - center.x) * taper,
          center.y + (p.getY(n) - center.y) * taper,
          center.z + (p.getZ(n) - center.z) * taper,
        );
      }
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [x, seated]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#3b4555"
        map={fabric}
        bumpMap={fabric}
        bumpScale={0.0006}
        roughness={0.9}
      />
    </mesh>
  );
}

export function Shoe({ x, z }) {
  const fabric = useRoomTexture("fabric", 5);
  const { upper, details, laces, sole } = useMemo(() => {
    const sole = new THREE.ExtrudeGeometry(
      roundedRectangle(0.245, 0.397, 0.075),
      {
        depth: 0.04,
        bevelEnabled: true,
        bevelSize: 0.007,
        bevelThickness: 0.008,
        bevelSegments: 3,
        steps: 1,
        curveSegments: 8,
      },
    );
    sole.translate(0, 0, -0.02);
    sole.rotateX(-Math.PI / 2);
    const upper = new THREE.SphereGeometry(
      1,
      40,
      20,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    const p = upper.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const zz = p.getZ(i),
        y = p.getY(i),
        height = 0.135 - Math.max(0, zz) * 0.059;
      p.setXYZ(
        i,
        p.getX(i) * 0.113 * (0.94 + zz * 0.06),
        0.025 + y * height,
        zz * 0.184 + 0.011,
      );
    }
    upper.computeVertexNormals();
    const parts = [
      curve(
        Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return [Math.cos(a) * 0.116, 0.022, Math.sin(a) * 0.187 + 0.013];
        }),
        0.0025,
        true,
      ),
    ];
    // Toe-cap seam follows the upper rather than hovering as a straight bar.
    parts.push(
      curve(
        Array.from({ length: 17 }, (_, i) => {
          const a = (i / 16 - 0.5) * Math.PI;
          return [
            Math.sin(a) * 0.107,
            0.035 + Math.cos(a) * 0.065,
            0.111 + Math.cos(a) * 0.025,
          ];
        }),
        0.0023,
      ),
    );
    const laceParts = [];
    for (let i = 0; i < 3; i++) {
      const yy = 0.157 - i * 0.008,
        zz = -0.032 + i * 0.043;
      for (const s of [-1, 1])
        laceParts.push(
          curve(
            [
              [s * 0.049, yy - 0.012, zz],
              [0, yy + 0.004, zz + 0.014],
              [-s * 0.049, yy - 0.012, zz + 0.03],
            ],
            0.005,
          ),
        );
    }
    const details = mergeGeometries(parts),
      laces = mergeGeometries(laceParts);
    [...parts, ...laceParts].forEach(disposeGeometry);
    return { upper, details, laces, sole };
  }, []);
  useEffect(
    () => () => [upper, details, laces, sole].forEach(disposeGeometry),
    [upper, details, laces, sole],
  );
  return (
    <group position={[x, 0.035, z]}>
      <mesh
        geometry={sole}
        position={[0, -0.006, 0.012]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e0e5eb" roughness={0.74} />
      </mesh>
      <mesh geometry={upper} castShadow receiveShadow>
        <meshStandardMaterial
          color="#bfc9d7"
          map={fabric}
          bumpMap={fabric}
          bumpScale={0.0005}
          roughness={0.78}
        />
      </mesh>
      <mesh geometry={details}>
        <meshStandardMaterial color="#8d9db1" roughness={0.85} />
      </mesh>
      <mesh geometry={laces} castShadow>
        <meshStandardMaterial color="#f0efe9" roughness={0.86} />
      </mesh>
      <Box
        position={[0, 0.123, -0.084]}
        rotation={[0.14, 0, 0]}
        size={[0.105, 0.012, 0.126]}
        color="#a6b4c6"
        radius={0.01}
      />
      <Box
        position={[0, 0.139, -0.085]}
        rotation={[0.14, 0, 0]}
        size={[0.06, 0.004, 0.045]}
        color="#d2dae5"
        radius={0.004}
      />
    </group>
  );
}
