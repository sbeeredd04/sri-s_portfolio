#!/usr/bin/env python3
"""Read a GLB's JSON chunk (stdlib only): materials, texture maps, image bytes, triangles."""
from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

SLOTS = {
    "baseColorTexture": "baseColor",
    "metallicRoughnessTexture": "metallicRoughness",
    "normalTexture": "normal",
    "occlusionTexture": "occlusion",
    "emissiveTexture": "emissive",
}


def read_json(path: Path) -> dict:
    data = path.read_bytes()
    magic, _version, _length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise ValueError(f"{path} is not a GLB")
    chunk_len, chunk_type = struct.unpack_from("<I4s", data, 12)
    if chunk_type != b"JSON":
        raise ValueError(f"{path}: first chunk is not JSON")
    return json.loads(data[20:20 + chunk_len])


def summarize(path: Path) -> dict:
    gltf = read_json(path)
    views = gltf.get("bufferViews", [])
    images = gltf.get("images", [])
    textures = gltf.get("textures", [])

    def image_of(tex_index: int) -> dict:
        tex = textures[tex_index]
        src = tex.get("source")
        for ext in tex.get("extensions", {}).values():
            src = ext.get("source", src)
        if src is None:
            raise ValueError(f"{path.name}: texture {tex_index} has no image (invalid glTF)")
        img = images[src]
        size = views[img["bufferView"]]["byteLength"] if "bufferView" in img else None
        return {"mime": img.get("mimeType"), "bytes": size}

    materials = []
    for mat in gltf.get("materials", []):
        pbr = mat.get("pbrMetallicRoughness", {})
        maps = {}
        for key, label in SLOTS.items():
            ref = pbr.get(key) or mat.get(key)
            if ref:
                maps[label] = image_of(ref["index"])
        materials.append({
            "name": mat.get("name"),
            "alphaMode": mat.get("alphaMode", "OPAQUE"),
            "doubleSided": mat.get("doubleSided", False),
            "maps": maps,
        })

    tris = 0
    for mesh in gltf.get("meshes", []):
        for prim in mesh["primitives"]:
            acc = gltf["accessors"][prim["indices"]] if "indices" in prim else gltf["accessors"][prim["attributes"]["POSITION"]]
            tris += acc["count"] // 3
    return {
        "nodes": [n.get("name") for n in gltf.get("nodes", [])],
        "triangles": tris,
        "materials": materials,
        "image_bytes": sum(image_of(i)["bytes"] or 0 for i in range(len(textures))),
        "extensionsUsed": gltf.get("extensionsUsed", []),
        "extensionsRequired": gltf.get("extensionsRequired", []),
    }


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(Path(arg).name, json.dumps(summarize(Path(arg)), indent=1))
