import * as THREE from "three";

// Needle cards follow individual twigs; the atlas contains a photographed sprig.
// A complete grove shares these geometries and two materials, rather than one
// object per needle or branch. Units are metres before the tree's instance scale.
export function createPineGeometry(detailed = true) {
  const needles = [],
    uv = [],
    bark = [],
    barkUv = [];
  const tri = (store, tex, a, b, c, ta, tb, tc) => {
    store.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    tex.push(...ta, ...tb, ...tc);
  };
  function stem(a, b, r0, r1) {
    const axis = b.clone().sub(a).normalize();
    const tangent = new THREE.Vector3(0, 0, 1).cross(axis).normalize();
    const bitangent = axis.clone().cross(tangent);
    const sides = detailed ? 7 : 5;
    for (let i = 0; i < sides; i++) {
      const around = (n, r) =>
        tangent
          .clone()
          .multiplyScalar(Math.cos((n / sides) * Math.PI * 2) * r)
          .addScaledVector(bitangent, Math.sin((n / sides) * Math.PI * 2) * r);
      const p = a.clone().add(around(i, r0)),
        q = a.clone().add(around(i + 1, r0)),
        s = b.clone().add(around(i, r1)),
        t = b.clone().add(around(i + 1, r1));
      tri(
        bark,
        barkUv,
        p,
        q,
        s,
        [i / sides, 0],
        [(i + 1) / sides, 0],
        [i / sides, a.distanceTo(b)],
      );
      tri(
        bark,
        barkUv,
        q,
        t,
        s,
        [(i + 1) / sides, 0],
        [(i + 1) / sides, a.distanceTo(b)],
        [i / sides, a.distanceTo(b)],
      );
    }
  }
  const base = new THREE.Vector3(0, -0.08, 0),
    top = new THREE.Vector3(0.025, 4.9, -0.02);
  stem(base, top, 0.14, 0.016);
  const levels = detailed ? 11 : 8;
  for (let level = 0; level < levels; level++) {
    const t = level / (levels - 1),
      y = 0.85 + t * 3.8;
    const reach = 1.35 * Math.pow(1 - t, 0.7) + 0.12;
    const branches = detailed ? 6 : 5;
    for (let b = 0; b < branches; b++) {
      const angle = (b / branches) * Math.PI * 2 + level * 2.39996;
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const side = new THREE.Vector3(-radial.z, 0, radial.x);
      const jitter = 0.85 + 0.15 * Math.sin(level * 9 + b * 3);
      const root = new THREE.Vector3(0, y, 0);
      const tip = root.clone().addScaledVector(radial, reach * jitter);
      tip.y += 0.14 - 0.2 * (1 - t);
      stem(root, tip, 0.027 * (1 - t) + 0.008, 0.003);
      const count = detailed ? 7 : 4;
      for (let k = 0; k < count; k++) {
        const f = 0.25 + (k / count) * 0.75;
        const center = root.clone().lerp(tip, f);
        center.y += Math.sin(k * 3.1 + b * 2.2 + level) * 0.12;
        const span = (0.5 + 0.4 * (1 - t)) * (1 - f * 0.3);
        // Alternate side shoots and pitch rather than stacking flat tiers.
        const direction = radial
          .clone()
          .addScaledVector(side, k % 2 ? 0.65 : -0.65)
          .normalize();
        direction.y = 0.28 + 0.2 * Math.sin(k + level);
        direction.normalize();
        for (let cross = 0; cross < 2; cross++) {
          const width =
            cross === 0
              ? side.clone()
              : new THREE.Vector3(0, 1, 0)
                  .cross(direction)
                  .normalize()
                  .add(new THREE.Vector3(0, 0.7, 0))
                  .normalize();
          const a = center.clone().addScaledVector(width, -span * 0.32),
            b0 = center.clone().addScaledVector(width, span * 0.32);
          const end = center.clone().addScaledVector(direction, span);
          const c = end.clone().addScaledVector(width, -span * 0.32),
            d = end.clone().addScaledVector(width, span * 0.32);
          tri(needles, uv, a, b0, c, [0, 0], [1, 0], [0, 1]);
          tri(needles, uv, b0, d, c, [1, 0], [1, 1], [0, 1]);
        }
      }
    }
  }
  function geometry(vertices, coords) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(coords, 2));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
  return { bark: geometry(bark, barkUv), needles: geometry(needles, uv) };
}
