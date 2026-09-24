import * as THREE from "three";

// World-space triplanar PBR for authored/procedural meshes without useful UVs
// (terrain, granite, cliffs). Samples albedo, normal and roughness along the
// three axes and blends by the surface normal, so textures never stretch on
// steep faces. A second, rotated, larger-scale sample breaks visible tiling.
// Chains after any existing onBeforeCompile and only touches chunks those
// patches leave intact (color, roughness and the normal include).

export function applyTriplanar(
  material,
  {
    albedo,
    normal,
    roughness,
    scale = 0.25, // repeats per metre
    tint = "#ffffff",
    strength = 1, // albedo replacement amount (0 keeps procedural colour)
    normalStrength = 1,
    sharpness = 4,
    // GLSL expression (0..1) in scope inside main(); limits where textures apply.
    mask = "1.",
    // "replace" swaps albedo for the photo; "detail" keeps the existing colour
    // and adds the photo's light/dark structure (for palette-driven terrain).
    mode = "replace",
    meanLuminance = 0.35,
  },
) {
  for (const t of [albedo, normal, roughness]) {
    if (!t) continue;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.max(t.anisotropy, 8);
  }
  if (albedo) albedo.colorSpace = THREE.SRGBColorSpace;
  const uniforms = {
    uTriAlbedo: { value: albedo || null },
    uTriNormal: { value: normal || null },
    uTriRough: { value: roughness || null },
    uTriScale: { value: scale },
    uTriTint: { value: new THREE.Color(tint) },
    uTriStrength: { value: strength },
    uTriNormalStrength: { value: normalStrength },
    uTriSharp: { value: sharpness },
    uTriMean: { value: meanLuminance },
    uTriBase: { value: material.color ? material.color.clone() : new THREE.Color(1, 1, 1) },
  };
  material.userData.triplanar = uniforms;
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "varying vec3 vTriPos; varying vec3 vTriNormal;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        mat4 triModel = modelMatrix;
        #ifdef USE_INSTANCING
          triModel = modelMatrix * instanceMatrix;
        #endif
        vTriPos = (triModel * vec4(transformed, 1.)).xyz;
        vTriNormal = normalize(mat3(triModel) * objectNormal);`,
      );
    const defines = [
      albedo && "#define TRI_ALBEDO",
      normal && "#define TRI_NORMAL",
      roughness && "#define TRI_ROUGH",
    ]
      .filter(Boolean)
      .join("\n");
    shader.fragmentShader =
      `${defines}
      varying vec3 vTriPos; varying vec3 vTriNormal;
      uniform sampler2D uTriAlbedo, uTriNormal, uTriRough;
      uniform float uTriScale, uTriStrength, uTriNormalStrength, uTriSharp, uTriMean;
      uniform vec3 uTriTint, uTriBase;
      vec3 triWeights(vec3 n){ vec3 w = pow(abs(n), vec3(uTriSharp)); return w / (w.x + w.y + w.z); }
      vec4 triSample(sampler2D map, vec3 p, vec3 w){
        return texture2D(map, p.zy) * w.x + texture2D(map, p.xz) * w.y + texture2D(map, p.xy) * w.z;
      }
      // Two scales, the larger rotated, hide the repeat of a single tile.
      vec4 triDetail(sampler2D map, vec3 p, vec3 w){
        vec3 q = mat3(.8,0.,-.6, 0.,1.,0., .6,0.,.8) * p * .27 + 17.3;
        return mix(triSample(map, p, w), triSample(map, q, w), .35);
      }
      ` +
      shader.fragmentShader
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          vec3 triN = normalize(vTriNormal);
          vec3 triW = triWeights(triN);
          vec3 triP = vTriPos * uTriScale;
          #ifdef TRI_ALBEDO
            vec3 triColor = triDetail(uTriAlbedo, triP, triW).rgb * uTriTint;
            // Keep the procedural macro variation (weathering, vertex tint) as a
            // brightness modulation of the photographed texture.
            float triMacro = clamp(dot(diffuseColor.rgb, vec3(.333)) / max(.001, dot(uTriBase, vec3(.333))), .55, 1.45);
            float triMask = clamp(${mask}, 0., 1.);
            ${
              mode === "detail"
                ? "float triLum = dot(triColor, vec3(.2126,.7152,.0722)) / uTriMean; diffuseColor.rgb *= mix(1., clamp(triLum, .35, 2.2), uTriStrength * triMask);"
                : "diffuseColor.rgb = mix(diffuseColor.rgb, triColor * triMacro, uTriStrength * triMask);"
            }
          #endif`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          #ifdef TRI_ROUGH
            roughnessFactor = mix(roughnessFactor, roughnessFactor * clamp(triDetail(uTriRough, triP, triW).g * 1.6, .3, 1.), clamp(${mask}, 0., 1.));
          #endif`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          #ifdef TRI_NORMAL
          {
            // Whiteout-blended tangent normals per projection, into world space.
            vec3 tx = triSample(uTriNormal, triP, vec3(1,0,0)).xyz * 2. - 1.;
            vec3 ty = triSample(uTriNormal, triP, vec3(0,1,0)).xyz * 2. - 1.;
            vec3 tz = triSample(uTriNormal, triP, vec3(0,0,1)).xyz * 2. - 1.;
            tx.xy *= uTriNormalStrength; ty.xy *= uTriNormalStrength; tz.xy *= uTriNormalStrength;
            vec3 nx = vec3(tx.xy + triN.zy, abs(tx.z) * triN.x).zyx;
            vec3 ny = vec3(ty.xy + triN.xz, abs(ty.z) * triN.y).xzy;
            vec3 nz = vec3(tz.xy + triN.xy, abs(tz.z) * triN.z);
            vec3 worldN = normalize(nx * triW.x + ny * triW.y + nz * triW.z);
            vec3 triView = normalize((viewMatrix * vec4(worldN, 0.)).xyz) * faceDirection;
            normal = normalize(mix(normal, triView, clamp(${mask}, 0., 1.)));
          }
          #endif`,
        );
  };
  material.customProgramCacheKey = () =>
    `tri:${mode}:${mask}:${Boolean(albedo)}${Boolean(normal)}${Boolean(roughness)}:${previous?.toString().length || 0}`;
  material.needsUpdate = true;
  return material;
}
