"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { skyFragment, skyUniforms } from "./AtmosphereSky";

// Image-based lighting from the live sky: a small probe scene renders the same
// scattering sky (with a soft dark ground below the horizon) into a PMREM, so
// metal, glass, water and every rough surface pick up the true time of day.
// It refreshes only when the sky has visibly changed, never every frame.
export default function MaterialLighting({ daylight, world }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const probe = useMemo(() => {
    const probeScene = new THREE.Scene();
    const material = new THREE.ShaderMaterial({
      uniforms: { ...skyUniforms, uOpacity: { value: 1 } },
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: skyFragment,
    });
    probeScene.add(
      new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), material),
    );
    return {
      scene: probeScene,
      material,
      generator: new THREE.PMREMGenerator(gl),
    };
  }, [gl]);
  const current = useRef(null);
  const last = useRef({ key: "", at: -Infinity });
  const pending = useRef({ key: "", since: 0 });
  useEffect(() => {
    const previous = scene.environment;
    return () => {
      scene.environment = previous;
      current.current?.dispose();
      probe.generator.dispose();
      probe.material.dispose();
      probe.scene.children[0].geometry.dispose();
    };
  }, [scene, probe]);
  useFrame(({ clock }) => {
    const u = skyUniforms;
    // Reflections follow the biome and meaningful light/weather changes, not
    // the moving camera. Wait for the sky to settle before generating once.
    const key = [
      world,
      Math.round(daylight * 8),
      Math.round(u.uCloud.value * 4),
      Math.round(u.uRain.value * 4),
    ].join();
    const now = clock.elapsedTime;
    if (key !== pending.current.key) pending.current = { key, since: now };
    // The first probe gates the entire scene. Only later weather/biome changes
    // need the long debounce; let the initial sky settle for two frames.
    if (
      key === last.current.key ||
      now - pending.current.since < (current.current ? 1.2 : 0.05)
    )
      return;
    if (current.current && now - last.current.at < 5) return;
    last.current = { key, at: now };
    const target = probe.generator.fromScene(probe.scene, 0, 0.1, 50, {
      size: 128,
    });
    current.current?.dispose();
    current.current = target;
    scene.environment = target.texture;
    invalidate();
  });
  useEffect(() => {
    scene.environmentIntensity = 0.45 + daylight * 0.55;
    invalidate();
  }, [scene, daylight, invalidate]);
  return null;
}
