"""Facial features as thin shells conformed to the head surface.

Eyes, upper lash lines, brows and mouth are authored in a 2D face plane (x, z),
projected onto the head SDF along +Y and lifted along the surface normal. Shape
keys are the same topology re-projected from edited 2D coordinates, so blink and
smile stay glued to the skin.
"""
from __future__ import annotations

import math

import bpy
import numpy as np

import anatomy as A
from sdf import gradient, raycast

EYE_A, EYE_B = 0.0255, 0.031  # half width / half height
RINGS, SEGS = 7, 28
MATS = ("eye", "lash", "brow", "mouth")


class Builder:
    def __init__(self):
        self.pts2d, self.lift, self.uv, self.faces, self.mat, self.face_uv = [], [], [], [], [], []

    def add(self, pts2d, lift, uv, faces, mat):
        base = len(self.pts2d)
        self.pts2d += list(pts2d)
        self.lift += list(lift)
        self.uv += list(uv)
        for f in faces:
            self.faces.append([base + i for i in f])
            self.mat.append(mat)
        return base


def eye_off(r):
    return 0.0034 * np.sqrt(np.clip(1 - np.asarray(r) ** 2, 0, 1)) - 0.0007


def _grid_faces(rows, cols, closed=False):
    faces = []
    for i in range(rows - 1):
        for j in range(cols if closed else cols - 1):
            j2 = (j + 1) % cols
            faces.append([i * cols + j, i * cols + j2, (i + 1) * cols + j2, (i + 1) * cols + j])
    return faces


def eye(b: Builder, s: int):
    ex, ez = A.EYE_X * s, A.EYE_Z
    pts, lift, uv = [(ex, ez)], [eye_off(0)], [(0.5, 0.5)]
    for k in range(1, RINGS + 1):
        r = k / RINGS
        for j in range(SEGS):
            th = 2 * math.pi * j / SEGS
            pts.append((ex + EYE_A * r * math.cos(th), ez + EYE_B * r * math.sin(th)))
            lift.append(eye_off(r))
            uv.append((0.5 + 0.5 * r * math.cos(th), 0.5 + 0.5 * r * math.sin(th)))
    faces = [[0, 1 + (j + 1) % SEGS, 1 + j][::-1] for j in range(SEGS)]
    faces += [[1 + f for f in q] for q in _grid_faces(RINGS, SEGS, closed=True)]
    return b.add(pts, lift, uv, faces, 0), len(pts)


def closed_z(x, s):
    """Where the upper lid lands when the eye is shut (a soft U curve)."""
    u = (np.asarray(x) - A.EYE_X * s) / EYE_A
    return A.EYE_Z - 0.42 * EYE_B + 0.28 * EYE_B * u ** 2


def lash(b: Builder, s: int, n: int = 16):
    ex, ez = A.EYE_X * s, A.EYE_Z
    pts, lift, uv = [], [], []
    for i in range(n):
        t = i / (n - 1)  # 0 inner corner -> 1 outer corner
        th = math.radians(168 - 160 * t) if s > 0 else math.radians(12 + 160 * t)
        thick = 0.1 + 0.16 * t ** 1.5
        for row, rr in enumerate((0.9, 0.97 + thick * 0.5, 0.97 + thick)):
            r = rr + (0.08 * max(0.0, t - 0.8) / 0.2 if row else 0)
            flick = 0.004 * max(0.0, t - 0.82) / 0.18 if row == 2 else 0.0
            x = ex + EYE_A * r * math.cos(th) + flick * s
            z = ez + EYE_B * r * math.sin(th) + flick * 0.3
            pts.append((x, z))
            lift.append(float(eye_off(min(r, 0.95))) + (0.0016 if row == 1 else 0.0009))
            uv.append((t, row / 2))
    faces = _grid_faces(n, 3)
    return b.add(pts, lift, uv, faces, 1), len(pts)


def brow(b: Builder, s: int, n: int = 12):
    pts, lift, uv = [], [], []
    for i in range(n):
        t = i / (n - 1)  # inner -> outer
        x = (0.034 + 0.064 * t) * s
        z = 1.064 + 0.011 * math.sin(math.pi * (0.25 + 0.75 * t)) - 0.004 * t
        half = 0.0062 * (1 - 0.45 * t) + 0.0016
        for row, k in enumerate((-1, 0, 1)):
            pts.append((x, z + half * k))
            lift.append(0.0022 if row == 1 else 0.0008)
            uv.append((t, row / 2))
    faces = _grid_faces(n, 3)
    if s < 0:
        faces = [f[::-1] for f in faces]
    return b.add(pts, lift, uv, faces, 2), len(pts)


MOUTH_Z, MOUTH_W = 0.936, 0.024


def mouth_curves(x, open_amt):
    u = np.asarray(x) / MOUTH_W
    top = MOUTH_Z + 0.0075 * u ** 2 + 0.0015 * open_amt * u ** 2
    depth = (0.0019 + 0.0115 * open_amt) * np.sqrt(np.clip(1 - u ** 2, 0, 1)) + 0.0005
    return top, top - depth


def mouth(b: Builder, open_amt: float, n: int = 15, rows: int = 4):
    pts, lift, uv = [], [], []
    for i in range(n):
        x = MOUTH_W * (2 * i / (n - 1) - 1)
        top, bot = mouth_curves(x, open_amt)
        for r in range(rows):
            f = r / (rows - 1)
            pts.append((x, float(top + (bot - top) * f)))
            lift.append(0.0007)
            uv.append((i / (n - 1), f))
    faces = [f[::-1] for f in _grid_faces(n, rows)]
    return b.add(pts, lift, uv, faces, 3), len(pts)


def project(head_fn, pts2d, lift) -> np.ndarray:
    p2 = np.asarray(pts2d, np.float32)
    origins = np.stack([p2[:, 0], np.full(len(p2), -0.45, np.float32), p2[:, 1]], axis=1)
    dirs = np.tile(np.array([[0, 1, 0]], np.float32), (len(p2), 1))
    hit = raycast(head_fn, origins, dirs, 0.4)
    return hit + gradient(head_fn, hit) * np.asarray(lift, np.float32)[:, None]


def build(head_fn) -> bpy.types.Object:
    b = Builder()
    spans = {}
    for s in (1, -1):
        spans[("eye", s)] = eye(b, s)
        spans[("lash", s)] = lash(b, s)
        spans[("brow", s)] = brow(b, s)
    spans["mouth"] = mouth(b, 0.0)
    rest2d = np.array(b.pts2d, np.float32)
    lift = np.array(b.lift, np.float32)
    verts = project(head_fn, rest2d, lift)
    b.faces = orient(head_fn, verts, b.faces)

    mesh = bpy.data.meshes.new("Face")
    mesh.from_pydata(verts.tolist(), [], b.faces)
    mesh.polygons.foreach_set("material_index", np.array(b.mat, np.int32))
    uvl = mesh.uv_layers.new(name="UVMap")
    loop_v = np.empty(len(mesh.loops), np.int32)
    mesh.loops.foreach_get("vertex_index", loop_v)
    uvl.data.foreach_set("uv", np.array(b.uv, np.float32)[loop_v].ravel())
    obj = bpy.data.objects.new("Face", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.shape_key_add(name="Basis")
    _key(obj, "blink", project(head_fn, *_blink(rest2d, lift, spans)))
    _key(obj, "smile", project(head_fn, *_smile(rest2d, lift, spans)))
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def orient(fn, verts, faces):
    """Wind every face so its normal agrees with the head's outward gradient."""
    out = []
    for f in faces:
        p = verts[f]
        n = np.cross(p[1] - p[0], p[2] - p[0])
        g = gradient(fn, p.mean(0, keepdims=True))[0]
        out.append(f if n @ g >= 0 else f[::-1])
    return out


def _key(obj, name, co):
    key = obj.shape_key_add(name=name, from_mix=False)
    key.data.foreach_set("co", co.ravel())


def _blink(p2, lift, spans):
    p2, lift = p2.copy(), lift.copy()
    for s in (1, -1):
        start, count = spans[("eye", s)]
        sl = slice(start, start + count)
        zc = closed_z(p2[sl, 0], s)
        p2[sl, 1] = zc + (p2[sl, 1] - zc) * 0.04
        lift[sl] = -0.0025
        start, count = spans[("lash", s)]
        sl = slice(start, start + count)
        u = np.clip((p2[sl, 0] - A.EYE_X * s) / (EYE_A * 1.02), -1, 1)
        upper = A.EYE_Z + EYE_B * 0.93 * np.sqrt(1 - u ** 2)
        p2[sl, 1] -= upper - closed_z(p2[sl, 0], s)
        lift[sl] -= 0.0012
    return p2, lift


def _smile(p2, lift, spans):
    p2, lift = p2.copy(), lift.copy()
    for s in (1, -1):
        start, count = spans[("eye", s)]
        sl = slice(start, start + count)
        rel = (p2[sl, 1] - A.EYE_Z) / EYE_B
        p2[sl, 1] += EYE_B * 0.22 * np.clip(-rel, 0, 1) ** 1.3  # cheeks push the lower lid up
        start, count = spans[("brow", s)]
        p2[start:start + count, 1] += 0.0025
    start, count = spans["mouth"]
    sl = slice(start, start + count)
    n, rows = 15, 4
    x = p2[sl, 0].reshape(n, rows)
    f = np.tile(np.linspace(0, 1, rows), (n, 1))
    x = x * 1.12
    top, bot = mouth_curves(x / 1.12, 1.0)
    p2[sl, 0] = x.ravel()
    p2[sl, 1] = (top + (bot - top) * f).ravel()
    return p2, lift
