// One foreground player at a time. The ambient mix returns when its owner leaves.
let owner = null;
export function claimMedia(id) {
  if (typeof window === "undefined") return;
  owner = id;
  window.dispatchEvent(new CustomEvent("sri:media-owner", { detail: id }));
  window.dispatchEvent(new CustomEvent("sri:music", { detail: true }));
}
export function releaseMedia(id) {
  if (typeof window === "undefined" || owner !== id) return;
  owner = null;
  window.dispatchEvent(new CustomEvent("sri:music", { detail: false }));
}
