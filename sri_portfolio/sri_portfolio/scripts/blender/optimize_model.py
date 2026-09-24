"""Blender headless: turn one cached Poly Haven model into a web-ready GLB.

  blender -b --python scripts/blender/optimize_model.py -- --id fir_sapling

Pipeline: import (glTF or .blend) -> bake modifiers/transforms into world space ->
pick/scatter parts -> wire foliage alpha -> join into one mesh (one primitive per
material) -> reduce to the triangle budget (collapse decimate for solids, card
decimate + thinning for alpha foliage) -> pivot at ground contact -> resize
textures -> export GLB (WebP textures, EXT_meshopt_compression) -> stats JSON.
Assets with `lod1_tris` get two nodes, `<out>_LOD0` and `<out>_LOD1`, sharing
materials in one file.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import re
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from foliage_cards import build_cards  # noqa: E402
from mesh_ops import collapse, delete_and_scale, prune_small_islands, thin_cards, tri_count  # noqa: E402

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
CACHE = APP / "asset-src"


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", required=True)
    parser.add_argument("--manifest", type=Path, default=HERE / "assets.json")
    parser.add_argument("--out-dir", type=Path, default=APP / "public" / "models")
    parser.add_argument("--stats-dir", type=Path, default=CACHE / "stats")
    parser.add_argument("--compression", choices=["meshopt", "draco", "none"], default="meshopt")
    return parser.parse_args(argv)


def load_entry(args: argparse.Namespace) -> dict:
    manifest = json.loads(args.manifest.read_text())
    entry = next(m for m in manifest["models"] if m["id"] == args.id)
    return {**manifest["defaults"], **entry}


# ---------------------------------------------------------------- import

def import_source(asset_id: str) -> Path:
    folder = CACHE / "models" / asset_id
    gltf = sorted(folder.glob("*.gltf"))
    blend = sorted(folder.glob("*.blend"))
    if gltf:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(gltf[0]), merge_vertices=True)
        return gltf[0]
    if blend:
        bpy.ops.wm.open_mainfile(filepath=str(blend[0]))
        return blend[0]
    raise FileNotFoundError(f"no source for {asset_id} in {folder}; run fetch_polyhaven.py")


def bake_to_world_meshes() -> list[bpy.types.Object]:
    """Replace every visible mesh with a modifier/transform-applied world-space copy."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    scene = bpy.context.scene
    baked = []
    for obj in list(scene.objects):
        if obj.type != "MESH" or obj.hide_render:
            continue
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph), depsgraph=depsgraph)
        mesh.transform(obj.matrix_world)
        if obj.matrix_world.determinant() < 0:
            mesh.flip_normals()
        baked.append((obj.name, bpy.data.objects.new(obj.name + "_baked", mesh)))
    for obj in list(bpy.data.objects):
        if obj not in {new for _, new in baked}:
            bpy.data.objects.remove(obj, do_unlink=True)
    for coll in list(bpy.data.collections):
        bpy.data.collections.remove(coll)
    for name, new in baked:
        scene.collection.objects.link(new)
        new.name = name
    return [new for _, new in baked]


def pick_objects(objs: list, patterns: list[str] | None) -> list:
    if not patterns:
        return objs
    keep = [o for o in objs if any(re.search(p, o.name) for p in patterns)]
    for obj in objs:
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    if not keep:
        raise ValueError(f"pick {patterns} matched nothing")
    return keep


def ground_center(obj: bpy.types.Object) -> Vector:
    xs, ys, zs = zip(*(v.co for v in obj.data.vertices))
    return Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))


def scatter(objs: list, count: int, radius: float, seed: int) -> list:
    """Compose a clump from kit pieces: recentre each, then place `count` random copies."""
    rng = random.Random(seed)
    for obj in objs:
        obj.data.transform(Matrix.Translation(-ground_center(obj)))
    copies = []
    for i in range(count):
        src = objs[i % len(objs)]
        dist, ang = radius * math.sqrt(rng.random()), rng.uniform(0, math.tau)
        mat = (Matrix.Translation((dist * math.cos(ang), dist * math.sin(ang), 0))
               @ Matrix.Rotation(rng.uniform(0, math.tau), 4, "Z")
               @ Matrix.Scale(rng.uniform(0.8, 1.25), 4))
        mesh = src.data.copy()
        mesh.transform(mat)
        new = bpy.data.objects.new(f"{src.name}_{i}", mesh)
        bpy.context.scene.collection.objects.link(new)
        copies.append(new)
    for obj in objs:
        bpy.data.objects.remove(obj, do_unlink=True)
    return copies


# ---------------------------------------------------------------- materials

def principled(mat: bpy.types.Material):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def wire_alpha_maps(asset_id: str) -> None:
    """Poly Haven glTFs omit foliage alpha; connect the separately fetched *_alpha map as a clip mask."""
    tex_dir = CACHE / "models" / asset_id / "textures"
    alpha_files = {re.sub(r"_alpha_\d+k$", "", p.stem): p for p in tex_dir.glob("*_alpha_*")}
    for mat in bpy.data.materials:
        bsdf = principled(mat)
        base = re.sub(r"\.\d{3}$", "", mat.name)
        if bsdf and bsdf.inputs["Alpha"].is_linked:
            force_clip(mat, bsdf)
            continue
        if not bsdf or base not in alpha_files:
            continue
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(alpha_files[base]), check_existing=True)
        tex.image.colorspace_settings.name = "Non-Color"
        color_src = bsdf.inputs["Base Color"].links[0].from_node if bsdf.inputs["Base Color"].is_linked else None
        if color_src is not None and color_src.type == "TEX_IMAGE" and color_src.inputs["Vector"].is_linked:
            links.new(color_src.inputs["Vector"].links[0].from_socket, tex.inputs["Vector"])
        clip = nodes.new("ShaderNodeMath")
        clip.operation = "ROUND"  # glTF exporter maps Round -> alphaMode MASK, cutoff 0.5
        links.new(tex.outputs["Color"], clip.inputs[0])
        links.new(clip.outputs[0], bsdf.inputs["Alpha"])
        print(f"  alpha mask wired: {mat.name} <- {alpha_files[base].name}")


def force_clip(mat: bpy.types.Material, bsdf) -> None:
    """Existing alpha (exported as BLEND) becomes a 0.5 clip mask: no sorting artifacts on foliage."""
    link = bsdf.inputs["Alpha"].links[0]
    if link.from_node.type == "MATH" and link.from_node.operation == "ROUND":
        return
    clip = mat.node_tree.nodes.new("ShaderNodeMath")
    clip.operation = "ROUND"
    mat.node_tree.links.new(link.from_socket, clip.inputs[0])
    mat.node_tree.links.new(clip.outputs[0], bsdf.inputs["Alpha"])
    print(f"  alpha forced to clip: {mat.name}")


def is_alpha_material(mat: bpy.types.Material) -> bool:
    bsdf = principled(mat)
    return bool(bsdf and bsdf.inputs["Alpha"].is_linked)


def dedupe_materials(obj: bpy.types.Object) -> None:
    """Map `Name.001` slots onto `Name` so joined meshes keep one primitive per material."""
    for slot in obj.material_slots:
        if slot.material and re.search(r"\.\d{3}$", slot.material.name):
            base = bpy.data.materials.get(re.sub(r"\.\d{3}$", "", slot.material.name))
            if base:
                slot.material = base


def promote_grayscale(img: bpy.types.Image) -> bpy.types.Image:
    """Blender's WebP writer rejects 1-channel images (the exporter then emits a texture with no image)."""
    w, h = img.size  # forces the image to load so depth is accurate
    # `channels` reports 4 for loaded grayscale JPGs; bit depth 8/16 (byte) means gray or gray+alpha.
    if img.depth not in (8, 16):
        return img
    rgb = bpy.data.images.new(img.name + "_rgb", w, h, alpha=False)
    rgb.colorspace_settings.name = img.colorspace_settings.name
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    rgb.pixels.foreach_set(px)
    rgb.pack()
    img.user_remap(rgb)
    return rgb


def resize_images(tex_max: int, normal_max: int) -> None:
    for img in list(bpy.data.images):
        if img.type != "IMAGE" or not img.has_data and not img.filepath or img.users == 0:
            continue
        img = promote_grayscale(img)
        w, h = img.size
        limit = normal_max if re.search(r"nor(_gl)?|normal", img.name, re.I) else tex_max
        if max(w, h) > limit:
            scale = limit / max(w, h)
            img.scale(max(1, round(w * scale)), max(1, round(h * scale)))


# ---------------------------------------------------------------- geometry

def join(objs: list, name: str) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = obj.data.name = name
    dedupe_materials(obj)
    bpy.ops.object.material_slot_remove_unused()
    return obj


def split_by_alpha(obj: bpy.types.Object) -> tuple:
    """Return (solid, foliage) objects; either may be None."""
    alpha_slots = [i for i, s in enumerate(obj.material_slots) if is_alpha_material(s.material)]
    if not alpha_slots:
        return obj, None
    if len(alpha_slots) == len(obj.material_slots):
        return None, obj
    foliage = duplicate(obj, obj.name + "_foliage")
    mat_index = np.empty(len(obj.data.polygons), dtype=np.int32)
    obj.data.polygons.foreach_get("material_index", mat_index)
    is_alpha = np.isin(mat_index, alpha_slots)
    delete_and_scale(obj, ~is_alpha)
    delete_and_scale(foliage, is_alpha)
    return obj, foliage


def reduce_to(obj: bpy.types.Object, target: int, entry: dict, seed: int) -> bpy.types.Object:
    solid, foliage = split_by_alpha(obj)
    s_tris = tri_count(solid) if solid else 0
    f_tris = tri_count(foliage) if foliage else 0
    if s_tris + f_tris <= target:
        parts = [p for p in (solid, foliage) if p]
        return join(parts, obj.name) if len(parts) > 1 else parts[0]
    if foliage and solid:
        solid_budget = min(s_tris, max(int(target * 0.35), int(target * s_tris / (s_tris + f_tris))))
    else:
        solid_budget = target if solid else 0
    if solid:
        if entry.get("foliage") and s_tris > solid_budget * 8:
            prune_small_islands(solid, solid_budget * 8)
        collapse(solid, solid_budget)
    if foliage:
        thin_cards(foliage, target - (tri_count(solid) if solid else 0), seed, entry.get("max_card_scale", 1.6))
    parts = [p for p in (solid, foliage) if p]
    name = obj.name
    return join(parts, name) if len(parts) > 1 else parts[0]


def build_card_lods(base: bpy.types.Object, entry: dict, names: list[str], targets: list[int]) -> list:
    """Trunk/branches keep real geometry; foliage becomes baked cards (LOD1 reuses a thinned subset)."""
    cfg = entry["cards"]
    solid, foliage = split_by_alpha(base)
    cards0 = build_cards(foliage, cfg["count"], cfg.get("atlas", 2048), 5, f"{entry['out']}_cards")
    bpy.data.objects.remove(foliage, do_unlink=True)
    lods = []
    for level, target in enumerate(targets):
        trunk = duplicate(solid, f"{names[level]}_trunk")
        cards = duplicate(cards0, f"{names[level]}_cards")
        if level:
            thin_cards(cards, int(target * cfg.get("lod1_share", 0.6)), 17, 1.5)
        trunk_budget = max(200, target - tri_count(cards))
        if tri_count(trunk) > trunk_budget * 8:
            prune_small_islands(trunk, trunk_budget * 8)
        collapse(trunk, trunk_budget)
        lods.append(join([trunk, cards], names[level]))
    for obj in (solid, cards0):
        bpy.data.objects.remove(obj, do_unlink=True)
    return lods


def duplicate(obj: bpy.types.Object, name: str) -> bpy.types.Object:
    new = obj.copy()
    new.data = obj.data.copy()
    new.name = new.data.name = name
    bpy.context.scene.collection.objects.link(new)
    return new


# ---------------------------------------------------------------- export

def export_glb(path: Path, quality: int, compression: str) -> None:
    props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    kwargs = {
        "filepath": str(path),
        "export_format": "GLB",
        "use_selection": False,
        "export_yup": True,
        "export_apply": True,
        "export_image_format": "WEBP",
        "export_image_quality": quality,
        "export_jpeg_quality": quality,
        "export_texcoords": True,
        "export_normals": True,
        "export_tangents": False,
        "export_vertex_color": "NONE",
        "export_attributes": False,
        "export_animations": False,
        "export_skins": False,
        "export_morph": False,
        "export_cameras": False,
        "export_lights": False,
        "export_extras": False,
        "export_meshopt_compression_enable": compression == "meshopt",
        "export_draco_mesh_compression_enable": compression == "draco",
        "export_draco_mesh_compression_level": 7,
    }
    bpy.ops.export_scene.gltf(**{k: v for k, v in kwargs.items() if k in props})


def main() -> None:
    args = parse_args()
    entry = load_entry(args)
    out_name = entry["out"]
    print(f"== {args.id} -> {out_name}")
    src = import_source(args.id)
    objs = bake_to_world_meshes()
    source_tris = sum(tri_count(o) for o in objs)
    objs = pick_objects(objs, entry.get("pick"))
    if entry.get("scatter"):
        sc = entry["scatter"]
        objs = scatter(objs, sc["count"], sc["radius"], sc.get("seed", 1))
    wire_alpha_maps(args.id)
    base = join(objs, out_name)
    picked_tris = tri_count(base)

    lod_targets = [entry["target_tris"]] + ([entry["lod1_tris"]] if entry.get("lod1_tris") else [])
    names = [out_name] if len(lod_targets) == 1 else [f"{out_name}_LOD{i}" for i in range(len(lod_targets))]
    if entry.get("cards"):
        lods = build_card_lods(base, entry, names, lod_targets)
    else:
        source_copy = duplicate(base, "_source")
        lods = []
        for level, target in enumerate(lod_targets):
            work = base if level == 0 else duplicate(source_copy, f"{out_name}_tmp")
            lods.append(reduce_to(work, target, entry, seed=11 + level))
            lods[-1].name = lods[-1].data.name = names[level]
        bpy.data.objects.remove(source_copy, do_unlink=True)

    pivot = ground_center(lods[0])
    if entry.get("pivot") == "top":  # hanging fixtures: origin at the ceiling mount
        pivot.z += lods[0].dimensions.z
    for obj in lods:
        obj.data.transform(Matrix.Translation(-pivot))
    for obj in list(bpy.data.objects):
        if obj not in lods:
            bpy.data.objects.remove(obj, do_unlink=True)

    resize_images(entry.get("tex_max", 1024), entry.get("normal_max", entry.get("tex_max", 1024)))
    args.out_dir.mkdir(parents=True, exist_ok=True)
    glb = args.out_dir / f"{out_name}.glb"
    export_glb(glb, entry.get("image_quality", 80), args.compression)

    dims = lods[0].dimensions
    stats = {
        "id": args.id,
        "out": out_name,
        "file": f"models/{glb.name}",
        "source_file": src.name,
        "source_tris": source_tris,
        "picked_tris": picked_tris,
        "lods": [{"node": o.name, "tris": tri_count(o)} for o in lods],
        "bytes": glb.stat().st_size,
        # Blender Z-up; in glTF/three: width=x, height=y, depth=z.
        "dimensions_m": {"width_x": round(dims.x, 3), "depth_z": round(dims.y, 3), "height_y": round(dims.z, 3)},
        "pivot": ("top-centre of bounding box at origin (y=0 is the ceiling mount; model hangs to -y)"
                  if entry.get("pivot") == "top" else
                  "bottom-centre of LOD0 bounding box at origin (y=0 is ground contact)"),
        "compression": args.compression,
    }
    args.stats_dir.mkdir(parents=True, exist_ok=True)
    (args.stats_dir / f"{out_name}.json").write_text(json.dumps(stats, indent=1))
    print("STATS " + json.dumps(stats))


if __name__ == "__main__":
    main()
