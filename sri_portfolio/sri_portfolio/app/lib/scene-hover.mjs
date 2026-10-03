export const emptyHover = Object.freeze({
  owner: null,
  text: "",
  cursor: "auto",
});

// Include the hit mesh and instance: a late exit from one child/instance must
// not clear a newer hover on another child of the same interactive group.
export function hoverOwner(event) {
  if (!event?.eventObject) return null;
  return `${event.eventObject.uuid}:${event.object?.uuid}:${event.instanceId ?? ""}`;
}

export function nextHover(current, text, event, cursor = "pointer") {
  const owner = hoverOwner(event);
  if (!text) return !owner || owner === current.owner ? emptyHover : current;
  if (event?.pointerType === "touch") return emptyHover;
  if (
    current.owner === owner &&
    current.text === text &&
    current.cursor === cursor
  )
    return current;
  return { owner, text, cursor };
}
