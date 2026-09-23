"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Character from "./Character";
import { Ball, Rod } from "./ScenePrimitives";
import { shuttleFlight } from "../../lib/shuttle-flight.mjs";
import {
  RACKET_CONTACT_HEIGHT,
  RALLY_DURATION,
  rallyPlayers,
  racketPose,
  racketContact,
} from "../../lib/character-motion.mjs";

function Racket() {
  const strings = useMemo(() => {
    const points = [];
    for (const n of [-0.12, -0.06, 0, 0.06, 0.12]) {
      const half = Math.sqrt(0.195 ** 2 - (n / 0.82) ** 2);
      points.push(
        n,
        RACKET_CONTACT_HEIGHT - half,
        0,
        n,
        RACKET_CONTACT_HEIGHT + half,
        0,
      );
      const width = Math.sqrt(0.195 ** 2 - n ** 2) * 0.82;
      points.push(
        -width,
        RACKET_CONTACT_HEIGHT + n,
        0,
        width,
        RACKET_CONTACT_HEIGHT + n,
        0,
      );
    }
    return new Float32Array(points);
  }, []);
  return (
    <group>
      <Rod
        from={[0, -0.055, 0]}
        to={[0, 0.365, 0]}
        radius={0.018}
        color="#adbfd8"
      />
      <Rod
        from={[0, -0.055, 0]}
        to={[0, 0.11, 0]}
        radius={0.031}
        color="#485676"
      />
      <mesh
        position={[0, RACKET_CONTACT_HEIGHT, 0]}
        scale={[0.82, 1, 1]}
        castShadow
      >
        <torusGeometry args={[0.21, 0.018, 10, 36]} />
        <meshStandardMaterial
          color="#aec9ec"
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strings, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f1f2ee" transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
}

export default function BadmintonRally({ animate }) {
  const shuttle = useRef(),
    rackets = useRef([]),
    elapsed = useRef(0);
  const poses = useMemo(() => [{ current: {} }, { current: {} }], []);
  const contacts = useMemo(() => rallyPlayers.map(racketContact), []);
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame((_, delta) => {
    if (animate) elapsed.current += Math.min(delta, 0.05);
    const cycle = Math.floor(elapsed.current / RALLY_DURATION);
    const flight = shuttleFlight(
      elapsed.current % RALLY_DURATION,
      RALLY_DURATION,
    );
    const from = contacts[cycle % 2],
      to = contacts[(cycle + 1) % 2];
    shuttle.current.position.lerpVectors(from, to, flight.progress);
    shuttle.current.position.y = flight.height;
    velocity.subVectors(to, from).multiplyScalar(flight.progressVelocity);
    velocity.y = flight.verticalVelocity;
    shuttle.current.quaternion.setFromUnitVectors(up, velocity.normalize());
    for (let i = 0; i < 2; i++) {
      const stroke = racketPose(elapsed.current - i * RALLY_DURATION);
      poses[i].current = { right: stroke.wrist, left: [-0.4, 0.48, 0.12] };
      if (rackets.current[i]) rackets.current[i].rotation.x = stroke.angle;
    }
  }, -2);
  return (
    <group>
      {rallyPlayers.map((player, i) => (
        <Character
          key={i}
          position={player.position}
          rotation={player.rotation}
          color={i ? "#8c9dc3" : "#9c97bf"}
          animate={animate}
          phase={i * 2.1}
          pose={poses[i]}
          rightHand={
            <group
              ref={(g) => {
                rackets.current[i] = g;
              }}
            >
              <Racket />
            </group>
          }
        />
      ))}
      <group ref={shuttle}>
        <mesh position={[0, -0.1, 0]}>
          <coneGeometry args={[0.1, 0.17, 12, 1, true]} />
          <meshStandardMaterial
            color="#f1f1e8"
            roughness={0.78}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Ball position={[0, 0, 0]} size={0.043} color="#dac4a7" />
      </group>
    </group>
  );
}
