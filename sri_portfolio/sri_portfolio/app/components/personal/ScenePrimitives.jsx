import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { roundedBox, mergedBoxes } from "../../lib/model-geometry.mjs";
import * as THREE from "three";
export function Box({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = "#fff",
  radius = 0.06,
  roughness = 0.65,
  metalness = 0,
  map,
  bumpMap,
  bumpScale = 0.01,
  rotation = [0, 0, 0],
  ...props
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () => roundedBox([width, height, depth], radius),
    [width, height, depth, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      {...props}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        map={map}
        bumpMap={bumpMap}
        bumpScale={bumpScale}
      />
    </mesh>
  );
}
// Static pieces with one material keep their original bevels, UVs and normals
// while sharing a draw call. Items should be a stable authored array.
export function Boxes({
  items,
  color = "#fff",
  map,
  roughness = 0.65,
  metalness = 0,
}) {
  const geometry = useMemo(() => mergedBoxes(items), [items]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...{ color, map, roughness, metalness }} />
    </mesh>
  );
}
export function Ball({
  position = [0, 0, 0],
  size = 0.3,
  color = "#fff",
  scale = [1, 1, 1],
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[size, 20, 16]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}
export function Rod({ from, to, radius = 0.04, color = "#ddd" }) {
  const direction = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
  const midpoint = new THREE.Vector3(...from)
    .add(new THREE.Vector3(...to))
    .multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, direction.length(), 10]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
// Repeated thin geometry shares one draw call and one material.
export function Rods({ segments, color = "#ddd" }) {
  const mesh = useRef();
  useLayoutEffect(() => {
    const transform = new THREE.Object3D(),
      direction = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    segments.forEach(({ from, to, radius = 0.04 }, i) => {
      direction.set(...to).sub(new THREE.Vector3(...from));
      transform.position
        .set(...from)
        .add(new THREE.Vector3(...to))
        .multiplyScalar(0.5);
      transform.quaternion.setFromUnitVectors(
        up,
        direction.clone().normalize(),
      );
      transform.scale.set(radius, direction.length(), radius);
      transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [segments]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, segments.length]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
}
