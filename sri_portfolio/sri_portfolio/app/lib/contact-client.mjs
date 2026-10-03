import { validateMessage } from "./contact-validation.mjs";

export async function submitContact(draft, { signal, request = fetch } = {}) {
  if (!validateMessage(draft))
    throw new Error("Please check your name, reply email and message.");
  let response;
  try {
    response = await request("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
      signal,
    });
  } catch (error) {
    if (signal?.aborted || error.name === "TimeoutError")
      throw new Error(
        "Delivery wasn’t confirmed. Your draft is still here; try again or use email below.",
      );
    throw new Error(
      "The connection failed. Your draft is still here; try again or use email below.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.id)
    throw new Error(
      data?.error ||
        "Delivery wasn’t confirmed. Your draft is still here; try again or use email below.",
    );
  return data;
}

export function gmailDraft(draft) {
  const query = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: "srisubspace@gmail.com",
    su: `Hello from ${draft.name || "your website"}`,
    body: `${draft.message || ""}\n\n${draft.name || ""}${draft.email ? `\nReply to: ${draft.email}` : ""}`,
  });
  return `https://mail.google.com/mail/?${query}`;
}
