// Shared vector strokes: arrows must never turn into platform emoji on iOS.
export default function UiIcon({ name = "arrow", size = 16, className = "" }) {
  const paths = {
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 6l12 12M18 6 6 18",
    search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
    page: "M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6M9 16h6",
    enter: "M19 5v9H5m5-5-5 5 5 5",
    arrowRight: "M4 12h16m-7-7 7 7-7 7",
    arrowLeft: "M20 12H4m7-7-7 7 7 7",
    sliders:
      "M3 7h7m4 0h7M3 17h11m4 0h3M14 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    globe:
      "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 4 5 14 0 18-5-4-5-14 0-18Z",
    chevronUp: "M5 15l7-7 7 7",
    chevronDown: "M5 9l7 7 7-7",
    arrow: "M5 19 19 5M5 5h14v14",
    replay: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
    sound: "M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4",
    muted: "M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4M3 3l18 18",
  };
  return (
    <svg
      className={`ui-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
