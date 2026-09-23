export const continuations = {
  work: {
    id: "journey",
    label: "The people and places behind the work",
    note: "A project is one part of the story. Here’s where I’ve been building.",
  },
  journey: {
    id: "about",
    label: "Meet the person outside the résumé",
    note: "There’s a life around all this work, too.",
  },
  about: {
    id: "music",
    label: "Come into the listening room",
    note: "Three monitors. A project open. This is what’s usually playing.",
  },
  music: {
    id: "work",
    label: "When music becomes a project",
    note: "Amano and Song Rec explore recommendations. You’ll find both in the collection.",
  },
  notes: {
    id: "about",
    label: "A few more sides of me",
    note: "New cities, a good game, and another idea to try.",
  },
  writing: {
    id: "contact",
    label: "Start a conversation",
    note: "The first post is still ahead. A conversation can start now.",
  },
  socials: {
    id: "writing",
    label: "A page for what comes next",
    note: "A home for longer stories, connected to the conversations elsewhere.",
  },
  contact: {
    id: "work",
    label: "Find something to talk about",
    note: "A product, an experiment, or an idea we could make together.",
  },
  skills: {
    id: "work",
    label: "See what the tools became",
    note: "The interesting part is what you make with them.",
  },
  discoveries: {
    id: "about",
    label: "The person behind the little details",
    note: "Some clues make more sense when you know me a little.",
  },
};

export function roomPageHref(id, collection = "all", hash = "") {
  const query =
    collection !== "all" ? `?collection=${encodeURIComponent(collection)}` : "";
  const anchor =
    id === "work" && /^#project-[a-z0-9-]+$/.test(hash) ? hash : "";
  return `/rooms/${encodeURIComponent(id)}${query}${anchor}`;
}

export function roomWorldHref(id, collection = "all", hash = "") {
  const query = new URLSearchParams({ room: id });
  if (id === "work" && collection !== "all")
    query.set("collection", collection);
  const anchor =
    id === "work" && /^#project-[a-z0-9-]+$/.test(hash) ? hash : "";
  return `/?${query}${anchor}`;
}

// A room's independent page returns to its physical place, so closing the
// reading sheet reveals the same subject rather than an unrelated globe view.
export function roomWorldDestination(id, collection = "all") {
  if (id === "work")
    return {
      world: "projects",
      stop: ["mobile", "hackathons"].includes(collection)
        ? collection
        : "arrival",
    };
  return (
    {
      journey: { world: "studio", stop: "desk" },
      about: { world: "studio", stop: "arrival" },
      skills: { world: "projects", stop: "workbench" },
      music: { world: "entertainment", stop: "arrival" },
      notes: { world: "trail", stop: "overlook" },
      writing: { world: "future", stop: "writing" },
      socials: { world: "future", stop: "socials" },
      contact: { world: "future", stop: "collaborate" },
      discoveries: { world: "planet", stop: "arrival" },
    }[id] || { world: "planet", stop: "arrival" }
  );
}
