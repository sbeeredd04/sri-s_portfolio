"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  characterFace,
  characterHair,
  characterShirt,
} from "../../lib/character-geometry.mjs";
import { roundedBox } from "../../lib/model-geometry.mjs";
import {
  residentRoutePose,
  residentLeg,
  localWandererIndex,
} from "../../lib/resident-motion.mjs";
import { useRoomTexture } from "./RoomMaterials";

export const visitorColors = ["#a5b7df", "#a4c7b8", "#c4aed4", "#d7b999"];
const parts = [
  { name: "shirt", offset: [0, 0.75, 0], scale: [0.65, 0.8, 0.65] },
  { name: "head", offset: [0, 1.19, 0], scale: [0.45, 0.51, 0.48] },
  { name: "hair", offset: [0, 1.19, 0], scale: [0.45, 0.51, 0.48] },
  {
    name: "leftEar",
    offset: [-0.177, 1.165, 0.008],
    scale: [0.08, 0.105, 0.07],
  },
  {
    name: "rightEar",
    offset: [0.177, 1.165, 0.008],
    scale: [0.08, 0.105, 0.07],
  },
  { name: "nose", offset: [0, 1.14, 0.176], scale: [0.027, 0.035, 0.026] },
  {
    name: "leftUpperLeg",
    offset: [-0.095, 0.3, 0],
    scale: [0.13, 0.265, 0.15],
  },
  {
    name: "rightUpperLeg",
    offset: [0.095, 0.3, 0],
    scale: [0.13, 0.265, 0.15],
  },
  {
    name: "leftLowerLeg",
    offset: [-0.095, 0.3, 0],
    scale: [0.12, 0.265, 0.14],
  },
  {
    name: "rightLowerLeg",
    offset: [0.095, 0.3, 0],
    scale: [0.12, 0.265, 0.14],
  },
  { name: "leftArm", offset: [-0.23, 0.72, 0], scale: [0.1, 0.4, 0.12] },
  { name: "rightArm", offset: [0.23, 0.72, 0], scale: [0.1, 0.4, 0.12] },
  {
    name: "leftSleeve",
    offset: [-0.23, 0.835, 0],
    scale: [0.145, 0.19, 0.155],
  },
  {
    name: "rightSleeve",
    offset: [0.23, 0.835, 0],
    scale: [0.145, 0.19, 0.155],
  },
  {
    name: "leftShoe",
    offset: [-0.095, 0.035, 0.035],
    scale: [0.17, 0.07, 0.26],
  },
  {
    name: "rightShoe",
    offset: [0.095, 0.035, 0.035],
    scale: [0.17, 0.07, 0.26],
  },
  {
    name: "leftEye",
    offset: [-0.066, 1.187, 0.18],
    scale: [0.035, 0.026, 0.017],
  },
  {
    name: "rightEye",
    offset: [0.066, 1.187, 0.18],
    scale: [0.035, 0.026, 0.017],
  },
];

// These are decorative residents, never represented as a live visitor count.
// The final walker has an on-device color chosen by this visitor.
export default function WorldResidents({
  animate,
  visitorColor = 0,
  onHover,
  onCue,
  clock,
}) {
  const meshes = useRef({}),
    greetings = useRef(new Map());
  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 12), []);
  const face = useMemo(() => characterFace().translate(0, -1.235, 0), []);
  const hair = useMemo(() => characterHair().translate(0, -1.235, 0), []);
  const shoe = useMemo(() => roundedBox([1, 1, 1], 0.2), []);
  const shirt = useMemo(
    () => characterShirt(24, 24).translate(0, -0.68, 0),
    [],
  );
  const trousers = useMemo(
    () => new THREE.CylinderGeometry(0.5, 0.47, 1, 14),
    [],
  );
  const fabric = useRoomTexture("fabric", 5);
  const people = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        color:
          i === localWandererIndex
            ? visitorColors[visitorColor]
            : ["#8794ad", "#a6aea0", "#b79d96", "#aaa0ba"][i % 4],
      })),
    [visitorColor],
  );
  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      basis: new THREE.Matrix4(),
      local: new THREE.Matrix4(),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      point: new THREE.Vector3(),
      axis: new THREE.Vector3(1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      direction: new THREE.Vector3(),
      euler: new THREE.Euler(),
    }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      face.dispose();
      hair.dispose();
      shoe.dispose();
      shirt.dispose();
      trousers.dispose();
    },
    [geometry, face, hair, shoe, shirt, trousers],
  );
  useLayoutEffect(() => {
    const color = new THREE.Color();
    for (const name of ["shirt", "leftSleeve", "rightSleeve"]) {
      const mesh = meshes.current[name];
      if (!mesh) continue;
      people.forEach((person, i) =>
        mesh.setColorAt(i, color.set(person.color)),
      );
      mesh.instanceColor.needsUpdate = true;
    }
  }, [people]);
  useFrame((_, dt) => {
    if (animate) clock.elapsed += Math.min(dt, 0.05);
    const time = clock.elapsed;
    people.forEach((person, i) => {
      const { pose, gait, stride } = residentRoutePose(time, i);
      scratch.basis
        .makeBasis(pose.right, pose.normal, pose.forward)
        .setPosition(pose.position);
      const legs = {
        left: residentLeg(gait, stride),
        right: residentLeg(gait + Math.PI, stride),
      };
      for (const part of parts) {
        const mesh = meshes.current[part.name];
        if (!mesh) continue;
        const side = part.name.startsWith("left") ? 1 : -1;
        const armPart =
          part.name.includes("Arm") || part.name.includes("Sleeve");
        const swing = armPart ? -Math.cos(gait) * 0.28 * side * stride : 0;
        scratch.rotation.setFromAxisAngle(scratch.axis, swing);
        scratch.point.set(...part.offset);
        scratch.scale.set(...part.scale);
        const leg = legs[side === 1 ? "left" : "right"];
        if (part.name.includes("Leg")) {
          const a = part.name.includes("Upper") ? leg.hip : leg.knee;
          const b = part.name.includes("Upper") ? leg.knee : leg.ankle;
          scratch.direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          scratch.point.set(
            part.offset[0],
            (a[1] + b[1]) / 2,
            (a[2] + b[2]) / 2,
          );
          scratch.scale.y = scratch.direction.length();
          scratch.rotation.setFromUnitVectors(
            scratch.up,
            scratch.direction.normalize(),
          );
        } else if (part.name.includes("Shoe")) {
          scratch.point.set(part.offset[0], leg.foot[1], leg.foot[2]);
        } else if (armPart) {
          // Swing about the shoulder, rather than orbiting the arm's center.
          const reach = part.name.includes("Sleeve") ? 0.085 : 0.2;
          scratch.point.y = 0.92 - Math.cos(swing) * reach;
          scratch.point.z = -Math.sin(swing) * reach;
          const greeting =
            i === localWandererIndex ? clock.waveAt : greetings.current.get(i);
          if (
            part.name.startsWith("right") &&
            greeting !== undefined &&
            time - greeting < 2.4
          ) {
            const age = time - greeting;
            const envelope =
              THREE.MathUtils.smoothstep(age, 0, 0.25) *
              (1 - THREE.MathUtils.smoothstep(age, 1.85, 2.4));
            const raised = (2.4 + Math.sin(age * 15) * 0.13) * envelope;
            scratch.euler.set(swing * (1 - envelope), 0, raised);
            scratch.rotation.setFromEuler(scratch.euler);
            scratch.point.x = 0.23 + Math.sin(raised) * reach;
            scratch.point.y = 0.92 - Math.cos(raised) * reach;
            scratch.point.z *= 1 - envelope;
          }
        }
        scratch.local.compose(scratch.point, scratch.rotation, scratch.scale);
        scratch.matrix.multiplyMatrices(scratch.basis, scratch.local);
        mesh.setMatrixAt(i, scratch.matrix);
      }
    });
    for (const mesh of Object.values(meshes.current)) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group>
      {parts.map((part) => (
        <instancedMesh
          key={part.name}
          ref={(node) => {
            if (node) meshes.current[part.name] = node;
            else delete meshes.current[part.name];
          }}
          args={[
            part.name === "head"
              ? face
              : part.name === "hair"
                ? hair
                : part.name.includes("Shoe")
                  ? shoe
                  : part.name === "shirt"
                    ? shirt
                    : part.name.includes("Leg")
                      ? trousers
                      : geometry,
            undefined,
            people.length,
          ]}
          frustumCulled={false}
          castShadow
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover?.(
              event.instanceId === people.length - 1
                ? "Your little wanderer. Tap to say hello."
                : "A neighbor out for a walk. Tap to say hello.",
            );
          }}
          onPointerOut={() => onHover?.("")}
          onClick={(event) => {
            event.stopPropagation();
            if (!animate || event.delta > 4 || event.instanceId === undefined)
              return;
            if (event.instanceId === localWandererIndex)
              clock.waveAt = clock.elapsed;
            else greetings.current.set(event.instanceId, clock.elapsed);
            onCue?.("object");
          }}
        >
          <meshStandardMaterial
            map={
              part.name === "shirt" ||
              part.name.includes("Sleeve") ||
              part.name.includes("Leg")
                ? fabric
                : null
            }
            vertexColors={part.name === "head" || part.name === "hair"}
            color={
              part.name === "shirt" ||
              part.name.includes("Sleeve") ||
              part.name === "head" ||
              part.name === "hair"
                ? "white"
                : part.name.includes("Arm") ||
                    part.name.includes("Ear") ||
                    part.name === "nose"
                  ? "#bc937b"
                  : part.name.includes("Eye")
                    ? "#25262b"
                    : part.name.includes("Shoe")
                      ? "#d4d9df"
                      : "#4b5365"
            }
            roughness={0.87}
          />
        </instancedMesh>
      ))}
    </group>
  );
}
