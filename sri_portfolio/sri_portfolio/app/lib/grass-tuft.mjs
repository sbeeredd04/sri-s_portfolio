import * as THREE from "three";
// Coastal six-blade tufts use two segments per blade; other biomes retain
// three four-segment blades. Both cost 24 triangles.
export function tuftGeometry(coastal = false) {
  const segments = coastal ? 2 : 4,
    positions = [],
    uvs = [],
    tuft = [],
    indices = [];
  const blades = [
    [0, 0, 0, 1],
    [0.05, 0.035, 2.1, 0.8],
    [-0.045, -0.03, 4.2, 0.65],
  ];
  if (coastal)
    blades.push(
      [0.035, -0.04, 1.1, 0.9],
      [-0.04, 0.04, 3.2, 0.7],
      [0.025, 0.02, 5.3, 0.55],
    );
  blades.forEach(([ox, oz, turn, scale], b) => {
    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const w = 0.5 * (1 - t * 0.94);
      positions.push(-w, t * scale, 0, w, t * scale, 0);
      uvs.push(0, t, 1, t);
      tuft.push(ox, oz, turn, t, ox, oz, turn, t);
      if (i < segments) {
        const a = base + i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("tuft", new THREE.Float32BufferAttribute(tuft, 4));
  g.setIndex(indices);
  return g;
}
