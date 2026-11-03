"""A separate landscape revision; never saves or edits Sri's original .blend.
Exports changed static meshes only; JS merges them into the official WEB file,
keeping every animated hierarchy and its 22 original clips byte-equivalent.
"""
import bpy, bmesh, json, math, random, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import delaunay_2d_cdt
APP=Path(__file__).resolve().parents[2]
OUT=APP/'asset-src/authored/out-there/refinement';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=APP/'asset-src/authored/out-there/poly_dome11.blend'
SOURCE_SHA=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert SOURCE_SHA=='6cdc050a69edf314711dab05980bba81bb2dca26143d4ebe46e81c2e5ac2090c'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE),load_ui=False);bpy.context.scene.frame_set(1)
rng=random.Random(61102)
def metre(v):return Vector((v[0]/1.56,(v[2]+6)/1.56,-v[1]/1.56))
def source(v):return (v[0]*1.56,-v[2]*1.56,v[1]*1.56-6)
def point(o,v):return metre(o.matrix_world@v.co)
def inside(x,z,poly):
 c=False
 for i,(a,b) in enumerate(poly):
  u,v=poly[(i+1)%len(poly)]
  if (b>z)!=(v>z) and x<(u-a)*(z-b)/(v-b)+a:c=not c
 return c
def nearest(x,z,poly):
 best=None
 for i,(a,b) in enumerate(poly):
  u,v=poly[(i+1)%len(poly)];dx=u-a;dz=v-b;t=max(0,min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz)))
  px=a+dx*t;pz=b+dz*t;d=math.hypot(x-px,z-pz)
  if best is None or d<best[0]:best=(d,px,pz,i)
 return best
terrain=bpy.data.objects['terrain'];tv=[point(terrain,v) for v in terrain.data.vertices]
tree=BVHTree.FromPolygons(tv,[list(p.vertices) for p in terrain.data.polygons],all_triangles=False)
def oldheight(x,z):
 p,n,i,d=tree.ray_cast(Vector((x,100,z)),Vector((0,-1,0)))
 return p.y if p else 3.8
# A deliberately asymmetric shoreline: west cove, north granite head, east
# bridge headland, generous southeast meadow, and a recessed southwest bay.
COAST=[(-46,23),(-43,7),(-40,-9),(-32,-31),(-19,-45),(0,-48),(17,-44),(31,-46),(40,-35),(43,-18),(48,1),(55,20),(65,33),(66,43),(57,49),(44,57),(24,62),(7,59),(-9,55),(-23,46),(-39,39)]
# Exact source water boundary (preserved IDs), then enlarge only southwest:
po=bpy.data.objects['pool'];pm=po.data;counts={}
for p in pm.polygons:
 ids=list(p.vertices)
 for a,b in zip(ids,ids[1:]+ids[:1]):e=tuple(sorted((a,b)));counts[e]=counts.get(e,0)+1
adj={}
for (a,b),count in counts.items():
 if count==1:adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
first=min(adj);ordered=[first];previous=None;current=first
while True:
 nxt=next((n for n in adj[current] if n!=previous),None)
 if nxt is None or nxt==first:break
 ordered.append(nxt);previous,current=current,nxt
assert len(ordered)>=40
source_shore=[point(po,pm.vertices[i]) for i in ordered]
LAKE=[]
for v in source_shore:
 w=max(0,min(1,(v.z-14)/13.4));w=w*w*(3-2*w)
 west=max(0,min(1,(4.5-v.x)/31.2))
 LAKE.append((v.x-10.8*w*west,v.z+8.2*w))
# Ensure consistent CCW in the x,z plane.
def signed_area(poly):return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(poly,poly[1:]+poly[:1]))/2
if signed_area(LAKE)<0:LAKE.reverse()
if signed_area(COAST)<0:COAST.reverse()
WATER=3.89
# Original interior remains at its original elevation. Only a narrow coastal
# apron lowers to sea; the enlarged basin is physically excavated below water.
def landscape(x,z):
 h=oldheight(x,z);d=nearest(x,z,COAST)[0]
 if not inside(x,z,COAST):return -.45
 if d<4.5:
  t=d/4.5;t=t*t*(3-2*t);h=-.25+(h+.25)*t
 dl=nearest(x,z,LAKE)[0]
 if inside(x,z,LAKE):h=min(h,WATER-.13-min(dl*.28,1.9))
 elif dl<1.4:
  t=dl/1.4;t=t*t*(3-2*t);h=(WATER+.035)*(1-t)+max(h,WATER+.04)*t
 return h
# Keep source palette convention: data are linear vertex colours and PT_Flat.
flat=bpy.data.materials.get('PT_Flat')
if not flat:
 flat=bpy.data.materials.new('PT_Flat');flat.diffuse_color=(1,1,1,1)
changed=[]
def mesh(name,vertices,faces,colors,material=None):
 m=bpy.data.meshes.new(name+'_mesh');m.from_pydata([source(v) for v in vertices],[],faces);m.update()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(material or flat)
 ca=m.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
 for p in m.polygons:
  col=colors[p.index] if isinstance(colors,list) else colors
  for li in p.loop_indices:ca.data[li].color=(*col[:3],1)
 m.color_attributes.active_color=ca;m.color_attributes.render_color_index=0;changed.append(o);return o
# Preserve non-paving parts using original connected topology, never approximate
# glTF index ranges after meshopt reordering.
def parts(o):
 m=o.data;parent=list(range(len(m.vertices)))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for p in m.polygons:
  a=find(p.vertices[0])
  for v in p.vertices[1:]:parent[find(v)]=a
 gs={}
 for p in m.polygons:gs.setdefault(find(p.vertices[0]),[]).append(p)
 return list(gs.values())
component_audit={};removed_faces={}
for name in ['bridges_paths_p8','dock_boats','lake_rocks']:
 o=bpy.data.objects[name];groups=parts(o);reject=[];audit=[]
 for ps in groups:
  first=min(p.index for p in ps);vs=[point(o,o.data.vertices[v]) for p in ps for v in p.vertices]
  lo=[min(v[k] for v in vs) for k in range(3)];hi=[max(v[k] for v in vs) for k in range(3)]
  # Source east arch and its gate are superseded by the world bridge at the
  # certified ENTRY. These complete connected components are spatially
  # isolated from the retained upper timber bridge; never trim arbitrary faces.
  obsolete_east_arch = name=='bridges_paths_p8' and (2868<=first<2904 or 3134<=first<4726)
  if obsolete_east_arch:
   assert lo[0]>58 and 38<lo[2]<51 and hi[0]<96 and hi[2]<52, 'East arch component provenance changed'
  # Four source hikers consist of complete connected limb/head/backpack parts.
  # Runtime replaces their exact foot anchors with the shared adult rig.
  source_hiker = name=='dock_boats' and (7358<=first<8034 or 8234<=first<8910)
  if source_hiker:
   assert len(ps) in [6,10,20,80], 'Unexpected hiker component topology'
   assert hi[1]<6.9 and lo[1]>4.5 and max(hi[0]-lo[0],hi[2]-lo[2])<1, 'Hiker component bounds changed'
  remove=source_hiker or (name=='bridges_paths_p8' and (first<2724 or obsolete_east_arch)) or (name=='dock_boats' and (516<=first<7276 or 8910<=first<11814 or 11922<=first<12082 or (first>=12328 and hi[1]<5 and inside((lo[0]+hi[0])/2,(lo[2]+hi[2])/2,LAKE)))) or (name=='lake_rocks' and hi[1]<12)
  audit.append({'firstFace':first,'faces':len(ps),'boundsMetres':[lo,hi],'removed':remove})
  if remove:reject.extend(p.index for p in ps)
 component_audit[name]=audit;removed_faces[name]=len(reject)
 bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[bm.faces[i] for i in reject],context='FACES');bm.to_mesh(o.data);bm.free();changed.append(o)
# Terrain triangulation uses irregular interior sample points plus exact shore
# boundary constraints. No concentric columns or stack of discs is generated.
points=[];constraints=[]
def add_loop(loop,spacing):
 ids=[]
 for a,b in zip(loop,loop[1:]+loop[:1]):
  n=max(1,math.ceil(math.dist(a,b)/spacing))
  for j in range(n):ids.append(len(points));points.append((a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n))
 constraints.extend(zip(ids,ids[1:]+ids[:1]));return ids
outer=add_loop(COAST,2.3);lake_ids=add_loop(LAKE,.8)
# Exact root-contact neighbourhoods prevent coarse re-triangulation from
# lowering the ground beneath retained trunks.
for o in bpy.data.objects:
 if o.type!='MESH' or not o.name.startswith(('redwood','pine')):continue
 vs=[point(o,v) for v in o.data.vertices];lo=min(v.y for v in vs);roots=[v for v in vs if v.y<lo+.3];x=sum(v.x for v in roots)/len(roots);z=sum(v.z for v in roots)/len(roots)
 if inside(x,z,COAST) and not inside(x,z,LAKE) and abs(landscape(x,z)-oldheight(x,z))<.2:
  points.append((x,z))
  for v in roots:points.append((v.x,v.z))
  for j in range(8):points.append((x+.7*math.cos(j*math.pi/4),z+.7*math.sin(j*math.pi/4)))
for x in range(-46,67,2):
 for z in range(-48,63,2):
  xx=x+rng.uniform(-.52,.52);zz=z+rng.uniform(-.52,.52)
  if inside(xx,zz,COAST) and nearest(xx,zz,COAST)[0]>.65 and nearest(xx,zz,LAKE)[0]>.55:points.append((xx,zz))
res=delaunay_2d_cdt([Vector(p) for p in points],list(constraints),[outer],1,1e-5)
verts=[(v.x,landscape(v.x,v.y),v.y) for v in res[0]];faces=[tuple(reversed(f)) for f in res[2]]
cols=[]
for f in faces:
 x=sum(verts[i][0] for i in f)/len(f);z=sum(verts[i][2] for i in f)/len(f);y=sum(verts[i][1] for i in f)/len(f)
 shore=nearest(x,z,COAST)[0];lake=nearest(x,z,LAKE)[0]
 if inside(x,z,LAKE):c=(.22,.29,.22)
 elif shore<2.2:c=(.34,.34,.27) if z<0 or x>50 else (.30,.32,.19)
 elif lake<1.4:c=(.43,.43,.32)
 else:c=(.19,.245,.085)
 v=rng.uniform(.96,1.04);cols.append(tuple(a*v for a in c))
old=terrain;old.name='original_terrain';mesh('terrain',verts,faces,cols)
# Level open water triangulated from the actual expanded shore; stable normals.
res=delaunay_2d_cdt([Vector(v) for v in LAKE],[(i,(i+1)%len(LAKE)) for i in range(len(LAKE))],[list(range(len(LAKE)))],1,1e-6)
po.name='original_pool';lake_mat=bpy.data.materials.get('PT_LakeWater')
water=mesh('pool',[(v.x,WATER,v.y) for v in res[0]],[tuple(reversed(f)) for f in res[2]],(.065,.43,.39),lake_mat)
for p in water.data.polygons:p.use_smooth=True
# Paths: same official graph, gentle curves through explicit hook coordinates.
# The expanded southwest shore moves only submerged lakeshore nodes outward.
hooks=json.loads((APP/'asset-src/reference/world-pack/models/out-there/glb/poly_dome11_hooks.json').read_text())
nodes={k:list(metre(v['blender'])) for k,v in hooks['path_nodes'].items()};adjusted={}
def shore_clear(x,z,margin=1.7):
 d,px,pz,i=nearest(x,z,LAKE)
 if inside(x,z,LAKE) or d<margin:
  a=LAKE[i];b=LAKE[(i+1)%len(LAKE)];dx=b[0]-a[0];dz=b[1]-a[1];l=math.hypot(dx,dz)
  return px+dz/l*margin,pz-dx/l*margin
 return x,z
for key in ['L1','L2','BRIDGE','L3','J4']:
 p=nodes[key];x,z=shore_clear(p[0],p[2]);y=max(landscape(x,z)+.07,p[1]);nodes[key]=[x,y,z]
 if math.dist(nodes[key],p)>.05:adjusted[key]={'original':p,'refined':nodes[key]}
chains=[['ENTRY','J1','T1','T2','T3','J2','S1','S2','S3','S4','S5','TARN_VIEW','J5','J3'],['J1','L1','L2','BRIDGE','L3','J4','W1','W2','W2B','W2C','W3','FB_W'],['ENTRY','E1','EAST_HEAD']]
context={}
for chain in chains:
 for i in range(len(chain)-1):context[(chain[i],chain[i+1])]=(nodes[chain[max(0,i-1)]],nodes[chain[min(len(chain)-1,i+2)]])
def cat(p0,p1,p2,p3,t):
 # Horizontal easing remains gentle at switchback turns; vertical tangent
 # cannot spike when incoming/outgoing horizontal directions nearly cancel.
 m1=[(p2[k]-p0[k])*.26 for k in range(3)];m2=[(p3[k]-p1[k])*.26 for k in range(3)]
 for m in [m1,m2]:
  limit=math.hypot(m[0],m[2])*.34;m[1]=max(-limit,min(limit,m[1]))
 return [(2*t**3-3*t*t+1)*p1[k]+(t**3-2*t*t+t)*m1[k]+(-2*t**3+3*t*t)*p2[k]+(t**3-t*t)*m2[k] for k in range(3)]
path_profiles=[];path_verts=[];path_faces=[];path_colors=[];all_path_points=[]
def ribbon(a,b,kind,pts,width=2):
 base=len(path_verts);record=[]
 for i,p in enumerate(pts):
  prev=pts[max(0,i-1)];nxt=pts[min(len(pts)-1,i+1)];dx=nxt[0]-prev[0];dz=nxt[2]-prev[2];l=max(.0001,math.hypot(dx,dz));nx=-dz/l;nz=dx/l
  ground=[landscape(p[0]+nx*w,p[2]+nz*w) for w in [-width/2,0,width/2]]
  y=p[1]
  # Real soil shoulders blend flush into the terrain, no vertical tread slabs.
  widths=[-width/2-.24,-width/2,0,width/2,width/2+.24]
  for j,w in enumerate(widths):
   x=p[0]+nx*w;z=p[2]+nz*w
   yy=(y-.035 if j in [0,4] else y+(.012 if j==2 else 0))
   path_verts.append((x,yy,z))
  record.append({'position':[p[0],y+.012,p[2]],'halfWidth':width/2,'normalXZ':[nx,nz]});all_path_points.append([p[0],y,p[2],width/2+.25])
  if i:
   for j in range(4):
    v=base+i*5+j;path_faces.extend([(v-5,v,v-4),(v-4,v,v+1)])
    c=(.43,.335,.20) if j in [1,2] else (.31,.30,.16)
    # restrained directional variation, no checkerboard tread pattern
    variation=.99+.018*math.sin(i*.19);path_colors.extend([tuple(q*variation for q in c)]*2)
 path_profiles.append({'id':a+'__'+b,'from':a,'to':b,'kind':kind,'points':record,'builtContinuous':True,'usable':False,'status':'awaiting_exported_clearance'})
for a,b,kind in hooks['path_edges']:
 if kind in ['arch bridge','footbridge','stair','terrace']:continue
 p=nodes[a];q=nodes[b];before,after=context.get((a,b),(p,q));N=math.ceil(math.dist(p,q)/.22);pts=[]
 if (a,b)==('L2','BRIDGE'):
  # Follow the enlarged lake's actual southwest boundary instead of
  # repeatedly projecting a chord onto it (which creates folded ribbons).
  ia=nearest(p[0],p[2],LAKE)[3];ib=nearest(q[0],q[2],LAKE)[3]
  options=[]
  for step in [1,-1]:
   chain=[];j=ia
   while True:
    chain.append(j)
    if j==ib:break
    j=(j+step)%len(LAKE)
   length=sum(math.dist(LAKE[u],LAKE[v]) for u,v in zip(chain,chain[1:]));options.append((length,chain))
  chain=min(options)[1];route=[p]
  for j in chain[1:-1]:
   v=LAKE[j];prev=LAKE[(j-1)%len(LAKE)];nxt=LAKE[(j+1)%len(LAKE)];dx=nxt[0]-prev[0];dz=nxt[1]-prev[1];ll=math.hypot(dx,dz)
   route.append([v[0]+dz/ll*1.85,0,v[1]-dx/ll*1.85])
  route.append(q);lengths=[0]
  for aa,bb in zip(route,route[1:]):lengths.append(lengths[-1]+math.hypot(bb[0]-aa[0],bb[2]-aa[2]))
  for i,v in enumerate(route):v[1]=p[1]+(q[1]-p[1])*lengths[i]/lengths[-1]
  dense=[route[0]]
  for aa,bb in zip(route,route[1:]):
   nn=math.ceil(math.dist(aa,bb)/.2);dense.extend([[aa[k]+(bb[k]-aa[k])*j/nn for k in range(3)] for j in range(1,nn+1)])
  ribbon(a,b,kind,dense);continue
 for i in range(N+1):
  t=i/N;v=cat(before,p,q,after,t)
  if kind in ['lakeshore','dock path'] and b!='DOCK':v[0],v[2]=shore_clear(v[0],v[2],1.7)
  pts.append(v)
 # Adaptive length subdivision also catches the changed lakeshore tangents.
 dense=[pts[0]]
 for aa,bb in zip(pts,pts[1:]):
  nn=max(1,math.ceil(math.dist(aa,bb)/.22))
  dense.extend([[aa[k]+(bb[k]-aa[k])*j/nn for k in range(3)] for j in range(1,nn+1)])
 ribbon(a,b,kind,dense)
# Camp path is a continuous solid earth embankment, supported down to 3.68m.
p=[29.7296206414,4.34,31.3811197874];q=nodes['T1'];q[1]=4.66267131077
N=math.ceil(math.dist(p,q)/.2);camppts=[[p[k]+(q[k]-p[k])*i/N for k in range(3)] for i in range(N+1)]
ribbon('CAMP','T1','camp connector',camppts,1.2)
# Small continuous junction fans close miter corners and quantized endpoint
# seams; these are soil surface triangles, not separate raised pads.
junctions={}
for profile in path_profiles:
 for key,p in [(profile['from'],profile['points'][0]),(profile['to'],profile['points'][-1])]:
  if key not in junctions or p['position'][1]>junctions[key]['position'][1]:junctions[key]=p
for key,p in junctions.items():
 x,y,z=p['position'];r=p['halfWidth']+.035;base=len(path_verts);path_verts.append((x,y+.002,z))
 for j in range(24):
  xx=x+r*math.cos(j*math.tau/24);zz=z+r*math.sin(j*math.tau/24);best=(1e9,y)
  for prof in path_profiles:
   if key not in (prof['from'],prof['to']):continue
   samples=prof['points']
   for aa,bb in zip(samples,samples[1:]):
    aa=aa['position'];bb=bb['position'];dx=bb[0]-aa[0];dz=bb[2]-aa[2];ll=dx*dx+dz*dz
    if ll<1e-10:continue
    t=max(0,min(1,((xx-aa[0])*dx+(zz-aa[2])*dz)/ll));dd=math.hypot(xx-aa[0]-dx*t,zz-aa[2]-dz*t)
    if dd<best[0]:best=(dd,aa[1]+(bb[1]-aa[1])*t)
  path_verts.append((xx,best[1]+.002,zz))
 for j in range(24):path_faces.append((base,base+1+j,base+1+(j+1)%24));path_colors.append((.43,.335,.20))
mesh('trail_continuous',path_verts,[tuple(reversed(f)) for f in path_faces],path_colors)
# Cut/fill a continuous narrow soil bench into the terrain under each path.
# This keeps the route grade smooth instead of draping it over cliff triangles.
# The wider apron blends back to original land and is one terrain mesh.
path_grid={}
for p in all_path_points:
 for gx in range(math.floor((p[0]-3)/3),math.floor((p[0]+3)/3)+1):
  for gz in range(math.floor((p[2]-3)/3),math.floor((p[2]+3)/3)+1):path_grid.setdefault((gx,gz),[]).append(p)
protected_roots=[]
for obj in bpy.data.objects:
 if obj.type!='MESH' or not obj.name.startswith(('redwood','pine')) or obj.name in ['pine39','pine1','pine4','pine63','pine_c4']:continue
 vs=[point(obj,v) for v in obj.data.vertices];low=min(v.y for v in vs);rs=[v for v in vs if v.y<low+.3];xx=sum(v.x for v in rs)/len(rs);zz=sum(v.z for v in rs)/len(rs)
 if inside(xx,zz,COAST) and not inside(xx,zz,LAKE) and abs(landscape(xx,zz)-oldheight(xx,zz))<.2:
  rad=max(math.hypot(v.x-xx,v.z-zz) for v in rs)+.08;protected_roots.append((xx,zz,rad))
def benchheight(x,z,old):
 for rx,rz,rr in protected_roots:
  if math.hypot(x-rx,z-rz)<rr:return old
 best=None
 for p in path_grid.get((math.floor(x/3),math.floor(z/3)),[]):
  d=math.hypot(x-p[0],z-p[2])
  if best is None or d<best[0]:best=(d,p)
 if best is None or best[0]>2.8:return old
 d,p=best;flat=p[3]-.15
 if d<=flat:return p[1]-.035
 t=min(1,(d-flat)/(2.8-flat));t=t*t*(3-2*t);return (p[1]-.035)*(1-t)+old*t
# Re-triangulate with actual route edges, so the fill/cut surface cannot
# interpolate across the trail and leave it floating or buried.
for prof in path_profiles:
 samples=prof['points'];previous=None
 for i,p in enumerate(samples):
  if i%3 and i!=len(samples)-1:continue
  x,y,z=p['position'];nx,nz=p['normalXZ'];ids=[]
  for w in [-p['halfWidth']-.12,0,p['halfWidth']+.12]:
   xx=x+nx*w;zz=z+nz*w
   if inside(xx,zz,COAST):ids.append(len(points));points.append((xx,zz))
  if previous and len(ids)==3 and len(previous)==3:
   constraints.extend([(previous[0],ids[0]),(previous[2],ids[2])])
  previous=ids
res=delaunay_2d_cdt([Vector(p) for p in points],list(constraints),[outer],1,1e-5)
terrain_vertices=[(v.x,benchheight(v.x,v.y,landscape(v.x,v.y)),v.y) for v in res[0]]
terrain_faces=[tuple(reversed(f)) for f in res[2]];terrain_colors=[]
for f in terrain_faces:
 x=sum(terrain_vertices[i][0] for i in f)/len(f);z=sum(terrain_vertices[i][2] for i in f)/len(f)
 if inside(x,z,LAKE):c=(.22,.29,.22)
 elif nearest(x,z,LAKE)[0]<1.4:c=(.43,.43,.32)
 elif nearest(x,z,COAST)[0]<2.2:c=(.34,.34,.27) if z<0 or x>50 else (.30,.32,.19)
 else:c=(.19,.245,.085)
 terrain_colors.append(tuple(a*rng.uniform(.98,1.02) for a in c))
oldterrain=bpy.data.objects['terrain'];changed.remove(oldterrain);bpy.data.objects.remove(oldterrain,do_unlink=True)
mesh('terrain',terrain_vertices,terrain_faces,terrain_colors)

# Ground the camp connector, with no floating deck. Contact with old terrain
# below deck is intentional fill; obsolete paving has been removed above.
cv=[];cf=[]
for i,p in enumerate(camppts):
 dx=q[0]-camppts[0][0];dz=q[2]-camppts[0][2];l=math.hypot(dx,dz);nx=-dz/l;nz=dx/l
 for w,y in [(-.6,p[1]-.005),(.6,p[1]-.005),(-.85,3.68),(.85,3.68)]:cv.append((p[0]+nx*w,y,p[2]+nz*w))
 if i:
  v=i*4;cf.extend([(v-4,v-2,v+2,v),(v-3,v+1,v+3,v-1),(v-2,v-1,v+3,v+2)])
mesh('trail_camp_embankment',cv,cf,(.28,.25,.15))
# Keep only the shore-attached western outcrop. The former two broad
# aprons at the impact and east basin covered open water and made the
# waterfall appear to land on a boulder; the liquid basin stays unobstructed.
for index,(cx,cz,rx,rz,peak) in enumerate([(-18.7,7.2,5.8,2.1,.8)]):
 vv=[];rings=3;nn=13
 for ring in range(rings):
  r=[1,.68,.20][ring]
  for j in range(nn):
   a=j*math.tau/nn;irreg=1+.10*math.sin(j*2.7+index);x=cx+rx*math.cos(a)*r*irreg;z=cz+rz*math.sin(a)*r*irreg
   y=landscape(x,z)-.18 if ring==0 else max(WATER-.05,landscape(x,z)) + peak*([0,.42,.88][ring])*(.8+.2*math.sin(a+index))
   vv.append((x,y,z))
 ff=[]
 for ring in range(2):
  for j in range(nn):a=ring*nn+j;b=ring*nn+(j+1)%nn;c=(ring+1)*nn+j;d=(ring+1)*nn+(j+1)%nn;ff.extend([(a,c,b),(b,c,d)])
 ff.append(tuple(reversed(list(range(nn*2,nn*3)))))
 mesh('lake_granite_apron_'+str(index),vv,ff,[tuple(v*rng.uniform(.97,1.03) for v in (.43,.43,.37)) for _ in ff])
# Remove soft-plant geometry inside excavated water, path width and camp. Keep
# whole leaves/plants (connected parts); never leave sliced floating triangles.
plant_removed={}
for name in ['ferns','coast_shrubs','coast_flowers']:
 o=bpy.data.objects.get(name)
 if not o:continue
 reject=[]
 for ps in parts(o):
  ids=set(v for p in ps for v in p.vertices);vs=[point(o,o.data.vertices[v]) for v in ids];x=sum(v.x for v in vs)/len(vs);z=sum(v.z for v in vs)/len(vs);low=min(v.y for v in vs)
  clear=(not inside(x,z,COAST) or inside(x,z,LAKE) or math.hypot(x-32,z-34)<4.0 or any(math.hypot(x-p[0],z-p[2])<p[3]+.2 and abs(low-p[1])<1.5 for p in all_path_points))
  if clear:reject.extend(p.index for p in ps)
 bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[bm.faces[i] for i in reject],context='FACES');bm.to_mesh(o.data);bm.free();changed.append(o);plant_removed[name]=len(reject)
# The source fern sheets are deliberately simplified only after local
# clearing; retained palettes and leaf clusters survive the exported LOD.
o=bpy.data.objects.get('ferns')
if o and len(o.data.polygons)>10000:
 bpy.context.view_layer.objects.active=o
 modifier=o.modifiers.new('refined_fern_web_lod','DECIMATE');modifier.ratio=.45
 bpy.ops.object.modifier_apply(modifier=modifier.name)

# Determine exact whole tree nodes outside the compact land or newly excavated
# basin. Unmoved remaining trees use original contact elevation; report drift.
trees_remove=[];tree_contacts=[]
for o in bpy.data.objects:
 if o.type!='MESH' or not o.name.startswith(('redwood','pine')):continue
 vs=[point(o,v) for v in o.data.vertices];low=min(v.y for v in vs);roots=[v for v in vs if v.y<low+.3];x=sum(v.x for v in roots)/len(roots);z=sum(v.z for v in roots)/len(roots)
 changed_ground=landscape(x,z)-oldheight(x,z)
 remove=not inside(x,z,COAST) or inside(x,z,LAKE) or abs(changed_ground)>.2 or o.name in ['pine39','pine1','pine4','pine63','pine_c4']
 if remove:trees_remove.append(o.name)
 else:tree_contacts.append({'node':o.name,'root':[x,low,z],'ground':landscape(x,z),'sourceGround':oldheight(x,z),'groundChange':changed_ground})
# Purpose-built 3.9m open chine skiffs. A genuine outer/inner hull shell,
# tapered ends, continuous raised gunwales, and seated-height thwart benches.
boat_anchors=[]
for bi,(cx,cz,yaw) in enumerate([(-14.7,17.4,-.42),(-24.0,27.3,.61)]):
 vv=[];ff=[];cc=[];sections=19;length=3.9;beam=1.3
 def addface(face,col):ff.append(tuple(face));cc.append(col)
 for inner in [False,True]:
  for i in range(sections):
   t=i/(sections-1);u=(t-.5)*length;shape=math.sin(math.pi*t)**.65;w=.045+(.65-.045)*shape
   sheer=.36+.17*(abs(t-.5)*2)**2;keel=-.23+.36*(abs(t-.5)*2)**3
   for x,y in [(-w,sheer),(-w*.77,keel+.17),(0,keel),(w*.77,keel+.17),(w,sheer)]:
    if inner:x*=max(0,1-.055/max(w,.06));y+=.055 if abs(x)<w*.9 else -.012
    vv.append((x,y,u))
 offset=sections*5
 for inner in [False,True]:
  off=offset if inner else 0
  for i in range(sections-1):
   for j in range(4):
    a=off+i*5+j;b=a+5;face=[a,b,b+1,a+1]
    if inner:face.reverse()
    col=(.31+.012*(j%2),.16+.008*(i%3),.058) if not inner else (.44,.28,.13)
    addface(face,col)
 for j in [0,4]:
  for i in range(sections-1):a=i*5+j;b=a+5;addface([a,a+offset,b+offset,b],(.22,.12,.045))
 for end in [0,sections-1]:
  for j in range(4):a=end*5+j;addface([a,a+1,a+1+offset,a+offset],(.25,.135,.055))
 # Fitted dry bilge boards sit above the exterior water plane. The hull
 # retains its submerged keel; the lake cannot show through the open cockpit.
 floorbase=len(vv)
 for i in range(sections):
  t=i/(sections-1);u=(t-.5)*length;w=(.045+.605*math.sin(math.pi*t)**.65)*.85;y=.075+.16*(abs(t-.5)*2)**4
  for x in [-w,-w/3,w/3,w]:vv.append((x,y,u))
 for i in range(sections-1):
  for j in range(3):
   a=floorbase+i*4+j;b=a+4;addface([a,b,b+1,a+1],[(.39,.245,.105),(.43,.28,.13),(.405,.255,.11)][j])
 # Three seat/thwart boards with visible thickness; no cap across the opening.
 for u in [-.98,.05,1.03]:
  t=u/length+.5;w=(.045+.605*math.sin(math.pi*t)**.65)*.85;y=.28;d=.23;base=len(vv)
  vv.extend([(-w,y-.045,u-d/2),(w,y-.045,u-d/2),(w,y-.045,u+d/2),(-w,y-.045,u+d/2),(-w,y,u-d/2),(w,y,u-d/2),(w,y,u+d/2),(-w,y,u+d/2)])
  for face in [(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)]:addface([base+j for j in face],(.48,.31,.15))
 # Build a local rigid pivot at the water plane for runtime bob and wakes.
 world=[];co=math.cos(yaw);si=math.sin(yaw)
 for x,y,z in vv:world.append((cx+x*co+z*si,WATER+y,cz-x*si+z*co))
 name='lake_skiff_'+str(bi+1);o=mesh(name,world,ff,cc)
 pivot=Vector(source((cx,WATER,cz)))
 for v in o.data.vertices:v.co-=pivot
 o.location=pivot
 boat_anchors.append({'node':name,'position':[cx,WATER,cz],'yaw':yaw,'length':length,'beam':beam,'keelBelowWater':.23,'sheerAboveWater':[.36,.53]})

# Keep the continuous granite mass and summit support. Remove disconnected
# slabs from the fall face so its silhouette reads as one rock formation.
original_rock = bpy.data.objects['rock']
rock_groups = parts(original_rock)
mass = max(rock_groups, key=len)
rock_faces = list(mass)
for group in rock_groups:
 if group is not mass and min(point(original_rock, original_rock.data.vertices[j]).y
                              for face in group for j in face.vertices) > 19:
  rock_faces.extend(group)
rock_vertices = [tuple(point(original_rock, v)) for v in original_rock.data.vertices]
rock_indices = [tuple(face.vertices) for face in rock_faces]
# Replace the front's inherited long skinny triangles with a deliberate
# constrained face layout. The seam uses original boundary vertices, so this
# remains the same connected formation and the summit/back are untouched.
selected=[];retained=[]
for f in rock_indices:
 vv=[rock_vertices[j] for j in f]
 (selected if min(v[2] for v in vv)>1.8 and max(v[1] for v in vv)<19.1 else retained).append(f)
edge_counts={}
for f in selected:
 for aa,bb in zip(f,f[1:]+f[:1]):
  k=tuple(sorted((aa,bb)));edge_counts[k]=edge_counts.get(k,0)+1
adj={}
for (aa,bb),count in edge_counts.items():
 if count==1:adj.setdefault(aa,[]).append(bb);adj.setdefault(bb,[]).append(aa)
assert all(len(v)==2 for v in adj.values()),'Front granite seam must be a closed loop'
start=min(adj);outline_ids=[start];previous=None;current=start
while True:
 nxt=next(v for v in adj[current] if v!=previous)
 if nxt==start:break
 outline_ids.append(nxt);previous,current=current,nxt
assert len(outline_ids)==len(adj),'Front granite must be one surface patch'
# Collapse only near-duplicate seam points, updating adjacent retained faces.
# These .005m inherited edges created the most conspicuous needle facets.
redirect={};clean=[]
for i in outline_ids:
 if clean and (Vector(rock_vertices[i])-Vector(rock_vertices[clean[-1]])).length<.22:redirect[i]=clean[-1]
 else:clean.append(i)
if (Vector(rock_vertices[clean[-1]])-Vector(rock_vertices[clean[0]])).length<.22:redirect[clean.pop()]=clean[0]
outline_ids=clean
retained=[tuple(redirect.get(i,i) for i in f) for f in retained]
retained=[f for f in retained if len(set(f))>=3]
source_front=BVHTree.FromPolygons([Vector(v) for v in rock_vertices],selected)
def front_height(x,y):
 hit,_,_,_=source_front.ray_cast(Vector((x,y,50)),Vector((0,0,-1)))
 return hit.z if hit else None
outline=[(rock_vertices[i][0],rock_vertices[i][1]) for i in outline_ids]
points=list(outline);edge_constraints=[(i,(i+1)%len(outline)) for i in range(len(outline))]
retopo_rng=random.Random(44120)
# Irregular, well-spaced points give roughly 1.5–2.4m stone faces. There is no
# per-vertex displacement noise and no recursive triangle subdivision.
for attempt in range(1600):
 x=retopo_rng.uniform(-14.8,10.8);y=retopo_rng.uniform(4.0,18.8)
 if not inside(x,y,outline) or nearest(x,y,outline)[0]<.85:continue
 if min(math.hypot(x-a,y-b) for a,b in points)<1.6:continue
 if front_height(x,y) is not None:points.append((x,y))
# Explicit paired shelf contours, rather than accidental sloped triangle tips.
buttresses=[(-10.0,3.3,8.3,3.1),(-6.8,3.1,12.0,2.7),(-4.2,1.45,6.8,1.6),
            (4.3,1.8,10.0,2.5),(7.8,2.7,6.9,3.0),(8.2,2.1,14.1,1.8)]
for cx,w,ledge,projection in buttresses:
 for yy in [ledge-.22,ledge+.42]:
  pair=[]
  for xx in [cx-w*.65,cx,cx+w*.65]:
   if not inside(xx,yy,outline) or nearest(xx,yy,outline)[0]<.7:continue
   # Remove nearby unstructured interior points before inserting a shelf.
   points=[v for j,v in enumerate(points) if j<len(outline) or math.dist(v,(xx,yy))>.7]
   pair.append((xx,yy))
  points.extend(pair)
# Interior shelf points are triangulated with the boundary; minimum angle
# quality is improved in 3D after the actual shoulder projection below.
res=delaunay_2d_cdt([Vector(v) for v in points],edge_constraints,[list(range(len(outline)))],1,1e-5)
front_map=[];front_ids=set()
for v in res[0]:
 match=next((i for i,(x,y) in enumerate(outline) if math.hypot(v.x-x,v.y-y)<1e-4),None)
 if match is not None:front_map.append(outline_ids[match]);continue
 z=front_height(v.x,v.y)
 assert z is not None,'New granite point must lie on the source face'
 # Suppress inherited tiny pits, without changing the global cliff silhouette.
 samples=[front_height(v.x+dx,v.y+dy) for dx,dy in [(0,0),(.45,0),(-.45,0),(0,.45),(0,-.45)]]
 samples=[q for q in samples if q is not None];z=sum(samples)/len(samples)
 front_map.append(len(rock_vertices));front_ids.add(len(rock_vertices));rock_vertices.append((v.x,v.y,z))
front_faces=[]
for f in res[2]:
 ids=tuple(front_map[j] for j in f);aa,bb,cc=[Vector(rock_vertices[j]) for j in ids]
 if (bb-aa).cross(cc-aa).z<0:ids=tuple(reversed(ids))
 front_faces.append(ids)
rock_indices=retained+front_faces
sculpt_approaches=json.loads((OUT/'world-approaches.json').read_text())['samples']
sculpted_count=0;sculpt_maximum=0
# Narrow and recess the upper front core, allowing a genuine silhouette change
# below the immutable summit support. Walking envelopes remain untouched.
def smooth01(v):
 v=max(0,min(1,v));return v*v*(3-2*v)
for i,(x,y,z) in enumerate(rock_vertices):
 if z<=1.8 or y>=19 or y<=3.85:continue
 if any(math.hypot(x-q[0],z-q[2])<q[3]+2 for q in all_path_points+sculpt_approaches):continue
 weight=smooth01((z-1.8)/4)*smooth01((19-y)/2)*smooth01((y-3.85)/1.8)
 channel=smooth01((abs(x+.45)-2.25)/1.05)
 xx=x+(.45-x)*weight*.18*channel
 zz=z-1.8*weight*channel
 rock_vertices[i]=(xx,y,zz);sculpted_count+=1;sculpt_maximum=max(sculpt_maximum,math.hypot(xx-x,zz-z))
# Three angular shoulder polyhedra union into the recessed core. Broad flat
# shelves and different summit elevations read as geological masses, not loose
# boulder balls. Their footprint, not a decorative radius, is audited below.
shoulder_forms=[{'x':-9.6,'z':7.5,'width':5.7,'depth':4.7,'top':10.7,'shiftX':.7,'shiftZ':-.45},
 {'x':-6.5,'z':5.1,'width':3.7,'depth':4.3,'top':15.0,'shiftX':-.25,'shiftZ':-.40},
 {'x':6.9,'z':7.0,'width':3.8,'depth':4.5,'top':9.7,'shiftX':.1,'shiftZ':-.35}]
def temporary_solid(name,vv,ff):
 m=bpy.data.meshes.new(name);m.from_pydata(vv,[],ff);m.update()
 bm=bmesh.new();bm.from_mesh(m);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(m);bm.free()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return o
core=temporary_solid('granite_union_core',rock_vertices,rock_indices)
profile=[(-1,-.65),(-.72,-1),(.62,-1),(1,-.36),(.86,.66),(.25,1),(-.65,.88),(-1,.28)]
for index,form in enumerate(shoulder_forms):
 vv=[];ff=[];baseY=3.72;phase=[.28,-.47,.68][index]
 # Each ridge vertex has its own elevation, radius and angular direction.
 # There are no horizontal courses or full-width cap terraces.
 for ring,(rise,sx,sz) in enumerate([(0,1,1),(.43,.94,1.01),(.82,.78,.86),(1,.53,.61)]):
  for j,(px,pz) in enumerate(profile):
   a=phase+.14*math.sin(j*2.31+ring*1.8+index)
   radial=1+.14*math.sin(j*1.9+ring*2.3+index*1.1)
   qx=(px*math.cos(a)-pz*math.sin(a))*radial
   qz=(px*math.sin(a)+pz*math.cos(a))*radial
   xx=form['x']+qx*form['width']*sx+form['shiftX']*rise
   if index<2:xx=min(-2.75,xx)
   else:xx=max(2.8,xx)
   zz=form['z']+qz*form['depth']*sz+form['shiftZ']*rise
   irregular=0 if ring==0 else .13*math.sin(j*2.04+index*1.7+ring*.83)+.055*math.cos(j*1.17-ring)
   yy=baseY+(form['top']-baseY)*(rise+irregular)
   vv.append((xx,yy,zz))
 for ring in range(3):
  for j in range(8):
   aa=ring*8+j;bb=ring*8+(j+1)%8;cc=(ring+1)*8+(j+1)%8;dd=(ring+1)*8+j
   ff.extend([(aa,bb,cc),(aa,cc,dd)] if (j+ring+index)%2 else [(aa,bb,dd),(bb,cc,dd)])
 ff.append(tuple(reversed(range(8))))
 top=len(vv);vv.append((form['x']+form['shiftX']+.25,form['top']+.20,form['z']+form['shiftZ']-.4))
 for j in range(8):ff.append((24+j,24+(j+1)%8,top))
 # Complete solid footprint stays outside the shared approach corridor.
 for xx,yy,zz in vv:
  assert all(math.hypot(xx-q[0],zz-q[2])>q[3]+.35 for q in all_path_points+sculpt_approaches),'Granite shoulder enters a full-width path'
 part=temporary_solid('granite_shoulder_'+str(index),vv,ff)
 bpy.context.view_layer.objects.active=core;core.select_set(True)
 mod=core.modifiers.new('Connected granite shoulder','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=part
 bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(part,do_unlink=True)
# Dissolve coplanar boolean seams before triangulation. Their triangles shade as
# one stone plane; no tiny independently tinted chips are introduced.
bm=bmesh.new();bm.from_mesh(core.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
bmesh.ops.dissolve_limit(bm,angle_limit=.025,verts=list(bm.verts),edges=list(bm.edges),use_dissolve_boundaries=False)
bmesh.ops.triangulate(bm,faces=list(bm.faces),quad_method='BEAUTY',ngon_method='BEAUTY')
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(core.data);bm.free()
rock_vertices=[tuple(v.co) for v in core.data.vertices];rock_indices=[tuple(f.vertices) for f in core.data.polygons]
bpy.data.objects.remove(core,do_unlink=True)
# Localized soil-catching ledges: inset only part of an irregular upper plane,
# keeping its surrounding ridges intact. These are not full facade courses.
pocket_candidates=[]
for i,f in enumerate(rock_indices):
 a,b,c=[Vector(rock_vertices[j]) for j in f];n=(b-a).cross(c-a).normalized();center=(a+b+c)/3
 area=(b-a).cross(c-a).length/2
 if .43<n.y<.98 and n.z>-.05 and area>2.0 and 5.2<center.y<17 and center.z>5.3 and abs(center.x+.45)>3.2:
  pocket_candidates.append((i,center,area))
targets=[(-12,7.8,10),(-7.9,12.8,8.3),(-5.0,15.2,7.4),(5.3,9.3,9.8),(8.6,6.0,10.1),(-9.5,5.5,11.4),(-5.2,10,9.7)]
selected_pockets={};pockets=[]
for target in targets:
 candidates=[q for q in pocket_candidates if q[0] not in selected_pockets and all(math.hypot(q[1].x-p['x'],q[1].z-p['z'])>2.0 for p in pockets)]
 if not candidates:continue
 i,center,area=min(candidates,key=lambda q:(q[1]-Vector(target)).length)
 if (center-Vector(target)).length>5.0:continue
 f=rock_indices[i];inner=[]
 for j in f:
  p=center.lerp(Vector(rock_vertices[j]),.52);p.y=center.y
  inner.append(len(rock_vertices));rock_vertices.append(tuple(p))
 poly=[(rock_vertices[j][0],rock_vertices[j][2]) for j in inner]
 root_radius=nearest(center.x,center.z,poly)[0]
 if root_radius<.15:continue
 pocket={'x':center.x,'y':center.y,'z':center.z,'rootRadius':root_radius,'support':poly}
 pockets.append(pocket);selected_pockets[i]=(f,inner)
new_faces=[]
for i,f in enumerate(rock_indices):
 if i not in selected_pockets:new_faces.append(f);continue
 outer,inner=selected_pockets[i]
 for j in range(3):
  k=(j+1)%3;new_faces.extend([(outer[j],outer[k],inner[k]),(outer[j],inner[k],inner[j])])
 new_faces.append(tuple(inner))
rock_indices=new_faces
rock_colors=[]
for face in rock_indices:
 a,b,c=(Vector(rock_vertices[i]) for i in face);n=(b-a).cross(c-a).normalized();center=(a+b+c)/3
 band=.5+.5*math.sin(center.y*.46+center.x*.23)
 wet=max(0,1-abs(center.x+.45)/3.1)*smooth01((center.z-4)/4)
 shade=(.91+.08*band+.07*max(0,n.y))*(1-.24*wet)
 # Subtle warm grey granite; form and lighting carry the seams, not noise.
 base=(.27+.018*max(0,n.x),.267+.008*max(0,n.y),.244)
 rock_colors.append(tuple(v*shade for v in base))
rock_sculpt={'connectedSourceTopology':True,'displacedVertices':sculpted_count,'maximumProjectionMetres':sculpt_maximum,
 'protectedSummitAbove':19,'protectedChannelHalfWidth':2.25,'shoulderForms':shoulder_forms,'plantingPockets':pockets,'buttresses':buttresses,'triangles':len(rock_indices)}

bpy.data.objects.remove(original_rock,do_unlink=True)
rock_object=mesh('rock',rock_vertices,rock_indices,rock_colors)
rock_object['plantingPockets']=json.dumps(pockets)

# Replace the inherited accordion sheets and airborne foam with a continuous
# gravity curtain. The fall travels out from the notch as it accelerates down;
# its entire width remains in front of the decoded granite face.
fall_nodes = ['waterfall', 'waterfall_back', 'falls_lip', 'falls_foam']
for name in fall_nodes:
 if bpy.data.objects.get(name):bpy.data.objects[name].name='original_'+name
falls_material=bpy.data.materials.get('PT_Falls')
fall_vertices, fall_faces, fall_colors = [], [], []
fall_rows,fall_columns=49,13
fall_profile=[]
for row in range(fall_rows):
 t=row/(fall_rows-1)
 y=16.65-(16.65-WATER-.035)*t*t
 z=8.95+1.40*t
 width=2.6+1.1*t
 fall_profile.append({'height':y,'front':z,'width':width})
 for col in range(fall_columns):
  u=col/(fall_columns-1)-.5
  # Fine longitudinal ridges break reflected light without folding the sheet.
  ridge=.022*math.sin(col*2.17)+.012*math.sin(col*4.43+t*2.4)
  fall_vertices.append((-.45+u*width,y,z+ridge))
for row in range(fall_rows-1):
 for col in range(fall_columns-1):
  a=row*fall_columns+col;b=a+1;c=a+fall_columns;d=c+1
  fall_faces.extend([(a,c,b),(b,c,d)])
  strand=.74+.12*math.sin(col*1.71)+.045*math.sin(row*.83+col)
  fall_colors.extend([(strand*.78,strand*.89,strand),
                      (strand*.82,strand*.92,strand)])
fall=mesh('waterfall',fall_vertices,fall_faces,fall_colors,falls_material)
for face in fall.data.polygons:face.use_smooth=True
# The little feeder is a sloping surface from the retained creek endpoint,
# widening only as it spills over the lip. It is one continuous wetted shape.
feeder_vertices,feeder_faces=[],[]
for row in range(7):
 t=row/6
 x=-1.95+1.5*t;z=8.22+.73*t;y=16.822-.172*t
 for col in range(9):
  u=col/8-.5
  feeder_vertices.append((x+u*(.48+2.12*t),y,z+.015*math.sin(col*2.17)))
for row in range(6):
 for col in range(8):
  a=row*9+col;feeder_faces.extend([(a,a+9,a+1),(a+1,a+9,a+10)])
mesh('falls_lip',feeder_vertices,feeder_faces,(.55,.72,.76),falls_material)
# Impact is at the lake surface, not white facets half way up the cliff.
# Short broken arcs describe local turbulence. No spoke reaches from the
# impact centre to a remote ring; exposed water separates every fragment.
foam_vertices,foam_faces,foam_colors=[],[],[]
foam_rng=random.Random(307)
for patch in range(54):
 radius=foam_rng.uniform(.18,2.35)
 angle=foam_rng.uniform(.08,math.pi-.08)
 arc=foam_rng.uniform(.055,.18)/max(.5,radius)
 thickness=foam_rng.uniform(.018,.065)
 base=len(foam_vertices)
 for j in range(5):
  theta=angle+(j/4-.5)*arc*3
  ripple=.045*math.sin(theta*9+patch)
  taper=math.sin(math.pi*(j+.3)/4.6)**.6
  for side in [-1,1]:
   r=radius+ripple+side*thickness*taper
   foam_vertices.append((-.45+math.cos(theta)*r*1.2,WATER+.031+patch*.00012,10.35+math.sin(theta)*r))
 for j in range(4):
  q=base+j*2;foam_faces.extend([(q,q+2,q+1),(q+1,q+2,q+3)])
  tone=.48+.12*foam_rng.random();foam_colors.extend([(tone*.82,tone*.95,tone)]*2)
mesh('falls_foam',foam_vertices,foam_faces,foam_colors,falls_material)
fall_contract={'profile':fall_profile,'fallRows':fall_rows,'fallColumns':fall_columns,
 'lakeHeight':WATER,'impactCentre':[-.45,WATER+.035,10.35],
 'creekConnection':[-1.95,16.822,8.22],
 'clearanceMinimumMetres':.06,'monotonicGravityCurtain':True}

# Place small authored forms against the triangulated export surface. Check
# each entire plant radius against the lake and every sampled path width.
shore_rng = random.Random(92)
shore_bvh = BVHTree.FromPolygons([Vector(v) for v in terrain_vertices],terrain_faces)
def shore_support(x,z):
 hit, _, _, _ = shore_bvh.ray_cast(Vector((x,80,z)),Vector((0,-1,0)))
 return hit.y if hit else None
# Sampled by the JS build from the same curves and full curb width rendered
# in world-paths.mjs. This shared approach extends beyond the authored graph.
world_approaches=json.loads((OUT/'world-approaches.json').read_text())
assert world_approaches['sampleSpacingMaximum']<=.2
external_path_points=world_approaches['samples']
def clear_plant(x,z,radius):
 return all(math.hypot(x-p[0],z-p[2]) > p[3]+radius+.24 for p in all_path_points+external_path_points)
stone_vertices, stone_faces, stone_colors = [], [], []
fern_vertices, fern_faces, fern_colors = [], [], []
settled = []
shore_rock_bvh=BVHTree.FromPolygons([Vector(v) for v in rock_vertices],rock_indices)
for i in range(18000):
 x, z = shore_rng.uniform(-35,13), shore_rng.uniform(4,40)
 d = nearest(x,z,LAKE)[0]
 if not .45 < d < 7.8 or inside(x,z,LAKE) or not inside(x,z,COAST):
  continue
 fern = len(settled)%12 != 0
 radius = shore_rng.uniform(.65,1.22) if fern else shore_rng.uniform(.44,1.05)
 if not clear_plant(x,z,radius) or any(math.hypot(x-a,z-b)<(radius+r)*.57 for a,b,r in settled):
  continue
 y = shore_support(x,z)
 if y is None or not WATER-.02 < y < WATER+4.5:
  continue
 # All leaf tips fit the bank and ground grade. Deliberate drifting patches
 # leave irregular mineral windows instead of even plant spacing.
 rim=[shore_support(x+math.cos(j*math.tau/8)*radius,z+math.sin(j*math.tau/8)*radius) for j in range(8)]
 if any(h is None for h in rim) or max(rim)-min(rim)>.9:continue
 if math.sin(x*.32+z*.13)+.55*math.sin(z*.51-x*.17)<-.65:continue
 rock_hit,_,_,_=shore_rock_bvh.ray_cast(Vector((x,40,z)),Vector((0,-1,0)))
 if rock_hit and rock_hit.y>y+.08:continue
 settled.append((x,z,radius))
 if fern:
  # Folded, paired leaflets on arcing fronds. One mesh for the whole bank.
  palette = [(.105,.171,.051),(.147,.205,.064),(.198,.245,.081)]
  turn = shore_rng.random()*math.tau
  for branch in range(6):
   angle = turn+branch*math.tau/6+shore_rng.uniform(-.15,.15)
   dx,dz = math.cos(angle),math.sin(angle)
   span = radius*shore_rng.uniform(.70,1)
   for j in range(1,7):
    t=j/7
    stem=Vector((x+dx*span*t,y+.03+span*(1.35*t-.82*t*t),z+dz*span*t))
    for side in [-1,1]:
     tip=stem+Vector((span*(dx*.17-dz*side*.31)*(1-t*.6),span*.055,span*(dz*.17+dx*side*.31)*(1-t*.6)))
     ridge=stem.lerp(tip,.51)+Vector((0,span*.035,0))
     edge=Vector((dx,0,dz))*span*.119*(1-t*.48)
     base=len(fern_vertices)
     fern_vertices.extend([tuple(stem),tuple(ridge-edge),tuple(tip),tuple(ridge+edge),tuple(ridge)])
     fern_faces.extend([(base,base+4,base+1),(base+1,base+4,base+2),(base+2,base+4,base+3),(base+3,base+4,base)])
     fern_colors.extend([palette[(branch+j+k)%3] for k in (0,0,1,1)])
 else:
  base=len(stone_vertices)
  outline=[shore_rng.uniform(.78,1) for _ in range(8)]
  turn=shore_rng.random()*math.tau
  for ring, scale in enumerate((1,.87,.33)):
   for j in range(8):
    angle=turn+j*math.tau/8
    xx=x+radius*outline[j]*scale*math.cos(angle)
    zz=z+radius*outline[j]*scale*.82*math.sin(angle)
    ground=shore_support(xx,zz)
    yy=(ground if ground is not None else y)-.13 if ring==0 else y+radius*((.25,.55)[ring-1]+.09*math.sin(angle))
    stone_vertices.append((xx,yy,zz))
  for ring in range(2):
   for j in range(8):
    a=base+ring*8+j;b=base+ring*8+(j+1)%8
    stone_faces.extend([(a,a+8,b),(b,a+8,b+8)])
    color=(.23,.26,.126) if ring or j%3==0 else (.32,.288,.235)
    stone_colors.extend([color,tuple(c*.91 for c in color)])
  stone_faces.append(tuple(reversed(range(base+16,base+24))))
  stone_colors.append((.27,.30,.148))
 if len(settled)>=260:
  break
mesh('lake_shore_stones',stone_vertices,stone_faces,stone_colors)
mesh('lake_shore_ferns',fern_vertices,fern_faces,fern_colors)
# Broad salal-like leaves and visible branching interlock with fern fronds.
# These occupy existing fully reserved bank footprints; no new path intrusion.
shrub_v=[];shrub_f=[];shrub_c=[];shrub_sites=[]
shrub_rng=random.Random(31812)
for index,(x,z,r) in enumerate(settled):
 if index%3!=1:continue
 y=shore_support(x,z);height=shrub_rng.uniform(.48,.82)*r
 shrub_sites.append([x,y,z,r,height])
 for branch in range(5):
  angle=branch*math.tau/5+shrub_rng.random()*.5;dx,dz=math.cos(angle),math.sin(angle)
  end=Vector((x+dx*r*.52,y+height,z+dz*r*.52));root=Vector((x,y-.025,z))
  # Slender tapered pentagonal branch, not a floating foliage sphere.
  base=len(shrub_v)
  for t,thick in [(0,.022),(1,.009)]:
   c=root.lerp(end,t)
   for j in range(5):shrub_v.append(tuple(c+Vector((math.cos(j*math.tau/5)*thick,0,math.sin(j*math.tau/5)*thick))))
  for j in range(5):
   a=base+j;b=base+(j+1)%5;shrub_f.extend([(a,b,b+5),(a,b+5,a+5)]);shrub_c.extend([(.12,.115,.06)]*2)
  for level in range(1,5):
   for side in [-1,1]:
    t=level/5;stem=root.lerp(end,t)
    length=r*shrub_rng.uniform(.25,.38);direction=Vector((dx*.35-dz*side*.8,.18,dz*.35+dx*side*.8)).normalized()
    tip=stem+direction*length;mid=stem.lerp(tip,.48);wide=Vector((dz,0,-dx))*length*.34
    ridge=mid+Vector((0,length*.13,0));base=len(shrub_v)
    shrub_v.extend([tuple(stem),tuple(mid-wide),tuple(tip),tuple(mid+wide),tuple(ridge)])
    shrub_f.extend([(base,base+1,base+4),(base+1,base+2,base+4),(base+2,base+3,base+4),(base+3,base,base+4)])
    tone=shrub_rng.uniform(.89,1.08);shrub_c.extend([tuple(v*tone*k for v in (.09,.17,.065)) for k in [1,.92,1.13,1.05]])
mesh('lake_shore_shrubs',shrub_v,shrub_f,shrub_c)


# Forest composition uses the shipped polygon redwood/pine meshes, reused at
# juvenile and mature scales. Terrain and all path widths remain authoritative.
from mathutils import Matrix
forest_rng=random.Random(31103)
forest_trees=[];forest_plants=[]
rock_bvh=BVHTree.FromPolygons([Vector(v) for v in rock_vertices],rock_indices)
forest_views=[((-16,12.5,36),(-11.8,7.4,13)),((-17,15,46),(-9.5,7.8,14)),((25,8.6,41),(32,5.25,34)),((23,9,44),(32,5.25,34)),((28.85,8.46,28.2),(2.56,10.9,4.49))]
def camera_clear(x,y,z,r,h):
 for eye,target in forest_views:
  a=Vector(eye);b=Vector(target);d=b-a
  # Test several heights of the crown, not just the trunk point.
  for t in [.36,.62,.85]:
   p=Vector((x,y+h*t,z));u=max(0,min(1,(p-a).dot(d)/d.length_squared))
   if (p-(a+d*u)).length<r+2.0:return False
 return True

def forest_site(x,z,r,tree=False):
 if not inside(x,z,COAST) or inside(x,z,LAKE):return None
 if nearest(x,z,COAST)[0]<r+.5 or nearest(x,z,LAKE)[0]<r+.22:return None
 if math.hypot(x-32,z-34)<r+5.3 or not clear_plant(x,z,r):return None
 y=shore_support(x,z)
 if y is None or y<WATER-.05:return None
 hit,_,_,_=rock_bvh.ray_cast(Vector((x,80,z)),Vector((0,-1,0)))
 if hit and hit.y>y+.1:return None
 heights=[shore_support(x+math.cos(j*math.tau/8)*r,z+math.sin(j*math.tau/8)*r) for j in range(8)]
 if any(v is None for v in heights) or max(heights)-min(heights)>(1.6 if tree else .6):return None
 return y

# Three planted groves frame the waterfall and camp, leaving the middle lake
# approach open. Irregular nested clusters avoid an evenly scattered lawn.
groves=[(-29,-8,14,22),(27,-19,17,23),(42,17,13,18),(-34,30,9,9),(24,47,19,9)]
templates=[]
for name in ['redwood3','redwood4','pine3','pine6']:
 o=bpy.data.objects[name];vs=[point(o,v) for v in o.data.vertices];low=min(v.y for v in vs);roots=[v for v in vs if v.y<low+.3];cx=sum(v.x for v in roots)/len(roots);cz=sum(v.z for v in roots)/len(roots)
 templates.append((o,vs,cx,cz,low,max(v.y for v in vs)-low,max(math.hypot(v.x-cx,v.z-cz) for v in vs)))
for attempt in range(1200):
 gx,gz,rx,rz=groves[attempt%len(groves)]
 angle=forest_rng.random()*math.tau;rr=math.sqrt(forest_rng.random());x=gx+math.cos(angle)*rx*rr;z=gz+math.sin(angle)*rz*rr
 template=templates[0 if attempt%5<2 else 1 if attempt%5<4 else 2+attempt%2]
 original,vs,cx,cz,low,height,radius=template
 h=forest_rng.uniform(12,23) if attempt%5<4 else forest_rng.uniform(6,11)
 scale=h/height;r=radius*scale
 y=forest_site(x,z,r,True)
 if y is None or not camera_clear(x,y,z,r,h):continue
 if any(math.hypot(x-t['x'],z-t['z'])<r+t['radius']+.8 for t in forest_trees):continue
 if any(math.hypot(x-a,z-b)<r+.65 for a,b,_ in protected_roots):continue
 yaw=forest_rng.random()*math.tau;co=math.cos(yaw);si=math.sin(yaw)
 clone=original.copy();clone.data=original.data.copy();clone.name=('redwood' if attempt%5<4 else 'pine')+'_grove_'+str(len(forest_trees));clone.animation_data_clear();clone.matrix_world=Matrix.Identity(4);bpy.context.collection.objects.link(clone)
 for vertex,p in zip(clone.data.vertices,vs):
  xx=(p.x-cx)*scale;zz=(p.z-cz)*scale
  vertex.co=source((x+xx*co+zz*si,y+(p.y-low)*scale-.045,z-xx*si+zz*co))
 changed.append(clone);forest_trees.append({'node':clone.name,'source':original.name,'x':x,'z':z,'ground':y,'height':h,'radius':r})
 if len(forest_trees)>=42:break

# Folded leaves and broad tuft blades have actual silhouettes; no alpha-card
# photographs or microscopic noise. Both populations are merged into two draws.
under_v=[];under_f=[];under_c=[];grass_v=[];grass_f=[];grass_c=[]
leaf_palette=[(.105,.185,.049),(.165,.253,.072),(.235,.310,.105),(.19,.285,.084)]
for attempt in range(12000):
 gx,gz,rx,rz=groves[attempt%len(groves)];a=forest_rng.random()*math.tau;rr=math.sqrt(forest_rng.random());x=gx+math.cos(a)*(rx+6)*rr;z=gz+math.sin(a)*(rz+6)*rr
 fern=attempt%4==0;r=forest_rng.uniform(.65,1.22) if fern else forest_rng.uniform(.22,.45)
 y=forest_site(x,z,r)
 if y is None:continue
 if any(math.hypot(x-a,z-b)<r+rr*.65 for a,b,rr in forest_plants):continue
 if any(math.hypot(x-t['x'],z-t['z'])<t['radius']*.12+.2 for t in forest_trees):continue
 forest_plants.append((x,z,r))
 turn=forest_rng.random()*math.tau
 if fern:
  for branch in range(5):
   angle=turn+branch*math.tau/5;dx,dz=math.cos(angle),math.sin(angle);span=r*forest_rng.uniform(.78,1)
   for j in range(1,5):
    t=j/5;stem=Vector((x+dx*span*t,y+.035+span*(1.16*t-.88*t*t),z+dz*span*t))
    for side in [-1,1]:
     tip=stem+Vector((span*(dx*.20-dz*side*.30)*(1-t*.6),span*.035,span*(dz*.20+dx*side*.30)*(1-t*.6)))
     ridge=stem.lerp(tip,.5)+Vector((0,span*.075,0));edge=Vector((dx,0,dz))*span*.085
     base=len(under_v);under_v.extend([tuple(stem),tuple(ridge-edge),tuple(tip),tuple(ridge+edge),tuple(ridge)])
     under_f.extend([(base,base+4,base+1),(base+1,base+4,base+2),(base+2,base+4,base+3),(base+3,base+4,base)])
     under_c.extend([leaf_palette[(branch+j+k)%4] for k in range(4)])
 else:
  for blade in range(5):
   angle=turn+blade*2.4;dx,dz=math.cos(angle),math.sin(angle);h=forest_rng.uniform(.25,.62);w=forest_rng.uniform(.045,.09);bend=r*forest_rng.uniform(.5,1)
   base=len(grass_v);grass_v.extend([(x-dz*w,y-.015,z+dx*w),(x+dz*w,y-.015,z-dx*w),(x+dx*bend*.4-dz*w*.45,y+h*.65,z+dz*bend*.4+dx*w*.45),(x+dx*bend*.4+dz*w*.45,y+h*.65,z+dz*bend*.4-dx*w*.45),(x+dx*bend,y+h,z+dz*bend)])
   grass_f.extend([(base,base+2,base+1),(base+1,base+2,base+3),(base+2,base+4,base+3)])
   grass_c.extend([leaf_palette[(blade+attempt)%4]]*3)
 if len(forest_plants)>=1200:break
mesh('ferns_grove_understory',under_v,under_f,under_c)
mesh('grass_grove_tufts',grass_v,grass_f,grass_c)
# The connected sculpted granite itself supplies all ledges; former separate
# foot boulder shells are retired to avoid a piled-ball silhouette.
shoulder_rng=random.Random(3146)
shoulder_sites=[{'x':q['x']+q['shiftX'],'z':q['z']+q['shiftZ'],'base':q['top'],'height':q['top']-3.72,'radius':q['width']*.60,'depth':q['depth']*.68} for q in shoulder_forms]
# Ferns root onto actual exported ledge polygons; low shelf plants break the
# mineral/ground transition without covering the lake or source dock.
shoulder_bvh=rock_bvh
ledge_v=[];ledge_f=[];ledge_c=[];ledge_sites=[]
ledge_candidates=[]
for pocket_index,pocket in enumerate(pockets):
 for member in range([3,2,1,3,2,2,1][pocket_index%7]):
  a=pocket_index*1.7+member*2.4;offset=pocket['rootRadius']*(.04 if member==0 else .72)
  x=pocket['x']+math.cos(a)*offset;z=pocket['z']+math.sin(a)*offset
  r=shoulder_rng.uniform(.62,1.27)*(1 if member==0 else .77)
  ledge_candidates.append((x,z,r,pocket['y']))
for x,z,r,expected_y in ledge_candidates:
 if not clear_plant(x,z,r) or (-3.0<x<2.4 and z>7):continue
 hit,normal,_,_=shoulder_bvh.ray_cast(Vector((x,40,z)),Vector((0,-1,0)))
 if hit is None or normal.y<.92 or abs(hit.y-expected_y)>.05:continue
 if any(math.hypot(x-a,z-b)<.14 for a,b,rr in ledge_sites):continue
 ledge_sites.append((x,z,r));y=hit.y-.012;turn=shoulder_rng.random()*math.tau
 # Upright salal shrub sprays; four branches interlock into one broad crown.
 for spray in range(6):
  angle=turn+spray*math.tau/6;dx,dz=math.cos(angle),math.sin(angle)
  root=Vector((x,y,z));tip=Vector((x+dx*r*.45,y+r*shoulder_rng.uniform(.85,1.15),z+dz*r*.45))
  base=len(ledge_v)
  for t,rr in [(0,.025),(1,.012)]:
   c=root.lerp(tip,t)
   for j in range(5):ledge_v.append(tuple(c+Vector((math.cos(j*math.tau/5)*rr,0,math.sin(j*math.tau/5)*rr))))
  for j in range(5):
   aa=base+j;bb=base+(j+1)%5;ledge_f.extend([(aa,bb,bb+5),(aa,bb+5,aa+5)]);ledge_c.extend([(.13,.115,.055)]*2)
  for level in range(2,6):
   stem=root.lerp(tip,level/6)
   for side in [-1,1]:
    direction=Vector((dx*.5-dz*side*.65,.45,dz*.5+dx*side*.65)).normalized();length=r*shoulder_rng.uniform(.38,.52)
    end=stem+direction*length;mid=stem.lerp(end,.48);width=Vector((dz,0,-dx))*length*.37;ridge=mid+Vector((0,length*.16,0))
    base=len(ledge_v);ledge_v.extend([tuple(stem),tuple(mid-width),tuple(end),tuple(mid+width),tuple(ridge)])
    ledge_f.extend([(base,base+1,base+4),(base+1,base+2,base+4),(base+2,base+3,base+4),(base+3,base,base+4)])
    ledge_c.extend([(.095,.175,.055),(.13,.215,.07),(.18,.26,.092),(.15,.23,.068)])
 for branch in range(8):
  a=turn+branch*math.tau/8;dx,dz=math.cos(a),math.sin(a);span=r*shoulder_rng.uniform(.8,1)
  for j in range(1,5):
   t=j/5;stem=Vector((x+dx*span*t,y+.04+span*(1.65*t-1.1*t*t),z+dz*span*t))
   for side in [-1,1]:
    tip=stem+Vector((span*(dx*.20-dz*side*.39)*(1-t*.55),span*.04,span*(dz*.20+dx*side*.39)*(1-t*.55)))
    ridge=stem.lerp(tip,.5)+Vector((0,span*.055,0));edge=Vector((dx,0,dz))*span*.11
    base=len(ledge_v);ledge_v.extend([tuple(stem),tuple(ridge-edge),tuple(tip),tuple(ridge+edge),tuple(ridge)])
    ledge_f.extend([(base,base+4,base+1),(base+1,base+4,base+2),(base+2,base+4,base+3),(base+3,base+4,base)])
    ledge_c.extend([leaf_palette[(branch+j+k)%4] for k in range(4)])
 if len(ledge_sites)>=24:break
mesh('ferns_cliff_ledge',ledge_v,ledge_f,ledge_c)
forest_contract={'trees':forest_trees,'cliffShoulders':shoulder_sites,'cliffLedgeFerns':len(ledge_sites),'groundPlants':len(forest_plants),'fernTriangles':len(under_f),'grassTriangles':len(grass_f),'pathMarginMetres':.24,'worldApproachSamples':len(external_path_points),'cameraCorridorMarginMetres':2,'source':'Existing shipped polygon redwood/pine meshes; sampled exported terrain and full authored path widths'}

# Export ONLY changed meshes. Main merger preserves every unrelated official
# mesh/animation, including shared instancing and authored transforms.
bpy.ops.object.select_all(action='DESELECT')
for o in changed:o.select_set(True)
for o in changed:
 if o.type=='MESH' and o.data.color_attributes:
  ca=o.data.color_attributes;o.data.color_attributes.active_color=ca.get('Col') or ca[0];ca.render_color_index=list(ca).index(ca.active_color)
props={p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
opts=dict(filepath=str(OUT/'landscape-raw.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_vertex_color='ACTIVE',export_all_vertex_colors=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
bpy.ops.export_scene.gltf(**{k:v for k,v in opts.items() if k in props})
replace=[o.name for o in changed]
remove=fall_nodes+['rock','terrain','pool','bridges_paths_p8','dock_boats','lake_rocks','ferns','coast_shrubs','coast_flowers','coast_ledges','coast_foam','lake_rim','lake_rocks_layered','bushes','grass','grass_island','ground','hills','sky_card','sky_ridge','lake_ripples','lake_outflow','outflow_rapids']+trees_remove
manifest={'schema':'out-there-refinement/v1','sourceSha256':SOURCE_SHA,'units':'Three metres [Blender.x, Blender.z+6,-Blender.y]/1.56','replaceOrRemoveOfficialNodes':remove,'replacementNodes':replace,'coastBoundary':COAST,'originalLakeBoundary':[{'sourceVertex':i,'point':list(v)} for i,v in zip(ordered,source_shore)],'lakeBoundary':LAKE,'waterHeight':WATER,'originalLakeArea':abs(signed_area([(v.x,v.z) for v in source_shore])),'lakeArea':abs(signed_area(LAKE)),'sourceComponentAudit':component_audit,'removedSourceFaces':removed_faces,'plantFacesRemoved':plant_removed,'removedTreeNodes':trees_remove,'retainedTreeContacts':tree_contacts,'adjustedHooks':adjusted,'nodes':nodes,'profiles':path_profiles,'boats':boat_anchors,'waterfall':fall_contract,'forest':forest_contract,'graniteSculpt':rock_sculpt,'lakePlanting':{'sites':settled,'fernTriangles':len(fern_faces),'ledgeSites':ledge_sites,'shrubs':shrub_sites},'camp':{'centre':[32,4.34,34],'radius':3.766,'terraceOwnedByRuntime':True,'connectorStart':camppts[0],'connectorEnd':camppts[-1],'width':1.2,'foundationBottom':3.68},'limitations':['New paths require exported full-width collision audit before enabling walking.','Four baked source hikers removed by audited connected topology; runtime supplies shared 1.75m adult rigs at those anchors.','Original upper timber bridge, dock and stairs remain. The unsupported east arch and gate are removed: the main-world crossing now joins certified ENTRY. Obsolete southwest small bridge removed because expanded basin replaces its crossing.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_SHA
print('REFINEMENT_STATIC_EXPORTED',json.dumps({'nodes':replace,'removedTrees':len(trees_remove),'lakeAreaRatio':manifest['lakeArea']/manifest['originalLakeArea'],'newPathProfiles':len(path_profiles)}))
