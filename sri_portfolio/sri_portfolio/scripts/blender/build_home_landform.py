"""Home terrain in the architecture's original Three metre frame."""

import importlib.util
import json
import math
import random
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
from mathutils.bvhtree import BVHTree

APP = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "home_land_mesh", Path(__file__).with_name("build_made_studio.py")
)
kit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kit)
Mesh = kit.Mesh
kit.PALETTE.update(
    dict(
        grass="8D945E",
        high="7C8B57",
        shade="6D7E4D",
        rock="A59583",
        wet="8E877B",
        mortar="B4A798",
        coping="C9BDAA",
        joint="807467",
        stoneWarm="B09D83",
        stonePale="C4B09A",
        stoneCool="A69B8D",
        deckLight="BC936E",
        deckDark="A77F5C",
        walk="D3C7B4",
        trail="BDAE90",
        oakLeaf="73804E",
        oakLight="828F5B",
        oakTrunk="82705A",
        scrubDark="526044",
        scrub="697850",
        scrubTip="899365",
        leafSage="879A70", leafDeep="405F43", leafOlive="70834F",
        poppy="CF813E", poppyLight="D79856", lavender="927AA5", flowerStem="5C754B",
        outcropDark="867764",
        outcropLight="AE9E83",
        deck="AD825E",
        warm="FFD4A0",
    )
)
ARCH = json.loads((APP / "asset-src/stats/home-architecture.json").read_text())
SUMMIT_FLOOR = ARCH["summitFloorHeight"]
OUT = APP / "public/models/islands/home-landform.glb"
STATS = APP / "asset-src/stats/home-landform.json"
SOURCE = APP / "asset-src/authored/home-landform/home-landform.blend"
ANCHORS = {}
PATHS = []
OAKS = []
PLANTING = []
PLANT_RESERVATIONS = []
CONTROL = [
    (-64, -22),
    (-58, -44),
    (-45, -57),
    (-27, -66),
    (-6, -67),
    (16, -61),
    (35, -55),
    (52, -44),
    (63, -26),
    (66, -5),
    (67, 16),
    (66, 30),
    (61, 44),
    (48, 52),
    (25, 54),
    (6, 54),
    (-18, 54),
    (-42, 52),
    (-55, 47),
    (-63, 36),
    (-67, 19),
    (-66, -4),
]


def P(x, y, z):
    return (x, -z, y)


def smooth(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)


def rectdist(x, z, a, b, c, d):
    return math.hypot(max(a - x, 0, x - c), max(b - z, 0, z - d))


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def obj(mesh, name):
    return mesh.object(name, MAT, ROOT)


def box(m, p, s, t):
    m.box(P(*p), (s[0], s[2], s[1]), t)


def rod(m, a, b, r, t, n=6):
    m.rod(P(*a), P(*b), r, t, n)


def anchor(n, p):
    ANCHORS[n] = p
    return kit.empty(n, ROOT, P(*p), role="runtimeAnchor")


def curve(points, closed=True, spacing=2.3):
    p = [Vector(x) for x in points]
    out = []
    for i in range(len(p) if closed else len(p) - 1):
        a = p[(i - 1) % len(p)] if closed or i else p[0]
        b = p[i]
        c = p[(i + 1) % len(p)]
        d = p[(i + 2) % len(p)] if closed or i + 2 < len(p) else p[-1]
        n = max(2, math.ceil((c - b).length / spacing))
        for j in range(n):
            t = j / n
            out.append(
                0.5
                * (
                    2 * b
                    + (c - a) * t
                    + (2 * a - 5 * b + 4 * c - d) * t * t
                    + (3 * b - a - 3 * c + d) * t * t * t
                )
            )
    if not closed:
        out.append(p[-1])
    return out


SHORE = curve(CONTROL)

TRAIL_CONTROL = [
    [-43, 19.7],
    [-47, 10],
    [-46, -3],
    [-32, -7],
    [-39, -16],
    [-27, -20],
    [-33, -28],
    [-22, -34],
    [-12, -34],
    [0, -31.5],
]
TRAIL = curve(TRAIL_CONTROL, False, 0.78)
TRAIL_LENGTHS = [0]
for a, b in zip(TRAIL, TRAIL[1:]):
    TRAIL_LENGTHS.append(TRAIL_LENGTHS[-1] + (b - a).length)


def trail_profile(x, z):
    best = 1e6
    distance = 0
    for i, (a, b) in enumerate(zip(TRAIL, TRAIL[1:])):
        vx, vz = b - a
        t = min(1, max(0, ((x - a.x) * vx + (z - a.y) * vz) / (vx * vx + vz * vz)))
        d = (x - a.x - t * vx) ** 2 + (z - a.y - t * vz) ** 2
        if d < best:
            best = d
            distance = TRAIL_LENGTHS[i] + t * (TRAIL_LENGTHS[i + 1] - TRAIL_LENGTHS[i])
    return math.sqrt(best), 5.565 + (SUMMIT_FLOOR - 0.215 - 5.565) * distance / TRAIL_LENGTHS[-1]


def inside(x, z):
    yes = False
    for a, b in zip(SHORE, SHORE[1:] + SHORE[:1]):
        if (a.y > z) != (b.y > z) and x < (b.x - a.x) * (z - a.y) / (b.y - a.y) + a.x:
            yes = not yes
    return yes


def shore(x, z):
    d = 1e6
    for a, b in zip(SHORE, SHORE[1:] + SHORE[:1]):
        vx, vz = b - a
        t = min(1, max(0, ((x - a.x) * vx + (z - a.y) * vz) / (vx * vx + vz * vz)))
        d = min(d, math.hypot(x - a.x - t * vx, z - a.y - t * vz))
    return d


def level(x, z, d=None):
    d = shore(x, z) if d is None else d
    # The low harbor pad and upper stoop alley are held to the exact surveyed datum.
    waterfront = smooth((z - 40) / 11)
    base = -0.64 + (2.58 + 0.64) * smooth(d / (6.3 - waterfront * 4.65))
    if 22.60 <= z <= 49 and -53 <= x <= 51:
        base = 2.58
    # Landform from asymmetric rounded shoulders, with room for both rows.
    ax = 53 + 3 * math.sin(z * 0.15)
    az = 35 if z < -21 else 24
    hill = smooth(
        1 - math.hypot(max(0, abs(x + 2) - 10) / ax, max(0, abs(z + 21) - 6) / az)
    )
    hills = (
        (SUMMIT_FLOOR - 2.3) * hill + 2.8 * math.exp(-(((x + 36) / 17) ** 2) - ((z + 32) / 23) ** 2)
    ) * smooth(d / 13)
    value = base + hills
    # Terrace cut only near the building district. The west/east shoulders can rise.
    side = 1 - smooth((abs(x + 3) - 49) / 12)
    lower = smooth((z + 9.2) / 9.75)
    alley = 5.58 if z <= 22.46 else 5.58 - 3 * smooth((z - 22.46) / 0.14)
    if z >= -9.2:
        value = mix((value,), (alley if z <= 22.60 else base,), lower * side)[0]
    if -41 <= x <= 26 and 0.55 <= z <= 22.46:
        value = 5.58
    if -52 <= x <= 49 and 22.60 <= z <= 49:
        value = 2.58
    # The top under the house is lower than the slab, while the front rock shelf
    # reaches the bottom of the pool without coming through the infinity edge.
    summit = 1 - smooth(rectdist(x, z, -14.45, -32.1, 10.7, -8.1) / 6.7)
    roofpad = SUMMIT_FLOOR - .22 - 1.05 * smooth((z + 15) / 1.7)
    value = mix((value,), (roofpad,), summit)[0]
    if -52 < x < 3 and -39 < z < 22 and (z < -29.28 or x < -14.6):
        dist, grade = trail_profile(x, z)
        w = 1 - smooth((dist - 1.05) / 5.7)
        if -41.7 < x < 27 and 0.34 < z < 17.2:
            w = 0
        value = value + (grade - value) * w
    if 8.0 <= x <= 10.5 and -17.1 <= z <= -15.1:
        value = max(value, SUMMIT_FLOOR - .26)
    return value


def color(x, z, d, y):
    p = (
        0.5
        + 0.27 * math.sin(0.18 * x + 0.09 * z)
        + 0.16 * math.cos(0.19 * z - 0.08 * x)
    )
    grass = mix(
        kit.color("grass"), kit.color("high"), smooth((y - 3) / (SUMMIT_FLOOR - 3)) * 0.76 + p * 0.19
    )
    grass = mix(grass, kit.color("shade"), p * 0.17)
    rock = mix(kit.color("wet"), kit.color("rock"), smooth((y + 0.3) / 4))
    if 22.46 < z < 22.60 and -52 < x < 49:
        return kit.color("mortar")
    return mix(rock, grass, smooth((d - 1.8) / (6.8 - 3 * smooth((z - 35) / 13))))


def terrain():
    points = list(SHORE)
    n = len(points)
    edges = [(i, (i + 1) % n) for i in range(n)]

    def line(x0, x1, z, dx=2):
        start = len(points)
        count = math.ceil((x1 - x0) / dx)
        for j in range(count + 1):
            points.append(Vector((x0 + (x1 - x0) * j / count, z)))
        edges.extend((start + j, start + j + 1) for j in range(count))

    for z, x0, x1 in [
        (0.55, -41, 26),
        (16.1, -42, 27),
        (21.8, -52, 49),
        (22.45, -52, 49),
        (22.595, -52, 49),
        (22.61, -52, 49),
        (38.1, -52, 49),
        (39.7, -52, 49),
        (48.82, -52, 49),
        (-32.1, -14.45, 10.7),
        (-29.1, -14.45, 10.7),
        (-15, -14.45, 10.7),
        (-13.3, -14.45, 10.7),
        (-8.1, -14.45, 10.7),
    ]:
        line(x0, x1, z)
    for iz in range(-28, 23):
        for ix in range(-28, 29):
            x = ix * 2.54 + 0.34 * math.sin(iz * 1.56 + ix)
            z = iz * 2.56 + 0.37 * math.cos(ix * 1.24 - iz)
            if inside(x, z) and shore(x, z) > 0.2:
                points.append(Vector((x, z)))
    trail_start = len(points)
    for i, v in enumerate(TRAIL):
        t = (TRAIL[min(i + 1, len(TRAIL) - 1)] - TRAIL[max(i - 1, 0)]).normalized()
        normal = Vector((-t.y, t.x))
        for width in (0.925, 0, -0.925):
            points.append(v + normal * width)
        row = trail_start + i * 3
        edges.extend(((row, row + 1), (row + 1, row + 2)))
        if i:
            for j in range(3):
                edges.append((row - 3 + j, row + j))
            for j in range(2):
                edges.append((row - 3 + j, row + j + 1))
    for r in ARCH["reservations"]:
        x0, z0, x1, z1 = r["boundsXZ"]
        points.extend(Vector(p) for p in [(x0, z0), (x0, z1), (x1, z0), (x1, z1)])
    vs, _, fs, _, _, _ = delaunay_2d_cdt(points, edges, [list(range(n))], 1, 0.000015)
    coords = []
    tones = []
    for p in vs:
        d = shore(*p)
        y = level(*p, d)
        coords.append(P(p.x, y, p.y))
        tone = color(p.x, p.y, d, y)
        if -43 < p.x < 43 and -14 < p.y < 4 and 10 < y < 44:
            grade = abs(level(p.x, p.y + .45) - level(p.x, p.y - .45)) / .9
            stratum = .5 + .5 * math.sin(y * .55 + p.x * .075)
            mineral = mix(kit.color("outcropDark"), kit.color("outcropLight"), stratum)
            tone = mix(tone, mineral, .72 * smooth((grade - 1.05) / 1.4))
        tones.append(tone)
    faces = []
    for f in fs:
        if len(f) != 3:
            continue
        a, b, c = [Vector(coords[i]) for i in f]
        faces.append(f if (b - a).cross(c - a).z > 0 else list(reversed(f)))
    data = bpy.data.meshes.new("Home_ContinuousHill")
    data.from_pydata(coords, [], faces)
    data.materials.append(MAT)
    attr = data.color_attributes.new(
        name="PaletteColor", type="FLOAT_COLOR", domain="CORNER"
    )
    for poly in data.polygons:
        for i in poly.loop_indices:
            attr.data[i].color = tones[data.loops[i].vertex_index]
    data.color_attributes.active_color = attr
    data.color_attributes.render_color_index = 0
    o = bpy.data.objects.new("Home_ContinuousHill", data)
    bpy.context.scene.collection.objects.link(o)
    o.parent = ROOT
    return BVHTree.FromPolygons(
        [v.co for v in data.vertices], faces, all_triangles=True
    )


def ground(x, z):
    hit = BVH.ray_cast(Vector((x, -z, 75)), Vector((0, 0, -1)))[0]
    return hit.z if hit is not None else level(x, z)


def path(name, points, width, y=None, tone="walk"):
    ps = curve(points, False, 0.78 if y is None or name == "Home_SummitTrail" else 1.7)
    m = Mesh()
    rows = []
    for i, p in enumerate(ps):
        v = (ps[min(i + 1, len(ps) - 1)] - ps[max(0, i - 1)]).normalized()
        n = Vector((-v.y, v.x)) * width / 2
        rows.append(
            [
                (
                    q.x,
                    (
                        ground(*q) + 0.07
                        if y is None
                        else y(i / (len(ps) - 1), q.x, q.y)
                        if callable(y)
                        else y
                    ),
                    q.y,
                )
                for q in (p + n, p, p - n)
            ]
        )
    for a, b in zip(rows, rows[1:]):
        for j in (0, 1):
            p, q, r, s = map(lambda v: P(*v), (a[j], a[j + 1], b[j + 1], b[j]))
            m.face((p, r, q), tone)
            m.face((p, s, r), tone)
    obj(m, name)
    if name in {
        "Home_HarborPromenade",
        "Home_EastLandingWalk",
        "Home_DockApproach",
        "Home_WestAlleyRamp",
        "Home_EastAlleyRamp",
    }:
        # Support the surveyed grades with a retaining embankment at exposed edges.
        support = Mesh()

        def foot(p):
            return P(p[0], min(p[1] - 0.06, ground(p[0], p[2]) - 0.14), p[2])

        for a, b in zip(rows, rows[1:]):
            for j in (0, 2):
                u, v = a[j], b[j]
                support.face((P(*u), P(*v), foot(v), foot(u)), "mortar")
        for row in (rows[0], rows[-1]):
            for u, v in zip(row, row[1:]):
                support.face((P(*u), P(*v), foot(v), foot(u)), "mortar")
        obj(support, name + "_RetainingEdge")
    PATHS.append(dict(name=name, width=width, centerline=[list(a[1]) for a in rows], footprints=[[[v[0],v[2]] for v in tri] for a,b in zip(rows,rows[1:]) for tri in [(a[0],b[0],b[2]),(a[0],b[2],a[2])]]))
    return rows


def rail(m, ps, h=1.04):
    for a, b in zip(ps, ps[1:]):
        aa = Vector(a)
        bb = Vector(b)
        n = max(1, math.ceil((bb - aa).length / 1.75))
        for j in range(n):
            p = aa.lerp(bb, j / n)
            rod(m, p, p + Vector((0, h, 0)), 0.033, "graphite")
        for y in (0.43, h):
            rod(
                m,
                aa + Vector((0, y, 0)),
                bb + Vector((0, y, 0)),
                0.040 if y == h else 0.017,
                "deck",
            )


def harbor():
    path(
        "Home_HarborPromenade",
        [[-54, 44.3], [-23, 44.3], [9, 44.3], [36, 44.3], [53, 44.3]],
        9,
        2.61,
    )
    path(
        "Home_BackAlley",
        [[-42, 19.70], [-17, 19.70], [5, 19.70], [27, 19.70]],
        5.5,
        5.61,
    )
    path("Home_EastLandingWalk", [[52, 44], [57, 41], [60, 34], [62, 28]], 3.8, 2.63)
    path("Home_DockApproach", [[6, 47], [6, 52.9]], 4, 2.64)
    path(
        "Home_WestAlleyRamp",
        [[-53, 44.3], [-54, 34], [-54, 25], [-50, 19.7], [-42, 19.7]],
        2.6,
        lambda t, x, z: 2.63 + 2.99 * smooth((42 - z) / 21),
    )
    path(
        "Home_EastAlleyRamp",
        [[51, 44.3], [50, 31], [49, 23], [44, 19.7], [27, 19.7]],
        2.6,
        lambda t, x, z: 2.64 + 2.99 * smooth((33 - z) / 11),
    )
    for r in ARCH["reservations"]:
        x0, z0, x1, z1 = r["frontApproachXZ"]
        x = (x0 + x1) / 2
        path(
            r["name"] + "_WalkToStoop",
            [[x, z0 + 0.02], [x, 39.85 if r["row"] == "front" else 17.45]],
            1.65,
            r["ground"] + 0.023,
        )
    m = Mesh()
    masonry = Mesh()
    # A battered dressed stone edge follows the harbor's changing curve.
    for a, b in zip(SHORE, SHORE[1:] + SHORE[:1]):
        if min(a.y, b.y) < 44:
            continue
        dx, dz = b - a
        n = Vector((-dz, dx)).normalized()
        aa = a + n * 1.45
        bb = b + n * 1.45
        m.face(
            (P(a.x, -.35, a.y), P(aa.x, 2.41, aa.y),
             P(bb.x, 2.41, bb.y), P(b.x, -.35, b.y)),
            "joint",
        )
        length = (b-a).length
        count = math.ceil(length / 1.18)
        # Stagger the joints and pull the dressed faces slightly forward of
        # their mortar bed. No repeated cubes inside the wall.
        for course in range(5):
            bottom = course / 5 + .008
            top = (course + 1) / 5 - .008
            offset = .46 if course % 2 else 0
            for block in range(count + 1):
                lo = max(.002, (block-offset+.02)/count)
                hi = min(.998, (block+1-offset-.02)/count)
                if hi <= lo:
                    continue
                corners = []
                for u, v in [(lo,bottom), (lo,top), (hi,top), (hi,bottom)]:
                    base = a.lerp(b,u) + n * (v*1.45-.075)
                    corners.append(P(base.x, -.35+v*2.76, base.y))
                tone = ("stoneWarm","stonePale","stoneCool")[(block*7+course*2+int(a.x))%3]
                masonry.face(corners,tone)
        m.face(
            (
                P(aa.x, 2.41, aa.y),
                P(aa.x + n.x * 0.35, 2.58, aa.y + n.y * 0.35),
                P(bb.x + n.x * 0.35, 2.58, bb.y + n.y * 0.35),
                P(bb.x, 2.41, bb.y),
            ),
            "coping",
        )
    rail(m, [(-50, 2.59, 49), (-28, 2.59, 50), (-11, 2.59, 50.7), (3.8, 2.59, 50.7)])
    rail(m, [(8.2, 2.59, 50.7), (25, 2.59, 50.7), (44, 2.59, 49.6), (53, 2.59, 47.6)])
    obj(m, "Home_HarborSeawallCopingAndRail")
    obj(masonry, "Home_HarborDressedStone")
    seating = Mesh()
    for x in (-20, 16, 30):
        z = 49.51
        y = ground(x,z)
        for dx in (-.68,.68):
            box(seating,(x+dx,y+.21,z),(.07,.42,.38),"graphite")
            rod(seating,(x+dx,y+.40,z-.16),(x+dx,y+.87,z-.22),.027,"graphite")
        for dz in (-.135,0,.135):
            box(seating,(x,y+.45,z+dz),(1.72,.058,.118),"deck")
        for dy in (.65,.79):
            box(seating,(x,y+dy,z-.20),(1.72,.104,.055),"deckDark")
    obj(seating, "Home_WaterfrontBenches")
    m = Mesh()
    # Landing uses eight literal rises to meet the lower timber wharf.
    y = 1.35
    top = 2.6
    for i in range(8):
        h = top - (i + 1) * (top - y) / 8
        z = 53.05 + i * 0.35
        box(m, (6, h - 0.10, z), (3.6, 0.20, 0.352), "coping")
    for x in (4.13, 7.87):
        rail(m, [(x, top, 52.85), (x, y, 55.74)])
    for i in range(38):
        z = 55.8 + i * 0.402
        box(m, (6, y - 0.09, z), (4, 0.18, 0.392), ("deck", "deckDark", "deckLight", "deck")[i%4])
    for i in range(25):
        x = 1.1 + i * 0.402
        box(m, (x, y - 0.078, 69.5), (0.393, 0.18, 3.6), "deck")
    for x in (4.35, 7.65):
        for z in (56, 59.7, 63.5, 67.3, 70.4):
            rod(m, (x, -0.9, z), (x, y - 0.05, z), 0.135, "oakTrunk", 8)
        rail(m, [(x + (x - 6) * 0.12, y, 56), (x + (x - 6) * 0.12, y, 67.7)])
    for x in (1.2, 10.8):
        rod(m, (x, -0.9, 69.2), (x, y + 0.32, 69.2), 0.15, "oakTrunk", 8)
    obj(m, "Home_HarborPierAndStairs")
    landing = Mesh()
    # Shelter sits on the east wing. The center aisle and berth stay open.
    for x in (8.7, 10.5):
        for z in (68.25, 70.73):
            rod(landing, (x, y, z), (x, y + 2.25, z), .067, "oakTrunk", 6)
    for side in (-1, 1):
        eave = 9.6 + 1.15 * side
        roof = [P(eave, y + 2.21, 67.98), P(9.6, y + 2.70, 67.98),
                P(9.6, y + 2.70, 71.02), P(eave, y + 2.21, 71.02)]
        if side < 0:
            roof.reverse()
        underside = [(x, z, h-.095) for x,z,h in roof]
        landing.face(roof, "oakTrunk")
        landing.face(tuple(reversed(underside)), "deck")
        for j in range(4):
            k = (j+1)%4
            landing.face((roof[j], underside[j], underside[k], roof[k]), "oakTrunk")
    box(landing, (10.12, y + .46, 69.5), (.42, .09, 1.78), "deck")
    for z in (68.84, 70.15):
        box(landing, (10.12, y + .20, z), (.12, .40, .12), "oakTrunk")
    for x in (2.1, 7.3):
        rod(landing, (x, y + .06, 70.92), (x, y + .17, 70.92), .052, "graphite", 6)
        box(landing, (x, y + .17, 70.92), (.26, .06, .09), "graphite")
    obj(landing, "Home_HarborShelterAndMoorings")
    lamps = Mesh()
    for x in [-49, -37, -25, -13, -1, 12, 24, 36, 48]:
        z = 49.1
        g = ground(x, z)
        rod(lamps, (x, g, z), (x, g + 3.8, z), 0.041, "graphite")
        box(lamps, (x, g + 3.82, z), (0.17, 0.24, 0.17), "warm")
        box(lamps, (x, g + 3.96, z), (0.24, 0.05, 0.24), "graphite")
    obj(lamps, "Home_HarborPromenadeLamps")


def oak(x, z, h, i):
    y = ground(x, z)
    m = Mesh()
    r = 0.19 * h
    tr = Vector(P(x, y - 0.06, z))
    crown = tr + Vector((0.20 * math.sin(i), 0.28 * math.cos(i), h * 0.78))
    m.rod(tr, tr.lerp(crown, 0.62), r * 0.24, "oakTrunk", 8)
    m.rod(tr.lerp(crown, 0.55), crown, r * 0.135, "oakTrunk", 7)
    for j in range(5):
        a = j * math.tau / 5 + i * 0.48
        pos = crown + Vector(
            (r * (.74+.27*math.sin(i*.71+j)) * math.cos(a), r * (.70+.22*math.cos(i*.43+j)) * math.sin(a), r * 0.23 * math.sin(j + i))
        )
        fork=tr.lerp(crown,.42)+Vector((r*.22*math.cos(a),r*.22*math.sin(a),0))
        elbow=tr.lerp(crown,.62)+Vector((r*.54*math.cos(a),r*.48*math.sin(a),r*.07*math.sin(j)))
        m.rod(fork, elbow, r*.095, "oakTrunk", 6)
        m.rod(elbow, pos, r*.055, "oakTrunk", 5)
        rings = []
        for l, (zz, w) in enumerate(
            [(-0.58, 0.43), (-0.25, 0.9), (0.24, 0.76), (0.58, 0.38)]
        ):
            rings.append(
                [
                    pos
                    + Vector(
                        (
                            math.cos(k * math.tau / 7)
                            * r
                            * w
                            * (.95+.26*math.sin(i*.61+j*.82))
                            * (0.9 + 0.13 * math.sin(j + k)),
                            math.sin(k * math.tau / 7) * r * w * (.95+.21*math.cos(i*.72+j*.57)),
                            r * zz,
                        )
                    )
                    for k in range(7)
                ]
            )
        for aa, bb in zip(rings, rings[1:]):
            for k in range(7):
                m.face(
                    (aa[k], aa[(k + 1) % 7], bb[(k + 1) % 7], bb[k]),
                    "oakLight" if (j + k) % 4 == 0 else "oakLeaf",
                )
        m.face(rings[-1], "oakLight")
    obj(m, f"Home_LiveOak_{i:02}")
    OAKS.append(
        dict(
            name=f"Home_LiveOak_{i:02}",
            center=[x, y, z],
            crownRadius=r * 1.73,
            top=y + h * 0.9,
        )
    )


def rectangle(bounds):
    a,b,c,d=bounds
    return [[a,b],[c,b],[c,d],[a,d]]


def overlaps(a,b):
    for polygon in [a,b]:
        for p,q in zip(polygon,polygon[1:]+polygon[:1]):
            dx,dz=q[0]-p[0],q[1]-p[1]
            aa=[-dz*v[0]+dx*v[1] for v in a];bb=[-dz*v[0]+dx*v[1] for v in b]
            if min(max(aa),max(bb))<=max(min(aa),min(bb)):return False
    return True


def hillside_dressing():
    # All foliage uses the same BVH as the walking terrain; each leaf follows
    # its own piece of slope rather than floating on a horizontal plant disc.
    rng=random.Random(397)
    meshes={name:Mesh() for name in ["CoastalUnderstory","FlowerDrifts","BranchedShrubs","SlopeLeafMats"]}
    roots={name:[] for name in meshes}
    summit=ARCH["summitBounds"]
    boxes=[[summit["min"][0]-.25,summit["min"][2]-.25,summit["max"][0]+.25,summit["max"][2]+.25]]
    for house in ARCH["reservations"]:
        # Whole-building bounds include the projecting stair on only one side.
        # Reserve the actual facade/bay edge separately so both flanking
        # gardens remain plantable, while the entire stair stays clear.
        x0,z0,x1,z1=house["boundsXZ"]
        boxes.append([x0,z0,x1,z1-9.12+7.08])
        boxes.extend(house[key] for key in ("stoopXZ","frontApproachXZ") if key in house)
    boxes.extend([[x-1.1,49.05,x+1.1,50.4] for x in [-20,16,30]])
    PLANT_RESERVATIONS.extend(rectangle(b) for b in boxes)
    PLANT_RESERVATIONS.extend(poly for path in PATHS for poly in path["footprints"])
    # Also reserve the immediate trunk collars. Larger crowns naturally shade
    # the low understory without excluding an entire circular lawn.
    PLANT_RESERVATIONS.extend(rectangle([o["center"][0]-.4,o["center"][2]-.4,o["center"][0]+.4,o["center"][2]+.4]) for o in OAKS)
    cells={}
    def keys(poly):
        xs=[p[0] for p in poly];zs=[p[1] for p in poly]
        return [(x,z) for x in range(math.floor(min(xs)/4),math.floor(max(xs)/4)+1) for z in range(math.floor(min(zs)/4),math.floor(max(zs)/4)+1)]
    for i,poly in enumerate(PLANT_RESERVATIONS):
        for key in keys(poly):cells.setdefault(key,[]).append(i)
    # Interlocking contour bands make a wooded slope, leaving open grass
    # windows between colonies and clear, flower-lined approaches.
    banks=[(-34,-27,19,17),(-28,-10,20,14),(-8,-3,18,9),(17,-5,22,12),
           (33,-20,18,20),(45,-1,12,25),(-49,4,10,22),(0,-47,30,10)]
    # Deterministic clustered dart throwing: spatial bins accelerate rejection,
    # but positions never come from a grid. Variable separation lets colonies
    # overlap organically rather than resolving into cultivated rows.
    points=[(rng.uniform(-57,57),rng.uniform(-56,40)) for _ in range(17000)]
    for cx,cz,rx,rz in banks:
        for j in range(650):
            a=rng.random()*math.tau;r=math.sqrt(rng.random())
            points.append((cx+math.cos(a)*rx*r,cz+math.sin(a)*rz*r))
    # The full lawns beside each stair receive dense low planting, rather
    # than a few stems along the very front edge.
    for house in ARCH["reservations"]:
        x0,z0,x1,z1=house["boundsXZ"]
        for j in range(110):points.append((rng.uniform(x0+.3,x1-.3),rng.uniform(z1-1.65,z1+1.25)))
    rng.shuffle(points)
    accepted={}
    for x,zz in points:
        if not inside(x,zz) or shore(x,zz)<4:continue
        trail_distance,_=trail_profile(x,zz)
        bank=min(((x-a)/rx)**2+((zz-b)/rz)**2 for a,b,rx,rz in banks)
        edge=.90+.13*math.sin(x*.25+zz*.13)+.09*math.sin(zz*.4-x*.12)
        housing=13<zz<40 and -51<x<49
        trail_band=1.6<trail_distance<6.2 and zz<18
        if not (bank<edge or housing or trail_band):continue
        # Keep irregular gaps in the broad outer banks, never in the
        # narrow house gardens or summit-trail edging.
        if not housing and not trail_band and math.sin(x*.19+zz*.09)+math.cos(zz*.23-x*.11)>1.30:continue
        form="FlowerDrifts" if housing or (trail_band and trail_distance<3.8) else "BranchedShrubs" if math.sin(x*.18-zz*.14)>.56 else "CoastalUnderstory"
        scale=(.90+rng.random()*.18) if housing else (1.45+rng.random()*.45)
        radius=(.58 if form=="BranchedShrubs" else .43)*scale
        separation=(.46+rng.random()*.13) if housing else (.65+rng.random()*.25)
        cell=(math.floor(x/2),math.floor(zz/2))
        near=[p for dx in (-1,0,1) for dz in (-1,0,1) for p in accepted.get((cell[0]+dx,cell[1]+dz),[])]
        if any(math.hypot(x-a,zz-b)<(separation+d)*.5 for a,b,d in near):continue
        footprint=rectangle([x-radius-.12,zz-radius-.12,x+radius+.12,zz+radius+.12])
        candidates=set(i for key in keys(footprint) for i in cells.get(key,[]))
        if any(overlaps(footprint,PLANT_RESERVATIONS[i]) for i in candidates):continue
        y=ground(x,zz)
        if y<2.5:continue
        rim=[ground(x+dx*radius,zz+dz*radius) for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]]
        # On steep banks keep terrain-following leaves, not upright shrubs.
        # Rooted fronds drape down the actual slope instead of rejecting it.
        steep=max(rim)-min(rim)>radius*1.4
        if steep:
            # Deliberate unplanted windows separate the low mat colonies.
            # Neither their location nor the foliage follows sampling rows.
            if math.sin(x*.43+math.sin(zz*.23)*1.4)+.58*math.cos(zz*.37-x*.11)>1.24:continue
            form="SlopeLeafMats"
        accepted.setdefault(cell,[]).append((x,zz,separation))
        m=meshes[form];seed=len(PLANTING)
        h=((.42+rng.random()*.22) if form!="BranchedShrubs" else (.76+rng.random()*.34))*min(scale,1.45)
        def point(dx,dz,above):return P(x+dx,ground(x+dx,zz+dz)+above,zz+dz)
        if form not in ["BranchedShrubs","SlopeLeafMats"]:
            for j in range(9):
                angle=j*2.399+seed*.41;length=(.28+rng.random()*.14)*scale
                dx,dz=math.cos(angle),math.sin(angle)
                a=point(0,0,.015);b=point(dx*length*.55-dz*.075*scale,dz*length*.55+dx*.075*scale,h*.24)
                c=point(dx*length*.55+dz*.075*scale,dz*length*.55-dx*.075*scale,h*.24)
                ridge=point(dx*length*.6,dz*length*.6,h*.62);tip=point(dx*length,dz*length,h*.36)
                for tri,tone in [([a,b,ridge],"leafDeep"),([a,ridge,c],"leafOlive"),([b,tip,ridge],"leafSage"),([ridge,tip,c],"leafOlive")]:m.face(tri,tone)
        if form=="SlopeLeafMats":
            gx=(ground(x+.2,zz)-ground(x-.2,zz))/.4
            gz=(ground(x,zz+.2)-ground(x,zz-.2))/.4
            slope=max(.001,math.hypot(gx,gz));tx,tz=-gz/slope,gx/slope;nx,nz=gx/slope,gz/slope
            # A low continuous basal mat follows the terrain. Its long axis
            # follows the contour, so a metre of slope does not stretch a
            # single blade into a tall vertical stalk.
            reach=radius*.88
            across=min(.17,.23/slope)
            ring=[]
            for k in range(10):
                a=k*math.tau/10
                dx=tx*reach*math.cos(a)+nx*across*math.sin(a)
                dz=tz*reach*math.cos(a)+nz*across*math.sin(a)
                ring.append(point(dx,dz,.022))
            for k in range(10):m.face([point(0,0,.015),ring[k],ring[(k+1)%10]],"leafOlive" if k%3 else "scrub")
            for j in range(12):
                sign=-1 if j%2 else 1
                u=0 if j==0 else rng.uniform(-reach*.38,reach*.38)
                v=0 if j==0 else rng.uniform(-across*.3,across*.3)
                length=reach*rng.uniform(.36,.58)
                width=across*rng.uniform(.30,.55)
                def mat_point(along,cross,raise_y):return point(tx*(u+along)+nx*(v+cross),tz*(u+along)+nz*(v+cross),raise_y)
                a=mat_point(0,0,.015);b=mat_point(sign*length*.48,-width,.05);c=mat_point(sign*length*.48,width,.05)
                ridge=mat_point(sign*length*.53,0,.11);tip=mat_point(sign*length,0,.045)
                for tri,tone in [([a,b,ridge],"leafDeep"),([a,ridge,c],"leafOlive"),([b,tip,ridge],"leafSage"),([ridge,tip,c],"leafOlive")]:m.face(tri,tone)
        if form=="FlowerDrifts":
            poppy=math.sin(x*.16+zz*.22)>.0 or trail_band
            for j in range(3):
                a=j*2.399+seed*.27;dx,dz=math.cos(a)*.22*scale,math.sin(a)*.22*scale
                stem_y=ground(x+dx,zz+dz)+h
                rod(m,(x,y+.02,zz),(x+dx,stem_y,zz+dz),.012,"flowerStem",4)
                for k in range(5):
                    aa=k*math.tau/5+a;bb=(k+1)*math.tau/5+a
                    petal_radius=(.13 if poppy else .075)*min(scale,1.4);lift=.07 if poppy else .16
                    m.face([P(x+dx,stem_y-.025,zz+dz),P(x+dx+petal_radius*math.cos(aa),stem_y+lift,zz+dz+petal_radius*math.sin(aa)),P(x+dx+petal_radius*math.cos(bb),stem_y+lift,zz+dz+petal_radius*math.sin(bb))],("poppyLight" if k%3==0 else "poppy") if poppy else "lavender")
        if form=="BranchedShrubs":
            for j in range(4):
                a=j*2.399+seed*.27;dx,dz=math.cos(a)*.25*scale,math.sin(a)*.25*scale
                top=ground(x+dx,zz+dz)+h*(.75+.2*rng.random())
                rod(m,(x,y+.015,zz),(x+dx,top-.10,zz+dz),.022,"oakTrunk",5)
                for k in range(6):
                    aa=k*2.399+a;length=(.23+rng.random()*.09)*scale
                    root=P(x+dx,top-.17,zz+dz);ridge=P(x+dx+math.cos(aa)*length*.6,top+.045,zz+dz+math.sin(aa)*length*.6)
                    left=P(x+dx+math.cos(aa-.5)*length*.65,top-.04,zz+dz+math.sin(aa-.5)*length*.65)
                    right=P(x+dx+math.cos(aa+.5)*length*.65,top-.04,zz+dz+math.sin(aa+.5)*length*.65)
                    tip=P(x+dx+math.cos(aa)*length,top+.015,zz+dz+math.sin(aa)*length)
                    for tri,tone in [([root,left,ridge],"leafDeep"),([root,ridge,right],"leafOlive"),([ridge,left,tip],"leafSage"),([ridge,tip,right],"leafOlive")]:m.face(tri,tone)
        roots[form].append([round(x,4),round(y+.015,4),round(zz,4)])
        PLANTING.append(dict(center=[x,y,zz],radius=radius,form=form))
    for name,m in meshes.items():
        tree=obj(m,"Home_"+name);tree["plantRoots"]=roots[name]
    # Keep loader/debug semantic names, without preserving the old pyramids.
    for name in ["Home_HillsideCoastalScrub","Home_HillsideSandstone","Home_PaintedLadiesStoopGardens"]:kit.empty(name,ROOT)


def main():
    global ROOT, MAT, BVH
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ROOT = kit.empty("Home_LandformRoot", units="metres", seaLevel=0)
    MAT = kit.palette_material("HomeLand_MatteVertexPalette", 0.9)
    BVH = terrain()
    harbor()
    path(
        "Home_SummitTrail",
        TRAIL_CONTROL,
        1.85,
        y=lambda t, x, z: trail_profile(x, z)[1] + 0.058,
        tone="trail",
    )
    path("Home_SummitDoorWalk", [[0, -31.5], [0, -29.16]], 1.8,
         lambda t, x, z: ground(x, z) + .10)
    for i, (x, z, h) in enumerate(
        [
            (-50, -15, 7.4),
            (-45, -23, 8.0),
            (-53, -29, 7),
            (-47, -36, 8.8),
            (-41, -41, 8.4),
            (-30, -47, 9.1),
            (-18, -52, 7.8),
            (-6, -50, 8.7),
            (9, -48, 7.9),
            (23, -40, 8.7),
            (32, -34, 9.7),
            (42, -32, 8.3),
            (43, -24, 9),
            (33, -18, 7.5),
            (49, -14, 7.2),
            (45, -3, 7.4),
            (37, 2, 6.4),
            (53, 6, 7.3),
            (54, 17, 6),
            (58, 24, 4.8),
            (53, 34, 4.6),
            (-51, 1, 6),
            (-51, 12, 5.8),
            (-56, 18, 5.3),
            (-38, -31, 5.2),
            (-17, -37, 5.4),
            (-19, -18, 4.3),
            (17, -14, 5.3),
            (23, -8, 6.7),
            (33, -9, 6.3),
            (-58, 40, 3.9),
            (54, 48, 4.3),
        ]
    ):
        oak(x, z, h, i)
    hillside_dressing()
    for n, p in {
        "Home_HarborDockRoot": [6, 2.6, 53],
        "Home_FerryBerth": [6, 1.35, 69],
        "Home_BaySpanLanding": [62, 2.6, 28],
        "Home_SummitLineLower": [-50, 2.6, 44],
        "Home_CableWestSupport": [-57, ground(-57, 22), 22],
        "Home_CableHillSupport": [-55, ground(-55, -12), -12],
        "Home_CableNorthWestSupport": [-45, ground(-45, -45), -45],
        "Home_CableNorthEastSupport": [14, ground(14, -42), -42],
        "Home_SummitLineUpper": [14, ground(14, -20), -20],
        "Home_HillLineTop": [-22, ground(-22, -30), -30],
        "Home_SummitPathHead": [0, ground(0, -31.5) + .10, -31.5],
        "Home_ArrivalTarget": [0, 15, 9],
    }.items():
        anchor(n, p)
    for f in (OUT, STATS, SOURCE):
        f.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
    args = dict(
        filepath=str(OUT),
        export_format="GLB",
        export_yup=True,
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=True,
        export_active_vertex_color_when_no_material=True,
        export_extras=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_meshopt_compression_enable=False,
    )
    allowed = {
        p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties
    }
    bpy.ops.export_scene.gltf(**{k: v for k, v in args.items() if k in allowed})
    STATS.write_text(
        json.dumps(
            dict(
                asset="models/islands/home-landform.glb",
                source="asset-src/authored/home-landform/home-landform.blend",
                units="metres",
                seaLevel=0,
                architectureTransform=[0, 0, 0],
                architectureSHA=ARCH["sha256"],
                paths=PATHS,
                oaks=OAKS,
                planting=PLANTING,
                plantingReservations=PLANT_RESERVATIONS,
                anchors=ANCHORS,
                reservations=ARCH["reservations"],
                summitBounds=ARCH["summitBounds"],
            ),
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
