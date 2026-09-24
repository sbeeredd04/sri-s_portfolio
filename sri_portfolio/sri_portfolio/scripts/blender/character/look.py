"""Material assignment and baked maps for every character mesh.

Material names are the integration contract (see README): skin, eye, lash,
brow, mouth, hair, shirt, trousers, shoe_upper, shoe_sole, shoe_lace, watch.
"""
from __future__ import annotations

import bpy
import numpy as np

import materials as M
import textures as T
from sdf import value_noise

SKIN = np.array([0.70, 0.48, 0.34], np.float32)      # warm brown (sRGB)
BLUSH = np.array([0.84, 0.45, 0.37], np.float32)
SHIRT_DEFAULT = (0.11, 0.11, 0.12)                    # near-black tee like the avatar
TROUSERS = (0.085, 0.09, 0.105)
HAIR_DARK = (0.12, 0.085, 0.066)


def _blob(pos, centre, radius):
    d = np.linalg.norm(pos - np.asarray(centre, np.float32), axis=-1)
    return np.exp(-(d / radius) ** 2)


def skin_maps(pos, mask, ao):
    flat = pos.reshape(-1, 3)
    noise = value_noise(flat, 40, 11).reshape(pos.shape[:2]) * 0.5 + value_noise(flat, 140, 12).reshape(pos.shape[:2]) * 0.25
    warm = np.zeros(pos.shape[:2], np.float32)
    for s in (-1, 1):
        warm += 0.55 * _blob(pos, (0.09 * s, -0.135, 0.952), 0.03)
        warm += 0.4 * _blob(pos, (0.19 * s, 0.03, 0.99), 0.035)          # ears
        warm += 0.18 * _blob(pos, (0.36 * s, -0.02, 0.5), 0.05)          # fingers
    warm += 0.4 * _blob(pos, (0.0, -0.172, 0.972), 0.016)               # nose tip
    warm += 0.12 * _blob(pos, (0.0, -0.15, 1.1), 0.05)                  # forehead
    warm = np.clip(warm, 0, 0.75)[..., None]
    col = SKIN * (1 - warm) + BLUSH * warm
    col = col * (1 + 0.035 * noise[..., None])
    lin = T.srgb_to_linear(col) * (0.5 + 0.5 * np.clip(ao, 0, 1))[..., None]
    col = M.linear_to_srgb(lin)
    rough = 0.6 - 0.12 * _blob(pos, (0.0, -0.17, 0.975), 0.02) - 0.07 * _blob(pos, (0.0, -0.15, 1.1), 0.05)
    rough = rough + 0.04 * noise
    col[~mask] = SKIN
    return col, np.repeat(np.clip(rough, 0.3, 0.9)[..., None], 3, axis=2)


def ao_albedo(ao, lo=0.55, mottle=None):
    """Near-white albedo carrying only occlusion, so the factor recolours cleanly."""
    a = lo + (1 - lo) * np.clip(ao, 0, 1)
    if mottle is not None:
        a = a * (1 + mottle)
    lin = np.repeat(a[..., None], 3, axis=2)
    return M.linear_to_srgb(lin)


def unwrap(obj, margin=0.01):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def linen(size=512):
    img = bpy.data.images.load(str(M.LINEN_NORMAL))
    if img.size[0] > size:
        img.scale(size, size)
    img.pack()
    return img


def dress(objs: dict, sizes: dict | None = None) -> None:
    sizes = {"skin": 1024, "cloth": 512, "shoes": 512, **(sizes or {})}
    body, face, hair, shirt, trousers, shoes, watch = (objs[k] for k in ("Body", "Face", "Hair", "Shirt", "Trousers", "Shoes", "Watch"))
    skin = M.principled("skin", (0.7, 0.48, 0.34), 0.58, **{"Subsurface Weight": 0.0})
    body.data.materials.append(skin)
    for name, col, rough, extra in (
        ("eye", (1, 1, 1), 0.1, {"Coat Weight": 0.25, "Coat Roughness": 0.08}),
        ("lash", (0.07, 0.045, 0.035), 0.55, {}),
        ("brow", HAIR_DARK, 0.75, {}),
        ("mouth", (1, 1, 1), 0.45, {}),
    ):
        face.data.materials.append(M.principled(name, col, rough, **extra))
    hair_mat = M.principled("hair", (1, 1, 1), 0.55, **{"Anisotropic": 0.3, "Specular IOR Level": 0.22})
    hair.data.materials.append(hair_mat)
    shirt_mat = M.principled("shirt", (1, 1, 1), 0.88, **{"Sheen Weight": 0.2, "Sheen Roughness": 0.45, "Sheen Tint": (0.35, 0.35, 0.35, 1.0)})
    shirt.data.materials.append(shirt_mat)
    trousers_mat = M.principled("trousers", (1, 1, 1), 0.82, **{"Sheen Weight": 0.15, "Sheen Roughness": 0.45, "Sheen Tint": (0.35, 0.35, 0.35, 1.0)})
    trousers.data.materials.append(trousers_mat)
    for name, rough in (("shoe_sole", 0.62), ("shoe_upper", 0.46), ("shoe_lace", 0.75)):
        mat = M.principled(name, (1, 1, 1), rough)
        if name not in shoes.data.materials:
            shoes.data.materials.append(mat)
    watch.data.materials.append(M.principled("watch", (0.035, 0.035, 0.04), 0.38, **{"Coat Weight": 0.3}))

    # skin: position-driven colour + roughness with baked occlusion
    pos, mask = M.bake_positions(body, sizes["skin"])
    face.hide_render = True  # eyes must not shadow the skin that shows when they blink
    ao = M.bake_ao(body, sizes["skin"])
    face.hide_render = False
    col, rough = skin_maps(pos, mask, ao)
    M.set_albedo(skin, M.save("sri_skin_color", col))
    small = rough[::2, ::2] if sizes["skin"] > 512 else rough
    M.set_roughness(skin, M.save("sri_skin_rough", small, "Non-Color"))

    # face details
    M.set_albedo(face.data.materials["eye"], M.save("sri_eye", T.eye_texture(256)))
    M.set_albedo(face.data.materials["mouth"], M.save("sri_mouth", mouth_texture()))

    # hair strands
    hcol, hnor = T.hair_textures()
    M.set_albedo(hair_mat, M.save("sri_hair_color", hcol))
    M.set_normal(hair_mat, M.save("sri_hair_normal", hnor, "Non-Color"), strength=0.35)

    # garments: occlusion albedo x recolourable factor, tiled linen weave normal
    weave = linen()
    for obj, mat, tint, tile in ((shirt, shirt_mat, SHIRT_DEFAULT, 9.0), (trousers, trousers_mat, TROUSERS, 11.0)):
        ao = M.bake_ao(obj, sizes["cloth"])
        pos, _ = M.bake_positions(obj, sizes["cloth"])
        mottle = 0.04 * value_noise(pos.reshape(-1, 3), 30, 5).reshape(ao.shape)
        M.set_albedo(mat, M.save(f"sri_{mat.name}_ao", ao_albedo(ao, 0.5, mottle)), tint)
        M.set_normal(mat, weave, strength=0.8, uv_scale=tile)

    # shoes: shared occlusion/detail atlas, per-part tint
    ao = M.bake_ao(shoes, sizes["shoes"])
    pos, _ = M.bake_positions(shoes, sizes["shoes"])
    detail = shoe_detail(pos)
    img = M.save("sri_shoes_ao", ao_albedo(ao, 0.6) * detail[..., None])
    for name, tint in (("shoe_sole", (0.96, 0.95, 0.93)), ("shoe_upper", (0.93, 0.92, 0.89)), ("shoe_lace", (0.97, 0.97, 0.96))):
        M.set_albedo(shoes.data.materials[name], img, tint)


def shoe_detail(pos, scale=1.12):
    """Light grey side panel and heel counter, thin grey line along the sole top."""
    z = pos[..., 2] / scale
    y = (pos[..., 1] + 0.02) / scale - 0.02
    panel = (np.abs(z - 0.045 - 0.12 * np.maximum(0, y + 0.02)) < 0.009) & (y > -0.06)
    heel = (y > 0.035) & (z > 0.03)
    line = np.abs(z - 0.024) < 0.002
    d = np.ones(z.shape, np.float32)
    d[panel | heel] = 0.86
    d[line] = 0.8
    return d


def mouth_texture(size=64):
    v = np.linspace(0, 1, size, dtype=np.float32)[:, None] * np.ones((1, size), np.float32)
    u = np.linspace(0, 1, size, dtype=np.float32)[None, :] * np.ones((size, 1), np.float32)
    top = np.array([0.3, 0.1, 0.08], np.float32)
    inner = np.array([0.42, 0.13, 0.12], np.float32)
    tongue = np.array([0.78, 0.4, 0.38], np.float32)
    k = np.clip(v / 0.3, 0, 1)[..., None]  # v=0 is the upper lip line of the mouth patch
    col = inner * k + top * (1 - k)
    t = (np.clip((v - 0.55) / 0.3, 0, 1) * np.exp(-((u - 0.5) / 0.25) ** 2))[..., None]
    return col * (1 - t) + tongue * t
