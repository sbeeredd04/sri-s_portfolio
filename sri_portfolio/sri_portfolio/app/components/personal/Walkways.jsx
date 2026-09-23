"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { walkwayPlacements } from "../../lib/world-paths.mjs";
import { useRoomTexture } from "./RoomMaterials";
import BayBridge from "./BayBridge";

function Instances({
  placements,
  geometry,
  color,
  emissive,
  intensity = 0,
  variation = 0,
  map,
}) {
  const mesh = useRef();
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(),
      tint = new THREE.Color();
    placements.forEach(({ position, right, up, forward, size }, i) => {
      matrix
        .makeBasis(right, up, forward)
        .scale(new THREE.Vector3(...size))
        .setPosition(position);
      mesh.current.setMatrixAt(i, matrix);
      if (variation) {
        const shade = 1 + Math.sin(i * 17.31) * variation;
        tint.setRGB(shade, shade, shade);
        mesh.current.setColorAt(i, tint);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [placements, color, variation]);
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, placements.length]}
      receiveShadow
      castShadow={!emissive}
    >
      <meshStandardMaterial
        color={color}
        map={map}
        bumpMap={map}
        bumpScale={map ? 0.006 : 0}
        roughness={0.86}
        emissive={emissive}
        emissiveIntensity={intensity}
      />
    </instancedMesh>
  );
}

export default function Walkways({ daylight }) {
  const stone = useRoomTexture("stone", 3);
  // Cut stone has square joints. A 12-triangle slab keeps the hundreds of
  // repeating pavers inexpensive; bevels belong on the close-up furnishings.
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const batches = useMemo(walkwayPlacements, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <BayBridge daylight={daylight} />
      <Instances
        placements={batches.tiles}
        geometry={geometry}
        color="#7c7569"
        variation={0.065}
        map={stone}
      />
      <Instances
        placements={batches.edge}
        geometry={geometry}
        color="#514e48"
      />
      <Instances
        placements={batches.footings}
        geometry={geometry}
        color="#565953"
      />
      <Instances
        placements={batches.posts}
        geometry={geometry}
        color="#394552"
      />
      <Instances
        placements={batches.lamps}
        geometry={geometry}
        color="#e9dac2"
        emissive="#ffd6a0"
        intensity={1.8 - daylight * 1.5}
      />
    </group>
  );
}
