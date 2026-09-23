"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Character from "./Character";
import { Rods } from "./ScenePrimitives";
import {
  PLAYER_SCALE,
  basketballPlayers,
  volleyballPlayers,
  basketRim,
  basketballPlay,
  volleyballPlay,
  advanceCourtPlay,
  basketEvents,
  volleyEvents,
} from "../../lib/court-play.mjs";

function GameBall({ variant }) {
  const radius = variant === "basketball" ? 0.12 : 0.105;
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const basket = variant === "basketball";
    ctx.fillStyle = basket ? "#be763d" : "#eee9d8";
    ctx.fillRect(0, 0, 512, 256);
    if (basket) {
      ctx.fillStyle = "#a76132";
      for (let y = 0; y < 256; y += 5)
        for (let x = 0; x < 512; x += 5) {
          ctx.beginPath();
          ctx.arc(x + (y % 2) * 2.5, y, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.strokeStyle = "#392f28";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 128);
      ctx.lineTo(512, 128);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 128, 0);
        ctx.lineTo(i * 128, 256);
        ctx.stroke();
      }
    } else {
      // Curved stitched panels, rather than basketball-like circular bands.
      const colors = ["#e9e7df", "#6891af", "#dfc888"];
      for (let i = -1; i < 7; i++)
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          for (let y = 0; y <= 256; y += 4) {
            const x =
              i * 85.333 + j * 28.444 + Math.sin((y / 256) * Math.PI * 2) * 18;
            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let y = 256; y >= 0; y -= 4)
            ctx.lineTo(
              i * 85.333 +
                (j + 1) * 28.444 +
                Math.sin((y / 256) * Math.PI * 2) * 18,
              y,
            );
          ctx.closePath();
          ctx.fillStyle = colors[((i % 3) + 3) % 3];
          ctx.fill();
          ctx.strokeStyle = "#b7c0bf";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [variant]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh castShadow>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshStandardMaterial map={texture} roughness={0.8} />
    </mesh>
  );
}

function BasketNet({ motion }) {
  const net = useRef();
  const segments = useMemo(() => {
    const parts = [];
    for (let row = 0; row < 4; row++)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + ((row % 2) * Math.PI) / 12;
        const radius = 0.224 - row * 0.019;
        for (const side of [-1, 1]) {
          const next = angle + (side * Math.PI) / 12;
          parts.push({
            from: [
              Math.cos(angle) * radius,
              -row * 0.105,
              Math.sin(angle) * radius,
            ],
            to: [
              Math.cos(next) * (radius - 0.019),
              -(row + 1) * 0.105,
              Math.sin(next) * (radius - 0.019),
            ],
            radius: 0.004,
          });
        }
      }
    return parts;
  }, []);
  useFrame(() => {
    net.current.scale.y = 1 + Math.abs(motion.current.net) * 0.22;
    net.current.rotation.x = motion.current.net * 0.09;
  });
  return (
    <group ref={net} position={basketRim}>
      <Rods segments={segments} color="#e5e7df" />
    </group>
  );
}

export default function CourtPlay({
  variant,
  animate,
  request = 0,
  onActivity,
  onPlay,
  onHover,
  onCue,
  audible,
}) {
  const isBasket = variant === "basketball";
  const sample = isBasket ? basketballPlay : volleyballPlay;
  const players = isBasket ? basketballPlayers : volleyballPlayers;
  const events = isBasket ? basketEvents : volleyEvents;
  const motion = useRef(sample(0));
  const clock = useRef({ time: 0, pending: false });
  const lastRequest = useRef(request),
    lastBusy = useRef(false);
  const ball = useRef(),
    spin = useRef();
  const poses = useMemo(() => players.map(() => ({ current: {} })), [players]);
  const { invalidate } = useThree();
  useEffect(() => {
    if (request !== lastRequest.current) {
      lastRequest.current = request;
      if (!motion.current.busy) clock.current.pending = true;
      invalidate();
    }
  }, [request, invalidate]);
  useEffect(() => {
    if (audible && isBasket && !motion.current.busy)
      clock.current.pending = true;
  }, [audible, isBasket]);
  useEffect(
    () => () => {
      onActivity?.(variant, false);
      onHover?.("");
      document.body.style.cursor = "";
    },
    [variant, onActivity, onHover],
  );
  useFrame((_, delta) => {
    const previous = clock.current.time;
    if (animate) advanceCourtPlay(clock.current, delta, variant);
    const next = sample(clock.current.time);
    motion.current = next;
    ball.current.position.set(...next.ball);
    // Rotation stops with the scene, and the held ball stays still.
    if (animate && (isBasket || next.busy)) {
      spin.current.rotation.x += Math.min(delta, 0.05) * (isBasket ? 3.5 : 1.3);
      spin.current.rotation.z += Math.min(delta, 0.05) * 0.35;
    }
    poses.forEach((pose, i) => {
      pose.current = next.poses[i];
    });
    if (next.busy !== lastBusy.current) {
      lastBusy.current = next.busy;
      onActivity?.(variant, next.busy);
    }
    if (animate && audible)
      for (const event of events) {
        const crossed =
          clock.current.time >= previous
            ? event.time > previous && event.time <= clock.current.time
            : event.time > previous || event.time <= clock.current.time;
        if (crossed) onCue?.(event.kind);
      }
  }, -3);
  function play(e) {
    if (!animate || motion.current.busy || e.delta > 4) return;
    e.stopPropagation();
    onHover?.("");
    onPlay?.(variant);
  }
  function hover(e) {
    if (!animate) return;
    e.stopPropagation();
    document.body.style.cursor = motion.current.busy ? "" : "pointer";
    onHover?.(
      motion.current.busy
        ? isBasket
          ? "Watch the rebound and return pass."
          : "Keep it off the ground."
        : isBasket
          ? "Tap a player to take a shot."
          : "Tap a player to serve.",
    );
  }
  return (
    <group>
      {players.map((player, i) => (
        <group
          key={i}
          position={player.position}
          scale={PLAYER_SCALE}
          onClick={play}
          onPointerOver={hover}
          onPointerOut={() => {
            onHover?.("");
            document.body.style.cursor = "";
          }}
        >
          <Character
            rotation={player.rotation}
            sport
            animate={animate}
            pose={poses[i]}
            color={i ? "#b08991" : "#7398b7"}
            phase={i * 1.7}
          />
        </group>
      ))}
      <group
        ref={ball}
        onClick={play}
        onPointerOver={hover}
        onPointerOut={() => {
          onHover?.("");
          document.body.style.cursor = "";
        }}
      >
        <group ref={spin}>
          <GameBall variant={variant} />
        </group>
        <mesh>
          <sphereGeometry args={[0.25, 12, 8]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      </group>
      {isBasket && <BasketNet motion={motion} />}
    </group>
  );
}
