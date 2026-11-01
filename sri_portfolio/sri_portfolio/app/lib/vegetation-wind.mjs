import * as THREE from 'three';
import { windGLSL } from './wind-field.mjs';

// Displace before projection so color, depth and point-light distance passes
// agree. Roots stay fixed. Instance rotation and scale cannot rotate the wind.
export function applyVegetationWind(material, field, frame, bounds, amplitude) {
  const uniforms = {
    ...field,
    uWindFrame: { value: frame },
    uWindBase: { value: bounds.min.y },
    uWindHeight: { value: Math.max(.001, bounds.max.y - bounds.min.y) },
    uWindAmplitude: { value: amplitude },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      ${windGLSL}
      uniform mat4 uWindFrame;
      uniform float uWindBase, uWindHeight, uWindAmplitude;
    `).replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 windAsset = (uWindFrame * vec4(position,1.)).xyz;
        float windH = clamp((windAsset.y-uWindBase)/uWindHeight,0.,1.);
        vec3 windPoint = (instanceMatrix*vec4(position,1.)).xyz;
        float windBend = windH*windH * uWindAmplitude * uWindStrength * worldWindGust(windPoint.xz);
        vec3 windOffset = vec3(uWindDirection.x,0.,uWindDirection.y)*windBend;
        mat3 windBasis = mat3(instanceMatrix);
        transformed += vec3(
          dot(windOffset,windBasis[0])/dot(windBasis[0],windBasis[0]),
          dot(windOffset,windBasis[1])/dot(windBasis[1],windBasis[1]),
          dot(windOffset,windBasis[2])/dot(windBasis[2],windBasis[2])
        );
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'vegetation-wind-v1';
}

export function windShadowMaterials(material, field, frame, bounds, amplitude) {
  // One shadow material per rendered material preserves the foliage alpha map.
  const options = { map: material.map, alphaMap: material.alphaMap,
    alphaTest: material.alphaTest, side: material.side };
  const depth = new THREE.MeshDepthMaterial({ ...options, depthPacking: THREE.RGBADepthPacking });
  const distance = new THREE.MeshDistanceMaterial(options);
  for (const m of [depth,distance]) applyVegetationWind(m,field,frame,bounds,amplitude);
  return { depth, distance };
}
