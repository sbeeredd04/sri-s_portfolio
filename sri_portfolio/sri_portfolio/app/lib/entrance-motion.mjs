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
  const cancel = () => {
    completed = true;
    animations.forEach((animation) => animation.cancel());
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", preference);
  };
  const finish = () => {
    if (completed) return;
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
    animations.forEach((animation) =>
      document.hidden ? animation.pause() : animation.play(),
    );
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
  entranceChapters.forEach((chapter, i) => {
    const begin = i * beat;
    animate(
      `.entrance-chapter-${chapter.id}`,
      [
        { opacity: 0, transform: "translateY(15px)" },
        { opacity: 1, transform: "translateY(0)", offset: 0.24 },
        { opacity: 1, transform: "translateY(0)", offset: 0.76 },
        { opacity: 0, transform: "translateY(-12px)" },
      ],
      { delay: begin, duration: 840, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
    animate(
      `.entrance-detail-${chapter.id}`,
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { opacity: 1, offset: 0.86 },
        { opacity: 0 },
      ],
      { delay: begin, duration: 850 },
    );
  });
  animate(".entrance-halo", [
    { opacity: 0, transform: "scale(.8)" },
    { opacity: 0.55, transform: "scale(1)", offset: 0.1 },
    { opacity: 0.35, transform: "scale(1.07)", offset: 0.72 },
    { opacity: 0, transform: "scale(.9)" },
  ]);
  animate(".entrance-signature", [{ opacity: 0 }, { opacity: 1 }], {
    delay: 4600,
    duration: 450,
  });
  animate(
    ".signature-stroke",
    [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
    { delay: 4700, duration: 950, easing: "cubic-bezier(.3,0,.2,1)" },
  );
  animate(
    ".signature-i-dot",
    [
      { opacity: 0, transform: "translateY(-4px) scale(.7)" },
      { opacity: 1, transform: "none" },
    ],
    { delay: 5250, duration: 350, easing: ease },
  );
  for (const selector of ["#entrance-title", ".entrance-description"]) {
    animate(
      selector,
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        delay: selector === "#entrance-title" ? 5150 : 5300,
        duration: 500,
        easing: ease,
      },
    );
  }
  const origin = document.timeline.currentTime;
  animations.forEach((animation) => {
    animation.startTime = origin;
  });
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", preference);
  visibility();
  return { finish, cancel };
}
