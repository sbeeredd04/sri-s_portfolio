"""Blender headless: build a dense, conical Sierra-style conifer from frond cards.

  blender -b --python scripts/blender/build_pine.py

1. Render a branch-frond texture: needle sprays from Poly Haven fir_tree_01's CC0 twig
   atlas are laid out along a stem and rendered orthographically (unlit albedo + alpha).
2. Grow the tree: tapered trunk, whorls of drooping branches with three crossed frond
   cards each, inner filler cards. Cards are emitted front and back with normals bent
   toward the crown surface, so the canopy shades as one soft cone.
3. Export public/models/tree-pine-dense.glb with nodes tree-pine-dense_LOD0 / _LOD1.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from optimize_model import export_glb  # noqa: E402

APP = HERE.parents[1]
TEX = APP / "asset-src" / "models" / "fir_tree_01" / "textures"
OUT = "tree-pine-dense"
HEIGHT, CROWN_BASE, CROWN_RADIUS = 5.5, 0.55, 1.8
# Needle sprays in the 1k twig atlas: (x0, y0, x1, y1) pixels, stem at the bottom edge. The fourth spray
# is skipped: its box overlaps the atlas's brown stem sprite.
SPRAYS = [(190, 40, 440, 320), (670, 40, 940, 380), (310, 410, 660, 790)]
FROND_EXTENT = (0.0, 1.02, -0.42, 0.42)  # x0, x1, y0, y1 of the frond card in its layout plane
FROND_PNG = APP / "asset-src" / "pine" / "frond.png"


def image(name: str, colorspace: str = "sRGB") -> bpy.types.Image:
    img = bpy.data.images.load(str(TEX / name), check_existing=True)
    img.colorspace_settings.name = colorspace
    return img


def mesh_object(name, verts, faces, uvs=None, normals=None) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    if uvs is not None:
        layer = mesh.uv_layers.new(name="UVMap")
        for loop in mesh.loops:
            layer.data[loop.index].uv = uvs[loop.vertex_index]
    if normals is not None:
        mesh.shade_smooth()
        mesh.normals_split_custom_set_from_vertices([tuple(n) for n in normals])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------- frond texture

def twig_material() -> bpy.types.Material:
    """Unlit albedo with alpha, so an orthographic render captures base colour, not lighting."""
    mat = bpy.data.materials.new("twig_src")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    out = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    diff = nodes.new("ShaderNodeTexImage")
    diff.image = image("fir_tree_01_twig_diff_1k.jpg")
    alpha = nodes.new("ShaderNodeTexImage")
    alpha.image = image("fir_tree_01_twig_alpha_1k.jpg", "Non-Color")
    clip = nodes.new("ShaderNodeMath")
    clip.operation = "GREATER_THAN"
    clip.inputs[1].default_value = 0.5
    emit, hole, mix = nodes.new("ShaderNodeEmission"), nodes.new("ShaderNodeBsdfTransparent"), nodes.new("ShaderNodeMixShader")
    links.new(diff.outputs["Color"], emit.inputs["Color"])
    links.new(alpha.outputs["Color"], clip.inputs[0])
    links.new(clip.outputs[0], mix.inputs["Fac"])
    links.new(hole.outputs[0], mix.inputs[1])
    links.new(emit.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], out.inputs["Surface"])
    return mat


def frond_layout(rng) -> tuple:
    """Flat branch in the XY plane: stem along +X (0..1), overlapping sprays on both sides."""
    verts, faces, uvs = [], [], []

    def spray(base, angle, length, box, z):
        x0, y0, x1, y1 = box
        aspect = (x1 - x0) / (y1 - y0)
        tip = np.array([math.cos(angle), math.sin(angle), 0.0])
        side = np.array([-tip[1], tip[0], 0.0]) * length * aspect * 0.5
        corners = [base - side, base + side, base + side + tip * length, base - side + tip * length]
        start = len(verts)
        for c, (px, py) in zip(corners, [(x0, y1), (x1, y1), (x1, y0), (x0, y0)]):
            verts.append((c[0], c[1], z))
            uvs.append((px / 1024, 1 - py / 1024))
        faces.append((start, start + 1, start + 2, start + 3))

    z = 0.0
    for t in np.linspace(0.0, 0.9, 26):
        for sign in (-1, 1):
            for spread in (rng.uniform(30, 45), rng.uniform(50, 68)):
                if rng.random() > 0.72:  # gaps keep the frond edge feathered, not a solid slab
                    continue
                size = (0.44 * (1 - 0.78 * t) + 0.04) * rng.uniform(0.75, 1.15)
                box = SPRAYS[rng.integers(len(SPRAYS))]
                spray(np.array([t, rng.normal(0, 0.01), 0.0]), sign * math.radians(spread), size, box, z)
                z += 0.0005
    for _ in range(12):  # fill the spine
        t = rng.uniform(0.05, 0.85)
        spray(np.array([t, 0.0, 0.0]), rng.normal(0, 0.35), 0.25 * (1 - 0.4 * t), SPRAYS[rng.integers(3)], z)
        z += 0.0005
    spray(np.array([0.8, 0.0, 0.0]), 0.0, 0.22, SPRAYS[1], z + 0.001)  # leader tip
    return verts, faces, uvs


def render_frond(width: int = 1024) -> bpy.types.Image:
    """Orthographic top-down render of the frond (emission albedo + transparent film) -> RGBA card texture."""
    rng = np.random.default_rng(7)
    verts, faces, uvs = frond_layout(rng)
    frond = mesh_object("frond_high", verts, faces, uvs)
    frond.data.materials.append(twig_material())
    x0, x1, y0, y1 = FROND_EXTENT
    cam = bpy.data.objects.new("frond_cam", bpy.data.cameras.new("frond_cam"))
    cam.data.type, cam.data.ortho_scale = "ORTHO", max(x1 - x0, y1 - y0)
    cam.location = ((x0 + x1) / 2, (y0 + y1) / 2, 1.0)
    bpy.context.scene.collection.objects.link(cam)
    scene = bpy.context.scene
    scene.camera = cam
    scene.render.engine = "CYCLES"
    scene.cycles.samples, scene.cycles.device = 16, "CPU"
    scene.cycles.transparent_max_bounces = 128
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = width
    scene.render.resolution_y = round(width * (y1 - y0) / (x1 - x0))
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    FROND_PNG.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(FROND_PNG)
    bpy.ops.render.render(write_still=True)
    for obj in (frond, cam):
        bpy.data.objects.remove(obj, do_unlink=True)
    img = bpy.data.images.load(str(FROND_PNG))
    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    px[:, :3] *= np.array([0.78, 0.86, 0.8])  # Sierra conifers read darker and bluer than the source twig
    px[px[:, 3] <= 0.02, :3] = (0.1, 0.14, 0.08)  # needle-coloured fill so mip levels don't fringe white
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


# ---------------------------------------------------------------- tree geometry

def crown_radius(z):
    t = np.clip((HEIGHT - z) / (HEIGHT - CROWN_BASE), 0, 1)
    return CROWN_RADIUS * t ** 0.9


def crown_normal(p):
    radial = np.array([p[0], p[1], 0.0])
    r = np.linalg.norm(radial)
    radial = radial / r if r > 1e-4 else np.zeros(3)
    n = radial + np.array([0, 0, 0.55])
    return n / np.linalg.norm(n)


class Cards:
    def __init__(self):
        self.verts, self.faces, self.uvs, self.normals = [], [], [], []

    def add(self, base, forward, length, width, roll, segments, sag):
        up = np.array([0.0, 0.0, 1.0])
        side = np.cross(forward, up)
        side = side / (np.linalg.norm(side) or 1.0)
        normal = np.cross(side, forward)
        side = side * math.cos(roll) + normal * math.sin(roll)
        card_n = np.cross(side, forward)
        rows = []
        for k in range(segments + 1):
            t = k / segments
            centre = base + forward * length * t - up * sag * length * t * t
            left, right = centre - side * width / 2, centre + side * width / 2
            for p in (left, right):
                p[2] = max(p[2], 0.12)  # lowest whorl skirts the ground instead of burying its tips
            rows.append((left, right, t))
        for flip in (False, True):  # both sides, same outward crown normals, single-sided material
            start = len(self.verts)
            for left, right, t in rows:
                for p, v in ((left, 0.0), (right, 1.0)):
                    self.verts.append(p)
                    self.uvs.append((t, v))
                    bent = 0.72 * crown_normal(p) + 0.28 * card_n * (-1 if flip else 1)
                    self.normals.append(bent / np.linalg.norm(bent))
            for k in range(segments):
                a, b = start + 2 * k, start + 2 * k + 1
                quad = (a, b, b + 2, a + 2)
                self.faces.append(quad[::-1] if flip else quad)


def trunk(sides: int, segments: int):
    verts, faces, uvs = [], [], []
    for k in range(segments + 1):
        t = k / segments
        z = -0.15 + (HEIGHT - 0.1 + 0.15) * t
        radius = 0.17 * (1 - t) ** 1.2 + 0.015 + 0.08 * max(0.0, 1 - z / 0.35) ** 2
        for s in range(sides + 1):
            a = 2 * math.pi * s / sides
            verts.append((radius * math.cos(a), radius * math.sin(a), z))
            uvs.append((2 * s / sides, z / 1.2))
    ring = sides + 1
    for k in range(segments):
        for s in range(sides):
            a = k * ring + s
            faces.append((a, a + 1, a + ring + 1, a + ring))
    return verts, faces, uvs


def grow(rng, whorl_step, per_whorl, rolls, segments, fillers) -> Cards:
    cards = Cards()
    golden = math.pi * (3 - math.sqrt(5))
    z, phase = CROWN_BASE, 0.0
    while z < HEIGHT - 0.3:
        radius = crown_radius(z)
        count = max(3, round(per_whorl * min(1.0, (radius / CROWN_RADIUS) ** 0.4)))
        rel = (z - CROWN_BASE) / (HEIGHT - CROWN_BASE)
        for b in range(count):
            azimuth = phase + 2 * math.pi * b / count + rng.normal(0, 0.12)
            elev = math.radians(-16 + 44 * rel + rng.normal(0, 8))
            forward = np.array([math.cos(azimuth) * math.cos(elev), math.sin(azimuth) * math.cos(elev), math.sin(elev)])
            reach = radius * rng.uniform(0.9, 1.08) + 0.12
            base = np.array([0.0, 0.0, z]) + forward * 0.04
            width = min(1.5, 0.8 * reach) * rng.uniform(0.9, 1.1)
            sag = rng.uniform(0.06, 0.22) * (1 - rel)
            for roll in rolls:
                cards.add(base, forward, reach, width, roll + rng.normal(0, 0.25), segments, sag)
        phase += golden
        z += whorl_step * rng.uniform(0.85, 1.15)
    for _ in range(fillers):  # inner crown volume, seen through gaps between whorls
        z = rng.uniform(CROWN_BASE + 0.2, HEIGHT - 0.6)
        azimuth = rng.uniform(0, 2 * math.pi)
        elev = math.radians(rng.uniform(-25, 30))
        forward = np.array([math.cos(azimuth) * math.cos(elev), math.sin(azimuth) * math.cos(elev), math.sin(elev)])
        reach = crown_radius(z) * rng.uniform(0.45, 0.75)
        base = np.array([0.0, 0.0, z]) + forward * crown_radius(z) * rng.uniform(0.05, 0.25)
        cards.add(base, forward, reach, min(1.1, 0.8 * reach), rng.uniform(-0.8, 0.8), 1, 0.05)
    top = np.array([0.0, 0.0, HEIGHT - 0.75])
    for roll in (0.0, math.pi / 2):  # leader
        cards.add(top, np.array([0.0, 0.0, 1.0]) + np.array([1e-3, 0, 0]), 0.75, 0.42, roll, 1, 0.0)
    return cards


def materials(frond: bpy.types.Image) -> tuple:
    needles = bpy.data.materials.new("pine_needles")
    nodes, links = needles.node_tree.nodes, needles.node_tree.links
    bsdf = nodes["Principled BSDF"]
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = frond
    clip = nodes.new("ShaderNodeMath")
    clip.operation = "ROUND"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex.outputs["Alpha"], clip.inputs[0])
    links.new(clip.outputs[0], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.8
    needles.use_backface_culling = True

    bark = bpy.data.materials.new("pine_bark")
    nodes, links = bark.node_tree.nodes, bark.node_tree.links
    bsdf = nodes["Principled BSDF"]
    diff, nor, arm = (nodes.new("ShaderNodeTexImage") for _ in range(3))
    diff.image = image("fir_tree_01_bark_diff_1k.jpg")
    nor.image = image("fir_tree_01_bark_nor_gl_1k.jpg", "Non-Color")
    arm.image = image("fir_tree_01_bark_arm_1k.jpg", "Non-Color")
    nmap, split = nodes.new("ShaderNodeNormalMap"), nodes.new("ShaderNodeSeparateColor")
    links.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(nor.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(arm.outputs["Color"], split.inputs["Color"])
    links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
    links.new(split.outputs["Blue"], bsdf.inputs["Metallic"])
    bark.use_backface_culling = True
    for img in (diff.image, nor.image, arm.image):
        img.scale(512, 512)
    return needles, bark


def build_lod(name, needles, bark, rng, **growth) -> bpy.types.Object:
    trunk_sides, trunk_segments = growth.pop("trunk")
    cards = grow(rng, **growth)
    foliage = mesh_object(f"{name}_cards", cards.verts, cards.faces, cards.uvs, cards.normals)
    foliage.data.materials.append(needles)
    tv, tf, tu = trunk(trunk_sides, trunk_segments)
    stem = mesh_object(name, tv, tf, tu)
    stem.data.materials.append(bark)
    bpy.ops.object.select_all(action="DESELECT")
    stem.select_set(True)
    foliage.select_set(True)
    bpy.context.view_layer.objects.active = stem
    bpy.ops.object.join()
    stem.name = stem.data.name = name
    return stem


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    frond = render_frond()
    needles, bark = materials(frond)
    lod0 = build_lod(f"{OUT}_LOD0", needles, bark, np.random.default_rng(3), whorl_step=0.2, per_whorl=7,
                     rolls=(0.0, 0.7, -0.7), segments=3, fillers=260, trunk=(10, 12))
    lod1 = build_lod(f"{OUT}_LOD1", needles, bark, np.random.default_rng(3), whorl_step=0.36, per_whorl=5,
                     rolls=(0.0, math.pi / 2), segments=2, fillers=40, trunk=(6, 4))
    glb = APP / "public" / "models" / f"{OUT}.glb"
    export_glb(glb, 80, "meshopt")
    tris = {}
    for obj in (lod0, lod1):
        obj.data.calc_loop_triangles()
        tris[obj.name] = len(obj.data.loop_triangles)
    dims = lod0.dimensions
    stats = {"file": f"models/{glb.name}", "procedural": True, "lods": tris, "bytes": glb.stat().st_size,
             "dimensions_m": {"width_x": round(dims.x, 3), "height_y": round(dims.z, 3), "depth_z": round(dims.y, 3)},
             "pivot": "trunk base at origin (y=0 ground; trunk extends 0.15 m below for embedding)",
             "source": "original procedural tree; needle sprays baked from Poly Haven fir_tree_01 twig atlas (CC0)"}
    (APP / "asset-src" / "stats" / f"{OUT}.json").write_text(json.dumps(stats, indent=1))
    print("STATS " + json.dumps(stats))


if __name__ == "__main__":
    main()
