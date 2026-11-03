"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useQuality } from "./Quality";
import { illumination } from "../../lib/world-lighting.mjs";
import { biomeMoods } from "../../lib/world-time.mjs";
import { worldPoint, WORLD_RADIUS, regions } from "../../lib/world-layout.mjs";
import {
  residentRoutePose,
  localWandererIndex,
} from "../../lib/resident-motion.mjs";

import { apartmentPoint, studioDeskLight } from "../../lib/studio-layout.mjs";
import { outThereCamp } from "../../lib/out-there-site.mjs";
import { madeSites, madeSitePoint } from "../../lib/made-campus-views.mjs";
import { raisedContentPoint } from "../../lib/authored-island-sites.mjs";
import { courtLamps } from "../../lib/court-layout.mjs";
import { projectGallerySites } from "../../lib/project-town-layout.mjs";
import { campusCenter } from "../../lib/campus-layout.mjs";
import {
  fieldnotesLamp,
  fieldnotesDeskLamp,
  fieldnotesFire,
} from "../../lib/fieldnotes-layout.mjs";

const practicals = {
  studio: [
    [[1.98, 2.45, -2.2], "#ffc181", 4.2, 6],
    [[-0.48, 1.32, -0.98], "#b5d1f6", 1.4, 3],
    // The clamp lamp over the keyboard, brighter once the room is dark.
    [
      [
        studioDeskLight.position[0],
        studioDeskLight.position[1] - 0.06,
        studioDeskLight.position[2] + 0.2,
      ],
      "#ffdeb0",
      1.2,
      1.9,
      "lamp",
    ],
    [[-4.7, 2.14, -1.35], "#ffd6a6", 17, 9],
    [[-6.24, 2.4, 5.3], "#ffd6a6", 3, 5],
  ],
  entertainment: [
    [[-2.8, 2.9, 0], "#ffd2a3", 10, 8],
    [[0.6, 2.9, -1.4], "#ffd2a3", 8, 7],
    [[3.7, 1.1, -1], "#ff9f61", 9, 6],
    [[9, 2, -0.5], "#b5bddd", 5, 7],
  ],
  court: [
    ...courtLamps.map((position) => [position, "#f6dfbd", 92, 24]),
    // Pavilion is part of this island even when the courts own the camera.
    [[-1.55, 3.15, 42.55], "#ffbb72", 55, 19],
    [[9, 2.4, 42], "#ffd09a", 34, 15],
  ],
  // The campfire only burns at night, and flickers.
  trail: [
    [
      [outThereCamp.x, outThereCamp.y + 0.7, outThereCamp.z],
      "#ffa04a",
      5,
      9,
      "fire",
    ],
    [[2.05, 24.35, 0.45], "#ffd19a", 8, 11],
  ],
  future: [
    [
      [
        fieldnotesLamp.position[0] + 0.38 * fieldnotesLamp.scale,
        fieldnotesLamp.position[1] + 2.5 * fieldnotesLamp.scale,
        fieldnotesLamp.position[2],
      ],
      "#ead2b6",
      8,
      8,
    ],
    [fieldnotesDeskLamp.bulb, "#ffd29c", 4.6, 6],
    [[fieldnotesFire.x, .72, fieldnotesFire.z], "#ffb064", 5.2, 6, "fire"],
    [[-2.45, 2.72, 2.1], "#ffd9a4", 5, 6],
    [[2.55, 1.95, -7.3], "#ffcf8e", 3.4, 4],
  ],
};
const exhibits = {
  aether: [-5, -2.2],
  agentex: [0, -4.8],
  gitcue: [5.5, -2.2],
  mesa: [-6, 3.4],
  csdna: [6, 3.4],
  soda: [0, 7.5],
  mobile: [
    projectGallerySites.mobile.position[0],
    projectGallerySites.mobile.position[2],
  ],
  workbench: [-7, 10],
  hackathons: [
    projectGallerySites.hackathons.position[0],
    projectGallerySites.hackathons.position[2],
  ],
  ring: [campusCenter.x, campusCenter.z],
  campus: [campusCenter.x, campusCenter.z - 6],
};

// One key and six practical lights remain mounted for the whole journey, and
// no component mounts a light of its own. three.js compiles the light count
// into every lit shader, so a light appearing or being culled with its biome
// recompiled every material in the world (a multi-second freeze). Moving or
// dimming a pooled light only changes uniforms.
const POOL = 6;
export default function WorldLighting({
  world,
  stop,
  night,
  animate,
  solar,
  residentClock,
}) {
  const quality = useQuality();
  const mood = biomeMoods[world];
  const daylight = solar.daylight;
  const valley = world === "trail";
  const foundry = world === "projects";
  const fieldnotes = world === "future";
  // Inside the apartment the room should be lit by its lamps and screens;
  // sky fill through the glass is kept low so night reads warm, not blue.
  const interior =
    world === "studio" && (stop === "desk" || stop === "bookshelf");
  const light = illumination(solar, interior);
  const skyFill = useRef();
  const key = useRef(),
    points = useRef([]),
    time = useRef(0),
    shadowFrame = useRef(0);
  const target = useMemo(() => new THREE.Object3D(), []);
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      target: new THREE.Vector3(),
      color: new THREE.Color(),
    }),
    [],
  );
  const lights = useMemo(() => {
    if (world === "planet") {
      // Keep the same six-light budget in overview. Each light remains at an
      // actual room, court lamp or campfire, rather than vanishing on exit.
      return [
        [apartmentPoint([1.98, 2.45, -2.2]), "#ffc181", 18, 12, "", "studio"],
        [[0, 5.85, -6.5], "#ffcf9d", 60, 26, "", "projects"],
        [[-1.55, 3.15, 42.55], "#ffbb72", 65, 24, "", "court"],
        [courtLamps[1], "#f6dfbd", 92, 26, "", "court"],
        [[outThereCamp.x, outThereCamp.y + .7, outThereCamp.z], "#ffa04a", 8, 12, "fire", "trail"],
        [fieldnotesDeskLamp.bulb, "#ffc181", 12, 12, "", "future"],
      ];
    }
    if (world === "projects") {
      const site = madeSites.find((s) => s.id === stop);
      return [
        [
          site ? madeSitePoint(site, [0, 3.65, -1]) : [0, 5.85, -6.5],
          "#ffe1b2",
          site ? 36 : 11,
          12,
        ],
        [[-18, 4.32, -9], "#ffcf9d", 32, 17],
        [[18, 4.32, -9], "#ffcf9d", 32, 17],
        [[-18, 4.32, 18], "#ffcf9d", 32, 17],
        [[18, 4.32, 18], "#ffcf9d", 32, 17],
        [[2, 4.32, 38.8], "#ffd4a3", 32, 17],
      ];
    }
    return practicals[world] || [];
  }, [world, stop]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05),
      close = world !== "planet";
    // Mid-tier devices redraw every shadow caster on alternate frames only;
    // the pass is ~40% of their draw calls and a one-frame lag is invisible.
    const keyShadow = key.current.shadow;
    keyShadow.autoUpdate = quality.shadowEvery <= 1;
    if (
      !keyShadow.autoUpdate &&
      ++shadowFrame.current % quality.shadowEvery === 0
    )
      keyShadow.needsUpdate = true;
    if (animate) time.current += step;
    scratch.target.copy(
      close
        ? worldPoint(
            world,
            world === "studio"
              ? apartmentPoint([0, 0, 0])
              : valley
                ? [0, 2, -12]
                : foundry
                  ? [-7, 1, -14]
                  : [0, 0, 0],
          )
        : new THREE.Vector3(0, WORLD_RADIUS, 0),
    );
    if (world === "studio" && stop === "walk") {
      const { pose } = residentRoutePose(
        residentClock.elapsed,
        localWandererIndex,
      );
      scratch.target.copy(pose.position);
    }
    // Directional light is a vector from its target, not an absolute world
    // coordinate. A low sun at y=6 was below Home's 26m summit; in overview
    // it was even below the 450m bay plane. Keep the solar angle at every
    // camera/terrain height and centre the shadow volume on the subject.
    scratch.direction.set(...(daylight > 0.05 ? solar.direction : [-0.5, 0.8, 0.5])).normalize();
    const lightRegion = regions.find((r) => r.id === world);
    if (lightRegion) scratch.direction.applyQuaternion(lightRegion.rotation);
    scratch.position.copy(scratch.target).addScaledVector(scratch.direction, close ? 180 : WORLD_RADIUS * 2);
    const blend = animate ? 1 - Math.exp(-step * 5) : 1;
    key.current.position.lerp(scratch.position, blend);
    target.position.lerp(scratch.target, blend);
    const region = regions.find((r) => r.id === world);
    if (region) skyFill.current.position.copy(region.normal);
    else skyFill.current.position.set(0, 1, 0);
    key.current.intensity = THREE.MathUtils.lerp(
      key.current.intensity,
      light.direct * (close ? mood.exposure : 0.9),
      blend,
    );
    scratch.color.set(daylight > 0.05 ? mood.sun : "#b4c8ee");
    if (solar.warmth && daylight > 0.05)
      scratch.color.lerp(new THREE.Color("#ffb67c"), solar.warmth * (1 - (solar.weather?.cloud ?? 0) * 0.8) * 0.5);
    key.current.color.lerp(scratch.color, blend);
    const span = close
      ? foundry
        ? 42
        : world === "entertainment"
          ? 23
          : valley
            ? 37
            : world === "court"
              ? 30
              : 15
      : WORLD_RADIUS + 20;
    const shadow = key.current.shadow.camera;
    if (shadow.right !== span) {
      shadow.left = -span;
      shadow.right = span;
      shadow.top = span;
      shadow.bottom = -span;
      shadow.near = close ? 3 : 20;
      shadow.far = close ? 400 : WORLD_RADIUS * 4;
      shadow.updateProjectionMatrix();
    }
    for (let i = 0; i < POOL; i++) {
      const lamp = points.current[i];
      const item =
        i === POOL - 1 && world === "studio"
          ? [
              [0, 4, -5],
              "#dae9ff",
              night
                ? Math.max(0, 1 - Math.abs((time.current % 23) - 17) / 1.4) *
                  2.5
                : 0,
              20,
            ]
          : lights[i];
      if (item) {
        const lampWorld = item[5] || world;
        lamp.position.lerp(
          worldPoint(
            lampWorld,
            world === "studio"
              ? apartmentPoint(item[0])
              : raisedContentPoint(lampWorld, item[0]),
          ),
          blend,
        );
        scratch.color.set(item[1]);
        lamp.color.lerp(scratch.color, blend);
        const kind = item[4];
        const level =
          kind === "fire"
            ? (night ? 1 : 0) * (0.85 + Math.sin(time.current * 17) * 0.1)
            : kind === "lamp"
              ? night
                ? 1
                : 0.4
              : light.practical * (interior ? 1.8 : 1);
        lamp.intensity = THREE.MathUtils.lerp(
          lamp.intensity,
          item[2] * level,
          blend,
        );
        lamp.distance = item[3];
      } else lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, 0, blend);
    }
  });
  return (
    <>
      <ambientLight intensity={light.ambient} />
      <hemisphereLight
        ref={skyFill}
        args={[
          daylight < 0.4 ? "#91a8d0" : "#d2e3ed",
          daylight < 0.4 ? "#29313f" : valley ? "#6d7255" : "#777469",
          light.sky,
        ]}
      />
      <primitive object={target} />
      <directionalLight
        ref={key}
        target={target}
        position={[-80, 120, 85]}
        intensity={night ? 1.4 : 2.2}
        color="#cadcf4"
        castShadow={quality.shadows}
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-normalBias={0.025}
        shadow-bias={-0.00025}
      />
      {Array.from({ length: POOL }, (_, i) => (
        <pointLight
          key={i}
          ref={(node) => {
            points.current[i] = node;
          }}
          intensity={0}
          distance={9}
          decay={2}
        />
      ))}
    </>
  );
}
