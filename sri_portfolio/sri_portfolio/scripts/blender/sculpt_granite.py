"""Blender headless: sculpt the valley granite forms (wall, dome, ridge) into web GLBs.

  blender -b --python scripts/blender/sculpt_granite.py -- [--forms wall dome ridge] [--voxel 0.04]

Per form: base shape (granite_forms.py) -> voxel remesh -> numpy displacement stack
(Worley joints/cracks, jointed blocks, ledges/sheeting, fBm) along normals -> clamp to
the layout exclusion -> collapse to <= 9k tris -> Smart UV -> Cycles bake of normal +
AO from the high-poly -> GLB with light-grey base colour, normal map and ORM
(R=AO, G=roughness, B=metal). Colour is left to the app's triplanar granite texture.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import granite_forms as gf  # noqa: E402
from mesh_ops import collapse, tri_count  # noqa: E402

APP = HERE.parents[1]
FORMS = {
    "wall": {"form": gf.WALL, "build": lambda: gf.wall_mesh(), "displace": gf.displace_wall, "y_max": 10.6},
    "dome": {"form": gf.DOME, "build": lambda: gf.heightfield_mesh(gf.dome_height, 4.2, 3.5),
             "displace": gf.displace_dome, "y_max": 8.7},
    "ridge": {"form": gf.RIDGE, "build": lambda: gf.heightfield_mesh(gf.ridge_height, 6.8, 1.85),
              "displace": gf.displace_ridge, "y_max": 4.35},
}


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--forms", nargs="+", default=list(FORMS), choices=list(FORMS))
    parser.add_argument("--voxel", type=float, default=0.04)
    parser.add_argument("--tris", type=int, default=9000)
    parser.add_argument("--bake-size", type=int, default=1024)
    parser.add_argument("--out-dir", type=Path, default=APP / "public" / "models")
    parser.add_argument("--stats-dir", type=Path, default=APP / "asset-src" / "stats")
    return parser.parse_args(argv)


# three.js local (lx, y, lz)  <->  Blender (X, Y, Z) with Z up; glTF export maps back exactly.
def to_blender(p: np.ndarray) -> np.ndarray:
    return np.stack([p[:, 0], -p[:, 2], p[:, 1]], axis=1)


def from_blender(v: np.ndarray) -> np.ndarray:
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1)


def get_coords(mesh) -> np.ndarray:
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", co)
    return from_blender(co.reshape(-1, 3))


def set_coords(mesh, p: np.ndarray) -> None:
    mesh.vertices.foreach_set("co", to_blender(p).ravel())
    mesh.update()


def get_normals(mesh) -> np.ndarray:
    nrm = np.empty(len(mesh.vertices) * 3)
    mesh.vertex_normals.foreach_get("vector", nrm)
    return from_blender(nrm.reshape(-1, 3))


def new_object(name: str, verts: np.ndarray, faces: list) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in to_blender(verts)], [], faces)
    mesh.validate()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def apply_modifier(obj, kind: str, **props) -> None:
    mod = obj.modifiers.new(kind.lower(), kind)
    for key, value in props.items():
        setattr(mod, key, value)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def drop_base(obj, y_cut: float = -0.47) -> None:
    """Remove faces entirely below y_cut (the slab bottom and buried skirts)."""
    mesh = obj.data
    p = get_coords(mesh)
    loop_v = np.empty(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get("vertex_index", loop_v)
    starts = np.empty(len(mesh.polygons), dtype=np.int64)
    mesh.polygons.foreach_get("loop_start", starts)
    face_max = np.maximum.reduceat(p[loop_v, 1], starts)
    from mesh_ops import delete_and_scale
    delete_and_scale(obj, face_max >= y_cut)


def sculpt_high(name: str, spec: dict, voxel: float) -> bpy.types.Object:
    verts, faces = spec["build"]()
    obj = new_object(f"{name}_high", verts, faces)
    apply_modifier(obj, "REMESH", mode="VOXEL", voxel_size=voxel, adaptivity=0.0)
    drop_base(obj)
    mesh = obj.data
    p, n = get_coords(mesh), get_normals(mesh)
    d = spec["displace"](p, n)
    p = p + n * d[:, None]
    set_coords(mesh, gf.clamp_to_form(p, spec["form"], spec["y_max"]))
    print(f"  high: {tri_count(obj)} tris, displacement {d.min():.2f}..{d.max():.2f} m")
    return obj


def make_low(high, name: str, spec: dict, target: int) -> bpy.types.Object:
    low = high.copy()
    low.data = high.data.copy()
    low.name = low.data.name = name
    bpy.context.scene.collection.objects.link(low)
    collapse(low, target)
    set_coords(low.data, gf.clamp_to_form(get_coords(low.data), spec["form"], spec["y_max"]))
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.select_all(action="DESELECT")
    low.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(55))
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.008)
    bpy.ops.object.mode_set(mode="OBJECT")
    return low


def bake_maps(high, low, size: int) -> tuple:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 64
    for attr in ("visible_diffuse", "visible_glossy", "visible_shadow", "visible_transmission", "visible_volume_scatter"):
        setattr(low, attr, False)  # the cage must not occlude the high-poly's AO rays
    mat = bpy.data.materials.new(f"{low.name}_bake")
    low.data.materials.clear()
    low.data.materials.append(mat)
    target = mat.node_tree.nodes.new("ShaderNodeTexImage")
    images = {}
    for key, bake_type, fill in (("normal", "NORMAL", (0.5, 0.5, 1.0, 1.0)), ("ao", "AO", (1, 1, 1, 1))):
        img = bpy.data.images.new(f"{low.name}_{key}", size, size, alpha=False)
        img.generated_color = fill
        img.colorspace_settings.name = "Non-Color"
        target.image = img
        mat.node_tree.nodes.active = target
        bpy.ops.object.select_all(action="DESELECT")
        high.select_set(True)
        low.select_set(True)
        bpy.context.view_layer.objects.active = low
        bpy.ops.object.bake(type=bake_type, use_selected_to_active=True, cage_extrusion=0.25,
                            max_ray_distance=0.7, margin=6, use_clear=False, target="IMAGE_TEXTURES")
        images[key] = img
    bpy.data.materials.remove(mat)
    return images["normal"], images["ao"]


def gltf_output_group():
    group = bpy.data.node_groups.get("glTF Material Output")
    if group is None:
        group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return group


def build_material(low, normal_img, ao_img, name: str) -> None:
    size = ao_img.size[0]
    ao = np.empty(size * size * 4, dtype=np.float32)
    ao_img.pixels.foreach_get(ao)
    ao = ao.reshape(-1, 4)[:, 0]
    arm = bpy.data.images.new(f"{name}_arm", size, size, alpha=False)
    arm.colorspace_settings.name = "Non-Color"
    px = np.stack([ao, np.clip(0.8 + 0.14 * (1 - ao), 0, 1), np.zeros_like(ao), np.ones_like(ao)], axis=1)
    arm.pixels.foreach_set(px.ravel())
    arm.pack()
    normal_img.pack()
    bpy.data.images.remove(ao_img)

    mat = bpy.data.materials.new(f"{name}_granite")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
    nor_tex = nodes.new("ShaderNodeTexImage")
    nor_tex.image = normal_img
    nmap = nodes.new("ShaderNodeNormalMap")
    links.new(nor_tex.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    arm_tex = nodes.new("ShaderNodeTexImage")
    arm_tex.image = arm
    split = nodes.new("ShaderNodeSeparateColor")
    links.new(arm_tex.outputs["Color"], split.inputs["Color"])
    links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
    links.new(split.outputs["Blue"], bsdf.inputs["Metallic"])
    occlusion = nodes.new("ShaderNodeGroup")
    occlusion.node_tree = gltf_output_group()
    links.new(split.outputs["Red"], occlusion.inputs["Occlusion"])
    mat.use_backface_culling = True  # closed forms, buried open base: export single-sided
    low.data.materials.clear()
    low.data.materials.append(mat)


def export(low, path: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    low.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True, export_yup=True,
                              export_image_format="WEBP", export_image_quality=85, export_normals=True,
                              export_tangents=True, export_texcoords=True, export_vertex_color="NONE",
                              export_attributes=False, export_animations=False, export_extras=False,
                              export_meshopt_compression_enable=True)


def measure(low, form: dict) -> dict:
    p = get_coords(low.data)
    lo, hi = p.min(0), p.max(0)
    if form["shape"] == "box":
        worst = max(np.abs(p[:, 0]).max() / form["hx"], np.abs(p[:, 2]).max() / form["hz"])
    else:
        worst = float(np.sqrt(((p[:, 0] / form["hx"]) ** 2 + (p[:, 2] / form["hz"]) ** 2).max()))
    return {
        "min": [round(float(x), 3) for x in lo], "max": [round(float(x), 3) for x in hi],
        "size": [round(float(x), 3) for x in hi - lo],
        "exclusion_fill": round(float(worst), 3),  # <= 1.0 means every vertex is inside
    }


def main() -> None:
    args = parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    args.stats_dir.mkdir(parents=True, exist_ok=True)
    for name in args.forms:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        spec = FORMS[name]
        out = f"granite-{name}"
        print(f"== {out}")
        high = sculpt_high(name, spec, args.voxel)
        low = make_low(high, out, spec, args.tris)
        normal_img, ao_img = bake_maps(high, low, args.bake_size)
        build_material(low, normal_img, ao_img, out)
        high_tris = tri_count(high)
        bpy.data.objects.remove(high, do_unlink=True)
        glb = args.out_dir / f"{out}.glb"
        export(low, glb)
        stats = {"file": f"models/{glb.name}", "tris": tri_count(low), "high_tris": high_tris,
                 "bytes": glb.stat().st_size, "bounds_local_m": measure(low, spec["form"]),
                 "frame": "valley-layout local frame: (lx, y, lz), origin = form.x/z at y=0"}
        (args.stats_dir / f"{out}.json").write_text(json.dumps(stats, indent=1))
        print("STATS " + json.dumps(stats))


if __name__ == "__main__":
    main()
