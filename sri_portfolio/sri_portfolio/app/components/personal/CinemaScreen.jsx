"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shows } from "../../json/personal";
import { showArtwork } from "../../json/official-artwork.mjs";
import { drawContained } from "./ArtworkTexture";

export default function CinemaScreen({ channel, position, onNext, onHover }) {
  const invalidate = useThree((state) => state.invalidate);
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 768;
    const c = canvas.getContext("2d"),
      font = getComputedStyle(document.body).fontFamily;
    c.fillStyle = "#0c111b";
    c.fillRect(0, 0, 1536, 768);
    if (channel === 0) {
      c.fillStyle = "#edf2fa";
      c.font = `500 48px ${font}`;
      c.fillText(shows[channel], 80, 705);
      c.fillStyle = "#becadc";
      c.font = `500 23px ${font}`;
      c.textAlign = "right";
      c.fillText("01 / 05    ·    NEXT SHOW →", 1456, 702);
      c.textAlign = "left";
    } else {
      c.fillStyle = "#c2cad8";
      c.font = `500 24px ${font}`;
      c.fillText("SRI’S COMFORT CINEMA", 690, 120);
      c.fillStyle = "#f0f3fa";
      c.font = `500 69px ${font}`;
      let line = "",
        y = 286;
      for (const word of shows[channel].split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (c.measureText(next).width > 740 && line) {
          c.fillText(line, 685, y);
          y += 82;
          line = word;
        } else line = next;
      }
      c.fillText(line, 685, y);
      c.fillStyle = "#a4aebe";
      c.font = `400 25px ${font}`;
      c.fillText("A familiar episode. A little company.", 690, y + 65);
      c.fillStyle = "#ffffff25";
      c.fillRect(690, 605, 755, 1);
      c.fillStyle = "#ccd5e4";
      c.font = `500 22px ${font}`;
      c.fillText(`0${channel + 1} / 05    ·    NEXT SHOW  →`, 690, 669);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [channel]);
  useEffect(() => {
    let active = true;
    new THREE.ImageLoader().load(showArtwork[channel].src, (image) => {
      if (!active) return;
      const c = map.image.getContext("2d");
      if (channel === 0) drawContained(c, image, 56, 30, 1424, 596);
      else drawContained(c, image, 56, 56, 564, 656);
      map.needsUpdate = true;
      invalidate();
    });
    return () => {
      active = false;
      map.dispose();
    };
  }, [channel, map, invalidate]);
  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.("Tap the screen to change the show.");
      }}
      onPointerOut={() => onHover?.("")}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 4) onNext();
      }}
    >
      <planeGeometry args={[4.6, 2.3]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}
