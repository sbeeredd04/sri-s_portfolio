"use client";
import { Box, Boxes } from "./ScenePrimitives";
import { Sign, BotanicalPlant, StreetLamp } from "./StreetFurniture";
import { useRoomTexture } from "./RoomMaterials";
import WorkbenchNotebook from "./WorkbenchNotebook";
import { workbenchNotebooks } from "../../lib/workbench-notebooks.mjs";

const supports = [-1, 1].flatMap((side) => [
  ...[-0.6, 0.6].map((z) => ({
    position: [side * 1.65, 0.58, z],
    size: [0.055, 1.15, 0.055],
    radius: 0.012,
  })),
  {
    position: [side * 1.65, 1.84, -0.89],
    size: [0.035, 1.8, 0.035],
    radius: 0.01,
  },
]);
export default function Workbench({
  detailed,
  night,
  onVisit,
  onOpen,
  onCollection,
  onHover,
}) {
  const walnut = useRoomTexture("walnut");
  const stone = useRoomTexture("stone", 3);
  return (
    <group position={[-7, 0, 10]}>
      <Box
        position={[0, 0.04, 0]}
        size={[5, 0.08, 3.8]}
        color="#939a97"
        map={stone}
        radius={0.035}
      />
      <Box
        position={[0, 1.16, 0]}
        size={[4, 0.12, 1.8]}
        color="#bfa68a"
        map={walnut}
        radius={0.045}
      />
      <Boxes items={supports} color="#46566a" metalness={0.65} />
      <Box
        position={[0, 2.64, -0.9]}
        size={[3.68, 0.54, 0.07]}
        color="#a0aca7"
        radius={0.025}
      />
      <Sign
        title="Ideas begin here."
        subtitle="THE WORKBENCH / A FEW PAGES FROM MINE"
        position={[0, 2.64, -0.862]}
        size={[3.56, 0.48]}
        background="#dce3dd"
        foreground="#263d3f"
        secondary="#566e6a"
        accent="#849b91"
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta <= 4) onVisit();
        }}
      />
      {detailed &&
        workbenchNotebooks.map((book) => (
          <WorkbenchNotebook key={book.id} {...{ book, onOpen, onHover }} />
        ))}
      <Sign
        title="Browse the workbench  ↗"
        subtitle=""
        position={[0, 1.155, 0.965]}
        size={[1.9, 0.21]}
        background="#d2c8b4"
        foreground="#3c4949"
        accent="#87928a"
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta <= 4) onCollection();
        }}
      />
      <BotanicalPlant position={[-2.15, 0.08, -0.9]} scale={0.55} />
      <StreetLamp position={[2.6, 0, -1.3]} night={night} />
    </group>
  );
}
