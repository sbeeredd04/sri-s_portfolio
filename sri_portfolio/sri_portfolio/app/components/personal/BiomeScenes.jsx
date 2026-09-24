"use client";
import { lazy, Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { studioSurfaces, studioMonitors } from "../../lib/studio-layout.mjs";
export { default as Court } from "./Playground";
import Landscape, { Grove, groundHeight } from "./Landscape";
import { outdoorsLift } from "../../lib/valley-layout.mjs";
import DeskTablet from "./DeskTablet";
import Character from "./Character";
import StudioDesk from "./StudioDesk";
import StudioChair from "./StudioChair";
import StudioLamp from "./StudioLamp";
import StudioSofa from "./StudioSofa";
import { Model } from "./ModelInstances";
import PaperPendant from "./PaperPendant";
import { useArtworkTexture } from "./ArtworkTexture";
import { StaticStudioProps } from "./StudioProps";
import { useRoomTexture } from "./RoomMaterials";
import { PavedWalks } from "./StreetFurniture";
import { Box, Ball, Rod, Rods } from "./ScenePrimitives";
import { BotanicalPlant as Plant } from "./BotanicalPlant";
import {
  DeskMonitor,
  DeskKeyboard,
  DeskMouse,
  DeskCables,
} from "./DeskHardware";
const StudioPhysics = lazy(() => import("./StudioPhysics"));
export function Workspace({
  night,
  animate,
  reset,
  onHover,
  onScreenClick,
  onCue,
}) {
  const photo = useArtworkTexture("/materials/studio-photo.webp");
  const deskTexture = useRoomTexture("walnut");
  const fabricTexture = useRoomTexture("fabric", 12);
  return (
    <group position={[0, 0.15, 0]}>
      <group position={[-6.19, 2.2, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <Box size={[1.7, 1.18, 0.055]} color="#313b49" radius={0.012} />
        <Box size={[1.58, 1.06, 0.059]} color="#e7e0d6" radius={0.006} />
        <mesh position={[0, 0, 0.033]}>
          <planeGeometry args={[1.4, 0.933]} />
          <meshStandardMaterial map={photo} roughness={0.7} />
        </mesh>
      </group>
      <Box
        position={[-5.8, 0.56, -1.5]}
        size={[0.82, 0.85, 2.6]}
        color="#ac8d6b"
        map={deskTexture}
        radius={0.04}
      />
      <Box
        position={[-5.8, 1.015, -1.5]}
        size={[0.87, 0.06, 2.67]}
        color="#bba287"
        map={deskTexture}
        radius={0.025}
      />
      <PaperPendant
        position={[-4.7, 4.12, -1.35]}
        night={night}
        animate={animate}
        onHover={onHover}
        onCue={onCue}
      />
      <Box
        {...studioSurfaces.rug}
        color="#9daec8"
        radius={0.1}
        map={fabricTexture}
        bumpMap={fabricTexture}
        bumpScale={0.0008}
        roughness={1}
      />
      <StudioDesk night={night} />
      {studioMonitors.map((monitor, i) => (
        <DeskMonitor
          key={i}
          {...monitor}
          index={i}
          onClick={onScreenClick}
          onHover={onHover}
        />
      ))}
      <Box
        position={[-0.32, 0.783, -0.64]}
        size={[1.12, 0.004, 0.4]}
        color="#36414e"
        radius={0.003}
        map={fabricTexture}
        roughness={0.94}
      />
      <DeskTablet onOpen={() => onScreenClick(4)} onHover={onHover} />
      <DeskKeyboard />
      <DeskMouse />
      <DeskCables />
      <Suspense fallback={<StaticStudioProps />}>
        <StudioPhysics
          animate={animate}
          reset={reset}
          onHover={onHover}
          onCue={onCue}
        />
      </Suspense>
      <StudioChair animate={animate} />
      <Suspense fallback={null}>
        <Model src="/models/plant-tall.glb" position={[-2.8, 0, 1.82]} rotation={0.6} />
        <Model src="/models/plant-leafy.glb" position={[2.62, 0, -1.9]} rotation={-0.4} />
      </Suspense>
      <StudioSofa />
      <Box
        {...studioSurfaces.coffeeTable}
        map={deskTexture}
        color="#c5a383"
        roughness={0.48}
        radius={0.08}
      />
      {[0.85, 1.45].flatMap((x) =>
        [0.98, 1.72].map((z) => (
          <Box
            key={`${x}-${z}`}
            position={[x, 0.28, z]}
            size={[0.055, 0.49, 0.055]}
            color="#47525e"
            metalness={0.6}
            radius={0.01}
          />
        )),
      )}
      <StudioLamp night={night} />
    </group>
  );
}
function TrailSign() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 144;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#d4b389";
    ctx.fillRect(0, 0, 512, 144);
    ctx.fillStyle = "#514f5c";
    ctx.font = "600 30px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WANDER A LITTLE  →", 256, 74);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      <Box
        position={[1.3, 1.65, 0.5]}
        size={[1.2, 0.35, 0.09]}
        color="#d4b389"
        radius={0.04}
      />
      <mesh position={[1.3, 1.65, 0.549]}>
        <planeGeometry args={[1.13, 0.3]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
    </group>
  );
}
export function Trail({ animate, detailed = true, onHover, onCue }) {
  return (
    <group position={[0, outdoorsLift, 0]}>
      <Landscape animate={animate} detailed={detailed} onCue={onCue} />
      {detailed && (
        <>
          <Character
            position={[2.7, groundHeight(2.7, 1.25), 1.25]}
            rotation={-0.3}
            color="#8c93bc"
            animate={animate}
            interactive
            backpack
            onHover={onHover}
          />
        </>
      )}
      <Rod
        from={[1.3, 0, 0.4]}
        to={[1.3, 1.65, 0.4]}
        color="#8b7454"
        radius={0.06}
      />
      <TrailSign />
      <Ball
        position={[2, 0.15, 0.2]}
        size={0.4}
        scale={[1, 0.6, 0.8]}
        color="#9d9f89"
      />
      <Ball position={[-1.7, 0.1, 1.7]} size={0.3} color="#a9ad96" />
    </group>
  );
}
