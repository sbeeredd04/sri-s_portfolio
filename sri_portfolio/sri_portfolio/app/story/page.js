import AppContent from "../components/personal/AppContent";
import { pageMetadata } from "../lib/page-metadata.mjs";
export const metadata = pageMetadata({
  title: "The story — Sri Ujjwal Reddy",
  description:
    "Sri’s projects, experience, music, outdoor journal, writing and ways to connect, on one page.",
  path: "/story",
});
const sections = [
  ["work", "Work"],
  ["journey", "Experience"],
  ["about", "About"],
  ["skills", "Toolkit"],
  ["music", "Music"],
  ["notes", "Outdoors & photography"],
  ["writing", "Writing"],
  ["socials", "Socials"],
  ["contact", "Contact"],
  ["discoveries", "Little discoveries"],
];
export default function StoryPage() {
  return (
    <div className="reading-view">
      <h1 className="sr-only">Sri Ujjwal Reddy — my story</h1>
      <header>
        <a className="wordmark" href="/">
          Sri Ujjwal
        </a>
        <a href="/">Enter my world ↗</a>
      </header>
      <nav aria-label="Story sections">
        <a href="/resume">Résumé</a>
        {sections.map(([id, name]) => (
          <a key={id} href={`#${id}`}>
            {name}
          </a>
        ))}
      </nav>
      <main>
        {sections.map(([id, name]) => (
          <section
            className="window-content"
            key={id}
            id={id}
            aria-label={name}
          >
            <AppContent id={id} expanded />
          </section>
        ))}
      </main>
      <footer>
        <a href="/">Back to my world ↗</a>
        <span>A work in progress. Like me.</span>
      </footer>
    </div>
  );
}
