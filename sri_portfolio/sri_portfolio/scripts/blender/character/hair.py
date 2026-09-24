"""Stylised hair: tapered clump strands combed from a crown whorl over a scalp cap.

Each clump is a swept lens-shaped tube whose UV runs U around / V along the
strand, so a strand-direction normal map and anisotropic highlights line up.
Paths live on an inflated copy of the cranium ellipsoid and stop at a hairline
that varies with azimuth (fringe above the brows, above the ears, nape at back).
"""
from __future__ import annotations

import math

import bpy
import numpy as np

from sdf import ellipsoid, mesh_sdf, smax, decimate

C = np.array([0.0, 0.012, 1.066], np.float32)
R = np.array([0.182, 0.172, 0.16], np.float32)
W = np.array([0.0, 0.42, 0.91], np.float32)
W /= np.linalg.norm(W)
E1 = np.array([0.0, -1.0, 0.0], np.float32) - W * float(-W[1])
E1 /= np.linalg.norm(E1)
E2 = np.cross(W, E1)
SIDES = 6
RINGS = 10


def hairline(phi):
    knots = [0.0, 0.45, 0.9, 1.25, 1.6, 2.2, math.pi]
    zs = [1.074, 1.082, 1.05, 1.005, 1.022, 0.955, 0.93]
    return np.interp(np.abs(phi), knots, zs)


def radius_along(u):
    return 1.0 / np.sqrt(((u / R) ** 2).sum(-1))


def direction(alpha, beta):
    return (np.cos(beta)[..., None] * W
            + np.sin(beta)[..., None] * (np.cos(alpha)[..., None] * E1 + np.sin(alpha)[..., None] * E2))


def on_shell(alpha, beta, off):
    u = direction(alpha, beta)
    return C + u * (radius_along(u) + off)[..., None], u


def beta_end(alpha0, sweep, beta0):
    betas = np.linspace(beta0, 2.4, 240)
    alphas = alpha0 + sweep * (betas - beta0)
    p, _ = on_shell(alphas, betas, np.zeros_like(betas))
    phi = np.arctan2(p[:, 0], -p[:, 1])
    below = np.nonzero(p[:, 2] < hairline(phi))[0]
    return betas[below[0]] if len(below) else betas[-1]


def clump(verts, faces, uvs, alpha0, beta0, width, lift, sweep, rng, extra_len=0.0, curl=0.0):
    b1 = beta_end(alpha0, sweep, beta0) + extra_len
    s = np.linspace(0, 1, RINGS)
    beta = beta0 + (b1 - beta0) * s
    phase = rng.uniform(0, 2 * math.pi)
    alpha = alpha0 + sweep * (beta - beta0) + 0.05 * np.sin(s * 2 * math.pi * 1.1 + phase)
    off = 0.004 + lift * np.sin(np.pi * np.minimum(s / 0.55, 1.0) / 2) - lift * 0.35 * np.maximum(0, s - 0.6) / 0.4
    off += curl * s ** 2
    pts, normals = on_shell(alpha, beta, off)
    tang = np.gradient(pts, axis=0)
    tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    side = np.cross(tang, normals)
    side /= np.linalg.norm(side, axis=1, keepdims=True)
    up = np.cross(side, tang)
    w = width * np.clip(1 - s ** 2.2, 0, 1) ** 0.7 * (0.75 + 0.25 * np.minimum(1, s / 0.2))
    t = np.minimum(w * 0.42, 0.016)
    base = len(verts)
    u0 = rng.uniform(0, 1)
    for i in range(RINGS - 1):
        for k in range(SIDES + 1):
            psi = 2 * math.pi * k / SIDES
            verts.append(pts[i] + side[i] * math.cos(psi) * w[i] * 0.5 + up[i] * math.sin(psi) * t[i] * 0.5)
            uvs.append((u0 + k / SIDES, s[i]))
    tip = len(verts)
    verts.append(pts[-1])
    uvs.append((u0 + 0.5, 1.0))
    ring = SIDES + 1
    for i in range(RINGS - 2):
        for k in range(SIDES):
            a = base + i * ring + k
            faces.append([a, a + 1, a + ring + 1, a + ring])
    last = base + (RINGS - 2) * ring
    for k in range(SIDES):
        faces.append([last + k, last + k + 1, tip])
    cap = [base + k for k in range(SIDES)][::-1]
    faces.append(cap)


def build_clumps(seed: int = 7) -> bpy.types.Object:
    rng = np.random.default_rng(seed)
    verts, faces, uvs = [], [], []
    layers = [  # count, beta0 range, width, lift, alpha span
        (22, (0.1, 0.22), 0.058, 0.014, (-math.pi, math.pi)),
        (20, (0.32, 0.55), 0.05, 0.024, (-math.pi, math.pi)),
        (13, (0.62, 0.95), 0.047, 0.03, (-1.35, 1.35)),
    ]
    for count, (b0, b1), width, lift, (a0, a1) in layers:
        for i in range(count):
            alpha = a0 + (a1 - a0) * (i + rng.uniform(0.25, 0.75)) / count
            front = math.cos(alpha)
            sweep = -0.42 * max(0.0, front) ** 1.5 + 0.12
            extra = 0.06 * max(0.0, front) ** 2  # fringe tips fall a little past the hairline
            clump(verts, faces, uvs, alpha, rng.uniform(b0, b1), width * rng.uniform(0.85, 1.15),
                  lift * rng.uniform(0.85, 1.2), sweep, rng, extra_len=extra)
    for alpha, beta, width in ((2.2, 0.2, 0.034), (2.6, 0.26, 0.03)):  # cowlick at the crown
        clump(verts, faces, uvs, alpha, beta, width, 0.02, 0.0, rng, extra_len=-0.2 - beta, curl=0.05)
    mesh = bpy.data.meshes.new("HairClumps")
    mesh.from_pydata(np.array(verts).tolist(), [], faces)
    uvl = mesh.uv_layers.new(name="UVMap")
    loop_v = np.empty(len(mesh.loops), np.int32)
    mesh.loops.foreach_get("vertex_index", loop_v)
    uvl.data.foreach_set("uv", np.array(uvs, np.float32)[loop_v].ravel())
    mesh.validate()
    obj = bpy.data.objects.new("HairClumps", mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def build_cap() -> bpy.types.Object:
    def fn(p):
        shell = ellipsoid(p, C, R + 0.009)
        phi = np.arctan2(p[:, 0], -p[:, 1])
        return smax(shell, hairline(phi) + 0.006 - p[:, 2], 0.006)

    obj = mesh_sdf("HairCap", fn, C - R - 0.03, C + R + 0.03, 0.003)
    decimate(obj, 1100)
    return obj
