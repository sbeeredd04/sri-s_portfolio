"""Precast waterfront seat wall: staggered joints, capped top, eased edges.
Preserves the existing lookout's 6.2 x .55m maximum footprint and .88m height.
"""
import json
import sys
from pathlib import Path
import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from coastal_materials import surface, metric_uv
from export_authored import export_scene
APP = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
root = bpy.data.objects.new('coastal_wall', None)
bpy.context.collection.objects.link(root)
root['soundProfile'] = 'stone'
stone = surface('mineral_finish', 'plaster', normal_strength=.2)
parts = []
def block(name, x, z, width, depth, height, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, z))
    o = bpy.context.object; o.name = name
    o.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new('eased_edges', 'BEVEL'); mod.width=bevel; mod.segments=3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    metric_uv(o, tile=1.5, offset=x*.17)
    o.data.materials.append(stone); o.parent=root; parts.append(o)
# Two courses with staggered construction joints; a continuous recessed core
# prevents visible holes through the wall while the joints cast shallow shade.
block('wall_core', 0, .4, 5.98, .42, .8, .005)
for row, cuts in enumerate(([-3,-2,-1,0,1,2,3], [-3,-2.5,-1.5,-.5,.5,1.5,2.5,3])):
    for a,b in zip(cuts,cuts[1:]):
        block('wall_course', (a+b)/2, .2+row*.4, b-a-.012, .45, .388, .008)
for i in range(6):
    block('coping', -3.1+(i+.5)*(6.2/6), .84, 6.2/6-.008, .55, .08, .012)
bpy.ops.object.select_all(action='DESELECT')
for part in parts: part.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join(); bpy.context.object.name='wall_visual'
manifest = {'version':1, 'id':'coastal-wall', 'source':'Original Sri portfolio model; scripts/blender/build_coastal_wall.py', 'license':'Project-owned original geometry; Poly Haven painted_plaster_wall maps CC0', 'profile':'interactive', 'units':'metres', 'nodes':['coastal_wall','wall_visual'], 'parents':{'wall_visual':'coastal_wall'}, 'extras':{'coastal_wall':{'soundProfile':'stone'}}, 'footprint':{'width':6.2,'depth':.55}, 'front':'+Z'}
masters=APP/'resources'/'authored'
bpy.ops.wm.save_as_mainfile(filepath=str(masters/'coastal-wall.blend'))
(masters/'coastal-wall.json').write_text(json.dumps(manifest,indent=2))
export_scene(APP/'public'/'models'/'coastal-wall.glb',manifest)
