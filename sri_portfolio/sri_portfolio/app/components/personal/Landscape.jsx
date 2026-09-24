"use client";
import {
  overlookSegments,
  renderedTrail,
  trailCenter,
  trailTrees,
} from "../../lib/trail-layout.mjs";
import { discover } from "../../lib/discoveries.mjs";
import { courtTrees } from "../../lib/court-layout.mjs";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import GraniteValley from "./GraniteValley";
import ModelInstances from "./ModelInstances";
import ValleyCourse from "./ValleyCourse";
import { inGraniteFootprint } from "../../lib/valley-layout.mjs";
import { localTrailPaving } from "../../lib/trail-surface.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";
export const groundHeight = (x, z) => renderedSurfaceHeight("trail", x, z);
function addStrip(positions, indices, points, halfAt) {
  const start = positions.length / 3;
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next[0] - previous[0],
      dz = next[1] - previous[1];
    const length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length,
      nz = dx / length;
    const half = halfAt(index);
    for (const sign of [-1, 1]) {
      const x = point[0] + nx * sign * half;
      const z = point[1] + nz * sign * half;
      positions.push(x, localTrailPaving(x, z), z);
    }
  });
  for (let index = 0; index < points.length - 1; index++) {
    const a = start + index * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
}
function makePath() {
  const positions = [],
    indices = [];
  const main = [];
  for (
    let z = renderedTrail.start;
    z >= renderedTrail.end - 1e-4;
    z -= renderedTrail.step
  )
    main.push([trailCenter(z), z]);
  addStrip(positions, indices, main, () => renderedTrail.half);
  const spur = overlookSegments();
  addStrip(
    positions,
    indices,
    [spur[0][0], ...spur.map((segment) => segment[1])],
    (index) => (index === 0 ? spur[0][2] : spur[index - 1][2]) / 2,
  );
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Two instanced meshes for the entire grove. Rounded branch clusters break up
// the silhouette without hundreds of independent materials and draw calls.
export function Grove(props) {
  return (
    <Suspense fallback={null}>
      <TexturedGrove {...props} />
    </Suspense>
  );
}
function TexturedGrove({
  park = false,
  biome = park ? "court" : "trail",
  detailed = true,
}) {
  const trees = useMemo(
    () =>
      biome === "trail"
        ? trailTrees
        : biome === "court"
          ? courtTrees
          : Array.from(
              {
                length:
                  biome === "studio"
                    ? 18
                    : biome === "entertainment"
                      ? 16
                      : park
                        ? 22
                        : 42,
              },
              (_, i) => {
                const angle = i * 2.39996,
                  radius =
                    biome === "studio"
                      ? 13 + (i % 5)
                      : park
                        ? 7 + (i % 9) * 0.7
                        : 12 + (i % 10) * 0.8;
                const x = Math.sin(angle) * radius;
                let z = Math.cos(angle) * radius - 5;
                // Preserve the continuous approach from orbit through the front garden.
                if (biome === "studio" && z > -7 && Math.abs(x) < 12)
                  z = -12 - (i % 5);
                // Keep the arrival lawn open; the grove frames the game from behind.
                if (biome === "court" && z > -6) z = -Math.abs(z) - 9;
                if (biome === "trail" && z > 1 && x > -12 && x < 12)
                  z = -z - 10;
                if (biome === "entertainment") z = -18 - (i % 4) * 1.1;
                const inLake = !park && x < -3 && x > -15 && z > -12 && z < 5;
                const onPath = Math.abs(x - Math.sin(z * 0.14) * 2.2) < 1.8;
                return {
                  x: inLake ? -15.5 : onPath ? (x < 0 ? -2.8 : 2.8) : x,
                  z,
                  s: (biome === "trail" ? 0.95 : 1.1) + (i % 7) * 0.12,
                };
              },
            ).filter(
              (tree) =>
                biome !== "trail" || !inGraniteFootprint(tree.x, tree.z, 1),
            ),
    [park, biome],
  );
  // Scanned CC0 fir (Poly Haven), scaled so each crown stays inside the
  // clearance envelope the path/court footprint tests reserve for trees.
  const items = useMemo(
    () =>
      trees.map((t, i) => ({
        position: [t.x, renderedSurfaceHeight(biome, t.x, t.z) - 0.05, t.z],
        rotation: i * 2.1,
        scale:
          (biome === "trail" ? 0.85 : 0.36) * t.s * (0.9 + (i % 4) * 0.05),
      })),
    [trees, biome],
  );
  return (
    <ModelInstances
      src={
        biome === "studio"
          ? "/models/tree-small-broadleaf.glb"
          : biome === "trail"
            ? "/models/tree-pine-dense.glb"
            : "/models/tree-fir.glb"
      }
      items={
        biome === "studio"
          ? items.map((item) => ({ ...item, scale: item.scale * 2 }))
          : items
      }
      lod={detailed ? 0 : 1}
      envMapIntensity={0.7}
    />
  );
}
export function Lake({
  animate,
  position = [-8, -0.02, -3],
  radius = 6,
  onCue,
}) {
  const time = useRef(0);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRipple: { value: new THREE.Vector3(0, 0, -100) },
    }),
    [],
  );
  const material = useMemo(() => {
    // Still mountain water: a near-mirror surface whose colour comes from the
    // sky reflection at grazing angles and from its depth when seen from above.
    const water = new THREE.MeshPhysicalMaterial({
      color: "#8eafbf",
      roughness: 0.035,
      metalness: 0,
      ior: 1.333,
      specularIntensity: 1,
      envMapIntensity: 1.15,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    water.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        "varying vec2 vLakeUv;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvLakeUv=uv;",
        );
      shader.fragmentShader =
        `
        varying vec2 vLakeUv;
        uniform float uTime;
        uniform vec3 uRipple;
      ` +
        shader.fragmentShader
          .replace(
            "#include <map_fragment>",
            `
        vec2 lakeP=vLakeUv-.5;
        float lakeR=length(lakeP);
        float age=max(0.,uTime-uRipple.z);
        float distanceFromTap=distance(vLakeUv,uRipple.xy);
        float ring=sin(distanceFromTap*170.-age*12.)
          *exp(-abs(distanceFromTap-age*.09)*55.)*exp(-age*.7);
        float waves=sin(lakeP.x*95.+uTime*.8+sin(lakeP.y*30.))*.0004
          +sin(lakeP.y*80.-uTime*.6)*.0003
          +sin((lakeP.x+lakeP.y)*210.+uTime*1.7)*.00012
          +sin((lakeP.x-lakeP.y*.7)*330.-uTime*2.3)*.00007;
        float lakeHeight=waves+ring*.008;
        // Deep centre, silty green shallows toward the bank.
        diffuseColor.rgb=mix(vec3(.012,.035,.04),vec3(.07,.11,.08),smoothstep(.3,.5,lakeR));
        diffuseColor.rgb+=ring*.016;
        diffuseColor.a*=1.-smoothstep(.47,.5,lakeR);
      `,
          )
          .replace(
            "#include <normal_fragment_maps>",
            `
        #include <normal_fragment_maps>
        vec3 surfaceX=dFdx(-vViewPosition), surfaceY=dFdy(-vViewPosition);
        vec3 acrossY=cross(surfaceY,normal), acrossX=cross(normal,surfaceX);
        float determinant=dot(surfaceX,acrossY)*faceDirection;
        vec3 slope=sign(determinant)*(dFdx(lakeHeight)*acrossY+dFdy(lakeHeight)*acrossX);
        normal=normalize(abs(determinant)*normal-slope);
      `,
          );
    };
    return water;
  }, [uniforms]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, delta) => {
    if (!animate) return;
    time.current += Math.min(delta, 0.05);
    uniforms.uTime.value = time.current;
  });
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (!animate || e.delta > 4) return;
        onCue?.("ripple");
        discover("curiosity");
        const uv = e.uv;
        uniforms.uRipple.value.set(uv.x, uv.y, time.current);
      }}
    >
      <circleGeometry args={[radius, 72]} />
    </mesh>
  );
}
export default function Landscape({ animate, detailed = true, onCue }) {
  const path = useMemo(makePath, []);
  const pathMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#9a8b72",
      roughness: 0.96,
    });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "varying vec3 vPath;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvPath=position;",
        );
      shader.fragmentShader =
        "varying vec3 vPath;\n" +
        shader.fragmentShader.replace(
          "#include <map_fragment>",
          `
          float grain=fract(sin(dot(vPath.xz,vec2(19.7,71.3)))*437.58);
          diffuseColor.rgb*=.9+grain*.14;
          `,
        );
    };
    return material;
  }, []);
  useEffect(
    () => () => {
      path.dispose();
      pathMaterial.dispose();
    },
    [path, pathMaterial],
  );
  return (
    <group>
      <mesh geometry={path} material={pathMaterial} receiveShadow />
      <Grove detailed={detailed} />
      <ValleyCourse animate={animate} />
      <Lake animate={animate} onCue={onCue} />
      <Suspense fallback={null}>
        <GraniteValley />
      </Suspense>
    </group>
  );
}
