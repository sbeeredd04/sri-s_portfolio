"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SoundEngine } from "../../lib/sound-engine.mjs";
import {
  listenForAudioActivation,
  tryAudioAutoplay,
} from "../../lib/audio-activation.mjs";
import {
  sensoryDefaults,
  sensoryPreferences,
  hapticPulse,
  soundPlaces,
  soundDestination,
} from "../../lib/sensory-design.mjs";

// Browsers log an intervention when vibrate() runs before the first gesture.
function cancelVibration() {
  if (navigator.userActivation?.hasBeenActive === false) return;
  navigator.vibrate?.(0);
}

const storageKey = "sri-sensory-preferences-v1";
export default function useSoundscape(
  biome,
  section = null,
  detail = null,
  weather = null,
  { autoStart = true } = {},
) {
  const reading = Boolean(section);
  const destination = soundDestination(biome, section, detail);
  const engine = useRef(null),
    live = useRef(true);
  const [status, setStatus] = useState("off"),
    statusRef = useRef("off");
  const [preferences, setPreferences] = useState(sensoryDefaults);
  const settings = useRef(sensoryDefaults);
  const [touchAvailable, setTouchAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [foreground, setForeground] = useState(false);
  const tactile = useRef({
    supported: false,
    reducedMotion: false,
    last: -Infinity,
  });
  const focus = useRef({ reading, music: false });
  const intro = useRef({ playing: false, position: 0, at: 0 });
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const place = useRef(destination);
  place.current = destination;
  focus.current.reading = reading;

  const changeStatus = useCallback((value) => {
    statusRef.current = value;
    if (live.current) setStatus(value);
  }, []);
  const stop = useCallback((immediate = false) => {
    const current = engine.current;
    engine.current = null;
    current?.destroy(immediate);
  }, []);
  const pulse = useCallback((kind) => {
    const now = performance.now();
    const duration = hapticPulse(kind, {
      ...tactile.current,
      enabled: settings.current.haptics,
      strength: settings.current.hapticStrength,
      hidden: document.hidden,
      now,
    });
    if (!duration) return;
    tactile.current.last = now;
    try {
      if (navigator.userActivation?.hasBeenActive !== false)
        navigator.vibrate(duration);
    } catch {
      /* Sound and press motion remain available. */
    }
  }, []);
  const cue = useCallback(
    (kind = "press", options) => {
      pulse(kind);
      engine.current?.cue(kind, options);
    },
    [pulse],
  );
  const setPreference = useCallback(
    (key, value) => {
      const next = sensoryPreferences({ ...settings.current, [key]: value });
      settings.current = next;
      setPreferences(next);
      engine.current?.update({ preferences: next });
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      if (key === "haptics") {
        if (next.haptics) pulse("press");
        else {
          try {
            cancelVibration();
          } catch {}
        }
      }
    },
    [pulse],
  );
  const start = useCallback(
    async (arrivalCue = "press", automatic = false) => {
      if (engine.current) return true;
      stop(true);
      let current, context;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error("Audio is unavailable.");
        context = new AudioContext();
        // A blocked autoplay attempt must not leave resume() pending forever or
        // make the UI claim it is playing. The first gesture retries normally.
        if (automatic) {
          if (!(await tryAudioAutoplay(context))) return false;
          // A gesture, mute, or navigation may have won while autoplay waited.
          if (!live.current || !settings.current.enabled || engine.current) {
            await context.close();
            return false;
          }
        }
        current = new SoundEngine(context, {
          place: place.current,
          preferences: settings.current,
          weather: weatherRef.current,
          ...focus.current,
          onError: () => {
            if (engine.current !== current) return;
            stop(true);
            changeStatus("error");
          },
        });
        engine.current = current;
        changeStatus("starting");
        context.onstatechange = () => {
          if (
            engine.current !== current ||
            document.hidden ||
            current.hidden ||
            statusRef.current === "starting"
          )
            return;
          if (context.state !== "running") {
            stop(true);
            changeStatus("error");
          }
        };
        // Resume in the actual click gesture, before awaiting any asset fetch.
        await context.resume();
        if (engine.current !== current || !live.current) return false;
        if (context.state !== "running" && !document.hidden)
          throw new Error("Audio needs another tap to start.");
        if (intro.current.playing) {
          current.introduction({
            playing: true,
            position:
              intro.current.position + performance.now() - intro.current.at,
          });
        }
        if (arrivalCue) current.cue(arrivalCue);
        await current.prepare();
        if (engine.current !== current || !live.current) return;
        if (document.hidden) await current.setHidden(true);
        changeStatus("on");
        return true;
      } catch {
        if (current && engine.current !== current) return;
        stop(true);
        if (!current) context?.close().catch(() => {});
        changeStatus("error");
        return false;
      }
    },
    [stop, changeStatus, pulse],
  );

  const enable = useCallback(
    (arrivalCue = "welcome") => {
      setPreference("enabled", true);
      return start(arrivalCue);
    },
    [setPreference, start],
  );
  const introduction = useCallback((state) => {
    intro.current = { ...state, at: performance.now() };
    engine.current?.introduction(state);
  }, []);
  const disable = useCallback(() => {
    setPreference("enabled", false);
    stop();
    changeStatus("off");
  }, [setPreference, stop, changeStatus]);

  const toggle = useCallback(() => {
    pulse("press");
    if (engine.current && statusRef.current !== "error") {
      setPreference("enabled", false);
      stop();
      changeStatus("off");
    } else {
      setPreference("enabled", true);
      start();
    }
  }, [start, stop, changeStatus, setPreference, pulse]);

  useEffect(() => {
    live.current = true;
    try {
      const saved = sensoryPreferences(
        JSON.parse(localStorage.getItem(storageKey)),
      );
      settings.current = saved;
      setPreferences(saved);
    } catch {}
    changeStatus(settings.current.enabled ? "ready" : "off");
    // Try on every entry route, including a return from a full reading page.
    // A saved mute wins; a browser-blocked attempt waits for activation below.
    if (autoStart && settings.current.enabled) start(null, true);
    const beginOnGesture = (event) => {
      const inIntro = Boolean(event.target.closest?.(".world-loader"));
      if (
        !autoStart ||
        !settings.current.enabled ||
        engine.current ||
        event.target.closest?.("[data-audio-control],input,textarea") ||
        (!inIntro && event.target.closest?.("[data-quiet]"))
      )
        return;
      start(inIntro ? null : "press");
    };
    const removeActivation = listenForAudioActivation(window, beginOnGesture);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(any-pointer: coarse)");
    const device = () => {
      const supported =
        typeof navigator.vibrate === "function" &&
        coarse.matches &&
        navigator.maxTouchPoints > 0;
      tactile.current.supported = supported;
      tactile.current.reducedMotion = motion.matches;
      setTouchAvailable(supported);
      setReducedMotion(motion.matches);
      if (motion.matches) {
        try {
          cancelVibration();
        } catch {}
      }
    };
    device();
    motion.addEventListener("change", device);
    coarse.addEventListener("change", device);
    const visibility = () => {
      if (document.hidden) {
        try {
          cancelVibration();
        } catch {}
      }
      const current = engine.current;
      current?.setHidden(document.hidden).catch(() => {
        if (engine.current === current) {
          stop(true);
          changeStatus("error");
        }
      });
    };
    const music = (event) => {
      focus.current.music = Boolean(event.detail);
      setForeground(focus.current.music);
      engine.current?.update(focus.current);
    };
    const pagehide = () => {
      stop(true);
      changeStatus("off");
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("sri:music", music);
    window.addEventListener("pagehide", pagehide);
    return () => {
      live.current = false;
      removeActivation();
      motion.removeEventListener("change", device);
      coarse.removeEventListener("change", device);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("sri:music", music);
      window.removeEventListener("pagehide", pagehide);
      try {
        cancelVibration();
      } catch {}
      stop(true);
    };
  }, [stop, changeStatus, start, autoStart]);
  useEffect(() => {
    engine.current?.update({ place: destination, ...focus.current });
  }, [destination, reading]);
  useEffect(() => {
    engine.current?.update({ weather: weatherRef.current });
  }, [weather?.kind, weather?.rain]);

  const press = useCallback(
    (event) => {
      const control = event.target.closest?.("button, a, summary");
      if (
        !control ||
        control.closest("[data-quiet]") ||
        control.matches('[aria-disabled="true"], :disabled, [data-quiet]')
      )
        return;
      // Semantic cues run first in the target handler; the engine coalesces this
      // fallback so each click has one sound and at most one tactile pulse.
      cue("press");
    },
    [cue],
  );
  useEffect(() => {
    // Shared by world, standalone rooms and articles. Existing semantic handlers
    // fire first; the engine suppresses the bubbling fallback for the same click.
    const click = (event) => {
      if (event.target.closest?.("[data-quiet]")) return;
      const control = event.target.closest?.("button,a,summary");
      if (control && !control.matches(":disabled,[aria-disabled='true']"))
        cue(control.dataset.sound || "press");
    };
    const type = (event) => {
      if (event.inputType !== "insertText" || event.isComposing) return;
      if (
        event.target.matches?.("input:not([type=password]),textarea") &&
        !event.target.closest("[data-quiet]")
      )
        cue("type");
    };
    const hover = (event) => {
      if (event.pointerType !== "mouse") return;
      const control = event.target.closest?.("button,a,summary");
      if (
        !control ||
        control.contains(event.relatedTarget) ||
        control.closest("[data-quiet]") ||
        control.matches(":disabled")
      )
        return;
      cue("hover");
    };
    window.addEventListener("click", click);
    window.addEventListener("input", type);
    window.addEventListener("pointerover", hover);
    return () => {
      window.removeEventListener("click", click);
      window.removeEventListener("input", type);
      window.removeEventListener("pointerover", hover);
    };
  }, [cue]);
  return {
    enabled: status === "starting" || status === "on",
    error: status === "error",
    status,
    preferences,
    touchAvailable,
    reducedMotion,
    foreground,
    place: soundPlaces[destination] || soundPlaces.planet,
    toggle,
    enable,
    introduction,
    disable,
    cue,
    press,
    setPreference,
  };
}
