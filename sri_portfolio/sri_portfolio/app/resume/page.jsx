import { history, projects, toolkit } from "../json/personal";
import { hackathonProjects } from "../json/more-work";
import PrintResume from "./PrintResume";
import "./resume.css";
export const metadata = {
  title: "Résumé — Sri Ujjwal Reddy",
  alternates: { canonical: "/resume" },
};
export default function ResumePage() {
  return (
    <div className="resume-page">
      <nav className="resume-actions" aria-label="Résumé actions">
        <a href="/">← My world</a>
        <a href="/story#work">Project stories</a>
        <PrintResume />
      </nav>
      <main className="resume-paper">
        <header>
          <p className="eyebrow">ENGINEERING · PRODUCT · DESIGN</p>
          <h1>Sri Ujjwal Reddy</h1>
          <p className="resume-intro">
            Founding Engineer at Offseason.
            <br />I build useful things and care about how they feel.
          </p>
          <div className="resume-contact">
            <span>San Francisco, CA</span>
            <a href="mailto:srisubspace@gmail.com">srisubspace@gmail.com</a>
            <a href="https://github.com/sbeeredd04">GitHub ↗</a>
            <a href="https://linkedin.com/in/sriujjwal">LinkedIn ↗</a>
          </div>
        </header>
        <section>
          <h2>Experience</h2>
          {history
            .filter((h) => h.name !== "Arizona State University")
            .map((h) => (
              <article key={h.name}>
                <div className="resume-row">
                  <h3>{h.name}</h3>
                  <span>{h.period}</span>
                </div>
                <strong>{h.role}</strong>
                <p>{h.description}</p>
              </article>
            ))}
        </section>
        <section>
          <h2>Education</h2>
          <article>
            <div className="resume-row">
              <h3>Arizona State University</h3>
              <span>Graduated · 4.0 GPA</span>
            </div>
            <p>Computer Science · Entrepreneurship certificate</p>
          </article>
        </section>
        <section>
          <h2>Selected projects</h2>
          {projects
            .filter((p) =>
              ["aether", "agentex", "gitcue", "csdna"].includes(p.id),
            )
            .map((p) => (
              <article key={p.id}>
                <div className="resume-row">
                  <h3>{p.name}</h3>
                  <a href={`/story#project-${p.id}`}>Project story ↗</a>
                </div>
                <p>{p.description}</p>
              </article>
            ))}
        </section>
        <section>
          <h2>Hackathons</h2>
          <p>
            Devils Invent, AZ Spark, and Voxel51. Team projects built around a
            deadline, a new problem, and people learning together.
          </p>
          {hackathonProjects
            .filter((p) => p.status)
            .map((p) => (
              <article key={p.id} className="resume-award">
                <a href={`/story#project-${p.id}`}>{p.name} ↗</a>
                <span>{p.status}</span>
              </article>
            ))}
        </section>
        <section>
          <h2>Toolkit</h2>
          {toolkit.slice(0, 3).map((g) => (
            <p key={g.title}>
              <strong>{g.title}</strong>
              <br />
              {g.items.join(" · ")}
            </p>
          ))}
        </section>
        <footer>
          Current overview · September 2026. Full project stories at
          sriujjwalreddy.com.
        </footer>
      </main>
      <aside className="resume-archive">
        <h2>Looking for the original PDF?</h2>
        <p>
          The previous résumé is preserved here. It predates Offseason and still
          has older role dates and project claims; the overview above reflects
          the current website.
        </p>
        <a href="/sri_resume.pdf" target="_blank" rel="noreferrer">
          Open the earlier résumé (PDF) ↗
        </a>
        <a
          href="/sri_resume.pdf"
          download="Sri-Ujjwal-Reddy-earlier-resume.pdf"
        >
          Download the earlier PDF ↓
        </a>
      </aside>
    </div>
  );
}
