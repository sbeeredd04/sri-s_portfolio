export class FakeAudio {
  dataset = {};
  style = {};
  paused = true;
  playCalls = 0;
  attributes = new Map();
  setAttribute(k, v) {
    this.attributes.set(k, v);
  }
  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === "src") this.src = "";
  }
  play() {
    this.playCalls++;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {
    this.loaded = true;
  }
  remove() {
    this.removed = true;
  }
}
