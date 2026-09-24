import { ExtrudeGeometry, Path, Shape } from "three";
import {
  fieldnotesDeckHeight,
  fieldnotesLookoutZ,
  fieldnotesRoute,
} from "./fieldnotes-layout.mjs";

export function fieldnotesPavingContours() {
  const r = fieldnotesRoute;
  const h = r.loopWidth / 2;
  const hs = r.spurWidth / 2;
  const outer = [
    [-h, r.pavingStart],
    [h, r.pavingStart],
    [h, r.south - h],
    [r.east + h, r.south - h],
    [r.east + h, r.north + h],
    // The lookout walk runs north from the loop to the bench.
    [0.75, r.north + h],
    [0.75, fieldnotesLookoutZ - 1.3],
    [-0.75, fieldnotesLookoutZ - 1.3],
    [-0.75, r.north + h],
    [r.west - h, r.north + h],
    [r.west - h, r.south - h],
    [-h, r.south - h],
  ];
  const spurEast = r.spurEnd + hs;
  const hole = [
    [r.west + h, r.south + h],
    [r.east - h, r.south + h],
    [r.east - h, r.north - h],
    [r.west + h, r.north - h],
    [r.west + h, r.spurZ + hs],
    [spurEast, r.spurZ + hs],
    [spurEast, r.spurZ - hs],
    [r.west + h, r.spurZ - hs],
  ];
  return { outer, hole };
}

function trace(path, points) {
  points.forEach(([x, z], index) =>
    index ? path.lineTo(x, -z) : path.moveTo(x, -z),
  );
  path.closePath();
  return path;
}

export function buildFieldnotesPaving() {
  const { outer, hole } = fieldnotesPavingContours();
  const shape = trace(new Shape(), outer);
  shape.holes.push(trace(new Path(), hole));
  const top = fieldnotesDeckHeight();
  const bottom = -0.02;
  const geometry = new ExtrudeGeometry(shape, {
    depth: top - bottom,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bottom, 0);
  geometry.computeVertexNormals();
  return geometry;
}
