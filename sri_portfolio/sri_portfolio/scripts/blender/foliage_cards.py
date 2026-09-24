"""Billboard-cloud foliage for huge Poly Haven trees (millions of alpha-card triangles).

Needles/leaves are clustered (k-means on face centres); each cluster becomes one
double-sided quad on its best-fit plane, and the original foliage is baked onto an
atlas with Cycles selected-to-active (albedo + alpha). Card normals are bent
toward a canopy sphere so the web renderer shades the crown softly.
"""
from __future__ import annotations

import math

import bpy
import numpy as np


def _face_samples(obj: bpy.types.Object, limit: int, rng: np.random.Generator) -> np.ndarray:
    mesh = obj.data
    count = len(mesh.polygons)
    centres = np.empty(count * 3, dtype=np.float32)
    mesh.polygons.foreach_get("center", centres)
    areas = np.empty(count, dtype=np.float64)
    mesh.polygons.foreach_get("area", areas)
    centres = centres.reshape(-1, 3)
    if count <= limit:
        return centres
    pick = rng.choice(count, size=limit, replace=False, p=areas / areas.sum())
    return centres[pick]


def _kmeans(points: np.ndarray, k: int, rng: np.random.Generator, iters: int = 12) -> tuple:
    centroids = points[rng.choice(len(points), size=k, replace=False)].copy()
    labels = np.zeros(len(points), dtype=np.int32)
    for _ in range(iters):
        for start in range(0, len(points), 20000):
            chunk = points[start:start + 20000]
            d = ((chunk[:, None, :] - centroids[None, :, :]) ** 2).sum(-1)
            labels[start:start + 20000] = d.argmin(1)
        for i in range(k):
            members = points[labels == i]
            if len(members):
                centroids[i] = members.mean(0)
    return centroids, labels


def _card_frames(points, labels, k, trunk_axis_xy) -> list[dict]:
    cards = []
    for i in range(k):
        pts = points[labels == i]
        if len(pts) < 6:
            continue
        centre = pts.mean(0)
        _vals, vecs = np.linalg.eigh(np.cov((pts - centre).T))
        normal, v_axis, u_axis = vecs[:, 0], vecs[:, 1], vecs[:, 2]
        outward = centre.copy()
        outward[:2] -= trunk_axis_xy
        outward[2] = 0.3 * np.linalg.norm(outward[:2])
        if np.dot(normal, outward) < 0:
            normal = -normal
        v_axis = np.cross(normal, u_axis)
        rel = pts - centre
        pu, pv, pn = rel @ u_axis, rel @ v_axis, rel @ normal
        u_lo, u_hi = np.percentile(pu, [3, 97])
        v_lo, v_hi = np.percentile(pv, [3, 97])
        pad_u, pad_v = 0.06 * (u_hi - u_lo), 0.06 * (v_hi - v_lo)
        cards.append({
            "centre": centre, "u": u_axis, "v": v_axis, "n": normal,
            "u_range": (u_lo - pad_u, u_hi + pad_u), "v_range": (v_lo - pad_v, v_hi + pad_v),
            "thickness": float(np.percentile(np.abs(pn), 90)),
        })
    return cards


def _build_mesh(cards: list[dict], name: str, canopy_centre: np.ndarray) -> bpy.types.Object:
    grid = math.ceil(math.sqrt(len(cards)))
    inset = 0.5 / 256
    verts, faces, uvs, normals = [], [], [], []
    for i, card in enumerate(cards):
        col, row = i % grid, i // grid
        (u0, u1), (v0, v1) = card["u_range"], card["v_range"]
        corners = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        tile = [(0, 0), (1, 0), (1, 1), (0, 1)]
        base = len(verts)
        for (cu, cv), (tu, tv) in zip(corners, tile):
            p = card["centre"] + card["u"] * cu + card["v"] * cv
            verts.append(tuple(p))
            uvs.append(((col + inset + tu * (1 - 2 * inset)) / grid, (row + inset + tv * (1 - 2 * inset)) / grid))
            radial = p - canopy_centre
            radial /= max(np.linalg.norm(radial), 1e-6)
            bent = 0.65 * radial + 0.35 * card["n"]
            normals.append(tuple(bent / max(np.linalg.norm(bent), 1e-6)))
        faces.append((base, base + 1, base + 2, base + 3))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        uv_layer.data[loop.index].uv = uvs[loop.vertex_index]
    mesh.shade_smooth()
    mesh.normals_split_custom_set_from_vertices(normals)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _alpha_to_emission(mat: bpy.types.Material) -> None:
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    out = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    emit = nodes.new("ShaderNodeEmission")
    if bsdf.inputs["Alpha"].is_linked:
        links.new(bsdf.inputs["Alpha"].links[0].from_socket, emit.inputs["Color"])
    else:
        emit.inputs["Color"].default_value = (1, 1, 1, 1)
    links.new(emit.outputs["Emission"], out.inputs["Surface"])


def _bake(high: bpy.types.Object, low: bpy.types.Object, image, bake_type: str, extrusion: float) -> None:
    node = low.active_material.node_tree.nodes["bake_target"]
    node.image = image
    low.active_material.node_tree.nodes.active = node
    bpy.ops.object.select_all(action="DESELECT")
    high.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    kwargs = dict(type=bake_type, use_selected_to_active=True, cage_extrusion=extrusion,
                  max_ray_distance=extrusion * 2.2, margin=3, use_clear=False, target="IMAGE_TEXTURES")
    if bake_type == "DIFFUSE":
        kwargs["pass_filter"] = {"COLOR"}
    bpy.ops.object.bake(**kwargs)


def build_cards(foliage: bpy.types.Object, count: int, atlas: int, seed: int, name: str) -> bpy.types.Object:
    rng = np.random.default_rng(seed)
    points = _face_samples(foliage, 150000, rng)
    centroids, labels = _kmeans(points, min(count, len(points) // 8), rng)
    trunk_xy = np.median(points[:, :2], axis=0)
    cards = _card_frames(points, labels, len(centroids), trunk_xy)
    canopy_centre = np.array([trunk_xy[0], trunk_xy[1], np.percentile(points[:, 2], 55)])
    low = _build_mesh(cards, name, canopy_centre)
    extrusion = float(np.percentile([c["thickness"] for c in cards], 90)) + 0.02

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 4
    scene.cycles.device = "CPU"
    color = bpy.data.images.new(f"{name}_color", atlas, atlas, alpha=True)
    alpha = bpy.data.images.new(f"{name}_alpha", atlas, atlas, alpha=False)
    color.generated_color = (0.18, 0.22, 0.12, 1.0)
    alpha.generated_color = (0, 0, 0, 1)
    alpha.colorspace_settings.name = "Non-Color"

    mat = bpy.data.materials.new(f"{name}_foliage")
    mat.use_nodes = True
    target = mat.node_tree.nodes.new("ShaderNodeTexImage")
    target.name = "bake_target"
    low.data.materials.append(mat)

    _bake(foliage, low, color, "DIFFUSE", extrusion)
    # Only the alpha (foliage) materials: trunk materials share these slots but must stay intact.
    for leaf_mat in {s.material for s in foliage.material_slots if s.material}:
        leaf_bsdf = next((n for n in leaf_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if leaf_bsdf and leaf_bsdf.inputs["Alpha"].is_linked:
            _alpha_to_emission(leaf_mat)
    _bake(foliage, low, alpha, "EMIT", extrusion)

    px = np.empty(atlas * atlas * 4, dtype=np.float32)
    color.pixels.foreach_get(px)
    a = np.empty(atlas * atlas * 4, dtype=np.float32)
    alpha.pixels.foreach_get(a)
    px = px.reshape(-1, 4)
    px[:, 3] = a.reshape(-1, 4)[:, 0]
    color.pixels.foreach_set(px.ravel())
    color.pack()
    bpy.data.images.remove(alpha)

    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    target.image = color
    links.new(target.outputs["Color"], bsdf.inputs["Base Color"])
    clip = nodes.new("ShaderNodeMath")
    clip.operation = "ROUND"
    links.new(target.outputs["Alpha"], clip.inputs[0])
    links.new(clip.outputs[0], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.85
    mat.use_backface_culling = False
    print(f"  foliage cards: {len(cards)} cards, atlas {atlas}px, extrusion {extrusion:.3f} m")
    return low
