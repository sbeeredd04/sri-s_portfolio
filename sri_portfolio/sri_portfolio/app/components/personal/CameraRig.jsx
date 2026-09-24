"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import { streetStop } from "../../lib/street-view.mjs";
import { placeStops } from "../../lib/place-stops.mjs";
import {
  studioArrival,
  APARTMENT_LEVEL,
  apartmentPoint,
} from "../../lib/studio-layout.mjs";
import { cameraLimits } from "../../lib/camera-limits.mjs";
import { courtViews } from "../../lib/court-layout.mjs";
import { trailView } from "../../lib/valley-layout.mjs";
import { campusArrival } from "../../lib/campus-layout.mjs";
import { fieldnotesArrival } from "../../lib/fieldnotes-layout.mjs";
import { wandererCamera } from "../../lib/resident-motion.mjs";
import {
  WORLD_RADIUS,
  regions,
  worldPoint,
  safeCameraPoint,
  surfaceHeight,
} from "../../lib/world-layout.mjs";

// Arrival cinematic: a longer flight that lifts with the distance covered
// and swings about the destination's up axis before it settles.
function arrivalShot(from, to, arrival) {
  if (!arrival) return { arrival: false, duration: 2.8, lift: 0, swing: 0 };
  const angle = from
    .clone()
    .normalize()
    .angleTo(to.position.clone().normalize());
  return {
    arrival: true,
    duration: 3.6 + Math.min(1.2, angle),
    lift: Math.min(140, angle * WORLD_RADIUS * 0.28),
    swing: 0.5,
  };
}

export default function CameraRig({
  introBottom = 0,
  world,
  stop = "arrival",
  reset,
  animate,
  onArrive,
  residentClock,
}) {
  const controls = useRef(),
    flight = useRef(null),
    initialized = useRef(false);
  const [controlsReady, setControlsReady] = useState(false);
  const attachControls = useCallback((value) => {
    controls.current = value;
    setControlsReady(Boolean(value));
  }, []);
  const focused = useRef("planet"),
    lastRequest = useRef(null),
    exitDistance = useRef(75);
  const { camera, invalidate, size, gl } = useThree();
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      up: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
    }),
    [],
  );
  // Any key, click or scroll during an arrival skips straight to the shot.
  useEffect(() => {
    const skip = () => {
      const f = flight.current;
      if (f?.arrival && f.elapsed < f.duration) {
        f.elapsed = f.duration;
        invalidate();
      }
    };
    const element = gl.domElement;
    element.addEventListener("pointerdown", skip);
    element.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("keydown", skip);
    return () => {
      element.removeEventListener("pointerdown", skip);
      element.removeEventListener("wheel", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [gl, invalidate]);

  const street = streetStop(world, stop);
  const roaming = stop.startsWith("roam");
  const phone = size.width < 560;
  const shortPhone = phone && size.height <= 730;
  const globeTopGap = shortPhone ? 12 : 28;
  const globeFooterSpace = shortPhone ? 122 : 145;
  const followingWanderer = world === "studio" && stop === "walk";
  const landscape = size.width >= 600 && size.height < 560;
  const fieldOfView = phone
    ? (world === "court" && stop === "arrival"
        ? courtViews.arrival.portrait.fov
        : world === "studio" && stop === "arrival"
          ? studioArrival.portrait.fov
          : world === "projects" && stop === "arrival"
            ? campusArrival.portrait.fov
            : world === "trail" && stop === "arrival"
              ? trailView().arrival.portrait.fov
              : placeStops[world]?.find((s) => s.id === stop)?.portrait?.fov) ||
      60
    : landscape
      ? 50
      : 45;
  function destination(id) {
    if (street && id !== "planet") {
      if (street.worldPosition) {
        const up = new THREE.Vector3(...street.up);
        return {
          position: new THREE.Vector3(...street.worldPosition).addScaledVector(
            up,
            1.68,
          ),
          target: new THREE.Vector3(...street.worldLook).addScaledVector(
            up,
            1.68,
          ),
          up,
        };
      }
      const [x, z] = street.point;
      const y =
        (id === "studio" ? APARTMENT_LEVEL + 0.15 : surfaceHeight(id, x, z)) +
        1.68;
      return {
        position: worldPoint(id, [x, y, z]),
        target: worldPoint(id, [street.look[0], y - 0.15, street.look[1]]),
        up: regions.find((r) => r.id === id).normal.clone(),
      };
    }
    if (id === "studio" && followingWanderer)
      return wandererCamera(residentClock.elapsed);
    if (id === "planet") {
      const small = size.width < 900 && !landscape;
      const roomBelowIntro = Math.max(
        80,
        size.height - globeFooterSpace - introBottom - globeTopGap,
      );
      const radiusPixels = Math.max(
        36,
        Math.min(
          size.width * (small ? 0.37 : 0.26),
          small
            ? roomBelowIntro * (shortPhone ? 0.47 : 0.44)
            : size.height * 0.34,
        ),
      );
      const halfAngle = Math.atan(
        ((radiusPixels * 2) / size.height) *
          Math.tan(THREE.MathUtils.degToRad(fieldOfView) / 2),
      );
      const distance = WORLD_RADIUS / Math.sin(halfAngle);
      return {
        position: new THREE.Vector3(0, 0.93, 0.37)
          .normalize()
          .multiplyScalar(distance),
        target: new THREE.Vector3(),
        up: new THREE.Vector3(0, 1, 0),
      };
    }
    const region = regions.find((r) => r.id === id);
    const closeStop =
      id === "court" && stop === "arrival"
        ? courtViews.arrival
        : id === "studio" && stop === "arrival"
          ? studioArrival
          : id === "projects" && stop === "arrival"
            ? campusArrival
            : id === "future" && stop === "arrival"
              ? fieldnotesArrival
              : placeStops[id]?.find((s) => s.id === stop);
    const portrait = phone
      ? closeStop?.portrait ||
        (id === "trail" && stop === "arrival"
          ? trailView().arrival.portrait
          : null)
      : null;
    const local =
      portrait?.position ||
      closeStop?.position ||
      (id === "studio"
        ? [2.7, 2.85, 4.4]
        : id === "court"
          ? courtViews.arrival.position
          : id === "projects"
            ? [18, 17, 29]
            : id === "entertainment"
              ? [11, 8, 17]
              : id === "future"
                ? fieldnotesArrival.position
                : id === "trail"
                  ? trailView().arrival.position
                  : [9, 10, 19]);
    const localTarget =
      portrait?.target ||
      closeStop?.target ||
      (id === "studio"
        ? [-0.4, 1.75, -1.15]
        : id === "court"
          ? courtViews.arrival.target
          : id === "trail"
            ? trailView().arrival.target
            : id === "entertainment"
              ? [2, 1.6, 0]
              : [0, 1, 0]);
    const target = worldPoint(
      id,
      id === "studio" ? apartmentPoint(localTarget) : localTarget,
    );
    const position = worldPoint(
      id,
      id === "studio" ? apartmentPoint(local) : local,
    );
    if (phone && !portrait) {
      const frameScale = THREE.MathUtils.clamp(
        0.9 / (size.width / size.height),
        1.15,
        2.2,
      );
      position.sub(target).multiplyScalar(frameScale).add(target);
    }
    return { position, target, up: region.normal.clone() };
  }

  function begin(id, immediate = false) {
    if (!controls.current) return;
    const to = destination(id);
    // Arriving at a new place from elsewhere plays as a short cinematic.
    const arrival = focused.current !== id && id !== "planet" && !street;
    exitDistance.current = Math.max(
      75,
      to.position.distanceTo(to.target) * 1.8,
    );
    focused.current = id;
    controls.current.minDistance = 0.2;
    const limits = cameraLimits(destination("planet").position.length());
    controls.current.maxDistance = limits.maxDistance;
    camera.far = limits.far;
    camera.updateProjectionMatrix();
    controls.current.minPolarAngle = 0.04;
    controls.current.maxPolarAngle = Math.PI - 0.04;
    controls.current.setFocalOffset(0, 0, 0, false);
    if (immediate) {
      camera.up.copy(to.up);
      controls.current.updateCameraUp();
      controls.current.setLookAt(
        ...to.position.toArray(),
        ...to.target.toArray(),
        false,
      );
      controls.current.update(0);
      controls.current.minDistance = id === "planet" ? WORLD_RADIUS + 1.5 : 3.2;
      flight.current = null;
    } else {
      const from = camera.position.clone();
      flight.current = {
        from,
        to: to.position,
        fromTarget: controls.current.getTarget(new THREE.Vector3()),
        target: to.target,
        fromUp: camera.up.clone(),
        up: to.up,
        rotation: new THREE.Quaternion().setFromUnitVectors(
          from.clone().normalize(),
          to.position.clone().normalize(),
        ),
        elapsed: 0,
        ...arrivalShot(from, to, arrival),
      };
    }
    invalidate();
  }
  useEffect(() => {
    if (roaming) {
      flight.current = null;
      lastRequest.current = null;
      return;
    }
    // Drei creates its control after the parent effect. A missing ref is not
    // an initialized camera; wait for attachment before consuming navigation.
    if (!controlsReady || !controls.current) return;
    camera.fov = fieldOfView;
    camera.near = world === "planet" ? 2 : 0.22;
    camera.far = cameraLimits(destination("planet").position.length()).far;
    camera.clearViewOffset();
    if (street) {
      // Eye-level exploration keeps the optical center in the middle of the view.
    } else if (landscape) {
      camera.setViewOffset(
        size.width,
        size.height,
        -size.width * 0.15,
        0,
        size.width,
        size.height,
      );
    } else if (size.width < 900) {
      const start = introBottom + globeTopGap;
      const room = Math.max(80, size.height - globeFooterSpace - start);
      const offset =
        world === "planet"
          ? size.height / 2 - (start + room / 2)
          : world === "projects" && stop === "ring" && size.width < 560
            ? size.height * 0.07
            : ((world === "trail" && stop === "overlook") ||
                  (world === "projects" && stop === "campus")) &&
                size.width < 560
              ? size.height * 0.045
              : -size.height *
                (stop !== "arrival"
                  ? 0.025
                  : (world === "trail" || world === "projects") &&
                      size.width < 560
                    ? 0.035
                    : size.width < 560
                      ? 0.135
                      : 0.065);
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        offset,
        size.width,
        size.height,
      );
    } else
      camera.setViewOffset(
        size.width,
        size.height,
        stop === "arrival" ? -size.width * 0.1 : 0,
        0,
        size.width,
        size.height,
      );
    camera.updateProjectionMatrix();
    const key = `${world}:${reset}:${size.width}:${size.height}:${stop}:${world === "planet" ? introBottom : 0}`;
    if (lastRequest.current === key) return;
    const alreadyArrived =
      initialized.current &&
      focused.current === world &&
      lastRequest.current?.split(":").slice(1).join(":") ===
        key.split(":").slice(1).join(":");
    lastRequest.current = key;
    if (!alreadyArrived) begin(world, !initialized.current || !animate);
    initialized.current = true;
  }, [
    world,
    stop,
    reset,
    introBottom,
    size.width,
    size.height,
    camera,
    invalidate,
    controlsReady,
  ]);

  useEffect(() => {
    if (!street) return;
    const canvas = gl.domElement;
    let pointer = null;
    const look = (dx, dy) => {
      flight.current = null;
      const eye = destination(world).position;
      const up = street.up
        ? new THREE.Vector3(...street.up)
        : regions.find((r) => r.id === world).normal;
      const frame = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        up,
      );
      const direction = camera
        .getWorldDirection(new THREE.Vector3())
        .applyQuaternion(frame.clone().invert());
      const angles = new THREE.Spherical().setFromVector3(direction);
      angles.theta -= dx * 0.003;
      angles.phi = THREE.MathUtils.clamp(
        angles.phi + dy * 0.003,
        0.22,
        Math.PI - 0.22,
      );
      direction
        .setFromSpherical(angles)
        .applyQuaternion(frame)
        .multiplyScalar(5)
        .add(eye);
      controls.current.setLookAt(
        ...eye.toArray(),
        ...direction.toArray(),
        false,
      );
      controls.current.update(0);
      invalidate();
    };
    const down = (e) => {
      if (e.button !== 0) return;
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      look(e.clientX - pointer.x, e.clientY - pointer.y);
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const up = () => {
      pointer = null;
    };
    const keyboardLook = (event) => {
      const { x = 0, y = 0 } = event.detail || {};
      look(
        THREE.MathUtils.clamp(x, -1, 1) * 130,
        THREE.MathUtils.clamp(y, -1, 1) * 90,
      );
    };
    window.addEventListener("sri:look", keyboardLook);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("sri:look", keyboardLook);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [world, stop, gl, camera, invalidate]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    if (roaming) {
      camera.getWorldDirection(scratch.direction);
      scratch.target
        .copy(camera.position)
        .addScaledVector(scratch.direction, 5);
      c.updateCameraUp();
      c.setLookAt(
        ...camera.position.toArray(),
        ...scratch.target.toArray(),
        false,
      );
      c.update(0);
      return;
    }
    if (flight.current) {
      const f = flight.current;
      f.elapsed += animate ? Math.min(delta, 0.05) : 3;
      const t = Math.min(f.elapsed / (street ? 1.15 : f.duration), 1),
        ease = f.arrival
          ? t * t * t * (t * (t * 6 - 15) + 10)
          : t * t * (3 - 2 * t);
      scratch.rotation.identity().slerp(f.rotation, ease);
      scratch.direction
        .copy(f.from)
        .normalize()
        .applyQuaternion(scratch.rotation);
      scratch.position
        .copy(scratch.direction)
        .multiplyScalar(
          THREE.MathUtils.lerp(f.from.length(), f.to.length(), ease),
        );
      scratch.target.lerpVectors(f.fromTarget, f.target, ease);
      if (f.arrival) {
        // Climb over the curve of the world, then swing round the place as
        // it comes into view and settle on the framed shot.
        scratch.position.addScaledVector(
          scratch.direction,
          f.lift * Math.sin(Math.PI * ease) ** 1.3,
        );
        const swing =
          f.swing * (1 - ease) ** 2 * THREE.MathUtils.smoothstep(t, 0.3, 0.65);
        scratch.offset
          .copy(scratch.position)
          .sub(f.target)
          .applyAxisAngle(f.up, swing);
        scratch.position.copy(f.target).add(scratch.offset);
      }
      scratch.position.copy(safeCameraPoint(scratch.position));
      camera.up.lerpVectors(f.fromUp, f.up, ease).normalize();
      c.updateCameraUp();
      c.setLookAt(
        ...scratch.position.toArray(),
        ...scratch.target.toArray(),
        false,
      );
      c.update(0);
      if (t === 1) {
        flight.current = null;
        c.minDistance = focused.current === "planet" ? WORLD_RADIUS + 1.5 : 3.2;
      } else invalidate();
      return;
    }
    if (street) {
      const eye = destination(world).position;
      camera.getWorldDirection(scratch.direction);
      scratch.target.copy(eye).addScaledVector(scratch.direction, 5);
      c.setLookAt(...eye.toArray(), ...scratch.target.toArray(), false);
      c.update(0);
      return;
    }
    // The camera cannot dip under the continuous terrain while orbiting a place.
    if (followingWanderer) {
      const to = wandererCamera(residentClock.elapsed);
      const blend = animate ? 1 - Math.exp(-Math.min(delta, 0.05) * 5) : 1;
      scratch.position.copy(camera.position).lerp(to.position, blend);
      scratch.target.copy(c.getTarget(scratch.target)).lerp(to.target, blend);
      camera.up.lerp(to.up, blend).normalize();
      c.updateCameraUp();
      c.setLookAt(
        ...safeCameraPoint(scratch.position).toArray(),
        ...scratch.target.toArray(),
        false,
      );
      c.update(0);
      return;
    }
    const safe = safeCameraPoint(camera.position.clone());
    if (safe.distanceToSquared(camera.position) > 0.0001) {
      c.setPosition(...safe.toArray(), false);
      c.update(0);
      invalidate();
    }
    if (!c.active) return;
    if (
      focused.current === "planet" &&
      camera.position.length() < WORLD_RADIUS + 29
    ) {
      const normal = camera.position.clone().normalize();
      const nearest = [...regions].sort(
        (a, b) => normal.dot(b.normal) - normal.dot(a.normal),
      )[0];
      if (normal.dot(nearest.normal) > 0.84) {
        begin(nearest.id);
        onArrive?.(nearest.id);
      }
    } else if (
      focused.current !== "planet" &&
      c.distance > exitDistance.current
    ) {
      begin("planet");
      onArrive?.("planet");
    }
  });
  return roaming ? null : (
    <CameraControls
      ref={attachControls}
      enabled={!followingWanderer && !street && !roaming}
      makeDefault
      smoothTime={0.22}
      draggingSmoothTime={0.1}
      dollySpeed={0.85}
      mouseButtons={{
        left: CameraControlsImpl.ACTION.ROTATE,
        middle: CameraControlsImpl.ACTION.DOLLY,
        right: CameraControlsImpl.ACTION.NONE,
        wheel: street
          ? CameraControlsImpl.ACTION.NONE
          : CameraControlsImpl.ACTION.DOLLY,
      }}
      touches={{
        one: CameraControlsImpl.ACTION.TOUCH_ROTATE,
        two: CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE,
        three: CameraControlsImpl.ACTION.NONE,
      }}
      onControlStart={() => {
        flight.current = null;
        if (controls.current)
          controls.current.minDistance =
            focused.current === "planet" ? WORLD_RADIUS + 1.5 : 3.2;
      }}
      onControl={() => {
        flight.current = null;
        if (controls.current)
          controls.current.minDistance =
            focused.current === "planet" ? WORLD_RADIUS + 1.5 : 3.2;
      }}
    />
  );
}
