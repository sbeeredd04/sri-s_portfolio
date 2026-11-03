"""Original Bay transport geometry. Three +Z forward, authored at true metre scale."""

import importlib.util
import json
import math
from pathlib import Path

import bpy

APP = Path(__file__).resolve().parents[2]
module = importlib.util.spec_from_file_location(
    "craft_mesh", Path(__file__).with_name("build_made_studio.py")
)
kit = importlib.util.module_from_spec(module)
module.loader.exec_module(kit)
Mesh = kit.Mesh
kit.PALETTE.update(
    dict(
        navy="334A60",
        navyShade="293C50",
        blue="55778A",
        cream="F0E7D6",
        ivory="FFF1D8",
        deck="BA936D",
        cap="8D6A50",
        amber="E3A769",
        metal="646C6B",
        window="718C8B",
        glassCraft="A8BFBC",
        red="AC5344",
        redDeep="874338",
        redLight="BE6855",
        ochre="CB9E67",
        sail="F5E9D6",
        sailShade="E1D1B8",
    )
)
OUT = APP / "public/models/islands/bay-craft.glb"
SOURCE = APP / "asset-src/authored/bay-craft/bay-craft.blend"
STATS = APP / "asset-src/stats/bay-craft.json"


def p(x, y, z):
    return x, -z, y


def box(m, point, size, color):
    m.box(p(*point), (size[0], size[2], size[1]), color)


def soft_box(m, point, size, bevel, color):
    m.bevel_box(p(*point), (size[0], size[2], size[1]), bevel, color)


def rod(m, a, b, radius, color, sides=6):
    m.rod(p(*a), p(*b), radius, color, sides)


def face(m, pts, color):
    m.face([p(*v) for v in pts], color)


def shell(m, rings, colors, close=True):
    outline = rings[0]
    signed_area = sum(
        a[0] * b[2] - a[2] * b[0] for a, b in zip(outline, outline[1:] + outline[:1])
    )
    if signed_area > 0:
        rings = [list(reversed(ring)) for ring in rings]
    for index, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(len(a)):
            j = (i + 1) % len(a)
            face(m, [a[i], a[j], b[j], b[i]], colors[index % len(colors)])
    if close:
        face(m, list(reversed(rings[0])), colors[0])
        face(m, rings[-1], colors[-1])


def hull(m, stations, levels, colors):
    # Lengthwise loft. Beam and keel depths are individually shaped at each
    # station, with an unbroken deck sheer and a separate navy boot stripe.
    rings = []
    for height, beam, keel in levels:
        side = [(w * beam, height + rise + keel * d, z) for z, w, rise, d in stations]
        rings.append(side + [(-x, y, z) for x, y, z in reversed(side)])
    shell(m, rings, colors)
    return rings[-1]


def rail(m, line, height=0.78, spacing=1.12):
    for a, b in zip(line, line[1:]):
        count = max(1, math.ceil(math.dist(a, b) / spacing))
        for j in range(count):
            q = tuple(x + (y - x) * j / count for x, y in zip(a, b))
            rod(m, q, (q[0], q[1] + height, q[2]), 0.024, "metal", 5)
        for dy, r, tone in [(height, 0.031, "cream"), (height * 0.49, 0.014, "metal")]:
            rod(m, (a[0], a[1] + dy, a[2]), (b[0], b[1] + dy, b[2]), r, tone, 5)


def ferry():
    root = kit.empty(
        "Ferry_Root", ROOT, units="metres", forward="+Z", pivot="waterline"
    )
    body, glazing, detail = Mesh(), Mesh(), Mesh()
    stations = [
        (-5.35, 1.16, 0.09, 0.04),
        (-5.05, 1.57, 0.025, 0.16),
        (-3.9, 1.84, 0, 0.09),
        (-1.8, 1.9, 0, 0.025),
        (1.6, 1.88, 0.025, 0),
        (3.35, 1.48, 0.095, 0.09),
        (4.55, 0.94, 0.21, 0.22),
        (5.27, 0.44, 0.36, 0.37),
        (5.54, 0.035, 0.48, 0.48),
    ]
    hull(
        body,
        stations,
        [
            (-0.61, 0.44, 0.77),
            (-0.26, 0.81, 0.35),
            (0.05, 0.97, 0.17),
            (0.19, 1, 0.1),
            (0.61, 1, 0.025),
            (0.78, 0.992, 0),
        ],
        ["navyShade", "navy", "blue", "navy", "cream"],
    )

    # Passenger deck and raised wheelhouse use different setbacks so the
    # body reads as two decks. The front windscreens bend around the bow.
    def cabin(y0, y1, z0, z1, width, radius, upper):
        corners = [
            (-width, z0 + radius),
            (-width + radius, z0),
            (width - radius, z0),
            (width, z0 + radius),
            (width, z1 - radius),
            (width - radius, z1),
            (-width + radius, z1),
            (-width, z1 - radius),
        ]
        for i, a in enumerate(corners):
            b = corners[(i + 1) % len(corners)]
            length = math.dist(a, b)
            count = max(1, round(length / (0.82 if upper else 0.96)))
            for j in range(count):
                t0, t1 = j / count, (j + 1) / count
                s = tuple(x + (y - x) * t0 for x, y in zip(a, b))
                t = tuple(x + (y - x) * t1 for x, y in zip(a, b))
                q0 = tuple(x * 0.91 + y * 0.09 for x, y in zip(s, t))
                q1 = tuple(x * 0.09 + y * 0.91 for x, y in zip(s, t))

                def quad(mesh, start, end, lo, hi, tone):
                    face(
                        mesh,
                        [
                            (start[0], lo, start[1]),
                            (end[0], lo, end[1]),
                            (end[0], hi, end[1]),
                            (start[0], hi, start[1]),
                        ],
                        tone,
                    )

                lo = y0 + (0.28 if upper else 0.35)
                hi = y1 - 0.17
                quad(body, s, t, y0, lo, "cream")
                quad(body, s, t, hi, y1, "cream")
                quad(body, s, q0, lo, hi, "cream")
                quad(body, q1, t, lo, hi, "cream")
                quad(glazing, q0, q1, lo, hi, "window")
                rod(
                    detail,
                    (q0[0], lo, q0[1]),
                    (q0[0], hi, q0[1]),
                    0.021,
                    "navyShade",
                    5,
                )
        edge = [(x * 1.055, y1, z) for x, z in corners]
        shell(body, [edge, [(x, y + 0.13, z) for x, y, z in edge]], ["ivory"])

    cabin(0.85, 2.23, -3.67, 3.56, 1.48, 0.53, False)
    soft_box(body, (0, 2.37, 0.12), (3.28, 0.17, 7.92), 0.064, "cream")
    cabin(2.44, 3.35, -2.49, 2.81, 1.18, 0.48, True)
    soft_box(body, (0, 3.5, 0.12), (2.67, 0.19, 5.66), 0.065, "cream")
    for side in (-1, 1):
        rail(detail, [(side * 1.58, 2.49, -3.63), (side * 1.58, 2.49, 3.53)], 0.54)
        rail(
            detail,
            [
                (side * 1.78, 0.88, -4.18),
                (side * 1.42, 0.91, -4.91),
                (side * 0.9, 0.93, -5.1),
            ],
            0.61,
        )
        rail(
            detail,
            [
                (side * 1.65, 0.92, 3.3),
                (side * 1.35, 1.03, 4.15),
                (side * 0.75, 1.13, 4.86),
                (0, 1.23, 5.35),
            ],
            0.61,
        )
    rail(detail, [(-0.9, 0.93, -5.1), (0.9, 0.93, -5.1)], 0.61)
    rod(detail, (0, 3.56, -0.44), (0, 4.07, -0.51), 0.029, "metal", 6)
    rod(detail, (-0.26, 3.86, -0.48), (0.26, 3.86, -0.48), 0.022, "metal")
    rod(detail, (0, 4.06, -0.51), (0, 4.15, -0.52), 0.036, "amber")
    # Bow landing plate and twin practical exhausts.
    soft_box(detail, (0, 0.93, 4.09), (1.08, 0.11, 0.52), 0.03, "deck")
    for x in (-0.68, 0.68):
        rod(detail, (x, 3.52, -1.98), (x, 3.86, -2.05), 0.096, "navyShade", 8)
    body.object("Ferry_HullCabins", MAT, root)
    glazing.object("Ferry_Windscreens", WINDOW, root)
    detail.object("Ferry_RailsAndFittings", MAT, root)
    return root, {
        "Ferry_WaterlineAnchor": [0, 0, 0],
        "Ferry_BowAnchor": [0, 0, 5.54],
        "Ferry_PortBoardingAnchor": [-1.88, 0.88, -3.35],
    }


def sailboat():
    root = kit.empty(
        "Sailboat_Root", ROOT, units="metres", forward="+Z", pivot="waterline"
    )
    body, canvas = Mesh(), Mesh()
    stations = [
        (-1.95, 0.43, 0, 0.05),
        (-1.74, 0.62, 0, 0),
        (-0.75, 0.76, 0, 0),
        (0.58, 0.73, 0.015, 0.04),
        (1.43, 0.49, 0.06, 0.12),
        (2.06, 0.018, 0.18, 0.19),
    ]
    hull(
        body,
        stations,
        [
            (-0.29, 0.31, 0.62),
            (-0.13, 0.71, 0.28),
            (0.035, 0.92, 0.11),
            (0.25, 1, 0.01),
            (0.31, 0.99, 0),
        ],
        ["navy", "blue", "cream", "ochre"],
    )
    soft_box(body, (0, 0.34, -0.55), (1.09, 0.085, 1.35), 0.055, "cap")
    soft_box(body, (0, 0.397, -0.6), (0.82, 0.045, 1.05), 0.034, "deck")
    rod(body, (0, 0.33, 0.39), (0, 3.85, 0.25), 0.043, "cap", 8)
    rod(body, (0, 0.82, 0.37), (0, 0.82, -1.54), 0.036, "cap")
    rod(body, (0, 3.79, 0.26), (0, 0.45, 1.97), 0.012, "metal", 5)
    # Sail cloth has one tensioned belly seam and tapered trailing corners.
    a = (0, 3.71, 0.255)
    b = (0.02, 0.86, 0.36)
    c = (0.06, 0.85, -1.48)
    d = (0.18, 2.02, -0.26)
    for tri, tone in [
        ((a, b, d), "sail"),
        ((a, d, c), "sailShade"),
        ((d, b, c), "sail"),
    ]:
        face(canvas, tri, tone)
    a = (0, 2.93, 0.66)
    b = (0.045, 0.62, 1.79)
    c = (0.075, 0.64, 0.48)
    d = (0.126, 1.45, 0.98)
    for tri, tone in [
        ((a, b, d), "sailShade"),
        ((a, d, c), "sail"),
        ((d, b, c), "sail"),
    ]:
        face(canvas, tri, tone)
    body.object("Sailboat_ChinedHullRig", MAT, root)
    canvas.object("Sailboat_Cloth", MAT, root)
    return root, {
        "Sailboat_WaterlineAnchor": [0, 0, 0],
        "Sailboat_MastheadAnchor": [0, 3.85, 0.25],
    }


def harbor_launch():
    root = kit.empty("Launch_Root", ROOT, units="metres", forward="+Z", pivot="waterline")
    mesh = Mesh()
    stations = [
        (-2.50,.61,0,.05), (-2.30,.91,0,0), (-.4,1.04,0,0),
        (1.11,.84,.055,.04), (2.02,.47,.16,.12), (2.62,.025,.30,.19),
    ]
    hull(mesh, stations, [(-.34,.39,.55),(-.10,.86,.21),(.06,.98,.08),
                          (.38,1,0),(.49,.97,0)],
         ["navyShade","redDeep","cream","cap","deck"])
    soft_box(mesh,(0,.72,.43),(1.45,.48,1.64),.09,"cream")
    soft_box(mesh,(0,1.07,.47),(1.32,.39,1.4),.08,"window")
    soft_box(mesh,(0,1.31,.48),(1.60,.17,1.68),.08,"ivory")
    soft_box(mesh,(0,.58,-1.65),(1.45,.18,.33),.05,"cap")
    rail(mesh,[(-.55,.51,1.60),(0,.73,2.55),(.55,.51,1.60)],.28,.75)
    rod(mesh,(0,1.38,.49),(0,1.91,.52),.025,"metal")
    box(mesh,(0,1.92,.52),(.12,.08,.1),"amber")
    mesh.object("Launch_ChinedHullAndCabin",MAT,root)
    return root, {"Launch_WaterlineAnchor":[0,0,0]}


def gondola():
    root = kit.empty(
        "Gondola_Root", ROOT, units="metres", forward="+Z", pivot="footprint"
    )
    frame, glass = Mesh(), Mesh()
    plan = [
        (-0.79, -0.86),
        (-0.61, -1.1),
        (0.61, -1.1),
        (0.79, -0.86),
        (0.79, 0.86),
        (0.61, 1.1),
        (-0.61, 1.1),
        (-0.79, 0.86),
    ]

    def ring(y, scale):
        return [(x * scale, y, z * scale) for x, z in plan]

    shell(frame, [ring(0.035, 0.83), ring(0.15, 1), ring(0.69, 1)], ["redDeep", "red"])
    shell(frame, [ring(1.88, 1), ring(2.09, 1), ring(2.21, 0.87)], ["red", "redLight"])
    for i, (a, b) in enumerate(zip(plan, plan[1:] + plan[:1])):
        ax, az = a
        bx, bz = b
        face(
            glass,
            [(ax, 0.7, az), (bx, 0.7, bz), (bx, 1.88, bz), (ax, 1.88, az)],
            "glassCraft",
        )
        rod(frame, (ax, 0.64, az), (ax, 1.93, az), 0.041, "redDeep", 6)
        rod(frame, (ax, 1.28, az), (bx, 1.28, bz), 0.022, "redDeep", 5)
        if i in (1, 5):
            rod(
                frame,
                ((ax + bx) * 0.5, 0.67, (az + bz) * 0.5),
                ((ax + bx) * 0.5, 1.93, (az + bz) * 0.5),
                0.027,
                "redDeep",
            )
    for x in (-0.53, 0.53):
        soft_box(frame, (x, 0.69, 0), (0.36, 0.13, 1.32), 0.021, "cream")
        rod(frame, (x, 0.58, -0.55), (x, 0.15, -0.55), 0.036, "metal")
        rod(frame, (x, 0.58, 0.55), (x, 0.15, 0.55), 0.036, "metal")
    rod(frame, (0, 2.18, 0), (0, 2.68, 0), 0.078, "metal", 8)
    rod(frame, (0, 2.65, -0.24), (0, 2.65, 0.24), 0.058, "metal", 8)
    frame.object("Gondola_RedShellAndHanger", MAT, root)
    glass.object("Gondola_GlazedPanels", GLASS, root)
    return root, {
        "Gondola_FootprintAnchor": [0, 0, 0],
        "Gondola_HangerAnchor": [0, 2.68, 0],
    }


def main():
    global ROOT, MAT, WINDOW, GLASS
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ROOT = kit.empty("BayCraft_Root", units="metres")
    MAT = kit.palette_material("BayCraft_MattePalette", 0.74)
    WINDOW = kit.palette_material("BayCraft_WindowPalette", 0.24, 0.1)
    GLASS = kit.palette_material("BayCraft_CabinGlassPalette", 0.2, 0, 0.46)
    anchors = {}
    for fn in (ferry, sailboat, harbor_launch, gondola):
        root, points = fn()
        for name, point in points.items():
            kit.empty(name, root, p(*point), role="runtimeAnchor")
            anchors[name] = point
    for path in (OUT, SOURCE, STATS):
        path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        export_yup=True,
        export_vertex_color="ACTIVE",
        export_attributes=True,
        export_extras=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    STATS.write_text(
        json.dumps(
            dict(
                units="metres",
                forward="+Z",
                anchors=anchors,
                roots=["Ferry_Root", "Sailboat_Root", "Launch_Root", "Gondola_Root"],
            ),
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
