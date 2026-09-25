"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Boxes } from "./ScenePrimitives";
import ModelInstances from "./ModelInstances";
import { useQuality } from "./Quality";
import { roundedBox } from "../../lib/model-geometry.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";
import {
  LANTERN_HEIGHT,
  hedges,
  lanternPosts,
  lanterns,
  lookout,
  newsstand,
  paperPlanes,
  planePose,
  trees,
} from "../../lib/fieldnotes-quarter.mjs";
import {
  fieldnoteShelves,
  publishedFieldnotes,
} from "../../lib/fieldnotes.mjs";
import { discover } from "../../lib/discoveries.mjs";
import Signpost from "./Signpost";

const ground = (x, z) => renderedSurfaceHeight("future", x, z);

function canvasTexture(width, height, draw) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const font = getComputedStyle(document.body).fontFamily;
  draw(c.getContext("2d"), width, height, font);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const serif = () =>
  getComputedStyle(document.body).getPropertyValue("--font-newsreader") ||
  "serif";

// A magazine cover per shelf. Until a note is published the cover says so.
function drawCover(x, w, h, shelf, latest) {
  const display = serif();
  x.fillStyle = "#f3eee3";
  x.fillRect(0, 0, w, h);
  x.fillStyle = shelf.accent;
  x.fillRect(0, 0, w, h * 0.38);
  x.fillStyle = "#f3eee3";
  x.font = `600 22px ${display}`;
  x.fillText("FIELDNOTES", 28, 48);
  x.font = `400 18px ${display}`;
  x.fillText(shelf.eyebrow, 28, h * 0.38 - 24);
  x.fillStyle = "#1f1d1a";
  x.font = `500 44px ${display}`;
  const words = shelf.title.split(" ");
  let line = "",
    y = h * 0.38 + 70;
  for (const word of words) {
    if (x.measureText(line + word).width > w - 56 && line) {
      x.fillText(line.trim(), 28, y);
      line = "";
      y += 50;
    }
    line += word + " ";
  }
  x.fillText(line.trim(), 28, y);
  x.font = `italic 400 22px ${display}`;
  x.fillStyle = "#5c574f";
  x.fillText(
    latest ? latest.title : "Issue 01, in the works",
    28,
    h - 40,
    w - 56,
  );
}

function Newsstand({ onOpen }) {
  const { x, z, yaw, size, height } = newsstand;
  const [W, D] = size;
  const parts = useMemo(() => {
    const green = [],
      cream = [],
      dark = [],
      wood = [];
    dark.push({ position: [0, 0.075, 0], size: [W + 0.1, 0.15, D + 0.1] });
    green.push({ position: [0, 1.25, -D / 2 + 0.05], size: [W, 2.2, 0.1] });
    for (const s of [-1, 1])
      green.push({
        position: [s * (W / 2 - 0.05), 1.25, 0],
        size: [0.1, 2.2, D],
      });
    green.push({ position: [0, 0.6, D / 2 - 0.18], size: [W, 0.9, 0.35] });
    wood.push({
      position: [0, 1.07, D / 2 - 0.16],
      size: [W + 0.1, 0.05, 0.46],
    });
    dark.push({
      position: [0, height - 0.18, 0],
      size: [W + 0.3, 0.14, D + 0.4],
    });
    for (let i = 0; i < 7; i++)
      (i % 2 ? green : cream).push({
        position: [-W / 2 + 0.2 + i * 0.4, height - 0.38, D / 2 + 0.42],
        size: [0.4, 0.03, 0.9],
        rotation: [0.38, 0, 0],
        radius: 0.01,
      });
    for (const rx of [-0.92, 0, 0.92])
      dark.push({
        position: [rx, 1.62, -D / 2 + 0.16],
        size: [0.82, 1.18, 0.04],
        rotation: [-0.1, 0, 0],
        radius: 0.01,
      });
    return { green, cream, dark, wood };
  }, [W, D, height]);
  const covers = useMemo(
    () =>
      fieldnoteShelves.map((shelf) =>
        canvasTexture(360, 480, (c, w, h) =>
          drawCover(
            c,
            w,
            h,
            shelf,
            publishedFieldnotes.find((note) => note.shelf === shelf.id),
          ),
        ),
      ),
    [],
  );
  const sign = useMemo(
    () =>
      canvasTexture(1024, 150, (c, w, h) => {
        c.fillStyle = "#23392f";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#efe6d2";
        c.font = `600 76px ${serif()}`;
        c.textAlign = "center";
        c.fillText("Fieldnotes", w / 2, 94);
        c.font = `400 24px ${serif()}`;
        c.fillText("NEWS · NOTES · THINGS I MAKE", w / 2, 132);
      }),
    [],
  );
  useEffect(
    () => () => [...covers, sign].forEach((t) => t.dispose()),
    [covers, sign],
  );
  return (
    <group
      position={[x, ground(x, z), z]}
      rotation={[0, yaw, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
    >
      <Boxes items={parts.green} color="#2f5443" roughness={0.55} />
      <Boxes items={parts.cream} color="#efe6d2" roughness={0.7} />
      <Boxes items={parts.dark} color="#1d2a24" roughness={0.5} />
      <Boxes items={parts.wood} color="#8a5a34" roughness={0.6} />
      <mesh position={[0, height + 0.06, D / 2 + 0.21]}>
        <planeGeometry args={[W, W * (150 / 1024)]} />
        <meshStandardMaterial map={sign} roughness={0.6} />
      </mesh>
      {covers.map((map, i) => (
        <mesh
          key={i}
          position={[(i - 1) * 0.92, 1.62, -D / 2 + 0.19]}
          rotation={[-0.1, 0, 0]}
        >
          <planeGeometry args={[0.7, 0.93]} />
          <meshStandardMaterial map={map} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Lanterns({ night }) {
  const posts = useMemo(lanternPosts, []);
  const bulbs = useMemo(() => lanterns(), []);
  const wire = useMemo(() => {
    const points = [];
    const all = bulbs.map((b) => new THREE.Vector3(b.x, b.y + 0.08, b.z));
    for (let i = 0; i < all.length; i++)
      points.push(all[i], all[(i + 1) % all.length]);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [bulbs]);
  const bulbRef = useRef(),
    postRef = useRef();
  useEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    bulbs.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.updateMatrix();
      bulbRef.current.setMatrixAt(i, o.matrix);
      bulbRef.current.setColorAt(
        i,
        c.set(["#ffd9a0", "#ffe7c2", "#ffc98a"][b.warm]),
      );
    });
    posts.forEach(([x, z], i) => {
      o.position.set(x, ground(x, z) + LANTERN_HEIGHT / 2, z);
      o.updateMatrix();
      postRef.current.setMatrixAt(i, o.matrix);
    });
    for (const r of [bulbRef, postRef]) {
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
    bulbRef.current.instanceColor.needsUpdate = true;
  }, [bulbs, posts]);
  useEffect(() => () => wire.dispose(), [wire]);
  return (
    <group>
      <instancedMesh
        ref={postRef}
        args={[undefined, undefined, posts.length]}
        castShadow
      >
        <cylinderGeometry args={[0.045, 0.06, LANTERN_HEIGHT, 8]} />
        <meshStandardMaterial color="#2b2a27" roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <lineSegments geometry={wire}>
        <lineBasicMaterial color="#2b2a27" />
      </lineSegments>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, bulbs.length]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial
          color="#fff3dc"
          emissive="#ffc98a"
          emissiveIntensity={night ? 2.6 : 0.15}
          toneMapped={!night}
        />
      </instancedMesh>
    </group>
  );
}

function Hedges() {
  const pieces = useMemo(hedges, []);
  const geometry = useMemo(() => roundedBox([2.1, 0.9, 0.8], 0.16), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const ref = useRef();
  useEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    pieces.forEach((p, i) => {
      o.position.set(p.x, ground(p.x, p.z) + 0.42, p.z);
      o.rotation.set(0, p.yaw, 0);
      o.scale.set(1, 0.9 + (i % 4) * 0.06, 1);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(i % 3 ? "#3f5a33" : "#476438"));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [pieces]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, pieces.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial roughness={0.95} />
    </instancedMesh>
  );
}

function Lookout({ night }) {
  const wall = useMemo(
    () => [
      { position: [0, 0.4, 0], size: [lookout.width, 0.8, 0.45], radius: 0.04 },
      {
        position: [0, 0.84, 0],
        size: [lookout.width + 0.2, 0.08, 0.55],
        radius: 0.02,
      },
    ],
    [],
  );
  const bench = useMemo(
    () => [
      {
        position: [0, ground(0, lookout.bench), lookout.bench],
        rotation: 0,
        scale: 1,
      },
    ],
    [],
  );
  const lamp = useMemo(
    () => [
      {
        position: [-2.4, ground(-2.4, lookout.bench), lookout.bench],
        rotation: 0,
        scale: 0.85,
      },
    ],
    [],
  );
  const glow = useMemo(
    () => ({
      match: /bulb|glass/i,
      color: "#ffc98f",
      intensity: night ? 3 : 0.05,
    }),
    [night],
  );
  return (
    <group>
      <group position={[lookout.x, ground(lookout.x, lookout.z), lookout.z]}>
        <Boxes items={wall} color="#b9aa91" roughness={0.92} />
      </group>
      <Suspense fallback={null}>
        <ModelInstances src="/models/bench-wooden.glb" items={bench} lod={0} />
        <ModelInstances
          src="/models/street-lamp.glb"
          items={lamp}
          lod={0}
          glow={glow}
          castShadow={false}
        />
      </Suspense>
    </group>
  );
}

// A paper dart, nose along +z: two folded wings and a keel.
function planeGeometry() {
  const g = new THREE.BufferGeometry();
  const v = [
    0, 0, 0.32, -0.2, 0.03, -0.18, 0, 0, -0.14, 0, 0, 0.32, 0, 0, -0.14, 0.2,
    0.03, -0.18, 0, 0, 0.32, 0, 0, -0.14, 0, -0.07, -0.16,
  ];
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

function PaperPlanes({ animate }) {
  const { tier } = useQuality();
  const planes = useMemo(() => paperPlanes(tier), [tier]);
  const geometry = useMemo(planeGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const ref = useRef();
  const clock = useRef(0);
  const o = useMemo(() => new THREE.Object3D(), []);
  const place = () => {
    planes.forEach((p, i) => {
      const pose = planePose(p, clock.current);
      o.position.set(pose.x, pose.y, pose.z);
      o.rotation.set(0, pose.yaw, pose.bank, "YXZ");
      o.scale.setScalar(1.6);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  };
  useEffect(() => {
    if (!ref.current) return;
    place();
    ref.current.computeBoundingSphere();
  });
  useFrame((_, dt) => {
    if (!animate || !ref.current) return;
    clock.current += Math.min(dt, 0.05);
    place();
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, planes.length]}
      castShadow
      onClick={(event) => {
        event.stopPropagation();
        discover("paper-plane");
      }}
    >
      <meshStandardMaterial
        color="#f6f2e8"
        roughness={0.85}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// The garden around the studio: the showcase stand, lights, framing and life.
export default function FieldnotesQuarter({
  detailed,
  night,
  animate,
  onOpenWriting,
}) {
  const treeItems = useMemo(
    () =>
      trees.map((t) => ({
        position: [t.x, ground(t.x, t.z) - 0.1, t.z],
        rotation: t.turn,
        scale: 0.21 * t.s,
      })),
    [],
  );
  return (
    <group>
      <Newsstand onOpen={onOpenWriting} />
      <Signpost biome="future" ground={ground} />
      <Lanterns night={night} />
      <Hedges />
      <Lookout night={night} />
      <Suspense fallback={null}>
        <ModelInstances src="/models/tree-broadleaf.glb" items={treeItems} />
      </Suspense>
      {detailed && <PaperPlanes animate={animate} />}
    </group>
  );
}
