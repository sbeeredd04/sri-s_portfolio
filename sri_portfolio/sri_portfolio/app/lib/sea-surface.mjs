// Metre-scaled, deep-water dispersion for visible normal detail. This is an
// optical surface, not displaced ocean geometry or a buoyancy simulation.
export const seaBands = [
  { length:3.8, amplitude:.065, angle:0 },
  { length:1.45, amplitude:.021, angle:.48 },
  { length:.42, amplitude:.004, angle:-.65 },
];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function seaHeight(x,z,time,direction,strength,footprint=0){
 return seaBands.reduce((sum,b)=>{
  const c=Math.cos(b.angle),s=Math.sin(b.angle),dx=direction[0]*c-direction[1]*s,dz=direction[0]*s+direction[1]*c;
  const k=2*Math.PI/b.length;
  const filter=1-smooth(b.length/12,b.length/3,footprint);
  return sum+Math.sin((x*dx+z*dz)*k-time*Math.sqrt(9.81*k))*b.amplitude*(.2+.8*strength)*filter;
 },0);
}
export const seaSurfaceGLSL=`
float windSeaHeight(vec2 p,float pixelWidth){
 float h=0.;
 ${seaBands.map(b=>`{
  vec2 d=mat2(${Math.cos(b.angle).toFixed(7)},${Math.sin(b.angle).toFixed(7)},${(-Math.sin(b.angle)).toFixed(7)},${Math.cos(b.angle).toFixed(7)})*uWindDirection;
  float waveFilter=1.-smoothstep(${(b.length/12).toFixed(7)},${(b.length/3).toFixed(7)},pixelWidth);
  h+=sin(dot(p,d)*${(2*Math.PI/b.length).toFixed(7)}-uWindTime*${Math.sqrt(9.81*2*Math.PI/b.length).toFixed(7)})*${b.amplitude.toFixed(7)}*(.2+.8*uWindStrength)*waveFilter;
 }`).join('\n')}
 return h;
}
`;
