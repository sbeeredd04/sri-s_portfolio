"""Export Sri's supplied p11 island without modifying its Blender source.

blender -b --disable-autoexec --python scripts/blender/export_outthere_p11.py -- \
  --source /absolute/path/poly_dome11.blend
Human-scale conversion is applied once by the shared runtime island frame.
"""
import argparse, hashlib, json, sys
from pathlib import Path
import bpy

APP = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
a = p.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(a.source), load_ui=False)
bpy.context.scene.frame_set(1)
# Render-only target props and baked grass are not part of the navigable island.
excluded = {'ground','hills','sky_card','sky_ridge','redwood0','redwood1','grass','grass_island'}
for obj in list(bpy.context.scene.objects):
    if obj.type == 'LIGHT' or obj.name in excluded:
        bpy.data.objects.remove(obj, do_unlink=True)
# Dense micro-facets can be simplified while preserving the delivered silhouettes.
# Keep the rock, architectural geometry, paths, trees and animals intact.
ratios = {'ferns': .38, 'coast_ledges': .64, 'coast_flowers': .45}
for obj in bpy.context.scene.objects:
    if obj.name not in ratios: continue
    mod = obj.modifiers.new('web_surface_detail','DECIMATE')
    mod.ratio = ratios[obj.name]
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH' or not obj.data.color_attributes: continue
    attrs = obj.data.color_attributes
    attrs.active_color = attrs.get('Col') or attrs[0]
    attrs.render_color_index = list(attrs).index(attrs.active_color)
    if obj.name in {'ocean','pool','tarn','plunge_pool','lake_outflow','creek'}:
        # Flat facets belong to the rock/soil. Smooth water normals avoid
        # enormous triangular specular spokes across the ocean and lake.
        for polygon in obj.data.polygons: polygon.use_smooth = True
# No refractive extra render pass: retain the palette and transparent glazing.
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if not bsdf: continue
    if 'Transmission Weight' in bsdf.inputs: bsdf.inputs['Transmission Weight'].default_value = 0
    if mat.name == 'PT_Glass':
        bsdf.inputs['Alpha'].default_value = .42
        bsdf.inputs['Roughness'].default_value = .12
        mat.surface_render_method = 'DITHERED'
raw = APP/'asset-src/authored/out-there/p11-raw.glb'
raw.parent.mkdir(parents=True,exist_ok=True)
props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
opts = dict(filepath=str(raw),export_format='GLB',export_yup=True,export_apply=True,
            export_vertex_color='ACTIVE',export_all_vertex_colors=False,
            export_animations=True,export_animation_mode='ACTIONS',
            export_force_sampling=True,export_frame_range=True,
            export_cameras=False,export_lights=False,export_extras=True,
            export_skins=True,export_morph=True,export_meshopt_compression_enable=False)
bpy.ops.export_scene.gltf(**{k:v for k,v in opts.items() if k in props})
manifest = {'source':str(a.source),'sourceSha256':hashlib.sha256(a.source.read_bytes()).hexdigest(),
            'sourceUnchanged':True,'worldUnitsPerMetre':1.56,'excludedObjects':sorted(excluded),
            'detailRatios':ratios,'animations':[a.name for a in bpy.data.actions],
            'objects':[o.name for o in bpy.context.scene.objects if o.type=='MESH']}
(APP/'asset-src/authored/out-there/source.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('P11_RAW',raw,raw.stat().st_size)
