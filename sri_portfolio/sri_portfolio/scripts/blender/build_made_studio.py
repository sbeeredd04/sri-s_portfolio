"""Original Aether showroom; invoke through node scripts/build-made-studio.mjs.

Blender Z is height, -Y is the facade (Three +Z). Meshes retain palette
attributes, named facade pivots, authored anchors and a single opening clip.
No source artwork, logos, claims, or portfolio text are baked into this asset.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

APP = Path(__file__).resolve().parents[2]
OUT = APP / "public/models/islands/made-aether.glb"
STATS = APP / "asset-src/stats/made-aether.json"
FLOOR, UPPER, ROOF = 0.18, 4.58, 7.78
PALETTE = {
    "sand": "C9AE8C", "sandLight": "D8C3A0", "sage": "9AA88A",
    "concrete": "D8CFC4", "plaster": "F4F1EC", "oak": "D9BE98",
    "oakLight": "DFC9A9", "oakDark": "C4A37B", "joint": "AC957A",
    "graphite": "3A3B3E", "aluminium": "B9B7B2", "glass": "B7CBC8",
    "warmLight": "FFE9C8", "sedum": "7E9346", "sedumShade": "687B3C",
    "leaf": "6E8148", "leafLight": "91A16A", "soil": "66584A",
    "screen": "253A38", "trim": "F1ECE4",
}


def linear_channel(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def color(name):
    h = PALETTE[name]
    return (*[linear_channel(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)], 1)


def palette_material(name, roughness=0.8, metallic=0, alpha=1, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "PaletteColor"
    mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Alpha"].default_value = alpha
    if emission:
        mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission
    if alpha < 1:
        mat.surface_render_method = "DITHERED"
    mat.use_backface_culling = False
    return mat


class Mesh:
    def __init__(self):
        self.vertices, self.faces, self.colors = [], [], []

    def face(self, coords, tone):
        start = len(self.vertices)
        self.vertices.extend(tuple(p) for p in coords)
        self.faces.append(tuple(range(start, len(self.vertices))))
        self.colors.append(color(tone))

    def box(self, center, size, tone):
        x, y, z = center
        a, b, c = [s / 2 for s in size]
        p = [(x + i * a, y + j * b, z + k * c)
             for i, j, k in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
                             (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]]
        for inds in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
                     (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
            self.face([p[i] for i in inds], tone)

    def bevel_box(self, center, size, bevel, tone):
        x, y, z = center
        hx, hy, hz = [s / 2 for s in size]
        r = min(bevel, hx * .45, hy * .45, hz * .45)
        rings = []
        for height, inset in [(-hz, r), (-hz + r, 0), (hz - r, 0), (hz, r)]:
            a, b = hx - inset, hy - inset
            corner = max(.001, r - inset)
            ring = [(x + px, y + py, z + height) for px, py in
                    [(-a + corner, -b), (a - corner, -b), (a, -b + corner),
                     (a, b - corner), (a - corner, b), (-a + corner, b),
                     (-a, b - corner), (-a, -b + corner)]]
            rings.append(ring)
        self.face(list(reversed(rings[0])), tone)
        self.face(rings[-1], tone)
        for a, b in zip(rings, rings[1:]):
            for i in range(8):
                j = (i + 1) % 8
                self.face((a[i], a[j], b[j], b[i]), tone)

    def rod(self, a, b, radius, tone, sides=6):
        a, b = Vector(a), Vector(b)
        axis = (b - a).normalized()
        helper = Vector((0, 0, 1)) if abs(axis.z) < .9 else Vector((0, 1, 0))
        u = axis.cross(helper).normalized()
        v = axis.cross(u).normalized()
        rows = [[p + radius * (u * math.cos(i * math.tau / sides) + v * math.sin(i * math.tau / sides))
                 for i in range(sides)] for p in (a, b)]
        self.face(list(reversed(rows[0])), tone)
        self.face(rows[1], tone)
        for i in range(sides):
            j = (i + 1) % sides
            self.face((rows[0][i], rows[0][j], rows[1][j], rows[1][i]), tone)

    def object(self, name, material, parent):
        data = bpy.data.meshes.new(name)
        data.from_pydata(self.vertices, [], self.faces)
        data.materials.append(material)
        attr = data.color_attributes.new(name="PaletteColor", type="FLOAT_COLOR", domain="CORNER")
        for poly, rgba in zip(data.polygons, self.colors):
            for loop in poly.loop_indices:
                attr.data[loop].color = rgba
        data.color_attributes.active_color = attr
        data.color_attributes.render_color_index = 0
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = parent
        return obj


def empty(name, parent=None, location=(0, 0, 0), **extras):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent, obj.location = parent, location
    for key, value in extras.items():
        obj[key] = value
    return obj


def wall(mesh, limits, origin, horizontal, normal, holes=(), tone="sand", depth=.3):
    """A continuous thick wall with actual apertures and their return faces."""
    u0, u1, z0, z1 = limits
    us = sorted({u0, u1, *[q for h in holes for q in h[:2]]})
    zs = sorted({z0, z1, *[q for h in holes for q in h[2:]]})
    occupied = {}
    for i in range(len(us) - 1):
        for j in range(len(zs) - 1):
            u, z = (us[i] + us[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2
            occupied[i, j] = not any(a < u < b and c < z < d for a, b, c, d in holes)
    def point(u, z, d):
        return Vector(origin) + Vector(horizontal) * u + Vector(normal) * d + Vector((0, 0, z))
    for (i, j), solid in occupied.items():
        if not solid:
            continue
        a, b, c, d = us[i], us[i + 1], zs[j], zs[j + 1]
        front = [point(a, c, depth / 2), point(b, c, depth / 2), point(b, d, depth / 2), point(a, d, depth / 2)]
        back = [point(a, c, -depth / 2), point(b, c, -depth / 2), point(b, d, -depth / 2), point(a, d, -depth / 2)]
        mesh.face(front, tone)
        mesh.face(list(reversed(back)), "plaster")
        for edge, neighbor in [(0, (i, j - 1)), (1, (i + 1, j)), (2, (i, j + 1)), (3, (i - 1, j))]:
            if not occupied.get(neighbor, False):
                k = (edge + 1) % 4
                mesh.face((front[edge], back[edge], back[k], front[k]), "concrete")


def frame(mesh, x0, x1, y, bottom, top, tone="graphite", width=.055):
    for x in (x0 + width / 2, x1 - width / 2):
        mesh.box((x, y, (bottom + top) / 2), (width, .075, top - bottom), tone)
    for z in (bottom + width / 2, top - width / 2):
        mesh.box(((x0 + x1) / 2, y, z), (x1 - x0, .075, width), tone)


def glass_quad(mesh, x0, x1, y, bottom, top):
    mesh.face(((x0, y, bottom), (x1, y, bottom), (x1, y, top), (x0, y, top)), "glass")


def make():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = 30
    scene.frame_start, scene.frame_end = 0, 33
    scene.name = "OpenFacade"
    root = empty("Aether_Root", facadeDirection="+Z", units="metres", floorHeight=FLOOR)
    matte = palette_material("Made_MattePalette")
    metal = palette_material("Made_MetalPalette", .4, .65)
    glass = palette_material("Made_GlassPalette", .13, 0, .24)
    glow = palette_material("Made_WarmLightPalette", .7, 0, 1, .8)
    screen_mat = palette_material("Made_DisplayPlaceholder", .6)
    structure, interior, trim, glazing, roof, lighting = [Mesh() for _ in range(6)]

    # The shell is built as connected wall apertures and deep returns. Upper
    # glazing is inset to form a real, 1.4 m deep balcony within the footprint.
    structure.bevel_box((0, 0, FLOOR / 2), (12, 11, FLOOR), .025, "concrete")
    wall(structure, (-6, 6, FLOOR, UPPER), (0, -5.35, 0), (1, 0, 0), (0, -1, 0),
         [(-4.8, 4.8, FLOOR, FLOOR + 4.2)], depth=.3)
    wall(structure, (-6, 6, UPPER, ROOF), (0, -4.1, 0), (1, 0, 0), (0, -1, 0),
         [(-4.6, -1.1, 5.25, 7.15), (-.95, .95, UPPER, 7.35), (1.1, 4.6, 5.25, 7.15)], "sage")
    for side in (-1, 1):
        wall(structure, (-5.5, 5.5, FLOOR, UPPER), (side * 5.85, 0, 0), (0, side, 0), (side, 0, 0),
             [(-1.4, 2.2, 1.1, 3.55)], "sandLight")
        wall(structure, (-4.1 if side == 1 else -5.5, 5.5 if side == 1 else 4.1, UPPER, ROOF),
             (side * 5.85, 0, 0), (0, side, 0), (side, 0, 0), [(-1.1, 2.1, 5.35, 7.15)], "sand")
    wall(structure, (-6, 6, FLOOR, ROOF), (0, 5.35, 0), (-1, 0, 0), (0, 1, 0),
         [(-4.6, -2.4, 1.3, 3.6), (2.5, 4.6, 1.3, 3.6), (-4.6, 4.6, 5.4, 7.15)], "sandLight")

    # A hollow upper floor leaves a real dogleg stairwell, plus an inset balcony.
    for center, size in [((-1.425, -.15, UPPER - .1), (8.55, 10.7, .2)),
                         ((4.275, -3.3, UPPER - .1), (2.85, 4.4, .2)),
                         ((4.275, 4.45, UPPER - .1), (2.85, 1.5, .2))]:
        structure.box(center, size, "plaster")
    for x in (-5.85, 5.85):
        structure.box((x, -4.8, UPPER + .55), (.3, 1.4, 1.1), "concrete")
    structure.bevel_box((0, 0, ROOF - .1), (12, 11, .2), .018, "concrete")
    for x in (-5.88, 5.88):
        structure.box((x, 0, 8.09), (.24, 11, .62), "sandLight")
    for y in (-5.38, 5.38):
        structure.box((0, y, 8.09), (11.52, .24, .62), "sandLight")
    for z in (4.5, 7.73):
        structure.box((0, -5.43, z), (12, .14, .13), "concrete")
    # Fine shadow reveals at the sand/sage corners and roof coping.
    for x in (-5.72, 5.72):
        trim.box((x, -5.508, 2.25), (.024, .008, 4.12), "joint")
    for x in (-5.86, 5.86):
        structure.bevel_box((x, 0, 8.385), (.28, 11, .03), .008, "concrete")
    for y in (-5.36, 5.36):
        structure.bevel_box((0, y, 8.385), (11.52, .28, .03), .008, "concrete")

    # Ground-floor boards are flush surfaces with physical-sized joints.
    for col in range(51):
        x0 = -5.6 + col * .22
        shift = (col % 3) * .57
        cuts = sorted({-5.14, 5.14, *[max(-5.14, min(5.14, -5.14 + shift + i * 1.8)) for i in range(7)]})
        for row, (a, b) in enumerate(zip(cuts, cuts[1:])):
            if b - a < .03:
                continue
            tone = ["oak", "oakLight", "oakDark", "oak"][((col * 13 + row * 7) % 4)]
            interior.face(((x0 + .003, a + .003, FLOOR + .003), (x0 + .217, a + .003, FLOOR + .003),
                           (x0 + .217, b - .003, FLOOR + .003), (x0 + .003, b - .003, FLOOR + .003)), tone)
    # Skirting and ceiling slots terminate at door/window returns.
    for x in (-5.66, 5.66):
        interior.box((x, 0, FLOOR + .055), (.035, 10.2, .11), "trim")
    interior.box((0, 5.16, FLOOR + .055), (11.3, .035, .11), "trim")
    for x in (-3.5, 0, 2):
        trim.box((x, 0, UPPER - .214), (.075, 5.4, .025), "graphite")
        lighting.box((x, 0, UPPER - .229), (.045, 5.25, .008), "warmLight")

    # Tables and displays leave both side aisles and the entire facade sweep free.
    interior.bevel_box((0, .15, FLOOR + .9), (1.2, 6, .09), .018, "oak")
    for y in (-2.3, 2.6):
        interior.box((0, y, FLOOR + .43), (.84, .12, .86), "oakDark")
        trim.box((0, y, FLOOR + .035), (1.0, .42, .07), "graphite")
    interior.bevel_box((2.0, 2.0, FLOOR + .375), (1.2, 1.2, .75), .018, "plaster")
    for y in (-.8, 1.5):
        interior.bevel_box((-3.8, y, FLOOR + .5), (.9, .9, 1), .016, "plaster")
    interior.bevel_box((-5.15, .2, FLOOR + .43), (.6, 3.5, .09), .018, "oak")
    for y in (-1.1, 1.5):
        trim.box((-5.15, y, FLOOR + .205), (.48, .055, .41), "graphite")
    # No baked project artwork: this exact named plane is replaced at runtime.
    screen = Mesh()
    screen.face(((-1.6, 5.125, 1.55), (1.6, 5.125, 1.55), (1.6, 5.125, 3.35), (-1.6, 5.125, 3.35)), "screen")
    screen_obj = screen.object("Aether_DisplayScreen", screen_mat, root)
    uv = screen_obj.data.uv_layers.new(name="UVMap")
    for loop, coord in zip(uv.data, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop.uv = coord
    trim.bevel_box((0, 5.15, 2.45), (3.26, .035, 1.86), .008, "graphite")

    # Real two-flight stairs; 26 risers, 1.05 m wide, with a landing and guards.
    rise = (UPPER - FLOOR) / 26
    for flight, x in enumerate((3.45, 4.65)):
        for step in range(13):
            y = -1.12 + (step + .5) * .26 if flight == 0 else 2.26 - (step + .5) * .26
            top = FLOOR + (step + 1 + flight * 13) * rise
            interior.box((x, y, top - .055), (1.05, .263, .11), "oakDark")
            trim.box((x, y - .12 if flight == 0 else y + .12, top - .012), (1.05, .018, .024), "graphite")
        z0 = FLOOR if flight == 0 else FLOOR + 13 * rise
        z1 = FLOOR + 13 * rise if flight == 0 else UPPER
        ya, yb = (-1.12, 2.26) if flight == 0 else (2.26, -1.12)
        for side in (-.48, .48):
            trim.rod((x + side, ya, z0 - .06), (x + side, yb, z1 - .06), .055, "graphite")
        for railx in (x - .53, x + .53):
            trim.rod((railx, ya, z0 + 1.05), (railx, yb, z1 + 1.05), .024, "graphite")
            for q in (0, .33, .66, 1):
                yp, zp = ya + (yb - ya) * q, z0 + (z1 - z0) * q
                trim.rod((railx, yp, zp), (railx, yp, zp + 1.05), .018, "graphite")
    interior.box((4.05, 2.86, FLOOR + 13 * rise - .06), (2.3, 1.2, .12), "oakDark")
    for y in (-1.32, 3.51):
        trim.rod((2.86, y, UPPER), (2.86, y, UPPER + 1.05), .023, "graphite")
    trim.rod((2.86, -1.32, UPPER + 1.05), (2.86, 3.51, UPPER + 1.05), .023, "graphite")
    glazing.face(((2.86, -1.32, UPPER + .09), (2.86, 3.51, UPPER + .09),
                  (2.86, 3.51, UPPER + .98), (2.86, -1.32, UPPER + .98)), "glass")
    for y, a, b in [(-1.1, 2.86, 4.08), (3.7, 2.86, 5.65)]:
        for x in (a, b):
            trim.rod((x, y, UPPER), (x, y, UPPER + 1.05), .023, "graphite")
        trim.rod((a, y, UPPER + 1.05), (b, y, UPPER + 1.05), .023, "graphite")
        glass_quad(glazing, a, b, y, UPPER + .09, UPPER + .98)

    # Upper glazing and balcony rails use thin, consistent mullion sections.
    for a, b, low, high in [(-4.6, -1.1, 5.25, 7.15), (-.95, .95, UPPER, 7.35), (1.1, 4.6, 5.25, 7.15)]:
        frame(trim, a, b, -4.075, low, high)
        glass_quad(glazing, a + .055, b - .055, -4.075, low + .055, high - .055)
        trim.box(((a + b) / 2, -4.075, (low + high) / 2), (.035, .07, high - low), "graphite")
    for x in (-5.6, -4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2, 5.6):
        trim.rod((x, -5.35, UPPER), (x, -5.35, UPPER + 1.1), .018, "graphite")
    trim.rod((-5.7, -5.35, UPPER + 1.1), (5.7, -5.35, UPPER + 1.1), .025, "graphite")
    glass_quad(glazing, -5.7, 5.7, -5.35, UPPER + .08, UPPER + 1.03)
    # Side and rear windows: metal perimeter, deep wall reveals, real glazing.
    for side in (-1, 1):
        for low, high, a, b in [(1.1, 3.55, -1.4, 2.2), (5.35, 7.15, -1.1, 2.1)]:
            x = side * 5.85
            for y in (side * a, side * b):
                trim.box((x, y, (low + high) / 2), (.075, .05, high - low), "graphite")
            for z in (low, high):
                trim.box((x, side * (a + b) / 2, z), (.075, b - a, .05), "graphite")
            glazing.face(((x, side * a, low), (x, side * b, low), (x, side * b, high), (x, side * a, high)), "glass")
    for a, b, low, high in [(-4.6, -2.4, 1.3, 3.6), (2.5, 4.6, 1.3, 3.6), (-4.6, 4.6, 5.4, 7.15)]:
        frame(trim, -b, -a, 5.35, low, high)
        glass_quad(glazing, -b + .055, -a - .055, 5.35, low + .055, high - .055)

    # One low-poly broadleaf specimen and a coherent roof service/planting kit.
    interior.rod((-4.65, 3.75, FLOOR), (-4.65, 3.75, FLOOR + .4), .28, "concrete", 10)
    interior.rod((-4.65, 3.75, FLOOR + .38), (-4.65, 3.75, FLOOR + 1.65), .025, "oakDark")
    for i in range(11):
        angle, h = i * 2.39996, FLOOR + .68 + i * .096
        start = Vector((-4.65, 3.75, h))
        direction = Vector((math.cos(angle), math.sin(angle), .22))
        tip = start + direction * (.35 + .09 * math.sin(i))
        wing = Vector((-direction.y, direction.x, 0)) * .13
        center = start.lerp(tip, .57) + Vector((0, 0, .08))
        interior.face((start, center + wing, tip, center), "leafLight" if i % 3 == 0 else "leaf")
        interior.face((start, center, tip, center - wing), "leaf")
    for x in (-3.3, .2):
        roof.bevel_box((x, 1.7, ROOF + .055), (2.7, 5.4, .11), .018, "graphite")
        roof.box((x, 1.7, ROOF + .12), (2.52, 5.22, .035), "soil")
        for i in range(12):
            px = x - .9 + (i % 3) * .87
            py = -.25 + (i // 3) * 1.25
            roof.bevel_box((px, py, ROOF + .19), (.86, 1.12, .12), .045, "sedum" if i % 3 else "sedumShade")
    for x in (3.1, 4.8):
        roof.bevel_box((x, 3.6, ROOF + .31), (1.4, 1.0, .62), .035, "aluminium")
        for j in range(7):
            trim.box((x - .48 + j * .16, 3.085, ROOF + .31), (.045, .018, .4), "graphite")
        trim.rod((x, 3.6, ROOF + .615), (x, 3.6, ROOF + .62), .31, "graphite", 12)
    roof.bevel_box((4.25, -.7, ROOF + .08), (1.1, 1.7, .16), .025, "graphite")
    trim.rod((4.6, -.7, ROOF + .18), (4.6, -.1, ROOF + .18), .018, "aluminium")

    for mesh, name, material in [(structure, "Aether_Architecture", matte), (interior, "Aether_Interior", matte),
                                 (trim, "Aether_MetalDetails", metal), (glazing, "Aether_FixedGlazing", glass),
                                 (roof, "Aether_RoofKit", matte), (lighting, "Aether_CeilingLights", glow)]:
        mesh.object(name, material, root)

    # The two articulated pairs fold inward into 0.4 m stacks at the jambs.
    door_names = []
    for side, label in [(-1, "L"), (1, "R")]:
        sign = -side
        outer = empty(f"Aether_Door_{label}Outer", root, (side * 4.8, -5.3, FLOOR), role="facadePivot")
        inner = empty(f"Aether_Door_{label}Inner", outer, (sign * 2.4, 0, 0), role="facadePivot")
        for hinge, tag in [(outer, "Outer"), (inner, "Inner")]:
            panel, pane = Mesh(), Mesh()
            a, b = sorted((0, sign * 2.4))
            frame(panel, a, b, 0, 0, 4.2, width=.055)
            glass_quad(pane, a + .055, b - .055, 0, .055, 4.145)
            for h in (.22, 2.1, 3.98):
                panel.rod((0, .045, h - .05), (0, .045, h + .05), .025, "aluminium", 8)
            if tag == "Inner":
                hx = sign * 2.28
                panel.rod((hx, -.055, 1.05), (hx, -.055, 1.45), .017, "aluminium", 8)
            panel.object(f"Aether_Panel_{label}{tag}_Frame", metal, hinge)
            pane.object(f"Aether_Panel_{label}{tag}_Glass", glass, hinge)
        for hinge, degrees in [(outer, sign * 86), (inner, -sign * 172)]:
            door_names.append(hinge.name)
            for i in range(34):
                t = i / 33
                eased = 4 * t ** 3 if t < .5 else 1 - ((-2 * t + 2) ** 3) / 2
                hinge.rotation_euler.z = math.radians(degrees) * eased
                hinge.keyframe_insert(data_path="rotation_euler", frame=i)
        # Full width top-hung track is static and belongs to the lintel.
    track = Mesh()
    track.box((0, -5.3, FLOOR + 4.25), (9.75, .17, .1), "graphite")
    track.object("Aether_FacadeTrack", metal, root)

    anchors = {
        "Aether_EntryAnchor": [0, FLOOR, 5.65],
        "Aether_ThresholdAnchor": [0, FLOOR, 5.3],
        "Aether_InsideCameraAnchor": [1.65, FLOOR + 1.65, 1.8],
        "Aether_HeroAnchor": [2.0, FLOOR + .75, -2.0],
        "Aether_DisplayAnchor": [0, 2.45, -5.122],
        "Aether_UpperLandingAnchor": [4.65, UPPER, 1.2],
    }
    for name, (x, y, z) in anchors.items():
        empty(name, root, (x, -z, y), role="runtimeAnchor")
    root["doorDurationSeconds"] = 1.1
    root["doorClip"] = "OpenFacade"
    root["facadeOpeningMetres"] = [9.6, 4.2]
    scene.frame_set(0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    options = dict(filepath=str(OUT), export_format="GLB", export_yup=True,
                   export_apply=False, export_vertex_color="ACTIVE", export_all_vertex_colors=True,
                   export_active_vertex_color_when_no_material=True, export_normals=True,
                   export_texcoords=True, export_attributes=True, export_extras=True,
                   export_animations=True, export_animation_mode="ACTIVE_ACTIONS",
                   export_nla_strips_merged_animation_name="OpenFacade", export_force_sampling=True,
                   export_frame_range=True, export_optimize_animation_size=True,
                   export_cameras=False, export_lights=False, export_skins=False,
                   export_morph=False, export_meshopt_compression_enable=True,
                   export_meshopt_extension="EXT_meshopt_compression")
    supported = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    bpy.ops.export_scene.gltf(**{k: v for k, v in options.items() if k in supported})
    stats = {"asset": "models/islands/made-aether.glb", "source": "Original authored geometry; WORLD-SPEC-FULL.md §3.2 design data",
             "facadeFacing": "+Z", "units": "metres", "paletteHex": PALETTE,
             "floorHeight": FLOOR, "upperFloorHeight": UPPER, "roofHeight": ROOF,
             "anchors": anchors, "doorPivots": door_names, "doorClip": "OpenFacade", "doorDurationSeconds": 1.1,
             "displaySurface": {"node": "Aether_DisplayScreen", "size": [3.2, 1.8], "normal": "+Z", "uv": "0..1"},
             "heroSurface": {"size": [1.2, 1.2], "top": [2, FLOOR + .75, -2]},
             "knownLimitations": ["Project sculpture/content is supplied separately by the runtime.",
                                  "Building floor is 0.18m above the asset ground pivot; site paving must meet the threshold.",
                                  "Door motion folds inward; the reserved swing zones must remain clear.",
                                  "Upper floor is a secondary architectural glimpse; no authored portfolio content is placed there.",
                                  "No textures, logos, copied reference pixels, or baked lighting.",
                                  "Browser/material and physical-device acceptance belongs to integration QA."]}
    STATS.parent.mkdir(parents=True, exist_ok=True)
    STATS.write_text(json.dumps(stats, indent=2) + "\n")
    print("MADE_AETHER_EXPORTED", str(OUT), OUT.stat().st_size)


if __name__ == "__main__":
    make()
