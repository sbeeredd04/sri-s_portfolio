"use client";
import { Box, Rods } from "./ScenePrimitives";
import { Upholstery, Piping } from "./ListeningFurniture";
import { useRoomTexture } from "./RoomMaterials";

// The front of the chair is +Z. Placement points it toward the actual screen.
export default function CinemaSeat({ position, yaw }) {
  const wood = useRoomTexture("walnut", 1);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Box
        position={[0, 0.43, 0]}
        size={[0.87, 0.09, 0.87]}
        radius={0.025}
        color="#292e38"
        metalness={0.5}
      />
      <Upholstery
        position={[0, 0.54, 0.03]}
        size={[0.78, 0.22, 0.81]}
        radius={0.08}
        color="#684450"
      />
      <Piping
        width={0.66}
        height={0.7}
        position={[0, 0.635, 0.03]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#8f6674"
      />
      <group position={[0, 0.99, -0.4]} rotation={[-0.1, 0, 0]}>
        <Box
          size={[0.86, 0.99, 0.08]}
          radius={0.04}
          map={wood}
          color="#ae9385"
        />
        <Upholstery
          position={[0, 0, 0.09]}
          size={[0.78, 0.89, 0.16]}
          radius={0.07}
          color="#704855"
        />
        <Piping
          width={0.66}
          height={0.77}
          position={[0, 0, 0.166]}
          color="#8f6674"
        />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 0.47, 0.75, 0.03]}
            size={[0.12, 0.075, 0.84]}
            radius={0.025}
            map={wood}
            color="#b49c89"
          />
          <Rods
            color="#3f4854"
            segments={[
              {
                from: [side * 0.35, 0.02, -0.32],
                to: [side * 0.4, 0.72, -0.3],
                radius: 0.024,
              },
              {
                from: [side * 0.35, 0.02, 0.31],
                to: [side * 0.4, 0.72, 0.31],
                radius: 0.024,
              },
            ]}
          />
        </group>
      ))}
      <mesh position={[0.47, 0.789, 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.043, 24]} />
        <meshStandardMaterial color="#121b25" roughness={0.6} />
      </mesh>
    </group>
  );
}
