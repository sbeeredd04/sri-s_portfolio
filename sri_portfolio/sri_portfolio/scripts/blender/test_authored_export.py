"""Real Blender integration fixture; output stays in a temporary directory."""
import json
import sys
import tempfile
from pathlib import Path
import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_authored import export_scene, read_glb, verify_document

bpy.ops.wm.read_factory_settings(use_empty=True)
root = bpy.data.objects.new("asset_root", None)
bpy.context.collection.objects.link(root)
root["soundProfile"] = "wood"
bpy.ops.mesh.primitive_cube_add(size=1)
visual = bpy.context.object
visual.name = "visual"
visual.parent = root
visual.location = (0, 0, 0.5)
anchor = bpy.data.objects.new("contact_anchor", None)
bpy.context.collection.objects.link(anchor)
anchor.parent = root
anchor.location = (0.25, 0, 0)
manifest = {"version":1,"id":"fixture","source":"original test fixture","license":"project test fixture", "units":"metres", "profile":"interactive", "nodes":["asset_root","visual","contact_anchor"],"anchors":["contact_anchor"],"parents":{"visual":"asset_root","contact_anchor":"asset_root"},"extras":{"asset_root":{"soundProfile":"wood"}}}
with tempfile.TemporaryDirectory() as directory:
    output = Path(directory)/"fixture.glb"
    export_scene(output, manifest)
    document = read_glb(output)
    verify_document(document, manifest)
    corrupt = json.loads(json.dumps(document))
    for node in corrupt["nodes"]:
        node.pop("extras", None)
    try:
        verify_document(corrupt, manifest)
    except ValueError:
        pass
    else:
        raise AssertionError("Metadata loss was not caught")
    # Actual Blender round trip checks hierarchy and contact transform.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(output))
    assert bpy.data.objects["visual"].parent.name == "asset_root"
    assert bpy.data.objects["asset_root"]["soundProfile"] == "wood"
    assert abs(bpy.data.objects["contact_anchor"].location.x - 0.25) < 1e-6
    print("PASS: interactive GLB hierarchy, metadata and contact-anchor round trip")

for profile in ("vegetation", "rigged"):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.mesh.primitive_cube_add(size=1)
    mesh = bpy.context.object
    mesh.name = "plant" if profile == "vegetation" else "body"
    contract = {"version":1,"id":profile,"source":"original test fixture","license":"project test fixture", "units":"metres", "profile":profile,"nodes":[mesh.name]}
    if profile == "vegetation":
        attribute = mesh.data.attributes.new("_WIND", "FLOAT", "POINT")
        for vertex, value in zip(mesh.data.vertices, attribute.data):
            value.value = vertex.co.z + 0.5
        contract["attributes"] = {"plant":["_WIND"]}
    else:
        bpy.ops.object.armature_add()
        rig = bpy.context.object
        rig.name = "rig"
        mesh.parent = rig
        modifier = mesh.modifiers.new("deform", "ARMATURE")
        modifier.object = rig
        group = mesh.vertex_groups.new(name="Bone")
        group.add(list(range(len(mesh.data.vertices))), 1.0, "REPLACE")
        bone = rig.pose.bones["Bone"]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler.z = 0
        bone.keyframe_insert(data_path="rotation_euler", frame=1)
        bone.rotation_euler.z = 0.2
        bone.keyframe_insert(data_path="rotation_euler", frame=20)
        bpy.context.scene.frame_end = 20
        contract["nodes"].append("rig")
        contract["requireAnimation"] = True
    with tempfile.TemporaryDirectory() as directory:
        output = Path(directory)/"fixture.glb"
        export_scene(output, contract)
        document = read_glb(output)
        verify_document(document, contract)
        if profile == "rigged":
            primitive = document["meshes"][0]["primitives"][0]
            assert "JOINTS_0" in primitive["attributes"]
            assert "WEIGHTS_0" in primitive["attributes"]
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(output))
        if profile == "rigged":
            assert any(obj.type == "ARMATURE" for obj in bpy.data.objects)
            assert len(bpy.data.actions) > 0
        else:
            assert "_WIND" in bpy.data.objects["plant"].data.attributes
        print(f"PASS: {profile} GLB round trip")
