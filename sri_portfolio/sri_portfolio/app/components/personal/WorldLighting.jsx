"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useQuality } from "./Quality";
import { biomeMoods } from "../../lib/world-time.mjs";
import { worldPoint, WORLD_RADIUS } from "../../lib/world-layout.mjs";
import {
  residentRoutePose,
  localWandererIndex,
} from "../../lib/resident-motion.mjs";

import { apartmentPoint } from "../../lib/studio-layout.mjs";
import { courtLamps } from "../../lib/court-layout.mjs";
import { projectGallerySites } from "../../lib/project-town-layout.mjs";
import { campusCenter } from "../../lib/campus-layout.mjs";
import {
  fieldnotesLamp,
  fieldnotesDeskLamp,
} from "../../lib/fieldnotes-layout.mjs";

const practicals = {
  studio: [
    [[1.98, 2.78, -2.2], "#ffd19b", 8, 7],
    [[-0.48, 1.32, -0.98], "#b5d1f6", 1.4, 3],
    [[-4.7, 3.34, -1.35], "#ffd6a6", 17, 9],
    [[-6.24, 2.4, 5.3], "#ffd6a6", 3, 5],
  ],
  entertainment: [
    [[-2.8, 2.9, 0], "#ffd2a3", 10, 8],
    [[0.6, 2.9, -1.4], "#ffd2a3", 8, 7],
    [[3.7, 1.1, -1], "#ff9f61", 9, 6],
    [[9, 2, -0.5], "#b5bddd", 5, 7],
  ],
  court: courtLamps.map((position) => [position, "#dce7ff", 110, 24]),
  trail: [],
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
    [fieldnotesDeskLamp.bulb, "#f0d5aa", 2.4, 4],
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

// One key and five practical lights remain mounted for the whole journey.
// Moving or dimming a light changes uniforms, not each material's shader variant.
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
  const interior = world === "studio" && (stop === "desk" || stop === "bookshelf");
  const key = useRef(),
    points = useRef([]),
    time = useRef(0);
  const target = useMemo(() => new THREE.Object3D(), []);
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      color: new THREE.Color(),
    }),
    [],
  );
  const lights = useMemo(() => {
    if (world === "projects") {
      const [x, z] = exhibits[stop] || [0, 0];
      return [
        [[x, 2.8, z + 0.5], "#f0c9a1", stop === "ring" ? 18 : 11, 12],
        [[-2, 2.4, 1.3], "#ffcf9d", 6, 8],
        [[3.5, 2.4, 8.5], "#ffcf9d", 6, 8],
        [
          [
            projectGallerySites.hackathons.position[0],
            2.9,
            projectGallerySites.hackathons.position[2] + 1,
          ],
          "#edc5a5",
          8,
          9,
        ],
      ];
    }
    return practicals[world] || [];
  }, [world, stop]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05),
      close = world !== "planet";
    if (animate) time.current += step;
    scratch.position.copy(
      close
        ? worldPoint(
            world,
            daylight > 0.05
              ? solar.direction.map((v, i) =>
                  i === 1 ? Math.max(6, v * 45) : v * 45,
                )
              : valley
                ? [-14, 28, 18]
                : foundry
                  ? [-8, 32, 16]
                  : [3, 18, 6],
          )
        : new THREE.Vector3(
            ...(daylight > 0.05 ? solar.direction : [-0.5, 0.8, 0.5]),
          ).multiplyScalar(WORLD_RADIUS * 2),
    );
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
        : new THREE.Vector3(),
    );
    if (world === "studio" && stop === "walk") {
      const { pose } = residentRoutePose(
        residentClock.elapsed,
        localWandererIndex,
      );
      scratch.position.add(pose.position).sub(scratch.target);
      scratch.target.copy(pose.position);
    }
    const blend = animate ? 1 - Math.exp(-step * 5) : 1;
    key.current.position.lerp(scratch.position, blend);
    target.position.lerp(scratch.target, blend);
    const keyIntensity = close
      ? (valley ? 1.1 : foundry || fieldnotes ? 0.95 : 0.8) +
        daylight * 3.6 * mood.exposure
      : 1.2 + daylight;
    key.current.intensity = THREE.MathUtils.lerp(
      key.current.intensity,
      keyIntensity * (interior ? 0.45 + daylight * 0.4 : 1),
      blend,
    );
    scratch.color.set(daylight > 0.05 ? mood.sun : "#b4c8ee");
    if (solar.warmth && daylight > 0.05)
      scratch.color.lerp(new THREE.Color("#ffb67c"), solar.warmth * 0.5);
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
      shadow.far = close ? 110 : WORLD_RADIUS * 4;
      shadow.updateProjectionMatrix();
    }
    for (let i = 0; i < 5; i++) {
      const lamp = points.current[i];
      const item =
        i === 4 && world === "studio"
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
      if (item && close) {
        lamp.position.lerp(
          worldPoint(
            world,
            world === "studio" ? apartmentPoint(item[0]) : item[0],
          ),
          blend,
        );
        scratch.color.set(item[1]);
        lamp.color.lerp(scratch.color, blend);
        lamp.intensity = THREE.MathUtils.lerp(
          lamp.intensity,
          item[2] * (1 - daylight * 0.72) * (interior ? 1.8 : 1),
          blend,
        );
        lamp.distance = item[3];
      } else lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, 0, blend);
    }
  });
  return (
    <>
      <ambientLight
        intensity={
          ((valley || foundry || fieldnotes ? 0.16 : 0.12) - daylight * 0.08) *
          (interior ? 0.5 : 1)
        }
      />
      <hemisphereLight
        args={[
          mood.sky,
          "#3b3a44",
          ((valley || foundry || fieldnotes ? 0.5 : 0.42) - daylight * 0.12) *
            (interior ? 0.4 + daylight * 0.4 : 1),
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
      {Array.from({ length: 5 }, (_, i) => (
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
