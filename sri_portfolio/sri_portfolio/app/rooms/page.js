import { readingSections } from "../lib/world-story.mjs";
import { pageMetadata } from "../lib/page-metadata.mjs";
import SiteHeader from "../components/personal/SiteHeader";
import { allProjects, history, toolkit } from "../json/personal";
import { discoveries } from "../lib/discoveries.mjs";
export const metadata = pageMetadata({
  title: "All places — Sri Ujjwal Reddy",
  description:
    "Open the work, music, stories and conversations in Sri’s world, each in its own place.",
  path: "/rooms",
});
const groups = [
  { name: "Things I make", ids: ["work", "journey", "skills"] },
  { name: "The life around them", ids: ["about", "music", "notes"] },
  {
    name: "What comes next",
    ids: ["writing", "socials", "contact", "discoveries"],
  },
];
// A short, factual label per door, counted from the same data the rooms use.
const status = {
  work: `${allProjects.length} entries`,
  journey: `${history.length} places`,
  skills: `${toolkit.length} tool walls`,
  music: "Side A · v4",
  discoveries: `${discoveries.length} to find`,
};
// Each plate is a tiny sample of the room's material.
function Motif({ id }) {
  const common = {
    viewBox: "0 0 120 72",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    "aria-hidden": true,
  };
  if (id === "work")
    return (
      <svg {...common}>
        <path d="M14 58h92M24 58V30h30v28M62 58V18h34v40M30 38h18M68 28h22M68 38h22" />
      </svg>
    );
  if (id === "journey")
    return (
      <svg {...common}>
        <path d="M20 10v52" />
        <circle cx="20" cy="18" r="4" />
        <circle cx="20" cy="36" r="4" />
        <circle cx="20" cy="54" r="4" />
        <path d="M32 18h58M32 36h44M32 54h52" />
      </svg>
    );
  if (id === "about")
    return (
      <svg {...common}>
        <path d="M12 52c18-22 34 8 52-12s30-18 44-6" strokeDasharray="3 4" />
        <circle cx="12" cy="52" r="3.5" />
        <circle cx="64" cy="40" r="3.5" />
        <circle cx="108" cy="34" r="3.5" />
      </svg>
    );
  if (id === "skills")
    return (
      <svg {...common}>
        {[0, 1, 2, 3, 4, 5].map((x) =>
          [0, 1, 2].map((y) => (
            <circle
              key={`${x}${y}`}
              cx={20 + x * 16}
              cy={16 + y * 20}
              r="1.8"
            />
          )),
        )}
        <path d="M36 16v18l-6 8M68 36v20" />
      </svg>
    );
  if (id === "music")
    return (
      <svg {...common}>
        <circle cx="52" cy="36" r="28" />
        <circle cx="52" cy="36" r="18" strokeOpacity=".5" />
        <circle cx="52" cy="36" r="7" />
        <path d="M100 10l-8 34-12 6" />
      </svg>
    );
  if (id === "notes")
    return (
      <svg {...common}>
        <path d="M8 60c14-6 22-26 38-26s22 14 34 14 20-16 32-18" />
        <path
          d="M20 60c10-4 18-16 28-16s18 10 30 10 18-10 28-12"
          strokeOpacity=".55"
        />
        <path d="M60 18l6-8 6 8" />
      </svg>
    );
  if (id === "writing")
    return (
      <svg {...common}>
        <path d="M22 12h52l18 18v32H22z" />
        <path d="M74 12v18h18M32 38h44M32 48h30" />
      </svg>
    );
  if (id === "socials")
    return (
      <svg {...common}>
        <rect
          x="14"
          y="16"
          width="44"
          height="30"
          transform="rotate(-6 36 31)"
        />
        <rect
          x="58"
          y="22"
          width="44"
          height="30"
          transform="rotate(5 80 37)"
        />
        <circle cx="36" cy="16" r="2.5" />
        <circle cx="80" cy="22" r="2.5" />
      </svg>
    );
  if (id === "contact")
    return (
      <svg {...common}>
        <path d="M18 18h84v40H18z" />
        <path d="M18 18l42 26 42-26" />
        <circle cx="90" cy="50" r="9" strokeDasharray="2 2" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M14 18l12 10-12 10M34 40h20" />
      <path d="M72 14h34v44H72zM72 36h34M89 14v44" strokeOpacity=".6" />
    </svg>
  );
}
export default function RoomDirectory() {
  return (
    <div className="room-directory">
      <SiteHeader place="All places" />
      <main>
        <div className="directory-intro">
          <span className="eyebrow">SRI UJJWAL REDDY / AN INDEX</span>
          <h1>
            A few doors.
            <br />
            <em>Come on in.</em>
          </h1>
          <p>
            The work, the music, the things in between. Every room has its own
            look. Open any of them on its own.
          </p>
        </div>
        {groups.map((g, gi) => (
          <section key={g.name} aria-labelledby={`chapter-${gi}`}>
            <div className="directory-chapter">
              <span>0{gi + 1}</span>
              <h2 id={`chapter-${gi}`}>{g.name}</h2>
            </div>
            <ol>
              {g.ids.map((id) => {
                const r = readingSections.find((s) => s.id === id);
                const n = readingSections.indexOf(r) + 1;
                return (
                  <li key={id} data-room={id}>
                    <a href={`/rooms/${id}`}>
                      <span className="door-plate" aria-hidden="true">
                        <span>{String(n).padStart(2, "0")}</span>
                        <Motif id={id} />
                      </span>
                      <span className="door-text">
                        <strong>{r.name}</strong>
                        <span className="door-caption">{r.caption}</span>
                      </span>
                      {status[id] && (
                        <span className="door-status">{status[id]}</span>
                      )}
                      <span className="door-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </main>
      <footer>
        <a href="/story">Read everything on one page →</a>
        <span>Still making things. Still figuring things out.</span>
      </footer>
    </div>
  );
}
