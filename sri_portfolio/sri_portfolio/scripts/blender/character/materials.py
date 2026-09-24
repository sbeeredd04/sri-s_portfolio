"""PBR materials and texture bakes for the character.

Bakes run in Cycles against the assembled scene: an object-space position pass
drives numpy-authored skin colour/roughness, and ambient occlusion is multiplied
into the albedo of skin, clothing and shoes so folds and contact read on the web
without a runtime AO pass. Garment albedo textures are near-white so the glTF
baseColorFactor (the node's multiply colour) stays a clean recolour handle.
"""
from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np

import textures as T

APP = Path(__file__).resolve().parents[3]
LINEN_NORMAL = APP / "public" / "materials" / "fabric-linen" / "normal.webp"


# ---------------------------------------------------------------- node helpers

def principled(name: str, color=(0.8, 0.8, 0.8), rough=0.5, **extra) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*T.srgb_to_linear(color), 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    for key, value in extra.items():
        bsdf.inputs[key].default_value = value
    return mat


def _bsdf(mat):
    return mat.node_tree.nodes["Principled BSDF"]


def image_node(mat, img, uv_scale: float | None = None):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = img
    if uv_scale:
        coord = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, 1.0)
        links.new(coord.outputs["UV"], mapping.inputs["Vector"])
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    return tex


def set_albedo(mat, img, tint=None):
    """Base colour = texture (x tint -> exported as baseColorFactor)."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex = image_node(mat, img)
    out = tex.outputs["Color"]
    if tint is not None:
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        links.new(out, mix.inputs["A"])
        mix.inputs["B"].default_value = (*T.srgb_to_linear(tint), 1.0)
        out = mix.outputs["Result"]
    links.new(out, _bsdf(mat).inputs["Base Color"])


def set_normal(mat, img, strength=1.0, uv_scale=None):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    img.colorspace_settings.name = "Non-Color"
    tex = image_node(mat, img, uv_scale)
    nmap = nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = strength
    links.new(tex.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], _bsdf(mat).inputs["Normal"])


def set_roughness(mat, img):
    img.colorspace_settings.name = "Non-Color"
    tex = image_node(mat, img)
    mat.node_tree.links.new(tex.outputs["Color"], _bsdf(mat).inputs["Roughness"])


# ---------------------------------------------------------------- bakes

def _bake(obj, img, bake_type: str, samples: int) -> np.ndarray:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.device = "GPU"
    nodes_added = []
    for slot in obj.material_slots:
        nt = slot.material.node_tree
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = img
        nt.nodes.active = node
        nodes_added.append((nt, node))
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type=bake_type, margin=6, use_clear=True)
    for nt, node in nodes_added:
        nt.nodes.remove(node)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(h, w, 4)


def bake_ao(obj, size: int, samples: int = 96) -> np.ndarray:
    img = bpy.data.images.new(f"{obj.name}_ao_tmp", size, size, float_buffer=True)
    img.colorspace_settings.name = "Non-Color"
    out = _bake(obj, img, "AO", samples)[..., 0]
    bpy.data.images.remove(img)
    return out


def bake_positions(obj, size: int) -> tuple[np.ndarray, np.ndarray]:
    """Object-space position per texel, plus a coverage mask."""
    img = bpy.data.images.new(f"{obj.name}_pos_tmp", size, size, float_buffer=True, alpha=True)
    img.colorspace_settings.name = "Non-Color"
    saved = [slot.material for slot in obj.material_slots]
    mat = bpy.data.materials.new("posbake")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.remove(nodes["Principled BSDF"])
    coord = nodes.new("ShaderNodeTexCoord")
    scale = nodes.new("ShaderNodeVectorMath")
    scale.operation = "MULTIPLY_ADD"
    scale.inputs[1].default_value = (0.5, 0.5, 0.5)
    scale.inputs[2].default_value = (0.5, 0.5, 0.5)
    emit = nodes.new("ShaderNodeEmission")
    links.new(coord.outputs["Object"], scale.inputs[0])
    links.new(scale.outputs["Vector"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], nodes["Material Output"].inputs["Surface"])
    for slot in obj.material_slots:
        slot.material = mat
    if not obj.material_slots:
        obj.data.materials.append(mat)
    px = _bake(obj, img, "EMIT", 1)
    for slot, m in zip(obj.material_slots, saved):
        slot.material = m
    bpy.data.materials.remove(mat)
    bpy.data.images.remove(img)
    pos = (px[..., :3] - 0.5) * 2.0
    mask = px[..., 3] > 0.5
    return pos, mask


def save(img_name: str, rgb: np.ndarray, colorspace="sRGB") -> bpy.types.Image:
    return T.to_image(img_name, np.clip(rgb, 0, 1).astype(np.float32), colorspace)


def linear_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)
