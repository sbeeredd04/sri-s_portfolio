"use client";

export function linkFor(p) {
  if (!p.url) return null;
  const host = [
    ["github.com", "Code"],
    ["apps.apple.com", "App Store"],
    ["devpost.com", "Devpost"],
    [".pdf", "Slides"],
  ].find(([match]) => p.url.includes(match));
  return host ? host[1] : "Open";
}

export default function WorkLink({ p, className }) {
  const label = linkFor(p);
  if (!label) return null;
  return (
    <a className={className} href={p.url} target="_blank" rel="noreferrer">
      {label}
      <span className="sr-only"> for {p.name}</span>{" "}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
