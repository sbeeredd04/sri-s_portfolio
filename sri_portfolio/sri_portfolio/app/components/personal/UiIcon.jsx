// Shared vector strokes: arrows must never turn into platform emoji on iOS.
export default function UiIcon({ name = "arrow", size = 16, className = "" }) {
  const paths = {
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
