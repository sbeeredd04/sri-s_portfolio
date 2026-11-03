// One score for type, material and sound. Milliseconds; no perpetual animation.
export const MORPH = { duration: 960, start: 120, sweep: 400, decode: 200 };
export const morphSettle = MORPH.start + MORPH.sweep + MORPH.decode;
export const skinIdentity = (biome) =>
  biome === "entertainment" ? "court" : biome;
export const glyphStart = (index, count) =>
  MORPH.start + (index / Math.max(1, count - 1)) * MORPH.sweep;

const alphabets = {
  projects: "01/{}[]<>_",
  court: "oaeumnrs",
  trail: "aeinorst",
  future: "aemnorst",
  studio: "aeinorsu",
};
export function decodedGlyph(letter, index, count, elapsed, biome) {
  if (/\s|[.,!?’:]/u.test(letter)) return letter;
  const start = glyphStart(index, count);
  if (elapsed >= start + MORPH.decode) return letter;
  const age = elapsed - start;
  const alphabet = alphabets[skinIdentity(biome)] || alphabets.studio;
  return alphabet[
    (index * 3 + Math.max(0, Math.floor(age / 65))) % alphabet.length
  ];
}
