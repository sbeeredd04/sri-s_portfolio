"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// R3F normally only hit-tests on pointer movement. A camera flight or an
// animated character must also retire the hover under a stationary pointer.
export default function ScenePointer({ enabled, animate, cursor, onHover }) {
  const { gl, events, camera } = useThree();
  const inside = useRef(false),
    last = useRef(0);
  const matrix = useRef(null);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = enabled ? cursor : "auto";
    return () => {
      canvas.style.cursor = "";
    };
  }, [gl, cursor, enabled]);
  useEffect(() => {
    const leave = () => {
      inside.current = false;
      onHover("");
    };
    const move = (event) => {
      inside.current =
        event.pointerType === "mouse" && event.target === gl.domElement;
      if (!inside.current) onHover("");
    };
    if (!enabled) leave();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    gl.domElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      gl.domElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, gl, onHover]);
  useFrame(({ clock }) => {
    if (!enabled || !inside.current || clock.elapsedTime - last.current < 0.1)
      return;
    if (animate || !matrix.current?.equals(camera.matrixWorld)) {
      events.update?.();
      matrix.current = camera.matrixWorld.clone();
    }
    last.current = clock.elapsedTime;
  });
  return null;
}
