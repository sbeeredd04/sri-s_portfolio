import { Matrix4, Float32BufferAttribute, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';

const signedArea=poly=>poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
function intersection(subject,clip){
  let out=subject.slice();const direction=Math.sign(signedArea(clip));
  for(let i=0;i<clip.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length];
    const side=p=>direction*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));
    const input=out;out=[];if(!input.length)break;
    for(let j=0;j<input.length;j++){
      const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);
      if(sp>=0)out.push(p);
      if((sp>=0)!=(sq>=0)){const t=sp/(sp-sq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
    }
  }
  return out;
}

// Inspect every exterior wall plane of the decoded architecture. Double-sided
// authored meshes can flicker even when coincident triangles have opposite
// winding, so orientation alone must not exempt them. True back-to-wall trim
// contacts are safe only when the actual protruding geometry covers the whole
// overlap from outside; ray probes verify that rather than trusting a name.
export function auditMadeFacades(scene,studios){
  const material=new MeshBasicMaterial({side:DoubleSide}),results=[];
  for(const site of studios){
    const source=scene.getObjectByName(site.name+'_Architecture');
    if(!source?.isMesh)throw new Error(`Missing ${site.name} architecture`);
    const frame=new Matrix4().makeRotationY(site.yaw).setPosition(...site.center),inverse=frame.invert();
    const geometry=source.geometry.clone(),original=source.geometry.attributes.position,values=[];
    // Meshopt keeps quantized integer positions with a node scale. Expand
    // before transforms: writing world metres back into Int16 loses geometry.
    for(let i=0;i<original.count;i++)values.push(original.getX(i),original.getY(i),original.getZ(i));
    geometry.setAttribute('position',new Float32BufferAttribute(values,3));
    geometry.applyMatrix4(source.matrixWorld).applyMatrix4(inverse);
    const mesh=new Mesh(geometry,material);mesh.updateMatrixWorld();
    const p=geometry.attributes.position,c=geometry.attributes.color,index=geometry.index;
    const triangles=[];
    for(let i=0;i<(index?.count??p.count);i+=3){
      const indices=[0,1,2].map(j=>index?index.getX(i+j):i+j);
      const vertices=indices.map(j=>new Vector3().fromBufferAttribute(p,j));
      const ci=indices[0],color=[c.getX(ci),c.getY(ci),c.getZ(ci)];
      triangles.push({vertices,color});
    }
    for(const [face,axis,coordinate,sign] of [['front','z',site.size[2]/2,1],['rear','z',-site.size[2]/2,-1],['right','x',site.size[0]/2,1],['left','x',-site.size[0]/2,-1]]){
      const horizontal=axis==='z'?'x':'z',faces=[];
      for(const t of triangles){
        if(!t.vertices.every(v=>Math.abs(v[axis]-coordinate)<.002))continue;
        const polygon=t.vertices.map(v=>[v[horizontal],v.y]);
        if(Math.abs(signedArea(polygon))>1e-7)faces.push({...t,polygon});
      }
      let visibleOverlap=0,visiblePairs=0,coveredContacts=0;
      for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
        if(faces[i].color.every((v,k)=>Math.abs(v-faces[j].color[k])<.002))continue;
        const poly=intersection(faces[i].polygon,faces[j].polygon),area=Math.abs(signedArea(poly));
        if(area<.00001)continue;
        const centre=poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0]);
        const probes=[centre,...poly.map(p=>[p[0]*.98+centre[0]*.02,p[1]*.98+centre[1]*.02])];
        const covered=probes.every(probe=>{
          const origin=new Vector3();origin[axis]=coordinate+sign;origin[horizontal]=probe[0];origin.y=probe[1];
          const direction=new Vector3();direction[axis]=-sign;
          const hit=new Raycaster(origin,direction,.001,1.003).intersectObject(mesh)[0];
          return hit&&hit.distance<.996;
        });
        if(covered)coveredContacts++;else{visibleOverlap+=area;visiblePairs++;}
      }
      results.push({studio:site.id,face,triangles:faces.length,visiblePairs,visibleOverlapM2:+visibleOverlap.toFixed(6),coveredContacts});
    }
    geometry.dispose();
  }
  material.dispose();return results;
}
