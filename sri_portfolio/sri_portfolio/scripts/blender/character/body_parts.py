"""SDF definitions for the skin, clothing and shoe volumes.

Each builder returns (sdf_fn, bbox_lo, bbox_hi, voxel_size). Clothing volumes
are solid shells hollowed near their openings so hems, cuffs and the collar
read as real fabric edges rather than capped tubes.
"""
from __future__ import annotations

import numpy as np

import anatomy as A
from sdf import chain, ellipsoid, rbox, rot_from, round_cone, smax, smin, sphere, ssub, value_noise, v3


# ---------------------------------------------------------------- skin

def arm_skin(s: int):
    h = A.hand(s)
    d, n, t = h["dir"], h["palm_n"], h["thumb_side"]
    rot = rot_from(d, t, n)

    def fn(p):
        upper = round_cone(p, h["shoulder"] - d * 0.01, h["elbow"], 0.038, 0.032)
        fore = round_cone(p, h["elbow"], h["wrist"], 0.032, 0.025)
        dist = smin(upper, fore, 0.02)
        palm_c = h["wrist"] + d * 0.024 + n * 0.001
        palm = rbox(p, palm_c, (0.026, 0.028, 0.0105), 0.0095, rot)
        # soft pads: heel of the hand and the thenar mound under the thumb
        pad = ellipsoid(p, h["wrist"] + d * 0.012 + n * 0.006 + t * 0.008, (0.018, 0.02, 0.009), rot)
        palm = smin(palm, pad, 0.008)
        dist = smin(dist, palm, 0.016)
        fingers = None
        for name, pts in h["chains"].items():
            f = chain(p, pts, h["radii"][name], k=0.003)
            if name == "thumb":
                dist = smin(dist, f, 0.012)
                continue
            fingers = f if fingers is None else np.minimum(fingers, f)
        dist = smin(dist, fingers, 0.0055)
        return dist

    pts = np.array([h["shoulder"], h["wrist"]] + [q for c in h["chains"].values() for q in c])
    return fn, pts.min(0) - 0.05, pts.max(0) + 0.05, 0.0012


def head_skin():
    c = A.HEAD_CENTER

    def fn(p):
        cranium = ellipsoid(p, c + v3((0, 0.006, 0.014)), (0.182, 0.172, 0.16))
        lower = ellipsoid(p, c + v3((0, -0.014, -0.07)), (0.166, 0.146, 0.106))
        dist = smin(cranium, lower, 0.06)
        for s in (-1, 1):
            cheek = sphere(p, c + v3((0.07 * s, -0.07, -0.095)), 0.07)
            dist = smin(dist, cheek, 0.06)
        chin = sphere(p, c + v3((0, -0.085, -0.13)), 0.045)
        dist = smin(dist, chin, 0.05)
        nose = ellipsoid(p, NOSE, (0.0085, 0.007, 0.0068))
        dist = smin(dist, nose, 0.012)
        for s in (-1, 1):
            ear_c = c + v3((0.17 * s, 0.024, -0.058))
            ear_rot = rot_from((1, 0.0, 0.0), (0.0, 1.0, 0.25), (0, -0.25, 1.0))
            ear = ellipsoid(p, ear_c + v3((0.01 * s, 0, 0)), (0.02, 0.026, 0.038), ear_rot)
            bowl = ellipsoid(p, ear_c + v3((0.026 * s, -0.004, 0.0)), (0.01, 0.016, 0.025), ear_rot)
            ear = ssub(ear, bowl, 0.005)
            dist = smin(dist, ear, 0.012)
        neck = round_cone(p, (0, 0.012, 0.765), (0, 0.01, 0.95), 0.047, 0.05)
        dist = smin(dist, neck, 0.03)
        return dist

    lo = c - v3((0.23, 0.22, 0.30))
    hi = c + v3((0.23, 0.22, 0.2))
    return fn, lo, hi, 0.0022


NOSE = np.array([0.0, -0.166, 0.972], np.float32)


# ---------------------------------------------------------------- clothing

def _hollow(outer, openness, thickness):
    """Carve the inside of `outer` wherever openness < 0 (near an opening)."""
    inner = smax(outer + thickness, openness, 0.004)
    return smax(outer, -inner, 0.0015)


def ecapsule(p, a, b, ra, rb, yscale):
    """Round cone with an elliptical cross-section (deeper in X than in Y)."""
    q = p * np.array([1.0, yscale, 1.0], np.float32)
    return round_cone(q, a, b, ra, rb)


def shirt():
    arms = [A.arm(s) for s in (-1, 1)]

    def fn(p):
        z = p[:, 2]
        torso = ecapsule(p, (0, 0.0, 0.585), (0, 0.0, 0.71), 0.15, 0.12, 1.36)
        # folds: soft horizontal drape above the hem, broad noise for slack cloth
        wave = np.sin(z * 95 + value_noise(p, 18, 1) * 2.5) * np.clip((0.68 - z) / 0.08, 0, 1)
        torso = torso - 0.0018 * wave * np.clip((z - 0.55) / 0.03, 0, 1)
        torso = smax(torso, 0.552 - z, 0.003)
        openings = z - 0.587
        dist = torso
        for a in arms:
            axis = (a["elbow"] - a["shoulder"]) / np.linalg.norm(a["elbow"] - a["shoulder"])
            end = a["shoulder"] + (a["elbow"] - a["shoulder"]) * 0.6
            along = (p - end) @ axis
            sh = sphere(p, a["shoulder"] + v3((-0.006 * np.sign(a["shoulder"][0]), 0, 0.0)), 0.049)
            sleeve = smin(sh, round_cone(p, a["shoulder"], end + axis * 0.01, 0.049, 0.047), 0.02)
            sleeve = sleeve - 0.0015 * np.sin(along * 160 + value_noise(p, 25, 3) * 2) * np.clip(1 + along / 0.04, 0, 1)
            sleeve = smax(sleeve, along, 0.003)
            dist = smin(dist, sleeve, 0.04)
            openings = np.minimum(openings, np.maximum(-along - 0.03, sleeve - 0.02))
        dist = dist - 0.0022 * value_noise(p, 22, 2)
        neck = round_cone(p, (0, 0.012, 0.76), (0, 0.004, 0.95), 0.051, 0.058)
        dist = ssub(dist, neck, 0.006)
        openings = np.minimum(openings, neck - 0.025)
        dist = _hollow(dist, openings, 0.0045)
        return smin(dist, _collar(p), 0.004)

    return fn, v3((-0.3, -0.16, 0.5)), v3((0.3, 0.16, 0.9)), 0.0025


def _collar(p):
    """Ribbed crew-neck band: a torus tilted so it dips at the front."""
    c = v3((0, -0.002, 0.828))
    rot = rot_from((1, 0, 0), (0, 1, 0.32), (0, -0.32, 1))
    q = (p - c) @ rot
    ring = np.sqrt(q[:, 0] ** 2 + (q[:, 1] * 1.12) ** 2) - 0.056
    return np.sqrt(ring ** 2 + q[:, 2] ** 2) - 0.0065


def trousers():
    legs = [A.leg(s) for s in (-1, 1)]

    def fn(p):
        z = p[:, 2]
        dist = ellipsoid(p, (0, 0.004, 0.58), (0.118, 0.09, 0.085))
        for g in legs:
            thigh = round_cone(p, g["hip"] + v3((0, 0, 0.02)), g["knee"], 0.066, 0.059)
            shin = round_cone(p, g["knee"], g["ankle"] + v3((0, -0.004, 0.0)), 0.059, 0.057)
            dist = smin(dist, smin(thigh, shin, 0.03), 0.035)
        # stacked folds at the ankles and a few creases behind the knee
        stack = np.clip((0.17 - z) / 0.08, 0, 1)
        dist = dist - 0.0022 * np.sin(z * 150 + value_noise(p, 30, 4) * 3) * stack
        knee = np.exp(-((z - 0.3) / 0.035) ** 2) * np.clip(p[:, 1] * 30, 0, 1)
        dist = dist - 0.0018 * np.sin(z * 180) * knee - 0.0016 * value_noise(p, 20, 5)
        cut = smax(dist, 0.072 - z, 0.003)
        cut = smax(cut, z - 0.66, 0.003)
        return _hollow(cut, np.minimum(z - 0.1, 0.62 - z), 0.004)

    return fn, v3((-0.2, -0.13, 0.03)), v3((0.2, 0.13, 0.7)), 0.0025


def shoe(s: int):
    g = A.leg(s)
    x = g["ankle"][0]

    def fn(p):
        q = p.copy()
        q[:, 2] -= 1.4 * np.maximum(0.0, -0.07 - (p[:, 1])) ** 2  # toe spring
        sole = rbox(q, (x, -0.036, 0.012), (0.0435, 0.093, 0.012), 0.01)
        toe = ellipsoid(q, (x, -0.076, 0.035), (0.042, 0.056, 0.031))
        heel = ellipsoid(q, (x, 0.012, 0.052), (0.04, 0.044, 0.05))
        upper = smin(toe, heel, 0.035)
        upper = smax(upper, q[:, 2] - (0.108 - 0.25 * np.maximum(0.0, -q[:, 1])), 0.006)
        collar = round_cone(q, (x, 0.01, 0.07), (x, 0.022, 0.16), 0.03, 0.033)
        upper = ssub(upper, collar, 0.006)
        dist = smin(sole, upper, 0.004)
        for i in range(4):  # laces
            y = -0.012 - i * 0.016
            top = 0.098 - 0.25 * max(0.0, -y) + 0.003
            lace = round_cone(q, (x - 0.017, y, top - 0.002), (x + 0.017, y + 0.002, top - 0.002), 0.0032, 0.0032)
            dist = smin(dist, lace, 0.002)
        return dist

    return fn, v3((x - 0.08, -0.17, -0.01)), v3((x + 0.08, 0.1, 0.15)), 0.0016


def shoe_part(p: np.ndarray, x: float) -> np.ndarray:
    """Face classifier for the shoe: 0 sole, 1 upper, 2 laces."""
    part = np.ones(len(p), dtype=np.int32)
    lift = 1.4 * np.maximum(0.0, -0.07 - p[:, 1]) ** 2
    part[p[:, 2] - lift < 0.023] = 0
    top = 0.098 - 0.25 * np.maximum(0.0, -p[:, 1])
    lace = (p[:, 2] > top - 0.004) & (p[:, 1] < -0.004) & (p[:, 1] > -0.07) & (np.abs(p[:, 0] - x) < 0.022)
    part[lace] = 2
    return part


def watch(s: int = 1):
    """Black sport watch on the left wrist, like the avatar reference."""
    a = A.arm(s)
    d, n, t = a["dir"], a["palm_n"], a["thumb_side"]
    c = a["elbow"] + (a["wrist"] - a["elbow"]) * 0.87
    rot = rot_from(d, t, n)

    def fn(p):
        q = (p - c) @ rot
        radial = np.sqrt(q[:, 1] ** 2 + (q[:, 2] * 1.1) ** 2)
        band = smax(np.abs(radial - 0.0272) - 0.0022, np.abs(q[:, 0]) - 0.0075, 0.0015)
        face = rbox(p, c - n * 0.0265, (0.0105, 0.0115, 0.0035), 0.003, rot)
        return smin(band, face, 0.002)

    return fn, c - 0.05, c + 0.05, 0.0008
