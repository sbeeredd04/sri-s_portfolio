"use client";
import { useEffect, useRef } from "react";

// A damped spring follows the pointer. The native pointer remains on touch,
// editable text, reduced motion, and whenever this component is disabled.
export default function PhysicsCursor({ enabled, hint = "" }) {
  const element = useRef(null),
    hoverHint = useRef(hint),
    overCanvas = useRef(false);
  hoverHint.current = hint;
  useEffect(() => {
    if (element.current && overCanvas.current) {
      element.current.dataset.interactive = Boolean(hint);
      element.current.querySelector("b").textContent = hint;
    }
  }, [hint]);
  useEffect(() => {
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!enabled || !media.matches) return;
    const node = element.current;
    let frame = 0,
      last = 0,
      active = false;
    const point = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    function hide() {
      active = false;
      cancelAnimationFrame(frame);
      frame = 0;
      node.style.opacity = "0";
      node.dataset.pressed = "false";
      document.documentElement.classList.remove("glass-cursor-active");
    }
    function tick(now) {
      const dt = Math.min((now - last) / 1000 || 1 / 60, 1 / 30);
      last = now;
      // Substeps keep the spring stable on slower displays.
      for (let i = 0; i < 4; i++) {
        const h = dt / 4;
        point.vx += ((point.tx - point.x) * 650 - point.vx * 42) * h;
        point.vy += ((point.ty - point.y) * 650 - point.vy * 42) * h;
        point.x += point.vx * h;
        point.y += point.vy * h;
      }
      const speed = Math.hypot(point.vx, point.vy);
      const angle =
        speed > 8 ? (Math.atan2(point.vy, point.vx) * 180) / Math.PI : 0;
      const stretch = Math.min(speed / 2800, 0.38);
      node.querySelector("b").style.transform =
        `rotate(${-angle}deg) scale(${1 / (1 + stretch)},${1 / (1 - stretch * 0.4)})`;
      node.style.transform = `translate3d(${point.x}px,${point.y}px,0) rotate(${angle}deg) scale(${1 + stretch},${1 - stretch * 0.4})`;
      frame = 0;
      if (
        active &&
        (speed > 0.4 ||
          Math.hypot(point.tx - point.x, point.ty - point.y) > 0.1)
      )
        frame = requestAnimationFrame(tick);
    }
    function move(e) {
      if (
        e.pointerType !== "mouse" ||
        !media.matches ||
        e.target.closest("input,textarea,[contenteditable=true]")
      )
        return hide();
      point.tx = e.clientX;
      point.ty = e.clientY;
      if (!active) {
        point.x = point.tx;
        point.y = point.ty;
        point.vx = point.vy = 0;
      }
      active = true;
      node.style.opacity = "1";
      const target = e.target.closest("button,a,[role=button],summary");
      overCanvas.current = e.target.tagName === "CANVAS";
      const interactive =
        (target && !target.matches(":disabled,[aria-disabled=true]")) ||
        (e.target.closest("canvas") && hoverHint.current);
      node.dataset.interactive = Boolean(interactive);
      node.querySelector("b").textContent = interactive
        ? target
          ? target.dataset.cursor || ""
          : overCanvas.current
            ? hoverHint.current
            : ""
        : "";
      document.documentElement.classList.add("glass-cursor-active");
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    const down = () => {
      node.dataset.pressed = "true";
    };
    const up = () => {
      node.dataset.pressed = "false";
    };
    const key = (e) => {
      if (e.key === "Tab") hide();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("keydown", key);
    document.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", hide);
    media.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", hide);
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", hide);
      media.removeEventListener("change", hide);
    };
  }, [enabled]);
  return (
    <div ref={element} className="physics-cursor" aria-hidden="true">
      <i />
      <b />
    </div>
  );
}
