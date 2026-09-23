"use client";
import { useEffect, useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { Sign, StreetLamp } from "./StreetFurniture";
import { Box, Rod } from "./ScenePrimitives";
import { LoungeChair } from "./ListeningFurniture";
import { useRoomTexture } from "./RoomMaterials";
import {
  fieldnotesLounge,
  fieldnotesLoungeScale,
  fieldnotesLamp,
  fieldnotesDeskLamp,
  fieldnotesSignPoses,
} from "../../lib/fieldnotes-layout.mjs";
import {
  buildFieldnotesGeometry,
  disposeFieldnotes,
} from "../../lib/fieldnotes-geometry.mjs";

export default function FutureStudio({
  detailed,
  night,
  animate,
  onStopSelect,
  stop,
  onContentOpen,
  onHover,
  onCue,
}) {
  const wood = useRoomTexture("walnut");
  const stone = useRoomTexture("stone", 3);
  const charred = useRoomTexture("charred", 2);
  const built = useMemo(() => buildFieldnotesGeometry(), []);
  const materials = useMemo(
    () => ({
      stone: new MeshStandardMaterial({
        color: "#b9aa91",
        bumpMap: stone,
        bumpScale: 0.0008,
        roughness: 0.94,
      }),
      paving: new MeshStandardMaterial({
        color: "#8b8172",
        bumpMap: stone,
        bumpScale: 0.0008,
        roughness: 0.95,
      }),
      timber: new MeshStandardMaterial({
        color: "#c4a07a",
        map: wood,
        roughness: 0.62,
      }),
      charcoal: new MeshStandardMaterial({
        color: "#393a35",
        map: charred,
        roughness: 0.82,
      }),
      copper: new MeshStandardMaterial({
        color: "#7e9b90",
        roughness: 0.42,
        metalness: 0.72,
      }),
      ivory: new MeshStandardMaterial({ color: "#f4f0e6", roughness: 0.9 }),
      garden: new MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.92,
        vertexColors: true,
      }),
    }),
    [wood, stone, charred],
  );
  useEffect(() => () => disposeFieldnotes(built), [built]);
  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose();
    },
    [materials],
  );
  const signs = fieldnotesSignPoses();
  function open(destination, content) {
    return (event) => {
      event.stopPropagation();
      if (event.delta > 4) return;
      onCue?.("open");
      if (stop === destination) onContentOpen(content);
      else onStopSelect(destination);
    };
  }
  function shell(geometry, material) {
    return (
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    );
  }
  return (
    <group>
      {shell(built.paving, materials.paving)}
      {shell(built.terraces, materials.paving)}
      {shell(built.stone, materials.stone)}
      {shell(built.timber, materials.charcoal)}
      {shell(built.charcoal, materials.charcoal)}
      {shell(built.copper, materials.copper)}
      {shell(built.garden, materials.garden)}
      <StreetLamp
        position={fieldnotesLamp.position}
        scale={fieldnotesLamp.scale}
        night={night}
      />
      <group
        onClick={open("writing", "writing")}
        onPointerOver={() => onHover?.("The writing studio · coming soon")}
        onPointerOut={() => onHover?.("")}
      >
        {shell(built.desk, materials.timber)}
        {shell(built.chair, materials.charcoal)}
        {shell(built.pages, materials.ivory)}
        <Box
          position={fieldnotesDeskLamp.base}
          size={[0.18, 0.018, 0.13]}
          color="#555148"
          radius={0.008}
        />
        <Rod
          from={fieldnotesDeskLamp.base}
          to={[-1.62, 1.31, 3.5]}
          radius={0.012}
          color="#8f8769"
        />
        <Rod
          from={[-1.62, 1.31, 3.5]}
          to={[-1.73, 1.31, 3.43]}
          radius={0.012}
          color="#8f8769"
        />
        <mesh position={[-1.73, 1.26, 3.43]} castShadow>
          <coneGeometry args={[0.13, 0.1, 24]} />
          <meshStandardMaterial
            color="#8b886a"
            metalness={0.55}
            roughness={0.5}
          />
        </mesh>
        <mesh position={fieldnotesDeskLamp.bulb} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial
            color="#f7e2be"
            emissive="#ffd09a"
            emissiveIntensity={night ? 1.4 : 0.25}
          />
        </mesh>
        <Sign
          position={signs.writing.position}
          rotation={signs.writing.rotation}
          size={signs.writing.size}
          title={signs.writing.title}
          subtitle={signs.writing.subtitle}
          accent={signs.writing.accent}
          background="#eee5d4"
          foreground="#41372c"
          secondary="#756a59"
        />
      </group>
      <group
        onClick={open("socials", "socials")}
        onPointerOver={() => onHover?.("Find me around the internet")}
        onPointerOut={() => onHover?.("")}
      >
        {shell(built.plinth, materials.stone)}
        {shell(built.panel, materials.ivory)}
        {shell(built.trim, materials.copper)}
        <Sign
          position={signs.socials.position}
          rotation={signs.socials.rotation}
          size={signs.socials.size}
          title={signs.socials.title}
          subtitle={signs.socials.subtitle}
          accent={signs.socials.accent}
          background="#e5e8dd"
          foreground="#34493c"
          secondary="#536759"
        />
      </group>
      <group
        onClick={open("collaborate", "contact")}
        onPointerOver={() =>
          onHover?.("Pull up a chair · start a conversation")
        }
        onPointerOut={() => onHover?.("")}
      >
        {fieldnotesLounge.map((seat) => (
          <group
            key={`${seat.x}:${seat.yaw}`}
            position={[seat.x, 0.022, seat.z]}
            rotation={[0, seat.yaw, 0]}
            scale={fieldnotesLoungeScale}
          >
            <LoungeChair />
          </group>
        ))}
        {shell(built.table, materials.timber)}
        {shell(built.hello, materials.ivory)}
        <Sign
          position={signs.collaborate.position}
          rotation={signs.collaborate.rotation}
          size={signs.collaborate.size}
          title={signs.collaborate.title}
          subtitle={signs.collaborate.subtitle}
          accent={signs.collaborate.accent}
          background="#eee5d4"
          foreground="#41372c"
          secondary="#756a59"
        />
      </group>
    </group>
  );
}
