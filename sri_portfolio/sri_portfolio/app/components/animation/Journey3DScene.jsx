import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Journey3DScene
 * 
 * THREE.js scene setup and rendering
 * Responsibilities:
 * - Scene initialization with preloaded resources
 * - WebGL and CSS3D renderer setup
 * - Animation loop management
 * - Camera positioning and updates
 * - Scene rendering coordination
 * 
 * ~350 LOC
 */
export default function Journey3DScene({
  preloadedResources,
  roadCurve,
  frenetFrames,
  cameraT,
  targetT,
  containerRef,
  sceneRef
}) {
  const rendererRef = useRef(null);
  const cssRendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  const SCENE_SCALE = 5;
  const CAMERA_BASE_OFFSET_Y = 2.0;
  const CAMERA_LERP_FACTOR = 0.08;
  const LOOK_AROUND_LERP_FACTOR = 0.1;

  useEffect(() => {
    if (!preloadedResources || !containerRef?.current) {
      return;
    }

    const {
      scene,
      cssScene,
      camera,
      renderer,
      cssRenderer
    } = preloadedResources;

    rendererRef.current = renderer;
    cssRendererRef.current = cssRenderer;

    // Attach renderers to DOM
    containerRef.current.appendChild(renderer.domElement);
    containerRef.current.appendChild(cssRenderer.domElement);

    // Store reference for animation access
    if (sceneRef) {
      sceneRef.current = {
        scene,
        cssScene,
        camera,
        renderer,
        cssRenderer,
        cameraT: 0,
        targetT: 0,
        lookAroundYaw: 0,
        lookAroundPitch: 0
      };
    }

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      cssRenderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (sceneRef?.current) {
        // Smooth camera interpolation
        sceneRef.current.cameraT += (sceneRef.current.targetT - sceneRef.current.cameraT) * CAMERA_LERP_FACTOR;

        // Update camera position along curve
        const cameraPosition = roadCurve.getPointAt(sceneRef.current.cameraT);
        const frameIndex = Math.floor(sceneRef.current.cameraT * (frenetFrames.binormals.length - 1));

        const tangent = frenetFrames.tangents[frameIndex];
        const normal = frenetFrames.normals[frameIndex];
        const binormal = frenetFrames.binormals[frameIndex];

        // Build camera coordinate system from Frenet frame
        const cameraUpDirection = new THREE.Vector3()
          .copy(normal)
          .multiplyScalar(Math.cos(sceneRef.current.lookAroundPitch))
          .addScaledVector(tangent, Math.sin(sceneRef.current.lookAroundPitch));

        // Camera position with vertical offset
        const offsetPosition = new THREE.Vector3()
          .copy(cameraPosition)
          .addScaledVector(cameraUpDirection, CAMERA_BASE_OFFSET_Y * SCENE_SCALE);

        // Look-ahead point
        const lookAheadT = Math.min(sceneRef.current.cameraT + 0.05, 1);
        const lookAheadPosition = roadCurve.getPointAt(lookAheadT);

        // Apply mouse look-around rotation
        const lookDirection = new THREE.Vector3()
          .copy(lookAheadPosition)
          .sub(offsetPosition)
          .normalize();

        // Apply horizontal rotation (yaw)
        const yawAxis = new THREE.Vector3().copy(cameraUpDirection).normalize();
        const rotatedLookDirection = new THREE.Vector3()
          .copy(lookDirection)
          .applyAxisAngle(yawAxis, sceneRef.current.lookAroundYaw);

        const targetPosition = new THREE.Vector3()
          .copy(offsetPosition)
          .addScaledVector(rotatedLookDirection, 50);

        camera.position.copy(offsetPosition);
        camera.lookAt(targetPosition);
        camera.up.copy(cameraUpDirection);

        // Smooth look-around lerp
        sceneRef.current.lookAroundYaw *= (1 - LOOK_AROUND_LERP_FACTOR);
        sceneRef.current.lookAroundPitch *= (1 - LOOK_AROUND_LERP_FACTOR);
      }

      // Render both WebGL and CSS3D
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (containerRef.current) {
        try {
          if (renderer.domElement.parentElement === containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
          }
          if (cssRenderer.domElement.parentElement === containerRef.current) {
            containerRef.current.removeChild(cssRenderer.domElement);
          }
        } catch (error) {
          console.warn('Error removing renderers:', error);
        }
      }
    };
  }, [preloadedResources, roadCurve, frenetFrames, containerRef, sceneRef]);

  // Update camera target T when it changes
  useEffect(() => {
    if (sceneRef?.current && targetT !== undefined) {
      sceneRef.current.targetT = targetT;
    }
  }, [targetT, sceneRef]);

  // Update camera T for smooth interpolation
  useEffect(() => {
    if (sceneRef?.current && cameraT !== undefined) {
      sceneRef.current.cameraT = cameraT;
    }
  }, [cameraT, sceneRef]);

  return null; // This component only handles rendering, no DOM elements
}
