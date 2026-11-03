"""Build one authored, low-poly redwood for the Yosemite style benchmark.

Run from the app directory:
  blender -b --python scripts/blender/build_redwood.py

The model is one ground-pivoted GLB. Faceted root flares, bark ribs and broad
layered boughs are mesh forms, not a stack of stock primitives. The color
variation is authored per face so it stays legible without a texture download.
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


def material(name, color, roughness=0.94):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


class MeshBuilder:
    def __init__(self):
        self.verts, self.faces, self.materials = [], [], []

    def face(self, points, mat):
        start = len(self.verts)
        self.verts.extend(points)
        self.faces.append(tuple(range(start, start + len(points))))
        self.materials.append(mat)

    def tapered_branch(self, start, end, radius0, radius1, mat, sides=6):
        a, b = Vector(start), Vector(end)
        axis = (b - a).normalized()
        ref = Vector((0, 0, 1)) if abs(axis.z) < 0.9 else Vector((0, 1, 0))
        u = axis.cross(ref).normalized()
        v = axis.cross(u).normalized()
        rings = []
        for t, radius in ((0, radius0), (0.52, radius0 * 0.68), (1, radius1)):
            centre = a.lerp(b, t)
            rings.append([
                centre + radius * (u * math.cos(math.tau * i / sides) + v * math.sin(math.tau * i / sides))
                for i in range(sides)
            ])
        for j in range(2):
            for i in range(sides):
                self.face((rings[j][i], rings[j][(i + 1) % sides], rings[j + 1][(i + 1) % sides], rings[j + 1][i]), mat)
        self.face(tuple(reversed(rings[0])), mat)

    def object(self, name, materials):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.verts, [], self.faces)
        mesh.materials.clear()
        # Preserve the authored facet colors as per-corner data. A single
        # material/primitive keeps the tree to one draw call when instanced.
        base = material("redwood_facet_material", (1, 1, 1), 0.94)
        mesh.materials.append(base)
        colors = mesh.color_attributes.new(
            name="Color", type="BYTE_COLOR", domain="CORNER"
        )
        for polygon, index in zip(mesh.polygons, self.materials):
            color = materials[index].diffuse_color
            for loop_index in polygon.loop_indices:
                colors.data[loop_index].color = color
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bark = [
        material("redwood_bark_warm", (0.22, 0.086, 0.043)),
        material("redwood_bark_sunlit", (0.34, 0.145, 0.074)),
        material("redwood_bark_shadow", (0.115, 0.045, 0.027)),
        material("redwood_bark_heart", (0.265, 0.104, 0.05)),
        material("redwood_bark_ridge", (0.40, 0.19, 0.092)),
    ]
    foliage = [
        material("redwood_foliage_shadow", (0.095, 0.15, 0.073)),
        material("redwood_foliage_deep", (0.135, 0.205, 0.088)),
        material("redwood_foliage_sun", (0.205, 0.265, 0.11)),
        material("redwood_foliage_blue", (0.11, 0.19, 0.12)),
        material("redwood_foliage_olive", (0.25, 0.28, 0.12)),
    ]
    mb = MeshBuilder()

    # A gently irregular, vertically ribbed trunk with a broad ground flare.
    sides = 18
    rings = [(0.0, 1.12), (0.18, 1.02), (0.55, 0.77), (1.2, 0.63),
             (2.6, 0.56), (4.8, 0.49), (6.8, 0.40), (8.4, 0.31),
             (9.8, 0.24), (10.8, 0.15), (11.55, 0.025)]
    trunk = []
    for ri, (z, radius) in enumerate(rings):
        row = []
        for i in range(sides):
            a = math.tau * i / sides
            rib = 1 + 0.055 * math.cos(6 * a + 0.3) + 0.018 * math.sin(11 * a + ri * 0.13)
            row.append(Vector((radius * rib * math.cos(a), radius * rib * math.sin(a), z)))
        trunk.append(row)
    for ri in range(len(trunk) - 1):
        for i in range(sides):
            # Keep each bark facet continuous up the trunk; slight adjacent
            # variation reads as vertical grain rather than stacked bands.
            band = (i * 7 + (i // 4)) % len(bark)
            mb.face((trunk[ri][i], trunk[ri][(i + 1) % sides], trunk[ri + 1][(i + 1) % sides], trunk[ri + 1][i]), band)
    mb.face(tuple(reversed(trunk[0])), 2)

    # Eight long buttress ribs join the forest floor to the straight trunk.
    for i in range(8):
        a = math.tau * i / 8 + 0.12
        ca, sa = math.cos(a), math.sin(a)
        tangent = Vector((-sa, ca, 0))
        outer = 2.0 + 0.35 * math.sin(i * 2.4)
        width = 0.42 + 0.08 * math.sin(i * 4.1)
        levels = [(0.035, outer), (0.12, outer * 0.88), (0.55, 1.24), (1.45, 0.73), (2.1, 0.58)]
        prev = first = None
        for z, reach in levels:
            center = Vector((ca * reach, sa * reach, z))
            half = width * (1.0 if z < 0.6 else max(0.18, 1 - (z - 0.6) / 1.7))
            row = [center + tangent * half, center - tangent * half,
                   Vector((ca * 0.46, sa * 0.46, z + 0.08)),
                   Vector((ca * 0.46, sa * 0.46, z - 0.08))]
            if first is None:
                first = row
            if prev:
                color = (i + int(z * 3)) % len(bark)
                mb.face((prev[0], row[0], row[2], prev[2]), color)
                mb.face((prev[3], row[3], row[1], prev[1]), (color + 1) % len(bark))
                mb.face((prev[0], row[0], row[1], prev[1]), (color + 2) % len(bark))
                mb.face((prev[2], row[2], row[3], prev[3]), (color + 3) % len(bark))
            prev = row
        # Close the buried toe and the narrow seam where the rib meets trunk.
        mb.face((first[0], first[1], first[3], first[2]), 2)
        mb.face((prev[1], prev[0], prev[2], prev[3]), 2)

    # A broad, irregular redwood crown. Each whorl has upswept branches and
    # layered needle fans, with the crown tightening naturally toward its tip.
    tiers = 11
    for tier in range(tiers):
        t = tier / (tiers - 1)
        z0 = 6.55 + t * 4.55
        radius = 3.35 * (1 - t) ** 0.82 + 0.18
        count = 8 if tier < 6 else 6
        phase = tier * 1.71
        for arm in range(count):
            a = math.tau * arm / count + phase
            length = radius * (0.86 + 0.14 * math.sin(arm * 3.2 + tier))
            rise = 0.52 + 0.42 * t
            start = (0.34 * math.cos(a), 0.34 * math.sin(a), z0)
            mid = (length * 0.53 * math.cos(a), length * 0.53 * math.sin(a), z0 - 0.24 + rise * 0.34)
            end = (length * math.cos(a), length * math.sin(a), z0 - 0.45 + rise)
            mb.tapered_branch(start, mid, 0.12 * (1 - t * 0.55), 0.066 * (1 - t * 0.4), 1)
            mb.tapered_branch(mid, end, 0.066 * (1 - t * 0.4), 0.018, 2)
            # Individual broad, swept boughs form the tier. Narrow gaps between
            # radial sectors preserve the irregular branch silhouette instead
            # of creating a continuous plate or a perfect foliage cone.
            half = math.pi / count * 0.48
            def sector_point(r, angle, height):
                return Vector((r * math.cos(angle), r * math.sin(angle), height))
            inner_l = sector_point(radius * 0.24, a - half * 0.7, z0 + 0.13)
            inner_r = sector_point(radius * 0.24, a + half * 0.7, z0 + 0.13)
            mid_l = sector_point(radius * 0.65, a - half, z0 + 0.01)
            mid_r = sector_point(radius * 0.65, a + half, z0 + 0.01)
            outer_l = sector_point(length, a - half * 0.76, z0 - 0.38 + 0.16 * t)
            outer_r = sector_point(length, a + half * 0.76, z0 - 0.38 + 0.16 * t)
            hem_l = sector_point(length * 0.76, a - half * 0.68, z0 - 0.64 + 0.2 * t)
            hem_r = sector_point(length * 0.76, a + half * 0.68, z0 - 0.64 + 0.2 * t)
            color = len(bark) + (tier + arm) % len(foliage)
            mb.face((inner_l, mid_l, mid_r, inner_r), color)
            mb.face((mid_l, outer_l, outer_r, mid_r), len(bark) + ((color - len(bark) + 1) % len(foliage)))
            mb.face((outer_l, hem_l, hem_r, outer_r), len(bark) + ((color - len(bark) + 3) % len(foliage)))
            # Five smaller needle sprays emerge along each branch edge.
            for j, q in enumerate((0.22, 0.4, 0.58, 0.76, 0.94)):
                cx = length * q * math.cos(a)
                cy = length * q * math.sin(a)
                cz = z0 - 0.25 + rise * q
                spread = (0.82 * (1 - t * 0.62)) * (1.0 if j < 4 else 0.76)
                down = 0.38 * (1 - t * 0.35)
                tangent = Vector((-math.sin(a), math.cos(a), 0))
                centre = Vector((cx, cy, cz))
                outer = Vector((math.cos(a), math.sin(a), 0))
                # A low-poly, four-plane needle fan: broad at the shoulder,
                # lifted in the middle, then tapered and swept down at its tip.
                top = centre + outer * spread * 0.18 + Vector((0, 0, 0.22 * (1 - t)))
                left = centre - tangent * spread * 0.5 - Vector((0, 0, down * 0.25))
                right = centre + tangent * spread * 0.5 - Vector((0, 0, down * 0.25))
                tip = centre + outer * spread * 0.9 - Vector((0, 0, down))
                inner = centre - outer * spread * 0.2 + Vector((0, 0, 0.08))
                base = len(bark) + (tier + arm + j) % len(foliage)
                mb.face((inner, left, top, right), base)
                mb.face((left, tip, top), len(bark) + ((base - len(bark) + 1) % len(foliage)))
                mb.face((top, tip, right), len(bark) + ((base - len(bark) + 2) % len(foliage)))
                # A second, darker underside creates readable depth between tiers.
                mb.face((inner, right, left), len(bark) + ((base - len(bark) + 3) % len(foliage)))

    # The upper leader and a few sparse, broken crown shoots keep the silhouette
    # asymmetrical instead of ending in a perfect cone.
    mb.tapered_branch((0, 0, 9.8), (0.035, -0.025, 12.15), 0.17, 0.012, 0, 7)
    obj = mb.object("redwood_hero", bark + foliage)
    obj.name = obj.data.name = "redwood-hero"
    # Export with one material-indexed mesh; retain deliberate flat facets.
    path = APP / "public" / "models" / "redwood-hero.glb"
    path.parent.mkdir(parents=True, exist_ok=True)
    export_glb(path, 82, "meshopt", vertex_colors=True)
    obj.data.calc_loop_triangles()
    dims = obj.dimensions
    stats = {"file": "models/redwood-hero.glb", "procedural": True,
             "triangles": len(obj.data.loop_triangles), "bytes": path.stat().st_size,
             "dimensions_m": {"width": round(dims.x, 3), "height": round(dims.z, 3), "depth": round(dims.y, 3)},
             "pivot": "ground contact at trunk centre", "material_count": 1,
             "facet_palette": [m.name for m in bark + foliage]}
    out = APP / "asset-src" / "stats" / "redwood-hero.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(stats, indent=2) + "\n")
    print("STATS " + json.dumps(stats))


if __name__ == "__main__":
    build()
