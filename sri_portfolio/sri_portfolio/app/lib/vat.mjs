// Vertex-animation baking: sample a rigged character's clips once, on the
// CPU, into a float texture of skinned positions and normals. A crowd then
// draws every person in one instanced mesh; each instance just picks a clip
// row and a phase. Nothing is re-skinned per frame.
import {
  AnimationMixer,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  NearestFilter,
  RGBAFormat,
  Vector3,
} from "three";

// Parts are tinted per instance.
export const VAT_PARTS = [
  "skin",
  "hair",
  "shirt",
  "trousers",
  "shoe_upper",
  "shoe_sole",
];
// Small face and accessory parts borrow a dark tint; anything else is cloth.
const PART_ALIASES = {
  eye: "hair",
  lash: "hair",
  brow: "hair",
  mouth: "hair",
  watch: "shoe_sole",
};
const partIndex = (name) => {
  const i = VAT_PARTS.indexOf(PART_ALIASES[name] || name);
  return i < 0 ? 2 : i;
};

const MAX_WIDTH = 2048;

// clips: [{ name, frames }]. Returns { geometry, positions, normals, layout }
// where layout[name] = { row, frames, seconds } in texture rows.
export function bakeVat(scene, animations, clips) {
  const meshes = [];
  scene.updateMatrixWorld(true);
  scene.traverse((node) => {
    if (node.isSkinnedMesh) meshes.push(node);
  });
  let vertexCount = 0;
  for (const mesh of meshes)
    vertexCount += mesh.geometry.attributes.position.count;
  const width = Math.min(MAX_WIDTH, vertexCount);
  const rowsPerFrame = Math.ceil(vertexCount / width);
  const totalFrames = clips.reduce((sum, c) => sum + c.frames, 0);
  const height = totalFrames * rowsPerFrame;
  const pos = new Float32Array(width * height * 4);
  const nor = new Float32Array(width * height * 4);
  const mixer = new AnimationMixer(scene);
  const v = new Vector3(),
    n = new Vector3(),
    tip = new Vector3();
  const layout = {};
  let frameCursor = 0;
  for (const { name, frames } of clips) {
    const clip = animations.find((a) => a.name === name);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    mixer.stopAllAction();
    action.reset().play();
    layout[name] = { row: frameCursor, frames, seconds: clip.duration };
    for (let f = 0; f < frames; f++) {
      mixer.setTime((f / frames) * clip.duration);
      scene.updateMatrixWorld(true);
      let offset = 0;
      for (const mesh of meshes) {
        mesh.skeleton.update();
        const p = mesh.geometry.attributes.position,
          nn = mesh.geometry.attributes.normal;
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          mesh.applyBoneTransform(i, v);
          v.applyMatrix4(mesh.matrixWorld);
          // Normals: skin a point one unit along the rest normal.
          n.fromBufferAttribute(nn, i);
          tip.fromBufferAttribute(p, i).add(n);
          mesh.applyBoneTransform(i, tip);
          tip.applyMatrix4(mesh.matrixWorld).sub(v).normalize();
          const texel =
            ((frameCursor + f) * rowsPerFrame * width + offset + i) * 4;
          pos.set([v.x, v.y, v.z, 1], texel);
          nor.set([tip.x, tip.y, tip.z, 0], texel);
        }
        offset += p.count;
      }
    }
    frameCursor += frames;
  }
  mixer.stopAllAction();
  const texture = (data) => {
    const t = new DataTexture(data, width, height, RGBAFormat, FloatType);
    t.magFilter = t.minFilter = NearestFilter;
    t.needsUpdate = true;
    return t;
  };
  return {
    geometry: vatGeometry(meshes, vertexCount),
    positions: texture(pos),
    normals: texture(nor),
    layout,
    size: { width, rowsPerFrame },
  };
}

// One merged geometry: a vertex id for the texture lookup and a part id
// for tinting. Positions are placeholders; the shader reads the texture.
function vatGeometry(meshes, vertexCount) {
  const ids = new Float32Array(vertexCount),
    parts = new Float32Array(vertexCount),
    positions = new Float32Array(vertexCount * 3);
  const index = [];
  let offset = 0;
  for (const mesh of meshes) {
    const g = mesh.geometry,
      count = g.attributes.position.count;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const groups = g.groups.length
      ? g.groups
      : [
          {
            start: 0,
            count: g.index ? g.index.count : count,
            materialIndex: 0,
          },
        ];
    for (let i = 0; i < count; i++) {
      ids[offset + i] = offset + i;
      positions.set(
        [
          g.attributes.position.getX(i),
          g.attributes.position.getY(i),
          g.attributes.position.getZ(i),
        ],
        (offset + i) * 3,
      );
    }
    for (const group of groups) {
      const part = partIndex(materials[group.materialIndex || 0]?.name);
      for (let k = group.start; k < group.start + group.count; k++) {
        const vi = g.index ? g.index.getX(k) : k;
        parts[offset + vi] = part;
        index.push(offset + vi);
      }
    }
    offset += count;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("vatId", new BufferAttribute(ids, 1));
  geometry.setAttribute("part", new BufferAttribute(parts, 1));
  geometry.setIndex(index);
  geometry.computeBoundingSphere();
  return geometry;
}
