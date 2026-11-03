"use client";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildMadeGallery,
  madeGalleryLayout,
  madeGalleryStories,
} from "../../lib/made-gallery.mjs";
import { projectExhibits } from "../../lib/project-exhibits.mjs";
import InteractiveProjectExhibit from "./InteractiveProjectExhibit";
import { Sign } from "./StreetFurniture";

function paragraph(ctx, text, x, y, width, lineHeight) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else line = next;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function useProjectBoard(id) {
  const invalidate = useThree((s) => s.invalidate);
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 680;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useLayoutEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive) return;
      const ctx = map.image.getContext("2d"),
        story = madeGalleryStories[id],
        exhibit = projectExhibits[id];
      const font = getComputedStyle(document.body).fontFamily;
      ctx.fillStyle = "#eee3cc";
      ctx.fillRect(0, 0, 640, 680);
      ctx.fillStyle = "#596150";
      ctx.font = `500 17px ${font}`;
      let y = paragraph(ctx, story.category, 38, 45, 564, 25) + 26;
      ctx.fillStyle = "#273c33";
      ctx.font = `500 40px ${font}`;
      y = paragraph(ctx, story.name, 36, y, 568, 48) + 20;
      ctx.font = `25px ${font}`;
      y = paragraph(ctx, story.summary, 38, y, 564, 35) + 24;
      ctx.fillStyle = "#c2b49a";
      ctx.fillRect(38, y, 564, 2);
      y += 40;
      exhibit.steps.forEach((step, i) => {
        ctx.fillStyle = "#8a6947";
        ctx.font = `20px ${font}`;
        ctx.fillText(`0${i + 1}`, 38, y);
        ctx.fillStyle = "#273c33";
        ctx.font = `500 23px ${font}`;
        paragraph(ctx, step.label, 88, y, 510, 29);
        y += 52;
      });
      ctx.fillStyle = "#5c674f";
      ctx.font = `22px ${font}`;
      ctx.fillText("Read the project story ↗", 38, 638);
      map.needsUpdate = true;
      invalidate();
    };
    paint();
    document.fonts.ready.then(paint);
    return () => {
      alive = false;
    };
  }, [id, map, invalidate]);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

export default function MadeStudioGallery({
  site,
  night,
  value,
  onChange,
  onHover,
  onProjectOpen,
}) {
  const built = useMemo(() => buildMadeGallery(site), [site]);
  const layout = madeGalleryLayout(site),
    story = madeGalleryStories[site.id],
    map = useProjectBoard(site.id);
  useEffect(
    () => () => Object.values(built).forEach((g) => g.dispose()),
    [built],
  );
  const open = (e) => {
    e.stopPropagation();
    if (e.delta <= 4) onProjectOpen(site.id);
  };
  const hover = (e) => {
    e.stopPropagation();
    onHover?.(`Read ${story.name}`, e, "pointer");
  };
  return (
    <group position={site.center} rotation={[0, site.yaw, 0]}>
      {["wood", "metal", "paper"].map((key) => (
        <mesh key={key} geometry={built[key]} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            roughness={key === "metal" ? 0.43 : 0.83}
            metalness={key === "metal" ? 0.4 : 0}
          />
        </mesh>
      ))}
      <mesh geometry={built.light} raycast={() => null}>
        <meshStandardMaterial
          vertexColors
          emissive="#ffcc88"
          emissiveIntensity={night ? 1.1 : 0.12}
        />
      </mesh>
      <Sign
        title={story.name}
        subtitle={story.category}
        position={layout.identity}
        size={[3.4, 0.58]}
        background="#263b32"
        foreground="#eee0c4"
        secondary="#cabda1"
        accent={story.accent}
        onClick={open}
        onPointerMove={hover}
        onPointerOut={(e) => onHover?.("", e)}
      />
      <mesh
        position={[layout.board[0], layout.board[1], layout.board[2] + 0.011]}
        onClick={open}
        onPointerMove={hover}
        onPointerOut={(e) => onHover?.("", e)}
      >
        <planeGeometry args={layout.boardSize} />
        <meshStandardMaterial map={map} roughness={0.92} />
      </mesh>
      <group position={layout.exhibit}>
        <InteractiveProjectExhibit
          id={site.id}
          value={value}
          onChange={onChange}
          onHover={onHover}
        />
      </group>
    </group>
  );
}
