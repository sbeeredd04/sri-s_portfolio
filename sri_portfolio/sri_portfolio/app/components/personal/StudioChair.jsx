"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { studioSurfaces, studioCharacter } from "../../lib/studio-layout.mjs";
import { roundedRectangle } from "../../lib/model-geometry.mjs";
import { Box, Rods } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import Character from "./Character";

function lumbarCurve(y) {
  return -0.046 * Math.sin((y / 0.78 + 0.5) * Math.PI);
}
function ChairUpholstery() {
  const fabric = useRoomTexture("fabric", 9);
  const { back, seam } = useMemo(() => {
    const back = new RoundedBoxGeometry(0.72, 0.78, 0.12, 5, 0.055);
    const p = back.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setZ(i, p.getZ(i) + lumbarCurve(p.getY(i)));
    back.computeVertexNormals();
    const outline = roundedRectangle(0.681, 0.736, 0.063).getPoints(12);
    const curve = new THREE.CatmullRomCurve3(
      outline.map((v) => new THREE.Vector3(v.x, v.y, 0.057 + lumbarCurve(v.y))),
      true,
    );
    const seam = new THREE.TubeGeometry(curve, 100, 0.0033, 5, true);
    return { back, seam };
  }, []);
  useEffect(
    () => () => {
      back.dispose();
      seam.dispose();
    },
    [back, seam],
  );
  return (
    <>
      <Box
        {...studioSurfaces.chairSeat}
        color="#596676"
        radius={0.07}
        map={fabric}
        bumpMap={fabric}
        bumpScale={0.0018}
        roughness={0.96}
      />
      <group position={studioSurfaces.chairBack.position}>
        <mesh geometry={back} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#596676"
            map={fabric}
            bumpMap={fabric}
            bumpScale={0.0018}
            roughness={0.95}
            sheen={0.45}
            sheenColor="#a2aebc"
            sheenRoughness={0.85}
          />
        </mesh>
        <mesh geometry={seam}>
          <meshStandardMaterial color="#a5b0b9" roughness={0.95} />
        </mesh>
        <Box
          position={[0, -0.23, 0.091]}
          size={[0.092, 0.52, 0.037]}
          color="#4a5563"
          radius={0.015}
          metalness={0.62}
          roughness={0.38}
        />
      </group>
    </>
  );
}

export default function StudioChair({ animate }) {
  const [x, , z] = studioSurfaces.chairSeat.position;
  const wheels = useRef();
  const spokes = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = i * Math.PI * 0.4;
        return {
          angle,
          x: x + Math.sin(angle) * 0.43,
          z: z + Math.cos(angle) * 0.43,
        };
      }),
    [x, z],
  );
  const frame = useMemo(
    () => [
      ...spokes.map((p) => ({
        from: [x, 0.19, z],
        to: [p.x, 0.115, p.z],
        radius: 0.028,
      })),
      ...[-1, 1].flatMap((side) => [
        {
          from: [x + side * 0.29, 0.42, z + 0.02],
          to: [x + side * 0.42, 0.73, z + 0.12],
          radius: 0.022,
        },
        {
          from: [x + side * 0.42, 0.73, z + 0.12],
          to: [x + side * 0.42, 0.78, z - 0.13],
          radius: 0.022,
        },
      ]),
    ],
    [spokes, x, z],
  );
  useLayoutEffect(() => {
    const o = new THREE.Object3D(),
      axis = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    spokes.forEach((p, i) => {
      axis.set(Math.cos(p.angle), 0, -Math.sin(p.angle));
      for (let side = 0; side < 2; side++) {
        o.position
          .set(p.x, 0.062, p.z)
          .addScaledVector(axis, side === 0 ? -0.027 : 0.027);
        o.quaternion.setFromUnitVectors(up, axis);
        o.updateMatrix();
        wheels.current.setMatrixAt(i * 2 + side, o.matrix);
      }
    });
    wheels.current.instanceMatrix.needsUpdate = true;
    wheels.current.computeBoundingSphere();
  }, [spokes]);
  return (
    <group>
      <ChairUpholstery />
      <Rods segments={frame} color="#737f8c" />
      <mesh position={[x, 0.255, z]} castShadow>
        <cylinderGeometry args={[0.052, 0.066, 0.18, 24]} />
        <meshStandardMaterial
          color="#404b58"
          roughness={0.47}
          metalness={0.48}
        />
      </mesh>
      <mesh position={[x, 0.345, z]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.1, 24]} />
        <meshStandardMaterial
          color="#b7c2ce"
          roughness={0.24}
          metalness={0.86}
        />
      </mesh>
      <Box
        position={[x, 0.381, z]}
        size={[0.39, 0.07, 0.32]}
        color="#303a47"
        radius={0.026}
      />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          position={[x + side * 0.42, 0.79, z - 0.035]}
          size={[0.084, 0.065, 0.38]}
          color="#3e4a59"
          radius={0.03}
          roughness={0.92}
        />
      ))}
      <instancedMesh
        ref={wheels}
        args={[undefined, undefined, 10]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.057, 0.057, 0.026, 20]} />
        <meshStandardMaterial color="#26303b" roughness={0.83} />
      </instancedMesh>
      <Character {...studioCharacter} seated animate={animate} />
    </group>
  );
}
