"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Model } from "./ModelInstances";
import * as THREE from "three";
import { pavingPlacements, pavingSize } from "../../lib/paving-layout.mjs";

export function Sign({
  title,
  subtitle = "",
  accent = "#adcae8",
  background = "#101b27",
  foreground = "#e7eef6",
  secondary = "#9dafc4",
  position,
  size = [2.4, 0.9],
  rotation = [0, 0, 0],
  ...props
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = Math.round((768 * size[1]) / size[0]);
    const h = c.height;
    const x = c.getContext("2d");
    x.fillStyle = background;
    x.fillRect(0, 0, 768, h);
    x.fillStyle = accent;
    x.fillRect(36, h * 0.14, 32, Math.max(2, h * 0.013));
    const font = getComputedStyle(document.body).fontFamily;
    x.font = `500 ${Math.min(52, h * 0.29)}px ${font}`;
    x.fillStyle = foreground;
    x.fillText(title, 36, h * 0.52, 694);
    x.font = `${Math.min(22, h * 0.13)}px ${font}`;
    x.fillStyle = secondary;
    x.fillText(subtitle, 38, h * 0.81, 690);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [
    title,
    subtitle,
    accent,
    background,
    foreground,
    secondary,
    size[0],
    size[1],
  ]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation} {...props}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
const lampGlow = /bulb|glass/i;
// Scanned CC0 cast-iron street lamp (Poly Haven), 2.7m at this scale. The
// bulb glows at night; the call sites keep their shared layout positions.
export function StreetLamp({ position, night, scale = 1 }) {
  const glow = useMemo(
    () => ({ match: lampGlow, color: "#ffc98f", intensity: night ? 3.2 : 0.05 }),
    [night],
  );
  return (
    <Suspense fallback={null}>
      <Model
        src="/models/street-lamp.glb"
        position={position}
        scale={0.7 * scale}
        glow={glow}
      />
    </Suspense>
  );
}
// Scanned CC0 wooden bench, stretched to the 1.8m seat the layouts reserve.
export function Bench({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={null}>
        <Model src="/models/bench-wooden.glb" scale={[1.5, 1, 1.1]} />
      </Suspense>
    </group>
  );
}
export { BotanicalPlant } from "./BotanicalPlant";
export function PavedWalks({ biome, paths }) {
  const mesh = useRef();
  const stones = useMemo(() => pavingPlacements(biome, paths), [biome, paths]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    stones.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.rotation.set(0, s.a, 0);
      o.scale.set(1, s.height / pavingSize[1], 1);
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
      c.set(i % 5 === 0 ? "#627080" : i % 3 === 0 ? "#737e8b" : "#6b7887");
      mesh.current.setColorAt(i, c);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [stones]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, stones.length]}
      receiveShadow
    >
      <boxGeometry args={pavingSize} />
      <meshStandardMaterial roughness={0.82} />
    </instancedMesh>
  );
}
