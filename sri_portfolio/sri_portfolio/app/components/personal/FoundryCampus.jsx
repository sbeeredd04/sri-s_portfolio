"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Sign } from "./StreetFurniture";
import { useRoomTexture } from "./RoomMaterials";
import { exhibitPoses, campusGlassSpec } from "../../lib/campus-layout.mjs";
import { buildCampusPaving } from "../../lib/campus-surface.mjs";
import {
  buildCampusGeometry,
  disposeCampus,
} from "../../lib/campus-geometry.mjs";

const noRay = () => null;
function exhibitAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const font = getComputedStyle(document.body).fontFamily;
  for (let tile = 0; tile < 3; tile++) {
    ctx.save();
    ctx.translate(tile * 256, 0);
    ctx.fillStyle = ["#17241d", "#e3ddd0", "#18232b"][tile];
    ctx.fillRect(0, 0, tile === 2 ? 512 : 256, tile === 2 ? 354 : 512);
    ctx.fillStyle = tile === 1 ? "#252e29" : "#e7e5db";
    ctx.font = `500 29px ${font}`;
    ctx.fillText(
      ["Aatram", "SimSim", "Small ideas."][tile],
      20,
      tile === 2 ? 56 : 92,
    );
    ctx.font = `16px ${font}`;
    ctx.fillText(
      ["A little momentum.", "Find the moment.", "Made for your pocket."][tile],
      20,
      tile === 2 ? 86 : 126,
    );
    if (tile === 0) {
      ctx.lineWidth = 9;
      ctx.strokeStyle = "#435749";
      ctx.beginPath();
      ctx.arc(128, 260, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#c2d99d";
      ctx.beginPath();
      ctx.arc(128, 260, 70, -Math.PI / 2, Math.PI * 0.85);
      ctx.stroke();
      ctx.font = `500 25px ${font}`;
      ctx.fillText("One step", 70, 268);
      ctx.fillStyle = "#c2d99d";
      ctx.beginPath();
      ctx.roundRect(30, 390, 196, 40, 20);
      ctx.fill();
    } else if (tile === 1) {
      [
        "#7c967b",
        "#9caeb1",
        "#c2a07d",
        "#6e7e70",
        "#abafa1",
        "#bb9282",
      ].forEach((color, i) => {
        const x = 18 + (i % 2) * 115,
          y = 172 + Math.floor(i / 2) * 91;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, 105, 78, 9);
        ctx.fill();
        ctx.fillStyle = "#e8e0d0";
        ctx.beginPath();
        ctx.arc(x + 73, y + 22, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#394b42";
        ctx.beginPath();
        ctx.moveTo(x, y + 78);
        ctx.lineTo(x + 42, y + 32);
        ctx.lineTo(x + 105, y + 78);
        ctx.fill();
      });
    } else {
      ["SwiftUI", "Curiosity", "Iteration"].forEach((label, i) => {
        ctx.fillStyle = "#2d414c";
        ctx.beginPath();
        ctx.roundRect(20, 114 + i * 67, 472, 56, 12);
        ctx.fill();
        ctx.fillStyle = "#c9d9de";
        ctx.font = `20px ${font}`;
        ctx.fillText(label, 37, 149 + i * 67);
      });
    }
    ctx.fillStyle = "#070a09";
    ctx.beginPath();
    ctx.roundRect(
      tile === 2 ? 248 : 91,
      14,
      tile === 2 ? 8 : 74,
      tile === 2 ? 8 : 17,
      4,
    );
    ctx.fill();
    ctx.fillStyle = tile === 1 ? "#39483d" : "#dce3da";
    ctx.beginPath();
    ctx.roundRect(
      tile === 2 ? 196 : 87,
      tile === 2 ? 340 : 488,
      tile === 2 ? 120 : 82,
      5,
      3,
    );
    ctx.fill();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function FoundryCampus({
  night,
  onContentOpen,
  onProjectOpen,
  onHover,
}) {
  const stoneMap = useRoomTexture("stone", 2);
  const woodMap = useRoomTexture("wood", 2);
  const built = useMemo(() => buildCampusGeometry(), []);
  const atlas = useMemo(exhibitAtlas, []);
  useEffect(() => () => atlas.dispose(), [atlas]);
  const paving = useMemo(buildCampusPaving, []);
  useEffect(() => () => paving.dispose(), [paving]);
  const materials = useMemo(() => {
    const canopy = new THREE.MeshStandardMaterial({
      color: "#c9ccc3",
      roughness: 0.4,
      metalness: 0.24,
    });
    const stone = new THREE.MeshStandardMaterial({
      color: "#bfc2b5",
      map: stoneMap,
      roughness: 0.78,
      metalness: 0.04,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: "#d9c6b0",
      map: woodMap,
      roughness: 0.72,
      metalness: 0.04,
      emissive: "#c4a574",
    });
    const metal = new THREE.MeshStandardMaterial({
      color: "#56615e",
      roughness: 0.32,
      metalness: 0.76,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: "#c5d5e4",
      transparent: true,
      opacity: campusGlassSpec.opacity,
      roughness: campusGlassSpec.roughness,
      metalness: campusGlassSpec.metalness,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const garden = new THREE.MeshStandardMaterial({
      color: "#6f9468",
      roughness: 0.92,
    });
    const screen = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      map: atlas,
      emissiveMap: atlas,
      roughness: 0.24,
      metalness: 0.08,
    });
    return { canopy, stone, wood, metal, glass, garden, screen };
  }, [stoneMap, woodMap, atlas]);
  useEffect(() => {
    materials.screen.emissiveIntensity = night ? 0.62 : 0.3;
    materials.wood.emissiveIntensity = night ? 0.14 : 0.03;
  }, [materials, night]);
  useEffect(
    () => () => {
      disposeCampus(built);
      Object.values(materials).forEach((material) => material.dispose());
    },
    [built, materials],
  );
  const poses = exhibitPoses();
  return (
    <group>
      <mesh geometry={paving} material={materials.stone} receiveShadow />
      {["canopy", "stone", "wood", "metal", "garden"].map((key) => (
        <mesh
          key={key}
          geometry={built[key]}
          material={materials[key]}
          castShadow
          receiveShadow
        />
      ))}
      <mesh geometry={built.glass} material={materials.glass} raycast={noRay} />
      {poses.map((pose) => {
        const shelf = pose.id === "shelf";
        const open = () =>
          shelf
            ? onContentOpen("work", pose.collection)
            : onProjectOpen(pose.project);
        return (
          <group
            key={pose.id}
            position={[pose.x, built.floorY, pose.z]}
            rotation={[0, pose.yaw, 0]}
            onClick={(event) => {
              event.stopPropagation();
              if (event.delta > 4) return;
              open();
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              onHover(
                shelf
                  ? "Open the iPhone and iPad shelf"
                  : `The story of ${pose.name}`,
              );
            }}
            onPointerOut={() => onHover("")}
          >
            <mesh
              geometry={shelf ? built.parts.widePlinth : built.parts.plinth}
              material={materials.canopy}
              position={[0, 0.35, 0]}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={built.parts.phone}
              material={materials.metal}
              position={[shelf ? -0.28 : 0, 1.09, 0.16]}
              castShadow
            />
            <mesh
              geometry={
                pose.id === "simsim"
                  ? built.parts.photoScreen
                  : built.parts.phoneScreen
              }
              material={materials.screen}
              position={[shelf ? -0.28 : 0, 1.09, 0.188]}
            />
            {shelf && (
              <>
                <mesh
                  geometry={built.parts.tablet}
                  material={materials.metal}
                  position={[0.3, 0.9, 0.16]}
                  castShadow
                />
                <mesh
                  geometry={built.parts.tabletScreen}
                  material={materials.screen}
                  position={[0.3, 0.9, 0.186]}
                />
                <Sign
                  title="For your pocket"
                  subtitle="IPHONE / IPAD · CONCEPT EXHIBITS"
                  accent="#afc2de"
                  position={[0, 1.74, 0.3]}
                  size={[1.2, 0.46]}
                />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
