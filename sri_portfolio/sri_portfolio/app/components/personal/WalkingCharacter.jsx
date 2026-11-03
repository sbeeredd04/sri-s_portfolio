"use client";
import SoftHuman from "./SoftHuman";
// Legacy entry points share the same adult asset and speed-driven gait.
export default function WalkingCharacter({ motion, color = "#7184a6" }) {
  return <SoftHuman motion={motion} color={color} animate />;
}
