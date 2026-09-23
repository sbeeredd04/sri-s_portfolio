import { readingSections } from "./lib/world-story.mjs";
import { publishedFieldnotes } from "./lib/fieldnotes.mjs";
export default function sitemap() {
  return [
    ...publishedFieldnotes.map((note) => ({
      url: `https://www.sriujjwalreddy.com/fieldnotes/${note.slug}`,
      lastModified: new Date(note.updatedAt || note.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    {
      url: "https://www.sriujjwalreddy.com/rooms",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...readingSections.map((s) => ({
      url: `https://www.sriujjwalreddy.com/rooms/${s.id}`,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    {
      url: "https://www.sriujjwalreddy.com/resume",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.sriujjwalreddy.com",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.sriujjwalreddy.com/story",
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
