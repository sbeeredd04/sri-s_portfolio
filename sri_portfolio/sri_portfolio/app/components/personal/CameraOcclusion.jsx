"use client";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils } from "three";
import { worldPoint } from "../../lib/world-layout.mjs";
import { homeSite } from "../../lib/home-site.mjs";
import { cameraCutaway, cameraCutawayMaterial, isHomeOccluder } from "../../lib/camera-occlusion.mjs";

// Home's opaque shell merges ceilings and walls with all floor plates. A local
// corridor is safer than hiding the whole mesh. Each canvas gets its own state.
export function useHomeCameraOcclusion(enabled) {
  const { camera, controls, invalidate } = useThree();
  const state = useMemo(() => {
    const centre = worldPoint("studio", homeSite.anchors.Summit_HeroTarget);
    const uniforms = {
      uCutEye: { value: new Vector3() },
      uCutFocus: { value: new Vector3() },
      uCutStrength: { value: 0 },
    };
    return {
      centre, uniforms,
      configure(mesh) {
        if (!isHomeOccluder(mesh.name)) return;
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(m => cameraCutawayMaterial(m, uniforms))
          : cameraCutawayMaterial(mesh.material, uniforms);
      },
    };
  }, []);
  useFrame((_, delta) => {
    const { uniforms, centre } = state;
    uniforms.uCutEye.value.copy(camera.position);
    controls?.getTarget?.(uniforms.uCutFocus.value);
    const focus = uniforms.uCutFocus.value;
    const inside = Math.abs(focus.x-centre.x)<17 && Math.abs(focus.z-centre.z)<14 &&
      focus.y>centre.y-5 && focus.y<centre.y+12;
    const distance = camera.position.distanceTo(focus);
    const target = enabled && controls?.getTarget && inside && distance<cameraCutaway.maximumDistance ? 1 : 0;
    const previous = uniforms.uCutStrength.value;
    const next = MathUtils.damp(previous, target, 12, Math.min(delta,.05));
    uniforms.uCutStrength.value = Math.abs(next-target)<.002 ? target : next;
    // Finish a cutaway/reveal when motion is paused; do not start an idle loop.
    if (Math.abs(uniforms.uCutStrength.value-target)>.001) invalidate();
  });
  return state.configure;
}
