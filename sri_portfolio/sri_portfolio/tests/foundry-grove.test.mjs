import test from "node:test";
import assert from "node:assert/strict";
import {
  foundryGroveTrees,
  GROVE_WALK_CLEARANCE,
  foundryCrownRadius,
} from "../app/lib/foundry-grove.mjs";
import { makeWalkNetwork, nearestWalk } from "../app/lib/walk-network.mjs";
import { regions, worldPoint } from "../app/lib/world-layout.mjs";
import { foundryCoastEdges } from "../app/lib/foundry-coast.mjs";

const trees = foundryGroveTrees();

test("foundry grove crowns stay clear of every walk", () => {
  const network = makeWalkNetwork();
  const tooClose = trees.filter((t,i) => {
    const walk = nearestWalk(worldPoint("projects", [t.x, 0, t.z]), network);
    return Math.sqrt(walk.distance) < Math.max(GROVE_WALK_CLEARANCE,foundryCrownRadius(t.s,i)+.5) + walk.segment.half;
  });
  assert.deepEqual(tooClose, []);
});

test("foundry grove crowns stay inside the revised coast without reserving the removed campus", () => {
 const r=regions.find(r=>r.id==='projects');
 assert.equal(trees.length,34,'retain existing instancing budget');
 for(const [i,t] of trees.entries()) for(let n=0;n<48;n++){
  const a=n*Math.PI/24,c=foundryCrownRadius(t.s,i);
  const x=t.x-r.landCenter[0]+Math.cos(a)*c,z=t.z-r.landCenter[1]+Math.sin(a)*c;
  assert.ok(Math.hypot(x,z)<foundryCoastEdges(x,z,r.inner,r.outer)[0]);
 }
});
