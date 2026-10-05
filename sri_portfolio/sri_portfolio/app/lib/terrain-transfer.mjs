import { BufferGeometry, BufferAttribute } from "three";

// Transfer ownership of typed buffers instead of cloning megabytes of JS arrays.
export function packTerrain(geometry) {
  const entries = [...geometry.userData.refinedCells];
  const cells = new Uint32Array(entries.length);
  const offsets = new Uint32Array(entries.length + 1);
  let length = 0;
  entries.forEach(([cell, triangles], i) => {
    cells[i] = cell;
    offsets[i] = length;
    length += triangles.length;
  });
  offsets[entries.length] = length;
  const triangles = new Uint32Array(length);
  entries.forEach(([, values], i) => triangles.set(values, offsets[i]));
  return {
    position: geometry.attributes.position.array,
    normal: geometry.attributes.normal.array,
    uv: geometry.attributes.uv.array,
    index: geometry.index.array,
    cells,
    offsets,
    triangles,
  };
}

export function unpackTerrain(data) {
  if (
    !(data?.position instanceof Float32Array) ||
    !(data.normal instanceof Float32Array) ||
    !(data.uv instanceof Float32Array) ||
    !(data.index instanceof Uint32Array) ||
    !(data.cells instanceof Uint32Array) ||
    !(data.offsets instanceof Uint32Array) ||
    !(data.triangles instanceof Uint32Array) ||
    data.normal.length !== data.position.length ||
    data.uv.length * 3 !== data.position.length * 2 ||
    data.offsets.length !== data.cells.length + 1 ||
    data.offsets.at(-1) !== data.triangles.length
  )
    throw new Error("Incomplete terrain worker result");
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(data.position, 3));
  geometry.setAttribute("normal", new BufferAttribute(data.normal, 3));
  geometry.setAttribute("uv", new BufferAttribute(data.uv, 2));
  geometry.setIndex(new BufferAttribute(data.index, 1));
  geometry.userData.refinedCells = new Map(
    Array.from(data.cells, (cell, i) => [
      cell,
      data.triangles.subarray(data.offsets[i], data.offsets[i + 1]),
    ]),
  );
  geometry.userData.refinedTriangleCount = data.triangles.length / 3;
  return geometry;
}
