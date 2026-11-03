"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { discover } from "../../lib/discoveries.mjs";
import SoftHuman from "./SoftHuman";
import { adultCourtPose } from "../../lib/soft-human-rig.mjs";

// Compatibility adapter for the existing court choreography. Contact targets
// remain in the exact gameplay frame; only the human mesh/limbs are replaced.
export default function Character({
  position = [0, 0, 0],
  rotation = 0,
  color = "#7184a6",
  seated = false,
  animate = false,
  phase = 0,
  pose: externalPose,
  rightHand,
  interactive = false,
  onHover,
  sport = false,
}) {
  const group = useRef(),
    elapsed = useRef(phase),
    wave = useRef(-100);
  const pose = useRef({}),
    motion = useRef({ speed: 0, waveAge: -100 });
  // CourtPlay already scales its actors1.18; compensate to retain adult1.75m.
  const scale = sport ? 1 / 1.18 : 1;
  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05);
    motion.current.waveAge = elapsed.current - wave.current;
    const source = externalPose?.current;
    if (source) {
      pose.current = adultCourtPose(source, scale);
      if (group.current)
        group.current.position.y = position[1] + (source.hop || 0);
    }
  }, -1);
  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(event) => {
        if (!interactive || !animate || event.delta > 4) return;
        event.stopPropagation();
        wave.current = elapsed.current;
        discover("hello-world");
      }}
      onPointerMove={(event) => {
        if (!interactive || !animate) return;
        event.stopPropagation();
        onHover?.("Say hi to Sri", event);
      }}
      onPointerOut={(event) => {
        if (interactive) onHover?.("", event);
      }}
    >
      <group scale={scale}>
        <SoftHuman
          animate={animate}
          color={color}
          variation={Math.floor(phase) % 6}
          phase={phase}
          seated={seated}
          pose={externalPose ? pose : undefined}
          motion={motion}
          rightHand={rightHand}
        />
      </group>
    </group>
  );
}
