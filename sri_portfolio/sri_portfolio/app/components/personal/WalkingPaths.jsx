import { regions } from "../../lib/world-layout.mjs";
import { walkingJoins } from "../../lib/walk-network.mjs";
import { PavedWalks } from "./StreetFurniture";
export default function WalkingPaths() {
  return Object.entries(walkingJoins).map(([id, paths]) => {
    const r = regions.find((r) => r.id === id);
    return (
      <group key={id} position={r.center} quaternion={r.rotation}>
        <PavedWalks biome={id} paths={paths} />
      </group>
    );
  });
}
