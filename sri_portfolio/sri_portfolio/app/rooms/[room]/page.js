import { notFound } from "next/navigation";
import StandaloneRoom from "../../components/personal/StandaloneRoom";
import { readingSections } from "../../lib/world-story.mjs";
import { pageMetadata } from "../../lib/page-metadata.mjs";
export function generateStaticParams() {
  return readingSections.map((s) => ({ room: s.id }));
}
export async function generateMetadata({ params }) {
  const { room } = await params;
  const section = readingSections.find((s) => s.id === room);
  return section
    ? pageMetadata({
        title: `${section.name} — Sri Ujjwal Reddy`,
        description: section.caption,
        path: `/rooms/${room}`,
      })
    : {};
}
export default async function RoomPage({ params, searchParams }) {
  const { room } = await params;
  if (!readingSections.some((s) => s.id === room)) notFound();
  const query = await searchParams;
  return (
    <StandaloneRoom
      id={room}
      initialCollection={
        typeof query.collection === "string" ? query.collection : "all"
      }
    />
  );
}
