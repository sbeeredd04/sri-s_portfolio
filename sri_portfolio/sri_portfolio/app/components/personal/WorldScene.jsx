"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  regions,
  WORLD_RADIUS,
  surfaceHeight,
} from "../../lib/world-layout.mjs";
import GraphicsHealth, { GraphicsGate } from "./GraphicsHealth";
import MaterialLighting from "./MaterialLighting";
import WorldLighting from "./WorldLighting";
import SolarSky from "./SolarSky";
import WorldResidents from "./WorldResidents";
import { RoomMaterialProvider } from "./RoomMaterials";
import PlanetSurface from "./PlanetSurface";
import { Stars } from "./WorldDetails";
import StarSphere from "./StarSphere";
import Walkways from "./Walkways";
import StreetViewMarkers from "./StreetViewMarkers";
import VisitorWalker from "./VisitorWalker";
import WalkingPaths from "./WalkingPaths";
import CameraRig from "./CameraRig";
import House from "./House";
import SanFrancisco, { ApartmentBase } from "./SanFrancisco";
import { APARTMENT_LEVEL } from "../../lib/studio-layout.mjs";
import { Workspace, Court, Trail } from "./BiomeScenes";
import { Grove } from "./Landscape";
import { Box } from "./ScenePrimitives";
import TerrainPlanting from "./TerrainPlanting";
import ProjectTown from "./ProjectTown";
import AfterHours from "./AfterHours";
import FutureStudio from "./FutureStudio";
import PreparedGroup from "./PreparedGroup";

function AnimationDriver({ animate }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!animate) return;
    const timer = setInterval(invalidate, 1000 / 30);
    return () => clearInterval(timer);
  }, [animate, invalidate]);
  return null;
}
function Atmosphere({ animate }) {
  const clouds = useRef(),
    time = useRef(0);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    [],
  );
  useFrame(({ camera }, dt) => {
    if (animate) time.current += Math.min(dt, 0.05);
    uniforms.uTime.value = time.current;
    uniforms.uOpacity.value = THREE.MathUtils.smoothstep(
      camera.position.length(),
      WORLD_RADIUS + 6,
      WORLD_RADIUS + 30,
    );
  });
  const vertex = `varying vec3 vP;varying vec3 vN;varying vec3 vView;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
  return (
    <>
      <mesh>
        <sphereGeometry args={[WORLD_RADIUS + 1.1, 96, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          vertexShader={vertex}
          fragmentShader={`varying vec3 vN;varying vec3 vView;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(vView))),3.);gl_FragColor=vec4(.46,.66,1.,rim*.14);}`}
        />
      </mesh>
      <mesh ref={clouds}>
        <sphereGeometry args={[WORLD_RADIUS + 2.3, 96, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={`varying vec3 vP;uniform float uTime;uniform float uOpacity;
      float h(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 p=normalize(vP)*5.+vec3(uTime*.0015,0,0);float a=n(p)*.57+n(p*2.1)*.28+n(p*4.2)*.15;float cloud=smoothstep(.56,.76,a);gl_FragColor=vec4(.78,.85,.96,cloud*.075*uOpacity);}`}
        />
      </mesh>
    </>
  );
}

function ConnectedWorld({
  introBottom,
  world,
  stop,
  night,
  solar,
  visitorColor,
  residentClock,
  reset,
  roomReset,
  animate,
  onScreenClick,
  onHover,
  onBiomeSelect,
  onProjectOpen,
  onContentOpen,
  onStopSelect,
  onCue,
  exhibitValues,
  onExhibitChange,
  channel,
  onChannelChange,
  ballRequests,
  onCourtActivity,
  onCourtPlay,
  onWalkerStatus,
  onWalkExit,
}) {
  const planet = useRef(),
    lastNear = useRef("");
  const districtGroups = useRef({});
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const viewportWidth = useThree((s) => s.size.width);
  const viewportHeight = useThree((s) => s.size.height);
  const [near, setNear] = useState({
    studio: false,
    court: false,
    trail: false,
  });
  const [visitedHouse, setVisitedHouse] = useState(false);
  useEffect(() => {
    if (world === "studio") setVisitedHouse(true);
  }, [world]);
  useFrame(({ camera }) => {
    const horizon = Math.acos(
      Math.min(1, WORLD_RADIUS / camera.position.length()),
    );
    cameraDirection.copy(camera.position).normalize();
    for (const r of regions) {
      const group = districtGroups.current[r.id];
      if (group)
        group.visible =
          cameraDirection.dot(r.normal) >
          Math.cos(horizon + (r.outer + 9) / WORLD_RADIUS);
    }
    const next = Object.fromEntries(
      regions.map((r) => [
        r.id,
        (r.id === world && world !== "planet") ||
          camera.position.distanceTo(r.center) <
            (r.id === world && viewportWidth < 560
              ? 55
              : r.id === "projects"
                ? 38
                : 30),
      ]),
    );
    const projectedRadius =
      (viewportHeight * camera.projectionMatrix.elements[5] * WORLD_RADIUS) /
      (2 *
        Math.sqrt(Math.max(1, camera.position.lengthSq() - WORLD_RADIUS ** 2)));
    next.compactLabels = viewportWidth < 560 && projectedRadius < 110;
    const signature = Object.values(next).join(":");
    if (signature !== lastNear.current) {
      lastNear.current = signature;
      setNear(next);
      if (next.studio) setVisitedHouse(true);
    }
  });
  return (
    <>
      <AnimationDriver animate={animate} />
      <MaterialLighting daylight={solar.daylight} />
      <WorldLighting
        {...{ world, stop, night, animate, solar, residentClock }}
      />
      <SolarSky world={world} solar={solar} />
      <Suspense fallback={null}>
        <StarSphere daylight={solar.daylight} />
      </Suspense>
      <Stars daylight={solar.daylight} />
      <PlanetSurface surfaceRef={planet} />
      <Walkways daylight={solar.daylight} />
      <WorldResidents
        {...{ animate, visitorColor, onHover, onCue }}
        clock={residentClock}
      />
      <Atmosphere animate={animate} />
      {regions.map((region) => (
        <group
          key={region.id}
          ref={(node) => {
            districtGroups.current[region.id] = node;
          }}
          position={region.center}
          quaternion={region.rotation}
        >
          {["court", "trail", "projects"].includes(region.id) && (
            <TerrainPlanting
              biome={region.id}
              visible={near[region.id]}
              animate={animate && near[region.id]}
            />
          )}
          {region.id === "studio" ? (
            <>
              <ApartmentBase night={night} />
              <group position={[0, APARTMENT_LEVEL, 0]}>
                <House animate={animate && near.studio} night={night}>
                  {visitedHouse && (
                    <PreparedGroup visible={near.studio}>
                      <Workspace
                        animate={animate && near.studio}
                        reset={roomReset}
                        night={night}
                        onScreenClick={onScreenClick}
                        onCue={onCue}
                        onHover={onHover}
                      />
                    </PreparedGroup>
                  )}
                </House>
              </group>
              <SanFrancisco night={night} clockIso={solar.iso} />
            </>
          ) : region.id === "court" ? (
            <Court
              animate={animate && near.court}
              detailed={near.court}
              ballRequests={ballRequests}
              onCourtActivity={onCourtActivity}
              onCourtPlay={onCourtPlay}
              onHover={onHover}
              onCue={onCue}
              activeCourt={world === "court" ? stop : null}
            />
          ) : region.id === "trail" ? (
            <Trail
              animate={animate && near.trail}
              detailed={near.trail}
              onCue={onCue}
              onHover={onHover}
            />
          ) : region.id === "projects" ? (
            <ProjectTown
              activeProject={world === "projects" ? stop : null}
              exhibitValues={exhibitValues}
              onExhibitChange={onExhibitChange}
              onProjectVisit={(id) => {
                onBiomeSelect("projects");
                onStopSelect(id);
              }}
              detailed={near.projects}
              animate={animate && near.projects}
              night={night}
              onProjectOpen={onProjectOpen}
              onContentOpen={onContentOpen}
              onHover={onHover}
            />
          ) : region.id === "entertainment" ? (
            <AfterHours
              channel={channel}
              onChannelChange={onChannelChange}
              detailed={near.entertainment}
              animate={animate && near.entertainment}
              night={night}
              onContentOpen={onContentOpen}
              onHover={onHover}
              onCue={onCue}
              onStopSelect={onStopSelect}
            />
          ) : (
            <FutureStudio
              stop={stop}
              detailed={near.future}
              animate={animate && near.future}
              onStopSelect={onStopSelect}
              onHover={onHover}
              onCue={onCue}
              night={night}
              onContentOpen={onContentOpen}
            />
          )}
          {world === "planet" &&
            region.id !== "entertainment" &&
            !near[region.id] && (
              <Html
                position={[
                  0,
                  region.id === "studio" ? APARTMENT_LEVEL + 7.5 : 7.5,
                  0,
                ]}
                center
                occlude={[planet]}
                zIndexRange={[5, 1]}
              >
                <button
                  className={`planet-label${near.compactLabels ? " planet-label-compact" : ""}`}
                  aria-label={`Explore ${region.label}`}
                  onClick={() => onBiomeSelect(region.id)}
                >
                  <span className="planet-label-full">{region.label}</span>
                  <span className="planet-label-number" aria-hidden="true">
                    {
                      {
                        studio: "01",
                        projects: "02",
                        entertainment: "03",
                        court: "03",
                        trail: "04",
                        future: "05",
                      }[region.id]
                    }
                  </span>
                  <span className="planet-label-short">
                    {
                      {
                        studio: "Home",
                        court: "After hours",
                        trail: "Outdoors",
                        projects: "Foundry",
                        entertainment: "After hours",
                        future: "Fieldnotes",
                      }[region.id]
                    }
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              </Html>
            )}
        </group>
      ))}
      <WalkingPaths />
      {stop.startsWith("roam") && (
        <VisitorWalker
          key={`${stop}:${reset}`}
          world={world}
          roof={stop === "roam:roof"}
          entry={
            stop === "roam:overlook"
              ? "overlook"
              : stop === "roam:campus" ||
                  stop === "roam:ring" ||
                  world === "future"
                ? stop.slice(5)
                : undefined
          }
          enabled={animate}
          color={visitorColor}
          onStatus={onWalkerStatus}
          onExit={onWalkExit}
        />
      )}
      <StreetViewMarkers
        world={world}
        stop={stop}
        onSelect={onStopSelect}
        onHover={onHover}
      />
      <CameraRig
        residentClock={residentClock}
        introBottom={introBottom}
        world={world}
        stop={stop}
        reset={reset}
        animate={animate}
        onArrive={onBiomeSelect}
      />
    </>
  );
}
export default function WorldScene(props) {
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  return (
    <GraphicsGate onUnavailable={props.onUnavailable}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{
          position: [0, WORLD_RADIUS * 2.1, WORLD_RADIUS * 0.9],
          fov: 45,
          near: 0.22,
          far: 1200,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        fallback={
          <p className="scene-fallback-message">
            The index and reading view work without 3D.
          </p>
        }
      >
        <GraphicsHealth onUnavailable={props.onUnavailable} />
        <RoomMaterialProvider>
          <ConnectedWorld {...props} />
        </RoomMaterialProvider>
      </Canvas>
    </GraphicsGate>
  );
}
