"""Original ambient score, without samples. Shares the intro's 900ms pulse.
Render offline so richer music adds no real-time synthesis or scene CPU cost.
"""
from pathlib import Path
import json, subprocess, tempfile, wave
import numpy as np

RATE = 44100
BEAT = .9
SECONDS = BEAT * 64
OUT = Path(__file__).resolve().parents[1] / "public" / "audio"
mix = np.zeros((round(SECONDS * RATE), 2))

def add(at, sound):
    indices = (round(at * RATE) + np.arange(len(sound))) % len(mix)
    mix[indices] += sound

def voice(midi, duration, attack, decay, level, pan=0, warmth=.12):
    t = np.arange(round(duration * RATE)) / RATE
    hz = 440 * 2 ** ((midi - 69) / 12)
    envelope = (1 - np.exp(-t / attack)) * np.exp(-t / decay)
    envelope *= np.clip((duration - t) / .5, 0, 1) ** 2
    tone = np.sin(2*np.pi*hz*t) + warmth*np.sin(2*np.pi*hz*2*t)
    return level * (tone * envelope)[:, None] * np.array([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)])

def bloom(midi, pan):
    t = np.arange(round(22 * RATE)) / RATE
    hz = 440 * 2 ** ((midi - 69) / 12)
    env = (1-np.exp(-t/2.6)) * np.exp(-t/10) * np.clip((22-t)/3,0,1)**2
    channels = []
    for detune in [.999, 1.001]:
        phase = 2*np.pi*hz*detune*t
        tone = np.sin(phase) + .2*np.sin(phase*2) + .075*np.sin(phase*3)
        channels.append(tone*env*.09)
    return np.column_stack(channels) * np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])

# Dm9 / Bbmaj7 / Fmaj9 / Csus2. Each chord breathes across two bars.
chords = [(26, [50,57,60,64]), (22, [53,57,60,65]),
          (29, [53,57,60,67]), (24, [48,55,62,67])]
for bar, (root, notes) in enumerate(chords):
    origin = bar * 16 * BEAT
    for note, pan in zip(notes, [-.6,-.2,.2,.6]):
        add(origin, bloom(note, pan))
    for beat in [0, 4, 8, 12]:
        # Mono sub and its octave give headphones depth and small speakers body.
        add(origin + beat*BEAT, voice(root, 7.2, .18, 3.6, .38, warmth=.25))
    for step, note in enumerate(notes + notes[::-1]):
        add(origin + step*BEAT*2 + .15, voice(note+12, 4.5, .08, 1.6, .075, (-1)**step*.42))
    # A restrained soft downbeat, no bright hats or aggressive EDM transient.
    for beat in [0, 8]:
        t = np.arange(round(.65*RATE)) / RATE
        phase = 2*np.pi*(38*t + 35*.045*(1-np.exp(-t/.045)))
        kick = np.sin(phase)*(1-np.exp(-t/.025))*np.exp(-t/.2)*.065
        add(origin+beat*BEAT, np.column_stack([kick,kick]))

dry = mix.copy()
mix += np.roll(dry[:, ::-1], round(BEAT*.5*RATE), axis=0)*.16
mix += np.roll(dry, round(BEAT*1.5*RATE), axis=0)*.09
mix += np.roll(dry[:, ::-1], round(1.87*RATE), axis=0)*.07
mix -= mix.mean(axis=0)
mix *= .48 / np.max(np.abs(mix))
with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
    with wave.open(tmp.name,"wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(RATE)
        f.writeframes((mix*32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",tmp.name,
                    "-codec:a","libmp3lame","-q:a","4","-map_metadata","-1",str(OUT/"world-thread.mp3")],check=True)
metrics = {"seconds":SECONDS,"beat_seconds":BEAT,
           "peak_dbfs":round(float(20*np.log10(np.max(np.abs(mix)))),2),
           "rms_dbfs":round(float(20*np.log10(np.sqrt(np.mean(mix**2)))),2),
           "loop_boundary_delta":float(np.max(np.abs(mix[0]-mix[-1]))),
           "bytes":(OUT/"world-thread.mp3").stat().st_size}
(OUT/"world-thread.json").write_text(json.dumps({"source":"Original composition and synthesis, scripts/render-world-score.py. No third-party recordings or samples. Separate from Sri's v4.","metrics":metrics},indent=2)+"\n")
print(json.dumps(metrics,indent=2))
