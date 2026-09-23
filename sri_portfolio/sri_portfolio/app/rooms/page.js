import { readingSections } from "../lib/world-story.mjs";
export const metadata = {
  title: "All places — Sri Ujjwal Reddy",
  description:
    "Open the work, music, stories and conversations in Sri’s world, each in its own place.",
  alternates: { canonical: "/rooms" },
};
const groups = [
  { name: "Things I make", ids: ["work", "journey", "skills"] },
  { name: "The life around them", ids: ["about", "music", "notes"] },
  {
    name: "What comes next",
    ids: ["writing", "socials", "contact", "discoveries"],
  },
];
export default function RoomDirectory() {
  return (
    <div className="room-directory">
      <header>
        <a className="room-signature" href="/">
          sri.
        </a>
        <nav aria-label="Directory navigation">
          <a href="/resume">Résumé</a>
          <a href="/">Enter the world ↗</a>
        </nav>
      </header>
      <main>
        <div className="directory-intro">
          <span className="eyebrow">SRI UJJWAL REDDY / AN INDEX</span>
          <h1>
            A few doors.
            <br />
            <em>Come on in.</em>
          </h1>
          <p>
            The work, the music, the things in between. Open any part of my
            world on its own.
          </p>
        </div>
        {groups.map((g, gi) => (
          <section key={g.name} aria-label={g.name}>
            <div className="directory-chapter">
              <span>0{gi + 1}</span>
              <h2>{g.name}</h2>
            </div>
            <ol>
              {g.ids.map((id) => {
                const r = readingSections.find((s) => s.id === id);
                return (
                  <li key={id} data-room={id}>
                    <a href={`/rooms/${id}`}>
                      <span className="door-swatch" aria-hidden="true" />
                      <strong>{r.name}</strong>
                      <span className="door-caption">{r.caption}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </main>
      <footer>
        <a href="/story">Read everything on one page ↗</a>
        <span>Still making things. Still figuring things out.</span>
      </footer>
    </div>
  );
}
