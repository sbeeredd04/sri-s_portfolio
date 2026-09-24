"use client";
export default function PrintResume() {
  return (
    <button className="site-tool" onClick={() => window.print()}>
      Print or save PDF
    </button>
  );
}
