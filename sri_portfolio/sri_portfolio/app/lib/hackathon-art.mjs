// Explanatory artwork for the team concepts, not product screenshots.
export const hackathonArt = {
  safeside: {
    caption: "A CLEARER WAY THROUGH",
    line: "Find a safer way through.",
    event: "DEVILS INVENT + DASSH / 2023",
    accent: "#a8c7db",
    paths: [
      {
        d: "M90 45H210V105H90ZM235 45H340V105H235ZM365 45H490V105H365ZM90 130H210V185H90ZM365 130H490V185H365Z",
        fill: "#b9d6fa12",
        stroke: "#b9d6fa40",
      },
      { d: "M132 158H260V118H429", stroke: "#a8c7db", width: 5 },
      { d: "M417 106L429 118L417 130", stroke: "#a8c7db", width: 4 },
      {
        d: "M274 45Q300 20 326 45M283 55Q300 38 317 55",
        stroke: "#c8b5e1",
        width: 3,
      },
    ],
    dots: [
      [132, 158, 9, "#d5e6f3"],
      [300, 65, 6, "#c8b5e1"],
    ],
  },
  aruready: {
    caption: "A DIFFERENT WAY TO MEET ASU",
    line: "Step into an introduction.",
    event: "DEVILS INVENT / 2023",
    accent: "#d6c09e",
    paths: [
      {
        d: "M105 80L235 40L385 79L254 126ZM105 80V150L254 195L385 150V79M254 126V195",
        stroke: "#d6c09e99",
        width: 2,
        fill: "#d6c09e10",
      },
      {
        d: "M325 35H470V165H325Z",
        stroke: "#c9badc",
        width: 2,
        fill: "#bba5d018",
      },
      {
        d: "M350 65H447M350 81H418M350 132H434",
        stroke: "#c9badc99",
        width: 4,
      },
      { d: "M80 60V30H115M455 185H490V155", stroke: "#e5d5b7", width: 4 },
    ],
    dots: [[245, 91, 7, "#e5d5b7"]],
  },
  avisol: {
    caption: "AN IDEA TAKES FLIGHT",
    line: "Exploring aerospace autonomy.",
    event: "DEVILS INVENT / 2024",
    accent: "#b5cadd",
    paths: [
      {
        d: "M135 165Q280 -15 470 125",
        stroke: "#b5cadd55",
        width: 2,
        dash: [5, 9],
      },
      {
        d: "M302 43L316 105L407 145L407 155L315 134L310 170L335 185L335 192L300 184L265 192L265 185L290 170L285 134L193 155L193 145L284 105Z",
        stroke: "#b5cadd",
        fill: "#b5cadd16",
        width: 2,
      },
      { d: "M300 69V164", stroke: "#b5cadd77", width: 2 },
    ],
    dots: [
      [135, 165, 5, "#cdb9e1"],
      [470, 125, 5, "#cdb9e1"],
    ],
  },
  voxelcv: {
    caption: "MAKE MOVEMENT VISIBLE",
    line: "Movement, seen a little differently.",
    event: "VOXEL51 / COMPUTER VISION",
    accent: "#c2b5df",
    paths: [
      {
        d: "M200 95L257 75L323 89L375 120M257 75L278 135L323 89M278 135L245 185M278 135L326 183",
        stroke: "#c2b5df",
        width: 4,
      },
      {
        d: "M175 55V28H207M367 28H399V55M175 170V195H207M367 195H399V170",
        stroke: "#a9c7db77",
        width: 2,
      },
      {
        d: "M435 72H485M435 99H472M435 126H492",
        stroke: "#c2b5df66",
        width: 4,
      },
    ],
    dots: [
      [289, 43, 16, "#c2b5df77"],
      [200, 95, 5, "#d8ccef"],
      [257, 75, 5, "#d8ccef"],
      [323, 89, 5, "#d8ccef"],
      [375, 120, 5, "#d8ccef"],
      [278, 135, 5, "#d8ccef"],
      [245, 185, 5, "#d8ccef"],
      [326, 183, 5, "#d8ccef"],
    ],
  },
  "mine-alliance": {
    caption: "SEE THE BIGGER PICTURE",
    line: "Information for the people nearby.",
    event: "AZ SPARK / 2024",
    accent: "#afcabc",
    paths: [
      {
        d: "M83 157Q90 50 198 64Q261 15 327 61Q424 52 488 153Q399 202 321 179Q201 210 83 157Z",
        stroke: "#afcabc44",
        width: 2,
      },
      {
        d: "M127 144Q143 81 211 88Q268 49 323 91Q392 77 441 145Q377 174 312 149Q201 177 127 144Z",
        stroke: "#afcabc77",
        width: 2,
      },
      {
        d: "M180 129Q196 104 229 109Q280 80 319 114Q363 98 391 135Q337 151 308 126Q233 150 180 129Z",
        stroke: "#afcabc",
        width: 2,
      },
      { d: "M294 62V112", stroke: "#d7d2b4", width: 3 },
    ],
    dots: [
      [294, 53, 10, "#d7d2b4"],
      [398, 132, 5, "#afcabc"],
      [172, 101, 5, "#afcabc"],
    ],
  },
};

// The same paths appear on the physical exhibits and in the reading view.
export function drawHackathonArt(ctx, art) {
  ctx.lineCap = ctx.lineJoin = "round";
  art.paths.forEach(({ d, fill, stroke, width = 2, dash = [] }) => {
    const path = new Path2D(d);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(path);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.stroke(path);
    }
  });
  ctx.setLineDash([]);
  art.dots.forEach(([x, y, r, color]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}
