"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { madeCampus } from "../../lib/made-campus-data.mjs";
import { madeSites } from "../../lib/made-campus-views.mjs";
import { projectExhibits } from "../../lib/project-exhibits.mjs";
import { keynoteSlides } from "../../lib/keynote.mjs";
import { drawKeynote } from "../../lib/keynote-drawing.mjs";
import MadeStudioGallery from "./MadeStudioGallery";
import { AetherShowroom } from "./MadeVisitCanvas";

const targets = [
  [/^Agentex_(?!Approach)/i, "agentex", "Agentex"],
  [/^GitCue_(?!Approach)/i, "gitcue", "GitCue"],
  [/^Mesa_(?!Approach)/i, "mesa", "Mesa"],
  [/^csDNA_(?!Approach)/i, "csdna", "csDNA"],
  [/^SoDA_(?!Approach)/i, "soda", "SoDA"],
  [/^(Made_Hall_|Made_HackathonHall)/, "hackathons", "Hackathon hall"],
  [/^Made_Mobile(?!_Approach)/, "mobile", "iPhone studio"],
  [/^Made_PierHouse/, "workbench", "The workbench"],
  [/^(Made_SetScreen|Made_FilmSet|Made_Crane)/, "keynote", "Keynote stage"],
  [/^Made_Tools/, "tools", "Tools of the trade"],
];
function targetOf(node) {
  for (let n = node; n; n = n.parent) {
    const match = targets.find(([pattern]) => pattern.test(n.name));
    if (match) return match;
  }
  return null;
}
function CampusKeynote({ index, onProjectOpen, onHover }) {
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 580;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const slide = keynoteSlides[index] || keynoteSlides[0];
  useEffect(() => {
    drawKeynote(
      texture.image.getContext("2d"),
      1024,
      580,
      getComputedStyle(document.body).fontFamily,
      slide,
      index,
    );
    texture.needsUpdate = true;
    invalidate();
  }, [texture, slide, index, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  const [x, y, z] = madeCampus.anchors.Made_KeynoteDisplayAnchor;
  return (
    <mesh
      position={[x, y, z + 0.038]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 4) onProjectOpen(slide.id);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover?.(`Read ${slide.name}`, e, "pointer");
      }}
      onPointerOut={(e) => onHover?.("", e)}
    >
      <planeGeometry args={[5.95, 3.36]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
export default function MadeCampusRegion({
  activeProject,
  detailed,
  animate,
  night,
  onVisit,
  onWorld,
  onProjectOpen,
  onHover,
  keynoteIndex,
  exhibitValues,
  onExhibitChange,
}) {
  const { scene } = useGLTF(madeCampus.source);
  const door = useRef(activeProject === "aether" ? 1 : 0);
  const beacon = useRef();
  const model = useMemo(() => {
    const root = scene.clone(true),
      materials = new Map();
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.material = Array.isArray(o.material)
        ? o.material.map(prepare)
        : prepare(o.material);
      const glass =
        /glaz|glass/i.test(o.name) || /glass/i.test(o.material.name);
      if (o.name === "Agentex_Glazing") {
        const glazing = o.material.clone();
        glazing.opacity = 0.22;
        glazing.color.set("#b3aba0");
        glazing.roughness = 0.24;
        materials.set(o, glazing);
        o.material = glazing;
      }
      o.castShadow = !glass;
      o.receiveShadow = !glass;
      // The authored lamp combines its metal housing and warm bulb in one
      // mesh. Emit only its warm, pale bulb vertices; keep the pole matte.
      if (/Made_.*Lamp_/.test(o.name)) {
        const lamp = o.material.clone();
        lamp.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
             float bulbMask = step(.65, vColor.r) * step(.55, vColor.g) *
               step(.18, vColor.r-vColor.b);
             totalEmissiveRadiance += vec3(1.,.48,.12)*bulbMask*1.8;`
          );
        };
        lamp.customProgramCacheKey = () => "made-lantern-bulb-v1";
        materials.set(o, lamp);
        o.material = lamp;
      }
      function prepare(original) {
        if (materials.has(original)) return materials.get(original);
        const m = original.clone();
        m.envMapIntensity = 0.45;
        if (/glass/i.test(m.name)) {
          m.transmission = 0;
          m.transparent = true;
          m.opacity = 0.42;
          m.color.set("#657e79");
          m.roughness = 0.16;
          m.depthWrite = false;
        }
        materials.set(original, m);
        return m;
      }
    });
    return { root, materials: [...materials.values()] };
  }, [scene]);
  useEffect(() => () => model.materials.forEach((m) => m.dispose()), [model]);
  useFrame(({ clock }, dt) => {
    const open = activeProject === "aether" ? 1 : 0;
    door.current = animate
      ? THREE.MathUtils.damp(door.current, open, 7, Math.min(0.05, dt))
      : open;
    if (beacon.current)
      beacon.current.emissiveIntensity = night
        ? 1.4 + (animate ? 0.7 * Math.sin(clock.elapsedTime * 1.55) : 0)
        : 0.18;
  });
  return (
    <group>
      <primitive
        object={model.root}
        onClick={(e) => {
          if (e.delta > 4) return;
          const hit = targetOf(e.object);
          if (!hit) return;
          e.stopPropagation();
          if (activeProject === hit[1] && projectExhibits[hit[1]])
            onProjectOpen(hit[1]);
          else onVisit(hit[1]);
        }}
        onPointerMove={(e) => {
          if (!detailed) return;
          const hit = targetOf(e.object);
          if (hit) {
            e.stopPropagation();
            onHover?.(hit[2], e, "pointer");
          }
        }}
        onPointerOut={(e) => onHover?.("", e)}
      />
      <group
        onClick={(e) => {
          if (e.delta <= 4) {
            e.stopPropagation();
            onVisit("aether");
          }
        }}
      >
        <AetherShowroom
          door={door}
          fill={false}
          showExhibit={detailed}
          onEnter={() => onVisit("aether")}
          value={exhibitValues.aether}
          onValue={(next) => onExhibitChange("aether", next)}
        />
      </group>
      {madeSites.filter(site=>site.id!=="aether"&&projectExhibits[site.id]).map(site=><MadeStudioGallery
        key={site.id} site={site} night={night} value={exhibitValues[site.id]}
        onChange={onExhibitChange} onHover={onHover} onProjectOpen={onProjectOpen}
      />)}
      {activeProject === "keynote" && (
        <CampusKeynote index={keynoteIndex} {...{ onProjectOpen, onHover }} />
      )}
      <mesh
        position={madeCampus.anchors.Made_TowerBeaconAnchor}
        raycast={() => null}
      >
        <sphereGeometry args={[0.17, 8, 6]} />
        <meshStandardMaterial
          ref={beacon}
          color="#edbd7c"
          emissive="#ffad42"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
