// Northwest land was reserved for the removed ring campus. Keep the bridge
// approach due north and the occupied east/south district on their old ground.
// Inputs are relative to the region's landCenter, shared by mesh and shader.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function foundryCoastEdges(x,z,inner,outer){
  const d=Math.max(.001,Math.hypot(x,z));
  const inlet=smooth(.15,.65,-x/d)*smooth(-.15,.45,-z/d);
  return [inner+(46-inner)*inlet,outer+(96-outer)*inlet];
}
export const foundryCoastGLSL=`
vec2 foundryCoastEdges(vec2 local,vec2 original){
  float d=max(.001,length(local));
  float inlet=smoothstep(.15,.65,-local.x/d)*smoothstep(-.15,.45,-local.y/d);
  return mix(original,vec2(46.,96.),inlet);
}
`;
