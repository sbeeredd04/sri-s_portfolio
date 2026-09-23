"use client";
import { useId } from "react";

function Toggle({ title, detail, checked, onClick, unavailable = false }) {
  return (
    <button
      className="sensory-option"
      aria-pressed={checked}
      aria-disabled={unavailable || undefined}
      onClick={() => {
        if (!unavailable) onClick();
      }}
    >
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <i className="sensory-switch" aria-hidden="true" />
    </button>
  );
}

export default function SoundPreferences({ audio, scope = "world" }) {
  const volumeId = useId();
  return (
    <section className="sound-preferences" aria-label="Sound and touch">
      <div className="sensory-heading">
        <p className="eyebrow">A LITTLE ATMOSPHERE</p>
        <h2>{audio.place.label}</h2>
        <p>{audio.place.description}</p>
      </div>
      <button
        className="sensory-power"
        aria-pressed={audio.enabled}
        onClick={audio.toggle}
        data-quiet
      >
        <span className="sound-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          {audio.status === "starting"
            ? "Preparing the atmosphere…"
            : audio.error
              ? "Try sound again"
              : audio.enabled
                ? "Sound is on"
                : `Listen to this ${scope}`}
        </span>
        <small>
          {audio.status === "starting"
            ? "Cancel"
            : audio.enabled
              ? "Mute"
              : "Play"}
        </small>
      </button>
      {audio.status === "ready" && (
        <p className="sensory-error">
          Sound begins with your first tap. Your mute setting is remembered.
        </p>
      )}
      {audio.error && (
        <p className="sensory-error" role="status">
          Sound couldn’t start. Tap to try again.
        </p>
      )}
      {[
        ["volume", "Master volume"],
        ["musicLevel", "Music"],
        ["environmentLevel", "Environment"],
        ["effectsLevel", "Interaction sounds"],
        ...(audio.touchAvailable ? [["hapticStrength", "Touch strength"]] : []),
      ].map(([key, label]) => (
        <div className="sensory-volume" key={key}>
          <label htmlFor={`${volumeId}-${key}`}>
            {label} <output>{Math.round(audio.preferences[key] * 100)}%</output>
          </label>
          <input
            id={`${volumeId}-${key}`}
            aria-label={label}
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(audio.preferences[key] * 100)}
            disabled={
              key === "hapticStrength" &&
              (audio.reducedMotion || !audio.preferences.haptics)
            }
            onChange={(e) =>
              audio.setPreference(key, Number(e.target.value) / 100)
            }
            style={{ "--volume": `${audio.preferences[key] * 100}%` }}
          />
        </div>
      ))}
      <Toggle
        title="Ambient score"
        detail="A musical mood for where you are"
        checked={audio.preferences.music}
        onClick={() => audio.setPreference("music", !audio.preferences.music)}
      />
      <Toggle
        title="Interaction sounds"
        detail="Little cues as you explore"
        checked={audio.preferences.effects}
        onClick={() =>
          audio.setPreference("effects", !audio.preferences.effects)
        }
      />
      {audio.touchAvailable ? (
        <Toggle
          title="Touch feedback"
          detail={
            audio.reducedMotion
              ? "Off while Reduce Motion is enabled"
              : "A light tap for your actions"
          }
          checked={audio.preferences.haptics && !audio.reducedMotion}
          unavailable={audio.reducedMotion}
          onClick={() =>
            audio.setPreference("haptics", !audio.preferences.haptics)
          }
        />
      ) : (
        <div className="sensory-availability">
          <strong>Touch feedback</strong>
          <small>Available on supported phones.</small>
        </div>
      )}
    </section>
  );
}
