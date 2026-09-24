"use client";
import { useEffect, useId, useRef, useState } from "react";
import { mailDraft } from "../../lib/contact-validation.mjs";

const sfDate = (date, withTime = false) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
export default function ContactComposer() {
  const id = useId(),
    pending = useRef(false);
  const [available, setAvailable] = useState(false),
    [status, setStatus] = useState("idle"),
    [feedback, setFeedback] = useState(""),
    [today, setToday] = useState(""),
    [postmark, setPostmark] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  useEffect(() => setToday(sfDate(new Date())), []);
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
      setPostmark(sfDate(new Date(), true));
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
  const field = (key, label, type, max) => (
    <label key={key} htmlFor={`${id}-${key}`}>
      <span>{label}</span>
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
  );
  return (
    <form
      className="contact-composer letter"
      data-status={status}
      onSubmit={send}
    >
      <div className="letter-sheet">
        <div className="letter-head">
          <p className="letter-date">
            San Francisco
            {today && (
              <>
                {" "}
                · <time>{today}</time>
              </>
            )}
          </p>
          <span className="letter-stamp" aria-hidden="true">
            <b>sri.</b>
            <small>SF · CA</small>
          </span>
        </div>
        <p className="letter-salutation">Dear Sri,</p>
        <label className="letter-body" htmlFor={`${id}-message`}>
          <span>Your message</span>
          <textarea
            id={`${id}-message`}
            name="message"
            rows={6}
            maxLength={3000}
            required
            placeholder="No perfect pitch needed. What’s on your mind?"
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
          />
        </label>
        <p className="letter-signoff">Yours,</p>
        <div className="contact-fields">
          {field("name", "Signed", "text", 80)}
          {field("email", "Reply to", "email", 254)}
        </div>
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
              className="letter-send"
              disabled={status === "sending" || status === "sent"}
            >
              {status === "sent"
                ? "Sent ✓"
                : status === "sending"
                  ? "Sending…"
                  : "Seal and send"}
            </button>
          )}
          <a
            className={available ? "letter-alt" : "letter-send"}
            href={mailDraft(draft)}
          >
            {available
              ? "Use my email app instead"
              : "Continue in your email app"}
          </a>
        </div>
        <p className="contact-status" role="status">
          {feedback ||
            (available
              ? "Your name, email and message go privately to Sri. No mailing list."
              : "Your draft opens in your email app. Review it there before sending.")}
        </p>
        {status === "sent" && (
          <span className="letter-postmark" aria-hidden="true">
            <span>SAN FRANCISCO</span>
            <b>{postmark}</b>
            <span>RECEIVED</span>
          </span>
        )}
      </div>
    </form>
  );
}
