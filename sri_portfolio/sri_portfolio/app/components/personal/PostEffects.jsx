"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  EffectComposer,
  N8AO,
  Bloom,
  ToneMapping,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  SMAA,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useQuality } from "./Quality";

// Film-like finishing for the whole world: contact occlusion grounds every
// object, bloom lets practical lights and windows glow, AgX keeps highlights
// from clipping to flat white, and a restrained grade separates the moods.
export default function PostEffects({ world, daylight }) {
  const quality = useQuality();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // The composer tone-maps its final pass; the renderer must stay linear.
    const previous = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    invalidate();
    return () => {
      gl.toneMapping = previous;
    };
  }, [gl, invalidate]);
  const close = world !== "planet";
  const night = daylight < 0.15;
  return (
    <EffectComposer
      multisampling={quality.multisampling}
      enableNormalPass={false}
    >
      {quality.ao && (
        <N8AO
          halfRes
          quality="medium"
          aoRadius={close ? 1.4 : 6}
          distanceFalloff={close ? 0.6 : 2}
          intensity={close ? 2.6 : 1.4}
          color="#0b0d14"
        />
      )}
      {quality.bloom && (
      <Bloom
        mipmapBlur
        luminanceThreshold={night ? 0.62 : 0.9}
        luminanceSmoothing={0.2}
        intensity={night ? 0.85 : 0.35}
        radius={0.72}
      />
      )}
      <HueSaturation saturation={night ? -0.04 : 0.14} />
      <BrightnessContrast brightness={night ? 0.02 : 0} contrast={night ? 0.06 : 0.1} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.32} darkness={0.46} eskil={false} />
      {quality.smaa && <SMAA />}
    </EffectComposer>
  );
}
