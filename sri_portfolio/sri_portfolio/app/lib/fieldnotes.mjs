// Add finished articles here. Drafts never appear in public routes or metadata.
// Publishing guide: docs/FIELDNOTES-PUBLISHING.md at the repository root.
export const fieldnoteShelves = [
  {
    id: "build",
    art: "build",
    title: "Things I make",
    eyebrow: "BUILDING",
    description:
      "From a question to a working thing. Notes on the decisions in between.",
    accent: "#bc4c35",
  },
  {
    id: "notice",
    art: "notice",
    title: "Details I notice",
    eyebrow: "DESIGN",
    description: "The small choices that change how something feels.",
    accent: "#637051",
  },
  {
    id: "wander",
    art: "wander",
    title: "Away from the desk",
    eyebrow: "OBSERVATIONS",
    description:
      "A different view. A photograph. Something worth slowing down for.",
    accent: "#596e8b",
  },
];

export const fieldnotes = [];

export function isPublishedFieldnote(note) {
  return Boolean(
    note &&
    note.status === "published" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug || "") &&
    note.slug !== "preview" &&
    note.title &&
    note.summary &&
    /^\d{4}-\d{2}-\d{2}$/.test(note.publishedAt || "") &&
    !Number.isNaN(Date.parse(note.publishedAt)) &&
    new Date(note.publishedAt).toISOString().slice(0, 10) ===
      note.publishedAt &&
    Array.isArray(note.sections) &&
    note.sections.length,
  );
}
export const publishedFieldnotes = fieldnotes
  .filter(isPublishedFieldnote)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export function getFieldnote(slug) {
  return publishedFieldnotes.find((note) => note.slug === slug) || null;
}

export const fieldnotePreview = {
  slug: "preview",
  preview: true,
  category: "A READING FORMAT",
  art: "notice",
  title: "Less noise.\nMore meaning.",
  summary:
    "A small look at how stories will feel here. Images that explain. Notes that get to the point. Room to think.",
  takeaway: "One idea, made clear. That’s enough for a good note.",
  sections: [
    {
      id: "start",
      title: "Start with something worth showing.",
      blocks: [
        {
          type: "paragraph",
          text: "A sketch can explain what a paragraph can’t. A photograph can hold a detail that would otherwise disappear. The writing gives it context.",
        },
        {
          type: "diagram",
          kind: "build",
          caption:
            "01 / A sketch, a question, a thing to try. Original illustration; a preview of the visual language.",
        },
        {
          type: "callout",
          label: "IN THE MARGIN",
          text: "Short doesn’t mean shallow. Keep the detail that helps someone understand; leave out the rest.",
        },
      ],
    },
    {
      id: "evidence",
      title: "Let the evidence do some talking.",
      blocks: [
        {
          type: "paragraph",
          text: "When numbers help tell the story, give them labels, context, and a source. When they don’t, leave them out.",
        },
        {
          type: "chart",
          title: "A chart should answer a question.",
          unit: "%",
          rows: [
            { label: "Context", value: 25 },
            { label: "Evidence", value: 50 },
            { label: "Takeaway", value: 25 },
          ],
          caption:
            "Illustrative data for this layout preview, not research findings or portfolio results.",
        },
      ],
    },
    {
      id: "takeaway",
      title: "Leave with one useful thing.",
      blocks: [
        {
          type: "paragraph",
          text: "A decision to try. A question to sit with. A different way to see something familiar. The next note can start there.",
        },
        { type: "quote", text: "Make the point. Give it room." },
      ],
    },
  ],
};
