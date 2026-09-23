"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Rods } from "./ScenePrimitives";
import { BotanicalPlant, Sign, StreetLamp } from "./StreetFurniture";
import {
  projectGallerySites,
  districtLamps,
} from "../../lib/project-town-layout.mjs";
import WorkshopLaptop from "./WorkshopLaptop";
import HackathonPoster from "./HackathonPoster";
import { useRoomTexture } from "./RoomMaterials";

function Invitation({ children, label, onOpen, onHover, ...props }) {
  return (
    <group
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(label);
      }}
      onPointerOut={() => onHover("")}
    >
      {children}
    </group>
  );
}

function PhonePanel({ size, radius, color, metalness = 0, position }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => {
    const x = -w / 2,
      y = -h / 2,
      r = radius;
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: d,
      curveSegments: 12,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    });
    g.translate(0, 0, -d / 2);
    return g;
  }, [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.28}
      />
    </mesh>
  );
}

function PhoneExhibit({ kind }) {
  // These are deliberately abstract exhibits, not invented product screenshots.
  const ring = kind === "aatram";
  return (
    <group rotation={[-0.12, 0, 0]}>
      <PhonePanel
        size={[0.92, 1.86, 0.095]}
        radius={0.12}
        color="#718194"
        metalness={0.85}
      />
      <PhonePanel
        position={[0, 0, 0.05]}
        size={[0.865, 1.8, 0.018]}
        radius={0.105}
        color="#080f1b"
      />
      <PhonePanel
        position={[0, 0.72, 0.064]}
        size={[0.25, 0.072, 0.012]}
        radius={0.035}
        color="#04070d"
      />
      <PhonePanel
        position={[0, -0.79, 0.065]}
        size={[0.28, 0.024, 0.008]}
        radius={0.012}
        color="#99a4bc"
      />
      {ring ? (
        <>
          <mesh position={[0, 0.16, 0.07]}>
            <torusGeometry args={[0.28, 0.035, 12, 64]} />
            <meshStandardMaterial color="#667380" />
          </mesh>
          <mesh position={[0, 0.16, 0.075]} rotation={[0, 0, 0.6]}>
            <torusGeometry args={[0.28, 0.036, 12, 64, Math.PI * 1.5]} />
            <meshStandardMaterial
              color="#bcd3b4"
              emissive="#bcd3b4"
              emissiveIntensity={0.55}
            />
          </mesh>
          <Box
            position={[0, -0.44, 0.07]}
            size={[0.58, 0.19, 0.015]}
            color="#b5cbb0"
            radius={0.075}
          />
        </>
      ) : (
        Array.from({ length: 6 }, (_, i) => (
          <Box
            key={i}
            position={[
              ((i % 2) - 0.5) * 0.35,
              0.4 - Math.floor(i / 2) * 0.33,
              0.07,
            ]}
            size={[0.3, 0.27, 0.013]}
            color={
              [
                "#acbdd0",
                "#768d95",
                "#a499ad",
                "#bbc7b8",
                "#697f9c",
                "#afa89e",
              ][i]
            }
            radius={0.025}
          />
        ))
      )}
      <Rods
        color="#637080"
        segments={[-0.3, 0.13].map((y) => ({
          from: [-0.466, y, 0],
          to: [-0.466, y + 0.2, 0],
          radius: 0.014,
        }))}
      />
    </group>
  );
}

function GalleryFrame({ width, depth, wood, detailed, color = "#596c7e" }) {
  const posts = useMemo(
    () =>
      [-1, 1].flatMap((x) =>
        [-1, 1].map((z) => ({
          from: [x * (width / 2 - 0.15), 0, z * (depth / 2 - 0.12)],
          to: [x * (width / 2 - 0.15), 3.3, z * (depth / 2 - 0.12)],
          radius: 0.04,
        })),
      ),
    [width, depth],
  );
  return (
    <>
      <Box
        position={[0, 0.08, 0]}
        size={[width, 0.16, depth]}
        color="#77838c"
        radius={0.06}
      />
      <Box
        position={[0, 0.19, 0]}
        size={[width - 0.16, 0.04, depth - 0.16]}
        color="#776d64"
        map={wood}
        radius={0.01}
      />
      <Rods color="#afbac4" segments={posts} />
      <Box
        position={[0, 3.4, -depth * 0.2]}
        size={[width + 0.3, 0.12, depth * 0.75]}
        radius={0.018}
        color={color}
        roughness={0.45}
        metalness={0.4}
      />
      <Box
        position={[0, 1.75, -depth / 2 + 0.08]}
        size={[width, 3.15, 0.1]}
        radius={0.015}
        color="#4e626b"
        map={wood}
      />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 - 0.08), 1.7, 0]}>
          <boxGeometry args={[0.025, 3, depth - 0.2]} />
          <meshPhysicalMaterial
            color="#abc3d5"
            opacity={0.12}
            transparent
            depthWrite={false}
            roughness={0.18}
            metalness={0.2}
          />
        </mesh>
      ))}
      {detailed && (
        <Box
          position={[0, 3.29, -depth * 0.2]}
          size={[width - 0.2, 0.025, 0.04]}
          color="#edcfaa"
        />
      )}
    </>
  );
}

function HackathonHall({
  detailed,
  onProjectOpen,
  onContentOpen,
  onHover,
  wood,
}) {
  const events = [
    {
      id: "safeside",
      name: "SafeSide",
    },
    {
      id: "aruready",
      name: "AR You Ready",
    },
    {
      id: "avisol",
      name: "AviSol",
    },
  ];
  return (
    <group position={projectGallerySites.hackathons.position}>
      <GalleryFrame
        width={projectGallerySites.hackathons.width}
        depth={projectGallerySites.hackathons.depth}
        wood={wood}
        detailed={detailed}
        color="#777086"
      />
      <Invitation
        position={[0, 3.6, 2.82]}
        label="The hackathon collection"
        onHover={onHover}
        onOpen={() => onContentOpen("work", "hackathons")}
      >
        <Sign
          title="Made in a weekend"
          subtitle="DEVILS INVENT / AZ SPARK / VOXEL51"
          size={[5.3, 0.7]}
          accent="#c3b0d7"
        />
      </Invitation>
      {events.map((event, i) => (
        <Invitation
          key={event.id}
          position={[(i - 1) * 2.45, 0, -1.8]}
          label={`The story of ${event.name}`}
          onHover={onHover}
          onOpen={() => onProjectOpen(event.id)}
        >
          <HackathonPoster
            id={event.id}
            name={event.name}
            position={[0, 2.15, 0]}
          />
        </Invitation>
      ))}
      <Box
        position={[0, 0.95, 0.4]}
        size={[6.4, 0.12, 1.35]}
        map={wood}
        color="#ad937c"
        radius={0.06}
      />
      <Rods
        color="#354551"
        segments={[-2.8, 2.8].flatMap((x) =>
          [-0.1, 0.9].map((z) => ({
            from: [x, 0.2, z],
            to: [x, 0.9, z],
            radius: 0.05,
          })),
        )}
      />
      {detailed && (
        <>
          {[-2, 0, 2].map((x, i) => (
            <group key={x}>
              <Invitation
                label={`Open ${events[i].name}`}
                onHover={onHover}
                onOpen={() => onProjectOpen(events[i].id)}
              >
                <WorkshopLaptop
                  id={events[i].id}
                  name={events[i].name}
                  position={[x, 1.035, 0.4]}
                  rotation={[0, (i - 1) * 0.1, 0]}
                />
              </Invitation>
              <Box
                position={[x, 0.58, 1.75]}
                size={[0.8, 0.16, 0.7]}
                color="#73838f"
                radius={0.12}
              />
              <Box
                position={[x, 1.04, 2.05]}
                rotation={[-0.1, 0, 0]}
                size={[0.8, 0.85, 0.15]}
                color="#73838f"
                radius={0.14}
              />
              <Rods
                color="#81909d"
                segments={[-0.27, 0.27].flatMap((dx) =>
                  [1.5, 1.95].map((z) => ({
                    from: [x + dx, 0.2, z],
                    to: [x + dx, 0.51, z],
                    radius: 0.025,
                  })),
                )}
              />
            </group>
          ))}
          <BotanicalPlant position={[-3.6, 0.2, 1.3]} scale={0.85} />
          {[
            ["mine-alliance", "Mine Alliance"],
            ["voxelcv", "VoxelCV / PosturePro"],
          ].map(([id, name], i) => (
            <Invitation
              key={id}
              position={[3.55, 2.42 - i * 1.05, 0.6]}
              rotation={[0, -0.4, 0]}
              label={`The story of ${name}`}
              onHover={onHover}
              onOpen={() => onProjectOpen(id)}
            >
              <HackathonPoster id={id} name={name} size={[1.28, 0.945]} />
            </Invitation>
          ))}
        </>
      )}
    </group>
  );
}

export default function ProjectDistricts({
  detailed,
  night,
  onProjectOpen,
  onContentOpen,
  onHover,
}) {
  const wood = useRoomTexture("wood", 3);
  // One atelier for native apps; each object opens its own, truthful project story.
  return (
    <>
      <group position={projectGallerySites.mobile.position}>
        <GalleryFrame
          width={projectGallerySites.mobile.width}
          depth={projectGallerySites.mobile.depth}
          wood={wood}
          detailed={detailed}
        />
        <Invitation
          position={[0, 3.6, 2.45]}
          label="Explore the iPhone apps"
          onOpen={() => onContentOpen("work", "mobile")}
          onHover={onHover}
        >
          <Sign
            title="Made for your pocket"
            subtitle="IPHONE / SWIFT / SMALL DETAILS"
            size={[4.6, 0.66]}
            accent="#afc2de"
          />
        </Invitation>
        {["aatram", "simsim"].map((id, i) => (
          <Invitation
            key={id}
            position={[(i - 0.5) * 2.5, 0, 0]}
            label={`Take a closer look at ${i === 0 ? "Aatram" : "SimSim"}`}
            onHover={onHover}
            onOpen={() => onProjectOpen(id)}
          >
            <Box
              position={[0, 0.75, 0]}
              size={[1.65, 1.1, 1.25]}
              color="#99a6b0"
              radius={0.045}
              roughness={0.45}
            />
            <group position={[0, 2.08, 0]}>
              {detailed && <PhoneExhibit kind={id} />}
            </group>
            <Sign
              title={i === 0 ? "Aatram" : "SimSim"}
              subtitle={i === 0 ? "A LITTLE MOMENTUM" : "FIND THE MOMENT"}
              position={[0, 0.91, 0.65]}
              size={[1.45, 0.53]}
            />
          </Invitation>
        ))}
        {detailed && (
          <>
            <BotanicalPlant position={[-2.6, 0.2, -0.9]} scale={0.8} />
            <Sign
              title="A native curiosity."
              subtitle="LEARNING, ONE SMALL APP AT A TIME"
              position={[0, 2.25, -2.26]}
              size={[4.1, 0.6]}
            />
          </>
        )}
      </group>
      <HackathonHall
        {...{ detailed, onProjectOpen, onContentOpen, onHover, wood }}
      />
      {districtLamps.map((position, i) => (
        <StreetLamp key={i} position={position} night={night} />
      ))}
    </>
  );
}
