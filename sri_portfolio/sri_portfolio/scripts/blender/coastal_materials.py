"""Existing CC0 material maps, with metre-scaled UVs for authored coastal assets."""
from pathlib import Path
import bpy

APP = Path(__file__).resolve().parents[2]

def surface(name, folder, roughness=1.0, normal_strength=.25):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    p = nodes.get('Principled BSDF')
    p.inputs['Roughness'].default_value = roughness
    for kind in ('color', 'normal', 'arm'):
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(str(APP / 'public' / 'materials' / folder / f'{kind}.webp'), check_existing=True)
        tex.image.colorspace_settings.name = 'sRGB' if kind == 'color' else 'Non-Color'
        if kind == 'color':
            links.new(tex.outputs['Color'], p.inputs['Base Color'])
        elif kind == 'normal':
            normal = nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value = normal_strength
            links.new(tex.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], p.inputs['Normal'])
        else:
            split = nodes.new('ShaderNodeSeparateColor')
            links.new(tex.outputs['Color'], split.inputs['Color'])
            links.new(split.outputs['Green'], p.inputs['Roughness'])
            links.new(split.outputs['Blue'], p.inputs['Metallic'])
    return mat


def metric_uv(obj, tile=1.0, offset=0.0, grain_axis=None):
    """Box projection before joining; avoids stretching detail over long parts.
    Timber's texture grain follows V, so use the part's longest axis for V.
    """
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    for face in obj.data.polygons:
        dominant = max(range(3), key=lambda a: abs(face.normal[a]))
        axes = [a for a in range(3) if a != dominant]
        if grain_axis in axes:
            axes = [a for a in axes if a != grain_axis] + [grain_axis]
        for index in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[index].vertex_index].co
            uv.data[index].uv = (co[axes[0]] / tile + offset, co[axes[1]] / tile)
