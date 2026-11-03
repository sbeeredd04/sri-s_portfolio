"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";
import {
  residentRoutePose,
  localWandererIndex,
} from "../../lib/resident-motion.mjs";
import SoftHuman from "./SoftHuman";

export const visitorColors = ["#a5b7df", "#a4c7b8", "#c4aed4", "#d7b999"];
function Neighbor({ index, color, animate, clock, greetings, onHover, onCue }) {
  const group = useRef(),
    motion = useRef({ speed: 0, waveAge: -100 });
  const scratch = useMemo(
    () => ({ basis: new Matrix4(), previous: new Vector3(), ready: false }),
    [],
  );
  useFrame((_, delta) => {
    const { pose } = residentRoutePose(clock.elapsed, index);
    scratch.basis
      .makeBasis(pose.right, pose.normal, pose.forward)
      .setPosition(pose.position);
    group.current.matrix.copy(scratch.basis);
    group.current.matrixWorldNeedsUpdate = true;
    motion.current.speed =
      animate && scratch.ready
        ? pose.position.distanceTo(scratch.previous) / Math.max(delta, 0.001)
        : 0;
    motion.current.paused = !animate;
    const waveAt =
      index === localWandererIndex
        ? clock.waveAt
        : greetings.current.get(index);
    motion.current.waveAge =
      waveAt === undefined ? -100 : clock.elapsed - waveAt;
    scratch.previous.copy(pose.position);
    scratch.ready = true;
  }, -1);
  return (
    <group
      ref={group}
      matrixAutoUpdate={false}
      onPointerMove={(event) => {
        event.stopPropagation();
        onHover?.(
          index === localWandererIndex
            ? "Your wanderer. Tap to say hello."
            : "A neighbor out for a walk. Tap to say hello.",
          event,
        );
      }}
      onPointerOut={(event) => onHover?.("", event)}
      onClick={(event) => {
        event.stopPropagation();
        if (!animate || event.delta > 4) return;
        if (index === localWandererIndex) clock.waveAt = clock.elapsed;
        else greetings.current.set(index, clock.elapsed);
        onCue?.("object");
      }}
    >
      <SoftHuman
        animate={animate}
        motion={motion}
        color={color}
        variation={index % 6}
        phase={index * 0.73}
      />
    </group>
  );
}
// Decorative neighbors, never represented as a live visitor count. All use the
// same 1.75m authored adult rig as the controllable visitor and Home pedestrians.
export default function WorldResidents({
  animate,
  visitorColor = 0,
  onHover,
  onCue,
  clock,
}) {
  const greetings = useRef(new Map());
  useFrame((_, delta) => {
    if (animate) clock.elapsed += Math.min(delta, 0.05);
  }, -2);
  return (
    <group>
      {Array.from({ length: 11 }, (_, i) => (
        <Neighbor
          key={i}
          index={i}
          color={
            i === localWandererIndex ? visitorColors[visitorColor] : undefined
          }
          animate={animate}
          clock={clock}
          greetings={greetings}
          onHover={onHover}
          onCue={onCue}
        />
      ))}
    </group>
  );
}
