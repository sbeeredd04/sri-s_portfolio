"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { regions, worldPoint } from "../../lib/world-layout.mjs";

// The same SF sun is expressed in each district's tangent sky. It is not a
// claim that this small invented planet has terrestrial geographical timezones.
export default function SolarSky({ world, solar }) {
  const position = useMemo(() => {
    const direction = new THREE.Vector3(...solar.direction);
    if (world === "planet") return direction.multiplyScalar(500);
    const region = regions.find((r) => r.id === world);
    return direction
      .applyQuaternion(region.rotation)
      .multiplyScalar(440)
      .add(worldPoint(world, [0, 0, 0]));
  }, [world, ...solar.direction]);
  const color = new THREE.Color("#fff6db").lerp(
    new THREE.Color("#ffc28b"),
    solar.warmth,
  );
  return (
    <group
      position={position}
      visible={solar.daylight > 0.05}
      userData={{ sky: true }}
    >
      <mesh>
        <sphereGeometry args={[3.2, 32, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={[34, 34, 1]}>
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            tint: { value: color },
            opacity: { value: solar.daylight * 0.28 },
          }}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);p.xy+=position.xy*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));gl_Position=projectionMatrix*p;}`}
          fragmentShader={`varying vec2 vUv; uniform vec3 tint; uniform float opacity; void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(tint,pow(max(0.,1.-d),3.)*opacity);}`}
        />
      </sprite>
    </group>
  );
}
