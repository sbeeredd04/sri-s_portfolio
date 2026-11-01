// Trees framing the Foundry: an open band between the workshop core and the
// reshaped coast, kept clear of the retained exhibits and complete paths.
import { regions, worldPoint } from "./world-layout.mjs";
import { makeWalkNetwork, nearestWalk } from "./walk-network.mjs";
import { foundryCoastEdges } from "./foundry-coast.mjs";
import { inTechFootprint } from "./tech-plan.mjs";

export const GROVE_WALK_CLEARANCE = 3;
// Conservative circumscribed crown from the shipped 24.203 x 19.061 m asset.
export const foundryGroveScale=(s,index)=>.36*.72*s*(.9+(index%4)*.05);
export const foundryCrownRadius=(s,index)=>Math.hypot(24.203,19.061)*.5*foundryGroveScale(s,index);
const CORE = { x: 0, z: 1, radius: 17 };

let cached;
export function foundryGroveTrees() {
  if (cached) return cached;
  const region = regions.find((r) => r.id === "projects");
  const [cx, cz] = region.landCenter;
  const network = makeWalkNetwork();
  const trees = [];
  // A loose canopy behind the gallery row gives the workshops a middle
  // distance; the remaining trees frame the island edge. Existing 34-tree budget.
  const galleryBackdrop=[[-18,-22],[-10,-24],[-2,-27],[-22,-30],[-13,-33],[-4,-36]];
  for (let i = 0; i < 180 && trees.length < 34; i++) {
    const angle = i * 2.39996,
      radius = 19 + ((i * 0.618034) % 1) * (region.inner - 23);
    const [x,z]=galleryBackdrop[i] || [cx + Math.cos(angle) * radius, cz + Math.sin(angle) * radius];
    const s=.9+(i%5)*.12, crown=foundryCrownRadius(s,trees.length);
    if (Math.hypot(x - CORE.x, z - CORE.z) < CORE.radius+crown) continue;
    // Check the full crown against the directional boundary, not just trunk.
    let coastal=false;
    for(let n=0;n<24;n++){
      const a=n*Math.PI/12, dx=x-cx+Math.cos(a)*crown,dz=z-cz+Math.sin(a)*crown;
      if(Math.hypot(dx,dz)>foundryCoastEdges(dx,dz,region.inner,region.outer)[0]-1) coastal=true;
    }
    if(coastal || inTechFootprint(x,z,crown+.5)) continue;
    const walk = nearestWalk(worldPoint("projects", [x, 0, z]), network);
    if (
      walk &&
      Math.sqrt(walk.distance) < Math.max(GROVE_WALK_CLEARANCE,crown+.5) + walk.segment.half
    )
      continue;
    trees.push({ x, z, s, turn: i * 2.1 });
  }
  cached = trees;
  return trees;
}
