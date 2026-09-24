"""Blender headless: author, rig, animate and export the chibi Sri character.

  blender -b --python scripts/blender/character/build.py -- [--out public/models/characters/sri.glb]
      [--blend /tmp/sri.blend] [--no-anim]

Pipeline: SDF body parts -> OpenVDB meshing -> decimation to budget -> face
features + hair strands -> humanoid armature -> heat weights (arms, clothing)
and analytic weights (head, shoes, watch) -> baked PBR maps -> procedural
actions (idle, walk, typing, wave, sit) -> GLB (WebP, meshopt) + stats JSON.
All geometry is authored here (no third-party meshes); linen normal is CC0.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import anatomy as A  # noqa: E402
import animate  # noqa: E402
import body_parts as B  # noqa: E402
import face as FACE  # noqa: E402
import geometry  # noqa: E402
import hair as HAIR  # noqa: E402
import look  # noqa: E402
import materials as M  # noqa: E402
import rig as RIG  # noqa: E402
from sdf import decimate, mesh_sdf  # noqa: E402

APP = Path(__file__).resolve().parents[3]


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", type=Path, default=APP / "public" / "models" / "characters" / "sri.glb")
    p.add_argument("--blend", type=Path)
    p.add_argument("--no-anim", action="store_true")
    p.add_argument("--no-export", action="store_true")
    p.add_argument("--stats", type=Path, help="write triangle/bone/clip stats JSON here")
    return p.parse_args(argv)


SHOE_SCALE = 1.12


def scale_about(obj, pivot, k: float) -> None:
    p = Matrix.Translation(Vector(pivot))
    obj.data.transform(p @ Matrix.Scale(k, 4) @ p.inverted(), shape_keys=True)


def squeeze_uv(obj, origin, extent: float) -> None:
    """Pack all UVs into a tiny patch: the scalp cap reads as flat root colour."""
    uv = obj.data.uv_layers.active.data
    arr = np.empty(len(uv) * 2, np.float32)
    uv.foreach_get("uv", arr)
    arr = arr.reshape(-1, 2) * extent + np.asarray(origin, np.float32)
    uv.foreach_set("uv", arr.ravel())


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = objs[0].data.name = name
    return objs[0]


def delete_verts(obj, cond):
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    doomed = [v for v in bm.verts if cond(np.array(v.co))]
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()


def trim_hidden(parts):
    """Drop skin that always sits inside the sleeves / collar."""
    for s, key in ((1, "arm_L"), (-1, "arm_R")):
        a = A.arm(s)
        sh, el = a["shoulder"], a["elbow"]
        axis = (el - sh) / np.linalg.norm(el - sh)
        cut = 0.12 * np.linalg.norm(el - sh)
        delete_verts(parts[key], lambda co, sh=sh, axis=axis, cut=cut: (co - sh) @ axis < cut)
    delete_verts(parts["head"], lambda co: co[2] < 0.79)


def assemble():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    parts = geometry.build()
    head_fn = B.head_skin()[0]
    face = FACE.build(head_fn)
    clumps, cap = HAIR.build_clumps(), HAIR.build_cap()
    for obj in (parts["head"], face, clumps, cap):
        scale_about(obj, A.HEAD_BASE, A.HEAD_SCALE)
    for key, s in (("shoe_L", 1), ("shoe_R", -1)):
        x = float(A.leg(s)["ankle"][0])
        for name in ("shoe_sole", "shoe_upper", "shoe_lace"):
            parts[key].data.materials.append(M.principled(name))
        geometry.assign_parts(parts[key], B.shoe_part(geometry.face_centers(parts[key]), x))
        scale_about(parts[key], (x, -0.02, 0.0), SHOE_SCALE)
    watch = mesh_sdf("Watch", *B.watch(1))
    decimate(watch, 500)
    trim_hidden(parts)
    shoes = join([parts["shoe_L"], parts["shoe_R"]], "Shoes")
    body = join([parts["head"], parts["arm_L"], parts["arm_R"]], "Body")
    parts["shirt"].name = "Shirt"
    parts["trousers"].name = "Trousers"
    for obj in (body, parts["shirt"], parts["trousers"], shoes, cap, watch):
        look.unwrap(obj, 0.008)
    squeeze_uv(cap, (0.03, 0.2), 0.02)
    hair = join([clumps, cap], "Hair")
    for obj in (body, parts["shirt"], parts["trousers"], shoes, watch, hair, face):
        select_only(obj)
        bpy.ops.object.shade_smooth()
    return {"Body": body, "Face": face, "Hair": hair, "Shirt": parts["shirt"],
            "Trousers": parts["trousers"], "Shoes": shoes, "Watch": watch}


ALLOWED = {
    "Shirt": ("hips", "spine", "chest", "neck", "shoulder_", "upper_arm_", "lower_arm_L", "lower_arm_R"),
    "Trousers": ("hips", "spine", "upper_leg_", "lower_leg_", "foot_"),
}


def weight(objs, rig):
    body = objs["Body"]
    for key in ("Body", "Shirt", "Trousers"):
        RIG.auto_weights(objs[key], rig)
        if key in ALLOWED:
            for vg in list(objs[key].vertex_groups):
                if not vg.name.startswith(ALLOWED[key]) or "twist" in vg.name:
                    objs[key].vertex_groups.remove(vg)
    co = RIG.verts(body)
    head_island = (np.abs(co[:, 0]) < 0.07) | (co[:, 2] > 0.86)
    hw = RIG.head_weights(co)
    for vg in body.vertex_groups:
        idx = np.nonzero(head_island)[0]
        vg.remove(idx.tolist())
    for name, w in hw.items():
        vg = body.vertex_groups.get(name) or body.vertex_groups.new(name=name)
        for i in np.nonzero(head_island & (w > 1e-4))[0]:
            vg.add([int(i)], float(w[i]), "REPLACE")
    split_twist(body, co)
    for key in ("Face", "Hair"):
        RIG.set_weights(objs[key], {"head": np.ones(len(objs[key].data.vertices), np.float32)})
    sco = RIG.verts(objs["Shoes"])
    w = {}
    for s, sfx in ((1, "L"), (-1, "R")):
        side = (np.sign(sco[:, 0]) == s).astype(np.float32)
        for name, arr in RIG.shoe_weights(sco, sfx).items():
            w[name] = arr * side
    RIG.set_weights(objs["Shoes"], w)
    RIG.set_weights(objs["Watch"], {"lower_arm_twist_L": np.ones(len(objs["Watch"].data.vertices), np.float32)})
    for obj in objs.values():
        RIG.bind(obj, rig)
        RIG.clean(obj)


def split_twist(body, co):
    """Blend forearm weight from lower_arm into its twist bone toward the wrist."""
    for s, sfx in ((1, "L"), (-1, "R")):
        a = A.arm(s)
        el, wr = a["elbow"], a["wrist"]
        axis = wr - el
        t = ((co - el) @ axis) / float(axis @ axis)
        low = body.vertex_groups.get(f"lower_arm_{sfx}")
        tw = body.vertex_groups.get(f"lower_arm_twist_{sfx}") or body.vertex_groups.new(name=f"lower_arm_twist_{sfx}")
        if low is None:
            continue
        frac = RIG.smoothstep(0.15, 0.95, t)
        for i in range(len(co)):
            total = 0.0
            for g in body.data.vertices[i].groups:
                if g.group in (low.index, tw.index):
                    total += g.weight
            if total <= 0:
                continue
            low.add([i], float(total * (1 - frac[i])), "REPLACE")
            tw.add([i], float(total * frac[i]), "REPLACE")


def tri_count(obj) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def export(path: Path, rig) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format="GLB", export_image_format="WEBP", export_image_quality=88,
        export_meshopt_compression_enable=True, export_animations=True, export_animation_mode="ACTIONS",
        export_force_sampling=True, export_frame_step=1, export_morph=True, export_morph_normal=True,
        export_skins=True, export_influence_nb=4, export_def_bones=True, export_leaf_bone=False,
        export_yup=True, export_apply=False, export_optimize_animation_size=True,
        export_optimize_animation_keep_anim_armature=False,
        export_anim_slide_to_zero=True, export_extras=False, export_cameras=False, export_lights=False,
        export_rest_position_armature=True, export_reset_pose_bones=True)


def main() -> None:
    args = parse_args()
    objs = assemble()
    rig = RIG.build_armature()
    weight(objs, rig)
    look.dress(objs)
    clips = {} if args.no_anim else animate.bake_all(rig, objs["Face"])
    stats = {
        "triangles": {k: tri_count(o) for k, o in objs.items()},
        "bones": [b.name for b in rig.data.bones],
        "clips": clips,
        "materials": sorted({s.material.name for o in objs.values() for s in o.material_slots}),
    }
    stats["triangles"]["total"] = sum(stats["triangles"].values())
    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(args.blend))
    if not args.no_export:
        export(args.out, rig)
        stats["bytes"] = args.out.stat().st_size
    print("STATS " + json.dumps(stats))
    if args.stats:
        args.stats.write_text(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
