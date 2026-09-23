"use client";
import "./walking.css";
const send = (detail) =>
  window.dispatchEvent(new CustomEvent("sri:walk", { detail }));
export default function WalkingControls({
  status,
  roof,
  paused,
  onExit,
  onOutside,
  onRead,
}) {
  const names = {
    studio: "Home",
    trail: "Outdoors",
    court: "After hours",
    entertainment: "Listening house",
    projects: "The Foundry",
    future: "Fieldnotes",
  };
  const connection = status.connection
    ?.split(":")
    .map((id) => names[id])
    .join(" ↔ ");
  const hold = (key, label, icon) => (
    <button
      type="button"
      aria-label={label}
      disabled={paused}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        send({ key, down: true });
      }}
      onPointerUp={() => send({ key, down: false })}
      onPointerCancel={() => send({ key, down: false })}
      onLostPointerCapture={() => send({ key, down: false })}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          send({ key, down: true });
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          send({ key, down: false });
        }
      }}
      onBlur={() => send({ key, down: false })}
    >
      {icon}
    </button>
  );
  return (
    <div className="walking-controls">
      <div className="walking-heading">
        <p className="eyebrow">YOUR LITTLE WALK</p>
        <span>{status.distance || 0} m</span>
      </div>
      <p className="walking-help">
        W / S to walk · A / D to turn. Arrow keys work too.
      </p>
      <div className="walking-row">
        <div
          className="walking-pad"
          role="group"
          aria-label="Hold to walk or turn"
        >
          {hold("a", "Turn left", "↶")}
          {hold("w", "Walk forward", "↑")}
          {hold("s", "Walk backward", "↓")}
          {hold("d", "Turn right", "↷")}
        </div>
        <button
          className="walking-cruise"
          aria-pressed={!!status.cruise}
          disabled={paused}
          onClick={() => send({ toggle: true })}
        >
          {status.cruise ? "Stop walking" : "Walk ahead"}
        </button>
      </div>
      <p className="walking-status" aria-live="polite">
        {paused
          ? "Walking paused. Resume motion in View & sound."
          : roof
            ? "Around the apartment. Drag to look around."
            : connection
              ? `${connection}. Follow the connecting path.`
              : "Follow the paths. Drag to look around."}
      </p>
      <div className="walking-actions">
        <button onClick={onExit}>See the place ↗</button>
        <button onClick={onRead}>
          {roof ? "My work" : "Read this place"} ↗
        </button>
        {roof && <button onClick={onOutside}>Walk outside ↗</button>}
      </div>
    </div>
  );
}
