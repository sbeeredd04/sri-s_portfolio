export const ink = "#e9f1fa",
  muted = "#94a5b9",
  glacier = "#b6d8ec",
  lavender = "#c7b8ea";

export function panel(c, x, y, w, h, color, radius = 20, line) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
  if (line) {
    c.strokeStyle = line;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function text(c, value, x, y, size, font, color = ink, weight = 500) {
  c.font = `${weight} ${size}px ${font}`;
  c.fillStyle = color;
  c.fillText(value, x, y);
}
export function link(c, x1, y1, x2, y2, color, active) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.bezierCurveTo(x1, y1 + 45, x2, y2 - 45, x2, y2);
  c.strokeStyle = color;
  c.lineWidth = active ? 5 : 3;
  c.stroke();
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ]) {
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
}
