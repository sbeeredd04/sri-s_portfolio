"""Export an authored .blend without flattening its interaction hierarchy.

blender -b --python scripts/blender/export_authored.py -- --source master.blend \
  --manifest asset.json --out asset.glb
The manifest names required nodes, anchors and collider proxies. The output is
validated before replacing an existing deliverable. Masters are never saved.
"""
import argparse
import json
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_profiles import export_options


def read_glb(path):
    data = Path(path).read_bytes()
    if len(data) < 20:
        raise ValueError("Truncated GLB")
    magic, version, size = struct.unpack_from("<4sII", data)
    length, kind = struct.unpack_from("<I4s", data, 12)
    if magic != b"glTF" or version != 2 or size != len(data) or kind != b"JSON" or 20 + length > size:
        raise ValueError("Invalid GLB header or JSON chunk")
    return json.loads(data[20:20 + length])


def validate_manifest(manifest):
    if manifest.get("version") != 1:
        raise ValueError("Expected asset manifest version 1")
    for field in ("id", "source", "license", "profile"):
        if not isinstance(manifest.get(field), str) or not manifest[field].strip():
            raise ValueError(f"Missing {field}")
    export_options(manifest["profile"])
    if manifest.get("units") != "metres":
        raise ValueError("Asset contract requires metres")
    nodes = manifest.get("nodes")
    if not isinstance(nodes, list) or not nodes or len(set(nodes)) != len(nodes):
        raise ValueError("Expected unique required node names")
    for field in ("anchors", "colliders", "cutaways"):
        for name in manifest.get(field, []):
            if name not in nodes:
                raise ValueError(f"{field} references undeclared node {name}")


def verify_document(document, manifest):
    validate_manifest(manifest)
    nodes = document.get("nodes", [])
    names = [n.get("name") for n in nodes]
    for name in manifest["nodes"]:
        if names.count(name) != 1:
            raise ValueError(f"Required node missing or ambiguous: {name}")
    for child, parent in manifest.get("parents", {}).items():
        if child not in manifest["nodes"] or parent not in manifest["nodes"]:
            raise ValueError("Parent relationships must name declared nodes")
        if names.index(child) not in nodes[names.index(parent)].get("children", []):
            raise ValueError(f"Parent relationship lost: {parent}/{child}")
    for name, expected in manifest.get("extras", {}).items():
        if name not in manifest["nodes"]:
            raise ValueError(f"Extras reference undeclared node {name}")
        actual = nodes[names.index(name)].get("extras", {})
        for key, value in expected.items():
            if actual.get(key) != value:
                raise ValueError(f"Metadata lost: {name}.{key}")
    for name, attributes in manifest.get("attributes", {}).items():
        if name not in manifest["nodes"]:
            raise ValueError(f"Attributes reference undeclared node {name}")
        node = nodes[names.index(name)]
        primitives = document.get("meshes", [])[node["mesh"]]["primitives"]
        if any(not set(attributes) <= set(p.get("attributes", {})) for p in primitives):
            raise ValueError(f"Vertex attributes lost: {name}")
    if manifest["profile"] == "rigged" and not document.get("skins"):
        raise ValueError("Rigged export has no skin")
    if manifest.get("requireAnimation") and not document.get("animations"):
        raise ValueError("Required animation missing")


def export_scene(path, manifest):
    import bpy
    validate_manifest(manifest)
    if abs(bpy.context.scene.unit_settings.scale_length - 1.0) > 1e-8:
        raise ValueError("Master must use one Blender unit per metre before export")
    options = export_options(manifest["profile"])
    available = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    missing = set(options) - available
    if missing:
        raise RuntimeError(f"Blender cannot honor profile options: {sorted(missing)}")
    # No joining, decimation, pivot reset, source save or hierarchy conversion.
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.stem + ".pending.glb")
    try:
        bpy.ops.export_scene.gltf(filepath=str(temporary), export_format="GLB",
            export_yup=True, use_selection=False, export_cameras=False,
            export_lights=False, **options)
        verify_document(read_glb(temporary), manifest)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    import bpy
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.source.resolve() == args.out.resolve():
        raise ValueError("Output must not replace the master")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest)
    bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()))
    export_scene(args.out.resolve(), manifest)


if __name__ == "__main__":
    main()
