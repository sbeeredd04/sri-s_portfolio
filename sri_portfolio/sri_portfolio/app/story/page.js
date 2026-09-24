import AppContent from "../components/personal/AppContent";
import { pageMetadata } from "../lib/page-metadata.mjs";
import SiteHeader from "../components/personal/SiteHeader";
import StoryNav from "./StoryNav";
export const metadata = pageMetadata({
  title: "The story — Sri Ujjwal Reddy",
  description:
    "Sri’s projects, experience, music, outdoor journal, writing and ways to connect, on one page.",
  path: "/story",
});
const sections = [
  ["about", "About"],
  ["journey", "Experience"],
  ["work", "Work"],
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
    <div className="reading-view" id="top">
      <h1 className="sr-only">Sri Ujjwal Reddy — my story</h1>
      <SiteHeader place="The whole story" />
      <StoryNav sections={sections} />
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
      <footer className="story-footer">
        <a href="/">Back to my world</a>
        <span>A work in progress. Like me.</span>
      </footer>
    </div>
  );
}
