"""Original bounded Made campus, Three metres. Aether is a reserved external asset.
Build via scripts/build-made-campus.mjs. All motion/interior content is dormant.
"""

from __future__ import annotations
import json, math, random, importlib.util
from pathlib import Path
import bpy
from mathutils import Vector

APP = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "made_mesh_readonly", Path(__file__).with_name("build_made_studio.py")
)
kit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kit)
Mesh, empty, wall, frame, glass_quad = (
    kit.Mesh,
    kit.empty,
    kit.wall,
    kit.frame,
    kit.glass_quad,
)
kit.PALETTE.update(
    {
        "plinth": "CFC5B8",
        "seawall": "BDB2A6",
        "limestone": "D9CDBB",
        "set": "CFC0A8",
        "promenade": "C9C0B4",
        "corten": "9C5A3C",
        "terracotta": "C0673F",
        "timber": "A97852",
        "shingle": "7E5A3E",
        "lavender": "8C78B8",
        "rock": "A08E80",
        "rockWarm": "AA998A",
        "rockShade": "968577",
        "darkLeaf": "6F7D44",
        "waterline": "8C9E9A",
        "leaf": "7B8858",
        "leafLight": "83915F",
    }
)
OUT = APP / "public/models/islands/made-campus.glb"
SOURCE = APP / "asset-src/authored/made-campus/made-campus.blend"
STATS = APP / "asset-src/stats/made-campus.json"
L = 2.2
random.seed(28)
ANCHORS = {}
FOOTPRINTS = []
PATHS = []
STUDIOS = []


def xyz(p):
    return (p[0], -p[2], p[1])


def group(name, p=(0, 0, 0), yaw=0, **extras):
    o = empty(name, ROOT, xyz(p), **extras)
    o.rotation_euler.z = yaw
    return o


def anchor(name, p, parent=None, local=False, **extras):
    o = empty(name, parent or ROOT, xyz(p), role="runtimeAnchor", **extras)
    if not local:
        ANCHORS[name] = list(p)
    return o


def polyrect(cx, cz, w, d, yaw=0):
    c, s = math.cos(yaw), math.sin(yaw)
    return [
        [round(cx + x * c + z * s, 5), round(cz - x * s + z * c, 5)]
        for x, z in [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]
    ]


def obstacle(name, poly, kind="building", y=(L, L + 1)):
    FOOTPRINTS.append(dict(name=name, polygon=poly, kind=kind, height=list(y)))


def meshobj(m, name, parent=None, mat=None):
    return m.object(name, mat or MAT, parent or ROOT)


def atbox(m, p, size, tone):
    m.box(xyz(p), (size[0], size[2], size[1]), tone)


def atrod(m, a, b, r, tone, sides=8):
    m.rod(xyz(a), xyz(b), r, tone, sides)


def route(name, points, width, tone="promenade", height=L + 0.012, owner=None):
    # Quadratic corner fillets form real continuous curved ribbons. Every exported
    # triangulated trapezoid is carried into the full-width clearance audit.
    # Millimetre offsets at overlapping junctions prevent coplanar z-fighting.
    if height == L + 0.012:
        height += 0.0022 * len(PATHS)
    smooth = [Vector(points[0])]
    for i in range(1, len(points) - 1):
        a, b, c = map(Vector, (points[i - 1], points[i], points[i + 1]))
        left = a - b
        right = c - b
        r = min(max(1.8, width * 1.2), left.length * 0.22, right.length * 0.22)
        p = b + left.normalized() * r
        q = b + right.normalized() * r
        smooth.append(p)
        for j in range(1, 7):
            t = j / 6
            smooth.append((1 - t) ** 2 * p + 2 * (1 - t) * t * b + t * t * q)
    smooth.append(Vector(points[-1]))
    m = Mesh()
    polys = []
    distance = [0]
    for a, b in zip(smooth, smooth[1:]):
        distance.append(distance[-1] + (b - a).length)
    edges = []
    for i, p in enumerate(smooth):
        tangent = (
            smooth[min(i + 1, len(smooth) - 1)] - smooth[max(0, i - 1)]
        ).normalized()
        n = Vector((-tangent.y, tangent.x)) * width / 2
        y = height
        if owner and name.endswith("_Approach"):
            y = height + (L + 0.013 - height) * distance[i] / distance[-1]
        edges.append((p + n, p - n, y))
    for a, b in zip(edges, edges[1:]):
        poly = [list(a[0]), list(a[1]), list(b[1]), list(b[0])]
        polys.append(poly)
        coords = [
            xyz((a[0].x, a[2], a[0].y)),
            xyz((a[1].x, a[2], a[1].y)),
            xyz((b[1].x, b[2], b[1].y)),
            xyz((b[0].x, b[2], b[0].y)),
        ]
        m.face((coords[0], coords[2], coords[1]), tone)
        m.face((coords[0], coords[3], coords[2]), tone)
        if owner and height > L + 0.025:
            for i, j in ((0, 3), (2, 1)):
                ca, cb = coords[i], coords[j]
                m.face((ca, (ca[0], ca[1], L), (cb[0], cb[1], L), cb), "concrete")
    meshobj(m, name)
    PATHS.append(
        dict(
            name=name,
            width=width,
            segments=polys,
            owner=owner,
            geometry="continuous triangulated ribbon; quadratic corner fillets",
        )
    )


def rail(m, a, b, h=1.05, tone="timber", spacing=1.7):
    a, b = Vector(a), Vector(b)
    n = max(1, math.ceil((b - a).length / spacing))
    for i in range(n + 1):
        p = a.lerp(b, i / n)
        atrod(m, p, p + Vector((0, h, 0)), 0.035, "graphite", 6)
    for up in (0.45, h):
        atrod(
            m,
            a + Vector((0, up, 0)),
            b + Vector((0, up, 0)),
            0.045 if up == h else 0.018,
            tone,
            6,
        )


def lamp(name, x, z, height=4.2):
    m = Mesh()
    atbox(m, (x, L + 0.05, z), (0.3, 0.1, 0.3), "graphite")
    atrod(m, (x, L + 0.1, z), (x, L + height - 0.22, z), 0.048, "graphite")
    atbox(m, (x, L + height - 0.18, z), (0.25, 0.32, 0.25), "warmLight")
    atbox(m, (x, L + height + 0.01, z), (0.34, 0.06, 0.34), "graphite")
    meshobj(m, name)


def bench(name, x, z, yaw=0):
    g = group(name, (x, L, z), yaw)
    m = Mesh()
    for y in (-0.18, 0, 0.18):
        m.bevel_box((0, y, 0.47), (1.8, 0.15, 0.07), 0.018, "timber")
    for h in (0.72, 0.92):
        m.box((0, 0.30, h), (1.8, 0.065, 0.13), "timber")
    for x1 in (-0.65, 0.65):
        for y1 in (-0.2, 0.24):
            m.rod((x1, y1, 0.04), (x1, y1, 0.45), 0.028, "graphite")
        m.rod((x1, 0.25, 0.4), (x1, 0.31, 1.0), 0.022, "graphite")
    meshobj(m, name + "_Slats", g)
    obstacle(name, polyrect(x, z, 1.9, 0.7, yaw), "seat", (L, L + 1.05))


def olive(name, x, z, height=4.5, r=1.2):
    m = Mesh()
    base = L
    m.rod((x, -z, base), (x, -z, base + 0.65), r, "concrete", 12)
    m.rod((x, -z, base + 0.65), (x, -z, base + 0.67), r * 0.86, "soil", 12)
    m.rod((x, -z, base + 0.67), (x + 0.12, -z, base + height - 0.8), 0.12, "timber", 7)
    for i in range(5):
        angle = i * math.tau / 5 + 0.3
        px = x + math.cos(angle) * 0.75
        py = -z + math.sin(angle) * 0.75
        pz = base + height - 0.8 + (i % 2) * 0.35
        m.rod((x, -z, base + height * 0.48), (px, py, pz), 0.055, "timber", 6)
        # Irregular low-poly leaf volumes, not smooth spherical crowns.
        rings = []
        for zz, rad in [(-0.65, 0.4), (-0.25, 0.95), (0.35, 0.8), (0.65, 0.3)]:
            rings.append(
                [
                    (
                        px + math.cos(j * math.tau / 7) * rad,
                        py + math.sin(j * math.tau / 7) * rad,
                        pz + zz,
                    )
                    for j in range(7)
                ]
            )
        m.face(list(reversed(rings[0])), "leaf")
        for aa, bb in zip(rings, rings[1:]):
            for j in range(7):
                m.face(
                    (aa[j], aa[(j + 1) % 7], bb[(j + 1) % 7], bb[j]),
                    "leafLight" if (i + j) % 4 == 0 else "leaf",
                )
        m.face(rings[-1], "leafLight")
    meshobj(m, name)
    obstacle(name, polyrect(x, z, r * 2, r * 2), "planter", (L, L + 0.68))


def lavender(name, x, z, w=2.4, d=0.7):
    m = Mesh()
    atbox(m, (x, L + 0.18, z), (w, 0.36, d), "concrete")
    atbox(m, (x, L + 0.37, z), (w - 0.14, 0.03, d - 0.14), "soil")
    for i in range(max(3, int(w * 5))):
        px = x - w * 0.43 + (i % max(1, int(w * 5))) * 0.2
        pz = z + (-0.14 if i % 2 else 0.14)
        for j in range(3):
            tx = px + (j - 1) * 0.07
            top = L + 0.74 + ((i + j) % 3) * 0.055
            atrod(m, (px, L + 0.38, pz), (tx, top, pz + 0.04), 0.018, "darkLeaf", 4)
            atrod(
                m,
                (tx, top - 0.12, pz + 0.04),
                (tx, top, pz + 0.04),
                0.043,
                "lavender",
                5,
            )
    meshobj(m, name)
    obstacle(name, polyrect(x, z, w, d), "planter", (L, L + 0.9))


def studio(name, ident, cx, cz, w, d, h, yaw, tone, kind):
    g = group(
        name + "_Root",
        (cx, L, cz),
        yaw,
        stopId=ident,
        facadeType=kind,
        interiorStatus="blank anchor shell",
        facadeDirection="+Z",
    )
    s, t, gl, roof = Mesh(), Mesh(), Mesh(), Mesh()
    f = 0.18
    roofz = h - 0.6
    upper = 4.65
    openw = min(9.6, w - 2.4)
    s.bevel_box((0, 0, 0.09), (w, d, 0.18), 0.025, "concrete")
    if ident == "world":
        for xx in (-w / 2 + 0.22, w / 2 - 0.22):
            for yy in (-d / 2 + 0.22, d / 2 - 0.22):
                s.box((xx, yy, (roofz + f) / 2), (0.44, 0.44, roofz - f), "concrete")
        for yy in (-d / 2 + 0.08, d / 2 - 0.08):
            for k in range(5):
                a = -w / 2 + 0.44 + k * (w - 0.88) / 5
                b = -w / 2 + 0.44 + (k + 1) * (w - 0.88) / 5
                frame(t, a, b, yy, f, roofz)
                glass_quad(gl, a + 0.055, b - 0.055, yy, f + 0.055, roofz - 0.055)
        for side in (-1, 1):
            gl.face(
                (
                    (side * (w / 2 - 0.08), -d / 2 + 0.44, f),
                    (side * (w / 2 - 0.08), d / 2 - 0.44, f),
                    (side * (w / 2 - 0.08), d / 2 - 0.44, roofz),
                    (side * (w / 2 - 0.08), -d / 2 + 0.44, roofz),
                ),
                "glass",
            )
    else:
        wall(
            s,
            (-w / 2, w / 2, f, roofz),
            (0, -d / 2 + 0.18, 0),
            (1, 0, 0),
            (0, -1, 0),
            [
                (-openw / 2, openw / 2, f, 4.38),
                (-w / 2 + 1.1, w / 2 - 1.1, 5.25, roofz - 0.7),
            ]
            if h > 7.6
            else [(-openw / 2, w / 2 if ident == "csdna" else openw / 2, f, 4.38)],
            tone,
            depth=0.36,
        )
        wall(
            s,
            (-w / 2, w / 2, f, roofz),
            (0, d / 2 - 0.18, 0),
            (-1, 0, 0),
            (0, 1, 0),
            [(-w / 2 + 1.3, w / 2 - 1.3, 1.4, 3.5)],
            "sandLight",
            depth=0.36,
        )
        for side in (-1, 1):
            wall(
                s,
                (-d / 2, d / 2, f, roofz),
                (side * (w / 2 - 0.18), 0, 0),
                (0, side, 0),
                (side, 0, 0),
                (
                    [
                        (-d / 2 + 1.2, d / 2 - 1.2, 1.3, 3.6),
                        (-d / 2 + 1.4, d / 2 - 1.4, 5.25, roofz - 0.7),
                    ]
                    if h > 7.6
                    else (
                        [(-d / 2, d / 2 - 1.2, f, 4.38)]
                        if ident == "csdna" and side == 1
                        else [(-d / 2 + 1.2, d / 2 - 1.2, 1.3, 3.6)]
                    )
                ),
                "sandLight" if side < 0 else "sand",
                depth=0.36,
            )
            # Side glazing is inset from outer plaster face, revealing wall depth.
            x = side * (w / 2 - 0.22)
            gl.face(
                (
                    (x, -d / 2 + 1.2, 1.3),
                    (x, d / 2 - 1.2, 1.3),
                    (x, d / 2 - 1.2, 3.6),
                    (x, -d / 2 + 1.2, 3.6),
                ),
                "glass",
            )
            for k in range(1, 5):
                t.box(
                    (x, -d / 2 + 1.2 + k * (d - 2.4) / 5, 2.45),
                    (0.06, 0.055, 2.3),
                    "graphite",
                )
            if h > 7.6:
                gl.face(
                    (
                        (x, -d / 2 + 1.4, 5.25),
                        (x, d / 2 - 1.4, 5.25),
                        (x, d / 2 - 1.4, roofz - 0.7),
                        (x, -d / 2 + 1.4, roofz - 0.7),
                    ),
                    "glass",
                )
                for k in range(1, 5):
                    t.box(
                        (x, -d / 2 + 1.4 + k * (d - 2.8) / 5, (5.25 + roofz - 0.7) / 2),
                        (0.06, 0.055, roofz - 5.95),
                        "graphite",
                    )
        if h > 7.6:
            frame(t, -w / 2 + 1.1, w / 2 - 1.1, -d / 2 + 0.22, 5.25, roofz - 0.7)
            glass_quad(
                gl, -w / 2 + 1.16, w / 2 - 1.16, -d / 2 + 0.22, 5.31, roofz - 0.76
            )
            for xx in range(-4, 5, 2):
                t.box(
                    (xx, -d / 2 + 0.21, (5.25 + roofz - 0.7) / 2),
                    (0.055, 0.09, roofz - 5.95),
                    "graphite",
                )
            s.box((0, 0, upper - 0.12), (w - 0.72, d - 0.72, 0.24), "plaster")
        count = 7 if kind == "C" else 4
        for k in range(count):
            a = -openw / 2 + openw * k / count
            b = -openw / 2 + openw * (k + 1) / count
            frame(t, a, b, -d / 2 + 0.21, f, 4.38)
            glass_quad(gl, a + 0.055, b - 0.055, -d / 2 + 0.21, f + 0.055, 4.325)
        if kind == "B":
            for zz in (1.58, 2.98):
                t.box((0, -d / 2 + 0.18, zz), (openw, 0.08, 0.05), "aluminium")
        if ident == "agentex":
            for xx in (-w / 2 + 0.65, w / 2 - 0.65):
                s.box((xx, -d / 2 - 0.025, 2.3), (0.65, 0.12, 4.1), "corten")
            s.box((0, -d / 2 + 0.12, 4.65), (w, 0.45, 0.38), "corten")
        if ident == "mesa":
            s.bevel_box((0, -d / 2 - 0.15, 4.64), (w, 0.6, 0.36), 0.025, "terracotta")
        if ident == "soda":
            for zz in (4.55, 7.8):
                s.box((0, -d / 2 - 0.03, zz), (w, 0.32, 0.27), "concrete")
        if ident == "csdna":
            # The south-west corner is genuinely open in the structural shell.
            # Glass wraps the corner and bears on a slender metal corner mullion.
            x = w / 2 - 0.22
            gl.face(
                (
                    (x, -d / 2 + 0.20, f),
                    (x, d / 2 - 1.2, f),
                    (x, d / 2 - 1.2, 4.38),
                    (x, -d / 2 + 0.20, 4.38),
                ),
                "glass",
            )
            glass_quad(gl, openw / 2, w / 2 - 0.18, -d / 2 + 0.21, f, 4.38)
            t.box((w / 2 - 0.18, -d / 2 + 0.18, 2.28), (0.065, 0.065, 4.2), "aluminium")
            for yy in (-d / 2 + 0.2, -2, 1, d / 2 - 1.2):
                t.box((x, yy, 2.28), (0.06, 0.055, 4.2), "graphite")
    s.bevel_box((0, 0, roofz - 0.1), (w, d, 0.2), 0.018, "concrete")
    for xx in (-w / 2 + 0.12, w / 2 - 0.12):
        s.box((xx, 0, h - 0.3), (0.24, d, 0.6), "sandLight")
    for yy in (-d / 2 + 0.12, d / 2 - 0.12):
        s.box((0, yy, h - 0.3), (w - 0.48, 0.24, 0.6), "sandLight")
    for xx in (-w / 2 + 0.12, w / 2 - 0.12):
        s.bevel_box((xx, 0, h + 0.015), (0.29, d, 0.04), 0.01, "concrete")
    for yy in (-d / 2 + 0.12, d / 2 - 0.12):
        s.bevel_box((0, yy, h + 0.015), (w - 0.48, 0.29, 0.04), 0.01, "concrete")
    for xx in (-w * 0.22, w * 0.13):
        roof.box((xx, 0.3, roofz + 0.08), (w * 0.25, d * 0.65, 0.16), "graphite")
        for k in range(6):
            roof.bevel_box(
                (xx, 0.3 - d * 0.25 + k * d * 0.1, roofz + 0.21),
                (w * 0.23, d * 0.095, 0.18),
                0.03,
                "sedum" if k % 2 else "sedumShade",
            )
    roof.bevel_box((w * 0.32, d * 0.3, roofz + 0.4), (1.4, 1, 0.8), 0.035, "plinth")
    for k in range(6):
        t.box(
            (w * 0.32 - 0.48 + k * 0.19, d * 0.3 - 0.508, roofz + 0.4),
            (0.07, 0.018, 0.48),
            "graphite",
        )
    roof.box((w * 0.32, -d * 0.13, roofz + 0.08), (1.1, 1.6, 0.16), "graphite")
    for m, suffix, mat in [
        (s, "Architecture", MAT),
        (t, "MetalDetails", METAL),
        (gl, "Glazing", GLASS),
        (roof, "SedumHVAC", MAT),
    ]:
        meshobj(m, name + "_" + suffix, g, mat)

    # The one numeral and quiet door etch are purposeful studio orientation.
    def lettering(label, text, x, y, z, size, tone, depth=0):
        curve = bpy.data.curves.new(label, "FONT")
        curve.body = text
        curve.size = size
        curve.extrude = depth
        curve.resolution_u = 3
        o = bpy.data.objects.new(label, curve)
        bpy.context.scene.collection.objects.link(o)
        o.parent = g
        o.location = (x, y, z)
        o.rotation_euler.x = math.pi / 2
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.convert(target="MESH")
        o.select_set(False)
        data = o.data
        data.materials.append(METAL if depth else MAT)
        attr = data.color_attributes.new(
            name="PaletteColor", type="FLOAT_COLOR", domain="CORNER"
        )
        for a in attr.data:
            a.color = kit.color(tone)
        data.color_attributes.active_color = attr
        data.color_attributes.render_color_index = 0

    numeral = {
        "agentex": "2",
        "gitcue": "3",
        "mesa": "4",
        "csdna": "5",
        "soda": "6",
        "world": "7",
    }[ident]
    lettering(
        name + "_StudioNumeral",
        numeral,
        -w / 2 + 0.28,
        -d / 2 - 0.015,
        3.2,
        0.6,
        "aluminium",
        0.006,
    )
    lettering(
        name + "_DoorEtch",
        name if ident != "world" else "This world",
        -0.8,
        -d / 2 + 0.15,
        1.52,
        0.18,
        "trim",
    )
    # No fake hero objects, furnished interior or working motion.
    for suffix, p in [
        ("Threshold", (0, 0.18, d / 2 - 0.18)),
        ("EntryCamera", (0, 1.83, d / 2 + 4)),
        ("Interior", (0, 1.83, d / 2 - 3.5)),
        ("Hero", (1.5, 0.93, -1)),
        ("Display", (0, 2.45, -d / 2 + 0.4)),
    ]:
        anchor(name + "_" + suffix + "Anchor", p, g, True)
    # Door approach shares the exact facade transform and rendered extent.
    c, ss = math.cos(yaw), math.sin(yaw)

    def p(xx, zz):
        return [cx + xx * c + zz * ss, cz - xx * ss + zz * c]

    route(
        name + "_Approach",
        [p(0, d / 2), p(0, d / 2 + (4.7 if ident == "soda" else 4))],
        max(3.2, openw * 0.52),
        "limestone",
        L + 0.185,
        ident,
    )
    obstacle(ident, polyrect(cx, cz, w, d, yaw), "building", (L, L + h + 0.04))
    STUDIOS.append(
        dict(
            id=ident,
            name=name,
            center=[cx, L, cz],
            yaw=yaw,
            size=[w, h, d],
            facadeType=kind,
            opening=[openw, 4.2],
            anchorsLocalThree={
                "threshold": [0, 0.18, d / 2 - 0.18],
                "entryCamera": [0, 1.83, d / 2 + 4],
                "inside": [0, 1.83, d / 2 - 3.5],
            },
            interior="blank",
            motion="dormant",
        )
    )


def plinth():
    outline = [
        [-47.5, -32],
        [-42, -40],
        [37, -40],
        [47.5, -31],
        [47.5, 28],
        [39, 40],
        [-40, 40],
        [-47.5, 33],
    ]
    m = Mesh()
    m.face([xyz((x, L, z)) for x, z in reversed(outline)], "plinth")

    def setback(i, amount):
        p = Vector(outline[i])
        a = p - Vector(outline[(i - 1) % len(outline)])
        b = Vector(outline[(i + 1) % len(outline)]) - p
        n = Vector((-a.y, a.x)).normalized()
        other = Vector((-b.y, b.x)).normalized()
        bis = (n + other).normalized()
        return p + bis * (amount / n.dot(bis))

    profile = [
        (-0.65, 0.26, "waterline"),
        (0.25, 0.21, "seawall"),
        (1.25, 0.16, "seawall"),
        (1.99, 0.13, "concrete"),
        (2.05, 0, "concrete"),
        (L, 0, "plinth"),
    ]
    for i, _ in enumerate(outline):
        j = (i + 1) % len(outline)
        for (ya, da, tone), (yb, db, _) in zip(profile, profile[1:]):
            a, b, c, d = setback(i, da), setback(j, da), setback(j, db), setback(i, db)
            m.face(
                [
                    xyz((a.x, ya, a.y)),
                    xyz((d.x, yb, d.y)),
                    xyz((c.x, yb, c.y)),
                    xyz((b.x, ya, b.y)),
                ],
                tone,
            )
        # The coping projects; fine dressed-stone joints follow the battered wall.
        n = max(1, int(math.dist(outline[i], outline[j]) / 3.6))
        for k in range(1, n):
            f = k / n
            a = setback(i, 0.202).lerp(setback(j, 0.202), f)
            b = setback(i, 0.125).lerp(setback(j, 0.125), f)
            atrod(m, (a.x, 0.3, a.y), (b.x, 1.99, b.y), 0.012, "joint", 4)
    meshobj(m, "Made_Platform95x80_SeawallCoping")
    route("Made_Promenade", [[-40, 37], [39, 37]], 6)
    route("Made_WestBoardwalk", [[-45.5, -29], [-45.5, 30], [-40, 35]], 3.5, "timber")
    route("Made_NorthServiceStrip", [[-40, -38], [37, -38]], 3.4)
    route("Made_NorthLandingJoin", [[-44, -34], [-40, -38]], 2.4, "limestone")
    route("Made_AlleePlazaJoin", [[-20, -4], [-18, -3.5]], 2.4, "limestone")
    route("Made_L5ToAllee", [[-45.5, 4], [-39.4, 4], [-39.4, -4]], 2.4, "limestone")
    route(
        "Made_OliveAllee",
        [[-44, -34], [-39, -28], [-39, -4], [-18, -3.5]],
        2.4,
        "limestone",
    )
    route("Made_PlazaToPromenade", [[0, 17], [0, 34]], 4, "limestone")
    route(
        "Made_PlazaRing_W",
        [[-20, -4], [-20, 18.5], [-4, 18.5], [0, 24]],
        3,
        "limestone",
    )
    route("Made_PlazaRing_E", [[20, -3], [20, 22], [0, 24]], 3, "limestone")
    # Studio approaches meet these circulation arms; no road passes through a shell.
    route("Made_NorthStudioWalk", [[-12, -14], [-2, -12], [12, -10]], 2.8, "limestone")
    for a, b in [
        ([-40, 39.7], [-10, 39.7]),
        ([2, 39.7], [22, 39.7]),
        ([39, 39.7], [42, 35.5]),
    ]:
        q = Mesh()
        rail(q, (a[0], L, a[1]), (b[0], L, b[1]))
        meshobj(q, "Made_PromenadeBalustrade")
    anchor("Made_L2LandingAnchor", [-44, L, -34])
    anchor("Made_L5LandingAnchor", [-47, L, 4])
    anchor("Made_FerryAnchor", [-4, 1.3, 44])
    anchor("Made_ArrivalTarget", [0, 4.8, 0])


def tower():
    g = group("Made_WaterTower", (2, L, -30), landmarkOnly=True)
    m = Mesh()
    t = Mesh()
    m.rod((0, 0, 0), (0, 0, 15), 0.7, "aluminium", 12)
    for zz in (15, 16.375, 17.75, 19.125):
        m.rod((0, 0, zz), (0, 0, zz + 1.37), 3.5, "aluminium", 16)
    # Top L+22 = 24.2: 15 stem +5.5 tank +1.5 shallow cap.
    for j in range(16):
        a = j * math.tau / 16
        b = (j + 1) * math.tau / 16
        m.face(
            (
                (math.cos(a) * 3.5, math.sin(a) * 3.5, 20.5),
                (math.cos(b) * 3.5, math.sin(b) * 3.5, 20.5),
                (0, 0, 22),
            ),
            "aluminium",
        )
    for zz in (15, 16.375, 17.75, 19.125, 20.5):
        for j in range(16):
            a = j * math.tau / 16
            b = (j + 1) * math.tau / 16
            t.rod(
                (math.cos(a) * 3.505, math.sin(a) * 3.505, zz),
                (math.cos(b) * 3.505, math.sin(b) * 3.505, zz),
                0.018,
                "graphite",
                4,
            )
    for j in range(16):
        a = j * math.tau / 16
        b = (j + 1) * math.tau / 16
        # Thin catwalk ring, full-width deck and posts, without a second tower stem.
        p0 = (math.cos(a) * 3.5, math.sin(a) * 3.5, 14.92)
        p1 = (math.cos(b) * 3.5, math.sin(b) * 3.5, 14.92)
        p2 = (math.cos(b) * 4.4, math.sin(b) * 4.4, 14.92)
        p3 = (math.cos(a) * 4.4, math.sin(a) * 4.4, 14.92)
        m.face((p0, p1, p2, p3), "graphite")
        t.rod(p3, (p3[0], p3[1], 16.02), 0.025, "aluminium", 6)
        t.rod((p3[0], p3[1], 16.02), (p2[0], p2[1], 16.02), 0.025, "aluminium", 6)
    for xx in (-0.24, 0.24):
        t.rod((xx, -0.86, 0.4), (xx, -0.86, 15), 0.025, "graphite", 6)
    for j in range(43):
        t.rod(
            (-0.24, -0.86, 0.5 + j * 0.33),
            (0.24, -0.86, 0.5 + j * 0.33),
            0.022,
            "aluminium",
            6,
        )
    for j in range(11):
        zz = 2 + j * 1.16
        for k in range(7):
            a = math.pi * k / 7
            b = math.pi * (k + 1) / 7
            t.rod(
                (math.cos(a) * 0.46, -0.86 - math.sin(a) * 0.46, zz),
                (math.cos(b) * 0.46, -0.86 - math.sin(b) * 0.46, zz),
                0.016,
                "graphite",
                4,
            )
    m.box((1.15, 0, 0.45), (0.7, 0.6, 0.9), "graphite")
    meshobj(m, "Made_TowerTankSingleStem", g, METAL)
    meshobj(t, "Made_TowerCatwalkLadder", g, METAL)
    obstacle("towerStem", polyrect(2, -30, 2.2, 2.6), "landmark", (L, L + 15))
    anchor("Made_TowerBeaconAnchor", [2, 24.2, -30])


def plaza():
    m = Mesh()
    atbox(m, (0, L + 0.025, 4), (34, 0.05, 26), "limestone")
    # Real-world 1.2m paving module, hairline joints; not oversized game tiles.
    for x in range(-14, 15):
        atbox(m, (x * 1.2, L + 0.052, 4), (0.025, 0.004, 26), "set")
    for z in range(-7, 14):
        atbox(m, (0, L + 0.053, z * 1.2), (34, 0.004, 0.025), "set")
    ring = []
    for i in range(40):
        ring.append(
            xyz(
                (
                    math.cos(i * math.tau / 40) * 6,
                    L + 0.058,
                    6 + math.sin(i * math.tau / 40) * 6,
                )
            )
        )
    m.face(list(reversed(ring)), "set")
    meshobj(m, "Made_FilmPlazaPaving")
    PATHS.append(
        dict(
            name="Made_FilmPlazaPaving",
            width=34,
            segments=[polyrect(0, 4, 34, 26)],
            owner="filmSet",
            isPlaza=True,
        )
    )
    g = group(
        "Made_FilmSet_Crane",
        (0, L + 0.06, 6),
        motionStatus="dormant static authored pose",
    )
    m, t = Mesh(), Mesh()
    for yy in (-0.62, 0.62):
        m.rod((-3, yy, 0.07), (3, yy, 0.07), 0.045, "graphite")
        for xx in (-0.65, 0.65):
            m.rod((xx, yy - 0.09, 0.22), (xx, yy + 0.09, 0.22), 0.17, "graphite", 10)
    m.bevel_box((0, 0, 0.4), (1.6, 1, 0.3), 0.04, "graphite")
    m.rod((0, 0, 0.5), (0, 0, 2.1), 0.17, "graphite", 8)
    # Triangulated 5.5m jib, counterweight stack and a recognisable camera head.
    for zz in (2.05, 2.36):
        m.rod((-1.4, 0, zz), (4.1, 0, zz + 0.5), 0.045, "graphite", 6)
    for i in range(8):
        xx = -1.4 + i * 0.69
        m.rod(
            (xx, 0, 2.05 + (xx + 1.4) * 0.091),
            (xx + 0.69, 0, 2.36 + (xx + 2.09) * 0.091),
            0.025,
            "aluminium",
            5,
        )
    for i in range(3):
        m.bevel_box((-1.2, 0, 1.99 - i * 0.11), (0.65, 0.7, 0.1), 0.015, "graphite")
    m.rod((4.1, 0, 2.8), (4.1, 0, 2.46), 0.065, "graphite")
    m.box((4.1, 0, 2.35), (0.55, 0.38, 0.32), "graphite")
    m.rod((4.1, -0.17, 2.35), (4.1, -0.48, 2.35), 0.13, "graphite", 8)
    m.box((4.1, -0.5, 2.35), (0.32, 0.05, 0.27), "graphite")
    meshobj(m, "Made_CraneTrussDollyCamera", g, METAL)
    anchor("Made_CranePOVAnchor", [4.1, L + 2.41, 5.5])
    screen = Mesh()
    atbox(screen, (0, L + 2.6, -6.8), (6, 3.4, 0.1), "screen")
    for xx in (-3.18, 3.18):
        atrod(screen, (xx, L, -6.8), (xx, L + 4.55, -6.8), 0.06, "graphite")
    for yy in (L + 0.8, L + 4.4):
        atrod(screen, (-3.18, yy, -6.8), (3.18, yy, -6.8), 0.055, "graphite")
    for xx in (-3.18, 3.18):
        atbox(screen, (xx, L + 0.08, -6.8), (0.9, 0.16, 1.5), "graphite")
    meshobj(screen, "Made_SetScreenTruss")
    obstacle("setScreen", polyrect(0, -6.8, 7.3, 1.6), "filmSet", (L, L + 4.55))
    anchor("Made_KeynoteDisplayAnchor", [0, L + 2.6, -6.73])
    for i, (x, z) in enumerate([(4, 11), (6, 11)]):
        chair = Mesh()
        for side in (-1, 1):
            atrod(
                chair,
                (x + side * 0.29, L, z - 0.32),
                (x + side * 0.29, L + 0.62, z + 0.27),
                0.026,
                "timber",
            )
            atrod(
                chair,
                (x + side * 0.29, L, z + 0.32),
                (x + side * 0.29, L + 0.62, z - 0.27),
                0.026,
                "timber",
            )
            atrod(
                chair,
                (x + side * 0.29, L + 0.5, z + 0.27),
                (x + side * 0.29, L + 1.05, z + 0.27),
                0.022,
                "timber",
            )
        atbox(chair, (x, L + 0.59, z), (0.6, 0.035, 0.48), "sandLight")
        atbox(chair, (x, L + 0.92, z + 0.28), (0.6, 0.25, 0.035), "sandLight")
        meshobj(chair, "Made_DirectorChair_" + str(i))
        obstacle(
            "directorChair" + str(i), polyrect(x, z, 0.8, 0.85), "filmSet", (L, L + 1.1)
        )
    anchor("Made_EmptyChairAnchor", [6, L + 0.65, 11])
    # Two LED panels and bounce board face the filmed centre; all outside the walk arms.
    for name, x, z, w, h, tone in [
        ("KeyLED", -7, 0, 1, 1, "warmLight"),
        ("FillLED", 8, -1, 1, 1, "warmLight"),
        ("Bounce", 7, 3, 1.2, 1.8, "plaster"),
    ]:
        q = Mesh()
        atrod(q, (x, L, z), (x, L + 2.8, z), 0.028, "graphite")
        atbox(q, (x, L + 2.8, z), (w, h, 0.08), tone)
        for dx, dz in [(0.5, 0.3), (-0.5, 0.3), (0, -0.6)]:
            atrod(q, (x, L + 0.5, z), (x + dx, L + 0.04, z + dz), 0.02, "graphite")
        meshobj(q, "Made_" + name)
        obstacle(name, polyrect(x, z, 1.3, 1.3), "filmSet", (L, L + 3.8))
    # A field monitor and slate are purposeful production kit, with blank surfaces.
    q = Mesh()
    atrod(q, (3, L, 10), (3, L + 1.4, 10), 0.025, "graphite")
    atbox(q, (3, L + 1.5, 10), (0.6, 0.38, 0.05), "screen")
    atbox(q, (8, L + 0.25, 8), (0.9, 0.5, 0.6), "graphite")
    atbox(q, (8, L + 0.64, 8), (0.4, 0.24, 0.04), "plaster")
    meshobj(q, "Made_MonitorSlateCase")
    anchor("Made_PlazaCloseCameraAnchor", [0, L + 1.7, 15.7])
    anchor("Made_PlazaTargetAnchor", [0, L + 2, -6.7])


def hall_cube_pier():
    # Hall follows shoreline; deep clerestory plus four actual ground-floor apertures.
    g = group("Made_HackathonHall", (30, L, -30), stopId="hackathons")
    s, t, gl = Mesh(), Mesh(), Mesh()
    s.box((0, 0, 0.1), (24, 10, 0.2), "concrete")
    wall(
        s,
        (-12, 12, 0.2, 5.5),
        (0, -4.82, 0),
        (1, 0, 0),
        (0, -1, 0),
        [(-10.5, -1, 0.2, 4.3), (1, 10.5, 0.2, 4.3)],
        "timber",
        depth=0.36,
    )
    for xx in (-11.82, 11.82):
        wall(
            s,
            (-5, 5, 0.2, 5.5),
            (xx, 0, 0),
            (0, 1, 0),
            (1, 0, 0),
            [(-3.7, 3.7, 3.5, 5.2)],
            "timber",
            depth=0.36,
        )
    wall(
        s,
        (-12, 12, 0.2, 5.5),
        (0, 4.82, 0),
        (1, 0, 0),
        (0, 1, 0),
        [],
        "timber",
        depth=0.36,
    )
    for xx in (-11.7, -0.2, 11.7):
        s.box((xx, -4.9, 2.8), (0.22, 0.22, 5.4), "graphite")
    for a, b in [(-10.5, -1), (1, 10.5)]:
        frame(t, a, b, -4.7, 0.2, 4.3)
        for k in range(4):
            aa = a + (b - a) * k / 4
            bb = a + (b - a) * (k + 1) / 4
            frame(t, aa, bb, -4.7, 0.2, 4.3)
            glass_quad(gl, aa + 0.06, bb - 0.06, -4.7, 0.26, 4.24)
    s.box((0, 0, 5.45), (24, 10, 0.22), "graphite")
    s.box((0, 0, 6.08), (24.4, 10.4, 0.24), "graphite")
    for yy in (-4.8, 4.8):
        glass_quad(gl, -11.7, 11.7, yy, 5.56, 5.96)
    for xx in range(-10, 12, 3):
        t.box((xx, -4.82, 5.76), (0.06, 0.08, 0.44), "graphite")
    for m, n, ma in [
        (s, "Architecture", MAT),
        (t, "Frame", METAL),
        (gl, "ClerestoryGlazing", GLASS),
    ]:
        meshobj(m, "Made_Hall_" + n, g, ma)
    obstacle("hackathons", polyrect(30, -30, 24.4, 10.4), "building", (L, L + 6.2))
    anchor("Made_HackathonsAnchor", [30, L + 0.2, -24.8])
    route(
        "Made_HallApproach",
        [[25, -24.8], [25, -21]],
        4,
        "limestone",
        L + 0.2,
        "hackathons",
    )
    g = group("Made_MobileGlassCube", (8, L, 30), stopId="mobile")
    q, gl = Mesh(), Mesh()
    q.box((0, 0, 0.08), (5, 5, 0.16), "plaster")
    q.bevel_box((0, 0, 3.92), (5.1, 5.1, 0.16), 0.02, "plaster")
    for yy in (-2.45, 2.45):
        glass_quad(gl, -2.45, 2.45, yy, 0.16, 3.84)
    for xx in (-2.45, 2.45):
        gl.face(
            ((xx, -2.45, 0.16), (xx, 2.45, 0.16), (xx, 2.45, 3.84), (xx, -2.45, 3.84)),
            "glass",
        )
    for xx in (-2.45, 2.45):
        for yy in (-2.45, 2.45):
            q.box((xx, yy, 2), (0.035, 0.035, 3.7), "aluminium")
    q.box((0, 0, 0.9), (2.4, 1.1, 0.12), "plaster")
    q.box((0, 0, 0.46), (0.22, 0.22, 0.8), "plaster")
    for xx in (-0.75, 0, 0.75):
        q.bevel_box((xx, 0, 1), (0.17, 0.32, 0.025), 0.012, "graphite")
    meshobj(q, "Made_MobileFrameTable", g)
    meshobj(gl, "Made_MobileFramelessGlass", g, GLASS)
    obstacle("mobile", polyrect(8, 30, 5.1, 5.1), "building", (L, L + 4.01))
    anchor("Made_MobileAnchor", [8, L + 0.16, 32.5])
    route(
        "Made_Mobile_Approach",
        [[8, 32.55], [8, 36]],
        2.8,
        "limestone",
        L + 0.16,
        "mobile",
    )
    # SE quay descending stair ends at a broad T-head; the 8m house fits 12m head.
    deck = 1.25
    q = Mesh()
    atbox(q, (30, deck - 0.15, 44), (6, 0.3, 22), "timber")
    atbox(q, (30, deck - 0.15, 48), (12, 0.3, 12), "timber")
    for x in (24.7, 27.4, 32.6, 35.3):
        for z in (43, 48, 53):
            atrod(q, (x, -0.8, z), (x, deck, z), 0.16, "timber", 8)
    for z in range(35, 55):
        atbox(q, (30, deck + 0.006, z), (5.9, 0.015, 0.025), "shingle")
    for x in (24.1, 35.9):
        rail(q, (x, deck, 42.1), (x, deck, 53.8))
    for a, b in [(24.1, 26.9), (33.1, 35.9)]:
        rail(q, (a, deck, 42.1), (b, deck, 42.1))
    rail(q, (24.1, deck, 53.8), (35.9, deck, 53.8))
    meshobj(q, "Made_SEPierTHeadPiles")
    # 6 rises at 158mm, full 3m stair width, 0.32m treads; clear top and bottom landings.
    st = Mesh()
    step = (L - deck) / 6
    for i in range(6):
        atbox(
            st,
            (30, deck + (i + 1) * step / 2, 41.62 - i * 0.32),
            (3, (i + 1) * step, 0.32),
            "concrete",
        )
    meshobj(st, "Made_PierStairTreads")
    PATHS.append(
        dict(
            name="Made_PierStairTreads",
            width=3,
            segments=[polyrect(30, 40.82, 3, 1.92)],
            owner=None,
        )
    )
    st = Mesh()
    for x in (28.48, 31.52):
        rail(st, (x, deck + 0.08, 41.96), (x, L, 39.84), 1.05)
    meshobj(st, "Made_PierStairRails")
    route("Made_PierApproach", [[30, 39.84], [30, 34.5]], 3, "limestone", L + 0.02)
    route(
        "Made_PierHouseEntryDeck",
        [[30, 41.78], [30, 44]],
        3,
        "timber",
        deck + 0.013,
        "pierHouse",
    )
    anchor("Made_PierStairTopAnchor", [30, L, 39.84])
    anchor("Made_PierStairBottomAnchor", [30, deck, 41.96])
    g = group("Made_PierHouse", (30, deck, 48), stopId="workbench")
    s = Mesh()
    s.box((0, 0, 0.08), (8, 8, 0.16), "timber")
    for xx in (-3.7, 3.7):
        for yy in (-3.7, 3.7):
            s.bevel_box((xx, yy, 1.8), (0.24, 0.24, 3.6), 0.015, "timber")
    for yy in (-3.7, 3.7):
        s.box((0, yy, 3.45), (7.6, 0.22, 0.3), "timber")
    for xx in (-3.7, 3.7):
        s.box((xx, 0, 3.45), (0.22, 7.6, 0.3), "timber")
    # Pyramid hip roof with narrow shingle courses following the slope.
    corners = [
        (-4.5, -4.5, 3.65),
        (4.5, -4.5, 3.65),
        (4.5, 4.5, 3.65),
        (-4.5, 4.5, 3.65),
    ]
    for i in range(4):
        a = Vector(corners[i])
        b = Vector(corners[(i + 1) % 4])
        tip = Vector((0, 0, 6.4))
        s.face((a, b, tip), "shingle")
        for k in range(1, 12):
            s.rod(a.lerp(tip, k / 12), b.lerp(tip, k / 12), 0.025, "timber", 4)
    for xx in (-3.7, 3.7):
        for yy in (-3.1, -2.4, -1.7, -1, 0.0, 1, 1.7, 2.4, 3.1):
            s.rod((xx, yy, 0.15), (xx, yy, 1.05), 0.025, "timber", 5)
        s.rod((xx, -3.7, 1.08), (xx, 3.7, 1.08), 0.05, "timber", 6)
    s.box((0, 1.65, 0.95), (4, 1.2, 0.14), "oak")
    s.box((-1.5, 1.65, 0.5), (0.1, 0.9, 0.9), "timber")
    s.box((1.5, 1.65, 0.5), (0.1, 0.9, 0.9), "timber")
    meshobj(s, "Made_PierHouseHipRoofWorkbench", g)
    anchor("Made_WorkbenchAnchor", [30, deck + 1, 46.5])
    obstacle("pierHouse", polyrect(30, 48, 9, 9), "building", (deck, deck + 6.4))
    q = Mesh()
    atbox(q, (-4, 1.35, 42), (11, 0.6, 4.5), "concrete")
    for xx in (-8, -6, -2, 0):
        atrod(q, (xx, 1.65, 43.7), (xx, 2.05, 43.7), 0.09, "graphite")
    meshobj(q, "Made_FerryQuayBollards")
    q = Mesh()
    points = [[-5.1, 40], [-2.9, 40], [-2.9, 42.3], [-5.1, 42.3]]
    q.face(
        [xyz((x, L + 0.012 if z == 40 else 1.68, z)) for x, z in reversed(points)],
        "timber",
    )
    for x in (-5.13, -2.87):
        rail(q, (x, L, 40), (x, 1.68, 42.3), 0.94)
    meshobj(q, "Made_FerryGangway")
    PATHS.append(
        dict(name="Made_FerryGangway", width=2.2, segments=[points], owner=None)
    )


def props():
    for i, x in enumerate([-38, -28, -18, -8, 2, 12, 22, 32, 39]):
        lamp("Made_PromenadeLamp_" + str(i), x, 38.8)
    for i, (x, z) in enumerate(
        [(-18, -9), (18, -9), (-17, 16.4), (18, 18), (-44, -33), (-40, -30)]
    ):
        lamp("Made_CampusLamp_" + str(i), x, z)
    for i, x in enumerate([-38.25, -12, 12, 35]):
        bench("Made_SeaBench_" + str(i), x, 32.6 if i == 0 else 33.35, 0)
    for i, (x, z, yaw) in enumerate(
        [
            (-14, 15.5, math.pi / 2),
            (14, 15.5, -math.pi / 2),
            (-14, -4, math.pi / 2),
            (14, -4, -math.pi / 2),
        ]
    ):
        bench("Made_PlazaBench_" + str(i), x, z, yaw)
    # All trees grow in physical pots; their ground footprints avoid approaches.
    for i, (x, z, h) in enumerate(
        [
            (-42, -25, 5.5),
            (-42, -17, 4.7),
            (-42, -9, 5.2),
            (-42, -1.5, 4.3),
            (-24, 17, 4.5),
            (-13, -10, 4.5),
            (-15, 13, 4.5),
            (15, 13, 4.5),
            (-15, -1, 4.3),
            (15, -1, 4.3),
            (-8, 25, 4),
            (18, 28, 4.5),
            (39, 19, 4.5),
            (39, 4, 4.5),
            (40, -16, 4.5),
            (-36, 26, 4.8),
        ]
    ):
        olive("Made_OlivePlanter_" + str(i), x, z, h)
    for i, (x, z, w, d) in enumerate(
        [
            (-33, 33, 8, 1),
            (-12, 32, 6, 1),
            (18, 33, 7, 1),
            (39, 25, 2, 7),
            (-14, 24, 3, 0.8),
            (-10, 27, 6, 0.8),
            (14, 19, 6, 0.8),
            (-36, -29, 1.4, 0.7),
        ]
    ):
        lavender("Made_LavenderBed_" + str(i), x, z, w, d)
    # Tool wall lives beside, not across, the western circulation arm.
    q = Mesh()
    atbox(q, (-24, L + 1.3, 14), (4, 2.4, 0.18), "timber")
    for i in range(5):
        atbox(q, (-25.5 + i * 0.75, L + 1.4, 14.12), (0.45, 0.65, 0.06), "aluminium")
    for x in (-25.5, -22.5):
        atrod(q, (x, L, 14), (x, L + 2.5, 14), 0.05, "graphite")
    meshobj(q, "Made_ToolsWallFiveBlankTiles")
    obstacle("tools", polyrect(-24, 14, 4.2, 0.5), "prop", (L, L + 2.6))
    anchor("Made_ToolsAnchor", [-24, L + 1.5, 14.2])
    # Sparse static crew/onlookers establish person scale; no duplicated hero assets.
    for i, (x, z) in enumerate(
        [
            (-8, 7),
            (-7, 11),
            (-4, 13),
            (-2, 14),
            (1, 14),
            (9, 13),
            (11, 8),
            (-9, 2),
            (-3, 3),
            (2, 9),
            (6, 9),
            (-11, 10),
            (10, 10),
            (-9, 16),
            (8, 17),
            (13, 4),
            (12, 0),
            (-12, 3),
        ]
    ):
        q = Mesh()
        h = 1.72 + (i % 3) * 0.035
        for side in (-1, 1):
            # Bent limbs and tapered jacket create a readable human silhouette.
            hip = (x + side * 0.09, L + 0.88, z)
            knee = (x + side * 0.10, L + 0.48, z + (i % 2) * 0.025)
            foot = (x + side * 0.12, L + 0.08, z - 0.025)
            atrod(q, hip, knee, 0.075, "sand", 7)
            atrod(q, knee, foot, 0.055, "sand", 7)
            atbox(q, (foot[0], L + 0.05, z - 0.045), (0.13, 0.10, 0.23), "graphite")
        rings = []
        for yy, ww, dd in [
            (0.84, 0.14, 0.10),
            (1.03, 0.16, 0.12),
            (1.33, 0.21, 0.12),
            (1.40, 0.14, 0.09),
        ]:
            rings.append(
                [
                    xyz(
                        (
                            x + math.cos(k * math.tau / 8) * ww,
                            L + yy,
                            z + math.sin(k * math.tau / 8) * dd,
                        )
                    )
                    for k in range(8)
                ]
            )
        jacket = "graphite" if i % 3 else "sage"
        for aa, bb in zip(rings, rings[1:]):
            for k in range(8):
                q.face((aa[k], aa[(k + 1) % 8], bb[(k + 1) % 8], bb[k]), jacket)
        q.face(rings[-1], jacket)
        atrod(q, (x, L + 1.4, z), (x, L + 1.50, z), 0.052, "sandLight", 7)
        atrod(q, (x, L + 1.50, z), (x, L + h - 0.02, z), 0.105, "sandLight", 8)
        for side in (-1, 1):
            shoulder = (x + side * 0.20, L + 1.32, z)
            elbow = (x + side * 0.27, L + 1.08, z - 0.04)
            hand = (x + side * 0.27, L + 0.91, z - 0.10)
            atrod(q, shoulder, elbow, 0.06, jacket, 7)
            atrod(q, elbow, hand, 0.045, jacket, 7)
            atrod(q, hand, (hand[0], hand[1] - 0.07, hand[2]), 0.04, "sandLight", 7)
        meshobj(q, "Made_StaticCrew_" + str(i))
    # One fractured low bluff tracks the E wall, rather than isolated pyramids.
    q = Mesh()
    sections = []
    for i, z in enumerate([-25, -21, -16, -11, -7, -2, 3, 8, 12, 17, 21, 25]):
        rise = 0 if i in (0, 11) else [1.35, 1.7, 2.3, 1.6, 1.25][i % 5]
        sections.append(
            [
                xyz((43.15 + (0.45 if i % 3 == 0 else 0), L + 0.008, z)),
                xyz(
                    (
                        44.7 + (i % 3) * 0.31,
                        L + max(rise, 0.008),
                        z + (0.42 if i % 2 else -0.4),
                    )
                ),
                xyz((46.4 - (i % 2) * 0.18, L + max(rise * 0.42, 0.008), z - 0.25)),
                xyz((47.48, L + 0.008, z)),
            ]
        )
    for i, (aa, bb) in enumerate(zip(sections, sections[1:])):
        for j in range(3):
            tones = ["rock", "rockWarm", "rockShade"]
            q.face((aa[j], bb[j + 1], bb[j]), tones[(i + j) % 3])
            q.face((aa[j], aa[j + 1], bb[j + 1]), tones[(i + j + 1) % 3])
    meshobj(q, "Made_EastFacetedRockBluff")


def make():
    global ROOT, MAT, METAL, GLASS
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ROOT = empty(
        "Made_CampusRoot",
        units="metres",
        seaLevel=0,
        plazaLevel=L,
        scope="campus exterior; Aether separate",
    )
    MAT = kit.palette_material("MadeCampus_MattePalette")
    METAL = kit.palette_material("MadeCampus_MetalPalette", 0.4, 0.65)
    GLASS = kit.palette_material("MadeCampus_GlassPalette", 0.2, 0, 0.28)
    plinth()
    studio("Agentex", "agentex", -8, -24, 13, 11, 9, 0, "sand", "B")
    studio("GitCue", "gitcue", 10, -20, 14, 11, 10.5, -0.32, "sandLight", "D")
    studio("Mesa", "mesa", 27, -10, 13, 12, 8.6, -math.pi / 4, "sand", "A")
    studio("csDNA", "csdna", 30, 12, 12, 11, 7.2, -math.pi / 2, "trim", "D")
    studio("SoDA", "soda", -32, 6, 14, 12, 10.8, math.pi / 2, "sandLight", "C")
    studio("ThisWorld", "world", -22, 26, 12, 10, 5.6, 0, "concrete", "B")
    # Real external showroom, including swing and close camera, is an explicit reservation.
    obstacle(
        "aether",
        polyrect(-26, -14, 12, 11, math.pi / 4),
        "externalBuilding",
        (L, L + 8.4),
    )
    c = math.sqrt(0.5)

    def aep(x, z):
        return [-26 + (x + z) * c, -14 + (-x + z) * c]

    route(
        "Aether_Approach",
        [aep(0, 5.48), aep(0, 9.5)],
        5.2,
        "limestone",
        L + 0.18,
        "aether",
    )
    route("Made_AetherToPlaza", [aep(0, 9.5), [-17, -5.5]], 2.8, "limestone")
    PATHS.append(
        dict(
            name="Aether_ReservedFacadeApproach",
            width=9.6,
            segments=[[aep(-4.8, 5.3), aep(4.8, 5.3), aep(4.8, 9.5), aep(-4.8, 9.5)]],
            owner="aether",
            reservationOnly=True,
        )
    )
    tower()
    plaza()
    hall_cube_pier()
    props()
    bpy.context.view_layer.update()
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            # Assert explicit active vertex palette survives export.
            assert o.data.color_attributes.active_color is not None, o.name
    OUT.parent.mkdir(parents=True, exist_ok=True)
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    STATS.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
    opts = dict(
        filepath=str(OUT),
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=True,
        export_active_vertex_color_when_no_material=True,
        export_normals=True,
        export_attributes=True,
        export_extras=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_skins=False,
        export_morph=False,
        export_meshopt_compression_enable=False,
        export_meshopt_extension="EXT_meshopt_compression",
    )
    supported = {
        p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties
    }
    bpy.ops.export_scene.gltf(**{k: v for k, v in opts.items() if k in supported})
    stats = dict(
        asset="models/islands/made-campus.glb",
        sourceBlend="asset-src/authored/made-campus/made-campus.blend",
        units="metres",
        plazaLevel=L,
        authorship="Original geometry using read-only Mesh construction helpers; governing master crop and WORLD-SPEC-FULL §3.2",
        paletteHex=kit.PALETTE,
        anchors=ANCHORS,
        studios=STUDIOS,
        footprints=FOOTPRINTS,
        renderedPaving=PATHS,
        externalAether=dict(
            center=[-26, L, -14], yaw=math.pi / 4, size=[12, 8.4, 11], triangles=7138
        ),
        knownLimitations=[
            "Six studios are exterior shells with blank glazing/interior anchors; only external Aether has its furnished animated showroom.",
            "All crane, crowd, tower beacon, glass fronts and flora are static; no implied running interactions.",
            "No ferry vehicle, studio claims, logos, media maps or copied reference pixels.",
            "Campus asset prep needs actual desktop/phone browser arrival-close-return integration gate; viewport renders do not validate physical phone or older M1.",
        ],
    )
    STATS.write_text(json.dumps(stats, indent=2) + "\n")
    print("MADE_CAMPUS_EXPORTED", OUT.stat().st_size)


if __name__ == "__main__":
    make()
