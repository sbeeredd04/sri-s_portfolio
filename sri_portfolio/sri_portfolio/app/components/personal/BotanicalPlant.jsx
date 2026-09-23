"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useRoomTexture } from "./RoomMaterials";

function broadLeaf() {
  const geometry = new THREE.PlaneGeometry(2, 1, 18, 48);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i),
      t = position.getY(i) + 0.5;
    let edge = 1;
    for (const notch of [0.25, 0.47, 0.67, 0.82]) {
      edge -= 0.82 * Math.exp(-(((t - notch) / 0.021) ** 2));
    }
    const width = Math.sin(Math.PI * t) ** 0.72 * 0.37 * edge;
    position.setXYZ(
      i,
      u * width,
      t,
      -0.11 * t * t +
        0.075 * (1 - Math.abs(u)) * Math.sin(Math.PI * t) +
        0.025 * Math.sin(t * 8) * u,
    );
  }
  // Openings near the midrib give the leaf a real silhouette and cast-through shadows.
  const indices = [],
    source = geometry.index.array,
    uv = geometry.attributes.uv;
  for (let i = 0; i < source.length; i += 3) {
    const triangle = [source[i], source[i + 1], source[i + 2]];
    const u = triangle.reduce((s, j) => s + uv.getX(j), 0) / 3,
      t = triangle.reduce((s, j) => s + uv.getY(j), 0) / 3;
    const hole = [0.36, 0.57].some((y) =>
      [-1, 1].some(
        (side) =>
          ((u - (0.5 + side * 0.22)) / 0.05) ** 2 + ((t - y) / 0.039) ** 2 < 1,
      ),
    );
    if (!hole) indices.push(...triangle);
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function fernFrond() {
  const vertices = [];
  function triangle(a, b, c) {
    vertices.push(...a, ...b, ...c);
  }
  for (let i = 0; i < 17; i++) {
    const t = 0.06 + i * 0.052,
      reach = Math.sin(Math.PI * t) ** 0.72 * 0.22;
    for (const side of [-1, 1]) {
      const root = [0, t, -t * t * 0.1],
        tip = [side * reach, t + 0.105, -t * t * 0.14],
        a = [side * reach * 0.35, t + 0.015, 0.008 - t * t * 0.1],
        b = [side * reach * 0.3, t + 0.095, -t * t * 0.1];
      triangle(root, a, tip);
      triangle(root, tip, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  return g;
}
export function BotanicalPlant({
  position = [0, 0, 0],
  scale = 1,
  wild = false,
  animate = false,
}) {
  const leaves = useRef(),
    time = useRef(0),
    leafMap = useRoomTexture("leaf");
  const blade = useMemo(() => (wild ? fernFrond() : broadLeaf()), [wild]);
  const foliage = useMemo(
    () =>
      Array.from({ length: wild ? 13 : 8 }, (_, i) => {
        const a = i * 2.39996,
          spread = wild ? 0.07 : 0.14 + (i % 3) * 0.04,
          h = wild ? 0.05 : 0.62 + (i % 4) * 0.15;
        return {
          position: new THREE.Vector3(
            Math.cos(a) * spread,
            h,
            -Math.sin(a) * spread,
          ),
          angle: a,
          lean: wild ? 0.4 + (i % 5) * 0.17 : 0.65 + (i % 3) * 0.15,
          length: wild ? 0.65 + (i % 4) * 0.15 : 0.54 + (i % 3) * 0.12,
        };
      }),
    [wild],
  );
  const stems = useMemo(() => {
    const parts = foliage.map((f) => {
      const start = new THREE.Vector3(0, wild ? 0 : 0.43, 0);
      const middle = start.clone().lerp(f.position, 0.55);
      middle.y += 0.09;
      return new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(start, middle, f.position),
        10,
        wild ? 0.006 : 0.009,
        6,
        false,
      );
    });
    const result = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    return result;
  }, [foliage, wild]);
  useEffect(
    () => () => {
      blade.dispose();
      stems.dispose();
    },
    [blade, stems],
  );
  const object = useMemo(() => new THREE.Object3D(), []);
  function pose(t) {
    foliage.forEach((f, i) => {
      object.position.copy(f.position);
      object.rotation.set(
        0.07 * Math.sin(i) + 0.025 * Math.sin(t * 0.75 + i * 1.4),
        f.angle,
        -f.lean + 0.018 * Math.sin(t * 0.9 + i),
      );
      object.scale.setScalar(f.length);
      object.updateMatrix();
      leaves.current.setMatrixAt(i, object.matrix);
    });
    leaves.current.instanceMatrix.needsUpdate = true;
  }
  useLayoutEffect(() => {
    pose(0);
    const c = new THREE.Color();
    foliage.forEach((_, i) => {
      c.set(
        (wild
          ? ["#375d54", "#40695b", "#527469"]
          : ["#355a49", "#486c52", "#3d6250", "#56775a"])[i % (wild ? 3 : 4)],
      );
      leaves.current.setColorAt(i, c);
    });
    leaves.current.instanceColor.needsUpdate = true;
    leaves.current.computeBoundingSphere();
    leaves.current.boundingSphere.radius += 0.06;
  }, [foliage]);
  useFrame((_, dt) => {
    if (animate) {
      time.current += Math.min(dt, 0.05);
      pose(time.current);
    }
  });
  return (
    <group position={position} scale={scale}>
      {!wild && (
        <>
          <mesh castShadow receiveShadow>
            <latheGeometry
              args={[
                [
                  [0.17, 0.025],
                  [0.205, 0.025],
                  [0.218, 0.05],
                  [0.265, 0.455],
                  [0.264, 0.48],
                  [0.235, 0.48],
                  [0.233, 0.438],
                ].map((p) => new THREE.Vector2(...p)),
                40,
              ]}
            />
            <meshStandardMaterial color="#aca599" roughness={0.76} />
          </mesh>
          <mesh position={[0, 0.438, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.235, 32]} />
            <meshStandardMaterial color="#292927" roughness={1} />
          </mesh>
        </>
      )}
      <mesh geometry={stems} castShadow>
        <meshStandardMaterial
          color={wild ? "#486b51" : "#526d49"}
          roughness={0.74}
        />
      </mesh>
      <instancedMesh
        ref={leaves}
        args={[blade, undefined, foliage.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={wild ? null : leafMap}
          roughness={wild ? 0.85 : 0.5}
          side={THREE.DoubleSide}
          envMapIntensity={0.4}
        />
      </instancedMesh>
    </group>
  );
}
