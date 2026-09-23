"use client";
import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  CylinderCollider,
  BallCollider,
  TrimeshCollider,
  useBeforePhysicsStep,
} from "@react-three/rapier";
import {
  studioSurfaces,
  APARTMENT_LEVEL,
  studioDeskFrame,
  studioMonitors,
  studioMonitorScale,
  studioProps,
  studioCharacter,
} from "../../lib/studio-layout.mjs";
import { groundColliderData } from "../../lib/world-layout.mjs";
import * as THREE from "three";
import { Mug, ReadingBook, Cushion } from "./StudioProps";

function HeldObject({
  position,
  rotation = [0, 0, 0],
  mass = 0.5,
  children,
  collider,
  animate,
  onHover,
  onCue,
}) {
  const body = useRef(),
    grab = useRef(null),
    priorControls = useRef(true);
  const { controls, invalidate } = useThree();
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.28),
    [],
  );
  const hit = useMemo(() => new THREE.Vector3(), []);
  function release() {
    if (!grab.current) return;
    grab.current = null;
    if (controls) controls.enabled = priorControls.current;
    document.body.style.cursor = "";
    onHover?.("");
    invalidate();
  }
  useEffect(() => {
    window.addEventListener("blur", release);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("blur", release);
      window.removeEventListener("pointerup", release);
      if (grab.current && controls) controls.enabled = priorControls.current;
      document.body.style.cursor = "";
    };
  }, [controls]);
  useEffect(() => {
    if (!animate) release();
  }, [animate]);
  useBeforePhysicsStep(() => {
    if (!grab.current || !body.current || !animate) return;
    const p = body.current.translation(),
      v = body.current.linvel(),
      target = grab.current;
    // Critical damping makes the hold feel weighted without teleporting the body.
    const k = 110,
      damping = 19,
      m = body.current.mass(),
      dt = 1 / 60;
    const impulse = {
      x: ((target.x - p.x) * k - v.x * damping) * m * dt,
      y: ((target.y - p.y) * k - v.y * damping + 9.81) * m * dt,
      z: ((target.z - p.z) * k - v.z * damping) * m * dt,
    };
    const limit = m * 1.2;
    impulse.x = THREE.MathUtils.clamp(impulse.x, -limit, limit);
    impulse.y = THREE.MathUtils.clamp(impulse.y, -limit, limit);
    impulse.z = THREE.MathUtils.clamp(impulse.z, -limit, limit);
    body.current.applyImpulse(impulse, true);
  });
  return (
    <RigidBody
      ref={body}
      position={position}
      rotation={rotation}
      colliders={false}
      ccd
      linearDamping={0.5}
      angularDamping={1.2}
      friction={0.65}
      restitution={0.12}
    >
      {collider(mass)}
      <group
        onPointerDown={(e) => {
          if (!animate) return;
          e.stopPropagation();
          e.target.setPointerCapture(e.pointerId);
          onCue?.("object");
          const p = body.current.translation();
          // Hold on a level plane just above the table. Gravity takes over on release.
          plane.constant = -Math.max(p.y + 0.28, 1.28);
          grab.current = { x: p.x, y: -plane.constant, z: p.z };
          if (controls) {
            priorControls.current = controls.enabled;
            controls.enabled = false;
          }
          document.body.style.cursor = "grabbing";
          body.current.wakeUp();
          invalidate();
        }}
        onPointerMove={(e) => {
          if (!grab.current) return;
          e.stopPropagation();
          if (!e.ray.intersectPlane(plane, hit)) return;
          grab.current = {
            x: THREE.MathUtils.clamp(hit.x, -3.5, 3.7),
            y: -plane.constant,
            z: THREE.MathUtils.clamp(hit.z, -1.65, 3.5),
          };
          invalidate();
        }}
        onPointerUp={(e) => {
          if (grab.current) {
            e.stopPropagation();
            e.target.releasePointerCapture(e.pointerId);
            release();
            onCue?.("close");
          }
        }}
        onPointerCancel={release}
        onPointerOver={(e) => {
          if (!animate) return;
          e.stopPropagation();
          document.body.style.cursor = "grab";
          onHover?.("Drag to pick up · release to let go");
        }}
        onPointerOut={() => {
          if (!grab.current) {
            document.body.style.cursor = "";
            onHover?.("");
          }
        }}
      >
        {children}
      </group>
    </RigidBody>
  );
}
export default function StudioPhysics({ animate, reset, onHover, onCue }) {
  const ground = useMemo(
    () => groundColliderData("studio", APARTMENT_LEVEL + 0.15),
    [],
  );
  return (
    <Physics
      key={reset}
      paused={!animate}
      gravity={[0, -9.81, 0]}
      timeStep={1 / 60}
      updateLoop="follow"
      colliders={false}
    >
      <RigidBody type="fixed" colliders={false} friction={0.7}>
        <TrimeshCollider args={ground} />
        {studioDeskFrame.map((shape, index) => (
          <CuboidCollider
            key={`desk-frame-${index}`}
            position={shape.position}
            args={shape.size.map((n) => n / 2)}
          />
        ))}
        {Object.entries(studioSurfaces).map(([name, shape]) => (
          <CuboidCollider
            key={name}
            position={shape.position}
            args={shape.size.map((n) => n / 2)}
          />
        ))}
        {studioMonitors.map((monitor, i) => (
          <CuboidCollider
            key={i}
            position={monitor.position}
            rotation={[0, monitor.rotation, 0]}
            args={[0.779, 0.514, 0.048].map((n) => n * studioMonitorScale)}
          />
        ))}
        <CuboidCollider
          position={[
            studioCharacter.position[0],
            studioCharacter.position[1] + 0.68,
            studioCharacter.position[2],
          ]}
          args={[0.3, 0.29, 0.2]}
        />
        <BallCollider
          position={[
            studioCharacter.position[0],
            studioCharacter.position[1] + 1.17,
            studioCharacter.position[2],
          ]}
          args={[0.265]}
        />
      </RigidBody>
      <HeldObject
        position={studioProps.mug.position}
        mass={studioProps.mug.mass}
        animate={animate}
        onHover={onHover}
        onCue={onCue}
        collider={(mass) => (
          <CylinderCollider
            args={[studioProps.mug.halfHeight, studioProps.mug.radius]}
            mass={mass}
          />
        )}
      >
        <Mug />
      </HeldObject>
      <HeldObject
        position={studioProps.book.position}
        mass={studioProps.book.mass}
        animate={animate}
        onHover={onHover}
        onCue={onCue}
        collider={(mass) => (
          <CuboidCollider args={studioProps.book.halfSize} mass={mass} />
        )}
      >
        <ReadingBook />
      </HeldObject>
      <HeldObject
        position={studioProps.cushion.position}
        rotation={studioProps.cushion.rotation}
        mass={studioProps.cushion.mass}
        animate={animate}
        onHover={onHover}
        onCue={onCue}
        collider={(mass) => (
          <CuboidCollider
            args={studioProps.cushion.halfSize}
            mass={mass}
            restitution={0.2}
          />
        )}
      >
        <Cushion />
      </HeldObject>
    </Physics>
  );
}
