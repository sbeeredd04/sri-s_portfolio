"""The five glTF actions: idle, walk, typing, wave, sit (30 fps, in place).

Seated clips keep the armature origin on the floor directly under the hip
joints; thighs point along -Y (glTF +Z, forward). See README for measurements.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Matrix, Vector

import anatomy as A
from pose import Limb, Pose, Solver, euler, frame_from, quat

FPS = 30
WALK_SPEED = 1.2        # m/s the walk cycle is authored for
WALK_FRAMES = 18        # 0.6 s cycle -> 0.72 m stride
SOFA_SEAT = 0.46
DESK_SEAT = 0.50
DESK_WRIST_Z = 0.80
HIP_REST = A.leg(1)["hip"][2]
HIPS_REST = A.SPINE["hips"][0][2]
SIDES = ((1, "L"), (-1, "R"))
RELAXED = {"thumb": (4, 10, 8), "index": (12, 16, 10), "middle": (15, 19, 12), "ring": (18, 21, 13), "pinky": (21, 24, 15)}


def V(*a) -> Vector:
    return Vector(a)


def curl(pose: Pose, sfx: str, table: dict, extra: dict | None = None) -> None:
    for finger, angles in table.items():
        for i, ang in enumerate(angles):
            add = (extra or {}).get(finger, (0, 0, 0))[i]
            pose.local[f"{finger}_0{i + 1}_{sfx}"] = euler(x=ang + add)


def trunk(pose: Pose, pitch=0.0, yaw=0.0, roll=0.0, chest=(0, 0, 0), neck=(0, 0, 0), head=(0, 0, 0)):
    pose.local["hips"] = euler(pitch, yaw, roll)
    pose.local["spine"] = euler(chest[0] * 0.5, chest[1] * 0.5, chest[2] * 0.5)
    pose.local["chest"] = euler(chest[0] * 0.5, chest[1] * 0.5, chest[2] * 0.5)
    pose.local["neck"] = euler(*neck)
    pose.local["head"] = euler(*head)


def foot_rot(pitch_deg: float, s: int, toe_out: float = 6.0) -> Matrix:
    g = A.leg(s)
    d = Vector(g["ball"]) - Vector(g["ankle"])
    yaw = quat((0, 0, 1), -toe_out * s)
    pitch = quat((1, 0, 0), pitch_deg)
    return frame_from(yaw @ pitch @ d, yaw @ pitch @ V(0, 0, 1))


def standing_legs(pose: Pose, lift=(0.0, 0.0), spread=0.0):
    for (s, sfx), dz in zip(SIDES, lift):
        g = A.leg(s)
        target = Vector(g["ankle"]) + V(spread * s, 0, dz)
        pose.limbs[f"leg_{sfx}"] = Limb(target, V(0.12 * s, -1, 0), foot_rot(0, s))


def hanging_arm(pose: Pose, s: int, sfx: str, swing=0.0, bend=0.0, out=0.0):
    """Relaxed arm: wrist hangs below the shoulder; swing (deg) moves it forward."""
    a = A.arm(s)
    shoulder = Vector(a["shoulder"])
    reach = 0.278 - bend * 0.0004
    down = quat((1, 0, 0), -swing) @ V((0.2 + out) * s, -0.06, -1).normalized()
    wrist = shoulder + down * reach
    fingers = quat((1, 0, 0), -swing * 0.8) @ V(0.08 * s, -0.25, -1)
    pose.limbs[f"arm_{sfx}"] = Limb(wrist, V(0.35 * s, 1, 0.1), frame_from(fingers, V(-s, 0.1, 0.25)))


def seated(pose: Pose, seat: float, lean=0.0, knee_open=0.02, swing=(0.0, 0.0)):
    hip_z = seat + 0.066
    pose.hips_loc = V(0, 0, hip_z - HIP_REST)
    pose.local["hips"] = euler(lean)
    for (s, sfx), sw in zip(SIDES, swing):
        g = A.leg(s)
        knee = V(s * (abs(g["hip"][0]) + knee_open), -0.235, hip_z)
        shin = quat((1, 0, 0), 12 + sw) @ V(0, 0, -0.22)
        ankle = knee + shin
        pose.limbs[f"leg_{sfx}"] = Limb(ankle, V(0, -1, 0.4), foot_rot(-8 + sw * 0.5, s, toe_out=10))


# ---------------------------------------------------------------- clips

def idle(t: float, dur: float) -> Pose:
    p = Pose()
    w = 2 * math.pi / dur
    breath = math.sin(2 * w * t)
    shift = math.sin(w * t)
    p.hips_loc = V(0.007 * shift, 0, -0.01 + 0.002 * breath)
    trunk(p, pitch=1.0, roll=1.6 * shift, chest=(-1.2 * breath, 1.5 * math.sin(w * t + 1), -1.4 * shift),
          neck=(0.5 * breath, 0, 0.6 * shift), head=(2 + math.sin(w * t + 2), 2 * math.sin(w * t + 0.4), 1.8 * math.sin(w * t + 0.7)))
    for s, sfx in SIDES:
        p.local[f"shoulder_{sfx}"] = euler(z=0.8 * breath * s)
        hanging_arm(p, s, sfx, swing=2 + 1.5 * math.sin(w * t + s), bend=8)
        curl(p, sfx, RELAXED)
    standing_legs(p, spread=0.004)
    return p


STANCE = 0.56


def walk_foot(phase: float, s: int, travel: float):
    """Ankle offset from rest and foot pitch; `travel` is the ground covered in stance."""
    g = A.leg(s)
    stance = STANCE
    half = travel / 2
    stride = travel
    if phase < stance:
        u = phase / stance
        y = -half + stride * u  # moves back under the body (+Y is backward)
        heel = max(0.0, (u - 0.72) / 0.28)
        pitch = -14 * max(0.0, 1 - u / 0.14) + 30 * heel ** 1.4  # +pitch = heel up
        z = 0.0
    else:
        u = (phase - stance) / (1 - stance)
        e = 0.5 - 0.5 * math.cos(math.pi * u)
        y = half - stride * e
        z = 0.055 * math.sin(math.pi * min(1.0, u * 1.1))
        pitch = 30 * (1 - u) ** 2 - 14 * u ** 2
    ball = Vector(g["ball"]) - Vector(g["ankle"])
    if pitch > 0:  # heel up: pivot the foot about the ball
        rot = quat((1, 0, 0), pitch)
        z += (ball - rot @ ball).z
    return V(0, y, z), pitch


def walk(t: float, dur: float) -> Pose:
    p = Pose()
    phase = (t / dur) % 1.0
    travel = WALK_SPEED * dur * STANCE
    w = 2 * math.pi * phase
    bob = math.cos(2 * w)
    p.hips_loc = V(0.006 * math.sin(w), 0, -0.04 - 0.01 * bob)
    trunk(p, pitch=5 + 1.2 * bob, yaw=-7 * math.cos(w), roll=2.5 * math.sin(w),
          chest=(1.5, 11 * math.cos(w), -2 * math.sin(w)), neck=(-2, -2 * math.cos(w), 0),
          head=(-2 + 1.5 * bob, -2 * math.cos(w), -1 * math.sin(w)))
    for s, sfx in SIDES:
        ph = (phase + (0.0 if s > 0 else 0.5)) % 1.0
        off, pitch = walk_foot(ph, s, travel)
        g = A.leg(s)
        target = Vector(g["ankle"]) + off + V(0.0, 0.0, 0.0)
        p.limbs[f"leg_{sfx}"] = Limb(target, V(0.1 * s, -1, 0), foot_rot(pitch, s))
        p.local[f"toes_{sfx}"] = euler(x=max(0.0, pitch) * 0.9)
        arm_phase = math.cos(w + (0 if s > 0 else math.pi))  # left arm swings back as the left leg reaches
        hanging_arm(p, s, sfx, swing=-26 * arm_phase + 4, bend=18 + 10 * max(0.0, -arm_phase), out=0.02)
        curl(p, sfx, RELAXED, {k: (6, 8, 6) for k in RELAXED})
    return p


def typing(t: float, dur: float) -> Pose:
    p = Pose()
    seated(p, DESK_SEAT, lean=0.0)
    w = 2 * math.pi / dur
    breath = math.sin(2 * w * t)
    trunk(p, pitch=7, chest=(-2 + 0.8 * breath, 1.5 * math.sin(w * t), 0),
          neck=(-4, 0, 0), head=(-6 + 1.5 * math.sin(3 * w * t), 5 * math.sin(w * t + 0.5), 1.5 * math.sin(w * t)))
    for s, sfx in SIDES:
        wrist = V(0.098 * s, -0.235, DESK_WRIST_Z)
        wrist += V(0.006 * math.sin(3 * w * t + s), 0.004 * math.sin(2 * w * t + s), 0.003 * math.sin(7 * w * t + s))
        p.limbs[f"arm_{sfx}"] = Limb(wrist, V(0.6 * s, 0.4, -1), frame_from(V(-0.06 * s, -1, -0.28), V(-0.22 * s, 0.1, -1)))
        taps = {}
        for i, finger in enumerate(("index", "middle", "ring", "pinky")):
            beat = math.sin(w * t * (7 + i) * 1.0 + i * 1.7 + s * 0.9)
            taps[finger] = (14 * max(0.0, beat) ** 3, 6 * max(0.0, beat) ** 3, 0)
        base = {"thumb": (12, 12, 8), "index": (22, 26, 14), "middle": (24, 27, 15), "ring": (25, 27, 15), "pinky": (27, 28, 16)}
        curl(p, sfx, base, taps)
        p.local[f"shoulder_{sfx}"] = euler(z=-2 * s)
    return p


def wave(t: float, dur: float) -> Pose:
    p = idle(t, 4.0)
    up = _envelope(t, 0.0, 0.35, dur - 0.45, dur)
    osc = math.sin(2 * math.pi * 2.4 * (t - 0.35)) if 0.35 < t < dur - 0.45 else 0.0
    s, sfx = -1, "R"
    rest = p.limbs["arm_R"]
    raised = V(-0.285 - 0.035 * osc, -0.07, 0.93)
    target = rest.target.lerp(raised, up)
    pole = rest.pole.lerp(V(-1, 0.2, -0.35), up)
    wave_rot = quat((0, 1, 0), -22 * osc).to_matrix()
    hand_up = wave_rot @ frame_from(V(-0.15, -0.08, 1), V(0.1, -1, 0.05))
    q_rest = rest.end_rot.to_quaternion()
    q_up = hand_up.to_quaternion()
    if q_rest.dot(q_up) < 0:
        q_up.negate()
    p.limbs["arm_R"] = Limb(target, pole, q_rest.slerp(q_up, up).to_matrix())
    p.local["shoulder_R"] = euler(z=-12 * up)
    curl(p, "R", {k: tuple(a * (1 - 0.8 * up) for a in v) for k, v in RELAXED.items()})
    head = p.local["head"]
    p.local["head"] = head @ euler(z=-6 * up, y=-5 * up)
    p.local["chest"] = p.local["chest"] @ euler(z=3 * up)
    return p


def sit(t: float, dur: float) -> Pose:
    p = Pose()
    w = 2 * math.pi / dur
    breath = math.sin(2 * w * t)
    sw = 9 * math.sin(w * t), 9 * math.sin(w * t + 2.1)
    seated(p, SOFA_SEAT, swing=sw, knee_open=0.03)
    trunk(p, pitch=-9, chest=(3 - 1.2 * breath, 2 * math.sin(w * t), 0), neck=(4, 0, 0),
          head=(3 + 1.2 * math.sin(w * t + 1), 6 * math.sin(w * t * 0.5), 3 * math.sin(w * t + 0.4)))
    for s, sfx in SIDES:
        wrist = V(0.085 * s, -0.14, SOFA_SEAT + 0.066 + 0.075 + 0.002 * breath)
        p.limbs[f"arm_{sfx}"] = Limb(wrist, V(0.5 * s, 1, -0.3), frame_from(V(-0.25 * s, -1, -0.35), V(-0.1 * s, 0, -1)))
        curl(p, sfx, {k: tuple(a * 1.3 for a in v) for k, v in RELAXED.items()})
    return p


def _envelope(t, a0, a1, b0, b1):
    def ss(e0, e1, x):
        k = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
        return k * k * (3 - 2 * k)
    return ss(a0, a1, t) * (1 - ss(b0, b1, t))


CLIPS = {  # name: (pose fn, frames, blink times (s), smile curve)
    "idle": (idle, 120, (1.3,), None),
    "walk": (walk, WALK_FRAMES, (), None),
    "typing": (typing, 120, (0.9, 3.2), None),
    "wave": (wave, 66, (1.6,), lambda t: _envelope(t, 0.1, 0.5, 1.6, 2.1)),
    "sit": (sit, 150, (1.0, 3.6), lambda t: 0.25),
}


def bake_all(rig: bpy.types.Object, face: bpy.types.Object | None) -> dict:
    solver = Solver(rig)
    scene = bpy.context.scene
    scene.render.fps = FPS
    info = {}
    rig.animation_data_create()
    keys = face.data.shape_keys if face else None
    if keys:
        keys.animation_data_create()
    for name, (fn, frames, blinks, smile) in CLIPS.items():
        act = bpy.data.actions.new(name)
        act.use_fake_user = True
        rig.animation_data.action = act
        if keys:
            keys.animation_data.action = act
        prev = {}
        dur = frames / FPS
        for f in range(frames + 1):
            t = f / FPS
            solver.key(fn(t % dur if f < frames else 0.0, dur), f, prev)
            if keys:
                keys.key_blocks["blink"].value = _blink(t, blinks)
                keys.key_blocks["blink"].keyframe_insert("value", frame=f)
                keys.key_blocks["smile"].value = smile(t) if smile else 0.0
                keys.key_blocks["smile"].keyframe_insert("value", frame=f)
        if keys:  # the exporter only finds shape-key actions that sit on NLA tracks
            slot = keys.animation_data.action_slot
            track = keys.animation_data.nla_tracks.new()
            track.name = name
            strip = track.strips.new(name, 0, act)
            if slot is not None and hasattr(strip, "action_slot"):
                strip.action_slot = slot
            track.mute = True
        info[name] = {"frames": frames, "seconds": round(dur, 3), "loop": name != "wave"}
    rig.animation_data.action = bpy.data.actions["idle"]
    if keys:
        keys.animation_data.action = None
    return info


def _blink(t: float, times) -> float:
    for b in times:
        d = t - b
        if 0 <= d <= 0.2:
            return math.sin(math.pi * d / 0.2) ** 0.7
    return 0.0
