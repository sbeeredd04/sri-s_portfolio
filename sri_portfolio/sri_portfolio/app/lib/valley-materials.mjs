import * as THREE from "three";

export function createGraniteMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#b1a79a",
    roughness: 0.9,
    emissive: "#5c564c",
    emissiveIntensity: 0.08,
    vertexColors: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec3 vStone;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvStone=position;",
      );
    shader.fragmentShader =
      `varying vec3 vStone;
      float rockHash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float rockNoise(vec3 p){vec3 i=floor(p), f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(rockHash(i),rockHash(i+vec3(1,0,0)),f.x),mix(rockHash(i+vec3(0,1,0)),rockHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(rockHash(i+vec3(0,0,1)),rockHash(i+vec3(1,0,1)),f.x),mix(rockHash(i+vec3(0,1,1)),rockHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      ` +
      shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
      float mineral=rockNoise(vStone*3.1);
      float weather=rockNoise(vStone*vec3(1.6,.12,1.6));
      float fracture=pow(1.-abs(sin(vStone.z*1.4+vStone.x*.4+rockNoise(vStone*vec3(.28,.05,.28))*2.)),18.);
      float grain=(rockNoise(vStone*70.)-.5)*.07;
      float filtered=1.-smoothstep(.01,.08,max(length(dFdx(vStone)),length(dFdy(vStone))));
      diffuseColor.rgb*=.94+mineral*.12-weather*.13-fracture*.2+grain*filtered;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.52,.46),.07*smoothstep(1.5,8.,vStone.y));
      `,
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `
      #include <normal_fragment_maps>
      float relief=rockNoise(vStone*3.6)*.03+rockNoise(vStone*16.)*.005;
      vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
      vec3 ay=cross(sy,normal), ax=cross(normal,sx);
      float det=dot(sx,ay)*faceDirection;
      normal=normalize(abs(det)*normal-sign(det)*(dFdx(relief)*ay+dFdy(relief)*ax));
    `,
    );
  };
  return material;
}

export function createWaterMaterial() {
  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshStandardMaterial({
    color: "#7f9eae",
    roughness: 0.38,
    metalness: 0.02,
    transparent: true,
    opacity: 0.92,
    depthWrite: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "attribute float flowKind; varying float vFall; varying vec2 vFlow;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFlow=uv; vFall=flowKind;",
      );
    shader.fragmentShader =
      `varying vec2 vFlow; varying float vFall;
      uniform float uTime;
      ` +
      shader.fragmentShader
        .replace(
          "#include <map_fragment>",
          `
        float flow=vFlow.y*16.-uTime*1.25;
        float streak=sin(flow)*.035+sin(flow*2.1+vFlow.x*24.)*.02;
        diffuseColor.rgb=mix(vec3(.07,.15,.17),vec3(.16,.28,.3),smoothstep(0.,1.,vFlow.y));
        diffuseColor.rgb+=streak*mix(.08,1.,vFall);
        float threads=.7+.3*sin(vFlow.x*45.+sin(flow)*.4);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.64,.77,.79)*(threads+streak),vFall);
        diffuseColor.a*=mix(1.,.64+threads*.28,vFall);
        `,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `
        #include <normal_fragment_maps>
        float ripple=sin(vFlow.y*18.-uTime*1.25)*.012;
        vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
        vec3 ay=cross(sy,normal), ax=cross(normal,sx);
        float det=dot(sx,ay)*faceDirection;
        normal=normalize(abs(det)*normal-sign(det)*(dFdx(ripple)*ay+dFdy(ripple)*ax));
        `,
        );
  };
  return material;
}

export function createBankMaterial() {
  return new THREE.MeshStandardMaterial({
    color: "#8a7d68",
    roughness: 0.96,
    side: THREE.DoubleSide,
  });
}
export function createTuftMaterial() {
  return new THREE.MeshStandardMaterial({
    color: "#688454",
    roughness: 0.94,
    emissive: "#314028",
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide,
  });
}
export const valleyMaterialCount = 4;
