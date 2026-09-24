// One command registry for every terminal on the site: the "/" bar over the
// dock and the little console in Discoveries. A reply is plain data:
//   { text, discovery?, link?, label?, clear?, action? }
// where action is { type: "travel", biome } | { type: "stop", biome, stop }
// | { type: "open", content }. The shell performs actions; nothing here
// touches the DOM, so it runs the same in tests.
import { placeStops } from "./place-stops.mjs";
import { discoveries } from "./discoveries.mjs";

export const FALLBACK = "That one isn’t in this little console yet. Try help.";

export const places = [
  { biome: "planet", names: ["world", "planet", "~", "/"], label: "the world" },
  {
    biome: "studio",
    names: ["home", "sf", "san francisco", "studio"],
    label: "Home",
  },
  {
    biome: "projects",
    names: ["made", "work", "foundry", "valley", "projects"],
    label: "the Foundry",
  },
  {
    biome: "court",
    names: ["after hours", "after-hours", "courts", "court", "play"],
    label: "After hours",
  },
  {
    biome: "trail",
    names: ["out there", "out-there", "trail", "outdoors", "yosemite"],
    label: "Out there",
  },
  {
    biome: "future",
    names: ["fieldnotes", "notes", "blog", "garden"],
    label: "Fieldnotes",
  },
];

const sections = {
  work: "work",
  projects: "work",
  about: "about",
  me: "about",
  skills: "skills",
  tools: "skills",
  stack: "skills",
  music: "music",
  journey: "journey",
  writing: "writing",
  socials: "socials",
  contact: "contact",
  eggs: "discoveries",
  discoveries: "discoveries",
  index: "index",
};

const secrets = {
  "nine-nine": "nine-nine",
  "nine nine": "nine-nine",
  "one more thing": "one-more-thing",
  "hello world": "hello-world",
};

const text = {
  whoami:
    "Sri Ujjwal Reddy. Founding Engineer at Offseason, San Francisco.\nASU graduate · 4.0 GPA · entrepreneurship certificate.\nCurious about how things work. Particular about how they feel.",
  now: "Building an AI agent for personal wellness at Offseason.\nSide projects, iPhone apps, a little music, and one more game when the day is done.",
  ls: "home/  three screens and a rainy window\nmade/  projects, a keynote hall and the tools\nafter-hours/  courts, records, familiar shows\nout-there/  a trail, a lake and a camp\nfieldnotes/  a newsstand and future stories",
  "agent plan":
    "A small, prepared plan for an idea:\n1. Who is it for?\n2. What is the smallest useful thing?\n3. Make it. Try it. Notice what feels wrong.\n4. Make it better.",
};

const normalise = (input) =>
  String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const placeFor = (name) =>
  places.find((p) =>
    p.names.includes(name.length > 1 ? name.replace(/\/$/, "") : name),
  );

// Every camera stop by id and by label, e.g. "keynote", "the newsstand".
function stopFor(name) {
  const bare = name.replace(/^the /, "");
  for (const [biome, stops] of Object.entries(placeStops))
    for (const stop of stops) {
      const label = normalise(stop.label).replace(/^the /, "");
      if (stop.id === bare || label === bare) return { biome, stop };
    }
  return null;
}

export const commandHelp = [
  ["cd <place>", "home, made, after-hours, out-there, fieldnotes"],
  ["go <stop>", "a view by name, e.g. go keynote, go newsstand"],
  ["open <room>", "work, about, skills, music, writing, contact, eggs"],
  ["ls", "what is where"],
  ["whoami · now · resume", "the short version"],
  ["eggs", "how many little discoveries you have found"],
  ["clear", "start over"],
];

export function runCommand(
  input,
  { found = [], total = discoveries.length } = {},
) {
  const command = normalise(input);
  if (!command) return { text: "" };
  if (secrets[command])
    return {
      text: discoveries.find((d) => d.id === secrets[command]).note,
      discovery: secrets[command],
    };
  if (command === "help")
    return {
      text:
        commandHelp.map(([c, d]) => `${c.padEnd(21)} ${d}`).join("\n") +
        "\nA couple of familiar phrases work here, too.",
    };
  if (text[command]) return { text: text[command] };
  if (command === "resume")
    return {
      text: "The professional details, in one place.",
      link: "/resume",
      label: "Open my résumé ↗",
    };
  if (command === "clear") return { clear: true };
  if (command === "eggs" || command === "discoveries")
    return {
      text: `${found.length} of ${total} little discoveries found.${found.length < total ? " Keep poking around." : " All of them. Thank you for looking so closely."}`,
      action: { type: "open", content: "discoveries" },
    };
  const [verb, ...rest] = command.split(" ");
  const arg = rest.join(" ");
  if ((verb === "cd" || verb === "go" || verb === "goto") && arg) {
    if (arg === "..") return travel(places[0]);
    // cd prefers places, go prefers views ("go valley" is the view).
    const place = placeFor(arg),
      hit = stopFor(arg);
    if (verb === "cd" ? place : !hit && place) return travel(place);
    if (hit) return goToStop(hit);
    return { text: `No place called “${arg}” yet. Try ls.` };
  }
  if (verb === "open" && arg) {
    if (arg === "resume") return runCommand("resume");
    if (sections[arg]) return openRoom(sections[arg]);
    return { text: `Nothing called “${arg}” to open. Try help.` };
  }
  const place = placeFor(command);
  if (place) return travel(place);
  const hit = stopFor(command);
  if (hit) return goToStop(hit);
  return { text: FALLBACK };
}

function travel(place) {
  return {
    text: `Heading to ${place.label}…`,
    action: { type: "travel", biome: place.biome },
  };
}
function goToStop({ biome, stop }) {
  return {
    text: `${stop.label}.`,
    action: { type: "stop", biome, stop: stop.id },
  };
}
function openRoom(content) {
  return { text: `Opening ${content}…`, action: { type: "open", content } };
}

// Completions for a partial input: commands, places and stop names.
export function completions(input, limit = 5) {
  const q = normalise(input);
  const pool = [
    ...commandHelp.map(([c]) => c.split(" ")[0]),
    ...places.map((p) => `cd ${p.names[0]}`),
    ...Object.values(placeStops)
      .flat()
      .filter((s) => s.label)
      .map((s) => `go ${normalise(s.label).replace(/^the /, "")}`),
    ...Object.keys(sections).map((s) => `open ${s}`),
  ];
  const unique = [...new Set(pool)];
  if (!q) return ["help", "ls", "cd made", "go keynote", "open work"];
  return unique.filter((c) => c.startsWith(q) && c !== q).slice(0, limit);
}
