"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { hackathonArt, drawHackathonArt } from "../../lib/hackathon-art.mjs";
import { Box } from "./ScenePrimitives";

export default function HackathonPoster({
  id,
  name,
  position,
  rotation,
  size = [2.1, 1.55],
}) {
  const texture = useMemo(() => {
    const art = hackathonArt[id],
      canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 756;
    const ctx = canvas.getContext("2d"),
      font = getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = "#14202e";
    ctx.fillRect(0, 0, 1024, 756);
    ctx.fillStyle = art.accent;
    ctx.font = `500 25px ${font}`;
    ctx.fillText(art.event, 58, 66);
    ctx.fillStyle = "#e4ecf5";
    ctx.font = `600 66px ${font}`;
    ctx.fillText(name, 56, 156, 910);
    ctx.save();
    ctx.translate(12, 196);
    ctx.scale(1.66, 1.66);
    drawHackathonArt(ctx, art);
    ctx.restore();
    ctx.fillStyle = "#d2deec";
    ctx.font = `500 33px ${font}`;
    ctx.fillText(art.line, 58, 642, 910);
    ctx.fillStyle = "#93a4b8";
    ctx.font = `400 22px ${font}`;
    ctx.fillText("A TEAM EXPLORATION", 58, 706);
    ctx.textAlign = "right";
    ctx.fillText("READ THE STORY  ↗", 966, 706);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [id, name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={position} rotation={rotation}>
      <Box
        size={[size[0] + 0.055, size[1] + 0.055, 0.045]}
        color="#728092"
        radius={0.018}
        metalness={0.65}
        roughness={0.4}
      />
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
