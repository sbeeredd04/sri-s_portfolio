import test from "node:test";
import assert from "node:assert/strict";
import { harnessDraft } from "../app/lib/harness-draft.mjs";
import {
  getFieldnote,
  isPublishedFieldnote,
  publishedFieldnotes,
} from "../app/lib/fieldnotes.mjs";
import { noteWords, readingMinutes } from "../app/lib/reading-time.mjs";

test("the harness draft stays outside the publication manifest and fits five minutes", () => {
  assert.equal(isPublishedFieldnote(harnessDraft), false);
  assert.equal(getFieldnote(harnessDraft.slug), null);
  assert.equal(
    publishedFieldnotes.some((n) => n.slug === harnessDraft.slug),
    false,
  );
  assert.ok(noteWords(harnessDraft) > 500);
  assert.ok(readingMinutes(harnessDraft) <= 5);
});
test("every draft citation and chapter has a valid unique destination", () => {
  const ids = new Set(harnessDraft.sections.map((s) => s.id));
  assert.equal(ids.size, harnessDraft.sections.length);
  const sourceIds = new Set(harnessDraft.sources.map((s) => s.id));
  assert.equal(sourceIds.size, harnessDraft.sources.length);
  for (const section of harnessDraft.sections) {
    assert.match(section.id, /^[a-z0-9-]+$/);
    for (const block of section.blocks)
      for (const id of block.sources || []) assert.ok(sourceIds.has(id));
  }
  for (const source of harnessDraft.sources)
    assert.equal(new URL(source.href).protocol, "https:");
});
