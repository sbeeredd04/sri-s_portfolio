"""Derive the low-poly crowd figure from the built character.

Imports public/models/characters/sri.glb, collapses every mesh to a small
fraction of its faces (skin weights survive a collapse decimate), drops facial
shape keys, and exports crowd.glb with the same rig and clips. The
crowd is tinted per instance by material name, so names are kept.

    blender --background --python scripts/blender/character/crowd.py
"""

from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "public/models/characters/sri.glb"
TARGET = ROOT / "public/models/characters/crowd.glb"
RATIO = 0.16
CLIPS = {"walk", "idle"}


def main() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    faces = 0
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        # Facial shape keys are not played in a crowd, and block the decimate.
        if obj.data.shape_keys:
            obj.shape_key_clear()
        mod = obj.modifiers.new("crowd", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = RATIO
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        faces += len(obj.data.polygons)
    print(f"crowd triangles: {faces}")
    # The crowd bakes only these clips; the rest would just add weight.
    for action in list(bpy.data.actions):
        if action.name.split(".")[0] not in CLIPS:
            bpy.data.actions.remove(action)
    bpy.ops.export_scene.gltf(
        filepath=str(TARGET),
        export_format="GLB",
        export_animations=True,
        export_skins=True,
        export_texcoords=False,
        export_materials="EXPORT",
        export_image_format="NONE",
        export_draco_mesh_compression_enable=False,
    )


main()
