// A disposable probe avoids mounting the scene on browsers that cannot create
// the WebGL2 context required by this version of Three.js.
export function supportsWebGL2(createCanvas) {
  try {
    const canvas = createCanvas();
    const context = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
    });
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
