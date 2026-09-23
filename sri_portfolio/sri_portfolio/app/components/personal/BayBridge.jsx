"use client";
import { useMemo, useEffect } from "react";
import { bridgeGeometry } from "../../lib/bay-bridge.mjs";
export default function BayBridge({ daylight }) {
  const { geometries } = useMemo(bridgeGeometry, []);
  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries],
  );
  return (
    <group>
      {Object.entries(geometries).map(([kind, geometry]) => (
        <mesh
          key={kind}
          geometry={geometry}
          castShadow={kind !== "light"}
          receiveShadow
        >
          <meshStandardMaterial
            color={
              kind === "stone"
                ? "#96938a"
                : kind === "light"
                  ? "#ffe3af"
                  : kind === "cable"
                    ? "#8f3c2d"
                    : "#bb4f36"
            }
            roughness={kind === "stone" ? 0.9 : 0.55}
            metalness={kind === "stone" ? 0 : 0.42}
            emissive={kind === "light" ? "#ffd29c" : "#000000"}
            emissiveIntensity={kind === "light" ? 1.6 - daylight * 1.3 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
