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

const noiseGlsl = `
float vHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(vHash(i),vHash(i+vec2(1,0)),f.x),mix(vHash(i+vec2(0,1)),vHash(i+1.),f.x),f.y);}
`;

// Stream and fall share one ribbon. On the fall (flowKind 1) aerated water is
// drawn as fast vertical streaks with ragged, breaking edges that thicken into
// foam where it lands; on the ground it is a dark, rippled channel.
export function createWaterMaterial() {
  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshStandardMaterial({
    color: "#7f9eae",
    roughness: 0.3,
    metalness: 0.02,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "attribute float flowKind; attribute float fallT; varying float vFall; varying float vFallT; varying vec2 vFlow;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFlow=uv; vFall=flowKind; vFallT=fallT;",
      );
    shader.fragmentShader =
      `varying vec2 vFlow; varying float vFall; varying float vFallT;
      uniform float uTime;
      ${noiseGlsl}` +
      shader.fragmentShader
        .replace(
          "#include <map_fragment>",
          `
        float flow=vFlow.y*16.-uTime*1.25;
        float streak=sin(flow)*.035+sin(flow*2.1+vFlow.x*24.)*.02;
        vec3 channel=mix(vec3(.07,.15,.17),vec3(.16,.28,.3),smoothstep(0.,1.,vFlow.y));
        channel+=streak*.08;
        // Fall: streaks stretched along the drop, scrolling faster lower down.
        float drop=vFallT*9.;
        float speed=uTime*(5.+vFallT*4.);
        float s1=vNoise(vec2(vFlow.x*26.,drop*.7-speed));
        float s2=vNoise(vec2(vFlow.x*64.+3.,drop*1.8-speed*1.6));
        float sheet=s1*.62+s2*.38;
        float mid=min(vFlow.x,1.-vFlow.x)*2.;
        float ragged=.18+.34*vNoise(vec2(drop*1.3-speed*.8,vFlow.x*6.))+vFallT*.18;
        float edge=smoothstep(0.,ragged,mid);
        float foam=smoothstep(.72,1.,vFallT);
        vec3 fallCol=mix(vec3(.46,.58,.63),vec3(.9,.95,.98),smoothstep(.35,.78,sheet+foam*.5));
        diffuseColor.rgb=mix(channel,fallCol,vFall);
        float fallA=edge*mix(.3,.97,smoothstep(.25,.7,sheet))*(1.-smoothstep(.97,1.,vFallT)*.6);
        diffuseColor.a*=mix(1.,max(fallA,foam*edge*.9),vFall);
        `,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `
        #include <normal_fragment_maps>
        float ripple=sin(vFlow.y*18.-uTime*1.25)*.012*(1.-vFall);
        vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
        vec3 ay=cross(sy,normal), ax=cross(normal,sx);
        float det=dot(sx,ay)*faceDirection;
        normal=normalize(abs(det)*normal-sign(det)*(dFdx(ripple)*ay+dFdy(ripple)*ax));
        `,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.55,vFall);",
        );
  };
  return material;
}

// Spray where the fall lands: soft round sprites that rise, spread and fade.
export function createMistMaterial() {
  const uniforms = { uTime: { value: 0 }, uScale: { value: 180 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float seed; uniform float uTime; uniform float uScale; varying float vFade;
      void main(){
        float life=fract(uTime*.16+seed);
        vec3 p=position;
        float a=seed*37.;
        p.xz+=vec2(cos(a),sin(a))*life*(.7+seed*.8);
        p.y+=life*(1.1+seed*1.4);
        vFade=smoothstep(0.,.18,life)*(1.-smoothstep(.45,1.,life));
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uScale*(.55+life*1.4)/-mv.z;
      }`,
    fragmentShader: `
      varying float vFade;
      void main(){
        vec2 c=gl_PointCoord-.5;
        float d=1.-smoothstep(.1,.5,length(c));
        gl_FragColor=vec4(vec3(.86,.92,.95),d*vFade*.11);
        #include <colorspace_fragment>
      }`,
  });
  material.userData.uniforms = uniforms;
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
