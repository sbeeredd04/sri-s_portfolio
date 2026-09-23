"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// Local artwork loads independently: a missing image never suspends the world.
// Keep one texture identity and release its GPU allocation with the object.
export function useArtworkTexture(src) {
  const invalidate = useThree((state) => state.invalidate);
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const c = canvas.getContext("2d");
    c.fillStyle = "#dedbd4";
    c.fillRect(0, 0, 1, 1);
    const texture = new THREE.Texture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [src]);
  useEffect(() => {
    let active = true;
    new THREE.ImageLoader().load(src, (image) => {
      if (!active) return;
      // WebGL texture storage cannot change size after its first upload.
      map.dispose();
      map.image = image;
      map.needsUpdate = true;
      invalidate();
    });
    return () => {
      active = false;
      map.dispose();
    };
  }, [src, map, invalidate]);
  return map;
}

export function drawContained(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale,
    h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
