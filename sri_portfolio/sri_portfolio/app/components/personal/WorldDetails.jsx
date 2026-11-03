"use client";
import { starVisibility } from "../../lib/atmosphere.mjs";
import { starField } from "../../lib/night-stars.mjs";
import { regions } from "../../lib/world-layout.mjs";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// One directional star field for every quality tier. Its distant, eye-centred
// shell is depth-tested against the world, so stars cannot shine through land.
export function Stars({ world, daylight, weather }) {
  const dome = useRef();
  const geometry = useMemo(() => {
    const field = starField();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(field.positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(field.colors, 3));
    g.setAttribute("diameter", new THREE.Float32BufferAttribute(field.diameters, 1));
    return g;
  }, []);
  const uniforms = useMemo(() => ({
    visibility: { value: 0 },
    pixelRatio: { value: 1 },
    overview: { value: 0 },
    skyUp: { value: new THREE.Vector3(0, 1, 0) },
  }), []);
  uniforms.visibility.value = starVisibility(daylight, weather);
  uniforms.overview.value = world === "planet" ? 1 : 0;
  useFrame(({ camera, gl }) => {
    dome.current?.position.copy(camera.position);
    uniforms.pixelRatio.value = gl.getPixelRatio();
    const region = regions.find(r => r.id === world);
    if (region) uniforms.skyUp.value.copy(region.normal);
    else uniforms.skyUp.value.copy(camera.position).normalize();
  });
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points ref={dome} geometry={geometry} renderOrder={-10}
      frustumCulled={false} userData={{ sky: true }} raycast={() => null}>
      <shaderMaterial uniforms={uniforms} vertexColors transparent
        depthWrite={false} depthTest toneMapped={false}
        vertexShader={`
          attribute float diameter;
          uniform float pixelRatio, overview;
          uniform vec3 skyUp;
          varying vec3 starColor;
          varying float heightFade;
          void main() {
            starColor = color;
            vec3 direction = normalize(position);
            float viewHeight = (viewMatrix * vec4(direction, 0.)).y;
            float horizon = mix(dot(direction, skyUp), -.11 + viewHeight * 1.65, overview);
            heightFade = mix(.55, 1., smoothstep(-.08, .28, horizon));
            gl_PointSize = diameter * pixelRatio;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }
        `}
        fragmentShader={`
          uniform float visibility;
          varying vec3 starColor;
          varying float heightFade;
          void main() {
            float radius = length(gl_PointCoord - .5) * 2.;
            float core = 1. - smoothstep(.12, .72, radius);
            float halo = exp(-radius * radius * 5.) * .24;
            float alpha = (core * .82 + halo) * visibility * heightFade;
            if (alpha < .004) discard;
            gl_FragColor = vec4(starColor, alpha);
            #include <colorspace_fragment>
          }
        `}
      />
    </points>
  );
}
