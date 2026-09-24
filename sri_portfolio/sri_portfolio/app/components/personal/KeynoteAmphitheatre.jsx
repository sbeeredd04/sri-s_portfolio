"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  canopySurface,
  screen,
  sideScreens,
  stage,
} from "../../lib/amphitheatre.mjs";
import { projects } from "../../json/personal";

export function canvasTexture(width, height, draw) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  draw(
    c.getContext("2d"),
    width,
    height,
    getComputedStyle(document.body).fontFamily,
  );
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// One keynote slide per project: category, name, a short line and stack.
function drawSlide(x, w, h, font, project, index, total) {
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0d1420");
  g.addColorStop(1, "#1b2740");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#ffae98";
  x.fillRect(80, 120, 60, 6);
  x.font = `500 30px ${font}`;
  x.fillStyle = "#9fb3cc";
  x.fillText(project.category || "PROJECT", 80, 190, w - 160);
  x.font = `600 150px ${font}`;
  x.fillStyle = "#f4f1ea";
  x.fillText(project.name, 74, 350, w - 160);
  x.font = `400 38px ${font}`;
  x.fillStyle = "#c8d2de";
  const words = (project.description || "").split(" ");
  let line = "",
    y = 440;
  for (const word of words) {
    if (x.measureText(line + word).width > w - 180 && line) {
      x.fillText(line, 80, y);
      line = "";
      y += 54;
      if (y > 560) break;
    }
    line += word + " ";
  }
  if (y <= 560) x.fillText(line, 80, y);
  x.font = `500 26px ${font}`;
  x.fillStyle = "#7f8ea3";
  x.fillText(
    `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    80,
    h - 60,
  );
  x.fillText((project.stack || []).join("  ·  "), 260, h - 60, w - 340);
}

// A rounded-corner panel whose UVs span the whole rectangle.
function roundedPanel(width, height, radius) {
  const s = new THREE.Shape();
  const w = width / 2,
    h = height / 2;
  s.moveTo(-w + radius, -h);
  s.lineTo(w - radius, -h);
  s.quadraticCurveTo(w, -h, w, -h + radius);
  s.lineTo(w, h - radius);
  s.quadraticCurveTo(w, h, w - radius, h);
  s.lineTo(-w + radius, h);
  s.quadraticCurveTo(-w, h, -w, h - radius);
  s.lineTo(-w, -h + radius);
  s.quadraticCurveTo(-w, -h, -w + radius, -h);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++)
    uv.setXY(i, (p.getX(i) + w) / width, (p.getY(i) + h) / height);
  return g;
}

// The big screen and both side screens share one material, so the slide
// changes everywhere at once. A click opens whichever project is up.
function Screens({ animate, onProjectOpen }) {
  const slides = useMemo(
    () =>
      projects.map((p, i) =>
        canvasTexture(1280, 640, (x, w, h, font) =>
          drawSlide(x, w, h, font, p, i, projects.length),
        ),
      ),
    [],
  );
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: slides[0], toneMapped: false }),
    [slides],
  );
  const panel = useMemo(
    () => roundedPanel(screen.width, screen.height, 0.9),
    [],
  );
  useEffect(
    () => () => {
      slides.forEach((t) => t.dispose());
      material.dispose();
      panel.dispose();
    },
    [slides, material, panel],
  );
  const state = useRef({ index: 0, clock: 0 });
  useFrame((_, dt) => {
    if (!animate) return;
    const s = state.current;
    s.clock += Math.min(dt, 0.1);
    if (s.clock < 7) return;
    s.clock = 0;
    s.index = (s.index + 1) % slides.length;
    material.map = slides[s.index];
  });
  const open = (e) => {
    e.stopPropagation();
    onProjectOpen?.(projects[state.current.index].id);
  };
  return (
    <group onClick={open}>
      <mesh
        geometry={panel}
        material={material}
        position={[screen.x, screen.y, stage.z]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {sideScreens.map((s) => (
        <mesh
          key={s.z}
          material={material}
          position={[s.x, s.y, s.z]}
          rotation={[0, s.yaw, 0]}
        >
          <planeGeometry args={[s.width, s.height]} />
        </mesh>
      ))}
    </group>
  );
}

// The white tensile canopy on its masts and edge posts.
function Canopy() {
  const { geometry, posts, masts } = useMemo(() => {
    const s = canopySurface();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(s.positions, 3));
    g.setIndex(s.indices);
    g.computeVertexNormals();
    return { geometry: g, posts: s.posts, masts: s.masts };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const poles = [...posts.map((p) => ({ ...p, r: 0.09 })), ...masts.map((m) => ({ ...m, r: 0.2 }))];
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f4f2ec"
          roughness={0.62}
          side={THREE.DoubleSide}
        />
      </mesh>
      {poles.map((p) => (
        <mesh
          key={`${p.x},${p.z}`}
          // Footed below grade: the east edge sits where the ground falls away.
          position={[p.x, (p.height - 1.2) / 2, p.z]}
          castShadow
        >
          <cylinderGeometry args={[p.r, p.r * 1.25, p.height + 1.2, 8]} />
          <meshStandardMaterial color="#9aa0a6" roughness={0.45} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function KeynoteAmphitheatre({ animate, onProjectOpen }) {
  return (
    <group>
      <Screens animate={animate} onProjectOpen={onProjectOpen} />
      <Canopy />
    </group>
  );
}
