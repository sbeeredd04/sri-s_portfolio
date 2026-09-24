"use client";
import { Suspense } from "react";
import { studioSurfaces, studioCharacter } from "../../lib/studio-layout.mjs";
import { Model } from "./ModelInstances";
import Character from "./Character";

// Blender-built task chair (scripts/blender/build_props.py). Its cushion top
// sits at 0.44 m (armrests reach 0.69) and it faces +Z; it is turned toward
// the desk and scaled so the cushion meets the seat collider the seated
// character rests on.
const MODEL_SEAT_TOP = 0.44;
const { chairSeat } = studioSurfaces;
const seatTop = chairSeat.position[1] + chairSeat.size[1] / 2;
const lift = seatTop / MODEL_SEAT_TOP;
const scale = [1.15, lift, 1.12];

export default function StudioChair({ animate }) {
  const [x, , z] = chairSeat.position;
  return (
    <group>
      <Suspense fallback={null}>
        <Model
          src="/models/office-chair.glb"
          position={[x, 0, z + 0.01]}
          rotation={Math.PI}
          scale={scale}
          envMapIntensity={1.1}
        />
      </Suspense>
      <Character {...studioCharacter} seated animate={animate} />
    </group>
  );
}
