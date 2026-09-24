// Terminals ask the shell to act through one window event, so the "/" bar
// and the Discoveries console share a single path into navigation.
export const COMMAND_EVENT = "sri:command";

export function dispatchCommandAction(action) {
  if (typeof window === "undefined" || !action) return;
  window.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: action }));
}
