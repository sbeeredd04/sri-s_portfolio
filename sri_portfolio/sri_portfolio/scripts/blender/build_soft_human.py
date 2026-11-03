"""Original faceless soft-polygon adult, 1.75m. Three +Z forward, feet y=0.
Two-bone ankle targets and sole-aware foot roll, real skinned Idle / Walk.
"""
from __future__ import annotations
import json, math, sys
from pathlib import Path
import bpy
from mathutils import Matrix, Quaternion, Vector
APP=Path(__file__).resolve().parents[2]
SRC=APP/'asset-src/authored/soft-human';STATS=APP/'asset-src/stats/soft-human.json'
FPS=30
WALK_FRAMES=32
IDLE_FRAMES=96
STANCE=.60
TRAVEL=.56
SPEED=TRAVEL/(STANCE*WALK_FRAMES/FPS)
PALETTE={'shirt':'7B9B91','rib':'688B80','skin':'C68F71','hair':'473832',
         'pants':'687888','seam':'647484','shoe':'DAD3C2','sole':'A59D8C'}


def V(x,y,z):return Vector((x,-z,y))
def rgba(name):
    h=PALETTE[name]
    def lin(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
    return (*[lin(int(h[i:i+2],16)/255) for i in (0,2,4)],1)
def mix(a,b,t):return a+(b-a)*t
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)


class Skin:
    def __init__(self): self.verts=[];self.faces=[];self.colors=[];self.weights=[]
    def vertex(self,p,w):self.verts.append(V(*p));self.weights.append(w);return len(self.verts)-1
    def face(self,f,t):self.faces.append(tuple(f));self.colors.append(rgba(t))
    def rings(self,rows,sides,weight,tone,top_cap=True):
        """Rows: (x, y, z, half-width, half-depth); from bottom to top."""
        grid=[]
        for i,(x,y,z,w,d) in enumerate(rows):
            grid.append([self.vertex((x+w*math.cos(j*math.tau/sides),y,z+d*math.sin(j*math.tau/sides)),weight(i,x,y,z)) for j in range(sides)])
        self.face(grid[0],tone(0))
        for i,(a,b) in enumerate(zip(grid,grid[1:])):
            for j in range(sides):
                k=(j+1)%sides;self.face((a[j],b[j],b[k],a[k]),tone(i))
        if top_cap:self.face(list(reversed(grid[-1])),tone(len(grid)-1))
        return grid[-1]
    def object(self,name,rig,material):
        m=bpy.data.meshes.new(name);m.from_pydata(self.verts,[],self.faces);m.update();m.materials.append(material)
        attr=m.color_attributes.new(name='PaletteColor',type='FLOAT_COLOR',domain='CORNER')
        for poly,rgba_ in zip(m.polygons,self.colors):
            poly.use_smooth=True
            for loop in poly.loop_indices:attr.data[loop].color=rgba_
        m.color_attributes.active_color=attr;m.color_attributes.render_color_index=0
        o=bpy.data.objects.new(name,m);bpy.context.scene.collection.objects.link(o);o.parent=rig
        groups={}
        for i,weights in enumerate(self.weights):
            for name_,w in weights.items():
                if w<1e-5:continue
                if name_ not in groups:groups[name_]=o.vertex_groups.new(name=name_)
                groups[name_].add([i],w,'REPLACE')
        mod=o.modifiers.new('Articulated skin','ARMATURE');mod.object=rig
        return o

def single(name):return lambda i,x,y,z:{name:1.0}
def constant(tone):return lambda i:tone


def make_rig(root):
    arm=bpy.data.armatures.new('SoftHumanSkeleton');rig=bpy.data.objects.new('SoftHuman_Rig',arm)
    bpy.context.scene.collection.objects.link(rig);rig.parent=root;bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    specs=[('MotionRoot',(0,0,0),(0,.12,0),None),('Hips',(0,.94,0),(0,1.04,0),'MotionRoot'),
        ('Spine',(0,1.04,0),(0,1.27,0),'Hips'),('Chest',(0,1.27,0),(0,1.425,0),'Spine'),
        ('Neck',(0,1.425,0),(0,1.523,.003),'Chest'),('Head',(0,1.523,.003),(0,1.74,.003),'Neck')]
    for side,sign in [('L',1),('R',-1)]:
        def p(x,y,z):return (x*sign,y,z)
        specs += [(f'Clavicle_{side}',p(.055,1.365,0),p(.199,1.388,0),'Chest'),
            (f'UpperArm_{side}',p(.199,1.388,0),p(.252,1.105,.013),f'Clavicle_{side}'),
            (f'Forearm_{side}',p(.252,1.105,.013),p(.277,.858,.029),f'UpperArm_{side}'),
            (f'Hand_{side}',p(.277,.858,.029),p(.28,.765,.04),f'Forearm_{side}'),
            (f'Thigh_{side}',p(.089,.94,0),p(.093,.52,.018),'Hips'),
            (f'Shin_{side}',p(.093,.52,.018),p(.093,.09,0),f'Thigh_{side}'),
            (f'Foot_{side}',p(.093,.09,0),p(.093,.045,.15),f'Shin_{side}')]
    for name,h,t,parent in specs:
        b=arm.edit_bones.new(name);b.head=V(*h);b.tail=V(*t)
        b.align_roll(Vector((0,-1,0)) if not name.startswith('Foot') else Vector((0,0,1)))
        if parent:b.parent=arm.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in rig.pose.bones:pb.rotation_mode='QUATERNION'
    arm.display_type='STICK'
    return rig


def make_meshes(rig):
    material=bpy.data.materials.new('SoftHuman_MattePalette');material.use_nodes=True
    nodes=material.node_tree.nodes;bsdf=nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.82
    attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='PaletteColor';material.node_tree.links.new(attr.outputs['Color'],bsdf.inputs['Base Color'])
    shirt=Skin();pants=Skin();head=Skin();hair=Skin();hands=Skin();shoes={}
    def trunk(i,x,y,z):
        c=smooth(1.17,1.37,y);s=smooth(.98,1.14,y)
        return {'Hips':1-s,'Spine':s*(1-c),'Chest':s*c}
    # Soft tapered knit. The shoulder curve is designed in the ring profile;
    # narrow neck opening, relaxed drape, and sewn rib at cuffs/hem.
    shirt.rings([(0,.995,0,.149,.091),(0,1.012,0,.161,.1),(0,1.052,0,.165,.105),
        (0,1.115,.002,.16,.105),(0,1.20,.004,.171,.113),(0,1.283,.003,.187,.115),
        (0,1.354,.002,.201,.104),(0,1.401,0,.196,.09),(0,1.429,0,.164,.072),
        (0,1.447,0,.102,.061),(0,1.45,.001,.064,.052)],12,trunk,lambda i:'rib' if i in (0,1,9,10) else 'shirt')
    # Both legs will join the same closed waist/crotch topology.
    leg_top={}
    for side,sign in [('L',1),('R',-1)]:
        def p(x,y,z,w,d):return(x*sign,y,z,w,d)
        def arm_w(i,x,y,z):
            fore=1-smooth(1.035,1.168,y);ch=smooth(1.32,1.416,y)
            return {f'Forearm_{side}':fore,f'UpperArm_{side}':(1-fore)*(1-ch),'Chest':(1-fore)*ch}
        shirt.rings([p(.277,.851,.029,.039,.041),p(.277,.875,.028,.043,.044),p(.274,.919,.026,.049,.047),
            p(.266,.99,.021,.055,.051),p(.252,1.102,.013,.062,.056),p(.236,1.195,.007,.067,.061),
            p(.214,1.296,.002,.069,.066),p(.198,1.36,0,.066,.064),p(.176,1.395,0,.057,.056),
            p(.138,1.416,0,.036,.037)],10,arm_w,lambda i:'rib' if i<2 else 'shirt')
        # Relaxed mitten hands; thumb lobe forms part of the same silhouette.
        hands.rings([p(.281,.752,.044,.012,.015),p(.281,.768,.042,.029,.025),p(.278,.805,.035,.036,.029),
            p(.273,.833,.035,.034,.027),p(.276,.857,.03,.032,.032),p(.276,.868,.03,.029,.029)],9,single(f'Hand_{side}'),constant('skin'))
        hands.rings([p(.249,.786,.064,.010,.01),p(.245,.803,.06,.017,.014),p(.247,.824,.052,.018,.016),p(.255,.84,.045,.014,.014)],7,single(f'Hand_{side}'),constant('skin'))
        def leg_w(i,x,y,z):
            upper=smooth(.436,.606,y);hips=smooth(.883,.974,y)
            return {f'Shin_{side}':1-upper,f'Thigh_{side}':upper*(1-hips),'Hips':upper*hips}
        leg_top[side]=pants.rings([p(.093,.118,-.004,.044,.047),p(.093,.141,-.003,.048,.051),p(.092,.188,-.005,.051,.057),
            p(.094,.284,-.004,.058,.066),p(.094,.396,.004,.063,.067),p(.094,.467,.014,.062,.066),
            p(.093,.525,.021,.065,.072),p(.091,.584,.013,.074,.074),p(.087,.687,.001,.081,.084),
            p(.086,.794,-.009,.091,.089),p(.088,.878,-.01,.094,.093),p(.09,.965,-.008,.081,.086)],12,leg_w,lambda i:'seam' if i in (0,1) else 'pants',top_cap=False)
        for j,index in enumerate(leg_top[side]):
            inward=max(0,-sign*math.cos(j*math.tau/12))
            pants.verts[index].z-=.061*inward
            pants.weights[index]={'Hips':.92,f'Thigh_{side}':.08}
        shoe=Skin()
        shoe.rings([p(.093,0,.039,.046,.123),p(.093,.009,.039,.052,.134),p(.093,.023,.039,.056,.14),
            p(.093,.04,.038,.055,.138),p(.093,.064,.035,.052,.132),p(.093,.084,.022,.049,.106),
            p(.093,.11,.007,.043,.078),p(.093,.137,-.005,.036,.048)],12,single(f'Foot_{side}'),lambda i:'sole' if i<2 else 'shoe')
        shoes[side]=shoe
    waist=[pants.vertex((.154*math.cos(j*math.tau/12),1.036,-.007+.09*math.sin(j*math.tau/12)),{'Hips':1}) for j in range(12)]
    for side,indices in [('L',range(9,15)),('R',range(3,9))]:
        leg=leg_top[side]
        for n in indices:
            j,k=n%12,(n+1)%12
            pants.face((leg[j],waist[j],waist[k],leg[k]),'pants')
    left,right=leg_top['L'],leg_top['R']
    for j in range(3,9):
        k=j+1
        pants.face((left[j],right[(6-j)%12],right[(6-k)%12],left[k]),'pants')
    pants.face((right[3],left[3],waist[3]),'pants')
    pants.face((left[9],right[9],waist[9]),'pants')
    pants.face(list(reversed(waist)),'pants')
    head.rings([(0,1.414,0,.047,.043),(0,1.465,0,.046,.043),(0,1.51,.002,.048,.044),(0,1.54,.005,.055,.048)],12,
        lambda i,x,y,z:{'Chest':1-smooth(1.414,1.49,y),'Neck':smooth(1.414,1.49,y)},constant('skin'))
    # Featureless head, real jaw and temple silhouette; 0.233m crown-to-chin.
    head.rings([(0,1.517,.025,.028,.034),(0,1.531,.022,.047,.051),(0,1.551,.013,.061,.066),
        (0,1.585,.005,.074,.075),(0,1.622,-.003,.081,.077),(0,1.668,-.007,.079,.075),
        (0,1.704,-.007,.063,.061),(0,1.729,-.006,.035,.036),(0,1.738,-.007,.006,.01)],14,single('Head'),constant('skin'))
    for sign in [-1,1]:
        head.rings([(sign*.074,1.572,-.008,.006,.011),(sign*.08,1.588,-.01,.013,.016),
                    (sign*.082,1.609,-.01,.012,.014),(sign*.076,1.625,-.012,.005,.009)],8,single('Head'),constant('skin'))
    # Swept cap. Hairline is asymmetric and sits lower behind the ears.
    # A polar outline avoids a helmet seam or a fake painted-on face.
    rim=[];shoulder=[];crown=[];top=[];n=16
    for j in range(n):
        a=j*math.tau/n;c=math.cos(a);s=math.sin(a);front=max(0,s);back=max(0,-s)
        y=1.622+.062*front-.039*back+.012*front*c
        rim.append(hair.vertex((.083*c,y,-.006+.079*s),{'Head':1}))
        shoulder.append(hair.vertex((.083*c,1.683+.022*front,-.009+.079*s),{'Head':1}))
        crown.append(hair.vertex((.007+.058*c,1.727+.011*front,-.011+.057*s),{'Head':1}))
        top.append(hair.vertex((.013+.022*c,1.747+.003*front,-.006+.023*s),{'Head':1}))
    for a,b in zip([rim,shoulder,crown],[shoulder,crown,top]):
        for j in range(n):k=(j+1)%n;hair.face((a[j],b[j],b[k],a[k]),'hair')
    hair.face(list(reversed(top)),'hair')
    shirt.object('Human_Shirt',rig,material)['tintChannel']='shirt'
    pants.object('Human_Trousers',rig,material);head.object('Human_HeadAndNeck',rig,material)
    hair.object('Human_Hair',rig,material);hands.object('Human_Hands',rig,material)
    for side,shoe in shoes.items():shoe.object(f'Human_Shoe_{side}',rig,material)
    return shoes


def rotate_world(pb,axis,angle):
    p=pb.head.copy();q=Quaternion(axis,angle).to_matrix().to_4x4()
    pb.matrix=Matrix.Translation(p)@q@Matrix.Translation(-p)@pb.matrix
    bpy.context.view_layer.update()


def set_world(rig,name,head,rot):
    pb=rig.pose.bones[name]
    pb.matrix=Matrix.Translation(head)@rot.to_matrix().to_4x4();bpy.context.view_layer.update()


def aim(rig,name,head,target):
    b=rig.data.bones[name];rest=(b.tail_local-b.head_local).normalized();direction=(target-head).normalized()
    set_world(rig,name,head,rest.rotation_difference(direction)@b.matrix_local.to_quaternion())


def solve_leg(rig,side,ankle,pitch):
    a=rig.pose.bones[f'Thigh_{side}'].head.copy();v=ankle-a;d=v.length;e=v.normalized()
    l1=rig.data.bones[f'Thigh_{side}'].length;l2=rig.data.bones[f'Shin_{side}'].length
    if d>l1+l2+.001:raise ValueError(f'Overreach {side}: {d:.4f}m > {(l1+l2):.4f}m')
    d=min(d,l1+l2-1e-5);u=(l1*l1-l2*l2+d*d)/(2*d)
    pole=Vector((0,-1,0));forward=(pole-e*pole.dot(e)).normalized()
    knee=a+e*u+forward*math.sqrt(max(0,l1*l1-u*u))
    aim(rig,f'Thigh_{side}',a,knee);aim(rig,f'Shin_{side}',knee,ankle)
    b=rig.data.bones[f'Foot_{side}'];set_world(rig,f'Foot_{side}',ankle,Quaternion((1,0,0),pitch)@b.matrix_local.to_quaternion())


def foot_target(side,phase,shoe):
    sign=1 if side=='L' else -1
    if phase<STANCE:
        u=phase/STANCE;z=TRAVEL*(.5-u);lift=0
        # Heel touches first, rolls flat, then transfers naturally to the toe.
        pitch=math.radians(-8*(1-smooth(0,.17,u))+13*smooth(.72,1,u))
    else:
        u=(phase-STANCE)/(1-STANCE);z=TRAVEL*(smooth(0,1,u)-.5)
        lift=.071*math.sin(math.pi*u)**1.4
        pitch=math.radians(mix(13,-8,smooth(0,1,u))-3*math.sin(math.pi*u))
    q=Quaternion((1,0,0),pitch);rest=V(sign*.093,.09,0)
    # Evaluate the actual authored shoe ring, not a guessed foot radius.
    offset=-min((q@(p-rest)).z for p in shoe.verts)
    return V(sign*.093,offset+lift,z),pitch


def pose(rig,shoes,phase,walking):
    for pb in rig.pose.bones:pb.matrix_basis=Matrix.Identity(4)
    bpy.context.view_layer.update();ta=phase*math.tau;hips=rig.pose.bones['Hips']
    if walking:
        sway=.012*math.sin(ta);down=-.04-.014*math.cos(2*ta);yaw=.052*math.sin(ta);roll=.023*math.sin(ta+.55)
    else:
        sway=.008*math.sin(ta);down=-.007+.002*math.sin(2*ta);yaw=.016*math.sin(ta+.3);roll=.013*math.sin(ta+.5)
    rest=rig.data.bones['Hips'];p=rest.head_local+V(sway,down,0)
    set_world(rig,'Hips',p,Quaternion((0,0,1),yaw)@Quaternion((0,1,0),roll)@rest.matrix_local.to_quaternion())
    rotate_world(rig.pose.bones['Chest'],(0,0,1),-yaw*1.55)
    rotate_world(rig.pose.bones['Chest'],(1,0,0),(.031 if walking else .008)+.012*math.sin(2*ta+.6))
    rotate_world(rig.pose.bones['Head'],(0,0,1),yaw*.44+.01*math.sin(ta+.6))
    rotate_world(rig.pose.bones['Head'],(1,0,0),-.009+.012*math.sin(2*ta+1))
    for side,sign,shift in [('L',1,0),('R',-1,.5)]:
        ph=(phase+shift)%1
        ankle,pitch=foot_target(side,ph,shoes[side]) if walking else (V(sign*.093,.09,0),0)
        solve_leg(rig,side,ankle,pitch)
        swing=.32*math.cos(ph*math.tau-.16) if walking else .035*math.sin(ta+sign)
        rotate_world(rig.pose.bones[f'UpperArm_{side}'],(1,0,0),swing)
        rotate_world(rig.pose.bones[f'Forearm_{side}'],(1,0,0),-.075-.06*max(0,-swing))
        rotate_world(rig.pose.bones[f'Hand_{side}'],(0,0,1),.025*sign+.018*math.sin(ta+sign))


def make_action(rig,shoes,name,frames):
    rig.animation_data_create();act=bpy.data.actions.new(name);rig.animation_data.action=act
    prev={}
    for frame in range(frames+1):
        pose(rig,shoes,(frame%frames)/frames,name=='Walk')
        for pb in rig.pose.bones:
            q=pb.rotation_quaternion.copy()
            if pb.name in prev and q.dot(prev[pb.name])<0:q.negate()
            pb.rotation_quaternion=q;prev[pb.name]=q.copy()
            pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
            # Bone position tracks retain IK placement to sub-centimetre contact accuracy.
            pb.keyframe_insert('location',frame=frame,group=pb.name)
    # NLA tracks export separately and preserve the authored clip names.
    slot=rig.animation_data.action_slot;rig.animation_data.action=None
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,0,act);strip.action_slot=slot;track.mute=True
    return track


def previews(rig,tracks):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=860;scene.render.resolution_y=1060;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('PreviewWorld');scene.world.color=(.45,.47,.5)
    scene.view_settings.view_transform='AgX'
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.002));floor=bpy.context.object
    m=bpy.data.materials.new('PreviewWarmStone');m.diffuse_color=(.42,.37,.31,1);floor.data.materials.append(m)
    sun_data=bpy.data.lights.new('PreviewSun','SUN');sun_data.energy=2.3;sun_data.angle=.28;sun_data.color=(1,.9,.79)
    sun=bpy.data.objects.new('PreviewSun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(.49,-.61,-.5)
    data=bpy.data.cameras.new('PreviewCamera');camera=bpy.data.objects.new('PreviewCamera',data);scene.collection.objects.link(camera);scene.camera=camera
    camera.location=V(2.45,1.6,4.7);camera.rotation_euler=(V(0,.87,0)-camera.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO';data.ortho_scale=2.13
    for name,track,frame in [('idle',tracks[0],17),('walk-contact',tracks[1],0),('walk-swing',tracks[1],26)]:
        for t in tracks:t.mute=t!=track
        scene.frame_set(frame);scene.render.filepath=str(SRC/f'{name}-review.png');bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=FPS;scene.frame_start=0;scene.frame_end=IDLE_FRAMES
    root=bpy.data.objects.new('SoftHuman_Root',None);scene.collection.objects.link(root)
    root['units']='metres';root['height']=1.75;root['forward']='+Z';root['walkMetresPerSecond']=SPEED;root['shirtNode']='Human_Shirt'
    rig=make_rig(root);shoes=make_meshes(rig)
    tracks=[make_action(rig,shoes,'Idle',IDLE_FRAMES),make_action(rig,shoes,'Walk',WALK_FRAMES)]
    for pb in rig.pose.bones:pb.matrix_basis=Matrix.Identity(4)
    bpy.context.view_layer.update()
    raw=SRC/'soft-human-raw.glb';SRC.mkdir(parents=True,exist_ok=True);STATS.parent.mkdir(parents=True,exist_ok=True)
    options=dict(filepath=str(raw),export_format='GLB',export_yup=True,export_apply=False,export_vertex_color='ACTIVE',
        export_all_vertex_colors=True,export_active_vertex_color_when_no_material=True,export_normals=True,export_attributes=True,
        export_extras=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,
        export_optimize_animation_size=True,export_frame_range=False,export_cameras=False,export_lights=False,export_skins=True,
        export_morph=False)
    supported={p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    for t in tracks:t.mute=False
    bpy.ops.export_scene.gltf(**{k:v for k,v in options.items() if k in supported})
    for t in tracks:t.mute=True
    for pb in rig.pose.bones:pb.matrix_basis=Matrix.Identity(4)
    bpy.context.view_layer.update();bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'soft-human.blend'))
    STATS.write_text(json.dumps({'asset':'models/characters/soft-human.glb','units':'metres','heightMetres':1.75,'facadeFacing':'+Z',
      'shirtNode':'Human_Shirt','rootNode':'SoftHuman_Root','paletteHex':PALETTE,'clips':{'Idle':IDLE_FRAMES/FPS,'Walk':WALK_FRAMES/FPS},
      'walk':{'contactPhase':STANCE,'stanceTravelMetres':TRAVEL,'calibratedSpeedMetresPerSecond':SPEED,'strideSeconds':WALK_FRAMES/FPS},
      'source':'Original polygon meshes and analytic two-bone leg contacts; no textures or personal likeness.'},indent=2)+'\n')
    if '--no-preview' not in sys.argv:previews(rig,tracks)
    print('SOFT_HUMAN_EXPORTED',raw,raw.stat().st_size)

if __name__=='__main__':main()
