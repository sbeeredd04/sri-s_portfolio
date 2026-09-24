"""Preview renders for the character: studio lighting, named camera shots."""
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

APP = Path(__file__).resolve().parents[3]
HDRI = APP / "public" / "hdri" / "interior-studio.hdr"

SHOTS = {  # name: (camera location, look-at, focal length mm)
    "front": ((0.0, -3.2, 0.72), (0.0, 0.0, 0.64), 50),
    "three_quarter": ((1.9, -2.5, 1.0), (0.0, 0.0, 0.64), 50),
    "back": ((-0.9, 3.0, 0.9), (0.0, 0.0, 0.64), 50),
    "face": ((0.35, -1.05, 1.1), (0.0, 0.0, 1.03), 70),
    "hands": ((0.75, -0.75, 0.62), (0.3, 0.0, 0.55), 70),
    "side": ((3.2, 0.0, 0.72), (0.0, 0.0, 0.64), 50),
}


def setup(size: int = 768, engine: str = "BLENDER_EEVEE", samples: int = 64) -> None:
    scene = bpy.context.scene
    scene.render.engine = engine
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    if engine == "CYCLES":
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
        scene.cycles.device = "GPU"
    world = bpy.data.worlds.new("studio")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = nodes["Background"]
    if HDRI.exists():
        env = nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(str(HDRI))
        links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.6
    _light("key", "AREA", (1.6, -2.2, 2.4), 260, 1.6, (1.0, 0.93, 0.85))
    _light("rim", "AREA", (-1.8, 1.8, 2.0), 180, 1.2, (0.8, 0.88, 1.0))
    _light("fill", "AREA", (-2.2, -1.6, 1.0), 60, 2.0, (0.95, 0.95, 1.0))
    floor_mesh = bpy.data.meshes.new("floor")
    floor_mesh.from_pydata([(-4, -4, 0), (4, -4, 0), (4, 4, 0), (-4, 4, 0)], [], [(0, 1, 2, 3)])
    floor = bpy.data.objects.new("preview_floor", floor_mesh)
    scene.collection.objects.link(floor)
    mat = bpy.data.materials.new("preview_floor")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.42, 0.4, 0.38, 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    floor_mesh.materials.append(mat)


def _light(name, kind, loc, power, size, color):
    data = bpy.data.lights.new(name, kind)
    data.energy = power
    data.color = color
    if kind == "AREA":
        data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    bpy.context.scene.collection.objects.link(obj)
    _aim(obj, Vector((0, 0, 0.7)))


def _aim(obj, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render(out_dir: Path, shots: list[str], prefix: str = "", offset=(0, 0, 0), custom: dict | None = None) -> list[Path]:
    scene = bpy.context.scene
    cam_data = bpy.data.cameras.get("preview_cam") or bpy.data.cameras.new("preview_cam")
    cam = bpy.data.objects.get("preview_cam") or bpy.data.objects.new("preview_cam", cam_data)
    if cam.name not in scene.collection.objects:
        scene.collection.objects.link(cam)
    scene.camera = cam
    out_dir.mkdir(parents=True, exist_ok=True)
    table = {**SHOTS, **(custom or {})}
    paths = []
    for shot in shots:
        loc, look, lens = table[shot]
        cam.location = Vector(loc) + Vector(offset)
        cam_data.lens = lens
        _aim(cam, Vector(look) + Vector(offset))
        path = out_dir / f"{prefix}{shot}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        paths.append(path)
    return paths


def orbit(distance: float, height: float, look_z: float, yaw_deg: float, lens: int = 50):
    yaw = math.radians(yaw_deg)
    return ((math.sin(yaw) * distance, -math.cos(yaw) * distance, height), (0, 0, look_z), lens)
