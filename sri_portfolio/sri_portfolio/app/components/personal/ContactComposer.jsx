"use client";
import { useEffect, useId, useRef, useState } from "react";
import { mailDraft } from "../../lib/contact-validation.mjs";
export default function ContactComposer() {
  const id = useId(),
    pending = useRef(false);
  const [available, setAvailable] = useState(false),
    [status, setStatus] = useState("idle"),
    [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/contact", { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => setAvailable(Boolean(r?.available)))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  async function send(e) {
    e.preventDefault();
    if (!available || pending.current) return;
    pending.current = true;
    setStatus("sending");
    setFeedback("Sending your note…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "That didn’t reach my inbox. Try email below.",
        );
      setStatus("sent");
      setFeedback("Your note is in my inbox. Thanks for reaching out.");
    } catch (error) {
      setStatus("error");
      setFeedback(
        error.name === "TimeoutError"
          ? "Delivery wasn’t confirmed. Your draft is still here; you can use email below."
          : error.message,
      );
    } finally {
      pending.current = false;
    }
  }
  return (
    <form className="contact-composer" onSubmit={send}>
      <h3>A note, straight from here.</h3>
      <p>No perfect pitch needed. What’s on your mind?</p>
      <div className="contact-fields">
        {[
          ["name", "Your name", "text", 80],
          ["email", "Email for my reply", "email", 254],
        ].map(([key, label, type, max]) => (
          <label key={key} htmlFor={`${id}-${key}`}>
            {label}
            <input
              id={`${id}-${key}`}
              name={key}
              autoComplete={key}
              type={type}
              maxLength={max}
              required
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <label htmlFor={`${id}-message`}>
        Your message
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          maxLength={3000}
          required
          value={draft.message}
          onChange={(e) => setDraft({ ...draft, message: e.target.value })}
        />
      </label>
      <div className="contact-trap" aria-hidden="true">
        <label>
          Leave this empty
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={draft.website}
            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
          />
        </label>
      </div>
      <div className="contact-submit">
        {available && (
          <button
            type="submit"
            className="app-action"
            disabled={status === "sending" || status === "sent"}
          >
            {status === "sent"
              ? "Note received ✓"
              : status === "sending"
                ? "Sending…"
                : "Send your note"}
          </button>
        )}
        <a
          className={available ? "app-list-link" : "app-action"}
          href={mailDraft(draft)}
        >
          {available
            ? "Use my email app instead ↗"
            : "Continue in your email app ↗"}
        </a>
      </div>
      <p className="contact-status" role="status">
        {feedback ||
          (available
            ? "Your name, email and message go privately to Sri. No mailing list."
            : "Your draft opens in your email app. Review it there before sending.")}
      </p>
    </form>
  );
}
