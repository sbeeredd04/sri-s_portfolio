"use client";
import { Suspense, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Box } from "./ScenePrimitives";
import {
  Sign,
  StreetLamp,
  Bench,
  BotanicalPlant,
  PavedWalks,
} from "./StreetFurniture";
import { Model } from "./ModelInstances";
import ProjectDistricts from "./ProjectDistricts";
import TechDistrict from "./TechDistrict";
import Workbench from "./Workbench";
import { Grove } from "./Landscape";
import InteractiveProjectExhibit from "./InteractiveProjectExhibit";
import {
  workshops,
  projectLamps,
  projectIndexPosition,
  projectTownWalks as walks,
} from "../../lib/project-town-layout.mjs";
// One authored studio language: mineral entry portal, graphite shell and oak soffit.
function WorkshopShell() {
  return <Model src="/models/workshop-shell.glb" />;
}
function StudioPlaque({ data, active }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#252a30";
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = "#f2f1ec";
    ctx.font = "500 144px system-ui, sans-serif";
    ctx.fillText(String(data.type + 1).padStart(2, "0"), 24, 151);
    ctx.fillStyle = "#ffb444";
    ctx.fillRect(231, 34, 34, 5);
    ctx.fillStyle = "#f2f1ec";
    ctx.font = "500 45px system-ui, sans-serif";
    ctx.fillText(data.name, 231, 103, 506);
    ctx.fillStyle = "#bec3c6";
    ctx.font = "23px system-ui, sans-serif";
    ctx.fillText(data.caption, 232, 148, 504);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [data.name, data.caption, data.type]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh visible={!active} position={[0, 3.65, 1.566]}>
      <planeGeometry args={[3.12, 0.78]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
function PlainShell() {
  return (
    <>
      <Box
        position={[0, 0.08, 0]}
        size={[3.45, 0.13, 3.2]}
        color="#667280"
        radius={0.025}
      />
      <Box
        position={[0, 1.65, -1.4]}
        size={[3.4, 3.1, 0.16]}
        color="#667283"
        radius={0.02}
      />
    </>
  );
}
function Workshop({
  data,
  detailed,
  night,
  onOpen,
  onHover,
  onVisit,
  active,
  value,
  onExhibitChange,
}) {
  const { position, rotation } = data;
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 4) return;
        if (active) onOpen(data.id);
        else onVisit(data.id);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover(
          active ? `Read the ${data.name} story` : `Step inside ${data.name}`,
          e,
        );
      }}
      onPointerOut={(e) => onHover("", e)}
    >
      <Suspense fallback={<PlainShell />}>
        <WorkshopShell />
      </Suspense>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.65, 1.65, 0.475]} raycast={() => null}>
            <boxGeometry args={[0.07, 3.1, 1.75]} />
            <meshPhysicalMaterial
              color="#d9e2df"
              transparent
              opacity={0.12}
              roughness={0.04}
              metalness={0.1}
              envMapIntensity={0.8}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.438, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 0.055]} />
        <meshStandardMaterial
          color="#d4bc99"
          emissive="#f5c18a"
          emissiveIntensity={night ? 0.5 : 0.1}
          side={2}
        />
      </mesh>
      <StudioPlaque data={data} active={active} />
      {detailed && (
        <InteractiveProjectExhibit
          id={data.id}
          value={value}
          onHover={onHover}
          onChange={(id, next) =>
            active ? onExhibitChange(id, next) : onVisit(id)
          }
        />
      )}
      {detailed && (
        <>
          <BotanicalPlant position={[-1.17, 0.15, 0.72]} scale={0.65} />
          <Box
            position={[1.12, 1.2, 1.54]}
            size={[0.12, 0.035, 0.05]}
            color="#d8dfec"
            metalness={0.8}
          />
        </>
      )}
    </group>
  );
}
export default function ProjectTown({
  detailed,
  animate,
  night,
  onProjectOpen,
  onContentOpen,
  onHover,
  activeProject,
  keynoteIndex,
  exhibitValues,
  onExhibitChange,
  onProjectVisit,
}) {
  return (
    <group>
      <PavedWalks biome="projects" paths={walks} />
      <Grove biome="projects" detailed={detailed} />
      <Workbench
        detailed={detailed}
        night={night}
        onVisit={() => onProjectVisit("workbench")}
        onOpen={onProjectOpen}
        onCollection={() => onContentOpen("work", "workbench")}
        onHover={onHover}
      />
      <ProjectDistricts
        {...{ detailed, night, onProjectOpen, onContentOpen, onHover }}
      />
      <TechDistrict
        {...{
          detailed,
          night,
          animate,
          onContentOpen,
          onProjectOpen,
          onHover,
          activeProject,
          keynoteIndex,
        }}
      />
      {workshops.map((w) => (
        <Workshop
          key={w.id}
          data={w}
          detailed={detailed}
          night={night}
          onOpen={onProjectOpen}
          onHover={onHover}
          active={activeProject === w.id}
          value={exhibitValues[w.id]}
          onExhibitChange={onExhibitChange}
          onVisit={onProjectVisit}
        />
      ))}
      {projectLamps.map((p, i) => (
        <StreetLamp key={i} position={p} night={night} />
      ))}
      <Bench position={[9.5, 0, 6]} rotation={[0, -Math.PI / 2, 0]} />
      <Bench position={[9.5, 0, 3]} rotation={[0, -Math.PI / 2, 0]} />
      <group
        position={projectIndexPosition}
        onClick={(e) => {
          e.stopPropagation();
          onContentOpen("work");
        }}
      >
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.72, 0.85, 0.5, 48]} />
          <meshStandardMaterial
            color="#718396"
            metalness={0.35}
            roughness={0.55}
          />
        </mesh>
        <Sign
          title="Made along the way"
          subtitle="PROJECTS / EXPERIMENTS / HACKATHONS"
          position={[0, 1.1, 0.05]}
          size={[2.8, 1.05]}
        />
      </group>
      {detailed &&
        [-9, 9].map((x) => (
          <BotanicalPlant key={x} position={[x, 0, 5]} scale={1.4} />
        ))}
    </group>
  );
}
