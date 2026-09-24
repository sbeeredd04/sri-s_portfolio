"""Vectorised numpy noise for granite displacement: hashed value noise, fBm and 3D Worley (F1/F2/cell id).

All functions take (N, 3) float arrays in metres and are deterministic for a given seed.
"""
from __future__ import annotations

from itertools import product

import numpy as np

_MASK = np.uint64(0xFFFFFFFF)


def _hash(ix: np.ndarray, iy: np.ndarray, iz: np.ndarray, seed: int) -> np.ndarray:
    h = (ix.astype(np.int64) * 73856093) ^ (iy.astype(np.int64) * 19349663) ^ (iz.astype(np.int64) * 83492791)
    h = (h.astype(np.uint64) ^ np.uint64(seed * 2654435761 & 0xFFFFFFFF)) & _MASK
    for _ in range(2):
        h ^= h >> np.uint64(16)
        h = (h * np.uint64(0x45D9F3B)) & _MASK
    h ^= h >> np.uint64(16)
    return h.astype(np.float64) / 4294967296.0


def value_noise(p: np.ndarray, seed: int = 0) -> np.ndarray:
    """Smooth value noise in [-1, 1]."""
    i = np.floor(p)
    f = p - i
    u = f * f * (3 - 2 * f)
    i = i.astype(np.int64)
    out = np.zeros(len(p))
    for dx, dy, dz in product((0, 1), repeat=3):
        w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
        out += w * _hash(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
    return out * 2 - 1


def fbm(p: np.ndarray, octaves: int = 4, seed: int = 0, gain: float = 0.5) -> np.ndarray:
    total, amp, norm = np.zeros(len(p)), 1.0, 0.0
    for octave in range(octaves):
        total += amp * value_noise(p * (2.0 ** octave), seed + octave * 17)
        norm += amp
        amp *= gain
    return total / norm


def worley(p: np.ndarray, seed: int = 0, chunk: int = 200000) -> tuple:
    """Distances to the nearest and second-nearest jittered feature point, plus a hash of the nearest cell."""
    f1 = np.empty(len(p))
    f2 = np.empty(len(p))
    cid = np.empty(len(p))
    for start in range(0, len(p), chunk):
        q = p[start:start + chunk]
        cell = np.floor(q).astype(np.int64)
        best1 = np.full(len(q), np.inf)
        best2 = np.full(len(q), np.inf)
        ident = np.zeros(len(q))
        for dx, dy, dz in product((-1, 0, 1), repeat=3):
            c = cell + np.array([dx, dy, dz])
            feature = c + np.stack([_hash(c[:, 0], c[:, 1], c[:, 2], seed + k) for k in range(3)], axis=1)
            d2 = ((feature - q) ** 2).sum(1)
            closer = d2 < best1
            best2 = np.where(closer, best1, np.minimum(best2, d2))
            ident = np.where(closer, _hash(c[:, 0], c[:, 1], c[:, 2], seed + 7), ident)
            best1 = np.where(closer, d2, best1)
        f1[start:start + chunk] = np.sqrt(best1)
        f2[start:start + chunk] = np.sqrt(best2)
        cid[start:start + chunk] = ident
    return f1, f2, cid


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)
