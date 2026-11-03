"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { drawExhibit } from "../../lib/exhibit-art.mjs";
import { exhibitCanvas } from "../../lib/project-exhibits.mjs";
import GraphicsHealth from "./GraphicsHealth";
import {
  aetherSite,
  aetherPoint,
  aetherViews,
  aetherView,
  madeStage,
} from "../../lib/made-stage.mjs";
const ease = (t) => t * t * (3 - 2 * t);
function Journey({ inside, reduced, hover, door, onBusy }) {
  const { camera, size, invalidate } = useThree(),
    controls = useRef(),
    journey = useRef(null),
    current = useRef("outside");
  const sample = useRef({
    eye: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });
  useEffect(() => {
    const sequence = inside
      ? [
          ["entry", 1.6, 0],
          ["entry", 1.1, 1],
          ["inside", 1.2, 1],
        ]
      : [
          ["entry", 1.2, 1],
          ["entry", 0.8, 0],
          ["outside", 1.6, 0],
        ];
    if (!inside && current.current === "outside" && !journey.current) {
      const v = aetherView("outside", size.width < 700);
      camera.position.set(...v.position);
      controls.current?.target.set(...v.target);
      camera.lookAt(...v.target);
      invalidate();
      return;
    }
    if (reduced) {
      const v = aetherView(inside ? "inside" : "outside", size.width < 700);
      camera.position.set(...v.position);
      controls.current?.target.set(...v.target);
      camera.lookAt(...v.target);
      door.current = inside ? 1 : 0;
      current.current = inside ? "inside" : "outside";
      journey.current = null;
      onBusy(false);
      invalidate();
      return;
    }
    journey.current = {
      sequence,
      index: 0,
      elapsed: 0,
      eye: camera.position.clone(),
      target: controls.current.target.clone(),
      door: door.current,
    };
    onBusy(true);
    invalidate();
  }, [inside, reduced, camera, door, onBusy, invalidate]);
  useEffect(() => invalidate(), [hover, inside, invalidate]);
  useEffect(() => {
    camera.fov = aetherView(
      inside ? "inside" : "outside",
      size.width < 700,
    ).fov;
    camera.updateProjectionMatrix();
    if (!inside && !journey.current) {
      const v = aetherView("outside", size.width < 700),
        target = new THREE.Vector3(...v.target);
      camera.position.set(...v.position);
      controls.current?.target.copy(target);
      camera.lookAt(target);
    }
    invalidate();
  }, [camera, size.width, inside, invalidate]);
  useFrame((_, dt) => {
    const j = journey.current;
    if (!j) {
      if (!inside)
        door.current = THREE.MathUtils.damp(
          door.current,
          hover ? 0.08 : 0,
          12,
          Math.min(dt, 0.05),
        );
      if (!inside && Math.abs(door.current - (hover ? 0.08 : 0)) > 0.001)
        invalidate();
      return;
    }
    const [name, seconds, opening] = j.sequence[j.index],
      v = aetherView(name, size.width < 700);
    j.elapsed += Math.min(dt, 0.05);
    const t = Math.min(1, j.elapsed / seconds),
      k = ease(t);
    sample.current.eye.set(...v.position);
    sample.current.target.set(...v.target);
    camera.position.lerpVectors(j.eye, sample.current.eye, k);
    controls.current.target.lerpVectors(j.target, sample.current.target, k);
    camera.lookAt(controls.current.target);
    door.current = THREE.MathUtils.lerp(j.door, opening, k);
    invalidate();
    if (t === 1) {
      j.index++;
      j.elapsed = 0;
      j.eye.copy(camera.position);
      j.target.copy(controls.current.target);
      j.door = door.current;
      if (j.index === j.sequence.length) {
        journey.current = null;
        current.current = inside ? "inside" : "outside";
        onBusy(false);
      }
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!journey.current}
      enablePan={false}
      minDistance={inside ? 2.5 : 10}
      maxDistance={inside ? 8 : 75}
      minPolarAngle={inside ? 1.3 : 0}
      maxPolarAngle={inside ? 1.65 : 1.54}
      minAzimuthAngle={inside ? aetherSite.yaw - 0.45 : -Infinity}
      maxAzimuthAngle={inside ? aetherSite.yaw + 0.35 : Infinity}
    />
  );
}
export function AetherShowroom({
  door,
  onEnter,
  onReady,
  value,
  onValue,
  fill = true,
  showExhibit = true,
}) {
  const invalidate = useThree((s) => s.invalidate);
  const { scene, animations } = useGLTF(
    "/models/islands/made-aether.glb?v=247f39c22c8ab7cb",
  );
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = exhibitCanvas.width;
    canvas.height = exhibitCanvas.height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    return texture;
  }, []);
  useEffect(() => {
    drawExhibit(
      screen.image.getContext("2d"),
      "aether",
      value,
      getComputedStyle(document.body).fontFamily,
    );
    screen.needsUpdate = true;
    invalidate();
  }, [screen, value, invalidate]);
  useEffect(() => () => screen.dispose(), [screen]);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    const materials = new Map();
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = !/glass|glow|display/i.test(node.name);
      node.receiveShadow = true;
      const prepare = (m) => {
        if (materials.has(m)) return materials.get(m);
        const c = m.clone();
        c.envMapIntensity = 0.3;
        if (/glass/i.test(c.name)) {
          c.transmission = 0;
          c.transparent = true;
          c.opacity = 0.25;
          c.depthWrite = false;
          c.roughness = 0.1;
        }
        materials.set(m, c);
        return c;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(prepare)
        : prepare(node.material);
    });
    const display = copy.getObjectByName("Aether_DisplayScreen");
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: screen,
      toneMapped: false,
    });
    if (display?.isMesh) display.material = screenMaterial;
    return { scene: copy, materials: [...materials.values(), screenMaterial] };
  }, [scene, screen]);
  const animation = useMemo(() => {
    const mixer = new THREE.AnimationMixer(model.scene);
    const clip = animations.find((c) => c.name === "OpenFacade");
    if (!clip) throw Error("Aether facade animation is missing");
    return { mixer, clip };
  }, [model, animations]);
  const activeAction = useRef(null);
  useEffect(() => {
    const action = animation.mixer.clipAction(animation.clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    action.paused = true;
    activeAction.current = action;
    onReady?.();
    return () => {
      animation.mixer.stopAllAction();
      animation.mixer.uncacheRoot(model.scene);
      activeAction.current = null;
      model.materials.forEach((m) => m.dispose());
    };
  }, [model, animation, onReady]);
  useFrame(() => {
    if (!activeAction.current) return;
    activeAction.current.time = door.current * animation.clip.duration;
    animation.mixer.update(0);
  });
  return (
    <group position={aetherSite.center} rotation={[0, aetherSite.yaw, 0]}>
      {fill && (
        <pointLight
          position={[0, 3.65, -1]}
          color="#ffe1b2"
          intensity={16}
          distance={12}
          decay={2}
        />
      )}
      <primitive
        object={model.scene}
        onClick={(e) => {
          if (/facade|door|panel/i.test(e.object.name)) {
            e.stopPropagation();
            onEnter();
          }
        }}
      />
      {showExhibit && <BranchingThought value={value} onValue={onValue} />}
    </group>
  );
}
function BranchingThought({ value, onValue }) {
  // One root, three first branches, nine second branches: the existing
  // Aether narrative made spatial, driven by the same accessible choices.
  const nodes = useMemo(() => {
    const all = [{ p: [0, 0.15, 0], id: "question" }];
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const parent = all.length;
      all.push({
        p: [Math.cos(a) * 0.28, 0.57, Math.sin(a) * 0.28],
        id: "explore",
        parent: 0,
      });
      for (let j = 0; j < 3; j++) {
        const b = a + (j - 1) * 0.6;
        all.push({
          p: [Math.cos(b) * 0.5, 1.05, Math.sin(b) * 0.5],
          id: "belong",
          parent,
        });
      }
    }
    return all;
  }, []);
  return (
    <group position={[2, 0.93, -2]} rotation={[0, Math.PI / 6, 0]}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.024, 12]} />
        <meshStandardMaterial color="#aba99f" metalness={0.6} roughness={0.4} />
      </mesh>
      <BranchRod a={[0, 0.012, 0]} b={nodes[0].p} />
      {nodes.map((node, i) => (
        <group key={i}>
          <mesh
            position={node.p}
            onClick={(e) => {
              e.stopPropagation();
              onValue(node.id);
            }}
          >
            <sphereGeometry args={[i === 0 ? 0.1 : 0.065, 12, 8]} />
            <meshStandardMaterial
              color={value === node.id ? "#d99b42" : "#bcac7a"}
              emissive={value === node.id ? "#a96c21" : "#342c18"}
              emissiveIntensity={value === node.id ? 0.4 : 0.05}
              roughness={0.3}
              metalness={0.12}
            />
          </mesh>
          {i > 0 && <BranchRod a={nodes[node.parent].p} b={node.p} />}
        </group>
      ))}
    </group>
  );
}
function BranchRod({ a, b }) {
  const pose = useMemo(() => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      d = end.clone().sub(start);
    return {
      position: start.add(end).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.clone().normalize(),
      ),
      length: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pose.position} quaternion={pose.quaternion}>
      <cylinderGeometry args={[0.007, 0.007, pose.length, 6]} />
      <meshStandardMaterial color="#aba99f" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}
function Site() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    madeStage.outline.forEach(([x, z], i) =>
      i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
    );
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: madeStage.level,
      bevelEnabled: false,
      steps: 1,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#c6b496" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial
          color="#70a7aa"
          roughness={0.3}
          metalness={0.06}
        />
      </mesh>
    </>
  );
}
export default function MadeVisitCanvas(props) {
  const door = useRef(0);
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: aetherViews.outside.position,
        near: 0.1,
        far: 1500,
        fov: 45,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <GraphicsHealth onUnavailable={props.onUnavailable} />
      <color attach="background" args={["#d7c8ad"]} />
      <fog attach="fog" args={["#d7c8ad", 120, 600]} />
      <hemisphereLight args={["#ffe2c4", "#6b5a3e", 0.9]} />
      <ambientLight color="#c5ad91" intensity={0.25} />
      <directionalLight
        position={[-70, 100, 60]}
        color="#ffd6a0"
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-far={400}
        shadow-normalBias={0.03}
      />
      <directionalLight
        position={[70, 50, -80]}
        color="#9fb8c8"
        intensity={0.35}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer
          form="rect"
          position={[0, 20, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[80, 80, 1]}
          color="#ffe2c4"
          intensity={1}
        />
      </Environment>
      <Site />
      <Suspense fallback={null}>
        <AetherShowroom {...props} door={door} />
      </Suspense>
      <Journey {...props} door={door} />
    </Canvas>
  );
}
