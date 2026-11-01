"""Original metre-scale open-front workshop shell. Existing 3.45 x 3.2m envelope."""
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
p=steel.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.085,.10,.115,1);p.inputs['Roughness'].default_value=.48;p.inputs['Metallic'].default_value=.6
parts=[]
def box(name,x,y,z,w,h,d,mat,bevel=.006,grain=None):
 # Blender Z up; glTF conversion makes authored y up and front +Z.
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('edge_ease','BEVEL');m.width=bevel;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name)
 metric_uv(o,tile=1.2,offset=x*.07,grain_axis=grain)
 o.data.materials.append(mat);o.parent=root;parts.append(o)
box('plinth',0,.06,0,3.45,.12,3.2,stone,.012)
# Recessed timber boards remain below the existing exhibit bases.
for i in range(14):
 x=-1.62+(i+.5)*3.24/14
 box('floor_board',x,.132,0,3.24/14-.004,.024,2.98,wood,.002,1)
box('rear_core',0,1.65,-1.4,3.4,3.1,.13,steel,.004)
for i in range(18):
 x=-1.64+(i+.5)*3.28/18
 box('rear_board',x,1.65,-1.31,3.28/18-.006,3.02,.045,wood,.003,2)
# Side frames carry the glass, with a sill and transom; the entry stays open.
for side in [-1,1]:
 for z in [-1.35,0,1.35]:box('mullion',side*1.65,1.65,z,.055,3.1,.065,steel)
 for y in [.19,.85,3.17]:box('side_rail',side*1.65,y,0,.065,.055,2.76,steel)
 # Timber spandrel protects the lower side wall and grounds the glazing.
 for i in range(3):box('side_board',side*1.65,.31+i*.17,0,.055,.162,2.66,wood,.003,1)
box('front_header',0,3.17,1.35,3.35,.075,.07,steel)
box('threshold',0,.145,1.53,3.32,.01,.10,steel,.004)
# Merge compatible pieces; retain one draw per finish rather than per board.
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name='shell_visual'
manifest={'version':1,'id':'workshop-shell','source':'Original Sri portfolio geometry; build_workshop_shell.py','license':'Project-owned geometry; existing Poly Haven maps CC0','profile':'interactive','units':'metres','nodes':['workshop_shell','shell_visual'],'parents':{'shell_visual':'workshop_shell'},'extras':{'workshop_shell':{'soundProfile':'wood','front':'+Z'}},'front':'+Z','footprint':{'width':3.45,'depth':3.2}}
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(APP/'resources/authored/workshop-shell.blend'))
(APP/'resources/authored/workshop-shell.json').write_text(json.dumps(manifest,indent=2))
export_scene(APP/'public/models/workshop-shell.glb',manifest)
