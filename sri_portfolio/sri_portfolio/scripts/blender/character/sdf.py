"""Signed-distance modelling helpers (numpy) and OpenVDB meshing into Blender.

Shapes are authored as functions p (N,3) -> distance (N,). Smooth unions give the
soft, sculpted transitions (cheeks into jaw, fingers into palm) that primitive
assemblies lack. `mesh_sdf` samples a bounding box, polygonises the zero level
set with OpenVDB and returns a Blender mesh object.
"""
from __future__ import annotations

import bpy
import numpy as np
import openvdb as vdb

F = np.float32


def v3(x) -> np.ndarray:
    return np.asarray(x, dtype=F)


# ---------------------------------------------------------------- primitives

def sphere(p, c, r):
    return np.linalg.norm(p - v3(c), axis=1) - r


def ellipsoid(p, c, radii, rot: np.ndarray | None = None):
    q = p - v3(c)
    if rot is not None:
        q = q @ rot  # rot columns are the ellipsoid axes in world space
    r = v3(radii)
    k0 = np.linalg.norm(q / r, axis=1)
    k1 = np.linalg.norm(q / (r * r), axis=1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def round_cone(p, a, b, ra, rb):
    """Capsule with linearly varying radius between points a and b."""
    a, b = v3(a), v3(b)
    ba = b - a
    l2 = float(ba @ ba)
    rr = ra - rb
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = p - a
    y = pa @ ba
    z = y - l2
    xv = pa * l2 - np.outer(y, ba)
    x2 = np.einsum("ij,ij->i", xv, xv)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    out = np.empty(len(p), dtype=F)
    m1 = np.sign(z) * a2 * z2 > k
    m2 = (~m1) & (np.sign(y) * a2 * y2 < k)
    m3 = ~(m1 | m2)
    out[m1] = np.sqrt(x2[m1] + z2[m1]) * il2 - rb
    out[m2] = np.sqrt(x2[m2] + y2[m2]) * il2 - ra
    out[m3] = (np.sqrt(x2[m3] * a2 * il2) + y[m3] * rr) * il2 - ra
    return out


def chain(p, pts, radii, k=0.0):
    """Smooth union of round cones through a polyline of points."""
    d = None
    for i in range(len(pts) - 1):
        seg = round_cone(p, pts[i], pts[i + 1], radii[i], radii[i + 1])
        d = seg if d is None else (smin(d, seg, k) if k > 0 else np.minimum(d, seg))
    return d


def rbox(p, c, half, r, rot: np.ndarray | None = None):
    q = p - v3(c)
    if rot is not None:
        q = q @ rot
    q = np.abs(q) - (v3(half) - r)
    outside = np.linalg.norm(np.maximum(q, 0.0), axis=1)
    inside = np.minimum(np.max(q, axis=1), 0.0)
    return outside + inside - r


def plane(p, point, normal):
    n = v3(normal) / np.linalg.norm(normal)
    return (p - v3(point)) @ n


# ---------------------------------------------------------------- operators

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b + (a - b) * h - k * h * (1.0 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ssub(a, b, k):
    """a minus b, smoothly."""
    return smax(a, -b, k)


def union(*ds, k=0.0):
    out = ds[0]
    for d in ds[1:]:
        out = smin(out, d, k) if k > 0 else np.minimum(out, d)
    return out


def rot_from(x, y, z) -> np.ndarray:
    """Matrix with the given (orthonormalised) axes as columns."""
    x = v3(x) / np.linalg.norm(x)
    y = v3(y) - x * float(np.dot(y, x))
    y /= np.linalg.norm(y)
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=1).astype(F)


def value_noise(p, scale: float, seed: int = 0) -> np.ndarray:
    """Cheap smooth 3D noise in [-1, 1] (trilinear hashed lattice)."""
    q = p * scale + seed * 17.13
    i = np.floor(q).astype(np.int64)
    f = q - i
    f = f * f * (3 - 2 * f)

    def h(ix, iy, iz):
        n = (ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791) ^ (seed * 2654435761)
        n = (n ^ (n >> 13)) * 1274126177
        return ((n & 0xFFFF) / 32767.5 - 1.0).astype(F)

    x, y, z = i[:, 0], i[:, 1], i[:, 2]
    fx, fy, fz = f[:, 0], f[:, 1], f[:, 2]
    c00 = h(x, y, z) * (1 - fx) + h(x + 1, y, z) * fx
    c10 = h(x, y + 1, z) * (1 - fx) + h(x + 1, y + 1, z) * fx
    c01 = h(x, y, z + 1) * (1 - fx) + h(x + 1, y, z + 1) * fx
    c11 = h(x, y + 1, z + 1) * (1 - fx) + h(x + 1, y + 1, z + 1) * fx
    return (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz


# ---------------------------------------------------------------- meshing

def sample(fn, lo, hi, h: float, chunk: int = 1_500_000) -> tuple[np.ndarray, np.ndarray]:
    lo, hi = v3(lo), v3(hi)
    dims = np.ceil((hi - lo) / h).astype(int) + 1
    xs = [lo[i] + np.arange(dims[i], dtype=F) * h for i in range(3)]
    grid = np.stack(np.meshgrid(*xs, indexing="ij"), axis=-1).reshape(-1, 3)
    out = np.empty(len(grid), dtype=F)
    for s in range(0, len(grid), chunk):
        out[s:s + chunk] = fn(grid[s:s + chunk])
    return out.reshape(dims), lo


def mesh_sdf(name: str, fn, lo, hi, h: float) -> bpy.types.Object:
    field, origin = sample(fn, lo, hi, h)
    grid = vdb.FloatGrid()
    grid.copyFromArray(field)
    points, quads = grid.convertToQuads(0.0)
    points = points.astype(F) * h + origin
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points.tolist(), [], quads[:, ::-1].tolist())
    mesh.validate()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    orient_outward(obj)
    return obj


def orient_outward(obj: bpy.types.Object) -> None:
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()


def remesh(obj: bpy.types.Object, faces: int) -> None:
    """Even quad topology at a target face count (QuadriFlow), smooth shaded."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.quadriflow_remesh(target_faces=faces, use_preserve_sharp=False, use_mesh_symmetry=False, seed=3)
    bpy.ops.object.shade_smooth()


def decimate(obj: bpy.types.Object, tris: int) -> None:
    obj.data.calc_loop_triangles()
    ratio = min(1.0, tris / max(1, len(obj.data.loop_triangles)))
    mod = obj.modifiers.new("dec", "DECIMATE")
    mod.ratio = ratio
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.shade_smooth()


# ---------------------------------------------------------------- probing

def raycast(fn, origins, dirs, tmax: float, steps: int = 160) -> np.ndarray:
    """First surface hit along each ray (vectorised march + bisection)."""
    origins, dirs = np.asarray(origins, F), np.asarray(dirs, F)
    dirs = dirs / np.linalg.norm(dirs, axis=1, keepdims=True)
    ts = np.linspace(0, tmax, steps, dtype=F)
    prev = fn(origins)
    lo = np.zeros(len(origins), F)
    hi = np.full(len(origins), tmax, F)
    found = np.zeros(len(origins), bool)
    for t0, t1 in zip(ts[:-1], ts[1:]):
        cur = fn(origins + dirs * t1)
        hit = (~found) & (prev > 0) & (cur <= 0)
        lo[hit], hi[hit] = t0, t1
        found |= hit
        prev = cur
    for _ in range(24):
        mid = (lo + hi) * 0.5
        inside = fn(origins + dirs * mid[:, None]) <= 0
        hi = np.where(inside, mid, hi)
        lo = np.where(inside, lo, mid)
    return origins + dirs * ((lo + hi) * 0.5)[:, None]


def gradient(fn, pts, eps: float = 5e-4) -> np.ndarray:
    pts = np.asarray(pts, F)
    g = np.zeros_like(pts)
    for i in range(3):
        e = np.zeros(3, F)
        e[i] = eps
        g[:, i] = fn(pts + e) - fn(pts - e)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
