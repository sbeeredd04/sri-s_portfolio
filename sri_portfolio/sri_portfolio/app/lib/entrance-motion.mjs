import { observeEntrance } from "./entrance-diagnostics.mjs";
import { biomeSkins } from "./biome-skins.mjs";

export const entranceChapters = [
  {
    id: "home",
    biome: "studio",
    word: "Home.",
    label: "01 / A place to begin",
  },
  {
    id: "build",
    biome: "projects",
    word: "Build.",
    label: "02 / Ideas into things",
  },
  { id: "play", biome: "court", word: "Play.", label: "03 / Life after hours" },
  {
    id: "wander",
    biome: "trail",
    word: "Wander.",
    label: "04 / A little further out",
  },
  {
    id: "write",
    biome: "future",
    word: "Write.",
    label: "05 / Something to share",
  },
];
export const ENTRANCE_DURATION = 5900;
const beat = 900;
const ease = "cubic-bezier(.65,0,.2,1)";

// Native finite timelines share a start time and pause in hidden tabs.
// No frame loop or animation dependency.
export function playEntrance(root, onComplete) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = [];
  let completed = false;
  let report = () => {};
  const cancel = () => {
    report();
    completed = true;
    animations.forEach((animation) => animation.cancel());
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", preference);
  };
  const finish = () => {
    if (completed) return;
    report();
    completed = true;
    // CSS's settled state replaces these final frames on React's next paint.
    animations.forEach((animation) => {
      animation.onfinish = null;
      animation.finish();
    });
    onComplete();
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", preference);
  };
  function preference(event) {
    if (event.matches) finish();
  }
  function visibility() {
    if (completed) return;
    // Freeze one shared position. Calling play() on finished short effects
    // restarts them; every effect now spans the same finite score instead.
    if (document.hidden) {
      const position = animations[0]?.currentTime ?? 0;
      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = position;
      });
    } else {
      const origin =
        document.timeline.currentTime - (animations[0]?.currentTime ?? 0);
      animations.forEach((animation) => {
        if (animation.playState === "paused") animation.startTime = origin;
      });
    }
  }
  if (media.matches || !root.animate) {
    onComplete();
    return { finish() {}, cancel() {} };
  }
  const animate = (selector, frames, options = {}) => {
    const element = selector ? root.querySelector(selector) : root;
    const animation = element.animate(frames, {
      duration: ENTRANCE_DURATION,
      fill: "both",
      ...options,
    });
    animations.push(animation);
    return animation;
  };
  const at = (ms, frame) => ({ offset: ms / ENTRANCE_DURATION, ...frame });
  const palette = entranceChapters.map(({ biome }) => biomeSkins[biome]);
  const colors = [];
  palette.forEach((skin, i) => {
    const frame = {
      backgroundColor: skin.surface,
      color: skin.ink,
      easing: ease,
    };
    colors.push(at(i * beat, frame), at(i * beat + 540, frame));
  });
  colors.push(
    at(4850, { backgroundColor: palette[0].surface, color: palette[0].ink }),
  );
  colors.push(
    at(ENTRANCE_DURATION, {
      backgroundColor: palette[0].surface,
      color: palette[0].ink,
    }),
  );
  const clock = animate(null, colors);
  clock.onfinish = finish;
  const forms = [
    { rx: "24px", transform: "rotate(0deg)", fill: palette[0].accent },
    { rx: "4px", transform: "rotate(0deg)", fill: palette[1].accent },
    { rx: "48px", transform: "rotate(90deg)", fill: palette[2].accent },
    {
      rx: "48px",
      transform: "rotate(-38deg) scale(.68, 1)",
      fill: palette[3].accent,
    },
    {
      rx: "2px",
      transform: "rotate(-6deg) scale(.78, 1.08)",
      fill: palette[4].accent,
    },
  ];
  const formFrames = [];
  forms.forEach((frame, i) => {
    formFrames.push(
      at(i * beat, { ...frame, easing: ease }),
      at(i * beat + 520, { ...frame, easing: ease }),
    );
  });
  formFrames.push(
    at(5000, {
      rx: "48px",
      transform: "translate(90px, 90px) scale(.25)",
      fill: palette[0].ink,
    }),
  );
  formFrames.push(
    at(ENTRANCE_DURATION, {
      rx: "48px",
      transform: "translate(90px, 90px) scale(.25)",
      fill: palette[0].ink,
    }),
  );
  animate(".entrance-material", formFrames);
  animate(".entrance-object", [
    at(0, {
      opacity: 0,
      transform: "translateY(12px) scale(.88)",
      easing: ease,
    }),
    at(400, { opacity: 1, transform: "none" }),
    at(ENTRANCE_DURATION, { opacity: 1, transform: "none" }),
  ]);
  // Absolute keyframes preserve the hold. An effect-wide easing curve bends
  // offsets too, which made the old 840ms words disappear halfway through.
  const cue = (selector, begin, end, from, to, holdUntil = null) => {
    const frames = [
      at(0, from),
      at(begin, { ...from, easing: ease }),
      at(end, to),
    ];
    if (holdUntil !== null)
      frames.push(
        at(holdUntil, { ...to, easing: ease }),
        at(holdUntil + 160, from),
      );
    frames.push(at(ENTRANCE_DURATION, holdUntil === null ? to : from));
    return animate(selector, frames);
  };
  entranceChapters.forEach((chapter, i) => {
    const begin = i * beat;
    cue(
      `.entrance-chapter-${chapter.id}`,
      begin,
      begin + 150,
      { opacity: 0, transform: "translateY(9px)" },
      { opacity: 1, transform: "translateY(0)" },
      begin + 600,
    );
    cue(
      `.entrance-detail-${chapter.id}`,
      begin,
      begin + 180,
      { opacity: 0 },
      { opacity: 1 },
      begin + 600,
    );
  });
  animate(".entrance-halo", [
    { opacity: 0, transform: "scale(.8)" },
    { opacity: 0.55, transform: "scale(1)", offset: 0.1 },
    { opacity: 0.35, transform: "scale(1.07)", offset: 0.72 },
    { opacity: 0, transform: "scale(.9)" },
  ]);
  cue(".entrance-signature", 4600, 5050, { opacity: 0 }, { opacity: 1 });
  cue(
    ".signature-stroke",
    4700,
    5650,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0 },
  );
  cue(
    ".signature-i-dot",
    5250,
    5600,
    { opacity: 0, transform: "translateY(-4px) scale(.7)" },
    { opacity: 1, transform: "none" },
  );
  cue(
    "#entrance-title",
    5150,
    5650,
    { opacity: 0, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0)" },
  );
  cue(
    ".entrance-description",
    5300,
    5800,
    { opacity: 0, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0)" },
  );
  const origin = document.timeline.currentTime;
  animations.forEach((animation) => {
    animation.startTime = origin;
  });
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", preference);
  visibility();
  report = observeEntrance(root, animations);
  return { finish, cancel };
}
