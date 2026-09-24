"""Blender headless: build original desk props (task chair, 27" thin-bezel monitor) as web GLBs.

  blender -b --python scripts/blender/build_props.py [-- --only chair|monitor]

Both face glTF +Z (Blender -Y), metres, pivot at floor/desk contact. The monitor's
display is a separate quad with material "screen" and UVs 0..1 across the visible
area (u left->right, v bottom->top as seen from the front), ready for a video or
canvas texture. Fabric uses the CC0 Poly Haven rough_linen maps from asset-src.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from optimize_model import export_glb  # noqa: E402

APP = HERE.parents[1]
LINEN = APP / "asset-src" / "textures" / "rough_linen"


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=["chair", "monitor"])
    return parser.parse_args(argv)


# ---------------------------------------------------------------- helpers

def flat_material(name, rgb, roughness, metallic=0.0):
    mat = bpy.data.materials.new(name)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    mat.use_backface_culling = True
    return mat


def fabric_material(name, tint):
    """rough_linen albedo x tint (exported as baseColorFactor), linen normal, roughness from ARM."""
    mat = flat_material(name, (1, 1, 1), 0.9)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    diff, nor, arm = (nodes.new("ShaderNodeTexImage") for _ in range(3))
    for node, file, space in ((diff, "diff.jpg", "sRGB"), (nor, "nor_gl.jpg", "Non-Color"), (arm, "arm.jpg", "Non-Color")):
        node.image = bpy.data.images.load(str(LINEN / file), check_existing=True)
        node.image.colorspace_settings.name = space
        node.image.scale(512, 512)
    mult = nodes.new("ShaderNodeMix")
    mult.data_type, mult.blend_type = "RGBA", "MULTIPLY"
    mult.inputs["Factor"].default_value = 1.0
    mult.inputs["B"].default_value = (*tint, 1.0)
    links.new(diff.outputs["Color"], mult.inputs["A"])
    links.new(mult.outputs["Result"], bsdf.inputs["Base Color"])
    nmap, split = nodes.new("ShaderNodeNormalMap"), nodes.new("ShaderNodeSeparateColor")
    links.new(nor.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(arm.outputs["Color"], split.inputs["Color"])
    links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
    return mat


def finish(obj, mat, bevel=0.0, segments=2):
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width, mod.segments, mod.limit_method = bevel, segments, "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def box(size, loc, mat, bevel=0.0, segments=2, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel, segments)


def cylinder(radius, depth, loc, mat, verts=16, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    return finish(bpy.context.active_object, mat, bevel, 2)


def beam(a, b, width, depth, mat, bevel=0.004):
    """Box spanning point a to point b (its local Z along a->b)."""
    a, b = Vector(a), Vector(b)
    axis = b - a
    bpy.ops.mesh.primitive_cube_add(size=1, location=(a + b) / 2)
    obj = bpy.context.active_object
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = axis.to_track_quat("Z", "Y")
    obj.scale = (width, depth, axis.length)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(obj, mat, bevel, 2)


def curved_panel(width, height, thickness, centre, recline, wrap, lumbar, mat, nx=14, nz=12):
    """Backrest shell: wraps around the sitter in plan and bulges forward at the lumbar."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=nx, y_subdivisions=nz, size=1)
    obj = bpy.context.active_object
    for v in obj.data.vertices:
        x, t = v.co.x * width, v.co.y + 0.5  # t: 0 bottom .. 1 top
        y = wrap * (x / (width / 2)) ** 2 - lumbar * math.sin(math.pi * min(1.0, t * 1.4))
        v.co = Vector((x, y, (t - 0.5) * height))
    obj.data.transform(Matrix.Rotation(math.radians(90), 4, "X") @ Matrix.Rotation(math.radians(-90), 4, "X"))
    solid = obj.modifiers.new("solid", "SOLIDIFY")
    solid.thickness, solid.offset = thickness, 0.0
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=solid.name)
    obj.data.transform(Matrix.Rotation(-math.radians(recline), 4, "X"))
    obj.location = centre
    bpy.ops.object.transform_apply(location=True)
    return finish(obj, mat, 0.008, 2)


def join_all(name):
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = obj.data.name = name
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    return obj


def cube_uvs(obj, size):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=size, correct_aspect=False, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def export(obj, name, extra):
    glb = APP / "public" / "models" / f"{name}.glb"
    export_glb(glb, 82, "meshopt")
    obj.data.calc_loop_triangles()
    d = obj.dimensions
    stats = {"file": f"models/{glb.name}", "procedural": True, "tris": len(obj.data.loop_triangles),
             "bytes": glb.stat().st_size,
             "dimensions_m": {"width_x": round(d.x, 3), "height_y": round(d.z, 3), "depth_z": round(d.y, 3)},
             "materials": [s.material.name for s in obj.material_slots], **extra}
    (APP / "asset-src" / "stats" / f"{name}.json").write_text(json.dumps(stats, indent=1))
    print("STATS " + json.dumps(stats))


# ---------------------------------------------------------------- task chair

def build_chair():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    plastic = flat_material("chair_plastic", (0.025, 0.025, 0.028), 0.45)
    metal = flat_material("chair_metal", (0.8, 0.8, 0.82), 0.22, 1.0)
    fabric = fabric_material("chair_fabric", (0.12, 0.125, 0.135))
    mesh = fabric_material("chair_mesh", (0.06, 0.063, 0.068))

    for k in range(5):  # five-star base with casters
        a = math.radians(90 + 72 * k)
        tip = Vector((0.33 * math.cos(a), 0.33 * math.sin(a), 0.075))
        beam((0.0, 0.0, 0.1), tip, 0.045, 0.03, plastic)
        cylinder(0.03, 0.022, (tip.x * 0.96, tip.y * 0.96, 0.03), plastic, 12, rot=(math.pi / 2, 0, a + math.pi / 2))
        box((0.03, 0.045, 0.04), (tip.x * 0.96, tip.y * 0.96, 0.062), plastic, 0.006, rot=(0, 0, a))
    cylinder(0.05, 0.07, (0, 0, 0.1), plastic, 20, bevel=0.01)
    cylinder(0.04, 0.16, (0, 0, 0.2), plastic, 20)
    cylinder(0.026, 0.14, (0, 0, 0.35), metal, 16)
    box((0.24, 0.26, 0.05), (0, 0.01, 0.415), plastic, 0.01)
    box((0.5, 0.48, 0.08), (0, 0.0, 0.475), fabric, 0.035, 4)  # seat cushion, top at ~0.515

    beam((0.0, 0.2, 0.43), (0.0, 0.29, 0.66), 0.07, 0.03, plastic)  # back support spine
    curved_panel(0.47, 0.56, 0.035, (0.0, 0.3, 0.84), recline=10, wrap=-0.05, lumbar=0.025, mat=mesh)
    beam((-0.24, 0.29, 0.585), (0.24, 0.29, 0.585), 0.035, 0.035, plastic)  # lower frame rail
    for side in (-1, 1):  # armrests
        beam((side * 0.27, 0.06, 0.45), (side * 0.27, 0.04, 0.66), 0.03, 0.06, plastic)
        box((0.075, 0.26, 0.028), (side * 0.27, 0.02, 0.675), plastic, 0.012, 3)
        beam((side * 0.21, 0.06, 0.44), (side * 0.27, 0.06, 0.45), 0.03, 0.05, plastic)

    chair = join_all("office-chair")
    cube_uvs(chair, 0.27)
    export(chair, "office-chair", {"pivot": "floor contact under the base centre; front faces +Z",
                                   "seat_height_m": 0.515, "source": "original procedural model; fabric maps "
                                   "from Poly Haven rough_linen (CC0)"})


# ---------------------------------------------------------------- 27" monitor

def build_monitor():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body = flat_material("monitor_body", (0.02, 0.02, 0.022), 0.4, 0.2)
    stand = flat_material("monitor_stand", (0.62, 0.63, 0.65), 0.32, 1.0)
    screen = flat_material("screen", (0.004, 0.004, 0.005), 0.12)

    view_w, view_h, side, top, chin = 0.597, 0.336, 0.006, 0.006, 0.018
    panel_w, panel_h = view_w + 2 * side, view_h + top + chin
    centre_z = 0.3
    bottom = centre_z - panel_h / 2
    box((panel_w, 0.011, panel_h), (0, 0, centre_z), body, 0.002)
    box((0.4, 0.034, 0.25), (0, 0.022, centre_z - 0.01), body, 0.012, 3)  # rear housing
    beam((0, 0.07, 0.012), (0, 0.045, centre_z - 0.02), 0.07, 0.022, stand, 0.006)  # neck
    box((0.26, 0.19, 0.012), (0, 0.06, 0.006), stand, 0.008, 3)  # foot, bottom at y=0

    # Display quad: exactly the visible area, 0.2 mm proud of the bezel, UV 0..1 across it.
    x0, x1 = -view_w / 2, view_w / 2
    z0 = bottom + chin
    verts = [(x0, -0.0057, z0), (x1, -0.0057, z0), (x1, -0.0057, z0 + view_h), (x0, -0.0057, z0 + view_h)]
    mesh = bpy.data.meshes.new("screen")
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new(name="UVMap")
    for loop, coord in zip(mesh.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[loop.index].uv = coord
    mesh.flip_normals() if mesh.polygons[0].normal.y > 0 else None
    quad = bpy.data.objects.new("screen", mesh)
    bpy.context.scene.collection.objects.link(quad)
    quad.data.materials.append(screen)

    monitor = join_all("monitor-27")
    export(monitor, "monitor-27", {
        "pivot": "desk contact under the foot; screen faces +Z",
        "screen": {"material": "screen", "visible_area_m": [view_w, view_h], "centre_y_m": round(z0 + view_h / 2, 4),
                   "uv": "0..1 across the visible area, u left->right, v bottom->top from the front"},
        "source": "original procedural model"})


def main():
    args = parse_args()
    if args.only in (None, "chair"):
        build_chair()
    if args.only in (None, "monitor"):
        build_monitor()


if __name__ == "__main__":
    main()
