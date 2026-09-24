"""Procedural pose solver: FK for the trunk and fingers, analytic two-bone IK
for arms and legs, then conversion to Blender pose-bone basis keys.

Everything works in armature space with mathutils. A pose is described by a
`Pose` spec (local rotations plus IK targets); `solve` returns armature-space
matrices; `key` writes quaternion/location keys on the rig for one frame.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import bpy
from mathutils import Matrix, Quaternion, Vector

FINGERS = ("thumb", "index", "middle", "ring", "pinky")


def quat(axis, deg) -> Quaternion:
    return Quaternion(Vector(axis).normalized(), math.radians(deg))


def euler(x=0.0, y=0.0, z=0.0) -> Quaternion:
    """Local-space rotation in degrees about the bone's X (hinge), Y (twist), Z."""
    return quat((1, 0, 0), x) @ quat((0, 1, 0), y) @ quat((0, 0, 1), z)


@dataclass
class Limb:
    target: Vector            # wrist / ankle position (armature space)
    pole: Vector              # direction the elbow / knee should point
    end_rot: Matrix | None = None  # 3x3 world orientation for hand / foot bone


@dataclass
class Pose:
    hips_loc: Vector = field(default_factory=lambda: Vector())
    local: dict = field(default_factory=dict)   # bone -> Quaternion (FK, bone-local)
    world_rot: dict = field(default_factory=dict)  # bone -> 3x3 armature-space orientation
    limbs: dict = field(default_factory=dict)   # "arm_L" / "leg_R" -> Limb


class Solver:
    def __init__(self, rig: bpy.types.Object):
        self.rig = rig
        self.bones = rig.data.bones
        self.rest = {b.name: b.matrix_local.copy() for b in self.bones}
        self.parent = {b.name: (b.parent.name if b.parent else None) for b in self.bones}
        self.length = {b.name: b.length for b in self.bones}
        self.order = [b.name for b in _walk(self.bones)]

    # -- helpers
    def fk(self, name: str, pose_mats: dict, local: Quaternion | None, loc: Vector | None = None) -> Matrix:
        par = self.parent[name]
        offset = self.rest[name] if par is None else self.rest[par].inverted() @ self.rest[name]
        basis = (local or Quaternion()).to_matrix().to_4x4()
        if loc is not None:  # armature-space offset of the root from its rest position
            basis.translation = offset.to_3x3().inverted() @ loc
        parent_mat = Matrix.Identity(4) if par is None else pose_mats[par]
        return parent_mat @ offset @ basis

    @staticmethod
    def aim(base: Matrix, head: Vector, direction: Vector, twist_deg: float = 0.0) -> Matrix:
        """Swing `base` so its Y axis points along `direction`, placed at `head`."""
        rot = base.to_3x3().normalized()
        swing = (rot @ Vector((0, 1, 0))).rotation_difference(direction.normalized())
        new = swing.to_matrix() @ rot
        if twist_deg:
            new = Quaternion(direction.normalized(), math.radians(twist_deg)).to_matrix() @ new
        m = new.to_4x4()
        m.translation = head
        return m

    def two_bone(self, pose_mats, upper, lower, limb: Limb, pose: Pose):
        root_mat = self.fk(upper, pose_mats, pose.local.get(upper))
        a = root_mat.translation.copy()
        l1, l2 = self.length[upper], self.length[lower]
        to_t = limb.target - a
        d = min(max(to_t.length, abs(l1 - l2) + 1e-4), (l1 + l2) * 0.9995)
        u = to_t.normalized()
        along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
        h = math.sqrt(max(l1 * l1 - along * along, 0.0))
        v = limb.pole - u * limb.pole.dot(u)
        v = v.normalized() if v.length > 1e-6 else Vector((0, -1, 0))
        joint = a + u * along + v * h
        pose_mats[upper] = self.aim(root_mat, a, joint - a)
        low_fk = self.fk(lower, pose_mats, None)
        end = a + u * d
        pose_mats[lower] = self.aim(low_fk, joint, end - joint)

    def solve(self, pose: Pose) -> dict:
        mats = {}
        limb_bones = {}
        for sfx in ("L", "R"):
            limb_bones[f"upper_arm_{sfx}"] = (f"arm_{sfx}", f"lower_arm_{sfx}")
            limb_bones[f"upper_leg_{sfx}"] = (f"leg_{sfx}", f"lower_leg_{sfx}")
        done = set()
        for name in self.order:
            if name in done:
                continue
            if name in limb_bones and limb_bones[name][0] in pose.limbs:
                key, lower = limb_bones[name]
                self.two_bone(mats, name, lower, pose.limbs[key], pose)
                done.add(lower)
                continue
            loc = pose.hips_loc if self.parent[name] is None else None
            m = self.fk(name, mats, pose.local.get(name), loc)
            if name in pose.world_rot:
                head = m.translation.copy()
                m = pose.world_rot[name].to_4x4()
                m.translation = head
            mats[name] = m
            if name.startswith("hand_") or name.startswith("foot_"):
                limb = pose.limbs.get(("arm_" if name.startswith("hand") else "leg_") + name[-1])
                if limb and limb.end_rot is not None:
                    head = m.translation.copy()
                    m = limb.end_rot.to_4x4()
                    m.translation = head
                    mats[name] = m
            if name.startswith("lower_arm_twist_"):
                mats[name] = m  # refined after the hand is known
        for sfx in ("L", "R"):
            self._twist(mats, sfx)
        return mats

    def _twist(self, mats, sfx):
        """Give the forearm twist bone half of the hand's roll about the forearm."""
        lower, hand, twist = f"lower_arm_{sfx}", f"hand_{sfx}", f"lower_arm_twist_{sfx}"
        rel = (self.rest[lower].inverted() @ self.rest[hand]).to_quaternion()
        local = rel.inverted() @ (mats[lower].to_quaternion().inverted() @ mats[hand].to_quaternion())
        tw = Quaternion((local.w, 0.0, local.y, 0.0))
        if tw.magnitude < 1e-6:
            return
        tw.normalize()
        half = Quaternion().slerp(tw, 0.5)
        mats[twist] = self.fk(twist, mats, half)

    def basis(self, mats: dict) -> dict:
        out = {}
        for name in self.order:
            par = self.parent[name]
            if par is None:
                out[name] = self.rest[name].inverted() @ mats[name]
            else:
                out[name] = (self.rest[name].inverted() @ self.rest[par]
                             @ mats[par].inverted() @ mats[name])
        return out

    def key(self, pose: Pose, frame: int, prev: dict) -> dict:
        mats = self.solve(pose)
        basis = self.basis(mats)
        pbones = self.rig.pose.bones
        for name, m in basis.items():
            pb = pbones[name]
            q = m.to_quaternion()
            if name in prev and prev[name].dot(q) < 0:
                q.negate()
            prev[name] = q
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=frame, group=name)
            if self.parent[name] is None:
                pb.location = m.translation
                pb.keyframe_insert("location", frame=frame, group=name)
        return mats


def _walk(bones):
    roots = [b for b in bones if b.parent is None]
    stack = list(reversed(roots))
    while stack:
        b = stack.pop()
        yield b
        stack.extend(reversed(b.children))


def frame_from(y: Vector, z: Vector) -> Matrix:
    """3x3 orientation with local Y along `y` and local Z as close to `z` as possible."""
    y = y.normalized()
    x = y.cross(z).normalized()
    z = x.cross(y).normalized()
    return Matrix((x, y, z)).transposed()
