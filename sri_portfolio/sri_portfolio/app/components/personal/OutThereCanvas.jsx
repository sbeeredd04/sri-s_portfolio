"use client";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import AuthoredOutThere from "./AuthoredOutThere";
import { outThereViews } from "../../lib/out-there-p11.mjs";
import GraphicsHealth from "./GraphicsHealth";
import IslandAnimationDriver from "./IslandAnimationDriver";

function View({ view }) {
  const { camera, size, scene, invalidate } = useThree();
  const controls = useRef();
  useEffect(() => {
    const shot = outThereViews[view];
    const portrait = size.width < size.height;
    const target = new THREE.Vector3(...shot.target);
    const eye = new THREE.Vector3(...shot.position);
    // Match the vertical shot while backing up just enough for narrow width.
    // The lookout is an interior view: moving its eye outside breaks the shot.
    if (portrait && view !== "lookout")
      eye
        .sub(target)
        .multiplyScalar(view === "island" ? 2.3 : view === "lake" ? 1.6 : 1.25)
        .add(target);
    camera.position.copy(eye);
    camera.fov = portrait ? Math.max(48, shot.fov) : shot.fov;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    // Portrait overview backs away farther. Keep the subject clear instead
    // of fogging the island merely because its camera is farther from it.
    if (scene.fog) {
      scene.fog.near = Math.max(80, eye.distanceTo(target) * 0.95);
      scene.fog.far = scene.fog.near + 600;
    }
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.update();
    }
    invalidate();
  }, [view, camera, size.width, size.height, scene, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={700}
      maxPolarAngle={Math.PI * 0.58}
    />
  );
}
export default function OutThereCanvas({
  view,
  animate,
  daylight,
  onJournalOpen,
  onReady,
  onUnavailable,
}) {
  const night = daylight < 0.3;
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: outThereViews.island.position,
        near: 0.1,
        far: 1800,
        fov: 32.3,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <GraphicsHealth onUnavailable={onUnavailable} />
      <IslandAnimationDriver active={animate} />
      <color attach="background" args={[night ? "#243147" : "#cfbfa6"]} />
      <fog attach="fog" args={[night ? "#243147" : "#cfbfa6", 180, 800]} />
      <hemisphereLight
        args={[night ? "#acbdd8" : "#ffe2c4", "#6b5a3e", night ? 0.35 : 0.9]}
      />
      <ambientLight
        color={night ? "#8799b6" : "#c5ad91"}
        intensity={night ? 0.12 : 0.25}
      />
      <directionalLight
        position={[-120, 110, 80]}
        color={night ? "#aec6ef" : "#ffd6a0"}
        intensity={night ? 0.35 : 3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-115}
        shadow-camera-right={115}
        shadow-camera-top={115}
        shadow-camera-bottom={-115}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-bias={-0.0002}
        shadow-normalBias={0.05}
      />
      <directionalLight
        position={[80, 60, -90]}
        color="#9fb8c8"
        intensity={night ? 0.12 : 0.35}
      />
      <Environment key={night ? "night" : "day"} resolution={64} frames={1}>
        <Lightformer
          form="rect"
          position={[0, 20, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[80, 80, 1]}
          color={night ? "#899bb8" : "#ffe2c4"}
          intensity={night ? 0.15 : 1}
        />
        <Lightformer
          form="rect"
          position={[-20, 5, 10]}
          scale={[25, 10, 1]}
          color={night ? "#adc7e6" : "#ffd6a0"}
          intensity={night ? 0.15 : 1}
        />
      </Environment>
      <Suspense fallback={null}>
        <AuthoredOutThere
          {...{ animate, night, onJournalOpen }}
          focus={view === "island" ? null : outThereViews[view].target}
          reflectLake={view==="lake"||view==="waterfall"}
        />
        <Ready onReady={onReady} />
      </Suspense>
      <View view={view} />
    </Canvas>
  );
}
function Ready({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}
