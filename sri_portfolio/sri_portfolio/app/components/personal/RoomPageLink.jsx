"use client";
import { useEffect, useState } from "react";
import { roomPageHref } from "../../lib/reading-rooms.mjs";
export default function RoomPageLink({ id, collection, projectHash = null }) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return (
    <a
      className="room-page-link"
      href={roomPageHref(id, collection, projectHash ?? hash)}
      aria-label="Open this room as a full page"
    >
      Open page
    </a>
  );
}
