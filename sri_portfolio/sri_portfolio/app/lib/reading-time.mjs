export function noteWords(note) {
  return [
    note.title,
    note.summary,
    note.opening,
    note.takeaway,
    ...note.sections.flatMap((section) => [
      section.title,
      ...section.blocks.map((block) => block.text || block.caption || ""),
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/).length;
}
export function readingMinutes(note) {
  return Math.max(1, Math.ceil(noteWords(note) / 200));
}
