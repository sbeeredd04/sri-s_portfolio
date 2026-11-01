"""Original coastal broadleaf: curved tapered limbs and folded lance leaves.
Deterministic authored recipe, metres, two explicit LOD roots, no image maps.
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from export_authored import export_scene
APP=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,color,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m
bark=mat('coastal_bark',(.24,.19,.12),.94)
leaf=mat('coastal_leaves',(.32,.44,.18),.62)
# Vertex colour carries small leaf-to-leaf hue variation, not baked lighting.
n=leaf.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='leaf_color';leaf.node_tree.links.new(n.outputs['Color'],leaf.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
leaf.use_backface_culling=False

def make_lod(lod):
 rng=random.Random(2189);verts=[];faces=[];leafverts=[];leaffaces=[];colors=[]
 def tube(points,radii,sides):
  base=len(verts)
  for i,p in enumerate(points):
   tangent=(points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized()
   side=tangent.cross(Vector((0,1,0))).normalized();up=tangent.cross(side)
   for j in range(sides):
    a=j*math.tau/sides;radius=radii[i]*(1+.09*math.sin(j*3+i*.7))
    verts.append(p+radius*(math.cos(a)*side+math.sin(a)*up))
  faces.append(tuple(base+j for j in reversed(range(sides))))
  for i in range(len(points)-1):
   for j in range(sides):
    a=base+i*sides+j;b=base+i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
  faces.append(tuple(base+(len(points)-1)*sides+j for j in range(sides)))
 def blade(p,d,length,width,tone):
  # Two sides of the central vein fold gently; tips curl down.
  d=d.normalized();side=d.cross(Vector((0,0,1))).normalized();up=side.cross(d).normalized()
  base=len(leafverts)
  if lod==0:
   coords=[(0,0,0),(.35,-.48,-.04),(.35,0,.055),(.35,.48,-.04),(.72,-.35,-.02),(.72,0,.04),(.72,.35,-.02),(1,0,-.09)]
   polygons=[(0,1,2),(0,2,3),(1,4,5,2),(2,5,6,3),(4,7,5),(5,7,6)]
  else:
   coords=[(0,0,0),(.45,-.5,0),(1,0,-.06),(.45,.5,0)];polygons=[(0,1,2),(0,2,3)]
  for u,v,h in coords:
   leafverts.append(p+d*(u*length)+side*(v*width)+up*(h*length))
   colors.append((tone*.64,tone*.85,tone*.39,1))
  leaffaces.extend([tuple(base+j for j in f) for f in polygons])
 trunk=[Vector(v) for v in [(0,0,0),(.035,-.015,.5),(-.045,.025,1.2),(.04,0,1.95),(.13,-.08,2.65),(.06,.02,3.3),(.12,.03,3.95)]]
 tube(trunk,[.16,.125,.105,.085,.062,.035,.007],9 if lod==0 else 6)
 for k in range(12):
  angle=k*2.399+.2+rng.uniform(-.16,.16);z=1.65+(k%4)*.37
  start=Vector((.03,0,z));radius=1.4+(k%3)*.15
  end=Vector((math.cos(angle)*radius,math.sin(angle)*radius,3.05+(k%4)*.25))
  middle=start.lerp(end,.55)+Vector((0,0,.12))
  tube([start,middle,end],[.055,.033,.009],7 if lod==0 else 5)
  for j in range(7):
   a=angle+(j-3)*.28+rng.uniform(-.1,.1)
   origin=middle.lerp(end,.25+(j%3)*.23)
   reach=1.05+.8*rng.random()
   tip=Vector((math.cos(a)*reach,math.sin(a)*reach,2.7+(k%4)*.33+j*.08+rng.uniform(-.25,.25)))
   shoot=tip-origin
   tube([origin,origin.lerp(tip,.5)+Vector((0,0,.09)),tip],[.012,.007,.0015],5 if lod==0 else 3)
   for q in range(16):
    t=.12+q*.055;p=origin.lerp(tip,t)+Vector((0,0,math.sin(t*math.pi)*.09))
    side=-1 if q%2 else 1
    bearing=a+side*.9+rng.uniform(-.45,.45)
    direction=Vector((math.cos(bearing),math.sin(bearing),rng.uniform(-.45,.85)))
    length=.24+rng.random()*.15; width=length*(.3+rng.random()*.13);tone=.23+rng.random()*.16
    if lod==0 or q%2==0:blade(p,direction,length*(1 if lod==0 else 1.32),width*(1 if lod==0 else 1.4),tone)
 # Fill the crown's central leader with smaller ascending sprays.
 for k in range(8):
  a=k*2.399;origin=Vector((.09,0,2.8+k*.12));tip=Vector((math.cos(a)*.9,math.sin(a)*.9,3.8+k*.09))
  tube([origin,origin.lerp(tip,.5),tip],[.018,.008,.001],5 if lod==0 else 3)
  for q in range(18):
   t=.15+q*.046; p=origin.lerp(tip,t);side=-1 if q%2 else 1
   d=Vector((math.cos(a+side*.95),math.sin(a+side*.95),.3))
   length=.27+rng.random()*.1;tone=.24+rng.random()*.13
   if lod==0 or q%2==0:blade(p,d,length*(1 if lod==0 else 1.32),length*.38*(1 if lod==0 else 1.4),tone)
 root=bpy.data.objects.new(f'coastal_tree_LOD{lod}',None);bpy.context.collection.objects.link(root)
 for name,v,f,material in [('branches',verts,faces,bark),('foliage',leafverts,leaffaces,leaf)]:
  mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.materials.append(material);mesh.update()
  obj=bpy.data.objects.new(f'{name}_{lod}',mesh);bpy.context.collection.objects.link(obj);obj.parent=root
  for poly in mesh.polygons:poly.use_smooth=True
  if name=='foliage':
   attr=mesh.color_attributes.new(name='leaf_color',type='FLOAT_COLOR',domain='POINT')
   for i,color in enumerate(colors):attr.data[i].color=color
  obj['windResponse']='height_weighted_shared_gust'
 return root
make_lod(0);make_lod(1)
manifest={'version':1,'id':'coastal-tree','source':'Original geometry: scripts/blender/build_coastal_tree.py','license':'Project-owned original geometry','profile':'vegetation','units':'metres','nodes':['coastal_tree_LOD0','coastal_tree_LOD1'],'purpose':'Coastal garden canopy; tapered branching and folded leaves','lod':'LOD1 retains alternate leaves enlarged to preserve crown coverage; no alpha cards'}
masters=APP/'resources'/'authored';bpy.ops.wm.save_as_mainfile(filepath=str(masters/'coastal-tree.blend'));(masters/'coastal-tree.json').write_text(json.dumps(manifest,indent=2));export_scene(APP/'public'/'models'/'coastal-tree.glb',manifest)
