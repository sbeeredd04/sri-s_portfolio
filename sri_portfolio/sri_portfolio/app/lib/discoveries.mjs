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
