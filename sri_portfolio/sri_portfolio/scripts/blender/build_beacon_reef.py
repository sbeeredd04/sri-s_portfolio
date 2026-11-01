"""Original coastal reef: directional bedding, recessed joints and wave-cut ledges.
The tower sits on a level 1.75m-radius crown; the closed skirt is submerged.
"""
import bpy, math, sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from export_authored import export_scene
APP=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
outline=[(-8.7,-1),(-7.1,-3.7),(-3.8,-4.5),(-.5,-4.1),(3.2,-3.1),(7.1,-1.7),(9.7,.7),(6.8,2.2),(4.4,2.7),(1.8,3.8),(-2.6,4.1),(-6.3,2.5)]
# Wave-cut benches and a narrower crown replace the old single steep slope.
profile=[(1.02,-6.8),(1.02,-4.3),(.99,-3.6),(.95,-3.35),(.93,-2.85),(.95,-2.72),(.93,-2.56),(.82,-2.43),(.79,-1.65),(.73,-1.5),(.71,-.95),(.74,-.83),(.71,-.67),(.51,-.5),(.43,.35),(.29,.72),(.23,.9)]
N=144
vertices=[];faces=[];colors=[]
def plan(t):
 i=int(t)%len(outline);u=t%1;p=[outline[(i+j)%len(outline)] for j in (-1,0,1,2)]
 return [.5*((2*p[1][a])+(-p[0][a]+p[2][a])*u+(2*p[0][a]-5*p[1][a]+4*p[2][a]-p[3][a])*u*u+(-p[0][a]+3*p[1][a]-3*p[2][a]+p[3][a])*u*u*u) for a in (0,1)]
for ring,(scale,y) in enumerate(profile):
 for i in range(N):
  x,z=plan(i*len(outline)/N);angle=math.atan2(z,x)
  joint=max(0,math.cos(angle*11+.4))**14*.15
  inset=joint+.045*math.sin(angle*23)+.035*math.sin(angle*37+.6)
  exposure=max(0,min(1,(y+6.8)/2))*max(0,min(1,(.9-y)/1.2))
  localScale=scale+exposure*(.045*math.sin(angle*2+.8)+.025*math.cos(angle*5))
  x*=localScale;z*=localScale;r=math.hypot(x,z)
  if ring==len(profile)-1:x,z=1.75*math.cos(angle),1.75*math.sin(angle)
  else:x*=1-inset/max(1,r);z*=1-inset/max(1,r)
  height=y if ring in (0,len(profile)-1) else y+exposure*(.55*math.sin(angle+.7)+.25*math.sin(angle*2+.4)+.06*math.sin(angle*9))
  vertices.append((x,-z,height))
  dry=max(0,min(1,(height+3.8)/4.7));tint=.58+.37*dry-.12*joint
  colors.append((tint*.95,tint,tint*.99,1))
for j in range(len(profile)-1):
 for i in range(N):faces.append((j*N+i,(j+1)*N+i,(j+1)*N+(i+1)%N,j*N+(i+1)%N))
faces.append(tuple(reversed(range(N))))
faces.append(tuple((len(profile)-1)*N+i for i in range(N)))
mesh=bpy.data.meshes.new('reef_bedded_surface');mesh.from_pydata(vertices,[],faces);mesh.update()
o=bpy.data.objects.new('beacon_reef',mesh);bpy.context.collection.objects.link(o)
bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
for p in mesh.polygons:p.use_smooth=True
attribute=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(colors):attribute.data[i].color=c
mat=bpy.data.materials.new('reef_stone');mat.diffuse_color=(.42,.46,.44,1);mat.use_nodes=True
mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.96
mesh.materials.append(mat);o['soundProfile']='stone';o['surfaceRole']='offshore_reef'
# Runtime reuses shared metre-scaled granite textures, with no map copies.
manifest={'version':1,'id':'beacon-reef','source':'Original Sri portfolio contour and bedding study; scripts/blender/build_beacon_reef.py','license':'Project-owned original geometry','profile':'interactive','units':'metres','nodes':['beacon_reef'],'extras':{'beacon_reef':{'soundProfile':'stone','surfaceRole':'offshore_reef'}},'attributes':{'beacon_reef':['POSITION','NORMAL','COLOR_0']},'towerSupport':{'height':.9,'radius':1.75},'submergedBottom':-6.8}
masters=APP/'resources'/'authored'
bpy.ops.wm.save_as_mainfile(filepath=str(masters/'beacon-reef.blend'))
(masters/'beacon-reef.json').write_text(json.dumps(manifest,indent=2))
export_scene(APP/'public'/'models'/'beacon-reef.glb',manifest)
