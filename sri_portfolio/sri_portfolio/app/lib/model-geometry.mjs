import { Shape, Matrix4, Quaternion, Euler, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function roundedBox(size, radius = 0.06) {
  const corner = Math.max(
    0.0001,
    Math.min(radius, ...size.map((n) => n / 2 - 0.0001)),
  );
  return new RoundedBoxGeometry(...size, 2, corner);
}

export function mergedBoxes(items) {
  const matrix = new Matrix4(),
    rotation = new Quaternion();
  const parts = items.map(
    ({ size, radius, position = [0, 0, 0], rotation: angles = [0, 0, 0] }) => {
      const geometry = roundedBox(size, radius);
      rotation.setFromEuler(new Euler(...angles));
      matrix.compose(new Vector3(...position), rotation, new Vector3(1, 1, 1));
      geometry.applyMatrix4(matrix);
      return geometry;
    },
  );
  const result = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

export function roundedRectangle(width, height, radius) {
  const x = -width / 2,
    y = -height / 2,
    s = new Shape();
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}
