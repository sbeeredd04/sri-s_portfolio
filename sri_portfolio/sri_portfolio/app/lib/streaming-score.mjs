// Long music streams through the browser's media pipeline instead of keeping
// entire decoded tracks in memory. Reuse one element across destinations so
// Safari retains the user's playback activation. Gain stays in the shared mix.
export class StreamingScore {
  constructor(context, destination, createAudio = () => new Audio()) {
    this.audio = createAudio();
    this.audio.preload = "auto";
    this.audio.loop = true;
    this.audio.setAttribute("playsinline", "");
    this.audio.setAttribute("aria-hidden", "true");
    this.audio.dataset.sriScore = "";
    this.audio.style.display = "none";
    if (typeof document !== "undefined") document.body.appendChild(this.audio);
    this.gain = context.createGain();
    this.gain.gain.value = 0;
    this.source = context.createMediaElementSource(this.audio);
    this.source.connect(this.gain).connect(destination);
    this.disposed = false;
    this.enabled = false;
    this.track = null;
    this.pending = null;
  }
  select(track, enabled) {
    if (this.disposed) return;
    this.enabled = enabled;
    if (track !== this.track) {
      this.track = track;
      this.audio.src = `/audio/${track}.mp3`;
    }
    if (!enabled) this.audio.pause();
  }
  play() {
    if (this.disposed || !this.enabled) return Promise.resolve(false);
    // Invoke play immediately, not after an asset fetch or resume promise.
    if (!this.audio.paused) return Promise.resolve(true);
    let playing;
    try {
      playing = this.audio.play();
    } catch (error) {
      return Promise.reject(error);
    }
    this.pending = Promise.resolve(playing).then(() => !this.audio.paused);
    this.pending.catch(() => {});
    return this.pending;
  }
  pause() {
    this.audio.pause();
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio.remove();
    this.source.disconnect();
    this.gain.disconnect();
  }
}
