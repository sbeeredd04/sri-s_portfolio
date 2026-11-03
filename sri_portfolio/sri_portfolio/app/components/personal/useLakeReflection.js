import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// Capture a small, static reflection of the actual shore only when the lake
// is being viewed. Waves perturb that probe continuously without extra
// scene renders. Shared meshes are borrowed; their geometry is never disposed.
export default function useLakeReflection(model,root,active,night){
  const gl=useThree(s=>s.gl),invalidate=useThree(s=>s.invalidate);
  useEffect(()=>{
    if(!active||!root.current)return;
    let target;
    const frame=requestAnimationFrame(()=>{
      const scene=new THREE.Scene();
      scene.background=new THREE.Color(night?"#34485a":"#bba695");
      const origin=root.current.parent.localToWorld(new THREE.Vector3(-13.8,4.14,17.5));
      const offset=new THREE.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z);
      const box=new THREE.Box3();
      const tint=new THREE.MeshBasicMaterial({color:night?"#8e9aa4":"#ead6bc",vertexColors:true});
      model.scene.updateWorldMatrix(true,true);
      model.scene.traverse(o=>{
        if(!o.isMesh||!o.visible||!o.geometry.attributes.color)return;
        if(!/^(terrain|rock|lake_granite|redwood|pine|lookout_vc|dock_boats|lake_skiff)/.test(o.userData.p11Node||''))return;
        if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        if(box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).distanceToPoint(origin)>47)return;
        const reflected=new THREE.Mesh(o.geometry,tint);
        reflected.matrix.copy(o.matrixWorld).premultiply(offset);
        reflected.matrixAutoUpdate=false;scene.add(reflected);
      });
      const generator=new THREE.PMREMGenerator(gl);
      target=generator.fromScene(scene,.025,.2,110,{size:64});
      generator.dispose();tint.dispose();
      for(const m of model.materials)if(m.name==="PT_LakeWater"){
        m.envMap=target.texture;m.envMapIntensity=1.15;m.needsUpdate=true;
      }
      invalidate();
    });
    return ()=>{
      cancelAnimationFrame(frame);
      if(!target)return;
      for(const m of model.materials)if(m.envMap===target.texture){m.envMap=null;m.needsUpdate=true;}
      target.dispose();
    };
  },[model,root,active,night,gl,invalidate]);
}
