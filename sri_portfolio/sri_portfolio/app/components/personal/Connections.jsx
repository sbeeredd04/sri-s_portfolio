import ContactComposer from "./ContactComposer";
import { history, projectCollections, projects } from "../../json/personal";

const shelved = new Set(["drafts", "references"]);
const sourceCount = projectCollections
  .filter((c) => !shelved.has(c.id))
  .flatMap((c) => c.items)
  .filter((p) => /github\.com/.test(p.url || "")).length;
const role = history[0];

const postcards = [
  {
    id: "linkedin",
    href: "https://linkedin.com/in/sriujjwal",
    network: "LinkedIn",
    handle: "in/sriujjwal",
    stamp: "/official/linkedin-white.webp",
    line: "Work, people, and the conversations around what I build.",
    detail: `${role.role} · ${role.name}`,
    external: true,
  },
  {
    id: "github",
    href: "https://github.com/sbeeredd04",
    network: "GitHub",
    handle: "@sbeeredd04",
    stamp: "/official/github-white.svg",
    line: "The code behind the projects. Experiments in progress, too.",
    detail: `${sourceCount} projects here link to their code · ${projects
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ")}`,
    external: true,
  },
  {
    id: "email",
    href: "mailto:srisubspace@gmail.com",
    network: "Email",
    handle: "srisubspace@gmail.com",
    line: "Ideas, collaborations, or a good conversation.",
    detail: "San Francisco, California",
  },
];

function Pinboard() {
  return (
    <div className="pinboard">
      <p className="eyebrow">THE CONVERSATION CONTINUES</p>
      <h2>
        Find me around <em>the internet.</em>
      </h2>
      <p className="app-lead">
        The places where the work and the conversations keep going.
      </p>
      <ul className="postcards">
        {postcards.map((card) => (
          <li key={card.id} data-card={card.id}>
            <a
              href={card.href}
              {...(card.external
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              <span className="postcard-pin" aria-hidden="true" />
              <span className="postcard-stamp" aria-hidden="true">
                {card.stamp ? (
                  <img src={card.stamp} width="26" height="26" alt="" />
                ) : (
                  "@"
                )}
              </span>
              <span className="postcard-network">{card.network}</span>
              <strong className="postcard-handle">
                {card.handle.indexOf("@") > 0 ? (
                  <>
                    {card.handle.split("@")[0]}@<wbr />
                    {card.handle.split("@")[1]}
                  </>
                ) : (
                  card.handle
                )}
              </strong>
              <span className="postcard-line">{card.line}</span>
              <span className="postcard-detail">{card.detail}</span>
              <span className="postcard-go" aria-hidden="true">
                {card.external ? "↗" : "→"}
              </span>
              {card.external && (
                <span className="sr-only"> (opens in a new tab)</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Correspondence() {
  return (
    <div className="correspondence">
      <p className="eyebrow">SOMETHING GOOD COULD START HERE</p>
      <h2>Pull up a chair.</h2>
      <p className="app-lead">
        An idea, a project, a detail you can’t stop thinking about. I like
        talking to people who want to make something.
      </p>
      <div className="letter-desk">
        <ContactComposer />
        <aside className="letter-margin" aria-label="A useful first hello">
          <h3>A useful first hello</h3>
          <p>
            Tell me what you’re thinking about, who it’s for, and what you’d
            like to explore together. It doesn’t have to be perfectly formed.
          </p>
        </aside>
      </div>
      <p className="letter-elsewhere">
        Rather write elsewhere?{" "}
        <a href="mailto:srisubspace@gmail.com">srisubspace@gmail.com</a> ·{" "}
        <a
          href="https://linkedin.com/in/sriujjwal"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </p>
    </div>
  );
}

export default function Connections({ collaboration = false }) {
  return collaboration ? <Correspondence /> : <Pinboard />;
}
