"use client";
import { Suspense, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import SharedIslandAsset from "./SharedIslandAsset";
import { Workspace } from "./BiomeScenes";
import { apartmentPoint, APARTMENT_YAW } from "../../lib/studio-layout.mjs";
import { homeSite } from "../../lib/home-site.mjs";
import PreparedGroup from "./PreparedGroup";
import SoftHuman from "./SoftHuman";
import { useHomeCameraOcclusion } from "./CameraOcclusion";

// Clone per house: an occupied window must not illuminate every mesh that
// happens to share the export's glass palette. Balcony glass remains unlit.
function tuneHouseGlazing(mesh, night) {
  if (!/glazing/i.test(mesh.name)) return;
  const number = Number(mesh.name.match(/Rowhouse_(\d+)/)?.[1] || 0);
  const summit = mesh.name.startsWith("Summit_");
  const occupied = summit || number % 5 !== 3;
  mesh.updateMatrix();
  mesh.material = [mesh.material].flat().map((source) => {
    const material = source.clone();
    material.color.set(night ? "#657d83" : "#627e7f");
    // Thin clear summit glazing preserves the real bay view from the desk.
    // Warm rooms are supplied by interior practicals, not a glowing glass veil.
    material.envMapIntensity = summit ? .035 : .12;
    material.opacity = summit ? (night ? .065 : .09) : night && occupied ? .42 : .28;
    material.emissive.set(number % 3 === 0 ? "#efa05c" : "#ffc284");
    material.emissiveIntensity = night && occupied && !summit ? .46 : 0;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uHomePaneMatrix = { value: mesh.matrix.clone() };
      shader.vertexShader = "uniform mat4 uHomePaneMatrix; varying vec3 vHomePane;\n" +
        shader.vertexShader.replace("#include <begin_vertex>", `
          #include <begin_vertex>
          vHomePane = (uHomePaneMatrix * vec4(position, 1.)).xyz;
        `);
      shader.fragmentShader = "varying vec3 vHomePane;\n" +
        shader.fragmentShader.replace("#include <emissivemap_fragment>", `
          #include <emissivemap_fragment>
          ${summit ? `
            float facade = min(abs(vHomePane.z-4.8), min(abs(vHomePane.z-3.),abs(vHomePane.z-2.1)));
            float pane = 1.-step(.035,facade);
          ` : `
            float pane = 1.-step(6.85,vHomePane.z);
            float storey = floor(max(0.,vHomePane.y-1.02)/2.66);
            pane *= step(.5,mod(storey+${(number * 3) % 4}.0,4.));
          `}
          totalEmissiveRadiance *= pane;
        `);
    };
    material.customProgramCacheKey = () => `home-windows-${summit ? "summit" : number}-v1`;
    return material;
  });
  if (mesh.material.length === 1) mesh.material = mesh.material[0];
}

function dressHomeSurface(mesh) {
  if (mesh.name !== "Home_ContinuousHill" && mesh.parent?.name !== "Home_ContinuousHill") return;
  const material = mesh.material.clone();
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = "varying vec3 vHomeGround;\n" +
      shader.vertexShader.replace("#include <project_vertex>", `
        vHomeGround = (modelMatrix * vec4(transformed, 1.)).xyz;
        #include <project_vertex>
      `);
    shader.fragmentShader = "varying vec3 vHomeGround;\n" +
      shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        vec2 soil = vHomeGround.xz;
        float field = sin(soil.x*.68 + sin(soil.y*.5)*1.6)*cos(soil.y*.43);
        float footprint = max(length(dFdx(soil)), length(dFdy(soil)));
        float grain = sin(soil.x*32. + sin(soil.y*23.))*sin(soil.y*37. + soil.x*14.);
        diffuseColor.rgb *= 1. + .092*field + .048*grain*(1.-smoothstep(.018,.12,footprint));
      `);
  };
  material.customProgramCacheKey = () => "home-soil-v1";
  mesh.material = material;
}

function Beacon({ animate, night }) {
  const light = useRef(),
    phase = useRef(0);
  useFrame((_, dt) => {
    if (animate) phase.current += Math.min(0.05, dt);
    light.current.emissiveIntensity = night
      ? 1.65 + Math.sin(phase.current * 1.55) * 0.55
      : 0.28;
  });
  return (
    <mesh position={homeSite.anchors.Summit_BeaconAnchor} raycast={() => null}>
      <cylinderGeometry args={[0.28, 0.28, 0.48, 8]} />
      <meshStandardMaterial ref={light} color="#d4a364" emissive="#ffad47" />
    </mesh>
  );
}

function PromenadeWalker({ animate, lane, phase, color }) {
  const group = useRef(null);
  const elapsed = useRef(phase);
  const motion = useRef({ speed: 0 });
  useFrame((_, delta) => {
    if (!group.current) return;
    if (animate) elapsed.current += Math.min(delta, .05);
    const t = elapsed.current * .0625;
    const dx = 13 * .0625 * Math.cos(t);
    const dz = -.38 * .0625 * Math.sin(t);
    motion.current.speed = animate ? Math.hypot(dx, dz) : 0;
    group.current.position.set(18 + 13 * Math.sin(t), 2.613, lane + .38 * Math.cos(t));
    group.current.rotation.y = Math.atan2(dx, dz);
  });
  return (
    <group ref={group} position={[18, 2.613, lane]}>
      <SoftHuman animate={animate} motion={motion} color={color} />
    </group>
  );
}
export default function HomeRegion({
  animate,
  night,
  visited,
  detailed,
  reset,
  onScreenClick,
  onStopSelect,
  onCue,
  onHover,
}) {
  const configureOcclusion = useHomeCameraOcclusion(visited && detailed);
  const configureHouse = useCallback((mesh) => {
    tuneHouseGlazing(mesh, night);
    configureOcclusion(mesh);
  }, [night, configureOcclusion]);
  return (
    <group>
      <Suspense fallback={null}>
        <SharedIslandAsset source={homeSite.landform} configure={dressHomeSurface} night={night} />
        <SharedIslandAsset
          source={homeSite.architecture}
          configure={configureHouse}
          onClick={(event) => {
            if (event.delta > 4) return;
            for (let n = event.object; n; n = n.parent) {
              if (n.name.startsWith("Summit_")) {
                event.stopPropagation();
                onStopSelect("desk");
                break;
              }
              if (n.name.startsWith("Rowhouse_")) {
                event.stopPropagation();
                onStopSelect("promenade");
                break;
              }
            }
          }}
        />
        <Beacon {...{ animate, night }} />
      </Suspense>
      {visited && (
        <group position={apartmentPoint([0, 0, 0])} rotation={[0, APARTMENT_YAW, 0]}>
          <PreparedGroup visible={detailed}>
            <Workspace
              summit
              {...{ animate, night, reset, onScreenClick, onCue, onHover }}
            />
          </PreparedGroup>
        </group>
      )}
      {detailed && (
        <Suspense fallback={null}>
          <PromenadeWalker animate={animate} lane={43.5} phase={1.8} color="#cba9a1" />
          <PromenadeWalker animate={animate} lane={45.1} phase={23} color="#bfb49a" />
        </Suspense>
      )}
    </group>
  );
}
