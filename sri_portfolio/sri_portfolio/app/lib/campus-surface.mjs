import { Shape, Path, ExtrudeGeometry } from "three";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import { campusPathContours } from "./campus-layout.mjs";

let top;
export function campusPavingHeight() {
  if (top !== undefined) return top;
  const { outline, hole } = campusPathContours();
  top =
    Math.max(
      ...[...outline, ...hole].map(([x, z]) =>
        renderedSurfaceHeight("projects", x, z),
      ),
    ) + 0.035;
  return top;
}
export function buildCampusPaving() {
  const { outline, hole } = campusPathContours();
  const trace = (path, points) => {
    points.forEach(([x, z], i) =>
      i ? path.lineTo(x, -z) : path.moveTo(x, -z),
    );
    path.closePath();
    return path;
  };
  const shape = trace(new Shape(), outline);
  shape.holes.push(trace(new Path(), hole));
  const floor = campusPavingHeight();
  const bottom =
    Math.min(
      ...outline.map(([x, z]) => renderedSurfaceHeight("projects", x, z)),
    ) - 0.04;
  const g = new ExtrudeGeometry(shape, {
    depth: floor - bottom,
    bevelEnabled: false,
    steps: 1,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bottom, 0);
  g.userData.campusPaving = true;
  return g;
}
