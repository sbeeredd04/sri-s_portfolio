"use client";
import SoundPreferences from "./SoundPreferences";
export default function RoomSoundControls({ audio }) {
  return (
    <details className="room-sound-controls">
      <summary>
        <span>
          <small>
            {!audio.enabled
              ? "SOUND OFF"
              : audio.foreground
                ? "BACKGROUND PAUSED FOR YOUR PLAYER"
                : "SOUND ON"}
          </small>
          {audio.place.label}
        </span>
        <span>
          Sound & levels <span aria-hidden="true">⌄</span>
        </span>
      </summary>
      <SoundPreferences audio={audio} scope="room" />
    </details>
  );
}
