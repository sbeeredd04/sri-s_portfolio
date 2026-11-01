"""Original metre-scale open-front workshop shell. Contemporary exhibit studio with recessed entry and integrated roof."""
import bpy, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from coastal_materials import surface,metric_uv
from export_authored import export_scene
APP=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
root=bpy.data.objects.new('workshop_shell',None);bpy.context.collection.objects.link(root)
root['soundProfile']='wood';root['front']='+Z'
wood=surface('oiled_timber','wood-table',normal_strength=.22)
stone=surface('mineral_plinth','plaster',normal_strength=.15)
steel=bpy.data.materials.new('powder_coated_steel');steel.use_nodes=True
p=steel.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.035,.043,.052,1);p.inputs['Roughness'].default_value=.55;p.inputs['Metallic'].default_value=.45
parts=[]
def box(name,x,y,z,w,h,d,mat,bevel=.006,grain=None):
 # Blender Z up; glTF conversion makes authored y up and front +Z.
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('edge_ease','BEVEL');m.width=bevel;m.segments=2 if mat==stone else 1;bpy.ops.object.modifier_apply(modifier=m.name)
 metric_uv(o,tile=1.2,offset=x*.07,grain_axis=grain)
 o.data.materials.append(mat);o.parent=root;parts.append(o)
box('plinth',0,.06,0,3.45,.12,3.2,stone,.012)
# Recessed timber boards remain below the existing exhibit bases.
for i in range(14):
 x=-1.62+(i+.5)*3.24/14
 box('floor_board',x,.132,0,3.24/14-.004,.024,2.98,wood,.002,1)
# A continuous mineral rear wall and a restrained oak lining warm the exhibit.
box('rear_core',0,1.82,-1.4,3.4,3.5,.13,steel,.004)
for i in range(18):
 x=-1.64+(i+.5)*3.28/18
 box('rear_board',x,1.66,-1.31,3.28/18-.006,3.04,.045,wood,.003,2)
# Opaque ribbed service walls at the rear; clear front bays reveal activity.
for side in [-1,1]:
 box('rear_side_skin',side*1.66,1.8,-.92,.07,3.32,.94,steel,.004)
 for i in range(10):
  box('standing_seam',side*1.712,1.8,-1.36+i*.098,.024,3.32,.018,steel,.002)
 for z in [-1.35,-.4,1.35]:
  box('mullion',side*1.65,1.65,z,.055,3.1,.065,steel)
 for y in [.19,.85,3.17]:
  box('side_rail',side*1.65,y,.475,.065,.055,1.75,steel)
 for i in range(3):
  box('side_board',side*1.65,.31+i*.17,.475,.055,.162,1.66,wood,.003,1)
 # The portal carries the fascia down into the plinth, not a floating sign.
 box('entry_pier',side*1.61,1.88,1.43,.18,3.52,.18,stone,.012)
 box('entry_reveal',side*1.49,1.63,1.40,.055,2.98,.22,steel,.004)
box('entry_lintel',0,3.30,1.43,3.4,.43,.18,stone,.012)
box('fascia',0,3.65,1.44,3.65,.85,.22,stone,.009)
box('entry_shadow_gap',0,3.075,1.45,2.96,.028,.18,steel,.002)
box('threshold',0,.145,1.53,3.12,.01,.10,steel,.004)
# A closed roof with a thin cap, perimeter upstands and a warm recessed soffit.
box('roof_deck',0,3.55,-.1,3.65,.15,3.2,steel,.012)
box('soffit',0,3.46,-.08,3.22,.028,2.98,wood,.003,1)
for side in [-1,1]:
 box('side_parapet',side*1.78,3.73,-.1,.09,.23,3.2,steel,.006)
 box('coping',side*1.78,3.85,-.1,.13,.025,3.24,steel,.004)
box('rear_parapet',0,3.73,-1.66,3.55,.23,.08,steel,.006)
box('rear_coping',0,3.85,-1.66,3.65,.025,.12,steel,.004)
# Roof seams and drainage sit inside the parapet, visible from the arrival.
for x in [-1.25,-.75,-.25,.25,.75,1.25]:
 box('roof_seam',x,3.632,-.12,.015,.018,2.90,steel,.002)
box('roof_drain',1.58,3.64,-1.42,.12,.016,.18,steel,.001)
# Merge compatible pieces; retain one draw per finish rather than per board.
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name='shell_visual'
manifest={'version':1,'id':'workshop-shell','source':'Original Sri portfolio geometry; build_workshop_shell.py','license':'Project-owned geometry; existing Poly Haven maps CC0','profile':'interactive','units':'metres','nodes':['workshop_shell','shell_visual'],'parents':{'shell_visual':'workshop_shell'},'extras':{'workshop_shell':{'soundProfile':'wood','front':'+Z'}},'front':'+Z','footprint':{'width':3.69,'depth':3.32,'center':[0,-.06]}}
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(APP/'resources/authored/workshop-shell.blend'))
(APP/'resources/authored/workshop-shell.json').write_text(json.dumps(manifest,indent=2))
export_scene(APP/'public/models/workshop-shell.glb',manifest)
