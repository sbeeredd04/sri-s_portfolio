"use client";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const lodPattern = /_LOD(\d)$/;

// Picks the requested level of detail; assets without LOD nodes use all nodes.
function lodRoots(scene, lod) {
  const tagged = scene.children.filter((c) => lodPattern.test(c.name));
  if (!tagged.length) return [scene];
  const wanted = tagged.filter((c) => c.name.endsWith(`_LOD${lod}`));
  return wanted.length ? wanted : [tagged[0]];
}

function prepareMaterial(material, { envMapIntensity }) {
  const m = material.clone();
  m.envMapIntensity = envMapIntensity;
  if (m.alphaTest > 0 || m.transparent || /foliage|leaf|leaves|card|needle/i.test(m.name)) {
    // Foliage cards: cutout instead of blending keeps sorting and shadows exact.
    m.transparent = false;
    m.alphaTest = Math.max(m.alphaTest, 0.45);
    m.side = THREE.DoubleSide;
    m.shadowSide = THREE.DoubleSide;
  }
  return m;
}

// Places many copies of a GLB with one InstancedMesh per sub-mesh, so a whole
// grove or a row of lamps costs one draw call per material. Items are
// { position: [x,y,z], rotation?: yRadians, scale?: number | [x,y,z] }.
export default function ModelInstances({
  src,
  items,
  lod = 0,
  castShadow = true,
  receiveShadow = true,
  envMapIntensity = 1,
  tint,
}) {
  const { scene } = useGLTF(src);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const out = [];
    for (const root of lodRoots(scene, lod)) {
      // Meshes are placed relative to their LOD root: preview files may offset
      // LOD1 beside LOD0, but each level's pivot is the asset's ground contact.
      const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
      root.traverse((node) => {
        if (!node.isMesh) return;
        const local = new THREE.Matrix4().multiplyMatrices(
          rootInverse,
          node.matrixWorld,
        );
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];
        const prepared = materials.map((m) => {
          const p = prepareMaterial(m, { envMapIntensity });
          if (tint) p.color.multiply(new THREE.Color(tint));
          return p;
        });
        out.push({
          geometry: node.geometry,
          material: Array.isArray(node.material) ? prepared : prepared[0],
          local,
        });
      });
    }
    return out;
  }, [scene, lod, envMapIntensity, tint]);
  const meshes = useMemo(() => {
    const object = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    return parts.map((part) => {
      const mesh = new THREE.InstancedMesh(
        part.geometry,
        part.material,
        Math.max(1, items.length),
      );
      items.forEach((item, i) => {
        object.position.set(...item.position);
        object.rotation.set(0, item.rotation || 0, 0);
        const s = item.scale ?? 1;
        if (Array.isArray(s)) object.scale.set(...s);
        else object.scale.setScalar(s);
        object.updateMatrix();
        matrix.multiplyMatrices(object.matrix, part.local);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.count = items.length;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.computeBoundingBox();
      return mesh;
    });
  }, [parts, items, castShadow, receiveShadow]);
  useEffect(
    () => () => {
      meshes.forEach((m) => m.dispose());
      parts.forEach((p) =>
        [p.material].flat().forEach((material) => material.dispose()),
      );
    },
    [meshes, parts],
  );
  return (
    <group>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
}

// A single placed copy (furniture). Clones so materials can be tuned per use.
export function Model({ src, position, rotation = 0, scale = 1, envMapIntensity = 1, castShadow = true, receiveShadow = true, lod = 0, ...props }) {
  const items = useMemo(
    () => [{ position: position || [0, 0, 0], rotation, scale }],
    [position?.[0], position?.[1], position?.[2], rotation, scale],
  );
  return (
    <group {...props}>
      <ModelInstances
        src={src}
        items={items}
        lod={lod}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        envMapIntensity={envMapIntensity}
      />
    </group>
  );
}
