import { notFound } from "next/navigation";
import FieldnoteArticle from "../../components/personal/FieldnoteArticle";
import {
  getFieldnote,
  publishedFieldnotes,
  fieldnotePreview,
} from "../../lib/fieldnotes.mjs";
import { pageMetadata } from "../../lib/page-metadata.mjs";

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
    ...pageMetadata({
      title,
      description: note.summary,
      path: `/fieldnotes/${slug}`,
      openGraph: {
        type: note.preview ? "website" : "article",
        ...(note.publishedAt
          ? { publishedTime: note.publishedAt, authors: ["Sri Ujjwal Reddy"] }
          : {}),
      },
    }),
    ...(note.preview ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function FieldnotePage({ params }) {
  const { slug } = await params;
  const note = slug === "preview" ? fieldnotePreview : getFieldnote(slug);
  if (!note) notFound();
  return <FieldnoteArticle note={note} />;
}
