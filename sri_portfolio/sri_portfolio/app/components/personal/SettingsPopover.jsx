"use client";
import { useEffect, useId, useRef, useState } from "react";

export default function SettingsPopover({ children }) {
  const ref = useRef(),
    trigger = useRef(),
    panelId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <div
      ref={ref}
      className="world-settings"
      data-open={open}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        View &amp; sound{" "}
        <svg
          viewBox="0 0 20 20"
          width="16"
          height="16"
          aria-hidden="true"
          fill="currentColor"
        >
          <rect x="2" y="4" width="16" height="2" rx="1" />
          <circle cx="7" cy="5" r="3" />
          <rect x="2" y="14" width="16" height="2" rx="1" />
          <circle cx="13" cy="15" r="3" />
        </svg>
      </button>
      {/* Keep the audio control mounted when the panel closes. */}
      <div
        id={panelId}
        role="group"
        aria-label="View and sound settings"
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
