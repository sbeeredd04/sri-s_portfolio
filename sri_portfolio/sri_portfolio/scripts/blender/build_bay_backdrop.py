"""Quiet SF skyline and Bay ridges in the shared bay's metre coordinates."""
import json
import math
import random
from pathlib import Path

import bpy

APP = Path(__file__).resolve().parents[2]
SOURCE = APP / "asset-src/authored/bay-backdrop"
STATS = APP / "asset-src/stats/bay-backdrop.json"
TONES = {
    "nearRidge": "BC9B93",
    "farRidge": "CBABA2",
    "shore": "CEACA0",
    "haze": "D4B4AA",
    "cityMauve": "BAA2A6",
    "cityPeach": "C6A8A2",
    "cityLilac": "C0AAAF",
    "cityStone": "C5B1AC",
}


def linear(hex_value):
    def channel(index):
        n = int(hex_value[index:index + 2], 16) / 255
        return n / 12.92 if n <= .04045 else ((n + .055) / 1.055) ** 2.4
    return tuple(channel(i) for i in (0, 2, 4)) + (1,)


def blend(a, b, amount):
    return tuple(x + (y-x)*amount for x,y in zip(linear(TONES[a]),linear(TONES[b])))


class PaletteMesh:
    def __init__(self):
        self.points = []
        self.faces = []
        self.colors = []

    def append(self, points, faces, colors):
        start = len(self.points)
        self.points.extend((x,-z,y) for x,y,z in points)
        self.faces.extend([start+i for i in face] for face in faces)
        self.colors.extend(colors)

    def object(self, name, parent, material):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.points, [], self.faces)
        mesh.materials.append(material)
        color = mesh.color_attributes.new(name="PaletteColor", type="FLOAT_COLOR", domain="CORNER")
        for face in mesh.polygons:
            for idx in face.loop_indices:
                color.data[idx].color = self.colors[mesh.loops[idx].vertex_index]
        mesh.color_attributes.active_color = color
        mesh.color_attributes.render_color_index = 0
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = parent
        return obj


def ridge(mesh, profile, z, depth, tone, seed):
    rng = random.Random(seed)
    points, faces, colors = [], [], []
    for band,(z_off,height_scale) in enumerate([(depth*.53,0),(depth*.24,.47),(0,1),(-depth*.29,.62),(-depth*.52,0)]):
        for i,(x,h) in enumerate(profile):
            end = i in (0,len(profile)-1)
            y = -.35 if band in (0,4) or end else h*height_scale
            points.append((x,y,z+z_off+(0 if end else rng.uniform(-1.9,1.9))))
            colors.append(blend("shore",tone,min(1,max(0,y/5))))
    width = len(profile)
    for row in range(4):
        for i in range(width-1):
            a,b=row*width+i,row*width+i+1
            c,d=(row+1)*width+i+1,(row+1)*width+i
            faces.extend([(a,b,d),(b,c,d)] if (i+row)%2 else [(a,b,c),(a,c,d)])
    mesh.append(points,faces,colors)


def tower(mesh,x,z,width,depth,profile,tone,shape="chamfer"):
    if shape=="round":
        outline=[(math.cos(i*math.tau/12),math.sin(i*math.tau/12)) for i in range(12)]
    elif shape=="spire":
        outline=[(-1,-1),(1,-1),(1,1),(-1,1)]
    else:
        outline=[(-.78,-1),(.78,-1),(1,-.78),(1,.78),(.78,1),(-.78,1),(-1,.78),(-1,-.78)]
    count=len(outline)
    points=[]
    for y,scale,shift in profile:
        points.extend((x+px*width*.5*scale+shift,y,z+pz*depth*.5*scale) for px,pz in outline)
    faces=[]
    for row in range(len(profile)-1):
        for i in range(count):
            j=(i+1)%count
            faces.append((row*count+i,(row+1)*count+i,(row+1)*count+j,row*count+j))
    top=(len(profile)-1)*count
    faces.append(tuple(reversed(range(top,top+count))))
    colors=[blend(tone,"haze",.34-.24*max(0,y)/profile[-1][0]) for x,y,z in points]
    mesh.append(points,faces,colors)


def make():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    SOURCE.mkdir(parents=True, exist_ok=True)
    STATS.parent.mkdir(parents=True, exist_ok=True)
    root=bpy.data.objects.new("BayBackdrop_Root",None)
    bpy.context.scene.collection.objects.link(root)
    root["frame"]="Bay X/Y/Z in metres"
    root["waterDatum"]=0.0
    material=bpy.data.materials.new("BayBackdrop_MattePalette")
    material.use_nodes=True
    shader=material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value=.96
    node=material.node_tree.nodes.new("ShaderNodeVertexColor")
    node.layer_name="PaletteColor"
    material.node_tree.links.new(node.outputs["Color"],shader.inputs["Base Color"])

    hills=PaletteMesh()
    ridge(hills,[(-126,0),(-117,3),(-107,5),(-94,7),(-80,10),(-70,12),(-61,8),
                 (-46,5.5),(-32,6),(-17,4),(-6,2),(9,0)],-243,27,"farRidge",4)
    ridge(hills,[(-127,0),(-113,2),(-100,4),(-86,6),(-74,5.2),(-61,3.7),
                 (-52,3.8),(-41,2.4),(-23,1),(-10,0)],-227,19,"nearRidge",27)
    ridge(hills,[(93,0),(99,2),(107,4.8),(114,7),(121,9.1),(127,7),(134,3),(138,0)],
          -239,22,"farRidge",91)
    ridge(hills,[(106,0),(111,1.5),(119,4.1),(124,6),(130,5),(136,2.6),(140,0)],
          -224,16,"nearRidge",61)
    hills.object("Bay_DistantRidges",root,material)

    shoreline=PaletteMesh()
    ridge(shoreline,[(21,0),(27,.64),(36,1.4),(50,1.35),(64,1.1),(77,1.5),
                     (91,1),(106,.4),(115,0)],-222,29,"nearRidge",25)
    shoreline.object("Bay_CityShore",root,material)

    block=PaletteMesh()
    # Unequal heights, setbacks and roof cuts are arranged as one skyline.
    # Keep the tallest forms east of the summit's projected centerline.
    buildings=[
        (26,-220,4,4,3.4),(30,-221.7,3.5,4.5,5.4),(35,-221,4.8,5,4.7),
        (35,-226,4.4,4.5,9.5),(40,-224,3.5,4.4,7.5),(44.6,-220,5,4.3,5.0),
        (47,-226,4.3,5,11.7),(50,-217.9,4.9,4.8,6.1),(54,-224,4.3,5.1,8.8),
        (55.5,-230,4.1,4.8,12.7),(58,-217.7,5.1,4.8,5.0),(61,-223,3.4,4.8,10.1),
        (65,-218,4.1,4.0,6.4),(67,-229,4,4.4,16.3),(72,-218.7,4.4,5.0,7.3),
        (75,-224,4.5,5.0,12.3),(79,-218.7,4.9,5,5.4),(80,-229,5.4,5.2,11.2),
        (85.15,-224,4.7,5.0,9.6),(90,-226,4.6,4.8,12.5),(93,-220,5.1,4.7,5.6),
        (98,-226,4.5,4.7,8.1),(103,-221,4.1,4.1,4.2),(108,-222,3.7,4.5,3.2),
    ]
    footprints=[entry[:4] for entry in buildings] + [
        (70.4,-236.0,5.7,5.4),(47.2,-231.7,5.6,5.2),
    ]
    for i,(x,z,w,d) in enumerate(footprints):
        for other_x,other_z,other_w,other_d in footprints[i+1:]:
            overlaps_x=abs(x-other_x) < (w+other_w)/2
            overlaps_z=abs(z-other_z) < (d+other_d)/2
            if overlaps_x and overlaps_z:
                raise ValueError(f"Skyline footprints overlap at {x}, {z}")
    colors=["cityMauve","cityPeach","cityLilac","cityStone"]
    for i,(x,z,w,d,h) in enumerate(buildings):
        if i%4==0:
            profile=[(-.18,1,0),(h*.75,1,0),(h*.75,.72,.25),(h,.72,.25)]
        elif i%5==0:
            profile=[(-.18,1,0),(h*.89,1,0),(h,.76,0)]
        else:
            profile=[(-.18,1,0),(h,1,0)]
        tower(block,x,z,w,d,profile,colors[i%4])
    block.object("Bay_SkylineBlocks",root,material)

    rounded=PaletteMesh()
    tower(rounded,70.4,-236.0,5.7,5.4,[(-.18,1,0),(17,.97,0),(24.9,.87,0),
        (27.4,.74,0),(29,.51,0),(29.45,.24,0)],"cityMauve","round")
    rounded.object("Bay_RoundedTower",root,material)
    spire=PaletteMesh()
    tower(spire,47.2,-231.7,5.6,5.2,[(-.18,1,0),(3.5,.94,0),(20.8,.09,0),
          (23.5,.018,0)],"cityStone","spire")
    spire.object("Bay_PyramidSpire",root,material)

    raw=SOURCE/"bay-backdrop-raw.glb"
    bpy.ops.export_scene.gltf(filepath=str(raw),export_format="GLB",export_yup=True,
        export_vertex_color="ACTIVE",export_all_vertex_colors=True,export_normals=True,
        export_extras=True,export_animations=False,export_skins=False,export_cameras=False,export_lights=False)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/"bay-backdrop.blend"))
    STATS.write_text(json.dumps({
        "asset":"models/islands/bay-backdrop.glb","frame":"Bay local metres, water y=0",
        "landmarkNames":["Bay_RoundedTower","Bay_PyramidSpire"],
        "paletteHex":TONES,"towers":26,"source":"Original geometry, master aerial design reference.",
    },indent=2)+"\n")


if __name__=="__main__":
    make()
