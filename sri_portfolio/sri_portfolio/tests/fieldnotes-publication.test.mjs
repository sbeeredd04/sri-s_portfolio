import test from "node:test";
import assert from "node:assert/strict";
import {
  fieldnotePreview,
  getFieldnote,
  isPublishedFieldnote,
  publishedFieldnotes,
} from "../app/lib/fieldnotes.mjs";

const valid = {
  slug: "a-real-note",
  status: "published",
  title: "A note",
  summary: "A useful detail",
  publishedAt: "2026-09-23",
  sections: [
    {
      id: "one",
      title: "One",
      blocks: [{ type: "paragraph", text: "The detail." }],
    },
  ],
};
test("draft and preview articles cannot enter the published collection", () => {
  assert.equal(isPublishedFieldnote(valid), true);
  assert.equal(isPublishedFieldnote({ ...valid, status: "draft" }), false);
  assert.equal(isPublishedFieldnote({ ...valid, slug: "preview" }), false);
  assert.equal(isPublishedFieldnote(fieldnotePreview), false);
  assert.equal(getFieldnote("preview"), null);
  assert.equal(getFieldnote("unknown-note"), null);
  assert.ok(publishedFieldnotes.every(isPublishedFieldnote));
});
test("published records require a safe address, actual date and reading content", () => {
  for (const change of [
    { slug: "../private" },
    { slug: "Bad Slug" },
    { publishedAt: "soon" },
    { publishedAt: "2026-02-31" },
    { title: "" },
    { summary: "" },
    { sections: [] },
  ])
    assert.equal(isPublishedFieldnote({ ...valid, ...change }), false);
});
test("reading preview has unique navigable sections and identifies illustrative data", () => {
  const ids = fieldnotePreview.sections.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z0-9-]+$/.test(id)));
  for (const section of fieldnotePreview.sections)
    for (const b of section.blocks)
      if (b.type === "chart") {
        assert.match(b.caption, /Illustrative data/);
        assert.ok(
          b.rows.every(
            (row) => Number.isFinite(row.value) && row.value >= 0 && row.label,
          ),
        );
      }
});
