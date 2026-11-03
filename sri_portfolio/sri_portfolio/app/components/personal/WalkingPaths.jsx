import { regions } from "../../lib/world-layout.mjs";
import { walkingJoins } from "../../lib/walk-network.mjs";
import { legacyContentLift } from "../../lib/authored-island-sites.mjs";
import { PavedWalks } from "./StreetFurniture";
export default function WalkingPaths() {
  return Object.entries(walkingJoins).map(([id, paths]) => {
    if (!paths.length) return null;
    const r = regions.find((r) => r.id === id);
    return (
      <group
        key={id}
        position={r.center
          .clone()
          .addScaledVector(r.normal, legacyContentLift[id] || 0)}
        quaternion={r.rotation}
      >
        <PavedWalks biome={id} paths={paths} />
      </group>
    );
  });
}
