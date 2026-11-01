// Keep the low-tier canopy independent of the detailed asset's transfer cost.
import { NodeIO } from "@gltf-transform/core";
import { prune } from "@gltf-transform/functions";
const io = new NodeIO();
const doc = await io.read("public/models/coastal-tree.glb");
for (const node of doc.getRoot().listNodes())
  if (node.getName().endsWith("_LOD0")) node.dispose();
await doc.transform(prune());
await io.write("public/models/compact/coastal-tree.glb", doc);
