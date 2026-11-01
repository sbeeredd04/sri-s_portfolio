import { fieldnotesCanopy as c, fieldnotesCanopyY, fieldnotesRoofProfile as p,
  fieldnotesWall as w, fieldnotesReturn as r } from './fieldnotes-layout.mjs';

const walls = [
  { min:[w.x0,-.04,w.z-w.thickness/2], max:[w.x1,3.1,w.z+w.thickness/2] },
  { min:[r.x-r.thickness/2,-.04,r.z0], max:[r.x+r.thickness/2,3.1,r.z1] },
];
// Backtrace the falling drop to the authored roof or windward wall. Three
// iterations converge for this shallow roof and the renderer's bounded lean.
export function fieldnotesSheltered(point, fall) {
  if (point[1]<-.5 || point[1]>3.2 || Math.hypot(point[0],point[2])>30 || fall[1]>=-.15) return false;
  for(const lift of [0,-c.thickness]) {
    let t=(fieldnotesCanopyY(point[0],point[2])+lift-point[1])/-fall[1];
    for(let i=0;i<3;i++) t=(fieldnotesCanopyY(point[0]-fall[0]*t,point[2]-fall[2]*t)+lift-point[1])/-fall[1];
    const x=point[0]-fall[0]*t,z=point[2]-fall[2]*t;
    if(t>=0 && x>=c.x0 && x<=c.x1 && z>=c.zFront && z<=c.zBack) return true;
  }
  for(const box of walls) {
    let lo=0,hi=40;
    for(let axis=0;axis<3;axis++) {
      const direction=-fall[axis];
      if(Math.abs(direction)<1e-7) {
        if(point[axis]<box.min[axis] || point[axis]>box.max[axis]) {hi=-1;break;}
      } else {
        const a=(box.min[axis]-point[axis])/direction, b=(box.max[axis]-point[axis])/direction;
        lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
      }
    }
    if(hi>=lo && hi>0) {
      const hit=point.map((v,i)=>v-fall[i]*lo);
      if(hit[1]<=fieldnotesCanopyY(hit[0],hit[2])-c.thickness) return true;
    }
  }
  return false;
}
const f=n=>`(${Number(n).toFixed(6)})`;
const v=a=>`vec3(${a.map(f).join(',')})`;
export const fieldnotesShelterGLSL = `
  uniform mat4 uFieldnotesInverse;
  float fieldnotesRoofY(vec2 q) {
    float u=(q.x-${f(c.x0)})/${f(c.x1-c.x0)};
    float v=(q.y-${f(c.zBack)})/${f(c.zFront-c.zBack)};
    return ${f(p.height)}-v*${f(p.slope)}+cos((u-${f(p.center)})*3.141592654)*${f(p.crown)}*(1.-v*${f(p.taper)});
  }
  bool fieldnotesWallHit(vec3 q,vec3 d,vec3 low,vec3 high) {
    float nearT=0., farT=40.;
    for(int axis=0;axis<3;axis++) {
      if(abs(d[axis])<.0000001) {
        if(q[axis]<low[axis] || q[axis]>high[axis]) return false;
      } else {
        float a=(low[axis]-q[axis])/d[axis], b=(high[axis]-q[axis])/d[axis];
        nearT=max(nearT,min(a,b));farT=min(farT,max(a,b));
      }
    }
    vec3 hit=q+d*nearT;
    return farT>=nearT && farT>0. && hit.y<=fieldnotesRoofY(hit.xz)-${f(c.thickness)};
  }
  float fieldnotesRainVisibility(vec3 world,vec3 fallWorld) {
    vec3 q=(uFieldnotesInverse*vec4(world,1.)).xyz;
    vec3 fall=(uFieldnotesInverse*vec4(fallWorld,0.)).xyz;
    if(q.y<-.5 || q.y>3.2 || fall.y>=-.15 || length(q.xz)>30.) return 1.;
    for(int surface=0;surface<2;surface++) {
      float lift=-float(surface)*${f(c.thickness)};
      float t=(fieldnotesRoofY(q.xz)+lift-q.y)/-fall.y;
      for(int i=0;i<3;i++) t=(fieldnotesRoofY(q.xz-fall.xz*t)+lift-q.y)/-fall.y;
      vec2 hit=q.xz-fall.xz*t;
      if(t>=0. && hit.x>=${f(c.x0)} && hit.x<=${f(c.x1)} && hit.y>=${f(c.zFront)} && hit.y<=${f(c.zBack)}) return 0.;
    }
    ${walls.map(box=>`if(fieldnotesWallHit(q,-fall,${v(box.min)},${v(box.max)})) return 0.;`).join('\n')}
    return 1.;
  }
`;
