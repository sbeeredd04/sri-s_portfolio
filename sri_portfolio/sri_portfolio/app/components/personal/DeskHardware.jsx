"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { drawContained } from "./ArtworkTexture";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundedRectangle } from "../../lib/model-geometry.mjs";
import {
  studioSurfaces,
  studioMonitors,
  studioKeycaps,
  studioMonitorScale,
  studioKeyboardScale,
} from "../../lib/studio-layout.mjs";
import { Box } from "./ScenePrimitives";

function screenArtwork(index, images = []) {
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 900;
  const ctx = canvas.getContext("2d"),
    font = getComputedStyle(document.body).fontFamily;
  const panel = (x, y, w, h, color, radius = 18) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  };
  ctx.fillStyle = ["#14202d", "#d3ddeb", "#171e2a"][index];
  ctx.fillRect(0, 0, 1440, 900);
  if (index === 0) {
    panel(0, 0, 1440, 62, "#202e3d", 0);
    ctx.font = `500 22px ${font}`;
    ctx.fillStyle = "#b4c4d4";
    if (images[0]) drawContained(ctx, images[0], 26, 13, 36, 36);
    ctx.fillText("THE WORKSHOP", 82, 40);
    ctx.fillStyle = "#92a6b9";
    ctx.fillText("ideas / made / tried", 1080, 40);
    panel(26, 90, 290, 706, "#1c2937");
    ctx.fillStyle = "#778ca3";
    ctx.font = `500 19px ${font}`;
    ctx.fillText("A FEW OPEN TABS", 50, 137);
    ["Aether", "Agentex", "GitCue", "Mesa", "csDNA", "SoDA"].forEach(
      (name, i) => {
        if (i === 0) panel(42, 168, 258, 56, "#314256", 10);
        ctx.fillStyle = i === 0 ? "#e0eaf5" : "#9aafc1";
        ctx.font = `500 26px ${font}`;
        ctx.fillText(name, 66, 205 + i * 66);
      },
    );
    ctx.font = "25px monospace";
    const lines = [
      ["// an idea needs somewhere to go", "#758ca2"],
      ["const projects = [", "#b9b0e0"],
      ['  "aether",', "#a6d5cd"],
      ['  "agentex",', "#a6d5cd"],
      ['  "gitcue",', "#a6d5cd"],
      ["]", "#b9b0e0"],
      ["", "#cad5df"],
      ["// make it. try it. make it better.", "#758ca2"],
    ];
    lines.forEach(([line, color], i) => {
      ctx.fillStyle = "#52677b";
      ctx.fillText(String(i + 1).padStart(2, "0"), 345, 161 + i * 62);
      ctx.fillStyle = color;
      ctx.fillText(line, 415, 161 + i * 62);
    });
    ctx.fillStyle = "#c9d9e9";
    ctx.font = `500 27px ${font}`;
    ctx.fillText("Open the projects  ↗", 54, 853);
  } else if (index === 1) {
    const wash = ctx.createLinearGradient(0, 0, 1440, 900);
    wash.addColorStop(0, "#dae9ed");
    wash.addColorStop(0.55, "#c1d1e7");
    wash.addColorStop(1, "#c9bee0");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 1440, 900);
    // Quiet layered contours, authored for this personal chapter card.
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(720 + i * 45, 900);
      ctx.bezierCurveTo(
        800 - i * 24,
        420,
        1440 - i * 70,
        820,
        1440,
        265 + i * 74,
      );
      ctx.lineTo(1440, 900);
      ctx.closePath();
      ctx.fillStyle = `rgba(89,111,154,${0.04 + i * 0.012})`;
      ctx.fill();
    }
    ctx.fillStyle = "#536584";
    ctx.font = `600 25px ${font}`;
    ctx.fillText("SRI / THE CURRENT CHAPTER", 90, 86);
    ctx.fillStyle = "#273854";
    ctx.font = `500 115px ${font}`;
    ctx.fillText("Building", 85, 318);
    ctx.fillText("offseason.", 85, 449);
    ctx.font = `500 30px ${font}`;
    ctx.fillText("Founding Engineer · San Francisco", 94, 552);
    ctx.font = `400 29px ${font}`;
    ctx.fillStyle = "#4a5e7b";
    ctx.fillText("An AI agent for personal wellness.", 94, 612);
    panel(87, 740, 498, 75, "rgba(249,252,255,.64)", 38);
    ctx.fillStyle = "#344868";
    ctx.font = `500 26px ${font}`;
    ctx.fillText("A little more about the work  ↗", 124, 787);
  } else {
    ctx.fillStyle = "#c0cbd8";
    ctx.font = `500 24px ${font}`;
    ctx.fillText("THE BACKGROUND COMPANY", 66, 59);
    if (images[0]) drawContained(ctx, images[0], 64, 93, 1312, 635);
    else {
      ctx.font = `500 70px ${font}`;
      ctx.fillText("Brooklyn Nine-Nine", 65, 390);
    }
    ctx.fillStyle = "#ffffff22";
    ctx.fillRect(64, 763, 1312, 1);
    if (images[1]) drawContained(ctx, images[1], 64, 800, 200, 55);
    ctx.fillStyle = "#dce5ef";
    ctx.font = `500 29px ${font}`;
    ctx.fillText("Fred again.. · Tollywood · my own v4", 330, 837);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function DeskMonitor({
  position,
  rotation = 0,
  index,
  onClick,
  onHover,
}) {
  const invalidate = useThree((state) => state.invalidate);
  const { casing, bezel, display, artwork } = useMemo(() => {
    const casing = new THREE.ExtrudeGeometry(
      roundedRectangle(1.55, 1.02, 0.055),
      {
        depth: 0.062,
        bevelEnabled: true,
        bevelSize: 0.004,
        bevelThickness: 0.004,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 10,
      },
    );
    casing.translate(0, 0, -0.04);
    const bezel = new THREE.ShapeGeometry(
      roundedRectangle(1.532, 1.002, 0.05),
      10,
    );
    const display = new THREE.ShapeGeometry(
      roundedRectangle(1.457, 0.91, 0.024),
      10,
    );
    const uv = display.attributes.uv,
      p = display.attributes.position;
    for (let i = 0; i < p.count; i++)
      uv.setXY(i, p.getX(i) / 1.457 + 0.5, p.getY(i) / 0.91 + 0.5);
    return { casing, bezel, display, artwork: screenArtwork(index) };
  }, [index]);
  useEffect(
    () => () => {
      casing.dispose();
      bezel.dispose();
      display.dispose();
      artwork.dispose();
    },
    [casing, bezel, display, artwork],
  );
  useEffect(() => {
    let active = true;
    const paths =
      index === 0
        ? ["/official/github-white.svg"]
        : index === 2
          ? ["/official/brooklyn.webp", "/official/spotify-white.webp"]
          : [];
    if (!paths.length) return;
    Promise.all(paths.map((src) => new THREE.ImageLoader().loadAsync(src)))
      .then((images) => {
        if (!active) return;
        const updated = screenArtwork(index, images);
        artwork.dispose();
        artwork.image = updated.image;
        artwork.needsUpdate = true;
        updated.dispose();
        invalidate();
      })
      .catch(() => {
        /* Keep the readable text card if an asset fails. */
      });
    return () => {
      active = false;
    };
  }, [index, artwork, invalidate]);
  const foot =
    (studioSurfaces.desk.position[1] +
      studioSurfaces.desk.size[1] / 2 -
      position[1]) /
    studioMonitorScale;
  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      scale={studioMonitorScale}
    >
      <Box
        position={[0, foot + 0.016, -0.075]}
        size={[0.52, 0.032, 0.41]}
        radius={0.015}
        color="#b6bfcb"
        metalness={0.85}
        roughness={0.27}
      />
      <Box
        position={[0, (foot - 0.36) / 2, -0.107]}
        size={[0.21, -0.36 - foot, 0.047]}
        rotation={[-0.12, 0, 0]}
        radius={0.02}
        color="#a8b3c1"
        metalness={0.8}
        roughness={0.3}
      />
      <mesh position={[0, -0.28, -0.075]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.067, 0.067, 0.245, 24]} />
        <meshStandardMaterial
          color="#9aa6b5"
          metalness={0.85}
          roughness={0.27}
        />
      </mesh>
      <mesh geometry={casing} castShadow receiveShadow>
        <meshStandardMaterial
          color="#b9c2cf"
          metalness={0.78}
          roughness={0.29}
        />
      </mesh>
      <mesh geometry={bezel} position={[0, 0, 0.027]}>
        <meshStandardMaterial
          color="#11171e"
          roughness={0.27}
          metalness={0.3}
        />
      </mesh>
      <mesh
        geometry={display}
        position={[0, 0, 0.028]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(
            [
              "A few things I’ve made. Open the projects.",
              "Building at Offseason. Read the current chapter.",
              "A familiar episode, or something on repeat.",
            ][index],
          );
        }}
        onPointerOut={() => onHover?.("")}
      >
        <meshBasicMaterial map={artwork} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.483, 0.029]}>
        <circleGeometry args={[0.006, 16]} />
        <meshStandardMaterial
          color="#354b60"
          metalness={0.6}
          roughness={0.19}
        />
      </mesh>
      <Box
        position={[0, -0.28, -0.045]}
        size={[0.35, 0.115, 0.012]}
        radius={0.004}
        color="#7e8b9b"
        metalness={0.7}
        roughness={0.4}
      />
      {[-0.075, -0.025, 0.025, 0.075].map((x) => (
        <Box
          key={x}
          position={[x, -0.28, -0.053]}
          size={[0.025, 0.008, 0.003]}
          radius={0.002}
          color="#182432"
        />
      ))}
    </group>
  );
}

const rows = [
  ["esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ["delete", 1.6]],
  [["tab", 1.3], "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", ["\\", 1.3]],
  [
    ["caps", 1.55],
    "A",
    "S",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    ["return", 2.05],
  ],
  [["shift", 1.8], "Z", "X", "C", "V", "B", "N", "M", ",", ".", ["shift", 1.8]],
  [
    "fn",
    "ctrl",
    "opt",
    ["cmd", 1.25],
    ["", 4.1],
    ["cmd", 1.25],
    "opt",
    "←",
    "↑",
    "→",
  ],
];
function keyboardLayout() {
  return rows.flatMap((row, rowIndex) => {
    const items = row.map((k) => (Array.isArray(k) ? k : [k, 1]));
    const unit = 0.997 / items.reduce((sum, k) => sum + k[1], 0);
    let left = -0.4985;
    return items.map(([label, weight]) => {
      const width = weight * unit - 0.007;
      const key = {
        label,
        x: left + (weight * unit) / 2,
        z: -0.133 + rowIndex * 0.065,
        width,
      };
      left += weight * unit;
      return key;
    });
  });
}
export function DeskKeyboard() {
  const keys = useRef();
  const layout = useMemo(keyboardLayout, []);
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        0.06,
        studioKeycaps.height / studioKeyboardScale,
        0.052,
        2,
        0.004,
      ),
    [],
  );
  const legends = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#424c58";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    layout.forEach((k) => {
      ctx.font = `${k.label.length > 1 ? 14 : 21}px sans-serif`;
      ctx.fillText(
        k.label,
        ((k.x + 0.525) / 1.05) * 1536,
        ((k.z + 0.185) / 0.37) * 512,
      );
    });
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [layout]);
  useEffect(
    () => () => {
      geometry.dispose();
      legends.dispose();
    },
    [geometry, legends],
  );
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    layout.forEach((k, i) => {
      o.position.set(k.x, studioKeycaps.centerY / studioKeyboardScale, k.z);
      o.scale.set(k.width / 0.06, 1, 1);
      o.updateMatrix();
      keys.current.setMatrixAt(i, o.matrix);
    });
    keys.current.instanceMatrix.needsUpdate = true;
    keys.current.computeBoundingSphere();
  }, [layout]);
  return (
    <group
      position={studioSurfaces.keyboard.position}
      scale={studioKeyboardScale}
    >
      <Box
        size={studioSurfaces.keyboard.size.map((n) => n / studioKeyboardScale)}
        color="#b7c1cf"
        metalness={0.73}
        roughness={0.31}
        radius={0.024}
      />
      <instancedMesh
        ref={keys}
        args={[geometry, undefined, layout.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e3e6e8" roughness={0.58} />
      </instancedMesh>
      <mesh
        position={[
          0,
          (studioKeycaps.centerY + studioKeycaps.height / 2) /
            studioKeyboardScale +
            0.0007,
          0,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.05, 0.37]} />
        <meshStandardMaterial
          map={legends}
          transparent
          depthWrite={false}
          roughness={0.6}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  );
}

export function DeskCables() {
  const geometry = useMemo(() => {
    const parts = studioMonitors.map(({ position, rotation }, i) => {
      const x = position[0];
      const connector = new THREE.Vector3(0, -0.28, -0.057)
        .multiplyScalar(studioMonitorScale)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)
        .add(new THREE.Vector3(...position));
      const curve = new THREE.CatmullRomCurve3([
        connector,
        new THREE.Vector3(x + 0.03, 0.83, -1.43),
        new THREE.Vector3(x, 0.56, -1.51),
        new THREE.Vector3(-0.4, 0.58, -1.53),
        new THREE.Vector3(0.72 + (i - 1) * 0.025, 0.63, -1.47),
      ]);
      return new THREE.TubeGeometry(curve, 34, 0.004, 6, false);
    });
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#2a303a" roughness={0.85} />
      </mesh>
      <Box
        position={[-0.4, 0.58, -1.46]}
        size={[2.3, 0.05, 0.13]}
        radius={0.018}
        color="#38434f"
        metalness={0.4}
      />
      <Box
        position={[0.72, 0.63, -1.4]}
        size={[0.19, 0.08, 0.19]}
        radius={0.042}
        color="#a8b4c3"
        metalness={0.7}
        roughness={0.33}
      />
      <Box
        position={[0.72, 0.58, -1.4]}
        size={[0.22, 0.017, 0.21]}
        radius={0.01}
        color="#414d5d"
        metalness={0.5}
      />
      <Box
        position={[0.72, 0.63, -1.497]}
        size={[0.13, 0.027, 0.005]}
        radius={0.003}
        color="#1b2634"
      />
    </>
  );
}

export function DeskMouse() {
  return (
    <group position={[-0.06, 0.792, -0.57]} scale={0.6}>
      <mesh scale={[0.089, 1, 0.132]} castShadow>
        <cylinderGeometry args={[1, 1, 0.014, 48]} />
        <meshStandardMaterial
          color="#abb5c0"
          metalness={0.65}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0.005, 0]} scale={[0.088, 0.051, 0.132]} castShadow>
        <sphereGeometry args={[1, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#e7ebf0"
          roughness={0.24}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </group>
  );
}
