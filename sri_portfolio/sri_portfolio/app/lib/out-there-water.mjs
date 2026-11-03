// Continuous wave fields in island metres. The standard material receives
// shadows and can use a small, static shore reflection in the lake close-up.
export function prepareOutThereWater(material, kind, uniforms) {
  const falls = kind === "falls",
    lake = kind === "lake";
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
      vP11=(uP11Inverse*p11World).xyz/1.56;
      vec3 p11Axis=normalize(mat3(modelMatrix)*vec3(${falls ? "1.,0.,0." : "0.,1.,0."}));
      p11World.xyz+=p11Axis*${falls ? "(.012*sin(uP11Time*5.+vP11.y*3.))" : "((.005+.016*uP11Wind)*sin(uP11Time*1.5+vP11.x*.6+vP11.z*.48))"};
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
    if (lake)
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
      #include <color_fragment>
      float tint=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),0.,1.);
      vec3 deep=vec3(.016,.115,.147), shelf=vec3(.055,.262,.247);
      diffuseColor.rgb=mix(deep,shelf,.23+.62*smoothstep(.08,.61,tint));
      float r=length((vP11.xz-vec2(-.45,10.35))*vec2(.74,1.));
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
  material.customProgramCacheKey = () => `p11-flow-v4-${kind}`;
}
