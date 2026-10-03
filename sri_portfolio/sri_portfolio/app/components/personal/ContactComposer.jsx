"use client";
import { useEffect, useId, useRef, useState } from "react";
import { mailDraft } from "../../lib/contact-validation.mjs";
import { submitContact, gmailDraft } from "../../lib/contact-client.mjs";

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
    pending = useRef(false),
    delivery = useRef(null);
  const [status, setStatus] = useState("idle"),
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
  useEffect(() => () => delivery.current?.abort(), []);
  async function send(e) {
    e.preventDefault();
    if (pending.current || status === "sent") return;
    pending.current = true;
    setStatus("sending");
    setFeedback("Sending your note…");
    const controller = new AbortController();
    delivery.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      await submitContact(draft, { signal: controller.signal });
      setPostmark(sfDate(new Date(), true));
      setStatus("sent");
      setFeedback(
        "Your note was saved to my private website inbox. Thanks for reaching out.",
      );
    } catch (error) {
      setStatus("error");
      setFeedback(
        error.name === "TimeoutError"
          ? "Delivery wasn’t confirmed. Your draft is still here; you can use email below."
          : error.message,
      );
    } finally {
      clearTimeout(timeout);
      delivery.current = null;
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
          <button
            type="submit"
            className="letter-send"
            disabled={status === "sending" || status === "sent"}
          >
            {status === "sent"
              ? "Sent ✓"
              : status === "sending"
                ? "Sending…"
                : "Send message"}
          </button>
          <a className="letter-alt" href={mailDraft(draft)}>
            Use my email app
          </a>
          <a
            className="letter-alt"
            href={gmailDraft(draft)}
            target="_blank"
            rel="noreferrer"
          >
            Open Gmail
          </a>
        </div>
        <p className="contact-status" role="status">
          {feedback ||
            "Your name, email and message go to Sri’s private website inbox. Email options open a draft for you to review and send."}
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
