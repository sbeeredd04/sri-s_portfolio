import test from 'node:test';
import assert from 'node:assert/strict';
import { MathUtils, Vector3 } from 'three';
import { skyState, starVisibility } from '../app/lib/atmosphere.mjs';
import { worldTime } from '../app/lib/world-time.mjs';
import { resolveWorldLight } from '../app/lib/world-lighting.mjs';
import { presetWeather, weatherKinds } from '../app/lib/weather.mjs';
import { worldPoint, regions, WORLD_RADIUS } from '../app/lib/world-layout.mjs';
import { homeArrival, homePromenade, homeHarbor, homeSite } from '../app/lib/home-site.mjs';
import { apartmentPoint, studioDeskView, studioBookView } from '../app/lib/studio-layout.mjs';
import { madeProjectView, madeSitePoint, madeStop, madeSites } from '../app/lib/made-campus-views.mjs';
import { afterHoursArrival, raisedContentPoint } from '../app/lib/authored-island-sites.mjs';
import { outThereStop } from '../app/lib/out-there-site.mjs';
import { fieldnotesArrival } from '../app/lib/fieldnotes-layout.mjs';
import { placeStops } from '../app/lib/place-stops.mjs';

// SF has returned to PST on this date. These are real solar states, not an
// invented mapping from clock hours to day/night labels.
const morning=worldTime(new Date('2026-11-03T15:03:00Z'));
const night=worldTime(new Date('2026-11-03T10:30:00Z'));
const cameras=[];
function add(world,id,shot,transform=p=>p){
  if(!shot?.position)return;
  for(const phone of [false,true]){
    const view=phone?(shot.portrait||shot):shot;
    const eye=worldPoint(world,transform(view.position));
    cameras.push({world,id,phone,eye,altitude:eye.length()-WORLD_RADIUS,
      focusDistance:eye.distanceTo(worldPoint(world,[0,0,0]))});
  }
}
// These are the same authored views and transforms CameraRig resolves, rather
// than a hand-picked low altitude that misses the portrait establishing shots.
for(const [id,shot] of Object.entries({arrival:homeArrival,promenade:homePromenade,harbor:homeHarbor}))add('studio',id,shot);
for(const [id,shot] of Object.entries({desk:studioDeskView,bookshelf:studioBookView}))add('studio',id,shot,apartmentPoint);
for(const id of ['arrival','campus','ring','keynote','workbench','mobile','hackathons','tools','demos','bay',...madeSites.map(s=>s.id)])add('projects',id,madeStop(id));
add('court','arrival',afterHoursArrival,p=>raisedContentPoint('court',p));
for(const stop of placeStops.court||[])add('court',stop.id,stop,p=>raisedContentPoint('court',p));
for(const id of ['arrival','trailhead','lake','camp','overlook'])add('trail',id,outThereStop(id));
add('future','arrival',fieldnotesArrival);
for(const stop of placeStops.future||[])add('future',stop.id,stop);
function stateFor(camera,solar){
  const region=regions.find(r=>r.id===camera.world);
  const sun=new Vector3(...solar.direction).normalize().applyQuaternion(region.rotation);
  return skyState({...camera,daylight:solar.daylight,warmth:solar.warmth,
    sunHeight:sun.dot(region.normal),weather:solar.weather});
}
const luminance=c=>.2126*c.r+.7152*c.g+.0722*c.b;

test('07:03 SF Made phone arrival retains its atmosphere while the sun already lights the ground',()=>{
  assert.equal(morning.hour,7);assert.equal(morning.minute,3);
  assert(morning.altitude>3&&morning.altitude<5);
  assert(morning.daylight>.5&&morning.daylight<.7);
  const camera=cameras.find(c=>c.world==='projects'&&c.id==='arrival'&&c.phone);
  assert(camera.altitude>140,'actual tangent-plane portrait eye reaches the old radial fade');
  const oldOpacity=1-MathUtils.smoothstep(camera.altitude,70,150);
  assert(oldOpacity<.01,'this real preset reproduces the almost-absent sky, not an unrelated low view');
  const weather=presetWeather('clear'),state=stateFor(camera,resolveWorldLight('live',morning,weather));
  assert.equal(state.opacity,1,'bright ground must remain inside a continuous sky');
  assert(state.fog>0.0001,'portrait camera must retain real atmospheric depth as well as sky colour');
  assert.equal(starVisibility(morning.daylight,weather),0,'procedural stars draw after the sky and must suppress themselves');
});

test('every authored arrival and close view keeps a non-black atmosphere across live times and weather',()=>{
  assert.equal(cameras.filter(c=>c.id==='arrival').length,10,'five inhabited islands at both viewport classes');
  assert(cameras.length>=70,'include close views and supplemental Made viewpoints');
  for(const camera of cameras)for(const kind of weatherKinds){
    const weather=presetWeather(kind);
    const samples=[resolveWorldLight('live',morning,weather),resolveWorldLight('live',night,weather),
      ...['day','dusk','night'].map(mode=>resolveWorldLight(mode,morning,weather))];
    for(const solar of samples){
      const state=stateFor(camera,solar),label=`${camera.world}/${camera.id}/${camera.phone?'phone':'desktop'} ${kind} daylight${solar.daylight}`;
      assert.equal(state.opacity,1,label);
      for(const key of ['zenith','horizon']){
        assert(state[key].toArray().every(Number.isFinite),`${label} ${key} finite`);
        assert(luminance(state[key])>.005,`${label} ${key} does not collapse to black space`);
      }
      assert(Number.isFinite(state.fog)&&state.fog>0,`${label} atmospheric depth persists`);
    }
  }
});

test('arrival, return and zoom do not switch the inhabited sky off at the former fade heights',()=>{
  for(const camera of cameras.filter(c=>c.id==='arrival'))for(const time of [morning,night]){
    const solar=resolveWorldLight('live',time,presetWeather('overcast'));
    const reference=stateFor(camera,solar);
    for(const altitude of [0,69.99,70,70.01,149.99,150,150.01,camera.altitude,600]){
      // World selection changes before the arrival flight completes. Both the
      // old overview height and final low eye need an atmosphere throughout.
      const state=stateFor({...camera,altitude},solar);
      assert.equal(state.opacity,reference.opacity);
      assert.equal(state.fog,reference.fog,'altitude alone cannot delete fog at the same subject distance');
      assert.deepEqual(state.horizon.toArray(),reference.horizon.toArray());
    }
    const overview=skyState({world:'planet',altitude:600,daylight:solar.daylight,warmth:solar.warmth,
      sunHeight:solar.direction[1],weather:solar.weather});
    assert.equal(overview.opacity,reference.opacity,'returning to World cannot pop a missing sky back in');
    assert.equal(overview.fog,0,'the bounded globe remains readable without a foreground fog wall');
  }
});

test('02:30 SF has stars in clear air, with cloud, fog and rain suppressing them',()=>{
  assert.equal(night.hour,2);assert.equal(night.minute,30);assert.equal(night.daylight,0);
  const clear=starVisibility(night.daylight,presetWeather('clear'));
  assert(clear>.9&&clear<=1,'night clear sky retains restrained stars');
  for(const kind of ['overcast','fog','drizzle','rain','storm']){
    const hidden=starVisibility(night.daylight,presetWeather(kind));
    assert(hidden<.01&&hidden<clear*.01,`${kind} must not show an equally bright starfield`);
  }
  for(const daylight of [morning.daylight,.48,1])for(const kind of weatherKinds)
    assert.equal(starVisibility(daylight,presetWeather(kind)),0,`${kind} daylight${daylight}: no daytime star floor`);
});

test('twilight star visibility changes continuously and monotonically as daylight increases',()=>{
  for(const kind of weatherKinds){
    const weather=presetWeather(kind);let previous=starVisibility(0,weather);
    for(let step=1;step<=100;step++){
      const current=starVisibility(step/100,weather);
      assert(current>=0&&current<=1&&current<=previous+1e-12);
      assert(Math.abs(current-previous)<.04,'no abrupt star switch during live dawn/dusk');
      previous=current;
    }
  }
});


function fogAt(world, shot, subject, solar) {
  const eye = worldPoint(world, shot.position);
  const forward = worldPoint(world, shot.target).sub(eye).normalize();
  const depth = subject.clone().sub(eye).dot(forward);
  assert.ok(depth > 0, 'measured subject is in front of the authored camera');
  const focusDistance = eye.distanceTo(worldPoint(world, [0, 0, 0]));
  const { fog } = stateFor({ world, focusDistance }, solar);
  // Three FogExp2 uses forward view-space depth, not Euclidean distance.
  return 1 - Math.exp(-Math.pow(fog * depth, 2));
}

test('ordinary overcast keeps Home and Made subjects clear while dense fog retains depth', () => {
  const overcast = resolveWorldLight('day', morning, presetWeather('overcast'));
  const dense = resolveWorldLight('day', morning, presetWeather('fog'));
  const agentex = madeSites.find(({ id }) => id === 'agentex');
  const summit = worldPoint('studio', homeSite.anchors.Summit_HeroTarget);
  for (const phone of [false, true]) {
    const view = (shot) => phone ? shot.portrait : shot;
    for (const [world, shot, subject, background] of [
      ['studio', view(homeArrival), worldPoint('studio', [0, 7, 31]), summit],
      ['studio', view(homePromenade), worldPoint('studio', [17, 5, 30]), summit],
      ['projects', view(madeStop('arrival')), worldPoint('projects', [0, 2, 0]), summit],
      ['projects', madeProjectView('agentex', 'inside', phone),
        worldPoint('projects', madeSitePoint(agentex, [0, 2.1, -2.32]))],
    ]) {
      const label = `${world}/${phone ? 'phone' : 'desktop'} at ${shot.position}`;
      const mild = fogAt(world, shot, subject, overcast);
      const thick = fogAt(world, shot, subject, dense);
      assert.ok(mild > 0 && mild < 0.02, `${label} overcast subject blend is ${mild}`);
      // Preserve dense fog strength at the same real depth, including short
      // interior sightlines where a percentage floor would be misleading.
      assert.ok(Math.abs(Math.log1p(-thick) / Math.log1p(-mild) - 3.88 ** 2) < 0.001, label);
      if (background) {
        const distant = fogAt(world, shot, background, overcast);
        assert.ok(distant > mild && distant < 0.06, `${label} distant blend is ${distant}`);
        assert.ok(fogAt(world, shot, background, dense) > 0.20, `${label} dense fog loses depth`);
      }
    }
  }
});

test('mist and rain add fog continuously and monotonically across the weather range', () => {
  const weather = presetWeather('overcast');
  for (const camera of cameras.filter(({ id }) => ['arrival', 'promenade', 'agentex'].includes(id))) {
    for (const mode of ['day', 'night']) {
      const density = (mist, rain) => stateFor(camera,
        resolveWorldLight(mode, morning, { ...weather, fog: mist, rain })).fog;
      const dry = density(0, 0);
      assert.ok(Math.abs(density(0.2, 0) / dry - 1) < 1e-12);
      assert.ok(Math.abs(density(0.9, 0) / dry - 3.88) < 1e-12);
      assert.ok(Math.abs(density(0, 1) / dry - 2.1) < 1e-12);
      for (const vary of [(amount) => density(amount, 0.25), (amount) => density(0.55, amount)]) {
        let previous = vary(0);
        for (let step = 1; step <= 200; step++) {
          const current = vary(step / 200);
          assert.ok(current >= previous && current - previous < dry * 0.04,
            `${camera.world}/${camera.id} ${mode} jumps or reverses at ${step / 200}`);
          previous = current;
        }
      }
    }
  }
});
