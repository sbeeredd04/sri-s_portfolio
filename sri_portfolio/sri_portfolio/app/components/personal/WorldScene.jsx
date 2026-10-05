"use client";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { sampleSceneStartup } from "../../lib/scene-startup.mjs";
import { worldLoading } from "../../lib/world-loading.mjs";
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
import ScenePointer from "./ScenePointer";
import UiIcon from "./UiIcon";
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
import PostEffects from "./PostEffects";
import WeatherRain from "./WeatherRain";
import AtmosphereSky from "./AtmosphereSky";
import CloudVolume from "./CloudVolume";
import GrassField from "./GrassField";
import { QualityProvider, useQuality } from "./Quality";
import { tierSettings } from "../../lib/device-tier.mjs";

// The procedural star field is already present at every tier. A phone does
// not need a second 4K texture and three extra sky samples per pixel.
function DesktopStarBackdrop({ daylight }) {
  const { tier } = useQuality();
  return tier === "low" ? null : (
    <Suspense fallback={null}>
      <StarSphere daylight={daylight} />
    </Suspense>
  );
}

// Warm the real render path, including late textures and environment lighting,
// behind the entrance. Stop scheduling as soon as it is ready.
function FirstFrame({ onReady, surfaceRef, assembled }) {
  const sample = useRef(null);
  const done = useRef(false);

  const state = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "development") window.__sriScene = state;
    const resume = () => {
      if (!document.hidden && !done.current) state.invalidate();
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [state]);
  useFrame(() => {
    if (done.current || document.hidden) return;
    sample.current = sampleSceneStartup(sample.current, {
      now: performance.now(),
      pending: useProgress.getState().active || !assembled,
      surface: Boolean(surfaceRef.current),
      lighting: Boolean(state.scene.environment),
    });
    if (sample.current.ready) {
      done.current = true;
      worldLoading.report({ ready: true });
      onReady?.();
    } else state.invalidate();
  });
  return null;
}
function AnimationDriver({ animate }) {
  const { fps } = useQuality();
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!animate) return;
    let frame,
      previous = 0;
    const tick = (now) => {
      // Leave GPU headroom on 120 Hz displays instead of rendering twice as
      // many ambient frames. Camera controls still request frames as needed.
      if (now - previous >= 1000 / fps - 0.5) {
        invalidate();
        previous = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, invalidate, fps]);
  return null;
}

function ConnectedWorld({
  onReady,
  introBottom,
  world,
  stop,
  keynoteIndex,
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
  // Globe labels only need horizon occlusion. Raycasting the 272k-triangle
  // contact terrain for every label, every frame is wasted main-thread work.
  const labelOccluder = useMemo(() => {
    const object = new THREE.Object3D();
    const sphere = new THREE.Sphere(new THREE.Vector3(), WORLD_RADIUS);
    const point = new THREE.Vector3();
    object.raycast = (raycaster, hits) => {
      if (!raycaster.ray.intersectSphere(sphere, point)) return;
      const distance = raycaster.ray.origin.distanceTo(point);
      if (distance >= raycaster.near && distance <= raycaster.far)
        hits.push({ distance, point: point.clone(), object });
    };
    return { current: object };
  }, []);
  // Assemble one district at a time behind the entrance, after the actual
  // sky lighting is ready. A single giant mount monopolized the main thread
  // and compiled materials twice (before and after the environment arrived).
  const [assembly, setAssembly] = useState(0);
  const assemblyFrame = useRef(0);

  useFrame(({ scene }) => {
    if (
      assembly >= regions.length + 2 ||
      !planet.current ||
      !scene.environment ||
      useProgress.getState().active
    )
      return;
    if (++assemblyFrame.current < 3) return;
    assemblyFrame.current = 0;
    // A step counts only after its geometry, lighting and asset batch settled.
    worldLoading.report({
      surface: true,
      assembly,
      total: regions.length + 2,
    });
    setAssembly((value) => Math.min(value + 1, regions.length + 2));
  });
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
    next.compactLabels = viewportWidth < 560 && projectedRadius < 160;
    const signature = Object.values(next).join(":");
    if (signature !== lastNear.current) {
      lastNear.current = signature;
      setNear(next);
      if (next.studio) setVisitedHouse(true);
    }
  });
  return (
    <>
      <FirstFrame
        onReady={onReady}
        surfaceRef={planet}
        assembled={assembly >= regions.length + 2}
      />
      <AnimationDriver animate={animate} />
      <MaterialLighting daylight={solar.daylight} world={world} />
      <WorldLighting
        {...{ world, stop, night, animate, solar, residentClock }}
      />
      <SolarSky world={world} solar={solar} />
      <DesktopStarBackdrop daylight={solar.daylight} />
      <AtmosphereSky world={world} solar={solar} animate={animate} />
      <WeatherRain weather={solar.weather} animate={animate} />
      <Stars daylight={solar.daylight} />
      <Suspense fallback={null}>
        <PlanetSurface surfaceRef={planet} weather={solar.weather} />
      </Suspense>
      {assembly >= 1 && <Walkways daylight={solar.daylight} />}
      {assembly >= regions.length + 2 && (
        <WorldResidents
          {...{ animate, visitorColor, onHover, onCue }}
          clock={residentClock}
        />
      )}
      <Suspense fallback={null}>
        <CloudVolume animate={animate} />
      </Suspense>
      <PostEffects world={world} daylight={solar.daylight} />
      {regions.slice(0, Math.max(0, assembly - 1)).map((region) => (
        <group
          key={region.id}
          ref={(node) => {
            districtGroups.current[region.id] = node;
          }}
          position={region.center}
          quaternion={region.rotation}
        >
          <GrassField
            biome={region.id}
            active={world === region.id}
            surfaceRef={planet}
            animate={animate}
            wind={solar.weather?.wind}
            sun={new THREE.Vector3(...solar.direction).applyQuaternion(
              region.rotation,
            )}
          />
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
                <House
                  animate={animate && near.studio}
                  night={night}
                  rain={solar.weather?.rain}
                >
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
              <SanFrancisco
                night={night}
                clockIso={solar.iso}
                animate={animate && near.studio}
              />
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
              night={night}
              onCue={onCue}
              onHover={onHover}
            />
          ) : region.id === "projects" ? (
            <ProjectTown
              keynoteIndex={keynoteIndex}
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
                occlude={[labelOccluder]}
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
                  <UiIcon />
                </button>
              </Html>
            )}
        </group>
      ))}
      {assembly >= regions.length + 2 && <WalkingPaths />}
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
  const [activeTier, setActiveTier] = useState(props.tier);
  const [activeDpr, setActiveDpr] = useState(null);
  const { onTier } = props;
  const reportTier = useCallback(
    (tier, dpr) => {
      setActiveTier(tier);
      setActiveDpr(dpr);
      onTier?.(tier);
    },
    [onTier],
  );
  return (
    <GraphicsGate onUnavailable={props.onUnavailable}>
      <Canvas
        shadows={activeTier !== "low"}
        dpr={activeDpr || tierSettings[activeTier]?.dpr || 1}
        frameloop="demand"
        camera={{
          position: [0, WORLD_RADIUS * 2.1, WORLD_RADIUS * 0.9],
          fov: 45,
          near: 0.22,
          far: 1200,
        }}
        gl={{
          // Native edge AA also covers the low tier, which skips the composer.
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        fallback={
          <p className="scene-fallback-message">
            The index and reading view work without 3D.
          </p>
        }
      >
        <GraphicsHealth onUnavailable={props.onUnavailable} />
        <ScenePointer
          enabled={props.pointerEnabled}
          animate={props.animate}
          cursor={props.hoverCursor}
          onHover={props.onHover}
        />
        <QualityProvider
          ceiling={props.tier}
          onTier={reportTier}
          active={props.animate}
        >
          <RoomMaterialProvider>
            <ConnectedWorld {...props} />
          </RoomMaterialProvider>
        </QualityProvider>
      </Canvas>
    </GraphicsGate>
  );
}
