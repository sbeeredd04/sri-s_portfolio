"""The visitor variant: same body, skeleton and clips as Sri, a different look.

A pull-over hoodie (hood, kangaroo pocket, drawstrings, ribbed cuffs and hem),
a knit beanie with a pom-pom, copper curls peeking out under the cuff, lighter
skin, green eyes and a small backpack whose straps are swept over the hoodie.
Shapes are authored in the same frame as body_parts (Z up, facing -Y); the
beanie and curls are authored at head scale 1.0 like the rest of the head.
"""
from __future__ import annotations

import math

import bpy
import numpy as np

import anatomy as A
import body_parts as B
import materials as M
import rig as RIG
from hair import C as SKULL_C, R as SKULL_R
from look import ao_albedo, linen
from sdf import (chain, ellipsoid, gradient, orient_outward, rbox, rot_from, round_cone, smax, smin,
                 sphere, ssub, value_noise, v3)

PALETTE = {  # sRGB; same keys as look.SRI
    "prefix": "visitor",
    "skin": (0.93, 0.74, 0.62),
    "skin_map": np.array([0.93, 0.74, 0.62], np.float32),
    "blush": np.array([0.95, 0.56, 0.5], np.float32),
    "lash": (0.14, 0.07, 0.045),
    "brow": (0.4, 0.18, 0.085),
    "iris": ((0.035, 0.06, 0.035), (0.2, 0.36, 0.19)),
    "hair": ((0.3, 0.115, 0.05), (0.56, 0.27, 0.13)),
    "shirt": (0.8, 0.37, 0.3),        # coral hoodie; the site retints it
    "trousers": (0.13, 0.17, 0.27),   # dark denim
}
BEANIE = (0.05, 0.3, 0.28)            # teal knit
RIBS = 36                             # knit ribs around the beanie
PACK = (0.86, 0.58, 0.17)             # mustard canvas
TRIS = {"hoodie": 3400, "beanie": 1800, "curls": 3000, "pack": 1100, "cap": 600}
CUFF_T = 0.78        # sleeve cuff starts this far along the forearm
CUFF_LEN = 0.022
HEM_Z = 0.545


def _ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- hoodie

def _cuff(a):
    el, wr = a["elbow"], a["wrist"]
    fdir = (wr - el) / np.linalg.norm(wr - el)
    return el + (wr - el) * CUFF_T, fdir


def _sleeve(p, a):
    """Solid sleeve from the shoulder to the ribbed cuff; returns (dist, along_end)."""
    sh, el = a["shoulder"], a["elbow"]
    cuff, fdir = _cuff(a)
    top = sphere(p, sh + v3((-0.006 * np.sign(sh[0]), 0, 0)), 0.053)
    upper = round_cone(p, sh, el, 0.053, 0.048)
    fore = round_cone(p, el, cuff, 0.048, 0.043)
    d = smin(smin(top, upper, 0.02), fore, 0.018)
    along = (p - cuff) @ fdir
    d = d - 0.0017 * np.sin(along * 140 + value_noise(p, 25, 3) * 2) * np.clip(1 + along / 0.09, 0, 1)
    d = smax(d, along, 0.004)
    band = round_cone(p, cuff - fdir * 0.004, cuff + fdir * CUFF_LEN, 0.037, 0.035)
    end = along - CUFF_LEN
    band = smax(band, end, 0.002)
    return smin(d, band, 0.005), end


def _torso(p):
    z = p[:, 2]
    d = B.ecapsule(p, (0, 0.0, 0.58), (0, 0.0, 0.71), 0.157, 0.125, 1.34)
    rib = _ss(0.575, 0.565, z)
    phi = np.arctan2(p[:, 0], -p[:, 1])
    d = d + 0.0045 * rib - 0.0006 * np.sin(phi * 64) * rib
    wave = np.sin(z * 90 + value_noise(p, 18, 1) * 2.5) * np.clip((0.66 - z) / 0.07, 0, 1) * (1 - rib)
    d = d - 0.0018 * wave
    pocket = rbox(p, (0, -0.12, 0.612), (0.072, 0.05, 0.034), 0.012)
    d = np.minimum(d, smax(d - 0.0055, pocket, 0.003))
    return smax(d, HEM_Z - z, 0.003)


def _hood(p):
    """Hood lying on the upper back plus a thick rolled rim around the neck."""
    c = v3((0, 0.006, 0.822))
    rot = rot_from((1, 0, 0), (0, 1, 0.32), (0, -0.32, 1))
    q = (p - c) @ rot
    back = _ss(-0.3, 1.0, q[:, 1] / 0.066)
    ring = np.sqrt(q[:, 0] ** 2 + (q[:, 1] * 1.1) ** 2) - (0.064 + 0.008 * back)
    rim = np.sqrt(ring ** 2 + (q[:, 2] + 0.006 * back) ** 2) - (0.012 + 0.014 * back)
    drape = ellipsoid(p, (0, 0.08, 0.792), (0.08, 0.04, 0.056))
    fold = 0.0018 * np.sin(p[:, 0] * 120 + value_noise(p, 30, 8) * 2) * np.clip((p[:, 1] - 0.05) / 0.03, 0, 1)
    return smin(rim, drape - fold, 0.018)


def hoodie():
    """Returns {'spec': sdf spec, 'fn': outer surface, 'solid': unhollowed volume, 'arms': arm dicts}."""
    arms = [A.arm(s) for s in (-1, 1)]

    def base(p):
        d = _torso(p)
        openings = p[:, 2] - (HEM_Z + 0.03)
        for a in arms:
            sl, end = _sleeve(p, a)
            d = smin(d, sl, 0.04)
            openings = np.minimum(openings, np.maximum(-end - 0.03, sl - 0.02))
        d = d - 0.002 * value_noise(p, 22, 2)
        neck = round_cone(p, (0, 0.012, 0.76), (0, 0.004, 0.95), 0.054, 0.062)
        d = ssub(d, neck, 0.006)
        openings = np.minimum(openings, neck - 0.022)
        return d, openings

    def solid(p):
        return smin(base(p)[0], _hood(p), 0.01)

    strings = []
    for s in (-1, 1):
        x = 0.024 * s
        zs = np.linspace(0.79, 0.7, 6, dtype=np.float32)
        probe = np.stack([np.full_like(zs, x), np.full_like(zs, -0.2), zs], 1)
        ys = _surface_y(solid, probe)
        pts = [v3((x + 0.002 * s * i, y - 0.0045, z)) for i, (y, z) in enumerate(zip(ys, zs))]
        strings.append(pts)

    def fn(p):
        d, openings = base(p)
        d = B._hollow(d, openings, 0.0045)
        d = smin(d, _hood(p), 0.01)
        for pts in strings:
            cord = chain(p, pts, [0.005] * (len(pts) - 1) + [0.0068])
            d = smin(d, cord, 0.003)
        return d

    spec = (fn, v3((-0.39, -0.17, HEM_Z - 0.01)), v3((0.39, 0.16, 0.88)), 0.0025)
    return {"spec": spec, "fn": fn, "solid": solid, "arms": arms}


def _surface_y(fn, probe):
    """Front surface y at each probe (x, y0, z), marching +Y."""
    lo = probe[:, 1].copy()
    hi = np.zeros(len(probe), np.float32)
    for _ in range(30):
        mid = (lo + hi) * 0.5
        q = probe.copy()
        q[:, 1] = mid
        inside = fn(q) <= 0
        hi = np.where(inside, mid, hi)
        lo = np.where(inside, lo, mid)
    return (lo + hi) * 0.5


def hidden_arm_skin(co: np.ndarray, hood: dict) -> np.ndarray:
    """Arm skin that always stays inside the sleeves (never visible through a cuff)."""
    inside = hood["solid"](co) < -0.004
    far = np.ones(len(co), bool)
    for a in hood["arms"]:
        cuff, fdir = _cuff(a)
        end = (co - cuff) @ fdir - CUFF_LEN
        same_side = np.sign(co[:, 0]) == np.sign(a["shoulder"][0])
        far &= ~(same_side & (end > -0.04))
    return inside & far


# ---------------------------------------------------------------- beanie and curls

def brim(phi):
    knots = [0.0, 0.6, 1.2, 1.6, 2.1, math.pi]
    zs = [1.104, 1.098, 1.07, 1.052, 1.025, 1.0]
    return np.interp(np.abs(phi), knots, zs)


def _phi(p):
    return np.arctan2(p[:, 0], -(p[:, 1] - SKULL_C[1]))


POM_C = SKULL_C + v3((0, 0.03, 0.205))


def beanie():
    """Rib-knit beanie: a folded cuff with a crisp crease, slight slouch, fluffy pom-pom."""
    cb = SKULL_C + v3((0, 0.004, 0.006))
    rb = SKULL_R + v3((0.02, 0.02, 0.02))
    top = POM_C

    def fn(p):
        phi = _phi(p)
        rel = p[:, 2] - brim(phi)
        d = smin(ellipsoid(p, cb, rb), ellipsoid(p, cb + v3((0, 0.035, 0.07)), (0.15, 0.14, 0.09)), 0.05)
        cuff = _ss(0.042, 0.038, rel)
        crease = np.exp(-((rel - 0.041) / 0.003) ** 2)
        d = d - 0.009 * cuff + 0.0025 * crease   # knit ribs come from the normal map (beanie_uv)
        d = smax(d, -rel, 0.003)
        pom = sphere(p, top, 0.036) - 0.006 * value_noise(p, 60, 7) - 0.003 * value_noise(p, 150, 8)
        return smin(d, pom, 0.01)

    lo = SKULL_C - SKULL_R - 0.05
    hi = SKULL_C + SKULL_R + v3((0.05, 0.05, 0.13))
    return fn, lo, hi, 0.0026


def beanie_uv(obj, centre, pom, pom_r) -> None:
    """Cylindrical UVs in rib units (u: one rib per unit, v: one stitch row per unit)."""
    mesh = obj.data
    uvl = mesh.uv_layers.get("UVMap") or mesh.uv_layers.new(name="UVMap")
    co = np.array([v.co for v in mesh.vertices], np.float32)
    phi = np.arctan2(co[:, 0] - centre[0], -(co[:, 1] - centre[1]))
    u = (phi / (2 * math.pi) + 0.5) * RIBS
    v = co[:, 2] / 0.022
    on_pom = np.linalg.norm(co - np.asarray(pom, np.float32), axis=1) < pom_r
    for poly in mesh.polygons:
        loops = list(poly.loop_indices)
        idx = [mesh.loops[i].vertex_index for i in loops]
        us = u[idx].copy()
        if us.max() - us.min() > RIBS / 2:   # face straddles the seam at the back
            us[us < RIBS / 2] += RIBS
        flat = on_pom[idx].all()
        for li, vi, uu in zip(loops, idx, us):
            uvl.data[li].uv = (0.0, 0.5) if flat else (float(uu), float(v[vi]))


def knit_normal(size: int = 32) -> np.ndarray:
    """One rib wide, one stitch row tall: a raised rib with V-shaped stitch loops."""
    v, u = np.mgrid[0:size, 0:size].astype(np.float32) / size
    rib = 0.5 + 0.5 * np.cos(2 * math.pi * u)
    lean = np.abs(((u + 0.5) % 1.0) - 0.5) * 2          # 0 at the rib crest, 1 in the purl valley
    stitch = 0.5 + 0.5 * np.cos(2 * math.pi * (v + 0.35 * (1 - lean)))
    h = rib * (0.75 + 0.25 * stitch)
    gy, gx = np.gradient(h)
    n = np.stack([-gx * 6, -gy * 3, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * 0.5 + 0.5


def _on_head(head_fn, phi, z):
    k = math.sqrt(max(0.0, 1 - ((z - SKULL_C[2]) / SKULL_R[2]) ** 2))
    p = v3((SKULL_R[0] * k * math.sin(phi), SKULL_C[1] - SKULL_R[1] * k * math.cos(phi), z))[None]
    for _ in range(5):
        p = p - head_fn(p)[:, None] * gradient(head_fn, p)
    return p[0], gradient(head_fn, p)[0]


def nape(phi):
    """Lower edge of the hair at the back; above the cuff (no hair) in front of the ears."""
    return np.interp(np.abs(phi), [0.0, 1.55, 1.9, 2.4, math.pi], [1.2, 1.2, 0.99, 0.935, 0.915])


def _curl_sites(rng):
    """(phi, z, radius): a jittered fringe row, temple tufts and a hex-packed mass at the back."""
    sites = []
    for i in range(10):
        phi = -0.92 + 1.84 * (i + rng.uniform(0.3, 0.7)) / 10
        sites.append((phi, float(brim(phi)) - rng.uniform(0.0, 0.012), rng.uniform(0.013, 0.019)))
    for sgn in (1, -1):
        for phi, dz in ((1.05, 0.012), (1.3, 0.03)):
            sites.append((sgn * phi, float(brim(phi)) - dz, rng.uniform(0.016, 0.019)))
        for row in range(4):
            count = 6 - row // 2
            for i in range(count):
                phi = 1.62 + 0.1 * row + (math.pi - 1.62 - 0.1 * row) * (i + 0.5 * (row % 2) + rng.uniform(0.2, 0.8)) / count
                top, bot = float(brim(phi)), float(nape(phi))
                z = top - 0.006 - (top - bot) * row / 3.2 + rng.uniform(-0.006, 0.006)
                if z > bot - 0.012:
                    sites.append((sgn * min(phi, math.pi), z, rng.uniform(0.018, 0.024) * (1 - 0.06 * row)))
    return sites


def curls(head_fn, seed: int = 11):
    """Copper curls under the cuff: a thin hair shell at the back studded with soft,
    spiral-grooved lumps, plus a curly fringe."""
    rng = np.random.default_rng(seed)
    lumps = []
    for phi, z, r in _curl_sites(rng):
        root, n = _on_head(head_fn, phi, z)
        lumps.append((root + n * r * 0.25, n, r, rng.uniform(0, 2 * math.pi), 1 if phi >= 0 else -1))

    def fn(p):
        d = None
        for c, n, r, spin, sgn in lumps:
            q = p - c
            h = q @ n
            t = np.cross(n, (0, 0, 1))
            t = t / max(np.linalg.norm(t), 1e-6)
            b = np.cross(n, t)
            ang = np.arctan2(q @ b, q @ t) * sgn
            rho = np.sqrt(np.maximum((q * q).sum(1) - h * h, 0))
            groove = 0.0016 * np.sin(ang + rho / r * 5.0 + spin) * np.clip(h / r + 0.3, 0, 1)
            lump = np.linalg.norm(q * (1, 1, 1.12), axis=1) - r - groove
            d = lump if d is None else smin(d, lump, 0.009)
        phi = _phi(p)
        head = head_fn(p)
        shell = smax(head - 0.007, nape(phi) + 0.01 - p[:, 2], 0.004)
        d = smin(d, shell, 0.006)
        d = smax(d, p[:, 2] - brim(phi) - 0.01, 0.003)   # nothing under the knit
        return smax(d, -(head + 0.004), 0.002)                 # nor deep inside the skull

    lo = v3((-0.25, -0.24, 0.87))
    hi = v3((0.25, 0.25, 1.13))
    return fn, lo, hi, 0.0022


# ---------------------------------------------------------------- backpack

PACK_C = v3((0, 0.125, 0.655))


def backpack(body_fn):
    """Rounded canvas pack whose inner face follows the hoodie's back."""
    handle = [v3((-0.03, 0.13, 0.745)), v3((-0.02, 0.134, 0.768)), v3((0.02, 0.134, 0.768)), v3((0.03, 0.13, 0.745))]

    def fn(p):
        box = rbox(p, PACK_C, (0.1, 0.066, 0.09), 0.05)
        box = smin(box, ellipsoid(p, PACK_C + v3((0, 0.0, 0.05)), (0.095, 0.062, 0.05)), 0.02)
        d = smax(box, -(body_fn(p) - 0.005), 0.008)
        pocket = rbox(p, PACK_C + v3((0, 0.06, -0.03)), (0.068, 0.022, 0.045), 0.02)
        d = smin(d, pocket, 0.004)
        seam = np.abs(p[:, 1] - (PACK_C[1] + 0.02)) - 0.0012   # zip piping around the sides
        d = smin(d, smax(seam, box - 0.0025, 0.001), 0.001)
        return smin(d, chain(p, handle, [0.0055] * 4), 0.004)

    lo = PACK_C - v3((0.13, 0.1, 0.12))
    hi = PACK_C + v3((0.13, 0.12, 0.13))
    return fn, lo, hi, 0.0022


def _catmull(pts, n):
    pts = np.asarray(pts, np.float32)
    ext = np.vstack([2 * pts[0] - pts[1], pts, 2 * pts[-1] - pts[-2]])
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1:i + 3]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    return np.array(out, np.float32)


def _project(fn, pts, off):
    for _ in range(8):
        pts = pts - (fn(pts) - off)[:, None] * gradient(fn, pts)
    return pts


STRAP_GUIDE = [  # left strap (+X); the right one is mirrored. Both ends sink into the pack.
    (0.066, 0.13, 0.715), (0.08, 0.085, 0.79), (0.094, 0.02, 0.836), (0.1, -0.05, 0.8),
    (0.112, -0.086, 0.735), (0.136, -0.05, 0.668), (0.146, 0.03, 0.628), (0.11, 0.12, 0.6),
]


def build_straps(body_fn, width=0.026, thick=0.0055, sides=6) -> bpy.types.Object:
    verts, faces = [], []
    for s in (1, -1):
        guide = np.array(STRAP_GUIDE, np.float32) * np.array([s, 1, 1], np.float32)
        pts = _project(body_fn, _catmull(guide, 3), 0.0)
        for _ in range(2):
            pts[1:-1] = 0.25 * pts[:-2] + 0.5 * pts[1:-1] + 0.25 * pts[2:]
            pts = _project(body_fn, pts, 0.0)
        nrm = gradient(body_fn, pts)
        pts = pts + nrm * (thick * 0.5 + 0.0022)
        tang = np.gradient(pts, axis=0)
        tang /= np.linalg.norm(tang, axis=1, keepdims=True)
        bi = np.cross(tang, nrm)
        bi /= np.linalg.norm(bi, axis=1, keepdims=True)
        up = np.cross(bi, tang)
        base = len(verts)
        for i in range(len(pts)):
            for k in range(sides):
                psi = 2 * math.pi * (k + 0.5) / sides
                c, sn = math.cos(psi), math.sin(psi)
                # squared-off ellipse: flat webbing with rounded edges
                cx = np.sign(c) * abs(c) ** 0.4
                sy = np.sign(sn) * abs(sn) ** 0.4
                verts.append(pts[i] + bi[i] * cx * width * 0.5 + up[i] * sy * thick * 0.5)
        for i in range(len(pts) - 1):
            for k in range(sides):
                a, b = base + i * sides + k, base + i * sides + (k + 1) % sides
                faces.append([a, b, b + sides, a + sides])
        faces.append([base + k for k in range(sides)][::-1])
        last = base + (len(pts) - 1) * sides
        faces.append([last + k for k in range(sides)])
    mesh = bpy.data.meshes.new("Straps")
    mesh.from_pydata(np.array(verts).tolist(), [], faces)
    mesh.validate()
    obj = bpy.data.objects.new("Straps", mesh)
    bpy.context.scene.collection.objects.link(obj)
    orient_outward(obj)
    return obj


def weight_backpack(pack, shirt, pack_fn) -> None:
    """Pack body rides the chest (a little spine at the bottom); straps copy the hoodie under them."""
    from mathutils.kdtree import KDTree

    co = RIG.verts(pack)
    sco = RIG.verts(shirt)
    names = [vg.name for vg in shirt.vertex_groups]
    dense = np.zeros((len(sco), len(names)), np.float32)
    for v in shirt.data.vertices:
        for g in v.groups:
            dense[v.index, g.group] = g.weight
    tree = KDTree(len(sco))
    for i, p in enumerate(sco):
        tree.insert(p, i)
    tree.balance()
    cloth = np.zeros((len(co), len(names)), np.float32)
    for i, p in enumerate(co):
        near = tree.find_n(p, 4)
        wsum = 0.0
        for _, j, dist in near:
            k = 1.0 / max(dist, 1e-4)
            cloth[i] += dense[j] * k
            wsum += k
        cloth[i] /= max(wsum, 1e-9)
    cloth /= np.maximum(cloth.sum(1, keepdims=True), 1e-9)
    rigid = np.zeros_like(cloth)
    chest = 0.45 + 0.55 * _ss(0.58, 0.72, co[:, 2])
    for name, w in (("chest", chest), ("spine", 1 - chest)):
        if name in names:
            rigid[:, names.index(name)] = w
    blend = _ss(0.004, 0.02, pack_fn(co))[:, None]
    final = rigid * (1 - blend) + cloth * blend
    RIG.set_weights(pack, {n: final[:, i] for i, n in enumerate(names)})


# ---------------------------------------------------------------- materials

def dress_extras(objs: dict, size: int = 256) -> None:
    pre = PALETTE["prefix"]
    knit = M.principled("beanie", BEANIE, 0.92, **{"Sheen Weight": 0.12, "Sheen Roughness": 0.5,
                                                  "Sheen Tint": (0.5, 0.7, 0.66, 1.0)})
    objs["Beanie"].data.materials.append(knit)
    M.set_normal(knit, M.save(f"{pre}_knit_normal", knit_normal(), "Non-Color"), strength=0.6)

    weave = next((img for img in bpy.data.images if img.filepath == str(M.LINEN_NORMAL)), None) or linen()
    pack = objs["Backpack"]
    mat = M.principled("backpack", (1, 1, 1), 0.72)
    pack.data.materials.append(mat)
    ao = M.bake_ao(pack, size)
    pos, _ = M.bake_positions(pack, size)
    mottle = 0.05 * value_noise(pos.reshape(-1, 3), 40, 9).reshape(ao.shape)
    M.set_albedo(mat, M.save(f"{pre}_backpack_ao", ao_albedo(ao, 0.5, mottle)), PACK)
    M.set_normal(mat, weave, strength=0.9, uv_scale=10.0)
