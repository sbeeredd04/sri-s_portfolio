"""Humanoid armature and skin weights.

Bone names are glTF/three.js safe (no dots). Rolls are set so every hinge bends
about the bone's local X axis: spine and legs have local Z forward, arm and
finger chains have local Z toward the palm. A half-length twist bone on each
forearm takes part of the wrist roll so pronation does not candy-wrap.
"""
from __future__ import annotations

import bpy
import numpy as np
from mathutils import Vector

import anatomy as A

FINGER_NAMES = ("thumb", "index", "middle", "ring", "pinky")


def bone_specs() -> list[tuple]:
    """(name, head, tail, parent, roll_align_vector)."""
    fwd = (0, -1, 0)
    specs = [(name, h, t, parent, fwd) for name, (h, t), parent in zip(
        A.SPINE, A.SPINE.values(), (None, "hips", "spine", "chest", "neck"))]
    for s, sfx in ((1, "L"), (-1, "R")):
        h = A.hand(s)
        n = tuple(h["palm_n"])
        knuckle = h["wrist"] + h["dir"] * A.PALM_LEN
        specs += [
            (f"shoulder_{sfx}", h["clavicle"], h["shoulder"], "chest", n),
            (f"upper_arm_{sfx}", h["shoulder"], h["elbow"], f"shoulder_{sfx}", n),
            (f"lower_arm_{sfx}", h["elbow"], h["wrist"], f"upper_arm_{sfx}", n),
            (f"lower_arm_twist_{sfx}", (h["elbow"] + h["wrist"]) * 0.5, h["wrist"], f"lower_arm_{sfx}", n),
            (f"hand_{sfx}", h["wrist"], knuckle, f"lower_arm_{sfx}", n),
        ]
        for finger in FINGER_NAMES:
            pts = h["chains"][finger]
            parent = f"hand_{sfx}"
            for i in range(3):
                name = f"{finger}_0{i + 1}_{sfx}"
                specs.append((name, pts[i], pts[i + 1], parent, n))
                parent = name
        g = A.leg(s)
        specs += [
            (f"upper_leg_{sfx}", g["hip"], g["knee"], "hips", fwd),
            (f"lower_leg_{sfx}", g["knee"], g["ankle"], f"upper_leg_{sfx}", fwd),
            (f"foot_{sfx}", g["ankle"], g["ball"], f"lower_leg_{sfx}", (0, 0, 1)),
            (f"toes_{sfx}", g["ball"], g["toe"], f"foot_{sfx}", (0, 0, 1)),
        ]
    return specs


def build_armature() -> bpy.types.Object:
    arm = bpy.data.armatures.new("SriRig")
    obj = bpy.data.objects.new("Sri", arm)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    for name, head, tail, parent, roll in bone_specs():
        eb = arm.edit_bones.new(name)
        eb.head, eb.tail = Vector(head), Vector(tail)
        eb.align_roll(Vector(roll))
        if parent:
            eb.parent = arm.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in obj.pose.bones:
        pb.rotation_mode = "QUATERNION"
    arm.display_type = "STICK"
    return obj


# ---------------------------------------------------------------- weights

def auto_weights(mesh_obj: bpy.types.Object, rig: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")


def bind(mesh_obj: bpy.types.Object, rig: bpy.types.Object) -> None:
    mesh_obj.parent = rig
    if not any(m.type == "ARMATURE" for m in mesh_obj.modifiers):
        mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
        mod.object = rig


def set_weights(obj: bpy.types.Object, weights: dict[str, np.ndarray]) -> None:
    """Replace all vertex groups with the given per-vertex weight arrays."""
    obj.vertex_groups.clear()
    for name, w in weights.items():
        idx = np.nonzero(w > 1e-4)[0]
        if not len(idx):
            continue
        vg = obj.vertex_groups.new(name=name)
        for i in idx:
            vg.add([int(i)], float(w[i]), "REPLACE")


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def head_weights(co: np.ndarray) -> dict[str, np.ndarray]:
    z = co[:, 2]
    head = smoothstep(0.855, 0.905, z)
    chest = 1 - smoothstep(0.79, 0.83, z)
    neck = np.clip(1 - head - chest, 0, 1)
    return {"head": head, "neck": neck, "chest": chest}


def shoe_weights(co: np.ndarray, sfx: str) -> dict[str, np.ndarray]:
    toes = smoothstep(-0.055, -0.095, co[:, 1])
    return {f"foot_{sfx}": 1 - toes, f"toes_{sfx}": toes}


def verts(obj) -> np.ndarray:
    co = np.empty(len(obj.data.vertices) * 3, np.float32)
    obj.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def clean(obj: bpy.types.Object, limit: int = 4) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.vertex_group_clean(group_select_mode="ALL", limit=0.01)
    bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=limit)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)


def smooth_groups(obj: bpy.types.Object, groups: list[str], factor: float = 0.5, repeat: int = 3) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for name in groups:
        if name not in obj.vertex_groups:
            continue
        obj.vertex_groups.active_index = obj.vertex_groups[name].index
        bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
        bpy.ops.object.vertex_group_smooth(group_select_mode="ACTIVE", factor=factor, repeat=repeat)
        bpy.ops.object.mode_set(mode="OBJECT")
