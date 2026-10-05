// Touch and pen gain browser activation on release, unlike a mouse. Starting
// on touch pointerdown can leave AudioContext.resume() suspended indefinitely.
export function listenForAudioActivation(target, start) {
  const activate = (event) => {
    if (!event.isTrusted) return;
    const eligible =
      (event.type === "pointerdown" && event.pointerType === "mouse") ||
      (event.type === "pointerup" &&
        ["touch", "pen"].includes(event.pointerType)) ||
      (event.type === "keydown" && ["Enter", " "].includes(event.key));
    if (eligible) start(event);
  };
  const events = ["pointerdown", "pointerup", "keydown"];
  // Capture also reaches interactions whose scene handler stops propagation.
  for (const name of events) target.addEventListener(name, activate, true);
  return () => {
    for (const name of events) target.removeEventListener(name, activate, true);
  };
}
// A newly created context can be suspended briefly even when autoplay is
// permitted. Give resume() a bounded chance; blocked contexts never linger.
export async function tryAudioAutoplay(context, timeoutMs = 600) {
  let timer;
  try {
    const running = await Promise.race([
      context.resume().then(() => context.state === "running"),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
    if (running) return true;
  } catch {
    // Rejected autoplay uses the same first-interaction fallback.
  } finally {
    clearTimeout(timer);
  }
  await context.close().catch(() => {});
  return false;
}
