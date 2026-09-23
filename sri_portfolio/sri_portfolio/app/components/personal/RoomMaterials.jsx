"use client";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const Materials = createContext(null);
function makeTexture(kind, repeat) {
  const canvas = document.createElement("canvas");
  const size = ["wood", "charred"].includes(kind)
    ? 512
    : kind === "walnut"
      ? 2
      : ["leaf", "iris", "hair"].includes(kind)
        ? 256
        : 128;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const pixels = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (kind === "iris") {
        const u = (x + 0.5 - size / 2) / (size / 2),
          v = (y + 0.5 - size / 2) / (size / 2);
        const r = Math.hypot(u, v),
          angle = Math.atan2(v, u);
        const pupil = THREE.MathUtils.smoothstep(r, 0.44, 0.5),
          rim = 1 - THREE.MathUtils.smoothstep(r, 0.85, 0.99);
        const fibers =
          Math.sin(angle * 89 + r * 7) * 0.12 +
          Math.sin(angle * 137 - r * 12) * 0.055;
        const brown = pupil * rim * (0.78 + fibers + Math.sin(r * 32) * 0.035),
          i = (y * size + x) * 4;
        pixels.data[i] = 23 + brown * 56;
        pixels.data[i + 1] = 18 + brown * 37;
        pixels.data[i + 2] = 15 + brown * 19;
        pixels.data[i + 3] = 255;
        continue;
      }
      let value;
      if (kind === "wood") {
        const plank = Math.floor(x / 128),
          u = x % 128;
        const bend = Math.sin((y / size) * Math.PI * 2 + plank) * 4;
        const grain =
          Math.sin((u + bend) * 1.1) * 2.2 +
          Math.sin((u + bend * 0.4) * 0.31) * 3;
        value =
          u < 1 || (y + plank * 128) % size < 1
            ? 151
            : 220 + Math.sin(plank * 13) * 5 + grain;
      } else if (kind === "charred") {
        // Longitudinal fibers, subtle board variation and fine open grain.
        // No coarse displacement: the facade remains a flat timber surface.
        const u = x + Math.sin((y / size) * Math.PI * 2) * 0.8;
        const fiber = Math.sin(u * 2.5) * 4 + Math.sin(u * 0.71) * 7;
        const board = Math.floor(x / 64);
        const seam = x % 64 < 1 ? -35 : 0;
        const pore = Math.sin(x * 71.3 + y * 37.7) * 2;
        value = 165 + fiber + Math.sin(board * 13) * 6 + seam + pore;
      } else if (kind === "stone") {
        value =
          215 +
          Math.sin(x * 89.7 + y * 73.9) * 12 +
          Math.sin(x * 17.3 - y * 39.2) * 7;
      } else if (kind === "hair") {
        const v = y / size;
        const flow = x + Math.sin(v * 5) * 8 + Math.sin(v * 17) * 2;
        value =
          224 +
          Math.sin(flow * 2.8) * 7 +
          Math.sin(flow * 1.7) * 3 +
          Math.sin(flow * 0.43) * 5;
      } else if (kind === "leaf") {
        const u = (x / (size - 1) - 0.5) * 2,
          v = y / (size - 1);
        const midrib = Math.exp(-((u / 0.022) ** 2));
        const vein = Math.exp(
          -((Math.sin((v - Math.abs(u) * 0.23) * Math.PI * 9) / 0.075) ** 2),
        );
        value = 218 + midrib * 22 + vein * 10 - Math.abs(u) * 14;
      } else {
        value =
          222 +
          Math.sin((x / 4) * Math.PI * 2) * 9 +
          Math.sin((y / 4) * Math.PI * 2) * 9;
      }
      const i = (y * size + x) * 4;
      pixels.data[i] = kind === "walnut" ? 131 : value;
      pixels.data[i + 1] = kind === "walnut" ? 102 : value;
      pixels.data[i + 2] = kind === "walnut" ? 76 : value;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

// A renderer owns its material maps. Furniture shares them instead of creating
// a separate canvas and GPU texture for every chair, book, or plant pot.
export function RoomMaterialProvider({ children }) {
  const invalidate = useThree((s) => s.invalidate);
  const library = useMemo(() => {
    const maps = new Map();
    return {
      maps,
      walnutImage: null,
      get(kind, repeat) {
        const key = `${kind}:${repeat}`;
        if (!maps.has(key)) {
          const texture = makeTexture(kind, repeat);
          if (kind === "walnut" && this.walnutImage) {
            texture.image = this.walnutImage;
            texture.needsUpdate = true;
          }
          maps.set(key, texture);
        }
        return maps.get(key);
      },
    };
  }, []);
  useEffect(() => {
    let disposed = false;
    library.maps.forEach((texture) => {
      texture.needsUpdate = true;
    });
    const pending = new THREE.TextureLoader().load(
      "/materials/walnut-albedo.webp",
      (loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        library.walnutImage = loaded.image;
        library.maps.forEach((texture, key) => {
          if (key.startsWith("walnut:")) {
            // Free the 2px placeholder allocation before uploading a larger image.
            // Keep Source identity stable so Three can release its GPU reference.
            texture.dispose();
            texture.image = loaded.image;
            texture.needsUpdate = true;
          }
        });
        invalidate();
      },
      undefined,
      () => {
        /* The warm local placeholder remains usable offline. */
      },
    );
    return () => {
      disposed = true;
      library.maps.forEach((texture) => texture.dispose());
      pending.dispose();
    };
  }, [library, invalidate]);
  return <Materials.Provider value={library}>{children}</Materials.Provider>;
}

export function useRoomTexture(kind, repeat = 1) {
  const library = useContext(Materials);
  const texture = useMemo(
    () => (library ? library.get(kind, repeat) : makeTexture(kind, repeat)),
    [library, kind, repeat],
  );
  useEffect(
    () => () => {
      if (!library) texture.dispose();
    },
    [library, texture],
  );
  return texture;
}
