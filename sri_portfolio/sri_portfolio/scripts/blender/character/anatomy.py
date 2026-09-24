"""Proportions for the chibi Sri character (Blender axes: Z up, character faces -Y).

Single source of truth for joint positions: the SDF body parts and the armature
both read from here, so bones always sit inside the mesh they deform.
Units are metres; the rest pose is a 45-degree A-pose.
"""
from __future__ import annotations

import math

import numpy as np

F = np.float32
ARM_DROP = math.radians(45)

HEAD_BASE = (0.0, 0.004, 0.885)
HEAD_SCALE = 1.1  # head, face and hair are authored at 1.0 then scaled about HEAD_BASE
HEAD_TOP = (0.0, 0.004, 1.13)
HEAD_CENTER = np.array([0.0, 0.006, 1.052], F)
SKULL_R = np.array([0.183, 0.172, 0.168], F)
EYE_Z = 1.0
EYE_X = 0.068


def side(p, s: int) -> np.ndarray:
    """Mirror a left-side (+X) point to side s (+1 left, -1 right)."""
    q = np.array(p, F)
    q[0] *= s
    return q


def arm(s: int) -> dict:
    shoulder = side((0.128, 0.0, 0.785), s)
    d = np.array([math.cos(ARM_DROP) * s, 0.0, -math.sin(ARM_DROP)], F)
    elbow = shoulder + d * 0.15 + np.array([0, 0.008, 0], F)
    wrist = elbow + d * 0.13 + np.array([0, -0.012, 0], F)
    hand_dir = (wrist - elbow) / np.linalg.norm(wrist - elbow)
    # palm faces the body/down; thumb side points forward (-Y) on both hands
    fwd = np.array([0, -1.0, 0], F)
    palm_n = np.cross(hand_dir, fwd) * s
    palm_n /= np.linalg.norm(palm_n)
    thumb_side = np.cross(palm_n, hand_dir) * s
    thumb_side /= np.linalg.norm(thumb_side)
    return {
        "clavicle": side((0.022, -0.004, 0.79), s),
        "shoulder": shoulder,
        "elbow": elbow,
        "wrist": wrist,
        "dir": hand_dir,
        "palm_n": palm_n,
        "thumb_side": thumb_side,
    }


def rotate(v, axis, ang) -> np.ndarray:
    axis = np.asarray(axis, F) / np.linalg.norm(axis)
    v = np.asarray(v, F)
    return (v * math.cos(ang) + np.cross(axis, v) * math.sin(ang)
            + axis * float(axis @ v) * (1 - math.cos(ang))).astype(F)


FINGERS = {  # name: (offset across palm toward thumb, length, radius, splay deg)
    "index": (0.0195, 0.034, 0.0063, 7),
    "middle": (0.0065, 0.037, 0.0066, 1),
    "ring": (-0.0065, 0.034, 0.0062, -5),
    "pinky": (-0.0185, 0.028, 0.0056, -12),
}
SEGMENTS = (0.45, 0.31, 0.24)
PALM_LEN = 0.047


def hand(s: int) -> dict:
    """Finger joint chains: {name: [knuckle, mid, distal, tip]} plus radii."""
    a = arm(s)
    w, d, n, t = a["wrist"], a["dir"], a["palm_n"], a["thumb_side"]
    chains, radii = {}, {}
    for name, (off, length, rad, splay) in FINGERS.items():
        base = w + d * (PALM_LEN - abs(off) * 0.25) + t * off - n * 0.001
        direction = rotate(d, n, math.radians(splay) * s)
        axis = np.cross(direction, n)  # curl axis: bends toward the palm
        pts = [base]
        seg_dir = direction
        for i, frac in enumerate(SEGMENTS):
            seg_dir = rotate(seg_dir, axis, math.radians((8, 14, 12)[i]))
            pts.append(pts[-1] + seg_dir * length * frac)
        chains[name] = pts
        radii[name] = [rad * 1.08, rad, rad * 0.95, rad * 0.86]
    tb = w + d * 0.012 + t * 0.017 + n * 0.006
    tdir = d * 0.55 + t * 0.62 + n * 0.45
    tdir /= np.linalg.norm(tdir)
    taxis = np.cross(tdir, n)
    pts = [tb]
    seg_dir = tdir
    for i, length in enumerate((0.021, 0.017, 0.015)):
        seg_dir = rotate(seg_dir, taxis, math.radians((4, 10, 10)[i]))
        pts.append(pts[-1] + seg_dir * length)
    chains["thumb"] = pts
    radii["thumb"] = [0.0095, 0.0078, 0.0072, 0.0064]
    return {"chains": chains, "radii": radii, **a}


def leg(s: int) -> dict:
    return {
        "hip": side((0.064, 0.0, 0.53), s),
        "knee": side((0.068, -0.01, 0.295), s),
        "ankle": side((0.07, 0.006, 0.075), s),
        "ball": side((0.071, -0.072, 0.024), s),
        "toe": side((0.072, -0.122, 0.022), s),
    }


SPINE = {
    "hips": ((0.0, 0.0, 0.545), (0.0, 0.0, 0.615)),
    "spine": ((0.0, 0.0, 0.615), (0.0, 0.0, 0.695)),
    "chest": ((0.0, 0.0, 0.695), (0.0, 0.004, 0.8)),
    "neck": ((0.0, 0.004, 0.8), HEAD_BASE),
    "head": (HEAD_BASE, HEAD_TOP),
}
