"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { canopySurface, screen, stage } from "../../lib/amphitheatre.mjs";
import { keynoteSlides } from "../../lib/keynote.mjs";
import { drawKeynote } from "../../lib/keynote-drawing.mjs";

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

// A single reusable canvas keeps the stage's memory and upload cost bounded.
function Screens({ animate, index = 0, onProjectOpen, onHover }) {
  const panel = useMemo(
    () => roundedPanel(screen.width, screen.height, 0.35),
    [],
  );
  const font = useMemo(() => getComputedStyle(document.body).fontFamily, []);
  const texture = useMemo(() => {
    const map = canvasTexture(1280, 640, () => {});
    map.generateMipmaps = false;
    map.minFilter = THREE.LinearFilter;
    return map;
  }, []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        fog: false,
      }),
    [texture],
  );
  const clock = useRef({ elapsed: 0, frame: -1 });
  const reduced = useRef(false);
  const draw = (time) => {
    const canvas = texture.image;
    drawKeynote(
      canvas.getContext("2d"),
      canvas.width,
      canvas.height,
      font,
      keynoteSlides[index],
      index,
      time,
    );
    texture.needsUpdate = true;
  };
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduced.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    clock.current = { elapsed: 0, frame: -1 };
    draw(2.2);
  }, [index]);
  useEffect(
    () => () => {
      panel.dispose();
      material.dispose();
      texture.dispose();
    },
    [panel, material, texture],
  );
  useFrame((_, dt) => {
    if (!animate || reduced.current) return;
    const state = clock.current;
    state.elapsed += Math.min(dt, 0.1);
    const frame = Math.floor(state.elapsed * 12);
    if (frame === state.frame) return;
    state.frame = frame;
    draw(state.elapsed);
  });
  const hover = (event) => {
    event.stopPropagation();
    onHover?.(`Read ${keynoteSlides[index].name}`, event, "pointer");
  };
  return (
    <mesh
      geometry={panel}
      material={material}
      position={[screen.x, screen.y, stage.z]}
      rotation={[0, -Math.PI / 2, 0]}
      onPointerOver={hover}
      onPointerMove={hover}
      onPointerOut={(event) => onHover?.("", event)}
      onClick={(event) => {
        event.stopPropagation();
        onProjectOpen?.(keynoteSlides[index].id);
      }}
    />
  );
}

// The white tensile canopy on its masts and edge posts.
function Canopy() {
  const { geometry, posts, masts } = useMemo(() => {
    const s = canopySurface();
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(s.positions, 3),
    );
    g.setIndex(s.indices);
    g.computeVertexNormals();
    return { geometry: g, posts: s.posts, masts: s.masts };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const poles = [
    ...posts.map((p) => ({ ...p, r: 0.09 })),
    ...masts.map((m) => ({ ...m, r: 0.2 })),
  ];
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
          <meshStandardMaterial
            color="#9aa0a6"
            roughness={0.45}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function KeynoteAmphitheatre({
  animate,
  index,
  onProjectOpen,
  onHover,
}) {
  return (
    <group>
      <Screens {...{ animate, index, onProjectOpen, onHover }} />
      <Canopy />
    </group>
  );
}
