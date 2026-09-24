import ContactComposer from "./ContactComposer";
export default function Connections({ collaboration = false }) {
  return (
    <div className="connections-room">
      <p className="eyebrow">
        {collaboration
          ? "SOMETHING GOOD COULD START HERE"
          : "THE CONVERSATION CONTINUES"}
      </p>
      <h2>
        {collaboration ? (
          <>Pull up a chair.</>
        ) : (
          <>
            Find me around
            <br />
            the internet.
          </>
        )}
      </h2>
      <p className="app-lead">
        {collaboration
          ? "An idea, a project, a detail you can’t stop thinking about. I like talking to people who want to make something."
          : "This world brings the different sides of me together. These are the places where the work and conversations continue."}
      </p>
      {collaboration && <ContactComposer />}
      <div className="connection-links">
        <a
          href="https://linkedin.com/in/sriujjwal"
          target="_blank"
          rel="noreferrer"
        >
          <span className="connection-monogram" aria-hidden="true">
            <img
              src="/official/linkedin-white.webp"
              width="31"
              height="29"
              alt=""
            />
          </span>
          <span>
            <strong>LinkedIn</strong>
            <small>
              Work, people, and the conversations around what I build.
            </small>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
        <a
          href="https://github.com/sbeeredd04"
          target="_blank"
          rel="noreferrer"
        >
          <span className="connection-monogram" aria-hidden="true">
            <img
              src="/official/github-white.svg"
              width="31"
              height="31"
              alt=""
            />
          </span>
          <span>
            <strong>GitHub</strong>
            <small>
              The code behind the projects. Experiments and ideas in progress,
              too.
            </small>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
        <a href="mailto:srisubspace@gmail.com?subject=Let%E2%80%99s%20make%20something">
          <span className="connection-monogram" aria-hidden="true">
            @
          </span>
          <span>
            <strong>Let’s make something</strong>
            <small>
              srisubspace@gmail.com · Ideas, collaborations, or a good
              conversation.
            </small>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="connection-note">
        <h3>A useful first hello</h3>
        <p>
          Tell me what you’re thinking about, who it’s for, and what you’d like
          to explore together. It doesn’t have to be perfectly formed.
        </p>
        <span>San Francisco, California</span>
      </div>
      <a className="app-action" href="/resume">
        For the professional details, my résumé
      </a>
    </div>
  );
}
