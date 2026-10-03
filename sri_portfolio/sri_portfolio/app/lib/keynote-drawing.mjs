// Small vector studies keep the screen legible at a distance. Only the active
// presentation redraws, at 12 fps; there are no videos or per-slide 3D scenes.
export function drawKeynote(ctx, w, h, font, slide, index, time = 0) {
  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = slide.accent;
  ctx.font = `500 22px ${font}`;
  ctx.fillText("SELECTED WORK", 72, 85);
  ctx.fillStyle = "#f4f1ea";
  let size = 78;
  do ctx.font = `500 ${size}px ${font}`;
  while (ctx.measureText(slide.name).width > 550 && (size -= 2) > 40);
  ctx.fillText(slide.name, 68, 292);
  ctx.fillStyle = "#c1cbd2";
  ctx.font = `400 25px ${font}`;
  const words = slide.line.split(" ");
  let line = "",
    y = 356;
  for (const word of words) {
    if (ctx.measureText(line + word).width > 460) {
      ctx.fillText(line, 72, y);
      y += 36;
      line = "";
    }
    line += word + " ";
  }
  ctx.fillText(line, 72, y);
  ctx.font = `500 20px ${font}`;
  ctx.fillStyle = "#8b9da9";
  ctx.fillText(`${String(index + 1).padStart(2, "0")} / 06`, 72, h - 64);
  ctx.save();
  ctx.translate(930, 310);
  ctx.strokeStyle = slide.accent;
  ctx.fillStyle = slide.accent;
  ctx.lineWidth = 3;
  const phase = (time * 0.18) % 1;
  const point = (x, y, r = 8) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const lineTo = (x, y, a, b) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(a, b);
    ctx.stroke();
  };
  if (slide.diagram === "branches") {
    for (const y of [-120, 0, 120]) {
      ctx.globalAlpha = 0.3;
      lineTo(-150, 0, 105, y);
      ctx.globalAlpha = 1;
      point(-150 + 255 * phase, y * phase, 5);
      point(105, y, 11);
    }
    point(-150, 0, 16);
  } else if (slide.diagram === "document") {
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(-130, -145, 235, 295);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const progress = Math.min(1, Math.max(0, phase * 8 - i));
      lineTo(
        -100,
        -95 + i * 42,
        -100 + (i === 0 ? 95 : 165) * progress,
        -95 + i * 42,
      );
    }
    ctx.globalAlpha = 0.1;
    ctx.fillRect(-146, -165, 265, 330);
  } else if (slide.diagram === "commits") {
    ctx.globalAlpha = 0.35;
    lineTo(-170, 0, 170, 0);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) point(-150 + i * 75, 0, phase * 5 > i ? 12 : 5);
    ctx.globalAlpha = 0.5;
    lineTo(-75, 0, 0, -80);
    lineTo(0, -80, 75, 0);
    point(0, -80, 8);
  } else if (slide.diagram === "pages") {
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(-165, -100, 330, 220);
    lineTo(0, -100, 0, 120);
    ctx.globalAlpha = 1;
    const edge = 155 * Math.cos(phase * Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(edge, -125);
    ctx.lineTo(edge, 95);
    ctx.lineTo(0, 120);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.35;
      lineTo(-140, -55 + i * 38, -30, -55 + i * 38);
    }
  } else if (slide.diagram === "clusters") {
    for (let i = 0; i < 48; i++) {
      const cluster = i % 3,
        a = i * 2.399,
        radius = 14 + Math.sqrt(i) * 8;
      const spread = 0.65 + 0.35 * Math.cos(phase * Math.PI * 2);
      point(
        Math.cos(cluster * 2.094) * 90 + Math.cos(a) * radius * spread,
        Math.sin(cluster * 2.094) * 90 + Math.sin(a) * radius * spread,
        3 + (i % 3),
      );
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7,
        x = Math.cos(a) * 140,
        y = Math.sin(a) * 140;
      ctx.globalAlpha = 0.25;
      lineTo(0, 0, x, y);
      ctx.globalAlpha = 0.7;
      point(x, y, 12);
      ctx.globalAlpha = 1;
      point(x * phase, y * phase, 4);
    }
    point(0, 0, 22);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
