# Publishing a Fieldnote

Fieldnotes opens at `/rooms/writing` (also reachable through `/fieldnotes` and the writing desk in the world). Each published note has `/fieldnotes/<slug>`. The shared article design supports concise text, original doodles, photographs, captions, callouts and accessible data figures. `/fieldnotes/preview` demonstrates the design; it is explicitly a layout example, excluded from the sitemap and marked noindex.

There is no CMS or Notion account connection. Content is versioned alongside the website, in `sri_portfolio/sri_portfolio/app/lib/fieldnotes.mjs`. Notion is a design influence. The public `fieldnotes` array starts empty; the notebook covers describe future subjects, not fabricated posts.

## Add a finished note

1. Add your images under `sri_portfolio/sri_portfolio/public/fieldnotes/<slug>/`. Use compressed WebP/JPEG, meaningful alt text and actual image dimensions. Keep original files separately.
2. Add one object to `fieldnotes` using the structure below. Work with `status: "draft"` until the text and images are approved. Drafts have no public article route, index entry or sitemap entry. Do not put confidential material in this public repository, including drafts.
3. Use short paragraphs and section headings. Keep data sources and units beside the figure. A LinkedIn post URL can be added after that post exists.
4. Change `status` to `published`, provide the real publication date, run the checks and deploy. The index and sitemap derive from the same published list.

```js
{
  slug: "a-real-title",
  status: "draft", // change only when ready
  title: "The title of your note",
  summary: "One sentence about the point.",
  category: "BUILDING",
  art: "build", // build, notice, wander
  publishedAt: "2026-09-23", // actual publication date
  takeaway: "The one useful thing to remember.",
  // linkedIn: "https://www.linkedin.com/posts/...",
  sections: [
    {
      id: "the-question",
      title: "What was the question?",
      blocks: [
        { type: "paragraph", text: "Your short paragraph." },
        { type: "image", src: "/fieldnotes/a-real-title/example.webp",
          alt: "Describe what the image explains", width: 1600, height: 1000,
          caption: "Context and image credit." },
        { type: "callout", label: "WHAT CHANGED", text: "The useful detail." },
        { type: "chart", title: "The measured result", unit: "ms",
          rows: [{ label: "Before", value: 120 }, { label: "After", value: 80 }],
          caption: "Replace these example values with real measurements and methodology.",
          source: "https://example.com/your-source" },
      ],
    },
  ],
}
```

Supported blocks: `paragraph`, `image`, `diagram` (`kind`: build/notice/wander), `callout`, `chart`, `quote`. Charts include an expandable semantic data table. Use nonnegative values for this horizontal bar format. Each section needs a unique URL-safe `id`. Article metadata and canonical URLs are generated automatically; only published notes enter the sitemap. Sound controls reuse the writing room score and saved preferences, and stop when leaving the page.

## Release check

From the application directory, run `npm test`, `npm run check`, `npm run build`. Inspect the index, article, captions, data table, section links, back links and world return at desktop and phone widths. Check actual images and text before switching a draft to published. Push the verified change to `main`; the existing Vercel project is connected to that branch.
