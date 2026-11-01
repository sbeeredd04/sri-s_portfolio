"""Original contemporary waterfront bench; authored master + verified GLB.
Curved textured timber slats, powder-coated steel runners, armrests, flush fasteners and
mounting feet. Blender Z up; exported front faces glTF +Z. Dimensions metres.
"""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_authored import export_scene
from coastal_materials import surface, metric_uv
APP = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
root = bpy.data.objects.new("coastal_bench", None)
bpy.context.collection.objects.link(root)
root["soundProfile"] = "wood-metal"
root["seatHeight"] = 0.46


def material(name, color, roughness, metal=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color,1)
    p.inputs["Roughness"].default_value = roughness
    p.inputs["Metallic"].default_value = metal
    return m

wood = surface("oiled_timber", "wood-table", normal_strength=.18)
woods = [wood] * 4
steel = material("graphite_powder_coat",(.055,.07,.075),.42,.65)
bolt = material("brushed_stainless",(.32,.35,.36),.28,.85)
parts = []

def beam(name, location, dimensions, mat, angle=0, bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    o=bpy.context.object; o.name=name; o.dimensions=dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler.x=angle
    modifier=o.modifiers.new("soft_manufactured_edges","BEVEL"); modifier.width=bevel; modifier.segments=3
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    o.data.materials.append(mat); o.parent=root; parts.append(o)
    if mat == wood:
        metric_uv(o, tile=1.8, offset=len(parts)*.137, grain_axis=max(range(3), key=lambda a: dimensions[a]))
    return o

# Seat front to rear, subtly dished with gaps for drainage.
for i in range(6):
    y=-.24+i*.085
    z=.46+.025*((y+.015)/.255)**2
    beam(f"seat_slat_{i}",(0,y,z),(1.8,.073,.036),woods[i%4],bevel=.007)
# Back leans away from the sitter, with rounded top edge.
for i in range(4):
    z=.60+i*.09; y=.27+(z-.60)*.17
    beam(f"back_slat_{i}",(0,y,z),(1.8,.035,.075),woods[(i+1)%4],angle=-.17,bevel=.008)
for x in (-.65,.65):
    beam("runner",(x,0,.035),(.065,.62,.07),steel,bevel=.012)
    for y in (-.2,.22):
        beam("leg",(x,y,.24),(.045,.045,.38),steel,bevel=.008)
        beam("mounting_foot",(x,y,.012),(.12,.095,.024),steel,bevel=.009)
    beam("seat_support",(x,0,.417),(.055,.56,.045),steel)
    beam("back_support",(x,.30,.66),(.045,.045,.42),steel,angle=-.17)
    beam("arm_front",(x,-.17,.565),(.035,.035,.23),steel)
    beam("arm_rest",(x,.015,.69),(.075,.49,.042),woods[1],bevel=.018)
    for i in range(6):
        y=-.24+i*.085; z=.46+.025*((y+.015)/.255)**2+.019
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=(x,y,z))
        o=bpy.context.object; o.name="flush_fastener"; o.scale=(.007,.007,.0015)
        o.data.materials.append(bolt); o.parent=root; parts.append(o)
# Merge static visual parts to retain material batching, keep the semantic root/anchor.
bpy.ops.object.select_all(action="DESELECT")
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join(); visual=bpy.context.object; visual.name="bench_visual"
anchor=bpy.data.objects.new("seat_anchor",None); bpy.context.collection.objects.link(anchor)
anchor.parent=root; anchor.location=(0,0,.46)
manifest={"version":1,"id":"coastal-bench","source":"Original Sri portfolio model; scripts/blender/build_coastal_bench.py","license":"Project-owned original geometry; Poly Haven wood_table_001 maps CC0","profile":"interactive","units":"metres","nodes":["coastal_bench","bench_visual","seat_anchor"],"anchors":["seat_anchor"],"parents":{"bench_visual":"coastal_bench","seat_anchor":"coastal_bench"},"extras":{"coastal_bench":{"soundProfile":"wood-metal","seatHeight":.46}},"footprint":{"width":1.8,"depth":.67},"front":"+Z"}
masters=APP/'resources'/'authored'; masters.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(masters/'coastal-bench.blend'))
(masters/'coastal-bench.json').write_text(json.dumps(manifest,indent=2))
export_scene(APP/'public'/'models'/'coastal-bench.glb',manifest)
print('Created original coastal bench master and verified GLB')
