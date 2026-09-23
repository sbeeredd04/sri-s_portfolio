import { courts } from "./court-layout.mjs";

// Court-local metres and seconds. The same contacts drive the ball and wrists.
export const GRAVITY = 9.81;
export const PLAYER_SCALE = 1.18;
export const COURT_FLOOR = 0.05;
export const basketballPlayers = [
  { position: [0, COURT_FLOOR, 1.6], rotation: Math.PI },
  { position: [0.9, COURT_FLOOR, -3.08], rotation: 0 },
];
export const volleyballPlayers = [
  { position: [-1.15, COURT_FLOOR, 4.3], rotation: Math.PI },
  { position: [1.15, COURT_FLOOR, -4.3], rotation: 0 },
];
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export function contactWorld(player, local, lift = 0) {
  const [x, y, z] = local.map((v) => v * PLAYER_SCALE);
  const s = Math.sin(player.rotation),
    c = Math.cos(player.rotation);
  return [
    player.position[0] + c * x + s * z,
    player.position[1] + y + lift,
    player.position[2] - s * x + c * z,
  ];
}
export function contactLocal(player, world, lift = 0) {
  const x = world[0] - player.position[0],
    z = world[2] - player.position[2];
  const s = Math.sin(player.rotation),
    c = Math.cos(player.rotation);
  return [
    (c * x - s * z) / PLAYER_SCALE,
    (world[1] - player.position[1] - lift) / PLAYER_SCALE,
    (s * x + c * z) / PLAYER_SCALE,
  ];
}
export function ballistic(from, to, duration, time) {
  const t = Math.max(0, Math.min(duration, time));
  const v = from.map((n, i) => (to[i] - n) / duration);
  v[1] += (GRAVITY * duration) / 2;
  return {
    position: from.map(
      (n, i) => n + v[i] * t - (i === 1 ? (GRAVITY * t * t) / 2 : 0),
    ),
    velocity: [v[0], v[1] - GRAVITY * t, v[2]],
  };
}
const ready = () => ({
  left: [-0.31, 0.72, 0.3],
  right: [0.31, 0.72, 0.3],
  crouch: 0.025,
  hop: 0,
  look: -0.12,
});
function handsAt(player, ball, pose, kind = "hold") {
  const local = contactLocal(
    player,
    ball,
    (pose.hop - pose.crouch) * PLAYER_SCALE,
  );
  if (kind === "dribble") {
    pose.right = [local[0], Math.max(0.55, local[1] + 0.188), local[2]];
  } else if (kind === "bump") {
    pose.left = [local[0] - 0.075, local[1] - 0.16, local[2]];
    pose.right = [local[0] + 0.075, local[1] - 0.16, local[2]];
  } else {
    pose.left = [local[0] - 0.14, local[1] - 0.045, local[2]];
    pose.right = [local[0] + 0.14, local[1] - 0.045, local[2]];
  }
}

const dribble = contactWorld(basketballPlayers[0], [0.37, 0.88, 0.35]);
const release = contactWorld(
  basketballPlayers[0],
  [0.53, 1.39, 0.22],
  PLAYER_SCALE * 0.13,
);
export const basketRim = [
  0,
  courts.basketball.hoop,
  -courts.basketball.depth / 2 + 1.575,
];
const flightDuration = 1.12;
const rimVelocity = ballistic(
  release,
  basketRim,
  flightDuration,
  flightDuration,
).velocity;
const fallDuration =
  (rimVelocity[1] +
    Math.sqrt(rimVelocity[1] ** 2 + 2 * GRAVITY * (basketRim[1] - 0.17))) /
  GRAVITY;
// The net slows horizontal travel. A single floor bounce precedes the rebound.
const landing = [0, 0.17, basketRim[2] + 0.62];
const catchPoint = contactWorld(basketballPlayers[1], [0, 0.83, 0.37]);
const reboundDuration = 0.38;
export const basketTimes = {
  gather: 1.4,
  release: 2.05,
  rim: 2.05 + flightDuration,
  floor: 2.05 + flightDuration + fallDuration,
  catch: 2.05 + flightDuration + fallDuration + reboundDuration,
};
basketTimes.pass = basketTimes.catch + 0.46;
basketTimes.return = basketTimes.pass + 0.66;
basketTimes.duration = basketTimes.return + 0.35;
export const basketEvents = [
  { time: 0.35, kind: "basket-bounce" },
  { time: 1.05, kind: "basket-bounce" },
  { time: basketTimes.rim, kind: "swish" },
  { time: basketTimes.floor, kind: "basket-bounce" },
  { time: basketTimes.catch, kind: "ball-catch" },
];

export function basketballPlay(time) {
  const t =
    ((time % basketTimes.duration) + basketTimes.duration) %
    basketTimes.duration;
  const poses = [ready(), ready()];
  let ball = dribble,
    stage = "dribble";
  if (t < basketTimes.gather) {
    const d = t % 0.7;
    const floor = [dribble[0], 0.17, dribble[2]];
    ball =
      d < 0.35
        ? ballistic(dribble, floor, 0.35, d).position
        : ballistic(floor, dribble, 0.35, d - 0.35).position;
    poses[0].crouch = 0.045 + Math.sin((d / 0.7) * Math.PI) ** 2 * 0.015;
    handsAt(basketballPlayers[0], ball, poses[0], "dribble");
  } else if (t < basketTimes.release) {
    stage = "gather";
    const p =
      (t - basketTimes.gather) / (basketTimes.release - basketTimes.gather);
    poses[0].crouch = (1 - p) * 0.045 + Math.sin(Math.PI * p) * 0.07;
    poses[0].hop = ease((p - 0.65) / 0.35) * 0.13;
    const hand = mix([0.37, 0.925, 0.35], [0.53, 1.39, 0.22], ease(p));
    ball = contactWorld(
      basketballPlayers[0],
      hand,
      (poses[0].hop - poses[0].crouch) * PLAYER_SCALE,
    );
    poses[0].right = [
      hand[0],
      hand[1] + 0.188 - 0.376 * ease(p / 0.35),
      hand[2],
    ];
    poses[0].left = [-0.14 + p * 0.14, 0.85 + p * 0.2, 0.21];
  } else if (t < basketTimes.rim) {
    stage = "shot";
    ball = ballistic(
      release,
      basketRim,
      flightDuration,
      t - basketTimes.release,
    ).position;
  } else if (t < basketTimes.floor) {
    stage = "net";
    ball = ballistic(
      basketRim,
      landing,
      fallDuration,
      t - basketTimes.rim,
    ).position;
  } else if (t < basketTimes.catch) {
    stage = "rebound";
    ball = ballistic(
      landing,
      catchPoint,
      reboundDuration,
      t - basketTimes.floor,
    ).position;
  } else if (t < basketTimes.pass) {
    stage = "catch";
    ball = catchPoint;
  } else if (t < basketTimes.return) {
    stage = "pass";
    ball = ballistic(catchPoint, dribble, 0.66, t - basketTimes.pass).position;
  } else {
    stage = "reset";
    ball = dribble;
    handsAt(basketballPlayers[0], ball, poses[0], "dribble");
  }
  if (t >= basketTimes.release && t < basketTimes.return) {
    const follow = 1 - ease((t - basketTimes.release - 0.55) / 0.45);
    poses[0].right = mix([0.31, 0.72, 0.3], [0.53, 1.202, 0.22], follow);
    poses[0].left = mix([-0.31, 0.72, 0.3], [0, 1.05, 0.21], follow);
    poses[0].hop = Math.max(0, 0.13 - (t - basketTimes.release) ** 2 * 1.6);
    poses[0].crouch = 0;
    poses[0].look = -0.22;
  }
  const receive =
    ease((t - basketTimes.floor) / reboundDuration) *
    (1 - ease((t - basketTimes.pass) / 0.3));
  const catcher = ready();
  handsAt(basketballPlayers[1], catchPoint, catcher);
  poses[1].left = mix(poses[1].left, catcher.left, receive);
  poses[1].right = mix(poses[1].right, catcher.right, receive);
  poses[1].crouch = 0.025 + receive * 0.025;
  return {
    ball,
    poses,
    stage,
    busy: t >= basketTimes.gather,
    time: t,
    net:
      t >= basketTimes.rim && t < basketTimes.rim + 0.65
        ? Math.sin((t - basketTimes.rim) * 21) *
          Math.exp(-(t - basketTimes.rim) * 5)
        : 0,
  };
}

const volleyContacts = volleyballPlayers.map((p) =>
  contactWorld(p, [0, 0.86, 0.36]),
);
export const volleyTimes = { hold: 1.4, flight: 1.55, hits: 4, duration: 7.6 };
export const volleyEvents = Array.from({ length: 5 }, (_, i) => ({
  time: volleyTimes.hold + i * volleyTimes.flight,
  kind: "volley-hit",
}));
export function volleyballPlay(time) {
  const t =
    ((time % volleyTimes.duration) + volleyTimes.duration) %
    volleyTimes.duration;
  const poses = [ready(), ready()];
  let ball = volleyContacts[0];
  if (t < volleyTimes.hold) {
    // A held ball and an underhand preparation make a serve legible.
    poses[0].crouch = Math.sin((t / volleyTimes.hold) * Math.PI) * 0.065;
    handsAt(volleyballPlayers[0], ball, poses[0], "bump");
  } else {
    const rally = t - volleyTimes.hold,
      segment = Math.min(3, Math.floor(rally / volleyTimes.flight));
    const age = rally - segment * volleyTimes.flight,
      from = segment % 2,
      to = 1 - from;
    ball = ballistic(
      volleyContacts[from],
      volleyContacts[to],
      volleyTimes.flight,
      age,
    ).position;
    for (let i = 0; i < 2; i++) {
      const swing =
        i === from
          ? 1 - ease(age / 0.7)
          : ease((age - volleyTimes.flight + 0.42) / 0.42);
      const hit = ready();
      hit.crouch = 0;
      handsAt(volleyballPlayers[i], volleyContacts[i], hit, "bump");
      const follow =
        i === from ? Math.sin(Math.PI * clamp(age / 0.7)) * 0.25 : 0;
      hit.left[1] += follow;
      hit.right[1] += follow;
      // Bring the joined forearms toward the body as they rise.
      hit.left[2] -= follow * 0.25;
      hit.right[2] -= follow * 0.25;
      poses[i].left = mix(poses[i].left, hit.left, swing);
      poses[i].right = mix(poses[i].right, hit.right, swing);
      poses[i].crouch = 0.06 * (1 - swing);
      poses[i].look = -0.2 * Math.sin((age / volleyTimes.flight) * Math.PI);
    }
  }
  return {
    ball,
    poses,
    stage: t < volleyTimes.hold ? "serve" : "rally",
    time: t,
    busy: t >= volleyTimes.hold,
    net: Math.sin(time * 1.8) * 0.012,
  };
}

// Advance only active time. Requests wait for an existing hand contact; no ball
// teleport, impulse stacking or replay jump when a tab resumes after a pause.
export function advanceCourtPlay(clock, delta, variant, requested = false) {
  const basketball = variant === "basketball";
  const duration = basketball ? basketTimes.duration : volleyTimes.duration;
  const start = basketball ? basketTimes.gather : volleyTimes.hold;
  const before = clock.time;
  clock.pending ||= requested;
  clock.time += Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.05)) : 0;
  if (clock.pending && before < start) {
    if (
      !basketball ||
      Math.floor(before / 0.7) !== Math.floor(clock.time / 0.7)
    ) {
      clock.time = start;
      clock.playing = true;
      clock.pending = false;
    }
  }
  if (clock.time >= start && (clock.pending || clock.playing !== false)) {
    clock.playing = true;
    clock.pending = false;
  }
  if (basketball && clock.playing === false && clock.time >= start)
    clock.time %= 0.7;
  if (clock.time >= duration) {
    clock.time %= duration;
    if (basketball) clock.playing = false;
  }
  return clock;
}
