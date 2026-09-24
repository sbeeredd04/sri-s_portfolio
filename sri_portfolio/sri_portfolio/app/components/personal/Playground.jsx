"use client";
import {
  BadmintonCourt,
  VolleyballCourt,
  BasketballCourt,
} from "./SportsCourts";
import { PavedWalks, Bench, Sign } from "./StreetFurniture";
import { Suspense } from "react";
import { Grove } from "./Landscape";
import ModelInstances from "./ModelInstances";
import { Box, Rods } from "./ScenePrimitives";
import {
  courtPaths,
  courtBenches,
  courtPicnicTables,
  courtBins,
  courts,
  courtLamps,
} from "../../lib/court-layout.mjs";

export default function Playground({
  animate,
  detailed = true,
  ballRequests = {},
  onCourtActivity,
  onCourtPlay,
  onHover,
  onCue,
  activeCourt,
}) {
  return (
    <group>
      <PavedWalks biome="court" paths={courtPaths} />
      <VolleyballCourt
        animate={animate}
        detailed={detailed}
        request={ballRequests.volleyball}
        onActivity={onCourtActivity}
        onPlay={onCourtPlay}
        onHover={onHover}
        onCue={onCue}
        audible={activeCourt === "volleyball"}
      />
      <BadmintonCourt animate={animate} detailed={detailed} />
      <BasketballCourt
        animate={animate}
        detailed={detailed}
        request={ballRequests.basketball}
        onActivity={onCourtActivity}
        onPlay={onCourtPlay}
        onHover={onHover}
        onCue={onCue}
        audible={activeCourt === "basketball"}
      />
      <Grove park detailed={detailed} />
      <Suspense fallback={null}>
        <ModelInstances
          src="/models/picnic-table.glb"
          items={courtPicnicTables}
        />
        <ModelInstances src="/models/trash-can.glb" items={courtBins} />
      </Suspense>
      {courtBenches.map((bench, i) => (
        <Bench key={i} {...bench} />
      ))}
      {Object.entries(courts).map(([id, c]) => {
        const z = c.depth / 2 + c.apron + 0.45;
        return (
          <group key={id} position={[c.center[0] - 1.6, 0, z]}>
            <Box
              position={[0, 0.48, 0]}
              size={[0.045, 0.95, 0.045]}
              color="#71818b"
              radius={0.01}
            />
            <Sign
              title={id[0].toUpperCase() + id.slice(1)}
              subtitle={
                id === "badminton"
                  ? "ONE MORE RALLY"
                  : id === "volleyball"
                    ? "A GAME I PICKED UP"
                    : "A FEW SHOTS AFTER WORK"
              }
              position={[0, 0.9, 0.03]}
              size={[1.15, 0.34]}
              background="#263747"
              accent="#adc4d4"
            />
          </group>
        );
      })}
      {courtLamps.map(([x, height, z]) => (
        <group key={x} position={[x, 0, z]}>
          <Rods
            color="#627689"
            segments={[
              { from: [0, 0.06, 0], to: [0, 6, 0], radius: 0.075 },
              { from: [-0.45, 6, 0], to: [0.45, 6, 0], radius: 0.04 },
            ]}
          />
          {[-0.32, 0.32].map((offset) => (
            <group
              key={offset}
              position={[offset, 6, 0]}
              rotation={[-0.35, 0, 0]}
            >
              <Box size={[0.52, 0.18, 0.28]} color="#3c4a56" radius={0.025} />
              <Box
                position={[0, -0.09, 0.035]}
                size={[0.45, 0.012, 0.2]}
                color="#d9e3e8"
                radius={0.01}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
