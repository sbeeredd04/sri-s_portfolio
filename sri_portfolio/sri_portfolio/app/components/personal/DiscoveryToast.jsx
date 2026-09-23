"use client";
import { useEffect, useRef, useState } from "react";
import { discoveries } from "../../lib/discoveries.mjs";
export default function DiscoveryToast({ onOpen }) {
  const [item, setItem] = useState(null),
    timer = useRef();
  useEffect(() => {
    const found = (e) => {
      setItem(discoveries.find((d) => d.id === e.detail));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setItem(null), 6000);
    };
    window.addEventListener("sri:discovery", found);
    return () => {
      window.removeEventListener("sri:discovery", found);
      clearTimeout(timer.current);
    };
  }, []);
  return item ? (
    <div className="discovery-toast" role="status">
      <span aria-hidden="true">✦</span>
      <div>
        <small>A LITTLE DISCOVERY</small>
        <strong>{item.title}</strong>
      </div>
      <button
        onClick={() => {
          setItem(null);
          onOpen();
        }}
      >
        View ↗
      </button>
      <button aria-label="Dismiss discovery" onClick={() => setItem(null)}>
        ×
      </button>
    </div>
  ) : null;
}
