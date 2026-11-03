import { MathUtils, Vector3 } from 'three';

export const cameraCutaway = {
  near: .06, nearSoft: .3,
  targetShield: .65, targetSoft: 1.15,
  coreRadius: .55, outerRadius: 1.05,
  minimumAlpha: .025,
  floorUp: .65, floorTolerance: .15,
  maximumDistance: 24,
};
export const isHomeOccluder = name => name === 'Summit_Structure';

// CPU counterpart of the fragment corridor, used against decoded GLB hits.
// Points beyond either endpoint, the focused object and the walkable floor
// are preserved even though all of them share the summit's structural mesh.
export function cameraCutawayAlpha(point, up, eye, focus, strength = 1) {
  const axis = new Vector3().subVectors(focus, eye), length = axis.length();
  if (length < .001 || length > cameraCutaway.maximumDistance ||
      (Math.abs(up) > cameraCutaway.floorUp && point.y <= focus.y + cameraCutaway.floorTolerance)) return 1;
  axis.divideScalar(length);
  const relative = new Vector3().subVectors(point, eye);
  const along = relative.dot(axis);
  const radial = relative.addScaledVector(axis, -along).length();
  const c = cameraCutaway;
  const mask = MathUtils.smoothstep(along, c.near, c.nearSoft) *
    (1 - MathUtils.smoothstep(along, length - c.targetSoft, length - c.targetShield)) *
    (1 - MathUtils.smoothstep(radial, c.coreRadius, c.outerRadius));
  return 1 - MathUtils.clamp(strength, 0, 1) * mask * (1 - c.minimumAlpha);
}

export function cameraCutawayMaterial(source, uniforms) {
  const material = source.clone(), originalCompile = source.onBeforeCompile;
  const originalKey = source.customProgramCacheKey();
  const f = key => Number(cameraCutaway[key]).toFixed(4);
  // Opaque depth writing plus stable alpha hashing avoids transparency sorting
  // of a building containing several stories in one exported mesh.
  material.alphaHash = true;
  material.transparent = false;
  material.onBeforeCompile = (shader, renderer) => {
    originalCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec3 vCutWorld; varying float vCutUp;\n' + shader.vertexShader
      .replace('#include <defaultnormal_vertex>', `
        #include <defaultnormal_vertex>
        vCutUp = inverseTransformDirection(transformedNormal, viewMatrix).y;
      `)
      .replace('#include <project_vertex>', `
        vCutWorld = (modelMatrix * vec4(transformed, 1.)).xyz;
        #include <project_vertex>
      `);
    shader.fragmentShader = `
      uniform vec3 uCutEye; uniform vec3 uCutFocus; uniform float uCutStrength;
      varying vec3 vCutWorld; varying float vCutUp;
    ` + shader.fragmentShader.replace('#include <alphahash_fragment>', `
      vec3 cutAxis = uCutFocus-uCutEye;
      float cutLength = length(cutAxis);
      if(uCutStrength>.001 && cutLength>.001 && cutLength<${f('maximumDistance')}) {
        cutAxis /= cutLength;
        vec3 cutRelative = vCutWorld-uCutEye;
        float cutAlong = dot(cutRelative,cutAxis);
        float cutRadius = length(cutRelative-cutAlong*cutAxis);
        float cutMask = smoothstep(${f('near')},${f('nearSoft')},cutAlong)
          * (1.-smoothstep(cutLength-${f('targetSoft')},cutLength-${f('targetShield')},cutAlong))
          * (1.-smoothstep(${f('coreRadius')},${f('outerRadius')},cutRadius));
        if(abs(vCutUp)>${f('floorUp')} && vCutWorld.y<=uCutFocus.y+${f('floorTolerance')}) cutMask=0.;
        diffuseColor.a *= 1.-uCutStrength*cutMask*(1.-${f('minimumAlpha')});
      }
      #include <alphahash_fragment>
    `);
  };
  material.customProgramCacheKey = () => originalKey + '-camera-corridor-v1';
  return material;
}
