// Authored walkthroughs of existing project ideas, not live product sessions.
// The same state drives the physical exhibit and its keyboard/touch controls.
export const projectExhibits = {
  agentex: {
    title: "Keep the person in the resume.",
    name: "Agentex",
    initial: "context",
    steps: [
      {
        id: "context",
        label: "The context",
        result:
          "A job description gives the draft direction. Your existing experience supplies the facts.",
      },
      {
        id: "draft",
        label: "The draft",
        result:
          "Bring relevant work forward. The original resume stays available beside the tailored version.",
      },
      {
        id: "review",
        label: "Your review",
        result:
          "Inspect the LaTeX and PDF, then decide what to keep. A generated draft still needs your judgment.",
      },
    ],
  },
  mesa: {
    title: "A room becomes a story.",
    name: "Mesa",
    initial: "room",
    steps: [
      {
        id: "room",
        label: "The room",
        result:
          "A 3D room gives museum visitors a place to begin. Clickable books lead into the collection.",
      },
      {
        id: "book",
        label: "The book",
        result:
          "Chapter navigation, text, and video bring the story into an interface that feels like reading.",
      },
      {
        id: "kiosk",
        label: "The kiosk",
        result:
          "The exhibit moves from the development screen to a dedicated museum kiosk, made for visitors.",
      },
    ],
  },
  csdna: {
    title: "Make a pattern easier to see.",
    name: "csDNA",
    initial: "image",
    steps: [
      {
        id: "image",
        label: "The image",
        result:
          "Begin with detected points. This illustrated sample shows the idea; it is not microscopy data.",
      },
      {
        id: "groups",
        label: "Find groups",
        result:
          "Filtering and clustering make related points easier to inspect. A researcher can adjust the parameters.",
      },
      {
        id: "labels",
        label: "Add labels",
        result:
          "Inspect the groups, assign labels, and export categorized images and data. Judgment stays with the researcher.",
      },
    ],
  },
  soda: {
    title: "Build the things between people.",
    name: "SoDA",
    initial: "tools",
    steps: [
      {
        id: "tools",
        label: "The tools",
        result:
          "A shared platform brings the internal API, Discord bots, and web interface into one community codebase.",
      },
      {
        id: "onboard",
        label: "A way in",
        result:
          "Onboarding documentation helps a new contributor find the first useful step.",
      },
      {
        id: "workshops",
        label: "Build together",
        result:
          "Workshops on Docker, Flask, and Chrome extensions turn individual learning into something shared.",
      },
    ],
  },
  aether: {
    title: "Follow a thought.",
    name: "Aether",
    initial: "question",
    steps: [
      {
        id: "question",
        label: "One question",
        result:
          "Start with a question. Follow either direction without losing where you began.",
      },
      {
        id: "explore",
        label: "Explore a city",
        result:
          "One branch becomes a way to explore. The original question is still there to return to.",
      },
      {
        id: "belong",
        label: "Feel at home",
        result:
          "Another branch follows a different need. Both ideas can live beside each other.",
      },
    ],
  },
  gitcue: {
    title: "Find a stopping point.",
    name: "GitCue",
    initial: "changes",
    steps: [
      {
        id: "changes",
        label: "The changes",
        result:
          "A few related edits. The diff gives a commit message something useful to describe.",
      },
      {
        id: "pause",
        label: "A quiet moment",
        result:
          "New edits can cancel a pending commit. The workflow waits for the activity to settle.",
      },
      {
        id: "commit",
        label: "The commit",
        result:
          "A useful description of what changed, ready to find again in the project’s history.",
      },
    ],
  },
};

export function exhibitStep(id, value) {
  const exhibit = projectExhibits[id];
  return exhibit?.steps.find((step) => step.id === value) || exhibit?.steps[0];
}

export const exhibitCanvas = { width: 1280, height: 840 };
export function exhibitActionAt(id, uv) {
  const exhibit = projectExhibits[id];
  if (!exhibit || !uv || !Number.isFinite(uv.x) || !Number.isFinite(uv.y))
    return null;
  const x = uv.x * exhibitCanvas.width,
    y = (1 - uv.y) * exhibitCanvas.height;
  if (y < 732 || y > 804) return null;
  const i = Math.floor((x - 48) / 402);
  if (i < 0 || i >= 3 || x > 48 + i * 402 + 378) return null;
  return exhibit.steps[i].id;
}
