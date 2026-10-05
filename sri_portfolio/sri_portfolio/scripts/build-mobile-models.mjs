// Separate the already-authored LOD1 from the desktop package. Preserve its
// exact geometry and pivot; right-size only texture resolution for a phone.
import { NodeIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTMeshoptCompression,
} from "@gltf-transform/extensions";
import { prune, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
await mkdir("public/models/compact", { recursive: true });
for (const name of [
  "tree-broadleaf",
  "tree-small-broadleaf",
  "tree-fir",
  "tree-pine-dense",
]) {
  const source = `public/models/${name}.glb`;
  const doc = await io.read(source);
  for (const node of doc.getRoot().listNodes()) {
    if (node.getName().endsWith("_LOD0")) node.dispose();
  }
  await doc.transform(
    prune({ keepAttributes: true, keepIndices: true }),
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [512, 512],
      quality: 85,
    }),
  );
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  const output = `public/models/compact/${name}.glb`;
  await io.write(output, doc);
  console.log(
    `${name}: ${(await stat(source)).size} → ${(await stat(output)).size} bytes`,
  );
}
