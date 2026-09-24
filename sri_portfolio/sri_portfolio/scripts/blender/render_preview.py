"""Blender headless: re-import exported GLBs and render a 512px check image of each.

  blender -b --python scripts/blender/render_preview.py -- --out-dir /tmp/previews public/models/*.glb

Re-importing the shipped file (not the working scene) proves the GLB decodes
(meshopt + WebP) and its textures resolve. LOD nodes are laid out side by side.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("glbs", nargs="+", type=Path)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--hdri", type=Path, default=APP / "public" / "hdri" / "interior-studio.hdr")
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--engine", default="BLENDER_EEVEE")
    parser.add_argument("--overcast", action="store_true", help="flat bright sky, no sun")
    parser.add_argument("--triplanar", type=Path, help="colour texture box-projected over every material")
    parser.add_argument("--tile", type=float, default=3.0, help="triplanar tile size in metres")
    parser.add_argument("--view", default="0.55,-1.0,0.45", help="camera direction from the object (Blender axes)")
    return parser.parse_args(argv)


def setup_scene(hdri: Path, size: int, engine: str, overcast: bool = False) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = engine
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    if engine == "CYCLES":
        scene.cycles.samples = 48
        scene.cycles.use_denoising = True
    world = bpy.data.worlds.new("preview")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = nodes["Background"]
    if overcast:
        bg.inputs["Color"].default_value = (0.78, 0.8, 0.83, 1.0)
    elif hdri.exists():
        env = nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(str(hdri))
        links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0
    if overcast:
        return
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(35))
    scene.collection.objects.link(sun)


def ground(size: float) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=size)
    plane = bpy.context.active_object
    mat = bpy.data.materials.new("ground")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.35, 0.35, 0.33, 1)
    plane.data.materials.append(mat)
    return plane


def bounds(objs: list) -> tuple[Vector, Vector]:
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector(map(min, zip(*pts))), Vector(map(max, zip(*pts)))


def apply_triplanar(meshes: list, texture: Path, tile: float) -> None:
    """Preview-only stand-in for the app's triplanar shader: box-project a colour map in object space."""
    image = bpy.data.images.load(str(texture), check_existing=True)
    for mat in {s.material for o in meshes for s in o.material_slots if s.material}:
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue
        coord, mapping, tex = nodes.new("ShaderNodeTexCoord"), nodes.new("ShaderNodeMapping"), nodes.new("ShaderNodeTexImage")
        mapping.inputs["Scale"].default_value = (1 / tile,) * 3
        tex.image, tex.projection, tex.projection_blend = image, "BOX", 0.25
        links.new(coord.outputs["Object"], mapping.inputs["Vector"])
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])


def render(glb: Path, out_dir: Path, triplanar: Path | None = None, tile: float = 3.0,
           view: tuple = (0.55, -1.0, 0.45)) -> None:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    meshes = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    if triplanar:
        apply_triplanar(meshes, triplanar, tile)
    lods = sorted((o for o in meshes if "_LOD" in o.name), key=lambda o: o.name)
    if len(lods) > 1:
        lo, hi = bounds([lods[0]])
        step = (hi.x - lo.x) * 1.15
        for i, obj in enumerate(lods[1:], start=1):
            obj.location.x += step * i
    lo, hi = bounds(meshes)
    centre = (lo + hi) / 2
    radius = max((hi - lo).length / 2, 0.05)
    plane = ground(radius * 8)
    plane.location = (centre.x, centre.y, lo.z)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    direction = Vector(view).normalized()
    fov = 2 * math.atan(cam_data.sensor_width / (2 * cam_data.lens))
    cam.location = centre + direction * (radius / math.sin(fov / 2)) * 1.2
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam_data.clip_end = radius * 50
    bpy.context.scene.camera = cam

    bpy.context.scene.render.filepath = str(out_dir / f"{glb.stem}.png")
    bpy.ops.render.render(write_still=True)
    for obj in list(bpy.data.objects):
        if obj not in before:
            bpy.data.objects.remove(obj, do_unlink=True)
    print(f"PREVIEW {glb.name} -> {out_dir / (glb.stem + '.png')}")


def main() -> None:
    args = parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    setup_scene(args.hdri, args.size, args.engine, args.overcast)
    for glb in args.glbs:
        render(glb, args.out_dir, args.triplanar, args.tile, tuple(float(x) for x in args.view.split(",")))


if __name__ == "__main__":
    main()
