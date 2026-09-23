"""Original, deterministic detail-room arrangements. No third-party samples.
Keeps the existing world score and Sri's own recording unchanged.
"""
from pathlib import Path
import json, subprocess, tempfile, wave
import numpy as np
R = 32000
SECONDS = 24
OUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
CHORDS = [[50, 57, 61, 64], [47, 54, 57, 62], [43, 50, 54, 57], [45, 52, 57, 59]]
metrics = {}

def add(out, start, sound):
    out[(int(start * R) + np.arange(len(sound))) % len(out)] += sound

def voice(midi, duration, attack, decay, harmonics=.12, pan=0):
    t = np.arange(int(duration * R)) / R
    hz = 440 * 2 ** ((midi - 69) / 12)
    env = (1 - np.exp(-t / attack)) * np.exp(-t / decay)
    env *= np.minimum((duration - t) / .8, 1) ** 2
    base = np.sin(2 * np.pi * hz * t) + harmonics * np.sin(2 * np.pi * hz * 2 * t) + harmonics * .22 * np.sin(2 * np.pi * hz * 3 * t)
    return np.column_stack([base * env * np.sqrt((1 - pan) / 2), base * env * np.sqrt((1 + pan) / 2)])

for name in ['workbench', 'paper-light', 'blue-hour', 'shoreline']:
    out = np.zeros((SECONDS * R, 2))
    for c, chord in enumerate(CHORDS):
        for j, note in enumerate(chord):
            if name == 'workbench':
                # Muted low keys with a small, regular forward motion; no hi-hats.
                add(out, c * 6 + j * .75, voice(note + 12, 5, .018, 1.25, .16, (j - 1.5) * .25) * .35)
                add(out, c * 6 + 3 + j * .5, voice(note, 5, .06, 1.8, .08, (1.5 - j) * .2) * .28)
            elif name == 'paper-light':
                add(out, c * 6 + j * .09, voice(note + 12, 9, .045, 2.4, .11, (j - 1.5) * .2) * .4)
            elif name == 'blue-hour':
                add(out, c * 6, voice(note - (12 if j == 0 else 0), 14, 2.8, 8, .06, (j - 1.5) * .15) * .25)
            else:
                add(out, c * 6 + j * .8, voice(note, 12, 1.8, 6, .08, (j - 1.5) * .3) * .3)
    # Diffused delays remain in the loop rather than being cut at its boundary.
    dry = out.copy()
    out += np.roll(dry, int(.31 * R), axis=0) * .12
    out += np.roll(dry[:, ::-1], int(.73 * R), axis=0) * .09
    out -= out.mean(axis=0)
    out *= .28 / np.max(np.abs(out))
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        with wave.open(tmp.name, 'wb') as f:
            f.setnchannels(2); f.setsampwidth(2); f.setframerate(R)
            f.writeframes((out * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp.name,
            '-codec:a', 'libmp3lame', '-q:a', '5', '-map_metadata', '-1', str(OUT / (name + '.mp3'))], check=True)
    metrics[name] = {'seconds': SECONDS, 'peak_dbfs': round(float(20 * np.log10(np.max(np.abs(out)))), 2),
        'rms_dbfs': round(float(20 * np.log10(np.sqrt(np.mean(out ** 2)))), 2),
        'loop_boundary_delta': float(np.max(np.abs(out[0] - out[-1]))), 'bytes': (OUT / (name + '.mp3')).stat().st_size}
(OUT / 'room-scores.json').write_text(json.dumps({'source': 'Original synthesized arrangements, scripts/render-room-scores.py. No third-party samples; separate from Sri’s v4.', 'metrics': metrics}, indent=2) + '\n')
print(json.dumps(metrics, indent=2))
