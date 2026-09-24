"""Triangle-budget helpers for optimize_model.py.

Heavy per-island work (Poly Haven trees reach millions of triangles) runs through
temporary Geometry Nodes modifiers and numpy, not Python loops over bmesh.
"""
from __future__ import annotations

import math

import bpy
import numpy as np


def tri_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def _apply_nodes(obj: bpy.types.Object, build) -> None:
    group = bpy.data.node_groups.new("pipeline_tmp", "GeometryNodeTree")
    group.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    group.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nodes, links = group.nodes, group.links
    gin, gout = nodes.new("NodeGroupInput"), nodes.new("NodeGroupOutput")
    links.new(build(nodes, links, gin.outputs[0]), gout.inputs[0])
    mod = obj.modifiers.new("pipeline_tmp", "NODES")
    mod.node_group = group
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.node_groups.remove(group)


def _named(nodes, name: str, data_type: str):
    node = nodes.new("GeometryNodeInputNamedAttribute")
    node.data_type = data_type
    node.inputs["Name"].default_value = name
    return node.outputs["Attribute"]


def face_islands(obj: bpy.types.Object) -> tuple[np.ndarray, np.ndarray]:
    """Per-face island index and triangle count (numpy arrays)."""
    def build(nodes, links, geo):
        island = nodes.new("GeometryNodeInputMeshIsland")
        store = nodes.new("GeometryNodeStoreNamedAttribute")
        store.data_type, store.domain = "INT", "FACE"
        store.inputs["Name"].default_value = "island"
        links.new(geo, store.inputs["Geometry"])
        links.new(island.outputs["Island Index"], store.inputs["Value"])
        return store.outputs["Geometry"]
    _apply_nodes(obj, build)
    mesh = obj.data
    idx = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.attributes["island"].data.foreach_get("value", idx)
    loops = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.polygons.foreach_get("loop_total", loops)
    mesh.attributes.remove(mesh.attributes["island"])
    return idx, loops - 2


def _write_keep(obj: bpy.types.Object, keep: np.ndarray) -> None:
    attr = obj.data.attributes.new("keep", "BOOLEAN", "FACE")
    attr.data.foreach_set("value", keep)


def delete_and_scale(obj: bpy.types.Object, keep_faces: np.ndarray, scale: float = 1.0) -> None:
    """Delete faces where keep is False; scale each remaining connected card about its centre."""
    _write_keep(obj, keep_faces)

    def build(nodes, links, geo):
        invert = nodes.new("FunctionNodeBooleanMath")
        invert.operation = "NOT"
        links.new(_named(nodes, "keep", "BOOLEAN"), invert.inputs[0])
        delete = nodes.new("GeometryNodeDeleteGeometry")
        delete.domain = "FACE"
        links.new(geo, delete.inputs["Geometry"])
        links.new(invert.outputs[0], delete.inputs["Selection"])
        if math.isclose(scale, 1.0):
            return delete.outputs["Geometry"]
        grow = nodes.new("GeometryNodeScaleElements")
        grow.domain = "FACE"
        grow.inputs["Scale"].default_value = scale
        links.new(delete.outputs["Geometry"], grow.inputs["Geometry"])
        return grow.outputs["Geometry"]
    _apply_nodes(obj, build)
    if "keep" in obj.data.attributes:
        obj.data.attributes.remove(obj.data.attributes["keep"])


def fix_shading(obj: bpy.types.Object, angle: float = 40.0) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))


def weld(obj: bpy.types.Object, distance: float = 1e-4) -> None:
    """Merge coincident vertices so triangle-soup scans become connected surfaces collapse can simplify."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=distance)
    bpy.ops.object.mode_set(mode="OBJECT")


def collapse(obj: bpy.types.Object, target: int) -> None:
    current = tri_count(obj)
    if current <= target:
        return
    weld(obj)
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = max(0.0005, target / current)
    mod.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    fix_shading(obj)


def prune_small_islands(obj: bpy.types.Object, max_tris: int) -> None:
    """Drop the smallest disconnected parts (fine twigs, pebbles) until under max_tris."""
    idx, tris = face_islands(obj)
    if tris.sum() <= max_tris:
        return
    areas = np.empty(len(obj.data.polygons), dtype=np.float64)
    obj.data.polygons.foreach_get("area", areas)
    island_area = np.bincount(idx, weights=areas)
    island_tris = np.bincount(idx, weights=tris)
    order = np.argsort(-island_area)  # largest first
    # The largest part (trunk) always survives and does not count against the cap.
    budget = max_tris + island_tris[order[0]]
    keep_islands = order[np.cumsum(island_tris[order]) <= budget]
    keep = np.zeros(len(island_area), dtype=bool)
    keep[order[0]] = True
    keep[keep_islands] = True
    delete_and_scale(obj, keep[idx])


def thin_cards(obj: bpy.types.Object, target: int, seed: int, max_scale: float) -> None:
    """Alpha-card foliage: simplify each card (~4 tris), then keep a random subset scaled up to hold coverage."""
    idx, tris = face_islands(obj)
    cards = int(idx.max()) + 1 if len(idx) else 0
    total = int(tris.sum())
    if total <= target:
        return
    if total / max(1, cards) > 4:
        collapse(obj, max(target, 4 * cards))
        idx, tris = face_islands(obj)
        cards = int(idx.max()) + 1 if len(idx) else 0
        total = int(tris.sum())
    if total <= target:
        return
    ratio = target / total
    rng = np.random.default_rng(seed)
    keep_islands = rng.random(cards) < ratio
    delete_and_scale(obj, keep_islands[idx], min(max_scale, ratio ** -0.5))
