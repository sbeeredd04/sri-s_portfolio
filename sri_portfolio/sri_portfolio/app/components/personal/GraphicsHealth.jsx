"use client";
import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import RenderDiagnostics from "./RenderDiagnostics";
import { supportsWebGL2 } from "../../lib/webgl-support.mjs";

export function GraphicsGate({ children, onUnavailable }) {
  const [supported, setSupported] = useState(null);
  useEffect(() => {
    const available = supportsWebGL2(() => document.createElement("canvas"));
    setSupported(available);
    if (!available) onUnavailable();
  }, [onUnavailable]);
  return supported ? children : null;
}
export default function GraphicsHealth({ onUnavailable }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event) => {
      event.preventDefault();
      onUnavailable();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  // Real context-loss QA is available only in a development build and only
  // when explicitly requested in the URL. No diagnostic UI ships to production.
  if (
    process.env.NODE_ENV === "development" &&
    new URLSearchParams(location.search).has("diagnostics")
  ) {
    return (
      <>
        <RenderDiagnostics />
        <Html
          fullscreen
          calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
          style={{ pointerEvents: "none" }}
        >
          <button
            className="graphics-test-control"
            onClick={() =>
              gl.getContext().getExtension("WEBGL_lose_context")?.loseContext()
            }
          >
            Test graphics recovery
          </button>
        </Html>
      </>
    );
  }
  return null;
}
