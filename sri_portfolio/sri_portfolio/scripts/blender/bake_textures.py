"""Blender headless: bake procedural-shader materials to PBR image maps (Cycles).

  blender -b scene.blend --python scripts/blender/bake_textures.py -- --out-dir baked/ [--size 1024] [--glb out.glb]
  blender -b --python scripts/blender/bake_textures.py -- --demo --out-dir /tmp/bake-demo --glb /tmp/bake-demo/demo.glb

Every mesh material whose Principled BSDF inputs are driven by anything other than
plain image textures gets baked to <material>_{color,rough,normal,ao}.png at --size.
The material is then rebuilt as image textures -> Principled BSDF so the glTF
exporter can ship it (AO is written alongside for the web renderer's aoMap).
Objects without UVs get a Smart UV Project first.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy

BAKES = {  # map -> (Cycles bake type, colour space, Principled input)
    "color": ("DIFFUSE", "sRGB", "Base Color"),
    "rough": ("ROUGHNESS", "Non-Color", "Roughness"),
    "normal": ("NORMAL", "Non-Color", "Normal"),
    "ao": ("AO", "Non-Color", None),
}


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--size", type=int, default=1024)
    parser.add_argument("--samples", type=int, default=32)
    parser.add_argument("--glb", type=Path)
    parser.add_argument("--demo", action="store_true", help="bake a procedural test object")
    return parser.parse_args(argv)


def build_demo() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=48, ring_count=24)
    obj = bpy.context.active_object
    mat = bpy.data.materials.new("demo_procedural")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 12
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.25, 0.12, 0.05, 1)
    ramp.color_ramp.elements[1].color = (0.8, 0.6, 0.35, 1)
    bump = nodes.new("ShaderNodeBump")
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bsdf.inputs["Roughness"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    obj.data.materials.append(mat)


def needs_bake(mat: bpy.types.Material) -> bool:
    if not mat or not mat.use_nodes:
        return False
    bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        return True  # non-Principled shaders cannot be exported as-is
    for name in ("Base Color", "Roughness", "Normal", "Metallic"):
        sock = bsdf.inputs[name]
        if sock.is_linked and sock.links[0].from_node.type not in {"TEX_IMAGE", "NORMAL_MAP"}:
            return True
    return False


def ensure_uvs(obj: bpy.types.Object) -> None:
    if obj.data.uv_layers:
        return
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake_material(obj: bpy.types.Object, mat: bpy.types.Material, size: int, out_dir: Path) -> None:
    nodes = mat.node_tree.nodes
    target = nodes.new("ShaderNodeTexImage")
    images = {}
    for key, (bake_type, space, _) in BAKES.items():
        img = bpy.data.images.new(f"{mat.name}_{key}", size, size, alpha=False)
        img.colorspace_settings.name = space
        target.image = img
        nodes.active = target
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        kwargs = {"type": bake_type, "margin": 8, "use_clear": True}
        if bake_type == "DIFFUSE":
            kwargs["pass_filter"] = {"COLOR"}
        bpy.ops.object.bake(**kwargs)
        img.filepath_raw = str(out_dir / f"{mat.name}_{key}.png")
        img.file_format = "PNG"
        img.save()
        images[key] = img
        print(f"  baked {obj.name}/{mat.name}: {key}")
    rebuild_material(mat, images, target)


def rebuild_material(mat: bpy.types.Material, images: dict, scratch) -> None:
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for node in list(nodes):
        if node.type != "OUTPUT_MATERIAL":
            nodes.remove(node)
    out = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    for key, (_, _, socket) in BAKES.items():
        if socket is None:
            continue
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = images[key]
        if key == "normal":
            nmap = nodes.new("ShaderNodeNormalMap")
            links.new(tex.outputs["Color"], nmap.inputs["Color"])
            links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
        else:
            links.new(tex.outputs["Color"], bsdf.inputs[socket])


def main() -> None:
    args = parse_args()
    if args.demo:
        build_demo()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = args.samples
    baked = 0
    for obj in [o for o in scene.objects if o.type == "MESH"]:
        mats = {s.material for s in obj.material_slots if needs_bake(s.material)}
        if not mats:
            continue
        ensure_uvs(obj)
        for mat in mats:
            bake_material(obj, mat, args.size, args.out_dir)
            baked += 1
    print(f"BAKED {baked} material(s) into {args.out_dir}")
    if args.glb:
        bpy.ops.export_scene.gltf(filepath=str(args.glb), export_format="GLB", export_image_format="WEBP")
    bpy.ops.wm.save_as_mainfile(filepath=str(args.out_dir / "baked.blend"))


if __name__ == "__main__":
    main()
