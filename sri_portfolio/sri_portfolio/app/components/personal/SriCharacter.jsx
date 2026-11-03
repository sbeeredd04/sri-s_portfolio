"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import SoftHuman from "./SoftHuman";
import { discover } from "../../lib/discoveries.mjs";
import { typingWrists } from "../../lib/character-motion.mjs";
import { studioCharacter, studioSri, studioSurfaces } from "../../lib/studio-layout.mjs";

// Sri uses the same metre-scale, softly faceted adult as everyone in the bay.
// Preserve the typing and hello interactions without loading a second body style.
export default function SriCharacter({
  position = [0, 0, 0], rotation = 0, clip = "idle", animate = false,
  interactive = false, onHover, shirt = "#2c3a4f",
}) {
  const elapsed = useRef(0), waveAt = useRef(-100);
  const seated = clip === "typing" || clip === "sit";
  const pose = useRef({});
  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    if (clip === "typing") {
      const wrists = typingWrists(t);
      pose.current = Object.fromEntries(Object.entries(wrists).map(([side, p]) => [side, [
        p[0], p[1] + studioCharacter.position[1] - studioSri.position[1],
        studioSri.position[2] - studioSurfaces.keyboard.position[2],
      ]]));
    } else pose.current = {};
    const age = t - waveAt.current;
    const weight = MathUtils.smoothstep(age, 0, .3) * (1 - MathUtils.smoothstep(age, 1.7, 2.3));
    if (weight > 0) {
      const rest = pose.current.right || [.35, seated ? .8 : .96, .08];
      const hello = [.57 + Math.sin(age * 15) * .045, seated ? 1.28 : 1.7, .12];
      pose.current.right = rest.map((n, i) => MathUtils.lerp(n, hello[i], weight));
    }
  }, -1);
  return (
    <group position={position} rotation={[0, rotation, 0]}
      onClick={interactive ? (event) => {
        if (!animate || event.delta > 4) return;
        event.stopPropagation(); waveAt.current = elapsed.current; discover("hello-world");
      } : undefined}
      onPointerMove={interactive ? (event) => {
        event.stopPropagation(); onHover?.("Say hi to Sri", event);
      } : undefined}
      onPointerOut={interactive ? (event) => onHover?.("", event) : undefined}
    >
      <SoftHuman animate={animate} color={shirt} variation={1} seated={seated}
        seatHeight={studioSurfaces.chairSeat.position[1] + studioSurfaces.chairSeat.size[1] / 2}
        pose={pose} />
    </group>
  );
}
