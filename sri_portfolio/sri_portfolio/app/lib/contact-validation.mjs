export const discoveryIds = [
  "nine-nine",
  "one-more-thing",
  "hello-world",
  "curiosity",
  "three-screens",
];
export function validateMessage(value) {
  if (!value || typeof value !== "object") return null;
  const clean = (key, max) =>
    typeof value[key] === "string" && value[key].trim().length <= max
      ? value[key].trim()
      : "";
  const name = clean("name", 80),
    email = clean("email", 254),
    message = clean("message", 3000);
  if (
    !name ||
    !message ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[\r\n]/.test(name + email) ||
    value.website
  )
    return null;
  return { name, email, message };
}
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
export function mailDraft({ name = "", email = "", message = "" }) {
  return `mailto:srisubspace@gmail.com?subject=${encodeURIComponent(`Hello from ${name || "your website"}`)}&body=${encodeURIComponent(`${message}\n\n${name}${email ? `\nReply to: ${email}` : ""}`)}`;
}
