import { outThereFrame } from "./out-there-p11.mjs";

// Same metre frame as the exported refined curtain and the lake camera.
export const outThereFall = {
  lip: [-0.45, 16.65, 8.95],
  impact: [-0.45, 3.925, 10.35],
  widths: [2.6, 3.7],
  gravity: 9.81,
  entrySpeed: 1.7,
};
export const outThereFallRole = {
  waterfall: "sheet",
  falls_lip: "feeder",
  falls_foam: "foam",
};
export const outThereFallImpactNative = outThereFall.impact.map((value, axis) =>
  value * outThereFrame.unitsPerMetre + (axis === 1 ? outThereFrame.seaLevel : 0));

// Continuous wave fields in island metres. The standard material receives
// shadows and can use a small, static shore reflection in the lake close-up.
export function prepareOutThereWater(material, kind, uniforms) {
  const falls = kind === "falls",
    lake = kind === "lake";
  const sheet = kind === "sheet";
  const foam = kind === "foam";
  const feeder = kind === "feeder";
  const units = outThereFrame.unitsPerMetre;
  const lipY = outThereFall.lip[1] + outThereFrame.seaLevel / units;
  const impactZ = outThereFall.impact[2];
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uP11Time = uniforms.time;
    shader.uniforms.uP11Wind = uniforms.wind;
    shader.uniforms.uP11Inverse = uniforms.inverse;
    shader.vertexShader =
      "uniform float uP11Time, uP11Wind; uniform mat4 uP11Inverse; varying vec3 vP11;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
      vec4 p11World=modelMatrix*vec4(transformed,1.0);
      vP11=(uP11Inverse*p11World).xyz/${units};
      vec3 p11Axis=normalize(mat3(modelMatrix)*vec3(${falls ? "1.,0.,0." : "0.,1.,0."}));
      p11World.xyz+=p11Axis*${falls
        ? "(.012*sin(uP11Time*5.+vP11.y*3.))"
        : sheet || foam || feeder
          ? "0."
          : "((.005+.016*uP11Wind)*sin(uP11Time*1.5+vP11.x*.6+vP11.z*.48))"};
      vec4 mvPosition=viewMatrix*p11World;
      gl_Position=projectionMatrix*mvPosition;
    `,
    );
    shader.fragmentShader =
      "uniform float uP11Time, uP11Wind; varying vec3 vP11;\n" +
      shader.fragmentShader;
    if (falls) {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <color_fragment>",
          `
        #include <color_fragment>
        float runA=sin(vP11.x*8.+.42*sin(vP11.y*1.15+uP11Time*4.8));
        float runB=sin(vP11.x*17.+vP11.y*.8+uP11Time*5.7);
        float stream=.52+.34*runA+.14*runB;
        diffuseColor.rgb*=mix(vec3(.56,.69,.72),vec3(.93,.96,.94),stream);
      `,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `
        #include <emissivemap_fragment>
        totalEmissiveRadiance*=.36+.22*stream;
      `,
        );
      return;
    }
    if (sheet) {
      shader.fragmentShader = `
        float fallHash(vec2 p) {
          vec3 v=fract(vec3(p.xyx)*.1031);
          v+=dot(v,v.yzx+33.33);
          return fract((v.x+v.y)*v.z);
        }
        float fallNoise(vec2 p) {
          vec2 cell=floor(p), f=fract(p);
          f=f*f*(3.-2.*f);
          return mix(mix(fallHash(cell),fallHash(cell+vec2(1.,0.)),f.x),
            mix(fallHash(cell+vec2(0.,1.)),fallHash(cell+vec2(1.)),f.x),f.y);
        }
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>
        float drop=max(0.,${lipY}-vP11.y);
        float span=mix(${outThereFall.widths[0]},${outThereFall.widths[1]},clamp((vP11.z-${outThereFall.lip[2]})/${impactZ-outThereFall.lip[2]},0.,1.));
        float across=(vP11.x-(${outThereFall.lip[0]}))/span;
        float fallAge=(sqrt(${outThereFall.entrySpeed ** 2}+2.*${outThereFall.gravity}*drop)-${outThereFall.entrySpeed})/${outThereFall.gravity};
        float advect=fallAge-uP11Time;
        // Narrow threads stay roughly vertical but emerge and break apart
        // at unrelated phases. All the turbulence is advected with the fall.
        float drift=fallNoise(vec2(across*6.,advect*3.2));
        vec2 threads=vec2(across*16.+.74*drift,advect*9.+drift*1.4);
        vec2 grains=vec2(across*28.-drift,advect*17.+across*4.);
        float packet=fallNoise(threads)*.71+fallNoise(grains)*.29;
        float coverage=1.-smoothstep(.36,.92,max(fwidth(threads.x),fwidth(threads.y)));
        float aeration=mix(.18,smoothstep(.46,.8,packet),coverage);
        float foot=smoothstep(10.3,12.73,drop);
        float feather=.5-.026*fallNoise(vec2(across*13.,advect*11.));
        float edge=1.-smoothstep(feather-.085,feather+.014,abs(across));
        float white=clamp(aeration*.72+foot*.38,0.,1.);
        diffuseColor.rgb=mix(vec3(.205,.303,.325),vec3(.64,.75,.74),white);
        diffuseColor.a*=edge*mix(.73,.95,max(white,foot));
      `,
      ).replace(
        "#include <emissivemap_fragment>",
        `
        #include <emissivemap_fragment>
        totalEmissiveRadiance*=.07+.40*aeration+.17*foot;
      `,
      );
      return;
    }
    if (foam || feeder) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        foam ? `
        #include <color_fragment>
        vec2 impact=vP11.xz-vec2(${outThereFall.impact[0]},${impactZ});
        float r=length(impact*vec2(.84,1.));
        float wake=.5+.5*sin(r*7.-uP11Time*6.+sin(atan(impact.y,impact.x)*3.)*.6);
        float turbulence=smoothstep(.21,.8,wake)*(1.-smoothstep(1.35,2.65,r));
        diffuseColor.rgb=mix(vec3(.19,.38,.38),vec3(.72,.84,.8),turbulence);
        diffuseColor.a*=.22+.68*turbulence;
      ` : `
        #include <color_fragment>
        float ripple=.5+.5*sin(vP11.z*21.-uP11Time*11.+vP11.x*6.);
        diffuseColor.rgb=mix(vec3(.058,.17,.18),vec3(.29,.46,.45),ripple*.52);
      `,
      ).replace(
        "#include <emissivemap_fragment>",
        foam ? "#include <emissivemap_fragment>\ntotalEmissiveRadiance*=.08+.6*turbulence;"
          : "#include <emissivemap_fragment>\ntotalEmissiveRadiance*=.1;",
      );
      return;
    }
    if (lake)
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
      #include <color_fragment>
      float tint=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),0.,1.);
      vec3 deep=vec3(.016,.115,.147), shelf=vec3(.055,.262,.247);
      diffuseColor.rgb=mix(deep,shelf,.23+.62*smoothstep(.08,.61,tint));
      float r=length((vP11.xz-vec2(${outThereFall.impact[0]},${impactZ}))*vec2(.74,1.));
      float curl=.5+.5*sin(r*4.3-uP11Time*3.2+.34*sin(vP11.x*1.4));
      float crest=pow(curl,7.)*exp(-.36*max(0.,r-1.));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.65,.59),crest*.22);
      float ripple=.5+.5*sin(dot(vP11.xz,vec2(.7,2.1))-uP11Time*1.9+.45*sin(vP11.x*.64));
      diffuseColor.rgb *= .94 + .1*ripple;
    `,
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `
      #include <normal_fragment_maps>
      vec2 q=vP11.xz;
      float detail=1.-smoothstep(.07,.45,max(length(dFdx(q)),length(dFdy(q))));
      float amplitude=(.011+.022*uP11Wind)*detail;
      float waves=amplitude*(sin(dot(q,vec2(1.2,.54))-uP11Time*1.5)+.43*sin(dot(q,vec2(-1.75,2.24))+uP11Time*2.2)+.19*sin(dot(q,vec2(3.1,3.5))-uP11Time*2.4));
      vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
      vec3 bx=cross(dy,normal),by=cross(normal,dx);
      float det=dot(dx,bx)*faceDirection;
      if(abs(det)>.00000001) normal=normalize(abs(det)*normal-sign(det)*(dFdx(waves)*bx+dFdy(waves)*by));
    `,
    );
  };
  material.customProgramCacheKey = () => `p11-flow-v6-${kind}`;
}
