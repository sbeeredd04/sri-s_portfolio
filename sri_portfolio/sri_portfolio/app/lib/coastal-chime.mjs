import { windGust } from './wind-field.mjs';
import { fieldnotesCanopyY, fieldnotesCanopy } from './fieldnotes-layout.mjs';
export const coastalChime = { x:-4.02, z:3.82, radius:.14, length:.72 };
export const chimeNotes=[880,987.8,1174.7,1318.5,1568,1760];
export function createChimeState(){return {x:0,z:0,vx:0,vz:0,last:-Infinity,accumulator:0};}
export function stepChime(state,delta,time,strength,direction,running=true){
 if(!running || !Number.isFinite(delta) || delta<=0) return null;
 const dt=Math.min(delta,.1);state.accumulator+=dt;
 let strike=null;
 while(state.accumulator>=1/120){
  const h=1/120,t=time-state.accumulator;
  const gust=windGust(coastalChime.x,coastalChime.z,t);
  const force=Math.max(0,Math.min(1,strength))*(2.8*gust+3.2*Math.sin(t*4.3));
  state.vx+=(force*direction[0]-22*state.x-1.1*state.vx)*h;
  state.vz+=(force*direction[1]-22*state.z-1.1*state.vz)*h;
  state.x+=state.vx*h;state.z+=state.vz*h;
  const radius=Math.hypot(state.x,state.z);
  const angle=Math.atan2(state.z,state.x),tube=((Math.round(angle/(Math.PI/3))%6)+6)%6;
  const difference=Math.atan2(Math.sin(angle-tube*Math.PI/3),Math.cos(angle-tube*Math.PI/3));
  // Contact with the nearest real tube circle: gaps between tubes stay gaps.
  const lateral=.1*Math.sin(difference),combinedRadius=.036+.012;
  const contact=Math.abs(lateral)<combinedRadius
    ? Math.asin((.1*Math.cos(difference)-Math.sqrt(combinedRadius**2-lateral**2))/.35)
    : .4;

  if(radius>contact){
   const nx=state.x/radius,nz=state.z/radius,speed=Math.max(0,state.vx*nx+state.vz*nz);
   state.x=nx*contact;state.z=nz*contact;
   state.vx-=1.35*speed*nx;state.vz-=1.35*speed*nz;
   if(contact<.4 && speed>.035 && t-state.last>.65){
    state.last=t;
    strike={tube,energy:Math.min(1,speed*2)};
   }
  }
  state.accumulator-=h;
 }
 return strike;
}
export function chimeAudibility(distance){return Math.max(0,1-distance/24)**2;}
export function chimeAnchor(){return [coastalChime.x,fieldnotesCanopyY(coastalChime.x,coastalChime.z)-fieldnotesCanopy.thickness+.005,coastalChime.z];}
