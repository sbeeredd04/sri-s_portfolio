import test from "node:test";
import assert from "node:assert/strict";
import {
  decodedGlyph,
  glyphStart,
  MORPH,
  morphSettle,
} from "../app/lib/biome-morph.mjs";

test("the decode front resolves every title before the shared settle sound", () => {
  for (const title of [
    "I’m in for one more.",
    "An idea needs somewhere to go.",
    "Take the scenic route.",
  ]) {
    const letters = [...title];
    for (const biome of ["studio", "projects", "court", "trail", "future"]) {
      assert.equal(
        letters
          .map((letter, i) =>
            decodedGlyph(letter, i, letters.length, morphSettle, biome),
          )
          .join(""),
        title,
      );
      letters.forEach((letter, i) => {
        assert.equal(
          decodedGlyph(
            letter,
            i,
            letters.length,
            glyphStart(i, letters.length) + MORPH.decode,
            biome,
          ),
          letter,
        );
        if (/\s|[.’]/u.test(letter))
          assert.equal(
            decodedGlyph(letter, i, letters.length, 0, biome),
            letter,
          );
      });
    }
  }
  assert.ok(morphSettle < MORPH.duration);
});

test("decoding is deterministic and completes for single-letter titles", () => {
  assert.equal(glyphStart(0, 1), MORPH.start);
  assert.equal(
    decodedGlyph("A", 0, 1, MORPH.start + MORPH.decode, "projects"),
    "A",
  );
  assert.equal(
    decodedGlyph("A", 4, 20, 200, "court"),
    decodedGlyph("A", 4, 20, 200, "entertainment"),
  );
});
