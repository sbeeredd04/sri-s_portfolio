"""Original six-tube garden instrument, with preserved suspension pivots."""
import bpy,json,math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from export_authored import export_scene
APP=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.4 if metal else .75
 return m
brass=material('aged_brass',(.35,.26,.12),.7);wood=material('oiled_wood',(.13,.065,.029));cord=material('suspension_cord',(.12,.10,.075))
def empty(name,loc,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def cylinder(name,r,depth,loc,mat,parent):
 bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=depth,location=(0,0,0));o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
root=empty('coastal_chime',(0,0,0));root['soundProfile']='brass_tube';root['interaction']='wind_contact'
static=[cylinder('hanger',.003,.09,(0,0,-.045),cord,root),cylinder('wood_crown',.13,.018,(0,0,-.1),wood,root)]
notes=[880,987.8,1174.7,1318.5,1568,1760]
for i,hz in enumerate(notes):
 a=i*math.pi/3;x=.1*math.cos(a);y=-.1*math.sin(a)
 pivot=empty(f'tube_{i}',(x,y,-.11),root)
 static.append(cylinder('cord',.0016,.09,(x,y,-.155),cord,root))
 # Hollow brass wall with open ends, not a solid capped cylinder.
 L=.38*math.sqrt(880/hz);verts=[];faces=[]
 for r,z in [(.012,-.09),(.012,-.09-L),(.009,-.09-L),(.009,-.09)]:
  verts.extend([(r*math.cos(j*math.pi/8),r*math.sin(j*math.pi/8),z) for j in range(16)])
 for k in range(4):
  for j in range(16):faces.append((k*16+j,k*16+(j+1)%16,((k+1)%4)*16+(j+1)%16,((k+1)%4)*16+j))
 mesh=bpy.data.meshes.new('hollow_tube');mesh.from_pydata(verts,[],faces);mesh.materials.append(brass)
 o=bpy.data.objects.new(f'brass_{i}',mesh);bpy.context.collection.objects.link(o);o.parent=pivot
 for p in mesh.polygons:p.use_smooth=True
pivot=empty('clapper',(0,0,-.11),root)
cylinder('clapper_cord',.0015,.52,(0,0,-.26),cord,pivot)
cylinder('wood_striker',.036,.018,(0,0,-.35),wood,pivot)
bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name='wind_sail';o.parent=pivot;o.location=(0,0,-.55);o.dimensions=(.08,.009,.1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(wood)
# Join meshes sharing a suspension parent; retain tube/clapper pivots.
for parent in [root,pivot]:
 children=[o for o in bpy.data.objects if o.type=='MESH' and o.parent==parent]
 bpy.ops.object.select_all(action='DESELECT')
 for child in children:child.select_set(True)
 bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join()
 bpy.context.object.name='suspension' if parent==root else 'moving_striker'
manifest={'version':1,'id':'coastal-chime','source':'Original Sri portfolio instrument; scripts/blender/build_coastal_chime.py','license':'Project-owned original geometry','profile':'interactive','units':'metres','nodes':['coastal_chime','clapper']+[f'tube_{i}' for i in range(6)],'extras':{'coastal_chime':{'soundProfile':'brass_tube','interaction':'wind_contact'}},'tubeFrequencies':notes}
masters=APP/'resources'/'authored';bpy.ops.wm.save_as_mainfile(filepath=str(masters/'coastal-chime.blend'));(masters/'coastal-chime.json').write_text(json.dumps(manifest,indent=2));export_scene(APP/'public'/'models'/'coastal-chime.glb',manifest)
