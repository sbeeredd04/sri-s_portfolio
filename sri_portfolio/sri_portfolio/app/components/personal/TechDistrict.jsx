"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import CityMesh from "./CityMesh";
import Crowd from "./Crowd";
import { useQuality } from "./Quality";
import { buildTechDistrict } from "../../lib/tech-buildings.mjs";
import {
  audience,
  hall,
  hallBounds,
  strollers,
  techPalms,
  tools,
} from "../../lib/tech-plan.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { projects } from "../../json/personal";

const HALL_FLOOR = 0.03;
const ground = (x, z) =>
  surfaceHeight("projects", x, z) +
  (x > hallBounds.x0 &&
  x < hallBounds.x1 &&
  z > hallBounds.z0 &&
  z < hallBounds.z1
    ? HALL_FLOOR
    : 0);

function canvasTexture(width, height, draw) {
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

// The keynote screen cycles through the projects, one slide at a time.
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

function KeynoteScreen({ animate, onProjectOpen }) {
  const slides = useMemo(
    () =>
      projects.map((p, i) =>
        canvasTexture(1280, 640, (x, w, h, font) =>
          drawSlide(x, w, h, font, p, i, projects.length),
        ),
      ),
    [],
  );
  useEffect(() => () => slides.forEach((t) => t.dispose()), [slides]);
  const material = useRef();
  const state = useRef({ index: 0, clock: 0 });
  useFrame((_, dt) => {
    if (!animate || !material.current) return;
    const s = state.current;
    s.clock += Math.min(dt, 0.1);
    if (s.clock < 7) return;
    s.clock = 0;
    s.index = (s.index + 1) % slides.length;
    material.current.map = slides[s.index];
  });
  const sc = hall.screen;
  return (
    <mesh
      position={[hallBounds.x1 - hall.wall - 0.4, sc.y, hall.z]}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onProjectOpen?.(projects[state.current.index].id);
      }}
    >
      <planeGeometry args={[sc.width, sc.height]} />
      <meshBasicMaterial ref={material} map={slides[0]} toneMapped={false} />
    </mesh>
  );
}

function ToolPylon({ tool, onOpen }) {
  const texture = useMemo(
    () =>
      canvasTexture(512, 768, (x, w, h, font) => {
        x.fillStyle = "#22262c";
        x.fillRect(0, 0, w, h);
        x.fillStyle = "#ffae98";
        x.fillRect(48, 96, 40, 5);
        x.font = `600 ${tool.name.length > 7 ? 84 : 100}px ${font}`;
        x.fillStyle = "#f2efe9";
        x.fillText(tool.name, 44, 250, w - 88);
        x.font = `400 34px ${font}`;
        x.fillStyle = "#aab4c2";
        const words = tool.role.split(" ");
        let line = "",
          y = 330;
        for (const word of words) {
          if (x.measureText(line + word).width > w - 100 && line) {
            x.fillText(line, 48, y);
            line = "";
            y += 46;
          }
          line += word + " ";
        }
        x.fillText(line, 48, y);
      }),
    [tool],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group
      position={[tool.x, 0, tool.z]}
      rotation={[0, tool.yaw, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
    >
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[0, 1.55, side * 0.152]}
          rotation={[0, side > 0 ? 0 : Math.PI, 0]}
        >
          <planeGeometry args={[1.6, 2.4]} />
          <meshStandardMaterial map={texture} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// A Mexican fan palm: a tall, slightly leaning trunk and a crown of fronds.
function palmGeometries() {
  const trunk = new THREE.CylinderGeometry(0.13, 0.22, 7.5, 7, 8, true);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + 3.75;
    p.setY(i, y);
    p.setX(i, p.getX(i) + (y / 7.5) ** 2 * 0.45);
  }
  trunk.computeVertexNormals();
  const fronds = [];
  for (let i = 0; i < 12; i++) {
    const f = new THREE.PlaneGeometry(0.55, 2.3, 1, 5);
    const fp = f.attributes.position;
    for (let k = 0; k < fp.count; k++) {
      const along = (fp.getY(k) + 1.15) / 2.3;
      fp.setZ(k, -along * 2.1);
      fp.setY(k, Math.sin(along * Math.PI * 0.8) * 0.7 - along * along * 1.1);
      fp.setX(k, fp.getX(k) * (1 - along * 0.6));
    }
    f.rotateY((i / 12) * Math.PI * 2 + (i % 2) * 0.2);
    f.translate(0.45, 7.45, 0);
    fronds.push(f);
  }
  const crown = mergeGeometries(fronds);
  crown.computeVertexNormals();
  fronds.forEach((f) => f.dispose());
  return { trunk, crown };
}

function Palms() {
  const palms = useMemo(techPalms, []);
  const geo = useMemo(palmGeometries, []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  const refs = [useRef(), useRef()];
  useEffect(() => {
    const o = new THREE.Object3D();
    palms.forEach((palm, i) => {
      o.position.set(palm.x, surfaceHeight("projects", palm.x, palm.z), palm.z);
      o.rotation.set(0, (palm.x * 1.7 + palm.z) % (Math.PI * 2), 0);
      o.scale.setScalar(palm.s);
      o.updateMatrix();
      for (const r of refs) r.current?.setMatrixAt(i, o.matrix);
    });
    for (const r of refs) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  });
  return (
    <>
      <instancedMesh
        ref={refs[0]}
        args={[geo.trunk, undefined, palms.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#7b6a55" roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        ref={refs[1]}
        args={[geo.crown, undefined, palms.length]}
        castShadow
      >
        <meshStandardMaterial
          color="#5f7a3e"
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </>
  );
}

function DistrictCrowd({ animate }) {
  const { tier } = useQuality();
  const agents = useMemo(() => [...audience(tier), ...strollers(tier)], [tier]);
  return (
    <Crowd
      src="/models/characters/crowd.glb"
      agents={agents}
      ground={ground}
      animate={animate}
    />
  );
}

export default function TechDistrict({
  detailed,
  night,
  animate,
  onContentOpen,
  onProjectOpen,
}) {
  const geometries = useMemo(buildTechDistrict, []);
  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries],
  );
  return (
    <group>
      <Suspense fallback={null}>
        {Object.entries(geometries).map(([tone, geometry]) => (
          <CityMesh key={tone} {...{ tone, geometry, night }} />
        ))}
      </Suspense>
      <KeynoteScreen animate={animate} onProjectOpen={onProjectOpen} />
      {tools.map((tool) => (
        <ToolPylon
          key={tool.id}
          tool={tool}
          onOpen={() => onContentOpen?.("skills")}
        />
      ))}
      <Palms />
      {detailed && (
        <Suspense fallback={null}>
          <DistrictCrowd animate={animate} />
        </Suspense>
      )}
    </group>
  );
}
