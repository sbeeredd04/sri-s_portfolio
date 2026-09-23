import {
  exhibitCanvas,
  exhibitStep,
  projectExhibits,
} from "./project-exhibits.mjs";

import {
  ink,
  muted,
  glacier,
  lavender,
  panel,
  text,
  link,
} from "./exhibit-painter.mjs";
import { additionalExhibitArt } from "./exhibit-stories-art.mjs";

function aether(c, state, font) {
  const branch = state !== "question",
    explore = state === "explore",
    belong = state === "belong";
  text(
    c,
    "One question. Two possible directions.",
    48,
    139,
    39,
    font,
    ink,
    600,
  );
  // An original prompt stays visible through every branch selection.
  panel(c, 326, 185, 628, 146, "#223245", 24, "#4d6178");
  text(c, "THE ORIGINAL QUESTION", 358, 224, 18, font, glacier, 650);
  text(c, "What could I build for a new city?", 358, 274, 30, font);
  link(c, 578, 331, 328, 407, explore ? glacier : "#4c6277", explore);
  link(c, 702, 331, 952, 407, belong ? lavender : "#4c6277", belong);
  panel(
    c,
    70,
    407,
    516,
    200,
    explore ? "#c9e0ef" : "#1c2b3b",
    24,
    explore ? "#e0f0fa" : "#425568",
  );
  panel(
    c,
    694,
    407,
    516,
    200,
    belong ? "#d4c7eb" : "#1c2b3b",
    24,
    belong ? "#ece2fa" : "#425568",
  );
  text(
    c,
    "01 / EXPLORE",
    100,
    451,
    20,
    font,
    explore ? "#3f5b72" : glacier,
    650,
  );
  text(
    c,
    "A city worth wandering.",
    100,
    497,
    30,
    font,
    explore ? "#142d44" : ink,
    600,
  );
  text(
    c,
    explore
      ? "A small map of unexpected places."
      : "Follow the places you haven’t found.",
    100,
    550,
    23,
    font,
    explore ? "#425d74" : muted,
  );
  text(
    c,
    "02 / BELONG",
    724,
    451,
    20,
    font,
    belong ? "#5d4f77" : lavender,
    650,
  );
  text(
    c,
    "A place to feel at home.",
    724,
    497,
    30,
    font,
    belong ? "#352945" : ink,
    600,
  );
  text(
    c,
    belong
      ? "A way to find a familiar little ritual."
      : "Follow the feeling you’re looking for.",
    724,
    550,
    23,
    font,
    belong ? "#665780" : muted,
  );
  text(
    c,
    branch
      ? "A new direction. The original thread stays yours."
      : "Choose a direction below. You can always come back.",
    70,
    667,
    24,
    font,
    branch ? ink : muted,
  );
}

function gitcue(c, state, font) {
  const titles = {
    changes: "A change worth remembering.",
    pause: "Room to finish the thought.",
    commit: "A useful note to your future self.",
  };
  text(c, titles[state], 48, 139, 39, font, ink, 600);
  panel(c, 48, 188, 740, 482, "#182535", 24, "#36495f");
  panel(c, 808, 188, 424, 482, "#202d40", 24, "#3d4d65");
  if (state === "changes") {
    text(c, "EXAMPLE / navigation.css", 80, 234, 19, font, muted, 650);
    text(c, "A little more room to tap.", 80, 290, 30, font, ink, 600);
    panel(c, 72, 330, 690, 74, "#3c2934", 12);
    panel(c, 72, 420, 690, 74, "#24413e", 12);
    text(c, "−  min-height: 32px;", 96, 377, 28, "monospace", "#e1afb9");
    text(c, "+  min-height: 44px;", 96, 468, 28, "monospace", "#b9dfcb");
    text(c, "1 file changed", 80, 562, 24, font, muted);
    text(c, "The diff is the starting point.", 80, 615, 26, font, glacier);
    text(c, "01 / NOTICE", 844, 238, 19, font, glacier, 650);
    text(c, "Look at the work.", 844, 309, 28, font, ink, 600);
    [
      "What changed?",
      "Which files belong together?",
      "Is there enough to describe?",
    ].forEach((line, i) => text(c, line, 844, 385 + i * 62, 23, font, muted));
  } else if (state === "pause") {
    text(c, "EXAMPLE / ACTIVITY", 80, 234, 19, font, muted, 650);
    text(c, "Still building? Keep going.", 80, 290, 30, font, ink, 600);
    const heights = [
      16, 44, 75, 39, 92, 53, 28, 77, 48, 23, 66, 40, 12, 8, 8, 8, 8, 8, 8, 8,
    ];
    heights.forEach((h, i) =>
      panel(c, 92 + i * 32, 452 - h, 13, h, i < 12 ? glacier : "#55627a", 6),
    );
    text(c, "Editing", 91, 494, 22, font, muted);
    text(c, "A quiet moment", 494, 494, 22, font, lavender);
    text(c, "New edits can cancel the pending commit.", 80, 575, 25, font, ink);
    text(c, "The timing is configurable.", 80, 621, 23, font, muted);
    text(c, "02 / SETTLE", 844, 238, 19, font, lavender, 650);
    text(c, "Wait for a pause.", 844, 309, 28, font, ink, 600);
    [
      "Related changes can settle.",
      "A buffer keeps the work open.",
      "You set the pace.",
    ].forEach((line, i) => text(c, line, 844, 385 + i * 62, 23, font, muted));
  } else {
    text(c, "EXAMPLE / PROJECT HISTORY", 80, 234, 19, font, muted, 650);
    c.beginPath();
    c.moveTo(109, 306);
    c.lineTo(109, 591);
    c.strokeStyle = "#607b91";
    c.lineWidth = 4;
    c.stroke();
    for (const [y, active] of [
      [333, true],
      [452, false],
      [563, false],
    ]) {
      c.beginPath();
      c.arc(109, y, active ? 12 : 8, 0, Math.PI * 2);
      c.fillStyle = active ? "#c4ddcf" : "#6a8095";
      c.fill();
    }
    text(
      c,
      "style: improve navigation tap targets",
      144,
      332,
      25,
      font,
      ink,
      600,
    );
    text(c, "1 file · 1 addition · 1 deletion", 144, 373, 23, font, muted);
    text(c, "Add the project collection", 144, 458, 24, font, muted);
    text(c, "Start with an idea", 144, 569, 24, font, muted);
    text(c, "03 / REMEMBER", 844, 238, 19, font, "#c4ddcf", 650);
    text(c, "Leave a useful trail.", 844, 309, 28, font, ink, 600);
    [
      "A message tied to the diff.",
      "A smaller chore to carry.",
      "History you can return to.",
    ].forEach((line, i) => text(c, line, 844, 385 + i * 62, 23, font, muted));
  }
}

export function drawExhibit(c, id, value, font) {
  const { width, height } = exhibitCanvas,
    step = exhibitStep(id, value),
    exhibit = projectExhibits[id];
  c.clearRect(0, 0, width, height);
  const background = c.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, id === "mesa" ? "#e1d2b9" : "#142232");
  background.addColorStop(1, id === "mesa" ? "#f3e8d4" : "#0e1727");
  c.fillStyle = background;
  c.fillRect(0, 0, width, height);
  text(c, exhibit.name, 48, 63, 30, font, id === "mesa" ? "#443b32" : ink, 650);
  text(
    c,
    "AN INTERACTIVE SKETCH",
    902,
    60,
    19,
    font,
    id === "mesa" ? "#776854" : muted,
    550,
  );
  if (id === "aether") aether(c, step.id, font);
  else if (id === "gitcue") gitcue(c, step.id, font);
  else additionalExhibitArt[id]?.(c, step.id, font);
  exhibit.steps.forEach((item, i) => {
    const selected = item.id === step.id,
      x = 48 + i * 402;
    panel(
      c,
      x,
      732,
      378,
      72,
      id === "mesa"
        ? selected
          ? "#665039"
          : "#d5c5aa"
        : selected
          ? "#d5e5f1"
          : "#243549",
      36,
      id === "mesa" ? "#a89172" : selected ? "#edf6ff" : "#43546b",
    );
    text(
      c,
      `0${i + 1}   ${item.label}`,
      x + 24,
      776,
      24,
      font,
      id === "mesa"
        ? selected
          ? "#fff5e3"
          : "#504330"
        : selected
          ? "#20384e"
          : "#c6d4e5",
      selected ? 650 : 450,
    );
  });
}
