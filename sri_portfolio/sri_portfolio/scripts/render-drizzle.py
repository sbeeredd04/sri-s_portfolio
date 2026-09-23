"""Render a natural, non-tonal drizzle bed; keep the approved score intact."""
from pathlib import Path
import json, hashlib, subprocess, tempfile, wave
import numpy as np
R=32000; seconds=18; n=R*seconds
out=Path(__file__).resolve().parents[1]/'public'/'audio'
rng=np.random.default_rng(20260916)
f=np.fft.rfftfreq(n,1/R); t=np.arange(n)/R
shape=(np.maximum(f,1)/450)**-.55/(1+(f/4200)**4)*(1-np.exp(-(f/180)**2)); shape[0]=0
rain=np.column_stack([np.fft.irfft(shape*np.exp(1j*rng.uniform(0,2*np.pi,len(f))),n) for _ in range(2)])
rain/=np.std(rain,axis=0)
air=(.72+.1*np.sin(t*2*np.pi/18)+.045*np.sin(t*2*np.pi/6.7+1.4))[:,None]
rain*=.092*air
# Soft broadband splashes supply water detail without pitched, bell-like drops.
for i in range(260):
    length=int(rng.uniform(.018,.075)*R); d=np.arange(length)/R
    attack=np.minimum(d/.004,1); decay=np.exp(-d*rng.uniform(42,95))
    noise=rng.normal(0,1,length)
    splash=np.concatenate(([noise[0]],np.diff(noise)))*attack*decay*rng.uniform(.012,.055)
    pan=rng.uniform(.08,.92); idx=(int(rng.uniform(0,seconds)*R)+np.arange(length))%n
    rain[idx,0]+=splash*np.sqrt(1-pan); rain[idx,1]+=splash*np.sqrt(pan)
rain-=rain.mean(axis=0); rain*=.38/np.max(np.abs(rain))
with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
    with wave.open(tmp.name,'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(R); w.writeframes((rain*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',tmp.name,'-codec:a','libmp3lame','-q:a','5','-map_metadata','-1',str(out/'rain-window.mp3')],check=True)
p=out/'provenance.json'; data=json.loads(p.read_text()); data['metrics']['rain-window']={'seconds':seconds,'peak_dbfs':round(float(20*np.log10(np.max(np.abs(rain)))),2),'rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(rain**2)))),2),'loop_boundary_delta':float(np.max(np.abs(rain[0]-rain[-1]))),'bytes':(out/'rain-window.mp3').stat().st_size}; data['drizzle_revision']={'date':'2026-09-21','source':'Original synthesized broadband drizzle and filtered air, scripts/render-drizzle.py','seconds':seconds,'peak_dbfs':round(float(20*np.log10(np.max(np.abs(rain)))),2),'score_sha256':hashlib.sha256((out/'somewhere-soft.mp3').read_bytes()).hexdigest()};p.write_text(json.dumps(data,indent=2)+'\n')
print('Drizzle updated; approved score unchanged.')
