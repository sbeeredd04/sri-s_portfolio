"""Render character previews from a .blend or an exported .glb.

  blender -b --python scripts/blender/character/render.py -- --src sri.glb --out previews/ \
      --shots front,three_quarter,face [--action walk --frame 5] [--engine CYCLES]

With --src *.glb the file is re-imported first, which proves the shipped asset
(meshopt, WebP, skin, morphs, actions) decodes and plays.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import preview  # noqa: E402


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--src", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--shots", default="front,three_quarter,face")
    p.add_argument("--action")
    p.add_argument("--frame", type=int, default=0)
    p.add_argument("--engine", default="BLENDER_EEVEE")
    p.add_argument("--size", type=int, default=768)
    p.add_argument("--prefix", default="")
    p.add_argument("--keys", default="", help="shape keys to set, e.g. smile=1,blink=0.5")
    p.add_argument("--props", action="store_true", help="add a chair/desk/sofa proxy for seated clips")
    p.add_argument("--cam", action="append", default=[], help="name=x,y,z,tx,ty,tz,lens extra camera shot")
    return p.parse_args(argv)


def load(src: Path):
    if src.suffix == ".blend":
        bpy.ops.wm.open_mainfile(filepath=str(src))
        for o in list(bpy.data.objects):
            if o.type in {"LIGHT", "CAMERA"} or o.name.startswith("preview_"):
                bpy.data.objects.remove(o)
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(src))
    return next(o for o in bpy.data.objects if o.type == "ARMATURE")


def play(rig, action: str | None, frame: int):
    if not action:
        return
    act = bpy.data.actions[action]
    users = [rig] + [o.data.shape_keys for o in bpy.data.objects if o.type == "MESH" and o.data.shape_keys]
    for user in users:
        ad = user.animation_data or user.animation_data_create()
        for track in ad.nla_tracks:
            track.mute = True
        ad.action = act
        kind = "OBJECT" if user is rig else "KEY"
        slot = next((s for s in act.slots if s.target_id_type == kind), None)
        if slot is not None:
            ad.action_slot = slot
    bpy.context.scene.frame_set(frame)


def props(action: str):
    """Grey proxy furniture so seated clips can be judged against real heights."""
    def box(name, loc, size):
        bpy.ops.mesh.primitive_cube_add(location=loc)
        o = bpy.context.active_object
        o.name = "preview_" + name
        o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    if action == "typing":
        box("seat", (0, 0.05, 0.47), (0.44, 0.42, 0.06))
        box("desk", (0, -0.52, 0.765), (1.2, 0.6, 0.03))
        box("keyboard", (0, -0.3, 0.79), (0.34, 0.12, 0.02))
    elif action == "sit":
        box("sofa_seat", (0, 0.1, 0.4), (1.4, 0.55, 0.12))
        box("sofa_back", (0, 0.42, 0.7), (1.4, 0.14, 0.55))


def set_keys(spec: str):
    if not spec:
        return
    vals = dict(kv.split("=") for kv in spec.split(","))
    for o in bpy.data.objects:
        keys = getattr(o.data, "shape_keys", None) if o.type == "MESH" else None
        if keys:
            if keys.animation_data:
                keys.animation_data.action = None
            for k, v in vals.items():
                if k in keys.key_blocks:
                    keys.key_blocks[k].value = float(v)


def main():
    args = parse_args()
    rig = load(args.src)
    play(rig, args.action, args.frame)
    set_keys(args.keys)
    if args.props and args.action:
        props(args.action)
    preview.setup(args.size, args.engine)
    custom = {
        "hf": preview.orbit(1.15, 1.1, 1.04, 0, 60),
        "h34": preview.orbit(1.15, 1.12, 1.04, 35, 60),
        "side_l": preview.orbit(3.2, 0.8, 0.62, 90, 50),
        "seated": preview.orbit(3.0, 1.2, 0.62, 55, 50),
        "seated_side": preview.orbit(3.0, 0.9, 0.62, 90, 50),
        "wave_view": preview.orbit(3.0, 1.0, 0.72, -25, 50),
    }
    for spec in args.cam:
        name, vals = spec.split("=")
        v = [float(x) for x in vals.split(",")]
        custom[name] = (tuple(v[:3]), tuple(v[3:6]), v[6])
    preview.render(args.out, args.shots.split(","), prefix=args.prefix, custom=custom)


if __name__ == "__main__":
    main()
