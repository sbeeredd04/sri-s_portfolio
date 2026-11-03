import {
  Color,
  MathUtils,
  Quaternion,
  Vector3,
  SkinnedMesh,
  Skeleton,
  Float32BufferAttribute,
} from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const adultAppearances = [
  { skin: "#c68f71", hair: "#473832", trousers: "#687888", shirt: "#688b80" },
  { skin: "#8e5d42", hair: "#292627", trousers: "#46576c", shirt: "#ae765e" },
  { skin: "#e0b18b", hair: "#806044", trousers: "#697166", shirt: "#6e8eac" },
  { skin: "#ac7658", hair: "#383432", trousers: "#514e60", shirt: "#a19465" },
  { skin: "#e7bea2", hair: "#a49378", trousers: "#526873", shirt: "#957b92" },
  { skin: "#694834", hair: "#24232a", trousers: "#766959", shirt: "#718a78" },
];

// Vertex colors carry the original knit/skin shading. A linear color ratio
// retints it without multiplying a second dark color into the original palette.
export function adultMaterialTint(name, variation = 0, shirt) {
  const appearance =
    adultAppearances[Math.abs(variation) % adultAppearances.length];
  const [base, target] =
    name === "Human_Shirt"
      ? ["#7b9b91", shirt || appearance.shirt]
      : name === "Human_Hair"
        ? ["#473832", appearance.hair]
        : name === "Human_Trousers"
          ? ["#687888", appearance.trousers]
          : /Hands|HeadAndNeck/.test(name)
            ? ["#c68f71", appearance.skin]
            : ["#ffffff", "#ffffff"];
  const a = new Color(base),
    b = new Color(target);
  return b.setRGB(b.r / a.r, b.g / a.g, b.b / a.b);
}

const yAxis = new Vector3(0, 1, 0);
function aim(bone, direction) {
  const world = new Quaternion().setFromUnitVectors(
    yAxis,
    direction.clone().normalize(),
  );
  const parent = bone.parent.getWorldQuaternion(new Quaternion()).invert();
  bone.quaternion.copy(parent.multiply(world));
  bone.updateWorldMatrix(false, true);
}

// Analytic two-bone IK preserves segment lengths and uses a stable bend plane.
// Inputs are character-local metres; rotations/scales are handled by the rig.
export function solveAdultLimb(
  root,
  first,
  second,
  end,
  target,
  bendDirection,
) {
  root.updateWorldMatrix(true, true);
  const origin = first.getWorldPosition(new Vector3());
  const joint = second.getWorldPosition(new Vector3());
  const tip = end.getWorldPosition(new Vector3());
  const a = origin.distanceTo(joint),
    b = joint.distanceTo(tip);
  const requested = root.localToWorld(new Vector3(...target));
  const delta = requested.sub(origin),
    length = delta.length();
  if (length < 1e-8) delta.set(0, -1, 0);
  else delta.divideScalar(length);
  const distance = MathUtils.clamp(
    length,
    Math.abs(a - b) + 0.0001,
    a + b - 0.0001,
  );
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  const bend = new Vector3(...bendDirection).transformDirection(
    root.matrixWorld,
  );
  bend.addScaledVector(delta, -bend.dot(delta));
  if (bend.lengthSq() < 1e-8)
    bend.set(0, 0, 1).addScaledVector(delta, -delta.z);
  bend.normalize();
  const elbow = origin
    .clone()
    .addScaledVector(delta, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, a * a - along * along)));
  const wrist = origin.clone().addScaledVector(delta, distance);
  aim(first, elbow.clone().sub(origin));
  aim(second, wrist.clone().sub(elbow));
  return root.worldToLocal(wrist);
}

export function adultRig(root) {
  const bones = {};
  root.traverse((node) => {
    if (node.isBone) bones[node.name] = node;
  });
  return bones;
}

// Retain authored ball/racket contacts while lowering the adult into an
// athletic stance. Knees flex around planted feet; arm lengths never stretch.
export function adultCourtPose(source, scale = 1) {
  const crouch = source.crouch || 0;
  const pose = { ...source, crouch: crouch / scale, stanceForward: 0.18 };
  for (const side of ["left", "right"])
    if (source[side])
      pose[side] = source[side].map(
        (value, axis) => (value - (axis === 1 ? crouch : 0)) / scale,
      );
  const hands = [pose.left, pose.right].filter(Boolean);
  if (hands.length)
    pose.crouch = Math.max(
      pose.crouch,
      0.06,
      MathUtils.clamp(
        1.388 - Math.min(...hands.map((p) => p[1])) - 0.24,
        0,
        0.5,
      ),
    );
  return pose;
}

export function applyAdultPose(
  root,
  bones,
  { seated = false, seatHeight = 0.44, pose, waveAge = -100 } = {},
) {
  if (!bones.Hips) return;
  if (
    !seated &&
    !pose?.crouch &&
    !pose?.left &&
    !pose?.right &&
    !(waveAge >= 0 && waveAge < 2.4)
  )
    return;
  if (seated) bones.Hips.position.y = seatHeight + 0.11;
  if (pose?.crouch) bones.Hips.position.y -= pose.crouch;
  if (pose?.stanceForward) bones.Hips.position.z = pose.stanceForward;
  root.updateWorldMatrix(true, true);
  if (seated || pose?.crouch) {
    for (const [side, sign] of [
      ["L", 1],
      ["R", -1],
    ]) {
      const footZ = seated ? 0.42 : 0.02;
      solveAdultLimb(
        root,
        bones[`Thigh_${side}`],
        bones[`Shin_${side}`],
        bones[`Foot_${side}`],
        [sign * 0.093, 0.09, footZ],
        [0, 0, 1],
      );
      // Preserve the sole's authored world orientation after knee flexion.
      const parent = bones[`Foot_${side}`].parent
        .getWorldQuaternion(new Quaternion())
        .invert();
      const q = new Quaternion().setFromUnitVectors(
        yAxis,
        new Vector3(0, -0.045, 0.15).normalize(),
      );
      bones[`Foot_${side}`].quaternion.copy(
        parent.multiply(root.getWorldQuaternion(new Quaternion())).multiply(q),
      );
    }
  }
  for (const [key, side, sign] of [
    ["left", "R", -1],
    ["right", "L", 1],
  ]) {
    let wrist = pose?.[key];
    if (!wrist && seated) wrist = [sign * 0.22, seatHeight + 0.34, 0.37];
    if (key === "right" && waveAge >= 0 && waveAge < 2.4) {
      const w =
        MathUtils.smoothstep(waveAge, 0, 0.25) *
        (1 - MathUtils.smoothstep(waveAge, 1.8, 2.4));
      const idle = wrist || [0.277, 0.858, 0.029];
      wrist = idle.map((v, i) =>
        MathUtils.lerp(
          v,
          [0.42, 1.63 + Math.sin(waveAge * 12) * 0.045, 0.12][i],
          w,
        ),
      );
    }
    if (wrist)
      solveAdultLimb(
        root,
        bones[`UpperArm_${side}`],
        bones[`Forearm_${side}`],
        bones[`Hand_${side}`],
        wrist,
        [sign, -0.3, -0.6],
      );
  }
  root.updateWorldMatrix(true, true);
}

// All seven authored parts share one skeleton/bind transform. Merge once per
// appearance to keep one draw per adult while preserving the authored skinning.
export function createAdultModel(scene, variation = 0, shirt) {
  const root = clone(scene),
    meshes = [];
  root.traverse((node) => {
    if (node.isSkinnedMesh) meshes.push(node);
  });
  const geometries = meshes.map((mesh) => {
    const geometry = mesh.geometry.clone(),
      colors = geometry.getAttribute("color");
    // Meshopt quantization is encoded in each skin's inverse-bind matrices.
    // Decode each part to metres before sharing one canonical skeleton.
    const position = geometry.getAttribute("position");
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        Array.from({ length: position.count }, (_, i) => [
          position.getX(i),
          position.getY(i),
          position.getZ(i),
        ]).flat(),
        3,
      ),
    );
    geometry.applyMatrix4(mesh.skeleton.boneInverses[0]);
    const tint = adultMaterialTint(mesh.name, variation, shirt);
    for (let i = 0; i < colors.count; i++)
      colors.setXYZ(
        i,
        colors.getX(i) * tint.r,
        colors.getY(i) * tint.g,
        colors.getZ(i) * tint.b,
      );
    return geometry;
  });
  const geometry = mergeGeometries(geometries, false);
  geometries.forEach((g) => g.dispose());
  const material = meshes[0].material.clone();
  material.color.set("white");
  const body = new SkinnedMesh(geometry, material);
  body.name = "SoftPolygonAdult";
  const decodeInverse = meshes[0].skeleton.boneInverses[0].clone().invert();
  const skeleton = new Skeleton(
    meshes[0].skeleton.bones,
    meshes[0].skeleton.boneInverses.map((matrix) =>
      matrix.clone().multiply(decodeInverse),
    ),
  );
  body.bind(skeleton, meshes[0].bindMatrix);
  body.castShadow = true;
  body.receiveShadow = true;
  body.frustumCulled = false;
  meshes[0].parent.add(body);
  meshes.forEach((mesh) => mesh.removeFromParent());
  return {
    root,
    body,
    bones: adultRig(root),
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
