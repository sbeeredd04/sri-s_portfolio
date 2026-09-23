"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  makeWalkNetwork,
  walkStart,
  advanceWalker,
  isWalkingInputTarget,
} from "../../lib/walk-network.mjs";
import WalkingCharacter from "./WalkingCharacter";

const movementKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "q",
  "e",
]);
export default function VisitorWalker({
  world,
  roof,
  entry,
  enabled,
  color,
  onStatus,
  onExit,
}) {
  const { camera, gl, invalidate, scene, size } = useThree();
  const network = useMemo(() => makeWalkNetwork(roof), [roof]);
  const state = useRef(null),
    avatar = useRef(),
    motion = useRef({ gait: 0, stride: 0 });
  const controls = useRef({
    keys: new Set(),
    cruise: false,
    pitch: 0.46,
    heading: new THREE.Vector3(),
    pointer: null,
  });
  const lastRegion = useRef(world),
    reported = useRef(0),
    lastCollision = useRef(0),
    blocked = useRef(0),
    cameraDistance = useRef(4);
  const ray = useMemo(() => new THREE.Raycaster(), []),
    colliders = useRef([]);
  const frame = useMemo(() => new THREE.Matrix4(), []);
  useEffect(() => {
    state.current = walkStart(world, roof, entry);
    onStatus?.({ world, distance: 0, cruise: false, connection: null });
    controls.current.heading.copy(state.current.forward);
    controls.current.keys.clear();
    controls.current.cruise = false;
    camera.fov = size.width < 560 ? 65 : 56;
    camera.near = 0.12;
    camera.clearViewOffset();
    if (size.width < 900)
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        size.height * 0.16,
        size.width,
        size.height,
      );
    camera.updateProjectionMatrix();
    const s = state.current;
    camera.position
      .copy(s.position)
      .addScaledVector(s.up, roof ? 2.3 : 3.5)
      .addScaledVector(s.forward, roof ? -3 : -4.6);
    camera.up.copy(s.up);
    camera.lookAt(s.position.clone().addScaledVector(s.up, 1.2));
    invalidate();
    // Region updates while walking do not restart the visitor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roof]);
  useEffect(() => {
    camera.fov = size.width < 560 ? 65 : 56;
    camera.clearViewOffset();
    if (size.width < 900)
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        size.height * 0.16,
        size.width,
        size.height,
      );
    camera.updateProjectionMatrix();
    invalidate();
  }, [size.width, size.height, camera, invalidate]);
  useEffect(() => {
    if (!enabled) {
      controls.current.keys.clear();
      controls.current.cruise = false;
      state.current?.velocity.set(0, 0, 0);
      motion.current.stride = 0;
      onStatus?.({ cruise: false });
    }
  }, [enabled, onStatus]);
  useEffect(() => {
    const c = controls.current,
      canvas = gl.domElement;
    const clear = () => {
      c.keys.clear();
      c.cruise = false;
      c.pointer = null;
      onStatus?.({ cruise: false });
    };
    const tap = (key) => {
      if (["a", "arrowleft", "q"].includes(key))
        c.heading.applyAxisAngle(state.current.up, 0.18);
      if (["d", "arrowright", "e"].includes(key))
        c.heading.applyAxisAngle(state.current.up, -0.18);
      if (["w", "arrowup", "s", "arrowdown"].includes(key))
        state.current.velocity
          .copy(c.heading)
          .multiplyScalar(["s", "arrowdown"].includes(key) ? -2 : 2);
    };
    const down = (e) => {
      if (
        !enabled ||
        isWalkingInputTarget(e.target) ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      const key = e.key.toLowerCase();
      if (e.target?.closest?.("nav,.journey-footer,.experience-header")) return;
      if (movementKeys.has(key)) {
        e.preventDefault();
        if (!e.repeat) tap(key);
        c.keys.add(key);
        c.cruise = false;
        invalidate();
      }
      if (key === "r" && !e.repeat) {
        e.preventDefault();
        c.cruise = !c.cruise;
        onStatus?.({ cruise: c.cruise });
        invalidate();
      }
      if (key === "escape") onExit?.();
    };
    const up = (e) => c.keys.delete(e.key.toLowerCase());
    const interacting = (e) => {
      if (
        e.target?.closest?.("button,a,input,select,textarea") &&
        !e.target.closest(".walking-controls")
      )
        clear();
    };
    const command = (e) => {
      const { key, down, toggle, turn } = e.detail || {};
      if (!enabled) return;
      if (toggle) c.cruise = !c.cruise;
      if (key) {
        if (down) {
          tap(key);
          c.keys.add(key);
          c.cruise = false;
        } else c.keys.delete(key);
      }
      if (turn) c.heading.applyAxisAngle(state.current.up, turn);
      onStatus?.({ cruise: c.cruise });
      invalidate();
    };
    const pointerDown = (e) => {
      if (e.button !== 0 || !enabled) return;
      c.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e) => {
      if (!c.pointer || c.pointer.id !== e.pointerId) return;
      c.heading.applyAxisAngle(
        state.current.up,
        -(e.clientX - c.pointer.x) * 0.005,
      );
      c.pitch = THREE.MathUtils.clamp(
        c.pitch + (e.clientY - c.pointer.y) * 0.003,
        0.22,
        0.85,
      );
      c.pointer.x = e.clientX;
      c.pointer.y = e.clientY;
      invalidate();
    };
    const pointerUp = () => {
      c.pointer = null;
    };
    window.addEventListener("pointerdown", interacting);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    window.addEventListener("sri:walk", command);
    document.addEventListener("visibilitychange", clear);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    return () => {
      clear();
      window.removeEventListener("pointerdown", interacting);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      window.removeEventListener("sri:walk", command);
      document.removeEventListener("visibilitychange", clear);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
    };
  }, [gl, enabled, invalidate, onStatus, onExit]);
  useFrame((_, delta) => {
    const s = state.current;
    if (!s || !avatar.current) return;
    const c = controls.current,
      dt = Math.min(delta, 0.05),
      keys = c.keys;
    motion.current.paused = !enabled;
    let location;
    if (enabled) {
      const turn =
        (keys.has("a") || keys.has("arrowleft") || keys.has("q") ? 1 : 0) -
        (keys.has("d") || keys.has("arrowright") || keys.has("e") ? 1 : 0);
      c.heading
        .addScaledVector(s.up, -c.heading.dot(s.up))
        .normalize()
        .applyAxisAngle(s.up, turn * dt * 2);
      const drive =
        (keys.has("w") || keys.has("arrowup") || c.cruise ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      const before = s.position.clone();
      location = advanceWalker(
        s,
        c.heading.clone().multiplyScalar(drive),
        dt,
        network,
      );
      const speed = before.distanceTo(s.position) / Math.max(dt, 0.001);
      if (drive > 0 && !turn && speed > 0.2)
        c.heading.lerp(s.forward, 1 - Math.exp(-dt * 2)).normalize();
      blocked.current = drive && speed < 0.06 ? blocked.current + dt : 0;
      if (c.cruise && blocked.current > 0.5) {
        c.cruise = false;
        onStatus?.({ cruise: false });
      }

      motion.current.gait = s.distance * 5.6;
      motion.current.stride = THREE.MathUtils.lerp(
        motion.current.stride,
        Math.min(1, speed / 2.6),
        1 - Math.exp(-dt * 16),
      );
    } else motion.current.stride = 0;
    const forward = s.forward
        .clone()
        .addScaledVector(s.up, -s.forward.dot(s.up))
        .normalize(),
      right = new THREE.Vector3().crossVectors(s.up, forward).normalize();
    frame.makeBasis(right, s.up, forward);
    avatar.current.position.copy(s.position);
    avatar.current.quaternion.setFromRotationMatrix(frame);
    const target = s.position.clone().addScaledVector(s.up, 1.05),
      back = roof ? 3 : 4.1;
    const desired = target
      .clone()
      .addScaledVector(c.heading, -back)
      .addScaledVector(s.up, back * c.pitch);
    // Shorten the camera boom before it enters any opaque rendered structure.
    // The visitor is excluded; canopy cards remain colliders, not just trunks.
    lastCollision.current += dt;
    if (lastCollision.current > 0.1) {
      lastCollision.current = 0;
      colliders.current = [];
      scene.traverseVisible((o) => {
        if (!o.isMesh || o.userData.walker) return;
        let parent = o;
        while (parent) {
          if (parent.userData.walker) return;
          parent = parent.parent;
        }
        const m = o.material;
        if (
          !Array.isArray(m) &&
          m &&
          m.depthWrite !== false &&
          (!m.transparent || m.alphaTest > 0)
        )
          colliders.current.push(o);
      });
      const direction = desired.clone().sub(target),
        length = direction.length();
      ray.set(target, direction.normalize());
      ray.near = 0.15;
      ray.far = length;
      const hit = ray.intersectObjects(colliders.current, false)[0];
      cameraDistance.current = hit
        ? Math.max(0.7, hit.distance - 0.22)
        : length;
    }
    const boom = desired.sub(target);
    boom.setLength(Math.min(boom.length(), cameraDistance.current));
    const safe = target.clone().add(boom);
    camera.position.lerp(safe, 1 - Math.exp(-dt * 12));
    camera.up.copy(s.up);
    camera.lookAt(target);
    reported.current += dt;
    if (reported.current > 0.25) {
      reported.current = 0;
      const next = location?.segment.world || lastRegion.current;
      lastRegion.current = next;
      onStatus?.({
        world: next,
        distance: Math.floor(s.distance),
        cruise: c.cruise,
        connection: location?.segment.connection || null,
      });
    }
    if (enabled) invalidate();
  });
  return (
    <group ref={avatar} userData={{ walker: true }}>
      <WalkingCharacter
        motion={motion}
        color={["#7f9ec9", "#8f86b6", "#93aaa1", "#ca927b"][color % 4]}
      />
    </group>
  );
}
