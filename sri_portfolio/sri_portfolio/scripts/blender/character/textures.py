"""Procedural texture images authored in numpy (eye, hair strands)."""
from __future__ import annotations

import bpy
import numpy as np


def to_image(name: str, rgba: np.ndarray, colorspace: str = "sRGB") -> bpy.types.Image:
    h, w = rgba.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=rgba.shape[2] == 4 and bool((rgba[..., 3] < 1).any()))
    img.colorspace_settings.name = colorspace
    if rgba.shape[2] == 3:
        rgba = np.concatenate([rgba, np.ones((h, w, 1), np.float32)], axis=2)
    img.pixels.foreach_set(np.ascontiguousarray(rgba, np.float32).ravel())
    img.pack()
    return img


def srgb_to_linear(c):
    c = np.asarray(c, np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def eye_texture(size: int = 256) -> np.ndarray:
    """sRGB eye: warm sclera, big layered brown iris, pupil, two catchlights."""
    v, u = np.mgrid[0:size, 0:size].astype(np.float32) / (size - 1)
    x, y = u - 0.5, v - 0.45
    r = np.sqrt(x * x + y * y)
    ang = np.arctan2(y, x)
    sclera = np.array([0.95, 0.93, 0.9], np.float32)
    col = np.broadcast_to(sclera, (size, size, 3)).copy()
    col *= (1 - 0.12 * _smooth(0.25, 0.5, v))[..., None]  # upper-lid shadow
    iris_r = 0.455
    fibres = 0.5 + 0.5 * np.sin(ang * 23 + np.sin(ang * 7) * 2) * np.sin(ang * 11 + 1.3)
    t = np.clip(r / iris_r, 0, 1)
    dark = np.array([0.07, 0.04, 0.025], np.float32)
    warm = np.array([0.3, 0.17, 0.09], np.float32)
    iris = dark + (warm - dark) * (_smooth(0.35, 0.95, t) * (1 - _smooth(0.9, 1.0, t)) * (0.7 + 0.3 * fibres))[..., None]
    iris *= (0.75 + 0.35 * _smooth(0.7, 0.2, v))[..., None]  # lighter toward the bottom
    iris = iris * (1 - 0.55 * _smooth(0.82, 1.0, t))[..., None]  # limbal ring
    pupil = _smooth(0.47, 0.42, t)
    iris = iris * (1 - pupil[..., None]) + np.array([0.03, 0.018, 0.012], np.float32) * pupil[..., None]
    inside = _smooth(iris_r + 0.008, iris_r - 0.004, r)[..., None]
    col = col * (1 - inside) + iris * inside
    for cx, cy, rad, k in ((0.37, 0.64, 0.085, 1.0), (0.6, 0.35, 0.035, 0.85)):
        d = np.sqrt((u - cx) ** 2 + ((v - cy) * 0.9) ** 2)
        hl = _smooth(rad, rad * 0.75, d)[..., None] * k
        col = col * (1 - hl) + hl
    edge = np.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 2
    col *= (1 - 0.35 * _smooth(0.86, 1.0, edge))[..., None]  # soft outline at the lid rim
    return col


def hair_textures(w: int = 256, h: int = 512, seed: int = 3) -> tuple[np.ndarray, np.ndarray]:
    """Strand albedo (sRGB) and tangent-space normal map; strands run along V."""
    rng = np.random.default_rng(seed)
    v, u = np.mgrid[0:h, 0:w].astype(np.float32)
    u /= w
    v /= h
    height = np.zeros((h, w), np.float32)
    shade = np.zeros((h, w), np.float32)
    for _ in range(90):
        c = rng.uniform(0, 1)
        width = rng.uniform(0.006, 0.02)
        wav = 0.01 * np.sin(v * rng.uniform(4, 9) * np.pi + rng.uniform(0, 6))
        d = np.abs(((u - c - wav + 0.5) % 1.0) - 0.5)
        strand = np.clip(1 - d / width, 0, 1) ** 1.5
        height = np.maximum(height, strand * rng.uniform(0.5, 1.0))
        shade += strand * rng.uniform(-0.4, 0.6)
    gy, gx = np.gradient(height)
    nx, ny = -gx * 14, -gy * 3
    nz = np.ones_like(nx)
    n = np.stack([nx, ny, nz], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    normal = n * 0.5 + 0.5
    base = np.array([0.11, 0.075, 0.055], np.float32)
    tip = np.array([0.23, 0.155, 0.105], np.float32)
    along = _smooth(0.1, 1.0, v)[..., None]
    col = base + (tip - base) * along * 0.6
    col = col * (0.82 + 0.28 * np.clip(shade, -1, 1)[..., None] * 0.5 + 0.12 * height[..., None])
    col *= (0.7 + 0.3 * _smooth(0.0, 0.25, v))[..., None]  # roots sit in shadow
    return np.clip(col, 0, 1), normal.astype(np.float32)
