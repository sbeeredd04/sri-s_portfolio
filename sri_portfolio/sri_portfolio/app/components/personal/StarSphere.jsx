"use client";
import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SKY_RADIUS } from "../../lib/camera-limits.mjs";

// A distant sky changes with viewing direction, never with camera translation.
// Keep it centered on the eye and draw before the world without writing depth.
// An origin-centered finite shell can be exited or clipped into a black disk.
export default function StarSphere({ daylight }) {
  const sky = useRef();
  const texture = useTexture("/background/stars-4k.webp");
  const uniforms = useMemo(
    () => ({ starMap: { value: texture }, brightness: { value: 0.08 } }),
    [texture],
  );
  uniforms.brightness.value = 0.13 - daylight * 0.065;
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh
      ref={sky}
      userData={{ sky: true }}
      renderOrder={-100}
      frustumCulled={false}
      raycast={() => null}
      onBeforeRender={(_, __, camera) => {
        // Called before the renderer calculates this mesh's model-view matrix,
        // including frames driven by controls, flights, and paused rendering.
        camera.getWorldPosition(sky.current.position);
        sky.current.updateMatrixWorld();
      }}
    >
      <sphereGeometry args={[SKY_RADIUS, 96, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
        toneMapped={false}
        vertexShader={`
          varying vec3 skyDirection;
          void main() {
            skyDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }
        `}
        fragmentShader={`
          uniform sampler2D starMap;
          uniform float brightness;
          varying vec3 skyDirection;
          void main() {
            vec3 d = normalize(skyDirection);
            vec3 axes = max(abs(d), vec3(.0001));
            vec3 weights = pow(axes, vec3(24.));
            weights /= weights.x + weights.y + weights.z;
            // This source is an ordinary 4K star photograph, not a 360-degree
            // panorama. Directional projection preserves its detail without
            // stretching the entire photograph around a sphere or its poles.
            vec3 x = texture2D(starMap, d.zy * .5 + .5).rgb;
            vec3 y = texture2D(starMap, d.xz * .5 + .5).rgb;
            vec3 z = texture2D(starMap, d.xy * .5 + .5).rgb;
            vec3 photograph = x * weights.x + y * weights.y + z * weights.z;
            // Keep the brightest stars, gently suppressing the photograph's
            // dense haze so it stays behind the world and readable type.
            float luminance = dot(photograph, vec3(.2126, .7152, .0722));
            float separation = mix(.12, 1., smoothstep(.015, .3, luminance));
            gl_FragColor = vec4(photograph * separation * brightness, 1.);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}
