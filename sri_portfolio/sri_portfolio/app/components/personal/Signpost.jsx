"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  boardYaw,
  districtSigns,
  signType,
} from "../../lib/district-signs.mjs";

const W = 512,
  H = 104,
  BOARD = [1.5, 0.3];

// A pointed board with its label, drawn once the biome's face has loaded.
// The back face is drawn with its tip on the left: seen from behind, the
// tip still points at the place and the words still read left to right.
function drawBoard(canvas, label, type, family, back) {
  const x = canvas.getContext("2d");
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, W, H);
  if (back) x.setTransform(-1, 0, 0, 1, W, 0);
  x.fillStyle = type.board;
  x.beginPath();
  x.moveTo(0, 8);
  x.lineTo(W - 64, 8);
  x.lineTo(W - 6, H / 2);
  x.lineTo(W - 64, H - 8);
  x.lineTo(0, H - 8);
  x.closePath();
  x.fill();
  x.fillStyle = type.accent;
  x.fillRect(18, H / 2 - 3, 14, 6);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = type.ink;
  x.font = `${type.style} ${type.weight} 52px ${family}`;
  x.textBaseline = "middle";
  x.fillText(label, back ? 110 : 46, H / 2 + 2, W - 150);
}

function Board({ label, type, y, yaw }) {
  const invalidate = useThree((s) => s.invalidate);
  const textures = useMemo(
    () =>
      [false, true].map(() => {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      }),
    [],
  );
  useEffect(() => {
    let live = true;
    const family =
      getComputedStyle(document.body).getPropertyValue(type.font).trim() ||
      "serif";
    const paint = () => {
      if (!live) return;
      textures.forEach((t, i) => {
        drawBoard(t.image, label, type, family, i === 1);
        t.needsUpdate = true;
      });
      invalidate();
    };
    paint();
    document.fonts
      ?.load(`${type.style} ${type.weight} 52px ${family}`)
      .then(paint, () => {});
    return () => {
      live = false;
    };
  }, [label, type, textures, invalidate]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  // Local +x is the pointing end.
  return (
    <group position={[0, y, 0]} rotation={[0, -yaw, 0]}>
      {[1, -1].map((side, i) => (
        <mesh
          key={side}
          position={[BOARD[0] / 2 + 0.04, 0, side * 0.028]}
          rotation={[0, side > 0 ? 0 : Math.PI, 0]}
          castShadow={side > 0}
        >
          <planeGeometry args={BOARD} />
          <meshStandardMaterial
            map={textures[i]}
            transparent
            alphaTest={0.5}
            roughness={0.75}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Signpost({ biome, ground }) {
  const sign = districtSigns[biome],
    type = signType[biome];
  if (!sign || !type) return null;
  const base = ground ? ground(sign.x, sign.z) : 0;
  return (
    <group position={[sign.x, base, sign.z]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.09, 2.6, 0.09]} />
        <meshStandardMaterial color={type.board} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.66, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.14]} />
        <meshStandardMaterial color={type.accent} roughness={0.6} />
      </mesh>
      {sign.boards.map((b, i) => (
        <Board
          key={b.label}
          label={b.label}
          type={type}
          y={2.3 - i * 0.38}
          yaw={boardYaw(sign, b.to)}
        />
      ))}
    </group>
  );
}
