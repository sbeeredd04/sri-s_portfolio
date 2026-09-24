"""Base shapes and displacement stacks for the three valley granite forms.

Coordinates are the form's local three.js frame (lx, y, lz) in metres, matching
app/lib/valley-layout.mjs: the component places each GLB at form.x/z and turns
it about Y. The wall's base surface is a direct port of wallFrame()/wallBack()
so the waterfall ribbon (computed from the analytic face) still sits in the chute.
"""
from __future__ import annotations

import numpy as np

from granite_noise import fbm, smoothstep, worley

WALL = {"length": 11.2, "height": 10.6, "thickness": 4.6, "talus": 2.5, "fall_u": 0.57, "seed": 1,
        "hx": 4.75, "hz": 5.8, "shape": "box"}
DOME = {"width": 8.15, "depth": 6.7, "height": 8.7, "seed": 3, "hx": 4.25, "hz": 3.52, "shape": "ellipse"}
RIDGE = {"width": 14.2, "depth": 3.35, "height": 4.35, "seed": 5, "hx": 6.9, "hz": 1.85, "shape": "ellipse"}
FALL_LZ = (WALL["fall_u"] - 0.5) * WALL["length"]  # 0.784 m


# ---------------------------------------------------------------- wall (parametric, closed)

def _wall_notch(u):
    """Crest breakup that only lowers the top, and stays clear of the waterfall lip."""
    away = smoothstep(0.05, 0.12, np.abs(u - WALL["fall_u"]))
    return away * (1.2 * np.maximum(0, np.sin(u * 23 + 1.7)) ** 6
                   + 0.9 * np.maximum(0, np.sin(u * 41 + 0.4)) ** 12
                   + 0.3 * (1 + np.sin(u * 9.3)))


def wall_frame(u, v):
    w = WALL
    crest = w["height"] * (0.74 + 0.26 * np.sin(np.pi * np.clip(u, 0, 1)) ** 1.15)
    y = -0.48 + v * crest - smoothstep(0.85, 1.0, v) * _wall_notch(u)
    lz = (u - 0.5) * w["length"]
    apron = np.where(v < 0.18, np.clip(1 - v / 0.18, 0, 1) ** 1.4 * w["talus"], 0.0)
    batter = np.maximum(0, v - 0.14) * 0.42
    joint = (np.sin(u * 19 + w["seed"]) * 0.05 * np.sin(v * np.pi)
             + 0.2 * np.abs(np.cos(u * 22 + w["seed"])) ** 10 * np.sin(v * np.pi)
             + np.sin(v * 27 + 2) * 0.018)
    du = (u - w["fall_u"]) / 0.065
    lip = 0.82 * np.exp(-du * du * 2) * np.exp(-(((v - 0.83) / 0.035) ** 2))
    return np.stack([apron - batter + joint + lip, y, lz], axis=-1)


def wall_back(u, v):
    face = wall_frame(u, v)
    depth = WALL["thickness"] * (0.62 + 0.38 * (1 - v))
    rounding = np.sin(u * np.pi) * 0.28 * (1 - v * 0.5)
    return np.stack([face[..., 0] - depth - rounding, face[..., 1], face[..., 2]], axis=-1)


def wall_mesh(nu: int = 220, nv: int = 200) -> tuple[np.ndarray, list]:
    """Closed tube: each u slice is a loop front(v 0..1) + back(v 1..0); ends are fan-capped."""
    u = np.linspace(0, 1, nu + 1)[:, None]
    v = np.linspace(0, 1, nv + 1)[None, :]
    front = wall_frame(np.broadcast_to(u, (nu + 1, nv + 1)), np.broadcast_to(v, (nu + 1, nv + 1)))
    back = wall_back(np.broadcast_to(u, (nu + 1, nv + 1)), np.broadcast_to(v, (nu + 1, nv + 1)))[:, ::-1]
    loops = np.concatenate([front, back], axis=1)  # (nu+1, L, 3)
    count = loops.shape[1]
    verts = loops.reshape(-1, 3)
    faces = []
    for i in range(nu):
        for j in range(count):
            a, b = i * count + j, i * count + (j + 1) % count
            faces.append((a, b, b + count, a + count))
    centres = []
    for i, flip in ((0, True), (nu, False)):
        centre = len(verts) + len(centres)
        centres.append(loops[i].mean(0))
        for j in range(count):
            a, b = i * count + j, i * count + (j + 1) % count
            faces.append((centre, b, a) if flip else (centre, a, b))
    return np.concatenate([verts, np.array(centres)]), faces


# ---------------------------------------------------------------- heightfield forms

def _ray_to_ellipse(px, pz, cx, cz, ax, az):
    """Distance from (cx, cz) through (px, pz) to the ellipse boundary (semi-axes ax, az)."""
    dx, dz = px - cx, pz - cz
    length = np.maximum(np.hypot(dx, dz), 1e-9)
    ux, uz = dx / length, dz / length
    a = (ux / ax) ** 2 + (uz / az) ** 2
    b = 2 * (cx * ux / ax ** 2 + cz * uz / az ** 2)
    c = (cx / ax) ** 2 + (cz / az) ** 2 - 1
    t = (-b + np.sqrt(np.maximum(b * b - 4 * a * c, 0))) / (2 * a)
    return length, t


DOME_SUMMIT_Z, DOME_FOOT = -1.55, (4.02, 3.34)


def dome_distance(lx, lz):
    """0 at the summit, 1 on the footprint ellipse."""
    length, reach = _ray_to_ellipse(lx, lz, 0.0, DOME_SUMMIT_Z, *DOME_FOOT)
    return length / np.maximum(reach, 1e-6)


def dome_face_z(lx):
    return -2.3 - 0.1 * (lx / 3.0) ** 2


def dome_height(lx, lz):
    d = dome_distance(lx, lz)
    h = 8.3 * np.clip(1 - d * d, 0, 1) ** 1.1  # rounded shoulder with a flared foot
    inside = (d < 1) & (lz > dome_face_z(lx))
    return np.where(inside, -0.5 + (h + 0.5) * smoothstep(1.0, 0.96, d), -0.5)


def ridge_height(lx, lz):
    ax, az = 6.55, 1.7
    u = lx / ax
    half = az * np.sqrt(np.clip(1 - u * u, 0, 1))
    along = np.clip(1 - u * u, 0, 1) ** 0.32
    line = np.stack([u * 2.2, np.zeros_like(u), np.full_like(u, 0.5)], axis=-1).reshape(-1, 3)
    wobble = fbm(line, 4, RIDGE["seed"]).reshape(u.shape)
    crest = (0.82 + 0.16 * wobble + 0.05 * np.sin(u * 4.1 + 1)
             - 0.3 * np.maximum(0, np.sin(u * 5.2 + 0.8)) ** 30
             - 0.18 * np.maximum(0, np.sin(u * 11.3 + 2.2)) ** 40)
    a = np.abs(lz) / np.maximum(half, 1e-6)
    across = np.clip(1 - a ** 2.6, 0, 1) ** 0.6
    h = 4.1 * along * crest * across
    return np.where(a < 1, -0.5 + (h + 0.5) * smoothstep(1.0, 0.9, a), -0.5)


def heightfield_mesh(height, x_half: float, z_half: float, step: float = 0.04) -> tuple[np.ndarray, list]:
    """Closed slab: top surface from `height`, flat bottom at y = -0.7 (removed after remeshing)."""
    xs = np.arange(-x_half, x_half + step, step)
    zs = np.arange(-z_half, z_half + step, step)
    gx, gz = np.meshgrid(xs, zs, indexing="ij")
    top = np.stack([gx, height(gx, gz), gz], axis=-1)
    bottom = np.stack([gx, np.full_like(gx, -0.7), gz], axis=-1)
    nx, nz = gx.shape
    verts = np.concatenate([top.reshape(-1, 3), bottom.reshape(-1, 3)])
    off = nx * nz
    idx = lambda i, j: i * nz + j  # noqa: E731
    faces = []
    for i in range(nx - 1):
        for j in range(nz - 1):
            a, b, c, d = idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)
            faces.append((a, d, c, b))
            faces.append((a + off, b + off, c + off, d + off))
    ring = ([idx(i, 0) for i in range(nx)] + [idx(nx - 1, j) for j in range(1, nz)]
            + [idx(i, nz - 1) for i in range(nx - 2, -1, -1)] + [idx(0, j) for j in range(nz - 2, 0, -1)])
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        faces.append((a, b, b + off, a + off))
    return verts, faces


# ---------------------------------------------------------------- displacement stacks

def _joints(p, scale, seed, width=0.07):
    f1, f2, cid = worley(p / np.asarray(scale), seed)
    return 1 - smoothstep(0.0, width, f2 - f1), cid


def _ledges(p, spacing, seed):
    t = np.mod((p[:, 1] + fbm(p / 2.2, 3, seed) * 0.7) / spacing, 1.0)
    return (1 - t) ** 2.2 * smoothstep(-0.1, 0.35, fbm(p / 4.5, 2, seed + 9))


def _surface(p, seed, rough=1.0):
    """Broad undulation plus faint grain; granite is smooth between its joints."""
    return fbm(p / 4.0, 3, seed + 3) * 0.28 + rough * (fbm(p / 0.6, 3, seed + 5) * 0.022 + fbm(p / 0.15, 2, seed + 6) * 0.008)


def displace_wall(p, n):
    s = WALL["seed"] * 101
    face = smoothstep(0.2, 0.6, n[:, 0])
    crack1, id1 = _joints(p, (2.4, 8.0, 1.9), s, 0.035)
    crack2, _ = _joints(p, (1.2, 2.6, 1.0), s + 50, 0.025)
    d = (id1 - 0.5) * 0.3 - 0.24 * crack1 - 0.05 * crack2 + _surface(p, s)
    d += face * 0.26 * _ledges(p, 1.9, s + 20)
    apron = smoothstep(1.8, 0.4, p[:, 1]) * smoothstep(0.2, 0.5, n[:, 1])
    rub, _, rub_id = worley(p / 0.75, s + 80)
    d += apron * (0.32 * (1 - smoothstep(0, 0.9, rub)) + (rub_id - 0.5) * 0.12)
    # Waterfall chute at lz = +0.78: water-polished, recessed, never bulging in front of the fall.
    near = np.exp(-(((p[:, 2] - FALL_LZ) / 0.7) ** 2)) * face * (p[:, 1] < 8.7)
    d = d * (1 - 0.85 * near)
    d = np.where(near > 0.3, np.minimum(d, 0.03), d)
    groove = np.exp(-(((p[:, 2] - FALL_LZ) / 0.3) ** 2)) * smoothstep(0.2, 0.9, p[:, 1]) * (1 - smoothstep(7.6, 7.95, p[:, 1]))
    return d - face * 0.42 * groove


def displace_dome(p, n):
    s = DOME["seed"] * 101
    face = smoothstep(0.35, 0.7, -n[:, 2])
    rounded = 1 - face
    dist = dome_distance(p[:, 0], p[:, 2])
    # Exfoliation: a few warped, broken plates parallel to the surface, not horizontal rings.
    shell = np.mod(dist * 4.2 + fbm(p / 2.4, 3, s) * 0.55, 1.0)
    plates = smoothstep(-0.05, 0.3, fbm(p / 3.2, 2, s + 4))
    d = rounded * 0.34 * shell ** 2.2 * plates * smoothstep(0.1, 0.3, dist)
    crack1, id1 = _joints(p, (1.6, 9.0, 1.4), s + 10, 0.035)
    crack2, _ = _joints(p, (1.1, 2.4, 1.1), s + 60, 0.025)
    d += face * (id1 - 0.5) * 0.34 - (0.3 * face + 0.05 * rounded) * crack1 - 0.04 * crack2
    d += face * 0.2 * _ledges(p, 2.2, s + 30)
    return d + _surface(p, s, rough=0.6 + 0.4 * face)


def displace_ridge(p, n):
    s = RIDGE["seed"] * 101
    top = smoothstep(0.5, 0.85, n[:, 1])
    crack1, id1 = _joints(p, (2.0, 4.5, 1.6), s, 0.035)
    crack2, _ = _joints(p, (1.0, 1.8, 1.0), s + 40, 0.025)
    d = (id1 - 0.5) * 0.3 - 0.26 * crack1 - 0.04 * crack2 + _surface(p, s)
    d += (1 - top) * 0.2 * _ledges(p, 1.1, s + 25)
    return d


def clamp_to_form(p, form, y_max):
    """Keep every vertex inside the form's exclusion (before rotation) and between y=-0.5 and y_max."""
    p = p.copy()
    if form["shape"] == "box":
        p[:, 0] = np.clip(p[:, 0], -form["hx"] + 0.02, form["hx"] - 0.02)
        p[:, 2] = np.clip(p[:, 2], -form["hz"] + 0.02, form["hz"] - 0.02)
    else:
        e = (p[:, 0] / form["hx"]) ** 2 + (p[:, 2] / form["hz"]) ** 2
        k = np.where(e > 0.985, np.sqrt(0.985 / np.maximum(e, 1e-9)), 1.0)
        p[:, 0] *= k
        p[:, 2] *= k
    p[:, 1] = np.clip(p[:, 1], -0.5, y_max)
    return p
