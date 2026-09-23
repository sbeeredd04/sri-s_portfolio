export function projectId(project) {
  return (
    project.id ||
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function linkedProjectId(hash) {
  return /^#project-([a-z0-9-]+)$/.exec(hash)?.[1] || null;
}

export function matchesProject(project, query) {
  const text = [
    project.name,
    project.description,
    project.category,
    ...(project.stack || []),
    ...(project.story || []).flatMap((section) => [
      section.title,
      section.body,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const words = new Set(text.split(/[^a-z0-9]+/));
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((term) =>
      /^[a-z0-9]{1,2}$/.test(term) ? words.has(term) : text.includes(term),
    );
}
