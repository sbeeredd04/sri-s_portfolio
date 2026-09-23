"use client";
import { projectDemos } from "../../json/project-demos.mjs";
import RemoteVideo from "./RemoteVideo";
export default function ProjectDemo({ id, name }) {
  const demo = projectDemos[id];
  if (!demo) return null;
  return (
    <section className="project-demo" aria-label={`Demonstration of ${name}`}>
      <span className="eyebrow">SEE IT IN ACTION · {demo.kind}</span>
      <p>{demo.note}</p>
      {demo.video ? (
        <RemoteVideo
          video={demo.video}
          title={`${name} original demo`}
          label={demo.label}
        />
      ) : (
        <a href={demo.url} target="_blank" rel="noreferrer">
          {demo.label} <span className="sr-only">for {name}</span> ↗
        </a>
      )}
    </section>
  );
}
