"""Build a small authored forest-fern clump for the redwood vignette.

Run from the app directory with Blender:
  blender -b --python scripts/blender/build_forest_fern.py
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from optimize_model import export_glb  # noqa: E402

APP = HERE.parents[1]


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mesh = bpy.data.meshes.new("forest-fern")
    verts, faces, colors = [], [], []

    def face(points, color):
        start = len(verts)
        verts.extend(points)
        faces.append(tuple(range(start, len(verts))))
        colors.append(color)

    # Five separate, asymmetrical fronds emerge from a low central crown.
    # Their bowed midribs and overlapping paired pinnae create a readable
    # fern silhouette without thin alpha cards or a heavy texture set.
    palette = [
        (0.12, 0.205, 0.075, 1),
        (0.17, 0.255, 0.083, 1),
        (0.22, 0.29, 0.105, 1),
        (0.105, 0.17, 0.075, 1),
    ]
    for frond in range(5):
        angle = math.tau * frond / 5 + 0.23 * math.sin(frond * 4.1)
        dx, dy = math.cos(angle), math.sin(angle)
        tx, ty = -dy, dx
        length = 0.43 + 0.045 * math.sin(frond * 3.4)
        base_z = 0.055 + 0.018 * (frond % 2)
        # A narrow, tapered, slightly arched midrib.
        spine = []
        for i in range(9):
            t = i / 8
            spine.append(Vector((dx * length * t, dy * length * t,
                                base_z + 0.31 * math.sin(t * math.pi * 0.68) + 0.08 * t)))
        for i in range(len(spine) - 1):
            p, q = spine[i], spine[i + 1]
            w0 = 0.012 * (1 - i / 9) + 0.003
            w1 = 0.012 * (1 - (i + 1) / 9) + 0.002
            n0 = Vector((-dy * w0, dx * w0, 0))
            n1 = Vector((-dy * w1, dx * w1, 0))
            face((p - n0, p + n0, q + n1, q - n1), 3 if frond % 3 == 0 else 0)

        for pair in range(1, 8):
            t = pair / 8.5
            center = spine[min(7, int(t * 8))].lerp(spine[min(8, int(t * 8) + 1)], (t * 8) % 1)
            fullness = math.sin(math.pi * t) ** 0.68
            leaflet = 0.19 * fullness * (0.94 - 0.18 * t)
            for side in (-1, 1):
                # The pinna points diagonally backward from the growing tip.
                back = -0.11 * length
                end = center + Vector((dx * back + tx * side * leaflet,
                                       dy * back + ty * side * leaflet,
                                       -0.025 - 0.035 * t))
                mid = center.lerp(end, 0.56) + Vector((0, 0, 0.018))
                rib = center.lerp(end, 0.7)
                outer = end + Vector((dx * 0.038, dy * 0.038, -0.014))
                inner_edge = center + Vector((dx * 0.045, dy * 0.045, 0.012))
                tone = (frond + pair + (side > 0)) % len(palette)
                # Folded upper and lower halves catch warm key light as facets.
                face((center, mid, rib, inner_edge), tone)
                face((mid, end, outer, rib), (tone + 1) % len(palette))
                face((center, inner_edge, rib, mid), (tone + 3) % len(palette))
                face((mid, rib, outer, end), (tone + 2) % len(palette))

    mesh.from_pydata(verts, [], faces)
    base = bpy.data.materials.new("forest-fern-facet")
    base.diffuse_color = (1, 1, 1, 1)
    base.use_nodes = True
    base.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = 0.92
    mesh.materials.append(base)
    attribute = mesh.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
    for polygon, color_index in zip(mesh.polygons, colors):
        for loop in polygon.loop_indices:
            attribute.data[loop].color = palette[color_index]
    obj = bpy.data.objects.new("forest-fern", mesh)
    bpy.context.scene.collection.objects.link(obj)
    path = APP / "public" / "models" / "forest-fern.glb"
    path.parent.mkdir(parents=True, exist_ok=True)
    export_glb(path, 82, "meshopt", vertex_colors=True)
    mesh.calc_loop_triangles()
    dims = obj.dimensions
    stats = {
        "file": "models/forest-fern.glb", "procedural": True,
        "triangles": len(mesh.loop_triangles), "bytes": path.stat().st_size,
        "dimensions_m": {"width": round(dims.x, 3), "height": round(dims.z, 3), "depth": round(dims.y, 3)},
        "pivot": "rosette centre at ground contact", "material_count": 1,
        "fronds": 5, "facet_palette": ["forest shadow", "fern green", "sunlit tips", "deep green"],
    }
    out = APP / "asset-src" / "stats" / "forest-fern.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(stats, indent=2) + "\n")
    print("STATS " + json.dumps(stats))


if __name__ == "__main__":
    build()
