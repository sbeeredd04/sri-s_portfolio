"use client";
import { Suspense, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Box, Boxes, Rods } from "./ScenePrimitives";
import {
  Sign,
  StreetLamp,
  Bench,
  BotanicalPlant,
  PavedWalks,
} from "./StreetFurniture";
import { useRoomTexture } from "./RoomMaterials";
import ProjectDistricts from "./ProjectDistricts";
import FoundryCampus from "./FoundryCampus";
import Workbench from "./Workbench";
import { FinishBox, useFinish } from "./Finishes";
import { Grove } from "./Landscape";
import InteractiveProjectExhibit from "./InteractiveProjectExhibit";
import {
  workshops,
  projectLamps,
  projectIndexPosition,
  projectTownWalks as walks,
} from "../../lib/project-town-layout.mjs";
const facadeSlats = [-1, 1].flatMap((side) =>
  [0, 1, 2, 3, 4].map((i) => ({
    position: [side * 1.66, 0.35 + i * 0.1, -0.6],
    size: [0.03, 0.06, 1.4],
    radius: 0.005,
  })),
);
const roofColor = [
  "#667f98",
  "#6c8298",
  "#6c8298",
  "#877463",
  "#698c91",
  "#81738c",
];
function WorkshopRoof({ type }) {
  const metal = useFinish("roof-metal", roofColor[type], { scale: 0.9 });
  const timber = useFinish("wood-floor", roofColor[type], { scale: 0.6 });
  const arch = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI,
        x = Math.cos(a) * 1.9,
        y = 3.17 + Math.sin(a) * 0.9;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = (i / 40) * Math.PI;
      shape.lineTo(Math.cos(a) * 1.9, 3.09 + Math.sin(a) * 0.9);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 3.65,
      bevelEnabled: false,
      curveSegments: 30,
    });
  }, []);
  useEffect(() => () => arch.dispose(), [arch]);
  if (type === 0 || type === 4)
    return (
      <mesh
        geometry={arch}
        material={metal}
        position={[0, 0, -1.7]}
        castShadow
        receiveShadow
      />
    );
  if (type === 3)
    return (
      <group>
        {[-1, 1].map((side) => (
          <FinishBox
            key={side}
            position={[side * 0.96, 3.5, 0.1]}
            rotation={[0, 0, -side * 0.3]}
            size={[2.08, 0.13, 3.65]}
            material={timber}
            radius={0.018}
          />
        ))}
      </group>
    );
  return (
    <FinishBox
      position={[0, 3.28, 0.1]}
      rotation={[0, 0, type === 1 ? -0.11 : 0]}
      size={[3.8, 0.14, 3.65]}
      material={metal}
      radius={0.025}
    />
  );
}
// Slab, timber back wall and roof: textured shell, plain until maps load.
function WorkshopShell({ type }) {
  const slab = useFinish("concrete", "#7d858d", { scale: 0.45 });
  const cladding = useFinish("wood-floor", "#7c6f63", { scale: 0.55 });
  return (
    <>
      <FinishBox
        position={[0, 0.08, 0]}
        size={[3.45, 0.13, 3.2]}
        material={slab}
        radius={0.025}
      />
      <FinishBox
        position={[0, 1.65, -1.4]}
        size={[3.4, 3.1, 0.16]}
        material={cladding}
      />
      <WorkshopRoof type={type} />
    </>
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
  const wood = useRoomTexture("wood", 2);
  const { position, rotation, color, type } = data;
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
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(
          active ? `Read the ${data.name} story` : `Step inside ${data.name}`,
        );
      }}
      onPointerOut={() => onHover("")}
    >
      <Suspense fallback={<PlainShell />}>
        <WorkshopShell type={type} />
      </Suspense>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.65, 1.65, 0]} raycast={() => null}>
            <boxGeometry args={[0.07, 3.1, 2.8]} />
            <meshPhysicalMaterial
              color="#a9c6db"
              transparent
              opacity={0.2}
              roughness={0.04}
              metalness={0.1}
              envMapIntensity={1.6}
              depthWrite={false}
            />
          </mesh>
          <Rods
            color="#8095a6"
            segments={[-1.3, 0, 1.3].map((z) => ({
              from: [s * 1.65, 0.14, z],
              to: [s * 1.65, 3.18, z],
              radius: 0.022,
            }))}
          />
          <Box
            position={[s * 1.38, 1.5, 1.4]}
            size={[0.065, 2.8, 0.065]}
            color="#a0aeb8"
            metalness={0.8}
            roughness={0.3}
            radius={0.01}
          />
        </group>
      ))}
      <Boxes items={facadeSlats} color="#8a7e70" map={wood} />
      <mesh position={[0, 3.145, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 2.8]} />
        <meshStandardMaterial
          color="#d4bc99"
          emissive="#f5c18a"
          emissiveIntensity={night ? 0.5 : 0.1}
          side={2}
        />
      </mesh>
      <mesh position={[0, 1.65, 1.42]} raycast={() => null}>
        <planeGeometry args={[3.1, 2.85]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.08}
          roughness={0.15}
          metalness={0.15}
          side={2}
          depthWrite={false}
        />
      </mesh>
      <Sign
        visible={!active}
        title={data.name}
        subtitle={data.caption}
        accent={color}
        position={[0, 2.95, 1.91]}
        size={[2.9, 0.65]}
      />
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
  night,
  onProjectOpen,
  onContentOpen,
  onHover,
  activeProject,
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
      <FoundryCampus
        night={night}
        onContentOpen={onContentOpen}
        onProjectOpen={onProjectOpen}
        onHover={onHover}
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
