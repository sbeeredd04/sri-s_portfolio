"use client";
import { APARTMENT_LEVEL } from "../../lib/studio-layout.mjs";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { streetRoutes, streetIndex } from "../../lib/street-view.mjs";
import { worldPoint, surfaceHeight } from "../../lib/world-layout.mjs";
export default function StreetViewMarkers({ world, stop, onSelect, onHover }) {
  const markers = useRef(new Map());
  useFrame(() => {
    if (!markers.current.size) return;
    const hud = Array.from(
      document.querySelectorAll(
        ".place-exploration, .experience-header, .journey-footer, .world-caption, .world-clock",
      ),
      (element) => element.getBoundingClientRect(),
    );
    for (const node of markers.current.values()) {
      const box = node.getBoundingClientRect();
      const covered = hud.some(
        (r) =>
          r.width > 0 &&
          box.left < r.right + 8 &&
          box.right > r.left - 8 &&
          box.top < r.bottom + 8 &&
          box.bottom > r.top - 8,
      );
      node.style.visibility = covered ? "hidden" : "visible";
    }
  });
  const current = streetIndex(stop),
    route = streetRoutes[world];
  if (current === null || !route) return null;
  return (
    <group>
      {route.map(
        (node, i) =>
          Math.abs(i - current) === 1 &&
          node.group === route[current]?.group && (
            <Html
              key={`${world}-${i}`}
              position={
                node.worldPosition
                  ? node.worldPosition.map((v, j) => v + node.up[j] * 0.18)
                  : worldPoint(world, [
                      node.point[0],
                      (world === "studio"
                        ? APARTMENT_LEVEL + 0.15
                        : surfaceHeight(world, ...node.point)) + 0.18,
                      node.point[1],
                    ])
              }
              center
              zIndexRange={[3, 2]}
            >
              <button
                ref={(node) => {
                  if (node) markers.current.set(i, node);
                  else markers.current.delete(i);
                }}
                className="street-marker"
                aria-label={`Walk to ${node.label}`}
                onClick={() => onSelect(`street:${i}`)}
                onPointerEnter={() => onHover?.(`Walk to ${node.label}`)}
                onPointerLeave={() => onHover?.("")}
              >
                <span aria-hidden="true">{i > current ? "↑" : "↓"}</span>
                <small>{node.label}</small>
              </button>
            </Html>
          ),
      )}
    </group>
  );
}
