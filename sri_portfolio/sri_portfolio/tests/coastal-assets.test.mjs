import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { lookout } from '../app/lib/fieldnotes-quarter.mjs';
import { onFieldnotesPath } from '../app/lib/fieldnotes-layout.mjs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

test('shipped coastal kit preserves ground contact, seating clearance and full wall footprint', async () => {
  const wall = await io.read('public/models/coastal-wall.glb');
  const bench = await io.read('public/models/coastal-bench.glb');
  const w = getBounds(wall.getRoot().listScenes()[0]);
  const b = getBounds(bench.getRoot().listScenes()[0]);
  assert.ok(w.max[0] - w.min[0] <= 6.2 && w.max[2] - w.min[2] <= .551);
  assert.ok(Math.abs(w.min[1]) < .01 && w.max[1] <= .881);
  assert.ok(Math.abs(b.min[1]) < .001);
  assert.ok(lookout.z + w.min[2] - (lookout.bench + b.max[2]) > .25);
  // Sample the entire rendered wall envelope, including cap overhangs.
  for (let x=w.min[0]; x<=w.max[0]; x+=.025)
    for (let z=w.min[2]; z<=w.max[2]; z+=.025)
      assert.ok(!onFieldnotesPath(lookout.x+x, lookout.z+z, .1), 'wall intersects walk');
});

test('coastal exports retain material detail and semantic nodes within transfer budgets', async () => {
  for (const [name, budget] of [['coastal-bench', 650000], ['coastal-wall', 900000]]) {
    const path = `public/models/${name}.glb`;
    assert.ok((await stat(path)).size < budget);
    const doc = await io.read(path);
    const material = doc.getRoot().listMaterials()[0];
    assert.ok(material.getBaseColorTexture() && material.getNormalTexture() && material.getMetallicRoughnessTexture());
    assert.ok(doc.getRoot().listNodes().some(n=>n.getExtras().soundProfile));
    if(name==='coastal-bench') assert.ok(doc.getRoot().listNodes().some(n=>n.getName()==='seat_anchor'));
  }
});
