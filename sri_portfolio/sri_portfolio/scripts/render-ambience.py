"""Original, deterministic ambience for Sri's world. Requires numpy and ffmpeg.
No samples or melodies from third-party recordings. Audio starts only on request.
"""
from pathlib import Path
import json, subprocess, tempfile, wave
import numpy as np

RATE = 32000
OUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
RNG = np.random.default_rng(4312)
metrics = {}

def write(name, samples, peak):
    samples = samples - np.mean(samples, axis=0)
    samples *= peak / max(np.max(np.abs(samples)), 1e-9)
    with tempfile.NamedTemporaryFile(suffix='.wav') as temp:
        with wave.open(temp.name, 'wb') as wav:
            wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(RATE)
            wav.writeframes((samples * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', temp.name,
            '-codec:a', 'libmp3lame', '-q:a', '5', '-map_metadata', '-1',
            '-metadata', 'title=' + name.replace('-', ' '),
            '-metadata', 'comment=Original synthesized ambience for Sri\u2019s world',
            str(OUT / (name + '.mp3'))], check=True)
    metrics[name] = {'seconds': len(samples)/RATE, 'peak_dbfs': round(20*np.log10(np.max(np.abs(samples))), 2),
        'rms_dbfs': round(20*np.log10(np.sqrt(np.mean(samples**2))), 2),
        'loop_boundary_delta': float(np.max(np.abs(samples[0]-samples[-1]))),
        'bytes': (OUT/(name+'.mp3')).stat().st_size}

def add(out, start, sound):
    idx = (int(start*RATE) + np.arange(len(sound))) % len(out)
    out[idx] += sound

# Slow suspended voicings: Dmaj9, Bm7, Gmaj9, Asus2. Long releases overlap.
out = np.zeros((48*RATE,2))
chords = [[50,57,61,64,69], [47,54,57,62,66], [43,50,54,57,62], [45,52,57,59,64]]
for c, chord in enumerate(chords):
    t = np.arange(20*RATE)/RATE
    env = np.minimum(t/3.5, 1)**2 * np.minimum((20-t)/8, 1)**2
    for n, midi in enumerate(chord):
        hz = 440*2**((midi-69)/12)
        for channel in range(2):
            cents = (-1 if channel == 0 else 1)*(2.2+n*.5)
            f = hz * 2**(cents/1200)
            tone = np.sin(2*np.pi*f*t + n*.8) + .11*np.sin(2*np.pi*f*2*t + .4)
            tone *= env * (.034 if n else .048) * (1 + .035*np.sin(2*np.pi*t/7 + channel))
            add(out[:,channel], c*12, tone)
# Four sparse felt-like glints, no drum loop or vocal hook.
for start, midi in [(6,69),(19,66),(31,71),(42,64)]:
    t = np.arange(6*RATE)/RATE
    hz = 440*2**((midi-69)/12)
    tone = (np.sin(2*np.pi*hz*t) + .12*np.sin(2*np.pi*hz*3*t))*np.exp(-t*1.05)*np.minimum(t/.035,1)*.018
    for channel in range(2):
        add(out[:,channel], start+channel*.012, tone)
        for delay, level in [(.27,.28),(.71,.15),(1.37,.07)]: add(out[:,channel], start+delay, tone*level)
write('somewhere-soft',out,.43)

def noise(seconds, low, high, slope):
    n = seconds*RATE
    f = np.fft.rfftfreq(n,1/RATE)
    shape = (np.maximum(f,1)/400)**slope / (1+(f/high)**4) * (1-np.exp(-(f/low)**2))
    shape[0] = 0
    data = np.zeros((n,2))
    for ch in range(2):
        phase = RNG.uniform(0,2*np.pi,len(f))
        a = np.fft.irfft(shape*np.exp(1j*phase),n)
        data[:,ch] = a/np.std(a)
    t=np.arange(n)/RATE
    return data, t

rain,t = noise(12,90,7200,-.12)
rain *= (.56+.06*np.sin(2*np.pi*t/12)+.035*np.sin(2*np.pi*t/3))[:,None]
# Quiet, scattered droplets on glass, softened with a short attack.
for i in range(110):
    length=int(RNG.uniform(.025,.085)*RATE); d=np.arange(length)/RATE
    hit=RNG.normal(0,.3,length)*np.exp(-d*65)*np.minimum(d/.004,1)
    add(rain[:,i%2],RNG.uniform(0,12),hit)
write('rain-window',rain,.38)
air,t = noise(12,45,1350,-.45)
air *= (.38+.12*np.sin(2*np.pi*t/12)+.05*np.sin(2*np.pi*t/4))[:,None]
write('open-air',air,.32)
water,t = noise(12,140,4200,-.18)
water *= (.48+.11*np.sin(2*np.pi*t/4)+.04*np.sin(2*np.pi*t/1.5))[:,None]
# A broad shore wash rather than repeated isolated splash effects.
write('lakeside',water,.34)
room,t = noise(8,60,520,-.7)
room *= (.3+.03*np.sin(2*np.pi*t/8))[:,None]
write('quiet-room',room,.28)
(OUT/'provenance.json').write_text(json.dumps({'created':'2026-09-15','source':'Original procedural composition and synthesized environmental textures, rendered by scripts/render-ambience.py. No third-party samples. Separate from Sri\u2019s v4 recording.','metrics':metrics},indent=2)+'\n')
print(json.dumps(metrics,indent=2))
