"use client";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Rods } from "./ScenePrimitives";
import { useRoomTexture } from "./RoomMaterials";
import ExhibitBook from "./ExhibitBook";
import { drawExhibit } from "../../lib/exhibit-art.mjs";
import {
  exhibitActionAt,
  exhibitCanvas,
  projectExhibits,
} from "../../lib/project-exhibits.mjs";

function useExhibitDisplay(id, value) {
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = exhibitCanvas.width;
    canvas.height = exhibitCanvas.height;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, []);
  useLayoutEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive) return;
      drawExhibit(
        texture.image.getContext("2d"),
        id,
        value,
        getComputedStyle(document.body).fontFamily,
      );
      texture.needsUpdate = true;
      invalidate();
    };
    paint();
    document.fonts.ready.then(paint);
    return () => {
      alive = false;
    };
  }, [texture, id, value, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const consoleLegs = [-1.12, 1.12].flatMap((x) =>
  [-0.46, 0.38].map((z) => ({
    from: [x, 0.16, z],
    to: [x, 0.94, z],
    radius: 0.028,
  })),
);
const vents = Array.from({ length: 12 }, (_, i) => ({
  from: [-0.55 + i * 0.1, -0.62, -0.045],
  to: [-0.55 + i * 0.1, -0.46, -0.045],
  radius: 0.008,
}));

export default function InteractiveProjectExhibit({
  id,
  value,
  onChange,
  onHover,
}) {
  const screen = useExhibitDisplay(id, value),
    wood = useRoomTexture("walnut", 2);
  if (id === "mesa")
    return <ExhibitBook {...{ id, screen, onChange, onHover, wood }} />;
  return (
    <group>
      <Box
        position={[0, 0.94, -0.05]}
        size={[2.63, 0.105, 1.15]}
        color="#b3a291"
        radius={0.035}
        map={wood}
      />
      <Rods segments={consoleLegs} color="#6c7a87" />
      <Box
        position={[0, 1.015, -0.22]}
        size={[0.77, 0.045, 0.46]}
        color="#92a2b1"
        radius={0.025}
        metalness={0.85}
        roughness={0.33}
      />
      <Box
        position={[0, 1.28, -0.38]}
        size={[0.16, 0.53, 0.1]}
        color="#93a4b5"
        radius={0.018}
        metalness={0.8}
        roughness={0.3}
      />
      <group position={[0, 1.99, -0.28]}>
        <Box
          size={[2.68, 1.8, 0.09]}
          color="#879aaf"
          radius={0.06}
          metalness={0.85}
          roughness={0.31}
        />
        <Box
          position={[0, 0, 0.049]}
          size={[2.62, 1.74, 0.018]}
          color="#131d2b"
          radius={0.042}
          roughness={0.35}
        />
        <mesh
          position={[0, 0, 0.061]}
          onPointerMove={(e) => {
            e.stopPropagation();
            const action = exhibitActionAt(id, e.uv),
              item = projectExhibits[id].steps.find((s) => s.id === action);
            onHover(
              item ? item.label : "Try the three choices on the display.",
            );
          }}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={() => onHover("")}
          onClick={(e) => {
            e.stopPropagation();
            const action = exhibitActionAt(id, e.uv);
            if (e.delta <= 4 && action) onChange(id, action);
          }}
        >
          <planeGeometry args={[2.56, 1.68]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <Rods segments={vents} color="#293847" />
        <mesh position={[0, 0.867, 0.06]}>
          <circleGeometry args={[0.005, 12]} />
          <meshStandardMaterial color="#40556b" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
