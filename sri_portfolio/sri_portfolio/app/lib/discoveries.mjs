export const discoveries = [
  {
    id: "hello-world",
    title: "Hello, world.",
    hint: "Say hello to a familiar face.",
    note: "A little wave goes a long way.",
  },
  {
    id: "three-screens",
    title: "Too many tabs. Just enough screens.",
    hint: "There are three stories on the desk.",
    note: "Work, the current chapter, and something in the background.",
  },
  {
    id: "curiosity",
    title: "A ripple of curiosity.",
    hint: "Some things happen when you slow down by the water.",
    note: "The lake remembers your last little interruption.",
  },
  {
    id: "nine-nine",
    title: "Nine-nine!",
    hint: "The terminal has a favourite precinct.",
    note: "A familiar show. Very good background company.",
  },
  {
    id: "one-more-thing",
    title: "One more thing.",
    hint: "Try those three words in the little terminal.",
    note: "Make the details worth noticing. Then keep going.",
  },
];
const key = "sri-little-discoveries-v1";
let memory = [];
export function foundDiscoveries() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(value))
      memory = value.filter((x) => discoveries.some((d) => d.id === x));
  } catch {}
  return [...new Set(memory)];
}
export function discover(id) {
  if (typeof window === "undefined" || !discoveries.some((d) => d.id === id))
    return;
  const found = foundDiscoveries();
  if (found.includes(id)) return;
  memory = [...found, id];
  try {
    localStorage.setItem(key, JSON.stringify(memory));
  } catch {}
  window.dispatchEvent(new CustomEvent("sri:discovery", { detail: id }));
  // Anonymous event only; no name, email, fingerprint or visitor identifier is sent.
  fetch("/api/discoveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    keepalive: true,
  }).catch(() => {});
}
export function terminalReply(input) {
  const command = input.trim().toLowerCase().replace(/\s+/g, " ");
  const secrets = {
    "nine-nine": "nine-nine",
    "nine nine": "nine-nine",
    "one more thing": "one-more-thing",
    "hello world": "hello-world",
  };
  if (secrets[command])
    return {
      text: discoveries.find((d) => d.id === secrets[command]).note,
      discovery: secrets[command],
    };
  if (command === "help")
    return {
      text: "whoami · now · ls · agent plan · resume · clear\nA couple of familiar phrases work here, too.",
    };
  if (command === "whoami")
    return {
      text: "Sri Ujjwal Reddy. Founding Engineer at Offseason, San Francisco.\nASU graduate · 4.0 GPA · entrepreneurship certificate.\nCurious about how things work. Particular about how they feel.",
    };
  if (command === "now")
    return {
      text: "Building an AI agent for personal wellness at Offseason.\nSide projects, iPhone apps, a little music, and one more game when the day is done.",
    };
  if (command === "ls")
    return {
      text: "work/  projects and hackathons\nhome/  three screens and a rainy window\nafter-hours/  courts, records, familiar shows\nout-there/  city walks and places to explore\nfieldnotes/  future stories and conversations",
    };
  if (command === "agent plan")
    return {
      text: "A small, prepared plan for an idea:\n1. Who is it for?\n2. What is the smallest useful thing?\n3. Make it. Try it. Notice what feels wrong.\n4. Make it better.",
    };
  if (command === "resume")
    return {
      text: "The professional details, in one place.",
      link: "/resume",
      label: "Open my résumé ↗",
    };
  if (command === "clear") return { clear: true };
  return { text: "That one isn’t in this little console yet. Try help." };
}
