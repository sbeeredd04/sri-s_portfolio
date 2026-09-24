"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import CityMesh from "./CityMesh";
import Crowd from "./Crowd";
import KeynoteAmphitheatre, { canvasTexture } from "./KeynoteAmphitheatre";
import { useQuality } from "./Quality";
import { buildTechDistrict } from "../../lib/tech-buildings.mjs";
import {
  audience,
  booths,
  browsers,
  strollers,
  techPalms,
  tools,
} from "../../lib/tech-plan.mjs";
import { speaker, standHeight } from "../../lib/amphitheatre.mjs";
import { pylonLogos } from "../../lib/official-logos.mjs";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { projects } from "../../json/personal";

// Feet land on the tiers, on the stage, and on the ground elsewhere.
const ground = (x, z) => surfaceHeight("projects", x, z) + standHeight(x, z);

function Booth({ booth, project, onOpen }) {
  const [header, screen] = useMemo(
    () => [
      canvasTexture(1024, 146, (x, w, h, font) => {
        x.fillStyle = "#e6e3dd";
        x.fillRect(0, 0, w, h);
        let size = 84;
        do x.font = `600 ${size}px ${font}`;
        while (x.measureText(project.name).width > w - 80 && (size -= 4) > 40);
        x.fillStyle = "#1d2127";
        x.textAlign = "center";
        x.fillText(project.name, w / 2, 73 + size * 0.34, w - 60);
      }),
      canvasTexture(768, 512, (x, w, h, font) => {
        x.fillStyle = "#141a24";
        x.fillRect(0, 0, w, h);
        x.fillStyle = "#ffae98";
        x.fillRect(56, 70, 44, 5);
        x.font = `500 30px ${font}`;
        x.fillStyle = "#9fb3cc";
        x.fillText(project.category || "", 56, 130, w - 112);
        x.font = `600 88px ${font}`;
        x.fillStyle = "#f4f1ea";
        x.fillText(project.name, 52, 250, w - 104);
        x.font = `400 30px ${font}`;
        x.fillStyle = "#8d9bb0";
        x.fillText(
          (project.stack || []).slice(0, 3).join("  ·  "),
          56,
          330,
          w - 112,
        );
        x.fillText(project.year || "", 56, h - 60);
      }),
    ],
    [project],
  );
  useEffect(
    () => () => {
      header.dispose();
      screen.dispose();
    },
    [header, screen],
  );
  const { x, z, depth: d } = booth;
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(project.id);
      }}
    >
      <mesh position={[0, 2.75, -d / 2 + 0.235]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.7, 0.385]} />
        <meshStandardMaterial map={header} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, d / 2 - 0.125]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.2, 1.47]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Loads an official SVG or raster as an image with its true aspect ratio.
async function loadLogo(src) {
  let url = src,
    aspect = null;
  if (src.endsWith(".svg")) {
    const text = await (await fetch(src)).text();
    const box = text.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number);
    if (box?.length === 4) aspect = box[2] / box[3];
    url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  }
  const img = new Image();
  img.src = url;
  await img.decode();
  if (url !== src) URL.revokeObjectURL(url);
  return { img, aspect: aspect || img.naturalWidth / img.naturalHeight };
}

function drawPylon(x, w, h, font, tool, logo) {
  x.clearRect(0, 0, w, h);
  x.fillStyle = "#22262c";
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#ffae98";
  x.fillRect(48, 96, 40, 5);
  const mark = pylonLogos[tool.id];
  let nameAt = 250;
  if (logo) {
    // A lockup spans the face; a bare mark sits above the name.
    const maxW = mark.lockup ? w - 96 : 150,
      maxH = mark.lockup ? 110 : 112;
    const lw = Math.min(maxW, maxH * logo.aspect),
      lh = lw / logo.aspect;
    x.drawImage(logo.img, 48, mark.lockup ? 250 - lh : 130, lw, lh);
    nameAt = mark.lockup ? 0 : 130 + lh + 90;
  }
  if (nameAt) {
    x.font = `600 ${tool.name.length > 7 ? 84 : 100}px ${font}`;
    x.fillStyle = "#f2efe9";
    x.fillText(tool.name, 44, nameAt, w - 88);
  }
  x.font = `400 34px ${font}`;
  x.fillStyle = "#aab4c2";
  let line = "",
    y = Math.max(330, nameAt + 80);
  for (const word of tool.role.split(" ")) {
    if (x.measureText(line + word).width > w - 100 && line) {
      x.fillText(line, 48, y);
      line = "";
      y += 46;
    }
    line += word + " ";
  }
  x.fillText(line, 48, y);
}

function ToolPylon({ tool, onOpen }) {
  const invalidate = useThree((s) => s.invalidate);
  const font = useRef("");
  const texture = useMemo(
    () =>
      canvasTexture(512, 768, (x, w, h, f) => {
        font.current = f;
        // Until its mark arrives, a tool with a logo waits on a quiet face.
        drawPylon(x, w, h, f, pylonLogos[tool.id] ? { ...tool, name: "" } : tool, null);
      }),
    [tool],
  );
  useEffect(() => {
    const mark = pylonLogos[tool.id];
    if (!mark) return;
    let live = true;
    const paint = (logo) => {
      if (!live) return;
      const c = texture.image;
      drawPylon(c.getContext("2d"), c.width, c.height, font.current, tool, logo);
      texture.needsUpdate = true;
      invalidate();
    };
    loadLogo(mark.src).then(paint, () => paint(null));
    return () => {
      live = false;
    };
  }, [tool, texture, invalidate]);
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
  const agents = useMemo(
    () => [
      speaker,
      ...audience(tier),
      ...browsers(tier),
      ...strollers(tier),
    ],
    [tier],
  );
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
      <KeynoteAmphitheatre animate={animate} onProjectOpen={onProjectOpen} />
      {booths.map((booth, i) =>
        projects[i] ? (
          <Booth
            key={i}
            booth={booth}
            project={projects[i]}
            onOpen={onProjectOpen}
          />
        ) : null,
      )}
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
