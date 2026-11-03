"""Fieldnotes coastal bluff, planting, signal blade and pier in future's tangent frame."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
from mathutils.bvhtree import BVHTree

APP = Path(__file__).resolve().parents[2]
SOURCE = APP / "asset-src/authored/fieldnotes"
STAT = APP / "asset-src/stats/fieldnotes-coast.json"
PALETTE = {
    "bluff": "918275", "bluffLight": "B7A28A", "bluffShade": "6D6C65",
    "wet": "5F6965", "meadow": "6E7C47", "meadowGold": "929757", "loam": "887354",
    "cypress": "465D38", "cypressLight": "70814A", "cypressDeep": "344D35",
    "bark": "6E5641", "ice": "D46A9A", "iceLight": "D98DB2",
    "lavender": "8C78B8", "lavenderLight": "A891C9", "poppy": "E8833A",
    "poppyLight": "EEA052", "poppyCenter": "C36735", "leaf": "6A8055",
    "grass": "C2AE7A", "sage": "9AA88A", "path": "C8B79A",
    "timber": "A97852", "timberEdge": "8B654B", "timberLight": "B68661",
    "blade": "C0673F", "bladeEdge": "AD593B", "cap": "9C6A4E",
    "amber": "FFB547", "slotDark": "6D4634",
}
# Artist-drawn coastline. The narrow inlet between the northern shoulders
# reaches the existing bridge end at [0,-8]; no terrain lip spans its approach.
OUTLINE = [
    (-32,-8),(-27,-15),(-19,-19),(-9,-18),(-4,-15),(-1.8,-10.0),
    (0,-8.45),(2,-10.4),(5,-15),(11,-19),(20,-17),(27,-12),
    (32,-5),(30,4),(25,10),(17,16),(8,19),(0,21),(-9,20),
    (-17,19),(-22,17),(-29,14),(-34,6),(-33,-2),
]
GROUND_SURFACE = None
PIER_X, PIER_START, PIER_END = -23.0, 16.1, 32.1
BLADE = (-18.4, 2.6)


def v(x,y,z):
    return Vector((x,-z,y))


def linear(tone):
    hex_value = PALETTE[tone]
    def decode(n):
        c = n / 255
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return tuple(decode(int(hex_value[i:i+2],16)) for i in [0,2,4]) + (1,)


def lerp(a,b,t):
    return a + (b-a)*t


def smooth(a,b,x):
    t = max(0,min(1,(x-a)/(b-a)))
    return t*t*(3-2*t)


def mix(a,b,t):
    return tuple(lerp(x,y,t) for x,y in zip(linear(a),linear(b)))


def inside(x,z,outline=OUTLINE):
    hit = False
    for i,(x1,z1) in enumerate(outline):
        x2,z2 = outline[i-1]
        if (z1>z)!=(z2>z) and x < (x2-x1)*(z-z1)/(z2-z1)+x1:
            hit = not hit
    return hit


def segment_distance(x,z,a,b):
    dx,dz=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
    return math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)


def yground(x,z):
    # Keep the current y=0 garden pad and lookout level. Broad upland lobes
    # rise away from its cameras. Weathering exposes rock only at the edge.
    west=2.9*math.exp(-(((x+22)/8.3)**2+((z+5)/10.8)**2))
    east=1.9*math.exp(-(((x-22)/7.2)**2+((z-4)/9.6)**2))
    bluffs=(
        1.85*math.exp(-(((x+29)/5.4)**2+((z-8)/5.6)**2))
        +2.0*math.exp(-(((x-28)/5.1)**2+((z+7)/6.2)**2))
        +1.1*math.exp(-(((x-17)/6.5)**2+((z-14)/5.8)**2))
    )
    central=(1-smooth(7.3,10,abs(x)))*(1-smooth(17.6,19.8,z))
    pier_cut=.65*(1-smooth(1.65,2.35,abs(x-PIER_X)))*smooth(12.9,16.1,z)
    return .015+(west+east+bluffs)*(1-central)-pier_cut


def planted_y(x,z):
    # Use the actual exported land triangles, not the analytic field between
    # their vertices: foliage soles then touch what the browser draws.
    if GROUND_SURFACE is not None:
        hit=GROUND_SURFACE.ray_cast(Vector((x,-z,60)),Vector((0,0,-1)))[0]
        if hit is not None:
            return hit.z
    return yground(x,z)


class Mesh:
    def __init__(self):
        self.vertices=[]
        self.faces=[]
        self.colors=[]
        self.smooth=[]

    def polygon(self,points,tone,smoothed=False):
        self.faces.append(tuple(range(len(self.vertices),len(self.vertices)+len(points))))
        self.vertices.extend(tuple(v(*point)) for point in points)
        color=linear(tone) if isinstance(tone,str) else tone
        self.colors.append([color]*len(points) if isinstance(color[0],float) else color)
        self.smooth.append(smoothed)

    def indexed(self,points,faces,tones,smoothed):
        start=len(self.vertices)
        self.vertices.extend(tuple(v(*point)) for point in points)
        self.faces.extend(tuple(start+i for i in face) for face in faces)
        for face,tone in zip(faces,tones):
            color=linear(tone) if isinstance(tone,str) else tone
            self.colors.append([color]*len(face) if isinstance(color[0],float) else color)
        self.smooth.extend([smoothed]*len(faces))

    def box(self,center,size,tone):
        x,y,z=center
        a,b,c=(value/2 for value in size)
        points=[(x+i*a,y+j*b,z+k*c) for i,j,k in
                [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),
                 (-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
        faces=[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        self.indexed(points,faces,[tone]*6,False)

    def rod(self,a,b,r1,r2,tone,sides=6):
        a,b=Vector(a),Vector(b)
        d=(b-a).normalized()
        helper=Vector((0,1,0)) if abs(d.y)<.9 else Vector((1,0,0))
        u=d.cross(helper).normalized()
        w=d.cross(u)
        points=[tuple(p+r*(u*math.cos(j*math.tau/sides)+w*math.sin(j*math.tau/sides)))
                for p,r in [(a,r1),(b,r2)] for j in range(sides)]
        faces=[tuple(reversed(range(sides))),tuple(range(sides,2*sides))]
        faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
        self.indexed(points,faces,[tone]*len(faces),True)

    def organic(self,center,radii,tone,seed,sides=8,faceted=False):
        # One continuous rounded polygon volume. Flattened pads have a taper
        # at both edges and read as foliage, rather than round floating balls.
        rng=random.Random(seed)
        x,y,z=center
        a,b,c=radii
        points=[(x,y-b,z)]
        for j,(height,scale) in enumerate([(-.62,.66),(-.05,1),(.54,.79)]):
            for i in range(sides):
                t=(i+j*.24)*math.tau/sides
                irregular=rng.uniform(.9,1.07)
                points.append((x+a*math.cos(t)*scale*irregular,y+b*(height+rng.uniform(-.09,.09)),
                               z+c*math.sin(t)*scale*irregular))
        top=len(points)
        points.append((x+a*.08,y+b,z))
        faces=[]
        for i in range(sides):
            j=(i+1)%sides
            faces.append((0,1+i,1+j))
            for band in range(2):
                l=1+band*sides
                faces.extend([(l+i,l+i+sides,l+j),(l+j,l+i+sides,l+j+sides)])
            faces.append((top,1+2*sides+j,1+2*sides+i))
        self.indexed(points,faces,[tone]*len(faces),not faceted)

    def object(self,name,parent,material):
        data=bpy.data.meshes.new(name)
        data.from_pydata(self.vertices,[],self.faces)
        data.materials.append(material)
        attr=data.color_attributes.new(name="PaletteColor",type="FLOAT_COLOR",domain="CORNER")
        for p,tones,smoothed in zip(data.polygons,self.colors,self.smooth):
            p.use_smooth=smoothed
            for i,idx in enumerate(p.loop_indices):
                attr.data[idx].color=tones[i]
        data.color_attributes.active_color=attr
        data.color_attributes.render_color_index=0
        obj=bpy.data.objects.new(name,data)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent=parent
        return obj


def empty(name,parent,point,**extras):
    obj=bpy.data.objects.new(name,None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent=parent
    obj.location=v(*point)
    for key,value in extras.items():
        obj[key]=value
    return obj


def material(name,emission=0):
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    nodes=mat.node_tree.nodes
    shader=nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value=.9
    attr=nodes.new("ShaderNodeVertexColor")
    attr.layer_name="PaletteColor"
    mat.node_tree.links.new(attr.outputs["Color"],shader.inputs["Base Color"])
    if emission:
        mat.node_tree.links.new(attr.outputs["Color"],shader.inputs["Emission Color"])
        shader.inputs["Emission Strength"].default_value=emission
    return mat


def subdivide_outline():
    coast=[]
    for i,a in enumerate(OUTLINE):
        b=OUTLINE[(i+1)%len(OUTLINE)]
        steps=max(1,math.ceil(math.dist(a,b)/2.8))
        for j in range(steps):
            t=j/steps
            coast.append(tuple(lerp(x,z,t) for x,z in zip(a,b)))
    return coast


def build_land():
    top,cliff=Mesh(),Mesh()
    rng=random.Random(385)
    coast=subdivide_outline()
    pts=list(coast)
    # Interior triangles vary in size, with tighter spacing around the garden
    # and inlet. The hard polygon boundary is constrained during triangulation.
    for xi in range(-33,33,2):
        for zi in range(-19,22,2):
            x,z=xi+rng.uniform(-.6,.6),zi+rng.uniform(-.6,.6)
            if inside(x,z) and min(segment_distance(x,z,a,coast[(i+1)%len(coast)])
                                   for i,a in enumerate(coast))>.28:
                pts.append((x,z))
    for x in [-25,-24.7,-24.2,-23,-21.8,-21.3,-21]:
        for row in range(12):
            z=12.8+row*.35
            if inside(x,z):
                pts.append((x,z))
    edges=[(i,(i+1)%len(coast)) for i in range(len(coast))]
    coords,_,faces,_,_,_=delaunay_2d_cdt([Vector(p) for p in pts],edges,[list(range(len(coast)))],1,1e-5)
    def top_color(x,z):
        # Larger patches of soil and moss give the flowers a planted setting;
        # the colour field is continuous across triangle boundaries.
        light=.38+.22*math.sin(x*.13+z*.07)+.13*math.cos(z*.29-x*.11)
        base=mix("meadow","meadowGold",light)
        soil=.24+.16*math.sin(x*.43+z*.19)*math.cos(z*.27-x*.08)
        return tuple(lerp(c,l,soil) for c,l in zip(base,linear("loam")))
    for face in faces:
        coords_=[coords[i] for i in face]
        x,z=(sum(p[j] for p in coords_)/len(coords_) for j in [0,1])
        if not inside(x,z):
            continue
        # CDT is CCW in x/z; reverse so the visible surface faces +Y.
        points=[(p.x,yground(p.x,p.y),p.y) for p in reversed(coords_)]
        top.polygon(points,[top_color(px,pz) for px,py,pz in points])
    # Rock toes on each stretch are sized to its exposure, with lowered
    # stepped shelves in the sheltered pier cove and broad seaward faces.
    sections=[]
    for i,(x,z) in enumerate(coast):
        h=yground(x,z)
        sea=math.sqrt(450**2-x*x-z*z)-450
        direction=Vector((x,z)).normalized()
        steep=.45+.43*math.sin(i*.19+.8)
        broad=1.05+.63*math.sin(i*.31)+.22*math.cos(i*.83)
        inlet=abs(x)<3 and z<-8
        toe=.26 if inlet else 1.1+broad
        lip=(x,h,z)
        mids=[
            (x+direction.x*toe*.31,h-(h-sea)*(.28+.15*steep),z+direction.y*toe*.31),
            (x+direction.x*toe*.76,sea+.17+.15*math.sin(i*.9),z+direction.y*toe*.76),
            (x+direction.x*toe,sea-1.15,z+direction.y*toe),
        ]
        sections.append([lip,*mids])
    for i,a in enumerate(sections):
        b=sections[(i+1)%len(sections)]
        for j in range(3):
            colors=[top_color(a[0][0],a[0][2]),top_color(b[0][0],b[0][2])] if j==0 else [
                mix("bluff","bluffLight",.28+.18*math.sin(i*.32)),
                mix("bluff","bluffLight",.28+.18*math.sin((i+1)*.32)),
            ]
            low=[
                mix("bluff","bluffShade",.25+.22*math.cos(i*.37)),
                mix("bluff","bluffShade",.25+.22*math.cos((i+1)*.37)),
            ] if j!=2 else [linear("wet")]*2
            cliff.polygon([a[j],b[j],b[j+1]],[colors[0],colors[1],low[1]])
            cliff.polygon([a[j],b[j+1],a[j+1]],[colors[0],low[1],low[0]])
    return top,cliff


def poppy(mesh,x,y,z,h,seed):
    rng=random.Random(seed)
    lean_x=rng.uniform(.04,.09)*h
    stem=(x+lean_x,y+h,z+.06*h)
    mesh.rod((x,y,z),(x+lean_x*.35,y+h*.52,z),.009,.006,"leaf",4)
    mesh.rod((x+lean_x*.35,y+h*.52,z),stem,.006,.004,"leaf",4)
    for i in range(3):
        t=i*2.39+seed*.51
        cx=x+lean_x*.35
        mesh.polygon([(cx,y+h*.31,z),(cx+math.cos(t)*h*.29,y+h*.58,z+math.sin(t)*h*.29),
                      (cx+math.cos(t+.5)*h*.15,y+h*.44,z+math.sin(t+.5)*h*.15)],"leaf")
    a,b,c=stem
    width=h*.27
    for i in range(4):
        t=i*math.pi/2+rng.uniform(-.12,.12)
        p0=(a,b,c)
        p1=(a+width*math.cos(t-.55),b+h*.13,c+width*math.sin(t-.55))
        p2=(a+width*1.19*math.cos(t),b+h*.17,c+width*1.19*math.sin(t))
        p3=(a+width*math.cos(t+.55),b+h*.13,c+width*math.sin(t+.55))
        mesh.polygon([p0,p3,p2,p1],"poppyLight" if i==1 else "poppy")
    mesh.organic((a,b+.014,c),(width*.26,.018,width*.26),"poppyCenter",seed,4)


def leafy_base(mesh,x,y,z,scale,seed,count=10):
    rng=random.Random(seed)
    for j in range(count):
        angle=j*2.399+seed*.13
        length=(.21+rng.random()*.26)*scale
        width=(.045+rng.random()*.035)*scale
        dx,dz=math.cos(angle),math.sin(angle)
        root=(x,y+.025*scale,z)
        left=(x+dx*length*.48-dz*width,y+.105*scale,z+dz*length*.48+dx*width)
        right=(x+dx*length*.48+dz*width,y+.105*scale,z+dz*length*.48-dx*width)
        ridge=(x+dx*length*.55,y+.16*scale,z+dz*length*.55)
        tip=(x+dx*length,y+.075*scale,z+dz*length)
        tone="leaf" if j%3 else "sage"
        mesh.polygon([root,left,ridge],tone)
        mesh.polygon([root,ridge,right],"cypressLight")
        mesh.polygon([ridge,left,tip],tone)
        mesh.polygon([ridge,tip,right],"cypressLight")


def drift(mesh,x,y,z,scale,kind,seed):
    rng=random.Random(seed)
    if kind=="ice":
        # Interlocking succulent runners and small, four-petaled heads.
        leafy_base(mesh,x,y,z,scale,seed,10)
        for i in range(7):
            t=i*2.399
            offset=.38*scale*math.sqrt((i+.3)/7)
            a,b=x+math.cos(t)*offset,z+math.sin(t)*offset
            height=y+(.22+rng.random()*.075)*scale
            radius=(.066+rng.random()*.027)*scale
            for j in range(4):
                angle=j*math.tau/4+t
                tip=(a+radius*math.cos(angle),height+.028*scale,b+radius*math.sin(angle))
                left=(a+.6*radius*math.cos(angle-.73),height+.014*scale,b+.6*radius*math.sin(angle-.73))
                right=(a+.6*radius*math.cos(angle+.73),height+.014*scale,b+.6*radius*math.sin(angle+.73))
                mesh.polygon([(a,height,b),right,tip,left],"iceLight" if (i+j)%3==0 else "ice")
    elif kind=="lavender":
        leafy_base(mesh,x,y,z,scale*.7,seed,8)
        for i in range(5):
            t=i*2.399
            a,b=x+math.cos(t)*scale*.22,z+math.sin(t)*scale*.21
            h=(.36+rng.random()*.29)*scale
            mesh.rod((x,y+.12*scale,z),(a+.075*scale,y+h,b),.008,.005,"leaf",4)
            mesh.organic((a+.075*scale,y+h,b),(.055*scale,.12*scale,.05*scale),
                         "lavenderLight" if i%3==0 else "lavender",seed+i,4)
    elif kind=="grass":
        for i in range(6):
            t=i*2.399
            h=(.21+rng.random()*.3)*scale
            mesh.polygon([(x-.032*scale,y,z),(x+.028*scale,y,z),(x+.12*scale+math.cos(t)*h*.7,y+h,z+math.sin(t)*h*.7)],
                         "grass")
    elif kind=="poppy":
        for i in range(2):
            t=i*2.399
            poppy(mesh,x+math.cos(t)*scale*.16,y,z+math.sin(t)*scale*.17,
                  (.34+rng.random()*.28)*scale,seed+i)


def cypress(mesh,x,z,height,lean,seed):
    y=planted_y(x,z)-.055
    m=height
    trunk=[(x,y,z),(x-.015*m,y+.23*m,z+.012*m),(x+.1*lean*m,y+.47*m,z-.02*m),
           (x+.29*lean*m,y+.71*m,z+.02*m),(x+.42*lean*m,y+.89*m,z+.015*m)]
    # A single cross-section chain keeps the swept trunk continuous.
    sides=9
    rings=[]
    for i,(tx,ty,tz) in enumerate(trunk):
        ring=[]
        radius=(.047-i*.0085)*m
        for j in range(sides):
            angle=j*math.tau/sides
            flare=1+.16*math.cos(angle*3+.4) if i==0 else 1
            ring.append((tx+radius*flare*math.cos(angle),ty,tz+radius*flare*math.sin(angle)))
        rings.append(ring)
    points=sum(rings,[])
    faces=[]
    for i in range(len(rings)-1):
        for j in range(sides):
            k=(j+1)%sides
            faces.append((i*sides+j,(i+1)*sides+j,(i+1)*sides+k,i*sides+k))
    mesh.indexed(points,faces,["bark"]*len(faces),True)
    for i in range(5):
        angle=i*2.399+seed
        rx,rz=x+math.cos(angle)*m*.11,z+math.sin(angle)*m*.11
        mesh.rod((rx,planted_y(rx,rz)-.035,rz),(x,y+.12*m,z),.018*m,.035*m,"bark",5)
    pads=[
        (-.28,.77,-.08,.23,.098,.18),(.13,.70,.13,.23,.101,.17),
        (.37,.83,-.055,.24,.108,.18),(-.095,.91,.16,.22,.105,.18),
        (.15,.98,-.115,.22,.105,.165),(.47,.93,.055,.25,.106,.18),
        (.39,1.01,-.035,.176,.082,.145),
    ]
    for i,(px,py,pz,sx,sy,sz) in enumerate(pads):
        c=(x+m*(px*(.64+.45*abs(lean))+.15*lean),y+m*py,z+m*pz)
        source=trunk[min(4,int(py*4.3))]
        end=(c[0]-.06*m,c[1]-.047*m,c[2])
        mesh.rod(source,end,.024*m,.008*m,"bark",6)
        # Three overlapping, uneven pads retain the windswept crown but break
        # its silhouette into leaves rather than a stack of smooth pillows.
        for j in range(3):
            turn=seed*.7+j*2.399
            offset=(math.cos(turn)*sx*m*.31,math.sin(turn*1.7)*sy*m*.2,math.sin(turn)*sz*m*.33)
            q=tuple(c[k]+offset[k] for k in range(3))
            mesh.organic(q,(sx*m*.76,sy*m*.9,sz*m*.78),
                         ["cypress","cypressLight","cypressDeep"][(i+j)%3],seed+i*17+j,7,True)


def build_plants(layout):
    trees=Mesh()
    flowers=Mesh()
    bed_fill=Mesh()
    # Distinct lopsided silhouettes with the existing camera cones kept clear.
    for i,(x,z,h,lean) in enumerate([
        (-23,-10,8.0,.64),(-27,7.5,6.1,-.16),(-13.9,9.8,6.9,.66),
        (14.2,-8.8,6.4,.65),(20.7,7.2,7.5,.75),(8.1,14.1,5.3,.75),
    ]):
        cypress(trees,x,z,h,lean,70+i*31)
    # A few long sweeps follow the site contours. They are hand-directed
    # clusters with empty land between, not a radial fence around the garden.
    runs=[
        [(-27,-8),(-24,-12),(-20,-13),(-16,-11),(-12,-8.8)],
        [(-29,3),(-26,7),(-23,10),(-19,11),(-15,10),(-11,8.7)],
        [(-16,15),(-12,17),(-8,17.2),(-4.2,17.6)],
        [(9,-10.7),(12,-12),(16,-13),(20,-11),(23,-8)],
        [(9.2,7.4),(12,9.8),(15,12),(18,12),(21,10.2)],
        [(5.2,12.5),(7.2,15),(8.3,16.6)],
    ]
    rng=random.Random(113)
    idx=0
    def free(x,z,margin):
        if abs(x-PIER_X)<2.7 and z>9:
            return False
        if math.hypot(x-BLADE[0],z-BLADE[1])<3:
            return False
        paths=layout["paths"]+layout["newPaths"]
        if any(segment_distance(x,z,a,b)<w/2+margin for a,b,w in paths):
            return False
        for box in layout["obstacles"]["boxes"]:
            if box["minX"]-margin<x<box["maxX"]+margin and box["minZ"]-margin<z<box["maxZ"]+margin:
                return False
        # Keep the newsstand's counter approach and complete existing terraces clear.
        if abs(x-layout["newsstand"]["x"]) < 2.1+margin and abs(z-layout["newsstand"]["z"]) < 2.1+margin:
            return False
        for terrace in layout["terraces"]:
            if abs(x-terrace["x"]) < terrace["width"]/2+margin and abs(z-terrace["z"]) < terrace["depth"]/2+margin:
                return False
        return inside(x,z)
    for run_no,run in enumerate(runs):
        for a,b in zip(run,run[1:]):
            n=math.ceil(math.dist(a,b)/.61)
            for k in range(n):
                t=(k+.3)/n
                x,z=lerp(a[0],b[0],t),lerp(a[1],b[1],t)
                for j in range(3):
                    px,pz=x+rng.uniform(-1.6,1.6),z+rng.uniform(-1.6,1.6)
                    size=rng.uniform(.78,1.28)
                    if not free(px,pz,.59*size):
                        continue
                    # Species grow as connected drifts, with quieter foliage between.
                    kind=(["lavender","ice","poppy","ice","lavender","poppy"][run_no]
                          if j<2 else ["ice","grass","poppy"][idx%3])
                    drift(flowers,px,planted_y(px,pz)-.018,pz,size,kind,idx+300)
                    idx+=1
    # The shore-side garden sweeps continue as low succulent rosettes. These
    # are deliberately not placed on a grid: a deterministic blue-noise-like
    # spacing produces connected patches, preserving paths and open landings.
    low_sites=[]
    for attempt in range(900):
        x,z=rng.uniform(-31,29),rng.uniform(-16,18)
        if abs(x)<8.3 or not free(x,z,.68):
            continue
        if min(segment_distance(x,z,a,OUTLINE[(i+1)%len(OUTLINE)]) for i,a in enumerate(OUTLINE)) < 1.1:
            continue
        # Concentrate at the feet of the cypresses and along the western slope.
        field=math.sin(x*.3+z*.17)+math.cos(z*.35-x*.11)
        if field<-.3 or any(math.hypot(x-a,z-b)<1.22 for a,b in low_sites):
            continue
        low_sites.append((x,z))
        y=planted_y(x,z)-.02
        scale=rng.uniform(.7,1.35)
        for j in range(7):
            angle=j*2.399+attempt
            length=(.28+rng.random()*.3)*scale
            wide=.1*scale
            direction=Vector((math.cos(angle),math.sin(angle)))
            side=Vector((-direction.y,direction.x))
            center=(x,y+.04,z)
            left=(x+direction.x*length*.55+side.x*wide,y+.18*scale,z+direction.y*length*.55+side.y*wide)
            right=(x+direction.x*length*.55-side.x*wide,y+.18*scale,z+direction.y*length*.55-side.y*wide)
            tip=(x+direction.x*length,y+.1*scale,z+direction.y*length)
            mesh=flowers
            mesh.polygon([center,tip,left],"leaf")
            mesh.polygon([center,right,tip],"cypressLight")
        idx+=1
        if len(low_sites)>=180:
            break
    # Low replacement planting inside the authored stone bed rectangles.
    for bed in layout["beds"]:
        for i in range(3):
            for j in range(4):
                x=bed["x"]+(i/2-.5)*(bed["w"]-.65)
                z=bed["z"]+(j/3-.5)*(bed["d"]-.65)
                drift(bed_fill,x,.15,z,.64,["lavender","ice","poppy"][(i+j)%3],idx)
                idx+=1
    return trees,flowers,bed_fill,idx


def place_paths(layout):
    mesh=Mesh()
    # A thin crushed-stone surface on the sampled landform. No new curb
    # crosses the shared garden path and no stacked paving through seats.
    paths=layout["newPaths"]
    nodes=[entry[0] for entry in paths]+[paths[-1][1]]
    directions=[(Vector(b)-Vector(a)).normalized() for a,b,_ in paths]
    normals=[Vector((-d.y,d.x)) for d in directions]
    miters=[]
    for i in range(len(nodes)):
        left,right=normals[max(0,i-1)],normals[min(i,len(normals)-1)]
        miter=(left+right).normalized()
        miters.append(miter/max(.75,miter.dot(right)))
    for index,(a,b,width) in enumerate(paths):
        n=math.ceil(math.dist(a,b)/.62)
        def point(t,side):
            miter=miters[index].lerp(miters[index+1],t)
            x=lerp(a[0],b[0],t)+miter.x*width/2*side
            z=lerp(a[1],b[1],t)+miter.y*width/2*side
            height=yground(x,z)+.055
            if index==0:
                height=lerp(layout["deckY"],height,smooth(0,.32,t))
            return x,height,z
        for i in range(n):
            t,u=i/n,(i+1)/n
            edge0,edge1,edge2,edge3=point(t,-1),point(t,1),point(u,1),point(u,-1)
            mesh.polygon([edge0,edge1,edge2,edge3],mix("path","loam",.1+.05*math.sin(i*.63)))
            for start,end in [(edge3,edge0),(edge1,edge2)]:
                under_start=(start[0],start[1]-.16,start[2])
                under_end=(end[0],end[1]-.16,end[2])
                mesh.polygon([start,end,under_end,under_start],"loam")
    return mesh


def signal():
    mesh,light=Mesh(),Mesh()
    x,z=BLADE
    y=yground(x,z)
    mesh.box((x,y+.17,z),(3.4,.38,1.65),"bluffLight")
    bottom,top=y+.35,y+14.35
    # Two tapered jambs with a real inset slot between them.
    def panel(x0,x1,x2,x3,y0,y1,tone):
        points=[(x+x0,y0,z-.43),(x+x1,y0,z-.43),(x+x1,y0,z+.43),(x+x0,y0,z+.43),
                (x+x2,y1,z-.28),(x+x3,y1,z-.28),(x+x3,y1,z+.28),(x+x2,y1,z+.28)]
        faces=[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        mesh.indexed(points,faces,[tone]*6,False)
    panel(-1.2,-.17,-.83,-.16,bottom,top,"blade")
    panel(.17,1.2,.16,.83,bottom,top,"bladeEdge")
    panel(-.17,.17,-.17,.17,bottom,bottom+2.05,"blade")
    panel(-.17,.17,-.16,.16,top-1.95,top,"cap")
    for edge in [-1,1]:
        mesh.box((x+edge*.145,(bottom+top)/2,z+.04),(.045,10.05,.12),"slotDark")
    light.box((x,(bottom+top)/2,z+.04),(.24,9.5,.05),"amber")
    mesh.box((x,top+.1,z),(1.72,.19,.61),"cap")
    return mesh,light


def build_pier():
    mesh=Mesh()
    width,deck=3.0,-.31
    x=PIER_X
    head_start=PIER_END-2
    for i in range(64):
        z=PIER_START+(i+.5)*.25
        board_width=5.1 if z>=head_start else width
        mesh.box((x,deck-.065,z),(board_width,.13,.241),"timberLight" if i%7==0 else "timber")
    for side in [-1,1]:
        for j in range(6):
            z=PIER_START+.23+j*2.6
            mesh.rod((x+side*1.19,-5,z),(x+side*1.19,deck+.97,z),.113,.092,"timberEdge",7)
        mesh.box((x+side*1.21,deck-.22,(PIER_START+PIER_END)/2),(.22,.24,16),"timberEdge")
        for y,w,h in [(deck+.92,.084,.085),(deck+.53,.043,.052)]:
            mesh.box((x+side*1.25,y,(PIER_START+head_start)/2),(w,h,14),"timber")
            mesh.box((x+side*2.39,y,(head_start+PIER_END)/2),(w,h,2),"timber")
            mesh.box((x+side*1.81,y,head_start),(1.16,h,w),"timber")
        for z in [head_start+.12,PIER_END-.14]:
            mesh.rod((x+side*2.39,-5,z),(x+side*2.39,deck+.97,z),.11,.09,"timberEdge",7)
        mesh.box((x+side*1.65,deck+.92,PIER_END-.11),(1.52,.085,.084),"timber")
    # At the end, the open gangway between the rear rails is left clear.
    # The entry has an open 1.95m stair, with supports down to the headland.
    height=yground(x,PIER_START-2.8)+.055-deck
    steps=max(3,math.ceil(height/.169))
    for i in range(steps):
        z=PIER_START-2.8+(i+.5)*2.8/steps
        y=deck+(steps-i)*height/steps
        mesh.box((x,y-.07,z),(1.95,.14,2.8/steps+.01),"timber")
    for side in [-1,1]:
        a=(x+side*.96,deck+.88,PIER_START)
        b=(x+side*.96,deck+height+.88,PIER_START-2.8)
        mesh.rod(a,b,.043,.043,"timberEdge",5)
        for t in [0,.5,1]:
            p=tuple(lerp(a[j],b[j],t) for j in range(3))
            mesh.rod((p[0],p[1]-.96,p[2]),p,.047,.047,"timberEdge",6)
    return mesh,steps,deck


def preview(root,anchor):
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.cycles.samples=20
    scene.render.resolution_x=1420
    scene.render.resolution_y=960
    scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new("Preview environment")
    scene.world.color=(.52,.55,.59)
    scene.view_settings.view_transform="AgX"
    sea=Mesh()
    sea.polygon([(-90,-.87,90),(90,-.87,90),(90,-.87,-90),(-90,-.87,-90)],"meadow")
    sea_mat=bpy.data.materials.new("Preview sea")
    sea_mat.use_nodes=True
    sea_shader=sea_mat.node_tree.nodes.get("Principled BSDF")
    sea_shader.inputs["Base Color"].default_value=(.081,.27,.31,1)
    sea_shader.inputs["Roughness"].default_value=.35
    sea.object("Preview sea",None,sea_mat)
    figure=APP/"asset-src/authored/soft-human/soft-human-raw.glb"
    if figure.exists():
        existing=set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(figure))
        for obj in set(bpy.data.objects)-existing:
            if obj.parent is None:
                obj.location=v(*anchor)
    sun_data=bpy.data.lights.new("Preview Sun","SUN")
    sun_data.energy=2.6
    sun_data.angle=.30
    sun_data.color=(1,.87,.73)
    sun=bpy.data.objects.new("Preview Sun",sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler=(.51,-.65,-.4)
    cam_data=bpy.data.cameras.new("Preview Camera")
    cam=bpy.data.objects.new("Preview Camera",cam_data)
    scene.collection.objects.link(cam)
    scene.camera=cam
    for file,pos,target,scale in [
        ("coast-review.png",(-63,55,82),(0,2,3),87),
        ("garden-review.png",(-21,5.2,18.6),(-12.5,1.6,9.7),13.5),
    ]:
        cam.location=v(*pos)
        cam.rotation_euler=(v(*target)-cam.location).to_track_quat("-Z","Y").to_euler()
        cam_data.type="ORTHO"
        cam_data.ortho_scale=scale
        scene.render.filepath=str(SOURCE/file)
        bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    args=sys.argv[sys.argv.index("--")+1:]
    layout=json.loads(Path(args[0]).read_text())
    layout["newPaths"]=[
        [[-7.275,5.45],[-10.2,5.45],1.6],
        [[-10.2,5.45],[-15.1,5.1],1.6],
        [[-15.1,5.1],[-19.7,6.4],1.6],
        [[-19.7,6.4],[-22.9,10.3],1.6],
        [[-22.9,10.3],[PIER_X,PIER_START-2.8],1.6],
    ]
    SOURCE.mkdir(parents=True,exist_ok=True)
    STAT.parent.mkdir(parents=True,exist_ok=True)
    root=empty("FieldnotesCoast_Root",None,(0,0,0),units="metres",frame="future tangent")
    matte=material("Fieldnotes_MattePalette")
    glow=material("Fieldnotes_AmberPractical",1.2)
    global GROUND_SURFACE
    meadow,cliff=build_land()
    GROUND_SURFACE=BVHTree.FromPolygons(meadow.vertices,meadow.faces,all_triangles=False)
    meadow.object("Fieldnotes_LandSurface",root,matte)
    cliff.object("Fieldnotes_BluffAndWaterline",root,matte)
    trees,flowers,beds,count=build_plants(layout)
    trees.object("Fieldnotes_Cypress",root,matte)
    flowers.object("Fieldnotes_CoastalDrifts",root,matte)
    beds.object("Fieldnotes_CourtyardBeds",root,matte)
    place_paths(layout).object("Fieldnotes_WestSpur",root,matte)
    blade,lens=signal()
    blade.object("Fieldnotes_SignalBlade",root,matte)
    lens.object("Fieldnotes_AmberSlot",root,glow)
    pier,steps,deck=build_pier()
    pier.object("Fieldnotes_Pier",root,matte)
    human=(-14.65,yground(-14.65,5.42)+.055,5.42)
    anchors={
        "Fieldnotes_BridgeEntry":[0,layout["deckY"],-8],
        "Fieldnotes_Lookout":[0,layout["deckY"],17.2],
        "Fieldnotes_BladeBase":[BLADE[0],yground(*BLADE),BLADE[1]],
        "Fieldnotes_BladeSlot":[BLADE[0],yground(*BLADE)+7.35,BLADE[1]-.43],
        "Fieldnotes_PierApproach":[PIER_X,yground(PIER_X,PIER_START-2.8)+.055,PIER_START-2.8],
        "Fieldnotes_PierEnd":[PIER_X,deck,PIER_END-.7],
        "Fieldnotes_AdultSole":list(human),
        "Fieldnotes_AdultCrown":[human[0],human[1]+1.75,human[2]],
    }
    for name,point in anchors.items():
        empty(name,root,point,role="runtimeAnchor")
    raw=SOURCE/"fieldnotes-coast-raw.glb"
    bpy.ops.export_scene.gltf(filepath=str(raw),export_format="GLB",export_yup=True,
        export_vertex_color="ACTIVE",export_all_vertex_colors=True,export_normals=True,
        export_attributes=True,export_extras=True,export_animations=False,export_skins=False,
        export_cameras=False,export_lights=False)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/"fieldnotes-coast.blend"))
    STAT.write_text(json.dumps({
        "asset":"models/islands/fieldnotes-coast.glb","coordinateFrame":"future tangent X/Y/Z, metres",
        "anchors":anchors,"outlineXZ":OUTLINE,"paletteHex":PALETTE,"sharedLayout":layout,
        "plants":count,"pier":{"width":3,"length":16,"deckY":deck,"riserCount":steps},
        "integration":{"hideOldFutureLandLift":True,"replace":["Hedges","tree-broadleaf instances","GardenPlanting"],
            "retain":["FutureStudio content and paving","FieldnotesQuarter Newsstand/Lanterns/Lookout/PaperPlanes","LookoutVista offshore landmark"]},
        "browserVisualAcceptance":False,
    },indent=2)+"\n")
    if "--no-preview" not in args:
        preview(root,human)


if __name__=="__main__":
    main()
