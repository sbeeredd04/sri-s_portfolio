"use client";
import { useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { outThereFrame } from "../../lib/out-there-p11.mjs";
import { outThereModelSource } from "../../lib/out-there-p11-build.mjs";
import { outThereFallRole, prepareOutThereWater } from "../../lib/out-there-water.mjs";
import LakeMist from "./LakeMist";
import SoftHuman from "./SoftHuman";
import { outThereResidents } from "../../lib/out-there-residents.mjs";
import useLakeReflection from "./useLakeReflection";
import { outThereCamp, outThereLiveSource } from "../../lib/out-there-site.mjs";

function semanticName(node) {
  for (let owner = node; owner; owner = owner.parent)
    if (
      /^(redwood|pine|lookout|rock|waterfall|falls_|ocean|pool|tarn|plunge|creek|terrain|ground|hills|sky_card|sky_ridge|ferns|bushes|coast_|dock_boats|cable_|gondolas|lake_|outflow)/.test(
        owner.name,
      )
    )
      return owner.name;
  return node.name;
}

// The actual supplied island, including its individual nodes and 22 clips.
// Geometry is shared with GLTF cache; each visit owns its materials and mixer.
export default function AuthoredOutThere({
  animate = true,
  night = false,
  onJournalOpen,
  focus = null,
  embedded = false,
  wind = 4,
  reflectLake = false,
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const islandRoot = useRef();
  const water = useMemo(
    () => ({
      time: { value: 0 },
      wind: { value: 0.25 },
      inverse: { value: new THREE.Matrix4() },
    }),
    [],
  );
  const { scene, animations } = useGLTF(
    embedded ? outThereLiveSource : outThereModelSource,
  );
  const model = useMemo(() => {
    const copy = scene.clone(true);
    // These original animation anchors lost their support when the coast
    // and lower rocks were rebuilt. Keep the clips in the source asset.
    if (embedded) {
      for (const name of ["bird_perched_2", "bird_perched_4", "rabbit_4"]) {
        const actor = copy.getObjectByName(name);
        if (actor) actor.visible = false;
      }
    }
    copy.updateMatrixWorld(true);
    const materials = new Map();
    const trees = [];
    const ownedGeometry = [];
    const boats = ["lake_skiff_1", "lake_skiff_2"]
      .map((n) => copy.getObjectByName(n))
      .filter(Boolean)
      .map((n) => ({ node: n, y: n.position.y }));
    copy.traverse((node) => {
      if (!node.isMesh) return;
      const owner = semanticName(node);
      if (
        embedded &&
        /^(ferns|bushes|coast_shrubs|coast_flowers)$/.test(owner)
      ) {
        const source = node.geometry,
          coords = source.attributes.position,
          index = source.index;
        const keep = [],
          vertex = new THREE.Vector3(),
          count = index?.count ?? coords.count;
        const safe = (i) => {
          vertex
            .fromBufferAttribute(coords, i)
            .applyMatrix4(node.matrixWorld)
            .divideScalar(1.56);
          return (
            (vertex.x - outThereCamp.x) ** 2 +
              (vertex.z - outThereCamp.z) ** 2 >
            5.1 ** 2
          );
        };
        for (let i = 0; i < count; i += 3) {
          const a = index ? index.getX(i) : i,
            b = index ? index.getX(i + 1) : i + 1,
            c = index ? index.getX(i + 2) : i + 2;
          if (safe(a) && safe(b) && safe(c)) keep.push(a, b, c);
        }
        node.geometry = source.clone();
        node.geometry.setIndex(keep);
        ownedGeometry.push(node.geometry);
      }
      // The portfolio supplies one shared sea and its own world connections.
      // Source render-floor and kilometre-wide ocean must never cover it.
      if (
        /^(ground|plunge_pool|lake_ripples|falls_mist)$/.test(owner) ||
        (embedded &&
          /^(ocean|hills|sky_card|sky_ridge|cable_line|cable_towers|gondolas)$/.test(
            owner,
          ))
      )
        node.visible = false;
      node.userData.p11Node = owner;
      node.castShadow =
        !/ocean|pool|tarn|mist|falls|waterfall|ripples|foam|glass/.test(owner);
      node.receiveShadow = !/mist|waterfall|foam/.test(owner);
      const prepare = (original) => {
        // The refined sheet, feeder and horizontal foam share PT_Falls in
        // the export, but require different flow and opacity at runtime.
        const role = embedded && original.name === "PT_Falls" ? outThereFallRole[owner] : null;
        const key = role || original;
        if (materials.has(key)) return materials.get(key);
        const m = original.clone();
        m.envMapIntensity = 0.35;
        if (m.name === "PT_Flat") {
          m.roughness = 0.95;
          m.metalness = 0;
          m.flatShading = true;
        }
        if (/PT_(Water|LakeWater)/.test(m.name) && "transmission" in m)
          m.transmission = 0;
        if (role) {
          m.name = `PT_Falls_${role}`;
          m.depthWrite = role === "feeder";
          m.transparent = role !== "feeder";
          m.roughness = role === "sheet" ? 0.42 : 0.51;
          m.emissive.set("#86a39d");
          prepareOutThereWater(m, role, water);
        } else if (/PT_(Water|LakeWater|Falls|Mist)/.test(m.name))
          prepareOutThereWater(
            m,
            /Falls|Mist/.test(m.name)
              ? "falls"
              : m.name === "PT_LakeWater"
                ? "lake"
                : "water",
            water,
          );
        if (m.name === "PT_Water") m.roughness = 0.24;
        if (m.name === "PT_Glass") {
          m.transmission = 0;
          m.transparent = true;
          m.opacity = 0.38;
          m.depthWrite = false;
          m.roughness = 0.12;
        }
        if (m.name === "PT_LakeWater") {
          m.transparent = false;
          m.opacity = 1;
          m.depthWrite = true;
          m.roughness = 0.14;
          m.envMapIntensity = 1.45;
        }
        materials.set(key, m);
        return m;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(prepare)
        : prepare(node.material);
      if (/^(redwood|pine)/.test(owner)) {
        // Each occluding tree needs its own opacity; the rest of the island
        // continues sharing the original palette material.
        node.material = node.material.clone();
        node.material.transparent = true;
        trees.push(node);
      }
    });
    return {
      scene: copy,
      trees,
      boats,
      ownedGeometry,
      materials: [...materials.values(), ...trees.map((t) => t.material)],
    };
  }, [scene, water, embedded]);
  useLakeReflection(model, islandRoot, reflectLake, night);
  useLayoutEffect(() => {
    islandRoot.current?.updateWorldMatrix(true, false);
    if (islandRoot.current)
      water.inverse.value.copy(islandRoot.current.matrixWorld).invert();
  }, [water, model]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model.scene), [model]);
  const time = useRef(0);
  const sightline = useMemo(
    () => ({
      ray: new THREE.Raycaster(),
      target: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      center: new THREE.Vector3(),
      lastEye: new THREE.Vector3(Infinity, 0, 0),
      lastCenter: new THREE.Vector3(Infinity, 0, 0),
      box: new THREE.Box3(),
      occluding: new Set(),
    }),
    [],
  );
  useEffect(() => {
    animations.forEach((clip) => mixer.clipAction(clip).play());
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model.scene);
    };
  }, [animations, mixer, model]);
  useEffect(() => {
    for (const m of model.materials) {
      if (m.name === "PT_Glow") {
        m.emissive.set("#f2b866");
        m.emissiveIntensity = night ? 1.8 : 0.6;
      }
      if (m.name.startsWith("PT_Falls_"))
        m.emissiveIntensity = night ? 0.34 : 0.62;
      else if (m.name === "PT_Falls" || m.name === "PT_Mist")
        m.emissiveIntensity = night ? 0.25 : 1;
    }
  }, [model, night]);
  useEffect(
    () => () => {
      model.materials.forEach((m) => m.dispose());
      model.ownedGeometry.forEach((g) => g.dispose());
    },
    [model],
  );
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    water.wind.value = THREE.MathUtils.clamp(wind / 15, 0, 1);
    if (animate) {
      time.current += step;
      water.time.value += step;
      mixer.update(step);
      for (let i = 0; i < model.boats.length; i++) {
        const { node, y } = model.boats[i],
          phase = water.time.value * (1.13 + i * 0.21) + i * 1.9;
        node.position.y =
          y + Math.sin(phase) * (0.016 + 0.018 * water.wind.value) * 1.56;
        node.rotation.x = Math.sin(phase * 0.88) * 0.014;
        node.rotation.z = Math.cos(phase) * 0.023;
      }
    }
    const occluding = sightline.occluding;
    if (focus) {
      const parent = islandRoot.current?.parent;
      sightline.center.set(...focus);
      parent?.localToWorld(sightline.center);
      if (
        sightline.lastEye.distanceToSquared(camera.position) > 0.0025 ||
        sightline.lastCenter.distanceToSquared(sightline.center) > 0.0025
      ) {
        sightline.lastEye.copy(camera.position);
        sightline.lastCenter.copy(sightline.center);
        occluding.clear();
        // Protect the subject's footprint, not just one pixel at its centre.
        for (const [x, y] of [
          [0, 0],
          [-3.4, 0],
          [3.4, 0],
          [0, 2.2],
          [0, -1.2],
        ]) {
          sightline.target.set(focus[0] + x, focus[1] + y, focus[2]);
          parent?.localToWorld(sightline.target);
          sightline.direction.copy(sightline.target).sub(camera.position);
          sightline.ray.far = Math.max(0, sightline.direction.length() - 1);
          sightline.ray.set(camera.position, sightline.direction.normalize());
          for (const hit of sightline.ray.intersectObjects(model.trees, false))
            occluding.add(hit.object);
        }
        for (const tree of model.trees) {
          if (!tree.geometry.boundingBox) tree.geometry.computeBoundingBox();
          sightline.box
            .copy(tree.geometry.boundingBox)
            .applyMatrix4(tree.matrixWorld);
          if (sightline.box.distanceToPoint(camera.position) < 1.15)
            occluding.add(tree);
        }
      }
    } else {
      occluding.clear();
      sightline.lastCenter.set(Infinity, 0, 0);
    }
    for (const tree of model.trees) {
      const opacity = occluding.has(tree) ? 0 : 1;
      tree.material.opacity = THREE.MathUtils.damp(
        tree.material.opacity,
        opacity,
        12,
        step,
      );
      tree.material.depthWrite = tree.material.opacity > 0.98;
      tree.castShadow = tree.material.opacity > 0.5;
      if (Math.abs(tree.material.opacity - opacity) > 0.005) invalidate();
    }
  });
  return (
    <>
      <group
        ref={islandRoot}
        scale={1 / outThereFrame.unitsPerMetre}
        position={[0, -outThereFrame.seaLevel / outThereFrame.unitsPerMetre, 0]}
      >
        {night && !embedded && (
          <pointLight
            position={[3, 32, 0]}
            color="#f2b866"
            intensity={9}
            distance={14}
            decay={2}
          />
        )}
        <primitive
          object={model.scene}
          onClick={(event) => {
            if (
              /lookout|dock_boats/.test(
                event.object.userData.p11Node || event.object.name,
              )
            ) {
              event.stopPropagation();
              onJournalOpen?.();
            }
          }}
        />
        {focus && <LakeMist water={water} night={night} refined={embedded} />}
      </group>
      {embedded &&
        outThereResidents.map((resident, index) => (
          <group
            key={index}
            position={resident.position}
            rotation={[0, resident.rotation, 0]}
          >
            <SoftHuman
              animate={animate}
              variation={resident.variation}
              phase={index * 0.73}
            />
          </group>
        ))}
    </>
  );
}
