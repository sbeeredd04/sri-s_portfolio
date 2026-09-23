import {
  ink,
  muted,
  glacier,
  lavender,
  panel,
  text,
  link,
} from "./exhibit-painter.mjs";
const sage = "#b5d4c5",
  warm = "#dcc2a0";
function lines(c, words, x, y, font, color = muted, size = 24, gap = 43) {
  words.forEach((word, i) => text(c, word, x, y + i * gap, size, font, color));
}
function rule(c, points, color, width = 3) {
  c.beginPath();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = "round";
  c.lineCap = "round";
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
function agentex(c, state, font) {
  text(
    c,
    "The same person. A clearer introduction.",
    48,
    139,
    37,
    font,
    ink,
    600,
  );
  panel(c, 48, 190, 472, 490, "#1d2d35", 24, "#435e5b");
  text(c, "EXAMPLE / ROLE CONTEXT", 80, 234, 18, font, sage, 650);
  text(c, "Interfaces & interaction", 80, 287, 28, font, ink, 650);
  lines(
    c,
    [
      "Build thoughtful interfaces.",
      "Make complex ideas legible.",
      "Care about the smallest detail.",
    ],
    80,
    350,
    font,
  );
  text(c, "EXISTING EXPERIENCE", 80, 526, 18, font, sage, 650);
  lines(
    c,
    [
      "Museum exhibit · React + Three.js",
      "Interface design · a physical kiosk",
    ],
    80,
    579,
    font,
    ink,
    21,
    39,
  );
  panel(c, 550, 190, 682, 490, "#202d3e", 24, "#42556a");
  if (state === "context") {
    text(c, "YOUR SOURCE MATERIAL", 584, 236, 18, font, glacier, 650);
    panel(c, 598, 273, 238, 322, "#d6ddd7", 12);
    panel(c, 855, 293, 327, 281, "#2c3d4c", 12, "#526273");
    text(c, "Original resume", 620, 316, 21, font, "#2c4140", 650);
    [101, 151, 125, 139, 85, 142].forEach((w, i) =>
      panel(c, 620, 347 + i * 32, w, 5, "#829b92", 2),
    );
    text(c, "Job description", 878, 340, 23, font, sage, 600);
    lines(
      c,
      ["Relevant work", "Role context", "Personal knowledge"],
      878,
      393,
      font,
      muted,
      21,
      45,
    );
    text(c, "Begin with what is already true.", 584, 642, 25, font, sage);
  } else if (state === "draft") {
    text(c, "TAILORED DRAFT / EXAMPLE", 584, 236, 18, font, sage, 650);
    text(c, "Museum exhibit", 584, 300, 31, font, ink, 600);
    panel(c, 577, 330, 618, 133, "#30473f", 14);
    lines(
      c,
      [
        "Designed a React and Three.js experience",
        "that connects a 3D room, readable stories,",
        "and a dedicated museum kiosk.",
      ],
      598,
      366,
      font,
      "#d7e6dc",
      24,
      36,
    );
    lines(
      c,
      [
        "Bring a relevant part of the work forward.",
        "Keep the original facts intact.",
      ],
      584,
      531,
      font,
      muted,
      23,
      43,
    );
    text(
      c,
      "The original stays available for comparison.",
      584,
      642,
      23,
      font,
      sage,
    );
  } else {
    text(c, "INSPECT BEFORE YOU KEEP IT", 584, 236, 18, font, sage, 650);
    panel(c, 585, 276, 287, 300, "#111f2d", 14);
    panel(c, 890, 276, 307, 300, "#e5e6db", 14);
    text(c, "LaTeX source", 607, 321, 22, font, glacier, 600);
    text(c, "PDF preview", 915, 321, 22, font, "#334443", 600);
    lines(
      c,
      ["\\section{Experience}", "\\textbf{Museum}", "React + Three.js", "..."],
      607,
      380,
      "monospace",
      muted,
      16,
      38,
    );
    [
      "Experience",
      "Museum exhibit",
      "Interface design",
      "React · Three.js",
    ].forEach((v, i) =>
      text(
        c,
        v,
        915,
        373 + i * 42,
        i ? 18 : 22,
        font,
        "#3d5351",
        i ? 450 : 600,
      ),
    );
    text(c, "Your experience. Your final word.", 584, 642, 25, font, sage);
  }
}
function mesa(c, state, font) {
  text(
    c,
    "An invitation to spend a little more time.",
    48,
    139,
    37,
    font,
    "#443b32",
    600,
  );
  panel(c, 48, 185, 1184, 500, "#ecdfc9", 22, "#c1ac8e");
  rule(
    c,
    [
      [640, 204],
      [640, 666],
    ],
    "#75675b",
    2,
  );
  const title = {
    room: "Start with a room.",
    book: "Open a story.",
    kiosk: "Make it a place to visit.",
  }[state];
  text(c, title, 92, 251, 31, font, "#443b32", 600);
  text(
    c,
    {
      room: "01 / AN INVITATION",
      book: "02 / A CHAPTER",
      kiosk: "03 / IN THE MUSEUM",
    }[state],
    92,
    301,
    18,
    font,
    "#94714b",
    650,
  );
  if (state === "room") {
    rule(
      c,
      [
        [690, 487],
        [915, 366],
        [1154, 485],
        [924, 611],
        [690, 487],
      ],
      "#937952",
      3,
    );
    rule(
      c,
      [
        [690, 487],
        [690, 311],
        [915, 206],
        [1154, 320],
        [1154, 485],
      ],
      "#9d825d",
      3,
    );
    rule(
      c,
      [
        [915, 366],
        [915, 206],
      ],
      "#8a7968",
      2,
    );
    [0, 1, 2, 3, 4].forEach((i) =>
      panel(c, 780 + i * 56, 421 - i * 6, 38, 94, "#a18b73", 4, "#d3bda1"),
    );
    lines(
      c,
      [
        "A 3D room gives visitors a way in.",
        "Books become doors into the content.",
        "A little curiosity is enough to begin.",
      ],
      92,
      381,
      font,
      "#665542",
      24,
      48,
    );
  } else if (state === "book") {
    panel(c, 697, 272, 476, 281, "#ddcfb6", 10);
    rule(
      c,
      [
        [935, 285],
        [935, 540],
      ],
      "#b9a486",
      2,
    );
    text(c, "A chapter", 721, 321, 26, font, "#504536", 600);
    [161, 141, 163, 118, 145].forEach((w, i) =>
      panel(c, 722, 350 + i * 27, w, 4, "#9e907d", 2),
    );
    panel(c, 960, 310, 185, 128, "#726f65", 5);
    c.beginPath();
    c.moveTo(1034, 346);
    c.lineTo(1067, 372);
    c.lineTo(1034, 398);
    c.closePath();
    c.fillStyle = "#dfd1b8";
    c.fill();
    text(c, "TEXT + VIDEO", 972, 476, 17, font, "#6f6150", 600);
    lines(
      c,
      [
        "Readable chapters.",
        "Text, video, and a way onward.",
        "The interface follows the story.",
      ],
      92,
      381,
      font,
      "#665542",
      24,
      48,
    );
  } else {
    panel(c, 756, 271, 355, 222, "#d5c0a1", 12);
    panel(c, 773, 288, 321, 187, "#252c32", 7);
    rule(
      c,
      [
        [786, 449],
        [933, 394],
        [1080, 449],
      ],
      "#a99478",
      4,
    );
    [0, 1, 2].forEach((i) => panel(c, 873 + i * 42, 336, 28, 70, "#b4a28a", 3));
    panel(c, 911, 493, 48, 77, "#9c9287", 5);
    panel(c, 847, 570, 178, 17, "#ad9d8a", 7);
    lines(
      c,
      [
        "A collaborative EPICS project.",
        "From interface design to the exhibit.",
        "Built for a dedicated museum kiosk.",
      ],
      92,
      381,
      font,
      "#665542",
      24,
      48,
    );
  }
  text(c, "A sketch of the exhibit experience", 91, 639, 21, font, "#887153");
}
function csdna(c, state, font) {
  text(
    c,
    "From bright points to something readable.",
    48,
    139,
    36,
    font,
    ink,
    600,
  );
  panel(c, 48, 190, 725, 489, "#101d2a", 24, "#3b5365");
  panel(c, 797, 190, 435, 489, "#1c2c3a", 24, "#3b5365");
  const clusters = [
    [216, 356, glacier],
    [521, 338, lavender],
    [407, 529, sage],
  ];
  clusters.forEach(([x, y, color], group) => {
    if (state !== "image") {
      c.beginPath();
      c.ellipse(x, y, 88, 67, group * 0.6, 0, Math.PI * 2);
      c.fillStyle = color + "0c";
      c.fill();
      c.strokeStyle = color + "88";
      c.lineWidth = 2;
      c.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = i * 2.399 + group * 0.8,
        r = 12 + Math.sqrt(i / 24) * 53;
      c.beginPath();
      c.arc(
        x + Math.cos(a) * r,
        y + Math.sin(a) * r * 0.65,
        2 + (i % 3) * 0.6,
        0,
        Math.PI * 2,
      );
      c.fillStyle = state === "image" ? "#c1dce3" : color;
      c.fill();
    }
    if (state === "labels")
      text(
        c,
        "Group " + String.fromCharCode(65 + group),
        x - 43,
        y - 85,
        19,
        font,
        color,
        600,
      );
  });
  for (let i = 0; i < 19; i++) {
    c.beginPath();
    c.arc(92 + ((i * 173) % 633), 236 + ((i * 107) % 389), 1.6, 0, Math.PI * 2);
    c.fillStyle = state === "image" ? "#9cafbf" : "#334153";
    c.fill();
  }
  text(
    c,
    "ILLUSTRATED SAMPLE · NOT MICROSCOPY DATA",
    80,
    644,
    17,
    font,
    muted,
    600,
  );
  const titles = {
    image: "Look closely.",
    groups: "Find what belongs.",
    labels: "Leave room to judge.",
  };
  text(c, titles[state], 830, 266, 28, font, ink, 600);
  const messages = {
    image: [
      "Upload an image.",
      "Detect its points.",
      "Keep the sample in view.",
    ],
    groups: [
      "Filter the noise.",
      "Adjust the parameters.",
      "Inspect the groups.",
    ],
    labels: [
      "Review each cluster.",
      "Assign a useful label.",
      "Export images and data.",
    ],
  };
  lines(c, messages[state], 830, 353, font, muted, 23, 58);
  text(c, "A researcher stays in control.", 830, 604, 21, font, sage);
}
function soda(c, state, font) {
  text(
    c,
    "A community has a lot happening between events.",
    48,
    139,
    35,
    font,
    ink,
    600,
  );
  panel(c, 48, 190, 1184, 489, "#26243c", 24, "#514660");
  const entries = {
    tools: ["The platform", "Internal API", "Discord bots", "Web interface"],
    onboard: [
      "A first contribution",
      "Read the guide",
      "Find the code",
      "Ask a question",
    ],
    workshops: ["A shared workshop", "Docker", "Flask", "Chrome extensions"],
  }[state];
  text(c, entries[0], 83, 256, 32, font, ink, 600);
  const centers = [
    [280, 412],
    [640, 412],
    [1000, 412],
  ];
  rule(
    c,
    [
      [280, 412],
      [1000, 412],
    ],
    "#7b7095",
    3,
  );
  centers.forEach(([x, y], i) => {
    panel(
      c,
      x - 135,
      y - 83,
      270,
      167,
      ["#34314d", "#3b3654", "#34314d"][i],
      24,
      "#827494",
    );
    c.beginPath();
    c.arc(x, y - 25, 17, 0, Math.PI * 2);
    c.fillStyle = [glacier, lavender, sage][i];
    c.fill();
    rule(
      c,
      [
        [x - 22, y + 11],
        [x - 22, y + 3],
        [x + 22, y + 3],
        [x + 22, y + 11],
      ],
      "#c4b8dc",
      4,
    );
    text(c, entries[i + 1], x - 112, y + 56, 23, font, ink, 550);
  });
  const captions = {
    tools: "Club operations, in a codebase members can build on.",
    onboard: "Good documentation makes the next person’s first step easier.",
    workshops: "Learning is better when there is someone to build beside.",
  };
  text(c, captions[state], 83, 592, 27, font, "#c9bedb");
  text(c, "SoDA / student developer community", 83, 638, 19, font, "#9d91b3");
}
export const additionalExhibitArt = { agentex, mesa, csdna, soda };
