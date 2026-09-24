"""Mesh every SDF part and bring it to its triangle budget."""
from __future__ import annotations

import time

import bpy
import numpy as np

import anatomy as A
import body_parts as B
from sdf import decimate, mesh_sdf

BUDGET = {  # triangles
    "head": 3600,
    "arm_L": 1900,
    "arm_R": 1900,
    "shirt": 2900,
    "trousers": 2300,
    "shoe_L": 1100,
    "shoe_R": 1100,
}


def build(budget: bool = True) -> dict[str, bpy.types.Object]:
    specs = {
        "head": B.head_skin(),
        "arm_L": B.arm_skin(1),
        "arm_R": B.arm_skin(-1),
        "shirt": B.shirt(),
        "trousers": B.trousers(),
        "shoe_L": B.shoe(1),
        "shoe_R": B.shoe(-1),
    }
    objs = {}
    for name, (fn, lo, hi, h) in specs.items():
        t = time.time()
        obj = mesh_sdf(name, fn, lo, hi, h)
        raw = len(obj.data.polygons)
        if budget:
            decimate(obj, BUDGET[name])
        print(f"  mesh {name}: {raw} quads -> {len(obj.data.polygons)} faces ({time.time() - t:.1f}s)")
        objs[name] = obj
    return objs


def face_centers(obj: bpy.types.Object) -> np.ndarray:
    mesh = obj.data
    out = np.empty(len(mesh.polygons) * 3, dtype=np.float32)
    mesh.polygons.foreach_get("center", out)
    return out.reshape(-1, 3)


def assign_parts(obj: bpy.types.Object, part: np.ndarray) -> None:
    obj.data.polygons.foreach_set("material_index", part.astype(np.int32))
