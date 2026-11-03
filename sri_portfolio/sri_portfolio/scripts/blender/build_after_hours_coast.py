"""Original After Hours coast in the court tangent frame. Sea=0, content +2.8m."""

import importlib.util
import json
import math
import os
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
from mathutils.bvhtree import BVHTree

APP = Path(__file__).resolve().parents[2]
loader = importlib.util.spec_from_file_location(
    "coast_mesh", Path(__file__).with_name("build_made_studio.py")
)
kit = importlib.util.module_from_spec(loader)
loader.loader.exec_module(kit)
Mesh, empty = kit.Mesh, kit.empty
kit.PALETTE.update(
    {
        "soilOlive": "657249",
        "coastGreen": "7D8D50",
        "dryGrass": "A1A16B",
        "softRock": "A79784",
        "shadeRock": "998B7A",
        "wetRock": "918B79",
        "beach": "D7C09C",
        "wetSand": "AE9D82",
        "path": "D2C8AA",
        "hedge": "6E7A4D",
        "hedgeTip": "7C8857",
        "trunk": "9C805F",
        "trunkDark": "8D7659",
        "trunkLight": "AF9570",
        "palm": "647E42",
        "palmLight": "91A65E",
        "palmDark": "4D653B",
        "agave": "7E9375",
        "agaveShade": "687F67",
        "pink": "C393AD", "pinkLight": "D9B2C1",
        "leaf": "587044", "leafLight": "819755", "sage": "91A17A",
        "poppy": "C98A41", "poppyLight": "E2B55D", "gardenSoil": "536344",
        "vinyl": "343136",
        "vinylShade": "302E33",
        "vinylEdge": "474043",
        "copper": "A27553",
        "terracotta": "B06B50",
        "glassSmoke": "9FAEA0",
        "stoneDeck": "C7B8A5",
        "timberWarm": "AB805B",
        "timberDark": "7C614D",
        "sandstone": "CBB99E",
        "chrome": "C7C2B7",
        "amber": "F3C68A",
        "ochreKayak": "BB8A58",
        "tealKayak": "68968A",
    }
)
OUT = APP / "public/models/islands/after-hours-coast.glb"
SRC = APP / "asset-src/authored/after-hours-coast/after-hours-coast.blend"
STATS = APP / "asset-src/stats/after-hours-coast.json"
LAYOUT = json.loads(Path(os.environ["AFTER_HOURS_LAYOUT_PATH"]).read_text())
L = 2.8
MESH_PATHS, ANCHORS, NEW_OBSTACLES = [], {}, []

# Coast controls in Three XZ. The western bite is the tidal cove; the long
# eastern arm curls around the cinema shore toward a rocky southeast tip.
CONTROL = [
    (-42, -13),
    (-32, -21),
    (-18, -24),
    (5, -24),
    (25, -20),
    (37, -10),
    (41, 6),
    (40, 19),
    (45, 29),
    (48, 41),
    (48, 52),
    (44, 64),
    (36, 73),
    (28, 73),
    (23, 68),
    (26, 60),
    (34, 55),
    (31, 52),
    (23, 57),
    (4, 59),
    (-14, 58),
    (-27, 54),
    (-38, 46),
    (-42, 37),
    (-38, 33),
    (-31, 31),
    (-30, 27),
    (-34, 24),
    (-42, 21),
    (-46, 15),
    (-46, 3),
    (-44, -6),
]


def xyz(x, y, z):
    return (x, -z, y)


def vec(x, y, z):
    return Vector(xyz(x, y, z))


def atbox(m, p, s, t):
    m.box(xyz(*p), (s[0], s[2], s[1]), t)


def rod(m, a, b, r, t, n=6):
    m.rod(xyz(*a), xyz(*b), r, t, n)


def obj(m, name, mat=None, parent=None):
    return m.object(name, mat or MAT, parent or ROOT)


def anchor(name, p, **ex):
    ANCHORS[name] = [round(float(x), 5) for x in p]
    return empty(name, ROOT, xyz(*p), role="runtimeAnchor", **ex)


def rect(x, z, w, d):
    return [
        [x - w / 2, z - d / 2],
        [x + w / 2, z - d / 2],
        [x + w / 2, z + d / 2],
        [x - w / 2, z + d / 2],
    ]


def obstacle(name, points, yr, kind):
    NEW_OBSTACLES.append(dict(name=name, polygon=points, height=yr, kind=kind))


def ring(cx, cz, r, n=24):
    return [
        [cx + math.cos(i * math.tau / n) * r, cz + math.sin(i * math.tau / n) * r]
        for i in range(n)
    ]


def smooth(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)


def catmull(points, closed=True, spacing=2.2):
    v = [Vector(p) for p in points]
    out = []
    for i in range(len(v) if closed else len(v) - 1):
        a = v[(i - 1) % len(v)] if closed or i else v[0]
        b = v[i]
        c = v[(i + 1) % len(v)]
        d = v[(i + 2) % len(v)] if closed or i + 2 < len(v) else v[-1]
        count = max(2, math.ceil((c - b).length / spacing))
        for j in range(count):
            t = j / count
            out.append(
                0.5
                * (
                    (2 * b)
                    + (-a + c) * t
                    + (2 * a - 5 * b + 4 * c - d) * t * t
                    + (-a + 3 * b - 3 * c + d) * t * t * t
                )
            )
    if not closed:
        out.append(v[-1])
    return out


SHORE = catmull(CONTROL)


def inside(x, z):
    result = False
    for a, b in zip(SHORE, SHORE[1:] + SHORE[:1]):
        if (a.y > z) != (b.y > z) and x < (b.x - a.x) * (z - a.y) / (b.y - a.y) + a.x:
            result = not result
    return result


def shore_distance(x, z):
    best = 1e9
    for a, b in zip(SHORE, SHORE[1:] + SHORE[:1]):
        dx, dz = b.x - a.x, b.y - a.y
        t = min(1, max(0, ((x - a.x) * dx + (z - a.y) * dz) / (dx * dx + dz * dz)))
        best = min(best, (x - a.x - t * dx) ** 2 + (z - a.y - t * dz) ** 2)
    return math.sqrt(best)


def cove_mix(x, z):
    return smooth((-25 - x) / 6) * smooth((z - 18) / 7) * smooth((42 - z) / 8)


def ridge(x, z):
    # Ridge follows the curling spit rather than a repeated shoreline ring.
    cx = 40.8 - 0.035 * max(0, z - 49) ** 2
    return (
        smooth((z - 20) / 25)
        * math.exp(-(((x - cx) / 6.4) ** 2))
        * smooth((73 - z) / 8)
    )


def height(x, z, d=None):
    d = shore_distance(x, z) if d is None else d
    cove = cove_mix(x, z)
    shore_w = 4.6 + cove * 3.8
    base = -0.62 + (L - 0.018 + 0.62) * smooth(d / shore_w)
    rise = 3.04 * ridge(x, z) * smooth(d / 4.7)
    # Keep legacy playable pads and existing furniture exactly at the shared deck.
    if (
        (-27 <= x <= 27 and -17 <= z <= 22)
        or (-10 <= x <= 28 and 34 <= z <= 51.8)
        or (21 <= x <= 27 and 12 <= z <= 51)
    ):
        rise = 0
    # Cut the bank under the actual treads instead of burying the stair nose.
    along = smooth((-24.66 - x) / 0.62) * smooth((x + 30.0) / 0.77)
    across = 1 - smooth((abs(z - 29.7) - 1.48) / 1.03)
    lowered = L - ((L - 0.91) / 4.29) * max(0, -24.8 - x) - 0.36
    return base + rise - max(0, base + rise - lowered) * along * across


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def ground_color(x, z, d, y):
    cove = cove_mix(x, z)
    noise = (
        0.5
        + 0.28 * math.sin(x * 0.21 + z * 0.14)
        + 0.16 * math.cos(z * 0.33 - x * 0.25)
    )
    grasses = mix(
        kit.color("soilOlive"), kit.color("coastGreen"), min(1, max(0, noise))
    )
    grasses = mix(grasses, kit.color("dryGrass"), 0.21 * (1 - noise))
    rock = mix(kit.color("shadeRock"), kit.color("softRock"), 0.32 + 0.48 * noise)
    rock = mix(kit.color("wetRock"), rock, smooth((y + 0.18) / 0.76))
    shore = mix(
        rock,
        mix(kit.color("wetSand"), kit.color("beach"), smooth((y + 0.24) / 1.2)),
        cove,
    )
    return mix(shore, grasses, smooth((d - 1.3) / (3.5 + cove * 2.8)))


def terrain():
    points = list(SHORE)
    for zi in range(-13, 38):
        for xi in range(-25, 26):
            x = xi * 1.95 + 0.28 * math.sin(zi * 1.73 + xi * 0.64)
            z = zi * 1.98 + 0.30 * math.sin(xi * 1.37 + zi * 0.32)
            if inside(x, z) and shore_distance(x, z) > 0.23:
                points.append(Vector((x, z)))
    # Locally refine the cove bank so the carved stair slot survives export.
    for zi in range(14):
        for xi in range(16):
            x = -29.65 + xi * 0.355
            z = 27.15 + zi * 0.39
            if inside(x, z):
                points.append(Vector((x, z)))
    n = len(SHORE)
    vs, _, fs, _, _, _ = delaunay_2d_cdt(
        points, [(i, (i + 1) % n) for i in range(n)], [list(range(n))], 1, 0.00001
    )
    verts, colors = [], []
    for v in vs:
        d = shore_distance(v.x, v.y)
        y = height(v.x, v.y, d)
        verts.append(xyz(v.x, y, v.y))
        colors.append(ground_color(v.x, v.y, d, y))
    faces = []
    for f in fs:
        if len(f) != 3:
            continue
        a, b, c = [Vector(verts[i]) for i in f]
        faces.append(tuple(f) if (b - a).cross(c - a).z > 0 else tuple(reversed(f)))
    data = bpy.data.meshes.new("AfterHours_ContinuousCoast")
    data.from_pydata(verts, [], faces)
    data.materials.append(MAT)
    attr = data.color_attributes.new(
        name="PaletteColor", type="FLOAT_COLOR", domain="CORNER"
    )
    for p in data.polygons:
        for i in p.loop_indices:
            attr.data[i].color = colors[data.loops[i].vertex_index]
    data.color_attributes.active_color = attr
    data.color_attributes.render_color_index = 0
    o = bpy.data.objects.new("AfterHours_ContinuousCoast", data)
    bpy.context.scene.collection.objects.link(o)
    o.parent = ROOT
    return o


def ground_at(x, z):
    hit = GROUND_BVH.ray_cast(Vector((x, -z, 40)), Vector((0, 0, -1)))[0]
    return hit.z if hit is not None else height(x, z)


def path(name, control, w, tone="path", grade=None):
    ps = catmull(control, False, 1.35 if grade else 0.60)
    m = Mesh()
    edges = []
    polys = []
    offset = 0.023 + 0.0025 * len(MESH_PATHS)
    for i, p in enumerate(ps):
        tangent = (ps[min(i + 1, len(ps) - 1)] - ps[max(i - 1, 0)]).normalized()
        normal = Vector((-tangent.y, tangent.x)) * w / 2
        edge = []
        for q in (p + normal, p - normal) if grade else (p + normal, p, p - normal):
            y = (
                grade(i / (len(ps) - 1), q.x, q.y)
                if grade
                else ground_at(q.x, q.y) + max(offset, 0.052)
            )
            edge.append([q.x, y, q.y])
        edges.append(edge)
    for a, b in zip(edges, edges[1:]):
        for j in range(len(a) - 1):
            a0, a1, b1, b0 = [xyz(*p) for p in (a[j], a[j + 1], b[j + 1], b[j])]
            m.face((a0, b1, a1), tone)
            m.face((a0, b0, b1), tone)
            polys.append([[p[0], p[2]] for p in (a[j], a[j + 1], b[j + 1], b[j])])
    obj(m, name)
    MESH_PATHS.append(dict(name=name, width=w, segments=polys))
    return edges


def rail(m, a, b, tone="timberDark", h=0.95, spacing=1.55):
    a, b = Vector(a), Vector(b)
    n = max(1, math.ceil((b - a).length / spacing))
    for i in range(n + 1):
        p = a.lerp(b, i / n)
        rod(m, p, p + Vector((0, h, 0)), 0.034, tone)
    for y, r in [(h, 0.052), (0.4, 0.022)]:
        rod(m, a + Vector((0, y, 0)), b + Vector((0, y, 0)), r, tone)


def fence_run(name, points):
    m, t = Mesh(), Mesh()
    for a, b in zip(points, points[1:]):
        a, b = Vector(a), Vector(b)
        dx, dz = b - a
        d = (b - a).length
        n = Vector((-dz, dx)).normalized()
        count = max(1, math.ceil(d / 0.80))
        for i in range(count):
            v = a.lerp(b, i / count)
            w = a.lerp(b, (i + 1) / count)
            # A clipped, slightly crowned hedge in one continuous band.
            rows = []
            for q in (v, w):
                rows.append(
                    [
                        xyz(q.x + n.x * k, L + y, q.y + n.y * k)
                        for k, y in [
                            (-0.42, -0.018),
                            (-0.40, 0.79),
                            (-0.24, 1.05),
                            (0.24, 1.05),
                            (0.40, 0.79),
                            (0.42, -0.018),
                        ]
                    ]
                )
            for j in range(5):
                m.face(
                    (rows[0][j], rows[1][j], rows[1][j + 1], rows[0][j + 1]),
                    "hedgeTip" if j == 2 else "hedge",
                )
            p = v.lerp(w, 0.5)
            rod(t, (p.x, L + 1.02, p.y), (p.x, L + 2.83, p.y), 0.008, "graphite", 4)
        for y in (1.12, 1.7, 2.27, 2.82):
            rod(t, (a.x, L + y, a.y), (b.x, L + y, b.y), 0.012, "graphite", 4)
        for i in range(max(1, math.ceil(d / 3.1)) + 1):
            p = a.lerp(b, i / max(1, math.ceil(d / 3.1)))
            rod(t, (p.x, L - 0.04, p.y), (p.x, L + 2.89, p.y), 0.028, "graphite", 5)
        mid = (a + b) / 2
        obstacle(
            name + f"_{len(NEW_OBSTACLES)}",
            [
                [p.x, p.y]
                for p in [a + n * 0.43, a - n * 0.43, b - n * 0.43, b + n * 0.43]
            ],
            [L - 0.04, L + 2.9],
            "fence",
        )
    obj(m, name + "_ClippedHedge")
    obj(t, name + "_LightFence")


def palm(name, x, z, h, lean, seed):
    import random

    r = random.Random(seed)
    m, f = PALM_TRUNKS, PALM_CROWNS
    ground = ground_at(x, z)
    root = vec(x, ground - 0.025, z)
    levels = []
    for j in range(10):
        t = j / 9
        pos = root + Vector((lean[0] * t * t, -lean[1] * t * t, h * t))
        radius = 0.29 * (1 - t) + 0.16 * t + 0.095 * math.exp(-t * 15)
        levels.append(
            [
                pos
                + Vector(
                    (
                        math.cos(k * math.tau / 8) * radius,
                        math.sin(k * math.tau / 8) * radius,
                        0,
                    )
                )
                for k in range(8)
            ]
        )
    for j, (a, b) in enumerate(zip(levels, levels[1:])):
        for k in range(8):
            m.face(
                (a[k], a[(k + 1) % 8], b[(k + 1) % 8], b[k]),
                ["trunk", "trunkLight", "trunk", "trunkDark"][(j + k) % 4],
            )
    crown = root + Vector((lean[0], -lean[1], h))
    m.rod(
        crown - Vector((0, 0, 0.25)), crown + Vector((0, 0, 0.42)), 0.24, "trunkDark", 8
    )
    # Twelve broad, folded leaves read as authored polygon palms at both
    # street and aerial distances. No alpha cards or hair-thin fern leaflets.
    for j in range(12):
        angle = j * math.tau / 12 + r.uniform(-0.10, 0.10)
        axis = Vector((math.cos(angle), math.sin(angle), 0))
        wing = Vector((-axis.y, axis.x, 0))
        length = r.uniform(2.8, 3.7) * (h / 9.7) ** 0.24
        droop = 0.9 if j % 3 else 1.42
        rows = []
        for t in (0, 0.34, 0.69, 1):
            mid = crown + axis * length * t + Vector((0, 0, 1.0 * math.sin(t * math.pi) - droop * t * t))
            width = (0.61 + 0.1 * (j % 3)) * math.sin(math.pi * t) + 0.018
            ridge = mid + Vector((0, 0, width * 0.23))
            rows.append((mid - wing * width, ridge, mid + wing * width))
        for a, b in zip(rows, rows[1:]):
            f.face((a[0], b[0], b[1], a[1]), "palmDark" if j % 4 == 0 else "palm")
            f.face((a[1], b[1], b[2], a[2]), "palmLight" if j % 3 == 1 else "palm")
    empty(name, ROOT, xyz(x, ground, z), kind="foldedPolygonPalm")
    obstacle(name, ring(x, z, 0.44, 8), [ground, ground + h], "palmTrunk")


def agave(mesh, x, z, s, angle):
    root = vec(x, ground_at(x, z), z)
    for j in range(8):
        a = j * math.tau / 8 + angle
        d = Vector((math.cos(a), math.sin(a), 0))
        n = Vector((-d.y, d.x, 0))
        k = s * (0.72 + j % 3 * 0.12)
        b = root + d * 0.23 * k + Vector((0, 0, 0.29 * k))
        c = root + d * 0.48 * k + Vector((0, 0, 0.47 * k))
        tip = root + d * 0.69 * k + Vector((0, 0, 0.43 * k))
        mesh.face((root, b + n * 0.10 * k, c + n * 0.064 * k, tip, c), "agave")
        mesh.face((root, c, tip, c - n * 0.064 * k, b - n * 0.10 * k), "agaveShade")


def plantings():
    global PALM_TRUNKS, PALM_CROWNS
    PALM_TRUNKS, PALM_CROWNS = Mesh(), Mesh()
    # Shore, backdrop and pavilion groups; no fronds over the playing surfaces.
    palms = [
        (-38, -8, 9.2),
        (-32, -15, 11.1),
        (-24, -18, 9.9),
        (-10, -19, 10.8),
        (7, -19, 9.6),
        (24, -16, 11.3),
        (33, -8, 10.1),
        (36, 6, 9.3),
        (35, 17, 11.3),
        (41, 29, 9.6),
        (44, 43, 10.5),
        (42, 56, 8.8),
        (37.7, 66.4, 8.2),
        (-38, 5, 9.3),
        (-36, 18, 10.5),
        (-36, 39, 10.8),
        (-28, 47, 9.4),
        (-16, 50, 11.3),
        (-12, 35, 10.5),
        (-6, 53, 9.2),
        (14, 51, 9.9),
        (20, 41, 10.6),
        (15, 34, 9.2),
    ]
    for i, (x, z, h) in enumerate(palms):
        palm(
            f"AfterHours_Palm_{i + 1:02}",
            x,
            z,
            h,
            (math.sin(i * 1.37) * 0.87, math.cos(i * 2.05) * 0.55),
            i + 501,
        )
    obj(PALM_TRUNKS, "AfterHours_Palm_Trunks")
    obj(PALM_CROWNS, "AfterHours_Palm_FoldedCrowns")
    m = Mesh()
    for i, (x, z, s) in enumerate(
        [
            (-37, -11, 1.55),
            (-34, -8, 1.2),
            (-33, 18, 1.45),
            (-34, 36, 1.4),
            (-29, 40, 1.4),
            (-21, 49, 1.6),
            (-12, 54, 1.5),
            (-9, 52, 1.05),
            (7, 54, 1.45),
            (18, 53, 1.4),
            (20.5, 46.1, 1.3),
            (28, 44, 1.2),
            (33, 26, 1.3),
            (35, 31, 1.6),
            (43, 34, 1.4),
            (43, 48, 1.5),
            (43, 59, 1.45),
            (33, 69, 1.25),
            (28, 64, 1.4),
            (37, 12, 1.8),
            (35, -2, 1.35),
            (30, -14, 1.15),
        ]
    ):
        agave(m, x, z, s, i * 0.43)
        y = ground_at(x, z)
        obstacle(f"Agave_{i:02}", ring(x, z, 0.69 * s, 8), [y, y + 0.50 * s], "agave")
    obj(m, "AfterHours_AgaveBeds")



def polygon_distance(x, z, poly):
    within = False
    distance = 1e9
    for a, b in zip(poly, poly[1:] + poly[:1]):
        if (a[1] > z) != (b[1] > z) and x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]:
            within = not within
        dx, dz = b[0] - a[0], b[1] - a[1]
        t = min(1, max(0, ((x-a[0])*dx+(z-a[1])*dz) / max(1e-10,dx*dx+dz*dz)))
        distance = min(distance, math.hypot(x-a[0]-t*dx,z-a[1]-t*dz))
    return 0 if within else distance


def coastal_garden():
    import random
    r = random.Random(2763)
    leaves, flowers, grasses, stems, lamps = Mesh(), Mesh(), Mesh(), Mesh(), Mesh()
    # Reserve the complete exported ribbons and all real legacy paving cells,
    # furniture, cinema seating, court aprons and the open pavilion approaches.
    reserve = [x["polygon"] for x in LAYOUT["obstacles"] + LAYOUT["paving"]]
    reserve += [p for path in MESH_PATHS for p in path["segments"]]
    reserve += [ring(-1.55,42.55,7.65), rect(0,49,4.2,4), rect(9,43,8.3,9.5)]
    reserve += [x["polygon"] for x in NEW_OBSTACLES]
    def clear(x,z,radius):
        return inside(x,z) and shore_distance(x,z)>radius+.5 and all(polygon_distance(x,z,p)>radius+.20 for p in reserve)
    # Cohesive wind-shaped beds: perimeter of courts, middle garden border,
    # pavilion backdrop and the rocky tail. The central lawn stays usable.
    beds = [(-33,-7,3.4,6),(-18,-19,7,1.7),(5,-19,10,1.5),(31,-3,3.2,9),
            (-33,19,2.5,6),(-23,29,3.2,7),(-12,27,6.2,3.0),(5,28,7.4,3.2),
            (17,30,2.8,4.7),(-17,43,4.0,5.0),(-10,53,6,2), (7,53,6,2),
            (30,32,3.4,5),(35,44,3.5,7),(43,53,2.1,6),(34,65,5,3)]
    lanterns=[(-7.0,49.4),(3.0,51.8),(14.4,45.9)]
    planted=[]
    def leaf(mesh,x,y,z,a,length,width,h,tone):
        root=vec(x,y,z);axis=Vector((math.cos(a),math.sin(a),0));wing=Vector((-axis.y,axis.x,0))
        mid=root+axis*length*.51+Vector((0,0,h*.76));tip=root+axis*length+Vector((0,0,h*.60))
        ridge=mid+Vector((0,0,width*.38))
        mesh.face((root,mid-wing*width,ridge),tone)
        mesh.face((root,ridge,mid+wing*width),"leafLight")
        mesh.face((ridge,mid-wing*width,tip),tone)
        mesh.face((ridge,tip,mid+wing*width),"sage" if tone=="sage" else "leafLight")
    for kind,limit,rad in [("shrub",220,.68),("flower",100,.32),("grass",200,.22)]:
        count=0
        for attempt in range(7000):
            if count>=limit:break
            bx,bz,rx,rz=beds[attempt%len(beds)]
            a=r.random()*math.tau;d=math.sqrt(r.random())
            x,z=bx+math.cos(a)*rx*d,bz+math.sin(a)*rz*d
            scale=r.uniform(.8,1.18);radius=rad*scale
            if not clear(x,z,radius):continue
            if any(math.hypot(x-lx,z-lz)<radius+.5 for lx,lz in lanterns):continue
            if any(math.hypot(x-p[0],z-p[1]) < radius*.52+p[2]*.45 for p in planted):continue
            y=ground_at(x,z)-.012
            if kind=="shrub":
                for j in range(6):
                    leaf(leaves,x,y,z,j*2.399+a,.66*scale,.19*scale,(.32+j%3*.12)*scale,"sage" if count%5==0 else "leaf")
            elif kind=="flower":
                for j in range(2):
                    angle=a+j*2.399;dx,dz=math.cos(angle)*.12*scale,math.sin(angle)*.12*scale
                    top=y+(.34+j*.13)*scale;center=vec(x+dx,top,z+dz)
                    for k in range(4):
                        a0=k*math.tau/4+angle;axis=Vector((math.cos(a0),math.sin(a0),0));n=Vector((-axis.y,axis.x,0))
                        flowers.face((center,center+axis*.14*scale-n*.06*scale+Vector((0,0,.055*scale)),center+axis*.21*scale+Vector((0,0,.07*scale)),center+axis*.14*scale+n*.06*scale+Vector((0,0,.055*scale))),"pink" if count%3 else "poppy")
                    # One folded leaf supports each stem visually, no floating flowers.
                    leaf(leaves,x,y,z,angle,.22*scale,.055*scale,.24*scale,"leaf")
                    stems.face((vec(x-.008,y,z),vec(x+.008,y,z),center),"leaf")
            else:
                for j in range(2):
                    a0=a+j*2.399;h=(.18+j*.12)*scale
                    grasses.face((vec(x-.035,y,z),vec(x+.035,y,z),vec(x+math.cos(a0)*.16*scale,y+h,z+math.sin(a0)*.16*scale)),"leafLight" if count%3 else "dryGrass")
            planted.append((x,z,radius));count+=1
    for mesh,name in [(leaves,"AfterHours_Garden_FoldedLeaves"),(flowers,"AfterHours_Garden_Flowers"),(grasses,"AfterHours_Garden_Grasses"),(stems,"AfterHours_Garden_Stems")]:
        obj(mesh,name)
    # Low lanterns mark the two open entrances and cinema garden, within the
    # real warm pavilion/cinema light pools. Their soles use the terrain BVH.
    for i,(x,z) in enumerate(lanterns):
        if not clear(x,z,.22):continue
        y=ground_at(x,z)
        rod(lamps,(x,y-.015,z),(x,y+.82,z),.042,"timberDark",6)
        atbox(lamps,(x,y+.79,z),(.23,.06,.23),"copper")
        atbox(lamps,(x,y+1.07,z),(.29,.065,.29),"timberDark")
        for dx,dz in [(-.1,-.1),(-.1,.1),(.1,-.1),(.1,.1)]:
            rod(lamps,(x+dx,y+.82,z+dz),(x+dx,y+1.04,z+dz),.013,"timberDark",4)
        glow=Mesh();atbox(glow,(x,y+.93,z),(.145,.20,.145),"amber")
        obj(glow,f"AfterHours_Garden_LanternGlow_{i}",GLOW)
        obstacle(f"GardenLantern{i}",ring(x,z,.23,8),[y,y+1.11],"lamp")
    obj(lamps,"AfterHours_Garden_LanternFrames")
    return {"plants":len(planted),"bedCentres":beds,"actualGeometryPrefix":"AfterHours_Garden_","pavingMargin":.20}


def pavilion():
    cx, cz = -1.55, 42.55
    n = 32
    deck = L + 0.14
    column = 6.56
    radius = 7.2
    roof = 7.0
    # Subtle stone skirt with a flush timber deck and three broad access sectors.
    m, t, g, ro, glow = Mesh(), Mesh(), Mesh(), Mesh(), Mesh()

    def point(r, i, y):
        a = i * math.tau / n
        return xyz(cx + math.cos(a) * r, y, cz + math.sin(a) * r)

    def belt(mesh, a, b, y0, y1, tone):
        for i in range(n):
            mesh.face(
                (
                    point(a, i, y0),
                    point(b, i, y1),
                    point(b, i + 1, y1),
                    point(a, i + 1, y0),
                ),
                tone,
            )

    belt(m, radius, radius, L - 0.18, L + 0.015, "sandstone")
    belt(m, radius, 6.90, L + 0.015, L + 0.10, "stoneDeck")
    belt(m, 6.90, 6.85, L + 0.10, deck, "stoneDeck")
    m.face([point(6.85, i, deck) for i in reversed(range(n))], "timberWarm")
    # Physical millimetre plank reveals, cut to the round deck instead of rectangular slabs.
    for j in range(-22, 23):
        x = j * 0.295
        half = math.sqrt(max(0, 6.78**2 - x * x))
        rod(
            m,
            (cx + x, deck + 0.003, cz - half),
            (cx + x, deck + 0.003, cz + half),
            0.008,
            "timberDark",
            4,
        )
    # Opening along the southern lawn. Existing room and camera remain inside.
    open_panels = set(range(3, 13))
    for i in range(n):
        a = point(column, i, deck)
        b = point(column, i + 1, deck)
        aa = point(column, i, deck + 4.16)
        bb = point(column, i + 1, deck + 4.16)
        if i not in open_panels:
            g.face((a, b, bb, aa), "glassSmoke")
            t.rod(a, b, 0.025, "copper", 5)
        t.rod(aa, bb, 0.062, "timberDark", 6)
        if i not in open_panels and (i % 2 == 0 or i == 13):
            t.rod(a, aa, 0.091 if i % 4 else 0.129, "timberDark", 8)
            t.rod(
                a,
                a + Vector((0, 0, 0.11))
                if isinstance(a, Vector)
                else (a[0], a[1], a[2] + 0.11),
                0.137,
                "chrome",
                8,
            )
    # A shallow segmented disc/dome. Very fine incised rings catch a rim light.
    roofbase = deck + 4.26
    belt(ro, roof, roof, roofbase - 0.12, roofbase + 0.035, "vinylEdge")
    belt(t, 6.54, 6.90, roofbase - 0.27, roofbase - 0.135, "timberWarm")
    belt(t, 6.54, 6.54, roofbase - 0.27, roofbase - 0.10, "timberDark")
    belt(glow, 6.56, 6.59, roofbase - 0.273, roofbase - 0.265, "amber")
    for j in range(16):
        r0 = roof * (1 - j / 16)
        r1 = roof * (1 - (j + 1) / 16)
        h0 = roofbase + 1.90 * (1 - (r0 / roof) ** 2)
        h1 = roofbase + 1.90 * (1 - (r1 / roof) ** 2)
        belt(ro, r0, r1, h0, h1, "vinylShade" if j % 3 == 1 else "vinyl")
    label = roofbase + 1.885
    ro.rod((cx, -cz, label), (cx, -cz, label + 0.045), 0.91, "terracotta", 24)
    ro.rod((cx, -cz, label + 0.04), (cx, -cz, label + 0.33), 0.078, "chrome", 10)
    ro.rod((cx, -cz, label + 0.29), (cx, -cz, label + 0.47), 0.16, "chrome", 10)
    root = empty(
        "AfterHours_VinylPavilion",
        ROOT,
        stopId="listening",
        roof="shallow record dome",
        scope="exterior and deck only",
    )
    for mesh, name, mat in [
        (m, "AfterHours_Pavilion_DeckAndSkirt", MAT),
        (t, "AfterHours_Pavilion_MullionsAndEave", MAT),
        (g, "AfterHours_Pavilion_SmokedGlass", GLASS),
        (ro, "AfterHours_Pavilion_DomeDisc", ROOF),
        (glow, "AfterHours_Pavilion_EaveLight", GLOW),
    ]:
        obj(mesh, name, mat, root)
    for i in [i for i in range(n) if i not in open_panels and (i % 2 == 0 or i == 13)]:
        a = i * math.tau / n
        x = cx + column * math.cos(a)
        z = cz + column * math.sin(a)
        obstacle(
            f"PavilionMullion_{i}",
            ring(x, z, 0.14, 8),
            [deck, deck + 4.2],
            "pavilionColumn",
        )
    anchor("AfterHours_ListeningContentOrigin", [0, L, 43], wrapperOffsetOnly=True)
    anchor("AfterHours_ListeningDeck", [0, deck, 43])
    anchor("AfterHours_PavilionThreshold", [0, deck, 48.9])
    anchor("AfterHours_DiscPivot", [cx, roofbase, cz])
    anchor("AfterHours_PavilionCloseTarget", [-2.3, L + 1.45, 41.2])
    anchor("AfterHours_CinemaContentOrigin", [0, L, 43], wrapperOffsetOnly=True)
    return dict(
        center=[cx, deck, cz],
        radius=radius,
        roofRadius=roof,
        deckHeight=deck,
        glazingRadius=column,
        openSector=[3, 12],
        roofNode="AfterHours_Pavilion_DomeDisc",
        glazingNode="AfterHours_Pavilion_SmokedGlass",
        knownInterface="Hide legacy rectangular listening shell and wooden floor; mount existing furniture and interactions unchanged at +2.8m. Keep cinema original.",
    )


def lookout(name, x, z, y, rot):
    m = Mesh()
    d = 3.2
    w = 4.9
    for j in range(11):
        atbox(
            m,
            (x - w / 2 + 0.22 + j * 0.45, y - 0.072, z),
            (0.44, 0.14, d),
            "timberWarm",
        )
    for dx in (-2, 2):
        for dz in (-1.25, 1.25):
            rod(
                m,
                (x + dx, height(x + dx, z + dz) - 0.22, z + dz),
                (x + dx, y - 0.1, z + dz),
                0.13,
                "timberDark",
                8,
            )
    rail(m, (x - w / 2, y, z - d / 2), (x - w / 2, y, z + d / 2))
    rail(m, (x - w / 2, y, z + d / 2), (x + w / 2, y, z + d / 2))
    rail(m, (x + w / 2, y, z + d / 2), (x + w / 2, y, z - d / 2))
    obj(m, name)
    b = Mesh()
    g = empty(name + "_SunsetBench", ROOT, xyz(x, y, z + 0.4))
    g.rotation_euler.z = rot
    for yy in (-0.18, 0, 0.18):
        b.bevel_box((0, yy, 0.47), (1.8, 0.14, 0.08), 0.014, "timberWarm")
    for yy in (0.74, 0.91):
        b.box((0, 0.28, yy), (1.8, 0.055, 0.13), "timberWarm")
    for xx in (-0.68, 0.68):
        for yy in (-0.22, 0.23):
            b.rod((xx, yy, 0), (xx, yy, 0.45), 0.032, "timberDark", 6)
        b.rod((xx, 0.23, 0.35), (xx, 0.29, 1.01), 0.025, "timberDark", 6)
    obj(b, name + "_BenchSlats", parent=g)
    anchor("AfterHours_TipLookoutAnchor", [x, y, z - 0.8])
    anchor("AfterHours_TipBenchFocus", [x - 9, y + 0.35, z + 2])


def cove():
    # A restrained stone-to-wood connection into the one sand pocket.
    z = 29.7
    top = -24.8
    lower = -29.08
    bottom = 0.91
    step = (L - bottom) / 11
    m = Mesh()
    for i in range(11):
        high = L - i * step
        x = top - i * 0.39
        atbox(m, (x, high - 0.19, z), (0.39, 0.38, 2.95), "sandstone")
        rod(
            m,
            (x, high - 0.38, z - 1.2),
            (x, bottom - 0.8, z - 1.2),
            0.065,
            "timberDark",
            5,
        )
        rod(
            m,
            (x, high - 0.38, z + 1.2),
            (x, bottom - 0.8, z + 1.2),
            0.065,
            "timberDark",
            5,
        )
    obj(m, "AfterHours_CoveStairTreads")
    MESH_PATHS.append(
        dict(
            name="AfterHours_CoveStairTreads",
            width=2.95,
            segments=[rect(top - 1.95, z, 4.29, 2.95)],
        )
    )
    m = Mesh()
    for side in (-1, 1):
        rail(m, (top + 0.18, L, z + side * 1.5), (lower, bottom, z + side * 1.5))
    obj(m, "AfterHours_CoveStairRails")
    m = Mesh()
    start = -28.895
    end = -42.895
    for j in range(47):
        atbox(
            m,
            (start - 0.147 - j * 0.298, bottom - 0.085, z),
            (0.286, 0.17, 3.0),
            "timberWarm",
        )
    for x in (-30, -33.8, -37.6, -41.5):
        for dz in (-1.22, 1.22):
            rod(m, (x, -1, z + dz), (x, bottom - 0.07, z + dz), 0.13, "timberDark", 8)
    for side in (-1, 1):
        rail(
            m,
            (start, bottom, z + side * 1.48),
            (end + 0.04, bottom, z + side * 1.48),
            h=0.84,
        )
    obj(m, "AfterHours_KayakJetty")
    MESH_PATHS.append(
        dict(
            name="AfterHours_KayakJetty",
            width=3,
            segments=[rect((start + end) / 2, z, 14, 3)],
        )
    )
    # Grounded rack with two low-poly hulls, off the jetty landing approach.
    m = Mesh()
    x = -25.8
    z = 34.3
    y = height(x, z)
    for a in (-1.35, 1.35):
        for b in (-0.52, 0.52):
            rod(
                m,
                (x + a, y - 0.04, z + b),
                (x + a, y + 1.10, z + b),
                0.047,
                "timberDark",
            )
        for h in (0.40, 0.88):
            rod(
                m,
                (x + a, y + h, z - 0.62),
                (x + a, y + h, z + 0.62),
                0.053,
                "timberWarm",
            )
    for h, tone in [(0.52, "tealKayak"), (1.00, "ochreKayak")]:
        rows = []
        for k, w in [
            (-1.87, 0.015),
            (-1.3, 0.27),
            (-0.7, 0.4),
            (0.7, 0.4),
            (1.3, 0.26),
            (1.87, 0.015),
        ]:
            rows.append(
                [
                    xyz(x + k, y + h + off, z + w * side)
                    for side, off in [
                        (-1, 0),
                        (-0.45, -0.12),
                        (0.45, -0.12),
                        (1, 0),
                        (0, 0.065),
                    ]
                ]
            )
        for a, b in zip(rows, rows[1:]):
            for j in range(5):
                m.face((a[j], b[j], b[(j + 1) % 5], a[(j + 1) % 5]), tone)
    obj(m, "AfterHours_TwoKayaksOnRack")
    obstacle("KayakRack", rect(x, z, 3.8, 1.28), [y, y + 1.18], "rack")
    anchor("AfterHours_CoveJettyAnchor", [-40, bottom, 29.7])
    anchor("AfterHours_CoveStairTop", [top, L, 29.7])
    anchor("AfterHours_CoveStairBottom", [lower, bottom, 29.7])


def west_landing():
    # Low chamfered arrival apron; the shared bridge can terminate here later.
    cx, cz = -39.0, 12
    w, d = 5.1, 4.4
    cut = 0.5
    y = L + 0.021
    p = [
        [cx + x, cz + z]
        for x, z in [
            (-w / 2 + cut, -d / 2),
            (w / 2 - cut, -d / 2),
            (w / 2, -d / 2 + cut),
            (w / 2, d / 2 - cut),
            (w / 2 - cut, d / 2),
            (-w / 2 + cut, d / 2),
            (-w / 2, d / 2 - cut),
            (-w / 2, -d / 2 + cut),
        ]
    ]
    m = Mesh()
    m.face([xyz(x, y, z) for x, z in reversed(p)], "sandstone")
    for a, b in zip(p, p[1:] + p[:1]):
        m.face(
            (
                xyz(a[0], L - 0.15, a[1]),
                xyz(a[0], y, a[1]),
                xyz(b[0], y, b[1]),
                xyz(b[0], L - 0.15, b[1]),
            ),
            "stoneDeck",
        )
    obj(m, "AfterHours_WestBridgeLandingDeck")
    MESH_PATHS.append(
        dict(name="AfterHours_WestBridgeLandingDeck", width=d, segments=[p])
    )
    m = Mesh()
    for i, z in enumerate((9.0, 15.0)):
        x = -40.15
        y = ground_at(x, z)
        rod(m, (x, y - 0.02, z), (x, y + 2.9, z), 0.041, "graphite")
        atbox(m, (x, y + 2.87, z), (0.16, 0.22, 0.16), "amber")
        atbox(m, (x, y + 3.01, z), (0.24, 0.06, 0.24), "graphite")
        obstacle("WestLandingLamp" + str(i), ring(x, z, 0.09, 6), [y, y + 3.04], "lamp")
    obj(m, "AfterHours_WestLandingLamps")


def build():
    global ROOT, MAT, GLASS, ROOF, GLOW, GROUND_BVH
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ROOT = empty(
        "AfterHours_CoastRoot",
        units="metres",
        seaLevel=0,
        contentY=L,
        entertainmentZ=43,
    )
    MAT = kit.palette_material("AfterHours_MatteVertexPalette", 0.89)
    GLASS = kit.palette_material("AfterHours_LowReflectionGlass", 0.25, 0, 0.18)
    ROOF = kit.palette_material("AfterHours_MatteVinylRoof", 0.58, 0.18)
    GLOW = kit.palette_material("AfterHours_AmberEavePalette", 0.70, 0, 1, 0.14)
    ground = terrain()
    GROUND_BVH = BVHTree.FromPolygons(
        [v.co for v in ground.data.vertices],
        [tuple(p.vertices) for p in ground.data.polygons],
        all_triangles=True,
    )
    # These are the new connecting paths. Existing court and cinema/listening
    # paving cells stay in their imported footprints and are audited in JS.
    path(
        "AfterHours_WestLandingWalk",
        [[-38, 12], [-31, 12.2], [-26, 13], [-21, 13]],
        2.7,
        grade=lambda t, x, z: L + 0.015,
    )
    path(
        "AfterHours_CourtsToLawn",
        [[24, 13], [24, 22], [24, 34], [24, 50]],
        2.45,
        grade=lambda t, x, z: L + 0.022,
    )
    path(
        "AfterHours_LawnReturn",
        [[24, 50], [20, 50.25], [15.4, 49.4], [13, 49]],
        1.8,
        grade=lambda t, x, z: L + 0.026,
    )
    path(
        "AfterHours_CoveApproach",
        [[-27, 13], [-27.4, 19], [-25.4, 25], [-24.63, 29.7]],
        2.3,
        grade=lambda t, x, z: L + 0.019,
    )
    tail = path(
        "AfterHours_TailRidgePath",
        [
            [25.4, 24],
            [30.8, 29],
            [36.3, 38],
            [40, 48],
            [39.9, 56],
            [36.4, 62.2],
            [32.5, 65.7],
        ],
        1.48,
    )
    fence_run(
        "AfterHours_CourtHedge_NW",
        [
            [-24.2, 11.2],
            [-24.2, -9],
            [-22.2, -14.4],
            [20.8, -14.4],
            [26.9, -9],
            [26.9, 20.85],
            [25.55, 21.3],
        ],
    )
    fence_run(
        "AfterHours_CourtHedge_SW",
        [[22.45, 21.3], [-21.5, 21.3], [-24.2, 19.5], [-24.2, 14.75]],
    )
    west_landing()
    pav = pavilion()
    plantings()
    cove()
    garden = coastal_garden()
    last = tail[-1]
    tipx, tipz = 32.5, 67.0
    tipy = max(height(tipx, tipz), sum(p[1] for p in last) / len(last)) + 0.13
    lookout("AfterHours_TipDeck", tipx, tipz, tipy, -math.pi / 2)
    anchor("AfterHours_WestBridgeLanding", [-41.2, L + 0.021, 12])
    anchor("AfterHours_CourtContentOrigin", [0, L, 0])
    anchor("AfterHours_CoastArrivalCamera", [57, 40, -57])
    anchor("AfterHours_CoastArrivalTarget", [0, 2.8, 22])
    anchor("AfterHours_CinemaScreenAnchor", [9, L + 2, 41.171])
    anchor("AfterHours_TailEntry", [25.4, height(25.4, 24), 24])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    SRC.parent.mkdir(parents=True, exist_ok=True)
    STATS.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SRC))
    args = dict(
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
    )
    fields = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    bpy.ops.export_scene.gltf(**{k: v for k, v in args.items() if k in fields})
    stats = dict(
        asset="models/islands/after-hours-coast.glb",
        sourceBlend="asset-src/authored/after-hours-coast/after-hours-coast.blend",
        units="metres",
        seaLevel=0,
        courtContentTransform=[0, L, 0],
        entertainmentContentTransform=[0, L, 43],
        shoreOutline=[[round(p.x, 5), round(p.y, 5)] for p in SHORE],
        anchors=ANCHORS,
        newPaths=MESH_PATHS,
        obstacles=NEW_OBSTACLES,
        legacyReservation=LAYOUT,
        pavilion=pav,
        garden=garden,
        knownLimitations=[
            "Sports gameplay, seats, music and cinema are provided by existing runtime content, not baked here.",
            "The existing rectangular listening structure is replaced by a smaller dome so the actual cinema remains clear.",
            "Palms, pavilion and water-facing landmarks are static. No sea, photo textures, duplicate content or runtime integration is included.",
        ],
    )
    STATS.write_text(json.dumps(stats, indent=2) + "\n")


if __name__ == "__main__":
    build()
