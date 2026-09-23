"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Boxes } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";

const pageLines = Array.from({ length: 10 }, (_, i) => ({
  position: [0.408, 0.54, -0.06 + i * 0.011],
  size: [0.006, 1.01, 0.0015],
  radius: 0,
}));
function coverArtwork(book) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 704;
  const c = canvas.getContext("2d");
  const font = getComputedStyle(document.body).fontFamily;
  const ink = "#283b42";
  const text = (words, x, y, size = 24, color = ink, weight = 500) => {
    c.fillStyle = color;
    c.font = `${weight} ${size}px ${font}`;
    c.fillText(words, x, y);
  };
  const box = (x, y, w, h, color, radius = 12) => {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fill();
  };
  const line = (points, color = ink, width = 3) => {
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  c.fillStyle = "#eeeade";
  c.fillRect(0, 0, 512, 704);
  c.fillStyle = book.color;
  c.fillRect(0, 0, 24, 704);
  text("SRI / FIELD NOTES", 52, 62, 18, "#647170", 600);
  text(book.name, 52, 134, 44, ink, 650);
  text(book.line, 52, 177, 19, "#526763");
  if (book.id === "food-thought") {
    box(52, 244, 408, 310, "#faf8f0", 18);
    text("MON   TUE   WED   THU   FRI", 72, 285, 18, "#6d7f78", 600);
    for (let i = 0; i < 5; i++)
      line(
        [
          [77 + i * 77, 303],
          [77 + i * 77, 530],
        ],
        "#d6ded4",
        1,
      );
    [
      [72, 315, 139, "#9cb8ad"],
      [226, 372, 140, "#c2b8cf"],
      [149, 429, 139, "#a7bdca"],
      [303, 486, 134, "#dbc79d"],
    ].forEach(([x, y, w, color], i) => {
      box(x, y, w, 37, color, 7);
      text(["OPEN", "TEAM", "COVER", "CLOSE"][i], x + 12, y + 24, 14, ink, 700);
    });
    text("A day works better", 52, 607, 25);
    text("when everyone is in sync.", 52, 644, 25);
  } else if (book.id === "nous") {
    const nodes = [
      [106, 425, 35],
      [235, 287, 18],
      [372, 358, 46],
      [327, 506, 23],
      [187, 511, 17],
    ];
    line(
      [
        [106, 425],
        [235, 287],
        [372, 358],
        [327, 506],
        [187, 511],
        [106, 425],
      ],
      "#afa3bc",
      3,
    );
    line(
      [
        [106, 425],
        [372, 358],
      ],
      "#c9c1d1",
      2,
    );
    nodes.forEach(([x, y, r], i) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = i === 2 ? "#89739a" : "#c9bfd1";
      c.fill();
      c.beginPath();
      c.arc(x, y, 5, 0, Math.PI * 2);
      c.fillStyle = "#f9f5eb";
      c.fill();
    });
    text("MEMORY", 62, 351, 16, "#69717b", 600);
    text("REASON", 307, 435, 16, "#69717b", 600);
    text("What happens between", 52, 607, 25);
    text("one reply and the next?", 52, 644, 25);
  } else {
    box(133, 242, 246, 59, "#d8d4c6", 8);
    text("words words words", 152, 280, 22);
    line(
      [
        [256, 301],
        [256, 332],
        [109, 332],
        [109, 358],
      ],
      "#9d927d",
    );
    line(
      [
        [256, 332],
        [404, 332],
        [404, 358],
      ],
      "#9d927d",
    );
    line(
      [
        [256, 332],
        [256, 358],
      ],
      "#9d927d",
    );
    [69, 216, 364].forEach((x, i) => {
      box(x, 363, 80, 72, ["#acbebf", "#c2b1ca", "#cbbc9e"][i]);
      text("× " + (i + 2), x + 14, 407, 28);
      line(
        [
          [x + 40, 445],
          [x + 40, 478],
          [256, 478],
        ],
        "#9d927d",
      );
    });
    line(
      [
        [256, 478],
        [256, 500],
      ],
      "#9d927d",
    );
    box(166, 502, 180, 53, "#dfd9c6");
    text("combine", 197, 537, 24);
    text("Split. Count. Combine.", 52, 607, 25);
    text("A first step into parallel work.", 52, 644, 23);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export default function WorkbenchNotebook({ book, onOpen, onHover }) {
  const cover = useMemo(() => coverArtwork(book), [book]);
  const fabric = useRoomTexture("fabric", 3);
  useEffect(() => () => cover.dispose(), [cover]);
  return (
    <group
      position={[book.x, 1.235, 0.08]}
      rotation={[-0.13, book.turn, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 4) onOpen(book.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(`Open ${book.name}`);
      }}
      onPointerOut={() => onHover("")}
    >
      <Box
        position={[0, 0.54, -0.075]}
        size={[0.88, 1.11, 0.035]}
        radius={0.016}
        color={book.color}
        bumpMap={fabric}
        bumpScale={0.003}
      />
      <Box
        position={[0.015, 0.54, 0]}
        size={[0.795, 1.025, 0.125]}
        radius={0.008}
        color="#e8e2d2"
      />
      <Boxes items={pageLines} color="#b6b0a3" />
      <Box
        position={[-0.42, 0.54, 0]}
        size={[0.05, 1.11, 0.19]}
        radius={0.014}
        color={book.color}
        bumpMap={fabric}
        bumpScale={0.004}
      />
      <Box
        position={[0, 0.54, 0.078]}
        size={[0.88, 1.11, 0.03]}
        radius={0.016}
        color={book.color}
      />
      <mesh position={[0.005, 0.54, 0.094]}>
        <planeGeometry args={[0.844, 1.08]} />
        <meshStandardMaterial map={cover} roughness={0.83} />
      </mesh>
      <Box
        position={[0.27, 1.105, 0.007]}
        size={[0.045, 0.09, 0.006]}
        radius={0.002}
        color={book.color}
      />
    </group>
  );
}
