import test from "node:test";
import assert from "node:assert/strict";
import { biomeSkins } from "../app/lib/biome-skins.mjs";
import { allChapters } from "../app/lib/world-story.mjs";

function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => {
      const channel = parseInt(v, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
test("every destination has a complete, readable skin including selected and hover states", () => {
  for (const id of ["planet", ...allChapters.map((c) => c.id)]) {
    const s = biomeSkins[id];
    assert.ok(s, `Missing skin: ${id}`);
    for (const [text, background] of [
      [s.ink, s.surface],
      [s.muted, s.surface],
      [s.ink, s.tint],
      [s.onAccent, s.accent],
    ]) {
      assert.ok(
        contrast(text, background) >= 4.5,
        `${id}: ${text} on ${background} has ${contrast(text, background).toFixed(2)}:1 contrast`,
      );
    }
    assert.ok(
      contrast(s.accent, s.surface) >= 3,
      `${id}: focus ring needs contrast`,
    );
  }
});
