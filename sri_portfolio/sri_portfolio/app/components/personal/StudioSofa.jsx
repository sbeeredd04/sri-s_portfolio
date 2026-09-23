"use client";
import { studioSurfaces } from "../../lib/studio-layout.mjs";
import { Upholstery, Piping } from "./ListeningFurniture";

// Keep the cushions inside the same shared collision volumes. Fabric sheen and
// stitched edges give the close-up its detail without a second physics model.
export default function StudioSofa() {
  return (
    <group>
      <Upholstery {...studioSurfaces.sofa} color="#8e8aa9" radius={0.16} />
      <Upholstery {...studioSurfaces.sofaBack} color="#aea7c4" radius={0.13} />
      <Upholstery {...studioSurfaces.sofaSeat} color="#c1b9d4" radius={0.075} />
      <Piping
        width={0.77}
        height={1.71}
        position={[2.42, 0.766, 1.14]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#ded4e9"
      />
      <Piping
        width={1.84}
        height={0.66}
        position={[2.802, 0.78, 1.14]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#c8bfd9"
      />
    </group>
  );
}
