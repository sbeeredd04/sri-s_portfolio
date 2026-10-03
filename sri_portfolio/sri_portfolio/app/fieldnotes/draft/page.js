import { notFound } from "next/navigation";
import FieldnoteArticle from "../../components/personal/FieldnoteArticle";

export const metadata = {
  title: "Draft — The work around the model",
  robots: { index: false, follow: false },
};
export default async function DraftFieldnote() {
  // Deliberately unavailable in a deployed production build, including direct URLs.
  if (process.env.NODE_ENV !== "development") notFound();
  const { harnessDraft } = await import("../../lib/harness-draft.mjs");
  return <FieldnoteArticle note={harnessDraft} />;
}
