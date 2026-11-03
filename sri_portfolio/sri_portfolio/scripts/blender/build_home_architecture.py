"""Original Home architectural kit. Metres, Three +Z south; no reference pixels.
Run node scripts/build-home-architecture.mjs. Blender -Y maps to Three +Z.
"""
from __future__ import annotations
import json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector
APP = Path(__file__).resolve().parents[2]
SOURCE = APP / "asset-src/authored/home"
OUT = APP / "public/models/islands/home-architecture.glb"
STATS = APP / "asset-src/stats/home-architecture.json"
SUMMIT_FLOOR = 26.0  # Shared through exported anchors; the district remains at its original datum.
PALETTE = {
 "concrete":"F1ECE4", "plaster":"F5F0E8", "graphite":"3A3B3E", "glass":"B9D2CD",
 "water":"6FC3C4", "waterRim":"A9E2DC", "poolFloor":"CFE7E4", "timber":"A97852",
 "timberLight":"BB926D", "sand":"D8C3A0", "walnut":"77533F", "linen":"E9DFCC",
 "sage":"A9B89A", "rose":"D9A3A0", "butter":"E3C77E", "powder":"9DB4C8",
 "cream":"EFE2C8", "lilac":"B7AFC2", "roof":"5E5A5C", "roofSeam":"706B6C",
 "navy":"2E3F5C", "warm":"FFD9A0", "amber":"FFB547", "bronze":"8A6A48",
 "book":"B77D68",
 "step":"D8CFC4"
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

    def box(self, center, size, tone, omit=()):
        x, y, z = center
        a, b, c = [s / 2 for s in size]
        p = [(x + i * a, y + j * b, z + k * c)
             for i, j, k in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
                             (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]]
        faces = (
            ("bottom", (0, 3, 2, 1)), ("top", (4, 5, 6, 7)),
            ("south", (0, 1, 5, 4)), ("east", (1, 2, 6, 5)),
            ("north", (2, 3, 7, 6)), ("west", (3, 0, 4, 7)),
        )
        for name, indices in faces:
            if name not in omit:
                self.face([p[i] for i in indices], tone)

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


def wall(mesh, limits, origin, horizontal, normal, holes=(), tone="sand", depth=.3, joined=()):
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
            on_outer_boundary = (c == z0, b == u1, d == z1, a == u0)[edge]
            if on_outer_boundary and edge in joined:
                continue
            if not occupied.get(neighbor, False):
                k = (edge + 1) % 4
                mesh.face((front[edge], back[edge], back[k], front[k]), "concrete")


def frame(mesh, x0, x1, y, bottom, top, tone="graphite", width=.055):
    # Keep a narrow masonry reveal and butt the rails between the jambs.
    # Jambs and reveal must remain distinct after GLB position quantization.
    inset = .015
    x0, x1 = x0 + inset, x1 - inset
    bottom, top = bottom + inset, top - inset
    for x in (x0 + width / 2, x1 - width / 2):
        mesh.box((x, y, (bottom + top) / 2), (width, .075, top - bottom), tone)
    for z in (bottom + width / 2, top - width / 2):
        mesh.box(((x0 + x1) / 2, y, z), (x1 - x0 - 2 * width, .075, width),
                 tone, omit=("west", "east"))


def glass_quad(mesh, x0, x1, y, bottom, top):
    mesh.face(((x0, y, bottom), (x1, y, bottom), (x1, y, top), (x0, y, top)), "glass")


# Public geometry helpers accept Three-style coordinates (x east, y up, z south).
def B(m, p, s, tone, omit=()):
    m.box((p[0], -p[2], p[1]), (s[0], s[2], s[1]), tone, omit)
def F(m, coords, tone):
    m.face([(x,-z,y) for x,y,z in reversed(coords)],tone)
def G(m,coords,tone,depth=.24):
    # A facade polygon with real masonry depth and all reveal edges.
    rear=[(x,y,z-depth) for x,y,z in coords]
    F(m,coords,tone);F(m,list(reversed(rear)),tone)
    for i in range(len(coords)):
        j=(i+1)%len(coords)
        F(m,[coords[i],rear[i],rear[j],coords[j]],tone)

def R(m,a,b,r,tone,sides=6):
    m.rod((a[0],-a[2],a[1]),(b[0],-b[2],b[1]),r,tone,sides)
def E(name,parent,p,**extras):
    return empty(name,parent,(p[0],-p[2],p[1]),**extras)
def rail(m, glass, x0,x1,z,y,kind='glass'):
    R(m,(x0,y+1.1,z),(x1,y+1.1,z),.022,'graphite' if kind=='glass' else 'plaster')
    for i in range(max(2,math.ceil((x1-x0)/1.35)+1)):
        x=x0+(x1-x0)*i/(max(2,math.ceil((x1-x0)/1.35)+1)-1)
        B(m,(x,y+.55,z),(.035,1.1,.035),'graphite' if kind=='glass' else 'plaster')
    if kind=='glass': F(glass,[(x0,y+.08,z),(x1,y+.08,z),(x1,y+1.04,z),(x0,y+1.04,z)],'glass')
    else:
        R(m,(x0,y+.12,z),(x1,y+.12,z),.018,'plaster')
        n=math.ceil((x1-x0)/.28)
        for i in range(1,n):
            x=x0+(x1-x0)*i/n
            B(m,(x,y+.6,z),(.024,.96,.024),'plaster')
def chair(m,x,y,z,angle=0,tone='sand'):
    # Seat coordinates rotate about vertical: local front +Z.
    def p(a,b,c): return (x+a*math.cos(angle)+c*math.sin(angle),y+b,z-a*math.sin(angle)+c*math.cos(angle))
    B(m,p(0,.45,0),(.5,.12,.5),tone)
    # Rod frame makes orientation legible without inflated furniture.
    for a in [-.2,.2]:
        for c in [-.2,.2]: R(m,p(a,0,c),p(a,.43,c),.025,'walnut')
        R(m,p(a,.45,-.21),p(a,1,-.21),.025,'walnut')
    R(m,p(-.22,.9,-.21),p(.22,.9,-.21),.055,tone)
def table(m,x,y,z,w=2,d=1):
    B(m,(x,y+.76,z),(w,.08,d),'timberLight')
    for a in [-w*.4,w*.4]:
        for b in [-d*.35,d*.35]:B(m,(x+a,y+.36,z+b),(.07,.72,.07),'walnut')
def window(m,g,x0,x1,z,y0,y1,lit=False):
    # Deep frame and glass are actual apertures, not an opaque decal.
    frame(m,x0,x1,-z,y0,y1,'plaster',.07)
    F(g,[(x0+.07,y0+.07,z-.03),(x1-.07,y0+.07,z-.03),(x1-.07,y1-.07,z-.03),(x0+.07,y1-.07,z-.03)],'glass')
    mid = (x0 + x1) / 2
    B(m,(mid,(y0+y1)/2,z-.04),(.055,y1-y0-.17,.07),'plaster',omit=("bottom","top"))
    for x_left, x_right in ((x0+.085, mid-.0275), (mid+.0275, x1-.085)):
        B(m,((x_left+x_right)/2,y0+.9,z-.045),(x_right-x_left,.045,.06),
          'plaster',omit=("west","east"))
    B(m,((x0+x1)/2,y0-.04,z+.035),(x1-x0+.22,.09,.20),'plaster')
    if lit: F(m,[(x0+.13,y0+.12,z-.22),(x1-.13,y0+.12,z-.22),(x1-.13,y1-.12,z-.22),(x0+.13,y1-.12,z-.22)],'warm')

def townhouse(index,w,tone,root,mat,glassmat):
    structure, glazing=Mesh(),Mesh()
    # Local ground zero. South facade at +6; stoop extends to +9.12.
    floor,eave,ridge=1.02,9.0,12.5
    B(structure,(0,.51,0),(w,1.02,12),'step',omit=('top',))
    for yy in [floor,3.68,6.34]:
        B(structure,(0,yy-.09,0),(w-.32,.18,11.6),'plaster')
    doorx=-w*.32 if index%2==0 else w*.32
    bayx=w*.13 if index%2==0 else -w*.13
    groundholes=[(doorx-.57,doorx+.57,floor,floor+2.4),(bayx-1.6,bayx+1.6,floor+.45,floor+2.25)]
    upperholes=[(-1.75,1.75,yy+.12,yy+2.3) for yy in [3.68,6.34]]
    wall(structure,(-w/2,w/2,1.02,eave),(0,-5.88,0),(1,0,0),(0,-1,0),groundholes+upperholes,tone,.24,joined=(0,1,2,3))
    for side in [-1,1]:
        holes=[(-1.2,1.2,yy+.55,yy+2.15) for yy in [floor,3.68,6.34]]
        wall(structure,(-5.88,5.88,1.02,eave),(side*(w/2-.12),0,0),(0,1,0),(side,0,0),holes,tone,.24,joined=(0,1,2,3))
        # inset side windows, each with casing and a central division
        for yy in [floor,3.68,6.34]:
            x=side*(w/2-.13)
            F(glazing,[(x,yy+.55,-1.2),(x,yy+2.15,-1.2),(x,yy+2.15,1.2),(x,yy+.55,1.2)],'glass')
            for z in [-1.2,0,1.2]:B(structure,(side*w/2,yy+1.35,z),(.08,1.75,.07),'plaster')
            for y in [yy+.55,yy+2.15]:B(structure,(side*w/2,y,0),(.08,.08,2.5),'plaster')
    # Rear has a real centered service door and room windows.
    rearholes=[(-.55,.55,floor,floor+2.4),(-3.2,-1.2,4.2,5.8),(1.2,3.2,7,8.6)]
    wall(structure,(-w/2,w/2,floor,eave),(0,5.88,0),(1,0,0),(0,1,0),rearholes,tone,.24,joined=(0,1,2,3))
    B(structure,(0,floor+1.2,-5.95),(1.06,2.4,.07),'navy',omit=('top','bottom'))
    for x,y in [(-2.2,4.2),(2.2,7)]:
        F(glazing,[(x-1,y,-5.95),(x+1,y,-5.95),(x+1,y+1.6,-5.95),(x-1,y+1.6,-5.95)],'glass')
    # Gable is a thick wall, with a genuinely cut square attic aperture.
    aw=.52
    for side in [-1,1]:
        a=side*w/2
        G(structure,[(a,eave,6),(side*aw,eave,6),(side*aw,10.65,6)],tone)
        G(structure,[(a,eave,6),(side*aw,10.65,6),(side*aw,ridge-3.5*aw/(w/2),6)],tone)
    B(structure,(0,9.65,5.88),(1.04,1.3,.24),tone)
    G(structure,[(-aw,11.7,6),(aw,11.7,6),(aw,ridge-3.5*aw/(w/2),6),(0,ridge,6),(-aw,ridge-3.5*aw/(w/2),6)],tone)
    window(structure,glazing,-aw,aw,6.03,10.3,11.7,index%3==0)
    G(structure,[(-w/2,eave,-5.76),(w/2,eave,-5.76),(0,ridge,-5.76)],tone)
    # Roof has physical thickness, quiet standing seams, continuous plain barge boards.
    for side in [-1,1]:
        x=side*(w/2+.24)
        roofpts=[(0,ridge+.14,-6.3),(0,ridge+.14,6.3),(x,eave+.05,6.3),(x,eave+.05,-6.3)]
        F(structure,roofpts,'roof')
        F(structure,[(px,py-.12,pz) for px,py,pz in reversed(roofpts)],'roof')
        for j in range(4):
            a,b=roofpts[j],roofpts[(j+1)%4]
            F(structure,[a,b,(b[0],b[1]-.12,b[2]),(a[0],a[1]-.12,a[2])],'roof')
        for z in [-6.3,6.3]: R(structure,(0,ridge+.1,z),(x,eave+.02,z),.075,'plaster',4)
        for j in range(1,8):
            xx=x*j/8; yy=ridge+.14+(eave+.05-ridge-.14)*j/8
            R(structure,(xx,yy+.015,-6.2),(xx,yy+.015,6.2),.012,'roofSeam',4)
    R(structure,(0,ridge+.15,-6.32),(0,ridge+.15,6.32),.055,'roofSeam',6)
    B(structure,(0,eave-.05,6.06),(w+.2,.16,.16),'plaster')
    # Entry recess, door panel, transom, brass handle and a six-step stoop.
    B(structure,(doorx,floor+1.18,5.78),(1,2.36,.09),'navy' if index%2 else 'walnut',omit=('bottom',))
    frame(structure,doorx-.57,doorx+.57,-6.015,floor,floor+2.4,'plaster',.085)
    B(structure,(doorx+.35,floor+1.03,5.86),(.025,.24,.05),'bronze')
    B(structure,(doorx,floor-.05,6.42),(1.7,.1,1.04),'step')
    F(structure,[(doorx-.57,floor,5.8),(doorx+.57,floor,5.8),
                 (doorx+.57,floor,5.9),(doorx-.57,floor,5.9)],'step')
    for i in range(6):
        h=(6-i)*.17;B(structure,(doorx,h/2,7.09+i*.30),(1.7,h,.30),'step')
    for side in [-1,1]:
        x=doorx+side*.78
        R(structure,(x,1.97,6.9),(x,.98,8.88),.028,'plaster')
        for j in range(4):
            z=6.95+j*.6;h=max(0,1.02-(z-6.95)*.51)
            B(structure,(x,h+.48,z),(.04,.96,.04),'plaster')
    # Three-sided bay: outer panes are angled 30 degrees, with a deep sill/canopy.
    pts=[(bayx-1.6,6),(bayx-1.16,6.76),(bayx+1.16,6.76),(bayx+1.6,6)]
    for j in range(3):
        a,b=pts[j],pts[j+1]
        F(glazing,[(a[0],floor+.5,a[1]),(b[0],floor+.5,b[1]),(b[0],floor+2.25,b[1]),(a[0],floor+2.25,a[1])],'glass')
        for yy in [floor+.43,floor+2.3]: R(structure,(a[0],yy,a[1]),(b[0],yy,b[1]),.065,'plaster',4)
        B(structure,(a[0],floor+1.35,a[1]),(.075,1.9,.075),'plaster')
    B(structure,(pts[-1][0],floor+1.35,pts[-1][1]),(.075,1.9,.075),'plaster')
    # Shallow upper balconies: 0.9m deep, framed French doors and slim rails.
    for k,yy in enumerate([3.68,6.34]):
        window(structure,glazing,-1.75,1.75,6.01,yy+.12,yy+2.3,(index+k)%3==0)
        B(structure,(0,yy-.06,6.45),(w*.74,.2,1.05),'plaster')
        rail(structure,glazing,-w*.37,w*.37,6.96,yy,'white')
        for x in [-w*.37,w*.37]:
            R(structure,(x,yy+1.1,6.0),(x,yy+1.1,6.96),.022,'plaster')
    # Modest casing, horizontal shadow breaks and one chimney distinguish the kit.
    for yy in [3.52,6.18]:B(structure,(0,yy,6.03),(w-.04,.09,.12),'plaster')
    B(structure,(w*.27,11.9,-3.4),(.65,1.55,.7),'step')
    B(structure,(w*.27,12.68,-3.4),(.8,.12,.85),'plaster')
    structure.object(f'Rowhouse_{index:02d}_Shell',mat,root)
    glazing.object(f'Rowhouse_{index:02d}_Glazing',glassmat,root)


def summit(root,mat,glassmat,watermat,glowmat):
    shell,detail,glass,water,glow=Mesh(),Mesh(),Mesh(),Mesh(),Mesh()
    plates=[(0,0,0,24,14),(-2,3.6,-.8,20,12),(1,7.2,-1.2,16,11),(1,10.8,-1.2,16.8,11.6)]
    for i,(x,y,z,w,d) in enumerate(plates):
        # Consistent 2cm edge bevel; single continuous concrete band.
        if i in [1,2]:
            # A real opening follows the full staircase run; every floor has a landing.
            left,right,north,south=x-w/2,x+w/2,z-d/2,z+d/2
            for x0,x1,z0,z1 in [(left,4.1,north,south),(5.5,right,north,south),(4.1,5.5,north,-5.55),(4.1,5.5,-.5,south)]:
                shell.bevel_box(((x0+x1)/2,-(z0+z1)/2,y-.24),(x1-x0,z1-z0,.48),.02,'concrete')
        else: shell.bevel_box((x,-z,y-.24),(w,d,.48 if i<3 else .55),.02,'concrete')
    for level,(cx,y,cz,w,d) in enumerate(plates[:3]):
        south=cz+d/2-2.2;north=cz-d/2+.6;left=cx-w/2+.6;right=cx+w/2-.6
        top=y+3.12
        # The north shear core and narrow piers reveal a support path.
        wall(shell,(left,right,y,top),(0,-north,0),(1,0,0),(0,1,0),[(1.4,2.6,y,y+2.7)] if level==0 else [],'plaster',.3)
        for xx in [left,right]:B(shell,(xx,y+1.56,north-.1),(.24,3.12,.45),'concrete')
        for j in range(math.ceil((right-left)/1.5)+1):
            xx=left+(right-left)*j/math.ceil((right-left)/1.5)
            B(detail,(xx,y+1.56,south),(.06,3.12,.08),'graphite')
        for yy in [y+.05,top-.02]:B(detail,(cx,yy,south),(right-left,.07,.08),'graphite')
        F(glass,[(left,y+.1,south),(right,y+.1,south),(right,top-.06,south),(left,top-.06,south)],'glass')
        # Both long-side returns are fully glazed, mullions exactly spaced in metres.
        for xx in [left,right]:
            F(glass,[(xx,y+.1,north),(xx,y+.1,south),(xx,top-.06,south),(xx,top-.06,north)],'glass')
            nn=math.ceil((south-north)/1.5)
            for j in range(nn+1):B(detail,(xx,y+1.56,north+(south-north)*j/nn),(.08,3.12,.06),'graphite')
            B(detail,(xx,top-.02,(north+south)/2),(.08,.07,south-north),'graphite')
        # Front and side balustrades; north entry remains unblocked.
        rail(detail,glass,cx-w/2+.15,cx+w/2-.15,cz+d/2-.12,y)
        for xx in [cx-w/2+.14,cx+w/2-.14]:
            R(detail,(xx,y+1.1,cz+d/2-.12),(xx,y+1.1,north),.022,'graphite')
            for zz in [north,cz,cz+d/2-.12]:B(detail,(xx,y+.55,zz),(.035,1.1,.035),'graphite')
        # Thin timber floor joins maintain material scale without high subdivision.
        for j in range(math.floor((right-left)/.3)):
            xx=left+j*.3
            F(detail,[(xx,y+.006,north+.2),(xx+.294,y+.006,north+.2),(xx+.294,y+.006,south-.15),(xx,y+.006,south-.15)],'timberLight' if j%5==0 else 'timber')
    # Actual north entry door reserves a 1.5m approach; no rail crosses it.
    B(shell,(2,1.35,-6.26),(1.2,2.7,.1),'timber',omit=('west','east','top','bottom'))
    B(detail,(2.43,1.12,-6.34),(.025,.36,.05),'bronze')
    # Raked side strut (a broad engineered wedge rather than a floating rod).
    a=[(11,0,6),(10.1,0,6),(7.2,6.96,-1.7),(8.4,6.96,-1.7)]
    for zz in [-.7,.7]:F(shell,[(x,y,z+zz) for x,y,z in a],'concrete')
    for i in range(4):
        j=(i+1)%4
        F(shell,[(a[i][0],a[i][1],a[i][2]-.7),(a[j][0],a[j][1],a[j][2]-.7),(a[j][0],a[j][1],a[j][2]+.7),(a[i][0],a[i][1],a[i][2]+.7)],'concrete')
    # Real stairwell slots in floor are represented by an external rear stair tower.
    # Compact landings leave 1.2m width behind the furnished rooms.
    for lev in [0,1]:
        yy=lev*3.6
        for i in range(20):B(detail,(4.8,yy+(i+1)*.18-.06,-5.4+i*.25),(1.2,.12,.28),'step')
        R(detail,(5.4,yy+1,-5.4),(5.4,yy+4.42,-.65),.025,'graphite')
        for xx in [4.25,5.35]:R(detail,(xx,yy-.08,-5.54),(xx,yy+3.48,-.51),.065,'graphite',4)
    # Pool support fascia and actual basin walls, not a floating cyan tile.
    # The basin lining is the exposed skin. Do not cap its surrounding
    # support slabs on those same inside planes.
    for x0,x1,z0,z1,omitted in [
        (-9,-7,7,13.5,("east",)), (7,9,7,13.5,("west",)),
        (-7,7,7,9,("east","west","south")),
    ]:
        B(shell,((x0+x1)/2,-.52,(z0+z1)/2),(x1-x0,.6,z1-z0),
          'concrete',omit=omitted)
    B(shell,(0,-.62,8.88),(14,1.2,.24),'waterRim',omit=("east","west"))
    B(shell,(0,-1.15,11.25),(14,.18,4.5),'poolFloor',
      omit=("east","west","south","north"))
    for xx in [-7.12,7.12]:
        B(shell,(xx,-.55,11.25),(.24,1.25,4.5),'waterRim',
          omit=("north","south"))
    B(shell,(0,-.62,13.58),(14.5,1.2,.16),'concrete')
    F(water,[(-7,-.02,9),(7,-.02,9),(7,-.02,13.5),(-7,-.02,13.5)],'water')
    F(water,[(-7,-.04,13.51),(7,-.04,13.51),(7,-.55,13.51),(-7,-.55,13.51)],'waterRim')
    for x0,x1,z0,z1 in [(-9,9,7,9),(-9,-7,9,13.5),(7,9,9,13.5)]:
        for j in range(math.ceil((x1-x0)/.25)):
            x=x0+j*.25
            B(detail,(x+.121,.014,(z0+z1)/2),(min(.242,x1-x),.028,z1-z0),'timber')
    rail(detail,glass,-9,9,13.64,0)
    # Two purposeful loungers placed within the 2m north strip; face the pool.
    for x in [-3.7,-.9]:
        B(detail,(x,.3,8.02),(.76,.14,1.6),'concrete')
        B(detail,(x,.41,8.02),(.7,.1,1.5),'sand')
        for xx in [x-.29,x+.29]:
            for zz in [7.5,8.55]:B(detail,(xx,.15,zz),(.06,.3,.06),'graphite')
        # backrest rises away from water
        F(detail,[(x-.35,.43,7.3),(x+.35,.43,7.3),(x+.35,.79,7.64),(x-.35,.79,7.64)],'sand')
    B(detail,(-2.3,.34,8.05),(.45,.07,.45),'timberLight')
    # Umbrella is an eight-panel taut canopy, shallow and true scale.
    R(detail,(-6,0,7.9),(-6,2.25,7.9),.025,'bronze')
    for i in range(8):
        a=i*math.tau/8;b=(i+1)*math.tau/8
        F(detail,[(-6,2.4,7.9),(-6+1.2*math.cos(a),2.12,7.9+1.2*math.sin(a)),(-6+1.2*math.cos(b),2.12,7.9+1.2*math.sin(b))],'sand')
    # L1 kitchen, dining and south-facing lounge are visible through the glazing.
    B(detail,(-5.2,.48,-3),(4.8,.96,1.2),'concrete')
    B(detail,(-5.2,.99,-3),(5,.07,1.34),'linen')
    R(detail,(-5,.99,-3),(-5,1.26,-3),.2,'graphite',10)
    table(detail,2.2,0,-2,2.6,1.1)
    # Six chairs: three per long side, all turned toward the table.
    for xx in [1.35,2.2,3.05]:
        chair(detail,xx,0,-3.05,0);chair(detail,xx,0,-.95,math.pi)
    B(detail,(-5,.28,1),(3.3,.45,1),'sand');B(detail,(-5,.7,.55),(3.3,.72,.2),'sand')
    # The visible woven surface remains above the timber after quantization.
    F(detail,[(-7.3,.0325,1.2),(-2.7,.0325,1.2),(-2.7,.0325,3.6),
              (-7.3,.0325,3.6)],'linen')
    table(detail,-5,0,2.3,1.25,.65)
    # A five-shelf bookcase with plain, varied spines; no fabricated titles.
    for y in [3.65,4.16,4.67,5.18,5.69,6.2]:B(detail,(-9.4,y,-.4),(.4,.06,4),'timberLight')
    for zz in [-2.4,1.6]:B(detail,(-9.4,4.95,zz),(.4,2.6,.07),'timberLight')
    for k in range(5):
        for j in range(14):B(detail,(-9.35,3.84+k*.51,-2.2+j*.26),(.3,.29+(j%3)*.035,.11+(.02*(j%2))),
              ['sage','rose','cream','book','powder'][j%5],omit=('bottom',))
    # L3 linen bed and reading chair stay within the smaller glass envelope.
    B(detail,(1,7.46,-3.2),(2.1,.4,2.4),'walnut');B(detail,(1,7.73,-3.2),(2,.25,2.3),'linen')
    B(detail,(1,8.05,-4.3),(2.1,1.1,.13),'sand')
    for xx in [.5,1.5]:B(detail,(xx,7.92,-3.95),(.65,.16,.4),'cream')
    chair(detail,4.5,7.2,-2,math.pi/2)
    # Roof stair/plant box and amber octagonal beacon.
    B(shell,(5,11.9,-4.3),(3,2.2,2.4),'concrete')
    R(detail,(5,13,-4.3),(5,14.2,-4.3),.055,'bronze',8)
    R(glow,(5,14.2,-4.3),(5,14.7,-4.3),.25,'amber',8)
    R(detail,(5,14.72,-4.3),(5,14.8,-4.3),.3,'bronze',8)
    for i in range(8):
        a=i*math.tau/8
        R(detail,(5+.24*math.cos(a),14.18,-4.3+.24*math.sin(a)),(5+.24*math.cos(a),14.72,-4.3+.24*math.sin(a)),.012,'bronze',4)
    for name,m,material in [('Structure',shell,mat),('CraftAndInteriors',detail,mat),('Glazing',glass,glassmat),('PoolWater',water,watermat),('BeaconAndScreens',glow,glowmat)]:m.object('Summit_'+name,material,root)


def make():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    root=empty('HomeArchitecture_Root',units='metres',coordinateSystem='Three X east Y up Z south')
    mat=palette_material('Home_MattePalette',.85)
    glass=palette_material('Home_GlassPalette',.17,0,.20)
    water=palette_material('Home_PoolPalette',.23,0,.85)
    glow=palette_material('Home_LightPalette',.7,0,1,1.2)
    anchors={}
    summitroot=E('Summit_Root',root,(-2,SUMMIT_FLOOR,-22),role='architectureModule')
    summit(summitroot,mat,glass,water,glow)
    for name,p in {'Summit_EntryAnchor':[0,SUMMIT_FLOOR,-29.1],'Summit_DeskAnchor':[-4,SUMMIT_FLOOR+4.36,-21.1],
        'Summit_BookshelfAnchor':[-11.4,SUMMIT_FLOOR+4.9,-22.4],'Summit_PoolAnchor':[-2,SUMMIT_FLOOR,-10.75],
        'Summit_BeaconAnchor':[3,SUMMIT_FLOOR+14.45,-26.3],'Summit_HeroTarget':[-2,SUMMIT_FLOOR+4,-22],
        'Summit_NorthApproach':[0,SUMMIT_FLOOR,-31.5]}.items():E(name,root,p,role='runtimeAnchor');anchors[name]=p
    rows=[]
    frontcolors=['sage','rose','butter','powder','cream','lilac','rose','sage','butter']
    for i,(x,tone) in enumerate(zip(range(-46,43,11),frontcolors)):
        rows.append((i+1,x,2.6,29,tone,[8.8,9,9.4,9.6][i%4],'front'))
    for i,(x,tone) in enumerate(zip(range(-35,21,11),['powder','cream','sage','butter','rose','lilac'])):
        rows.append((i+10,x,5.6,7,tone,9.0,'back'))
    reservations=[]
    for i,x,y,z,tone,w,row in rows:
        house=E(f'Rowhouse_{i:02d}_Root',root,(x,y,z),role='architectureModule',row=row,facade='+Z',width=w)
        townhouse(i,w,tone,house,mat,glass)
        dx=(-w*.32 if i%2==0 else w*.32)
        name=f'Rowhouse_{i:02d}_EntryAnchor';p=[x+dx,y+1.02,z+6.42]
        E(name,root,p,role='runtimeAnchor');anchors[name]=p
        approach=f'Rowhouse_{i:02d}_ApproachAnchor';p=[x+dx,y,z+9.42]
        E(approach,root,p,role='runtimeAnchor');anchors[approach]=p
        reservations.append({'name':f'Rowhouse_{i:02d}','row':row,'ground':y,'width':w,'boundsXZ':[x-w/2-.34,z-6.4,x+w/2+.34,z+9.12],
            'stoopXZ':[x+dx-.85,z+6.0,x+dx+.85,z+9.12],'frontApproachXZ':[x+dx-.9,z+9.12,x+dx+.9,z+10.62]})
    OUT.parent.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True);STATS.parent.mkdir(parents=True,exist_ok=True)
    options=dict(filepath=str(OUT),export_format='GLB',export_yup=True,export_apply=False,export_vertex_color='ACTIVE',
        export_all_vertex_colors=True,export_active_vertex_color_when_no_material=True,export_normals=True,
        export_texcoords=True,export_attributes=True,export_extras=True,export_animations=False,export_cameras=False,
        export_lights=False,export_skins=False,export_morph=False,export_meshopt_compression_enable=True,export_meshopt_extension='EXT_meshopt_compression')
    supported={p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    bpy.ops.export_scene.gltf(**{k:v for k,v in options.items() if k in supported})
    (SOURCE/'home-architecture-raw.glb').write_bytes(OUT.read_bytes())
    stats={'asset':'models/islands/home-architecture.glb','units':'metres','facadeFacing':'+Z','paletteHex':PALETTE,
        'source':'Original authored polygon geometry interpreting WORLD-SPEC-FULL.md Home, with untouched supplied reference imagery',
        'anchors':anchors,'summitFloorHeight':SUMMIT_FLOOR,'summitLevels':[SUMMIT_FLOOR+h for h in [0,3.6,7.2,10.8]],
        'rowhouseCount':15,'rows':{'front':9,'back':6},'reservations':reservations,
        'alleyClearWidthMetres':6.56,'frontStoopExtentZ':38.12,'frontApproachExtentZ':39.62,
        'knownLimitations':['Architecture only: no terrain, site roads, planting, people, cable systems, sea wall or live interactions.',
        'Summit floor26m: regraded hillside with waterfront and both house rows preserved.',
        'Static glazing alpha and water are authored; runtime lighting, transparency sorting and camera review still required.',
        'No collision bodies/navigation mesh. Reservations describe full architectural footprints including balcony, roof and stoop.',
        'Summit stairs have actual matching 1.4m slab apertures; runtime collision/headroom and continuous route validation remain unverified.',
        'Rowhouse interior is limited to floor slabs and amber cards behind selected actual apertures; scenery houses have no portfolio content.',
        'No animation, textures, source pixels, invented biography or baked lighting. Browser/phone/M1 acceptance remains with integration.']}
    STATS.write_text(json.dumps(stats,indent=2)+'\n')
    # Archive native editable source before adding render-only camera/light/ground.
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'home-architecture.blend'))
    if "--no-preview" not in sys.argv:
        render_preview(root,SOURCE)
    print('HOME_ARCHITECTURE_EXPORTED',OUT,OUT.stat().st_size)


def render_preview(root,path):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('PreviewWorld');scene.world.color=(.52,.55,.57)
    scene.view_settings.view_transform='AgX'
    # render-only site pads make contact readable without exporting false terrain.
    for name,p,s in [('summit_pad',(-2,SUMMIT_FLOOR-.45,-22),(30,.4,25)),('front_pad',(-2,2.35,29),(108,.4,22)),('back_pad',(-7.5,5.35,7),(70,.4,22))]:
        m=Mesh();B(m,p,s,'step');m.object(name,matte_preview(),None)
    sun_data=bpy.data.lights.new('PreviewSun','SUN');sun_data.energy=2.2;sun_data.color=(1,.88,.74);sun_data.angle=.28
    sun=bpy.data.objects.new('PreviewSun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(.5,-.6,-.5)
    area_data=bpy.data.lights.new('PreviewSky','AREA');area_data.energy=2500;area_data.shape='DISK';area_data.size=40
    area=bpy.data.objects.new('PreviewSky',area_data);scene.collection.objects.link(area);area.location=(-10,-20,70)
    data=bpy.data.cameras.new('PreviewCamera');camera=bpy.data.objects.new('PreviewCamera',data);scene.collection.objects.link(camera);scene.camera=camera
    for filename,pos,target,scale in [('summit-review.png',(-32,64,14),(-2,51,-20),43),('rowhouses-review.png',(-29,20,56),(-18,9,27),35),('kit-review.png',(-94,94,120),(-3,27,5),145)]:
        camera.location=(pos[0],-pos[2],pos[1]);look=Vector((target[0],-target[2],target[1]))-camera.location
        camera.rotation_euler=look.to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=scale
        scene.render.filepath=str(path/filename);bpy.ops.render.render(write_still=True)

def matte_preview():return bpy.data.materials['Home_MattePalette']

if __name__=='__main__':make()
