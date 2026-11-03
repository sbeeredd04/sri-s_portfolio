// Keep return state on the exact history entry, rather than a global "last
// room" that could send Back to a different visit or another browser tab.
export const WORLD_RETURN_KEY = "sriWorldReturnV1";
export const WORLD_ENTERED_KEY = "sri-world-entered-v1";

export function worldReturnState(historyState, url) {
  const saved = historyState?.[WORLD_RETURN_KEY];
  if (
    !saved ||
    saved.url !== url ||
    saved.entered !== true ||
    typeof saved.biome !== "string" ||
    typeof saved.stop !== "string"
  )
    return null;
  return saved;
}

export function withWorldReturn(historyState, snapshot, url) {
  return {
    ...historyState,
    [WORLD_RETURN_KEY]: { ...snapshot, url, entered: true },
  };
}

export function hasEnteredWorld(storage) {
  try {
    return storage.getItem(WORLD_ENTERED_KEY) === "yes";
  } catch {
    return false;
  }
}

export function rememberWorldEntry(storage) {
  try {
    storage.setItem(WORLD_ENTERED_KEY, "yes");
  } catch {
    /* History still restores Back when session storage is unavailable. */
  }
}

// Next's patched native History API synchronizes its canonical URL only for
// external calls. Passing its __NA/_N markers back falsely identifies our
// update as a router-internal write, so a later render restores the old URL.
// Keep application metadata; let Next copy its own current internals back in.
export function replaceWorldHistory(history, url, state = history.state) {
  const custom = { ...(state || {}) };
  for (const key of ["__NA", "_N", "__N", "__PRIVATE_NEXTJS_INTERNALS_TREE"])
    delete custom[key];
  history.replaceState(custom, "", url);
}
