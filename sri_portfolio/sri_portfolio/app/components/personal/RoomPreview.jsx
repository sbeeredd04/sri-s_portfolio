import { roomCovers } from "../../lib/reading-rooms.mjs";

// Captured from each actual /rooms page; no duplicate cover design or iframe.
export default function RoomPreview({ id }) {
  if (!roomCovers[id]) return null;
  return (
    <div className="room-preview" data-room={id} aria-hidden="true">
      <img
        src={`/room-previews/${id}.webp`}
        alt=""
        width={720}
        height={446}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
