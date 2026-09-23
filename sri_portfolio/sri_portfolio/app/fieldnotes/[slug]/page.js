import { notFound } from "next/navigation";
import FieldnoteArticle from "../../components/personal/FieldnoteArticle";
import {
  getFieldnote,
  publishedFieldnotes,
  fieldnotePreview,
} from "../../lib/fieldnotes.mjs";

export function generateStaticParams() {
  return [
    { slug: "preview" },
    ...publishedFieldnotes.map(({ slug }) => ({ slug })),
  ];
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const note = slug === "preview" ? fieldnotePreview : getFieldnote(slug);
  if (!note) return {};
  const title = `${note.title.replace(/\n/g, " ")} — Fieldnotes by Sri`;
  return {
    title,
    description: note.summary,
    alternates: { canonical: `/fieldnotes/${slug}` },
    ...(note.preview ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description: note.summary,
      url: `/fieldnotes/${slug}`,
      type: note.preview ? "website" : "article",
      ...(note.publishedAt
        ? { publishedTime: note.publishedAt, authors: ["Sri Ujjwal Reddy"] }
        : {}),
    },
  };
}
export default async function FieldnotePage({ params }) {
  const { slug } = await params;
  const note = slug === "preview" ? fieldnotePreview : getFieldnote(slug);
  if (!note) notFound();
  return <FieldnoteArticle note={note} />;
}
