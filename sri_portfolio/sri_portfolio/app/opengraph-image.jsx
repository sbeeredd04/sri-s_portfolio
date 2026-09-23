import { ImageResponse } from "next/og";
export const alt = "Sri Ujjwal Reddy. A little world of my own.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0c1425, #253752)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "65px 80px",
        color: "#edf3ff",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 21,
          letterSpacing: 3,
          color: "#bbcee8",
        }}
      >
        SRI UJJWAL REDDY
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 100,
          letterSpacing: -6,
          lineHeight: 1.05,
          marginTop: 65,
        }}
      >
        <span>A little world</span>
        <span style={{ color: "#bdc9ed" }}>of my own.</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          marginTop: 55,
          color: "#b4c7e4",
        }}
      >
        Founding Engineer at Offseason · San Francisco
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 85,
          bottom: 65,
          fontSize: 23,
          color: "#c6d9f4",
        }}
      >
        sriujjwalreddy.com ↗
      </div>
    </div>,
    size,
  );
}
