"use client";
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import journeyData from '../../json/journey.json';

// ──────────────────────────────────────────────────────────────────────────────
// Scene & Camera Master Controls
// ──────────────────────────────────────────────────────────────────────────────

// Master scale for everything in the 3D world.
// • Applied when you build your road, stars, and offsets.
// • ↑ Bigger → every coordinate and object scales up.
// • ↓ Smaller → scene shrinks.
// Usage: multiplied into all positions & sizes.
// Change if you want the whole world to feel more "zoomed in" or "zoomed out."
const SCENE_SCALE = 6;

// How quickly the camera "catches up" to your scroll position.
// • Used in updateCameraAndObjects(): cameraT += (targetT – cameraT) * LERP_FACTOR.
// • ↑ Larger (≤1) → camera snaps immediately (sharp, jarring).
// • ↓ Smaller → very smooth but laggy.
// Tweak to get the right balance between responsiveness & smoothness.
const LERP_FACTOR = 0.05;

// ──────────────────────────────────────────────────────────────────────────────
// Starfield Constants (all scale with journeyLength)
// ──────────────────────────────────────────────────────────────────────────────

// Base stars per checkpoint.  Total stars ≈ max(STAR_FIELD_MAX_INITIAL_STARS, journeyLength * STAR_DENSITY_PER_CHECKPOINT).
// • ↑ More stars → heavier render, denser sky.
// • ↓ Fewer → sparse cosmos.
// Usage: in createStarfield().
const STAR_DENSITY_PER_CHECKPOINT     = 1000;  
const STAR_FIELD_MAX_INITIAL_STARS    = 6000; // floor star count, regardless of journeyLength

// Star color intensity (white gradient).
// • color = random between [STAR_COLOR_MIN_INTENSITY, STAR_COLOR_MAX_INTENSITY].
// • ↑ increase both toward 1.0 → brighter, more uniform stars.
// • ↓ lower min → some very dim stars fade into background.
const STAR_COLOR_MIN_INTENSITY        = 0.7;
const STAR_COLOR_MAX_INTENSITY        = 1.0;

// How "long" the star band is, relative to your road's point count.
// • In createStarfield():  minZ = –roadPoints * STAR_FIELD_Z_OFFSET_FACTOR * SCENE_SCALE
// • ↑ larger Z_LENGTH_FACTOR → stars cover more forward distance
// • ↑ larger Z_OFFSET_FACTOR → stars start further "behind" the camera
const STAR_FIELD_Z_LENGTH_FACTOR      = 2;  // forward multiplier
const STAR_FIELD_Z_OFFSET_FACTOR      = 2;  // backward multiplier

// ──────────────────────────────────────────────────────────────────────────────
// Road Curvature Constants (all scale with journeyLength)
// ──────────────────────────────────────────────────────────────────────────────

// Detail of the curve: number of sample points per checkpoint.
// • ↑ more points → smoother curves but heavier CPU.
// • ↓ fewer → blocky road.
const ROAD_POINTS_PER_CHECKPOINT      = 200;

// overall curve length multiplier: (journeyLength + ROAD_CURVE_LENGTH_MULTIPLIER) in your t–to–π mapping
const ROAD_CURVE_LENGTH_MULTIPLIER    = 2;

// Horizontal "wave" amplitudes & frequencies.  All feed into x = sin(f1⋅t)*A1 + cos(f2⋅t)*A2 + …
const ROAD_X_AMPLITUDE_1              = 150;
const ROAD_X_FREQUENCY_1              = 0.3;
const ROAD_X_AMPLITUDE_2              = 50;
const ROAD_X_FREQUENCY_2              = 0.15;

// Vertical "wave" patterns for y
const ROAD_Y_AMPLITUDE_1              = 40;
const ROAD_Y_FREQUENCY_1              = 0.4;
const ROAD_Y_AMPLITUDE_2              = 20;
const ROAD_Y_FREQUENCY_2              = 0.8;

// Z spacing between each sample
const ROAD_Z_SPACING                  = 5.0;

// ──────────────────────────────────────────────────────────────────────────────
// Checkpoint Positioning & Size
// ──────────────────────────────────────────────────────────────────────────────

// How far ahead of the "stop" point your object appears.
// • objectT = stopT + OBJECT_PLACEMENT_OFFSET_T
// • ↑ bigger → object spawns further along the track before the stop.
// • ↓ smaller → closer to the exact stop.
const OBJECT_PLACEMENT_OFFSET_T       = 0.065;

// Lateral offset (distance from the road center-line) for cards & headers.
// • ↑ larger → cards fly farther off-center.
// • ↓ smaller → hug road more closely.
const LATERAL_OFFSET_DISTANCE_CARD    = 250;
const LATERAL_OFFSET_DISTANCE_HEADER  = 250;

// ──────────────────────────────────────────────────────────────────────────────
// Camera Movement & "Look-Around" Controls
// ──────────────────────────────────────────────────────────────────────────────

// Vertical "hover" above the road
const CAMERA_BASE_OFFSET_Y            = 5.0;

// How much the camera rolls (banks) when turning corners.
// • Used in updateCameraAndObjects(): camera.rotation.z = tangent-derived ⋅ CAMERA_TILT_ROLL_AMPLITUDE.
// • ↑ larger → aggressive banking.
// • ↓ smaller → subtle.
const CAMERA_TILT_ROLL_AMPLITUDE      = 0.5;  // in radians

// How much the camera pitches (tilts up/down) on elevation changes.
// • ↑ larger → nodding effect exaggerates hills.
// • ↓ smaller → almost flat.
const CAMERA_TILT_PITCH_AMPLITUDE     = 0.1;  // in radians

// Maximum "look-around" yaw (left/right) angle in degrees.
// • User can hover/tilt up to ± LOOK_AROUND_MAX_YAW_DEG before clamping.
// • ↑ bigger → can look farther sideways.
// • ↓ smaller → restrict peripheral view.
const LOOK_AROUND_MAX_YAW_DEG         = 30;

// Smoothness for interpolating back from "look-around" to forward-facing.
// • Similar to LERP_FACTOR but for user hover release.
// • ↑ larger → snaps back quickly.
// • ↓ smaller → lingers before recentring.
const LOOK_AROUND_LERP_FACTOR         = 0.1;

// Helper component for checkpoint headers
const CheckpointHeader = ({ title, heading, onAnimationComplete }) => {
  const [titleDone, setTitleDone] = useState(false);
  const [headingDone, setHeadingDone] = useState(false);

  useEffect(() => {
    if (titleDone && headingDone) {
      onAnimationComplete();
    }
  }, [titleDone, headingDone, onAnimationComplete]);

  return (
    <>
      <div className="journey-title-container">
        <DecryptedText
            text={title}
            speed={40}
            maxIterations={15}
            sequential={true}
            revealDirection="center"
            className="journey-title"
            encryptedClassName="text-white/30"
            animateOn="view"
            onAnimationComplete={() => setTitleDone(true)}
        />
      </div>
      <div className="journey-heading-container">
        <DecryptedText
            text={heading}
            speed={50}
            maxIterations={12}
            sequential={true}
            revealDirection="start"
            className="journey-heading"
            encryptedClassName="text-white/30"
            animateOn="view"
            onAnimationComplete={() => setHeadingDone(true)}
        />
      </div>
    </>
  );
};

export default function Journey3D({ onComplete }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const sceneRef = useRef(null);
  const rootsRef = useRef([]);

  const journeyLength = journeyData.length;
  const totalHeight = Math.max(1600, journeyLength * 300);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.height = `${totalHeight}vh`;
      document.body.style.overflow = 'auto';
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [totalHeight]);

  useEffect(() => {
    if (isTransitioning) return;

    let scene, camera, renderer, cssRenderer, cssScene;
    let roadCurve, frenetFrames;
    let checkpoints = [];
    let isPausedAtCheckpoint = false;
    let targetT = 0;
    let cameraT = 0;
    
    // Look-around state (will be initialized in initThreeJS)
    let targetLookDirection = null;
    let currentLookDirection = null;
    let isLookingAround = false;

    function initThreeJS() {
      const container = containerRef.current;
      if (!container || typeof THREE === 'undefined') return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 200 * SCENE_SCALE, 1000 * SCENE_SCALE);

      cssScene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000 * SCENE_SCALE);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.zIndex = '1';
        container.appendChild(renderer.domElement);
      } catch (error) {
        return;
      }

      try {
        if (typeof THREE.CSS3DRenderer === 'undefined') return;
        cssRenderer = new THREE.CSS3DRenderer();
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.domElement.style.position = 'absolute';
        cssRenderer.domElement.style.top = 0;
        cssRenderer.domElement.style.zIndex = '2';
        container.appendChild(cssRenderer.domElement);
      } catch (error) {
        return;
      }

      // Initialize look-around state now that THREE is available
      targetLookDirection = new THREE.Vector3(0, 0, -1);
      currentLookDirection = new THREE.Vector3(0, 0, -1);

      createStarfield();
      createRollerCoasterRoad();
      createCheckpointObjects();
      setupScrollControls();
      setupLookAroundControls();
      
      sceneRef.current = {
        scene, camera, renderer, cssRenderer, cssScene,
        roadCurve, frenetFrames, checkpoints,
        isPausedAtCheckpoint, targetT, cameraT,
        LERP_FACTOR, SCENE_SCALE
      };

      setIsLoaded(true);
      animate();
    }

    function createStarfield() {
      const starCount = Math.max(STAR_FIELD_MAX_INITIAL_STARS, journeyLength * STAR_DENSITY_PER_CHECKPOINT);
      const starGroup = new THREE.Group();
      const starGeometry = new THREE.SphereGeometry(1, 8, 8); 
      
      for (let i = 0; i < starCount; i++) {
        const intensity = THREE.MathUtils.randFloat(STAR_COLOR_MIN_INTENSITY, STAR_COLOR_MAX_INTENSITY);
        const starMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(intensity, intensity, intensity),
            transparent: true, 
            opacity: 0.8
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);

        const x = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const y = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        const z = THREE.MathUtils.randFloatSpread(4000 * SCENE_SCALE);
        star.position.set(x,y,z);

        const scale = THREE.MathUtils.randFloat(0.5, 2.5) * SCENE_SCALE * 0.2;
        star.scale.set(scale, scale, scale);
        
        starGroup.add(star);
      }
      scene.add(starGroup);
    }

    function createRollerCoasterRoad() {
      const roadPoints = Math.max(1200, journeyLength * ROAD_POINTS_PER_CHECKPOINT);
      const points = [];
      for (let i = 0; i <= roadPoints; i++) {
        const t = (i / roadPoints) * Math.PI * (journeyLength + ROAD_CURVE_LENGTH_MULTIPLIER);
        const x = Math.sin(t * ROAD_X_FREQUENCY_1) * ROAD_X_AMPLITUDE_1 + Math.cos(t * ROAD_X_FREQUENCY_2) * ROAD_X_AMPLITUDE_2;
        const y = Math.cos(t * ROAD_Y_FREQUENCY_1) * ROAD_Y_AMPLITUDE_1 + Math.sin(t * ROAD_Y_FREQUENCY_2) * ROAD_Y_AMPLITUDE_2;
        const z = i * ROAD_Z_SPACING - (roadPoints * 2);
        points.push(new THREE.Vector3(x, y, z).multiplyScalar(SCENE_SCALE));
      }
      
      roadCurve = new THREE.CatmullRomCurve3(points);
      frenetFrames = roadCurve.computeFrenetFrames(roadPoints + 500, false);

      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
      const linePoints = roadCurve.getPoints(roadPoints + 500);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const centerLine = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(centerLine);
    }

    function createCheckpointObjects() {
      journeyData.forEach((data, i) => {
        const stopT = (i + 1) / (journeyLength + 1);
        const objectT = stopT + OBJECT_PLACEMENT_OFFSET_T;
        
        const position = roadCurve.getPointAt(objectT);
        const frameIndex = Math.floor(objectT * (frenetFrames.binormals.length - 1));
        const binormal = frenetFrames.binormals[frameIndex];

        const cardElement = document.createElement('div');
        cardElement.className = 'journey-card';
        cardElement.innerHTML = `
          <div class="journey-content">
            <div class="journey-image-container">
              <img src="${data.image}" alt="${data.title}" class="journey-image">
            </div>
            <div class="journey-text-content">
              <p class="journey-description">${data.content}</p>
            </div>
          </div>
        `;
        
        const cardObject = new THREE.CSS3DObject(cardElement);
        const cardSide = i % 2 === 0 ? 1 : -1;
        const cardOffset = binormal.clone().multiplyScalar(LATERAL_OFFSET_DISTANCE_CARD * SCENE_SCALE * cardSide);
        cardObject.position.copy(position).add(cardOffset);

        const headerElement = document.createElement('div');
        headerElement.className = 'journey-header-overlay';
        
        const headerObject = new THREE.CSS3DObject(headerElement);
        const headerOffset = binormal.clone().multiplyScalar(LATERAL_OFFSET_DISTANCE_HEADER * SCENE_SCALE * -cardSide);
        headerObject.position.copy(position).add(headerOffset);
        
        cssScene.add(cardObject);
        cssScene.add(headerObject);
        
        const root = createRoot(headerElement);
        rootsRef.current.push(root);

        checkpoints.push({ stopT, cardObject, headerObject, data, triggered: false, root });
      });
    }

    function setupScrollControls() {
      const handleScroll = (event) => {
        const sRef = sceneRef.current;
        if (!sRef) return;
        
        // Completely ignore scroll events while paused (like the HTML example)
        if (sRef.isPausedAtCheckpoint) {
          event.preventDefault();
          return;
        }
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        sRef.targetT = scrollTop / docHeight;
        const newProgress = Math.round(sRef.targetT * 100);
        
        setProgress(newProgress);

        if (sRef.targetT >= 0.95 && !isCompleting) {
          setIsCompleting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 2000);
        }
      };
      
      // Use passive: false to allow preventDefault
      window.addEventListener('scroll', handleScroll, { passive: false });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    function setupLookAroundControls() {
      const container = containerRef.current;
      if (!container) return;

      const onMouseMove = (event) => {
        if (!camera || !targetLookDirection) return;
        
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate normalized position from center (-1 to 1)
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);
        
        // Convert screen coordinates to 3D direction
        const mouse = new THREE.Vector2(deltaX, deltaY);
        
        // Calculate look angles with clamping (invert yaw for natural direction)
        const yawAngle = THREE.MathUtils.clamp(
          -deltaX * THREE.MathUtils.degToRad(LOOK_AROUND_MAX_YAW_DEG),
          THREE.MathUtils.degToRad(-LOOK_AROUND_MAX_YAW_DEG),
          THREE.MathUtils.degToRad(LOOK_AROUND_MAX_YAW_DEG)
        );
        
        const pitchAngle = THREE.MathUtils.clamp(
          -deltaY * THREE.MathUtils.degToRad(LOOK_AROUND_MAX_YAW_DEG * 0.5),
          THREE.MathUtils.degToRad(-LOOK_AROUND_MAX_YAW_DEG * 0.5),
          THREE.MathUtils.degToRad(LOOK_AROUND_MAX_YAW_DEG * 0.5)
        );
        
        // Create target look direction relative to camera's forward
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        const up = new THREE.Vector3(0, 1, 0);
        
        // Apply yaw and pitch rotations
        targetLookDirection.copy(forward);
        targetLookDirection.applyAxisAngle(up, yawAngle);
        targetLookDirection.applyAxisAngle(right, pitchAngle);
        targetLookDirection.normalize();
        
        isLookingAround = true;
      };

      const onMouseLeave = () => {
        isLookingAround = false;
        // Target will smoothly return to forward direction in updateCameraAndObjects
      };

      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);

      return () => {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
      };
    }

    function updateCameraAndObjects() {
      const sRef = sceneRef.current;
      if (!sRef) return;
      
      // Only update camera position if not paused (like the HTML example)
      if (!sRef.isPausedAtCheckpoint) {
        sRef.cameraT += (sRef.targetT - sRef.cameraT) * LERP_FACTOR;
      }
      sRef.cameraT = Math.min(Math.max(sRef.cameraT, 0), 0.999);

      const position = sRef.roadCurve.getPointAt(sRef.cameraT);
      const frameIndex = Math.floor(sRef.cameraT * sRef.frenetFrames.tangents.length);
      const normal = sRef.frenetFrames.normals[frameIndex];
      const tangent = sRef.frenetFrames.tangents[frameIndex];
      
      sRef.camera.position.copy(position).add(normal.clone().multiplyScalar(CAMERA_BASE_OFFSET_Y * SCENE_SCALE));

      // Calculate base forward direction along the road
      const baseForward = tangent.clone().normalize();
      
      // Handle look-around behavior
      if (targetLookDirection && currentLookDirection) {
        if (!isLookingAround) {
          // When not looking around, smoothly return to road direction
          const roadForward = new THREE.Vector3(0, 0, -1);
          targetLookDirection.copy(roadForward);
        }
        
        // Smoothly interpolate current look direction towards target
        currentLookDirection.lerp(targetLookDirection, LOOK_AROUND_LERP_FACTOR);
        currentLookDirection.normalize();
      }
      
      // Transform the look direction to world space based on camera's road orientation
      const roadMatrix = new THREE.Matrix4();
      const lookAtPosition = sRef.roadCurve.getPointAt(Math.min(sRef.cameraT + 0.01, 1));
      roadMatrix.lookAt(sRef.camera.position, lookAtPosition, normal);
      
      // Apply the road orientation first
      sRef.camera.quaternion.setFromRotationMatrix(roadMatrix);
      
      // Then apply the look-around offset in camera's local space
      if (currentLookDirection && (isLookingAround || !currentLookDirection.equals(new THREE.Vector3(0, 0, -1)))) {
        // Create final look direction by combining road direction with look offset
        const worldLookDirection = currentLookDirection.clone();
        worldLookDirection.applyQuaternion(sRef.camera.quaternion);
        
        // Calculate final look position
        const finalLookAt = sRef.camera.position.clone().add(worldLookDirection.multiplyScalar(100));
        
        // Apply final camera orientation
        const finalMatrix = new THREE.Matrix4();
        finalMatrix.lookAt(sRef.camera.position, finalLookAt, normal);
        sRef.camera.quaternion.setFromRotationMatrix(finalMatrix);
      }

      sRef.checkpoints.forEach((cp, index) => {
        cp.cardObject.rotation.copy(sRef.camera.rotation);
        cp.headerObject.rotation.copy(sRef.camera.rotation);

        if (!cp.triggered && sRef.cameraT >= cp.stopT) {
          cp.triggered = true;
          setCurrentCheckpoint(index);
          playCheckpointSequence(cp);
        }
      });
    }

    async function playCheckpointSequence(cp) {
      if (!sceneRef.current) return;
      sceneRef.current.isPausedAtCheckpoint = true;
      
      // Show card and header elements
      cp.cardObject.element.classList.add('visible');
      cp.headerObject.element.classList.add('visible');

      // Promise-based animation tracking like the HTML example
      const cardAnimationPromise = new Promise(resolve => {
        cp.cardObject.element.addEventListener('transitionend', resolve, { once: true });
      });

      const typewriterPromise = new Promise((resolve) => {
        cp.root.render(
          <CheckpointHeader 
            title={cp.data.title}
            heading={cp.data.heading}
            onAnimationComplete={resolve}
          />
        );
      });
      
      // Wait for both animations to complete
      await Promise.all([cardAnimationPromise, typewriterPromise]);

      // Add a final delay before allowing scroll resume
      setTimeout(() => {
        // Set up one-time event listener to resume scrolling (like the HTML example)
        const resumeScroll = () => {
          if (sceneRef.current) {
            sceneRef.current.isPausedAtCheckpoint = false;
          }
          window.removeEventListener('scroll', resumeScroll);
        };
        window.addEventListener('scroll', resumeScroll, { passive: false });
      }, 1000);
    }

    function animate() {
      requestAnimationFrame(animate);
      updateCameraAndObjects();
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    }

    function onWindowResize() {
      if (!sceneRef.current) return;
      const { camera, renderer, cssRenderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (typeof window !== 'undefined') {
      if (typeof THREE !== 'undefined') {
        if (typeof THREE.CSS3DRenderer !== 'undefined') {
          initThreeJS();
        } else {
          const cssScript = document.createElement('script');
          cssScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS3DRenderer.js';
          cssScript.onload = () => initThreeJS();
          document.head.appendChild(cssScript);
        }
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => {
          const cssScript = document.createElement('script');
          cssScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS3DRenderer.js';
          cssScript.onload = () => initThreeJS();
          document.head.appendChild(cssScript);
        };
        document.head.appendChild(script);
      }
      
      window.addEventListener('resize', onWindowResize);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.height = '';
        document.body.style.overflow = '';
      }
      
      rootsRef.current.forEach(root => root.unmount());
      rootsRef.current = [];

      if (sceneRef.current) {
        const { renderer, cssRenderer } = sceneRef.current;
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement) renderer.domElement.remove();
        }
        if (cssRenderer && cssRenderer.domElement) cssRenderer.domElement.remove();
      }
      window.removeEventListener('resize', onWindowResize);
    };
  }, [isTransitioning, journeyLength, totalHeight, onComplete, isCompleting]);

  return (
    <div className="fixed inset-0 bg-black major-mono-display-regular overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {isTransitioning && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <DecryptedText
                text="Welcome to My Journey"
                speed={40}
                maxIterations={15}
                sequential={true}
                revealDirection="center"
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 major-mono-display-regular"
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <DecryptedText
                text="Scroll to explore my story"
                speed={50}
                maxIterations={12}
                sequential={true}
                revealDirection="start"
                className="text-base md:text-lg lg:text-xl text-white/70 major-mono-display-regular"
                encryptedClassName="text-white/30"
                animateOn="view"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
      
      <div ref={containerRef} className="absolute inset-0" />
      
      {!isTransitioning && !isCompleting && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-black/40 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 pointer-events-auto flex items-center gap-4">
            <div>
              <DecryptedText
                text="Journey Progress"
                speed={30}
                maxIterations={8}
                sequential={true}
                className="text-white text-xs md:text-sm mb-2 major-mono-display-regular"
                encryptedClassName="text-white/30"
                animateOn="view"
              />
              <div className="w-24 md:w-32 h-1 md:h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-white/70 text-xs mt-1 major-mono-display-regular">{progress}%</div>
            </div>
            <button 
              onClick={onComplete}
              className="bg-white/10 text-white px-3 py-2 rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/20"
            >
              Skip
            </button>
          </div>

          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-xl px-4 md:px-6 py-2 md:py-3 border border-white/10 text-center pointer-events-auto">
            <DecryptedText
              text="Scroll to continue"
              speed={40}
              maxIterations={10}
              sequential={true}
              className="text-white text-xs md:text-sm major-mono-display-regular"
              encryptedClassName="text-white/30"
              animateOn="view"
            />
            <div className="text-white/60 text-xs mt-1 major-mono-display-regular">
              {currentCheckpoint + 1} of {journeyLength}
            </div>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
        
        .major-mono-display-regular {
          font-family: 'Major Mono Display', monospace;
          font-weight: 400;
          font-style: normal;
        }

        .journey-card {
          width: 100vw;
          max-width: 1600px;
          opacity: 0;
          transform: scale(0.9) translateY(30px);
          transition: opacity 2s cubic-bezier(0.23, 1, 0.32, 1), transform 2s cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
        }

        .journey-card.visible {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .journey-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 80px;
          padding: 30px;
        }

        .journey-image-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .journey-image {
          width: min(95vw, 1200px);
          height: min(65vw, 750px);
          object-fit: cover;
          border-radius: 24px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.1);
          transition: transform 0.3s ease;
        }

        .journey-image:hover {
          transform: scale(1.02);
        }

        .journey-text-content {
          width: min(95vw, 1400px);
          color: white;
          text-align: center;
        }

        .journey-description {
          font-size: clamp(24px, 4vw, 42px);
          line-height: 1.8;
          margin: 0;
          color: #ddd;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: min(90vw, 1300px);
          margin: 0 auto;
          font-weight: 400;
        }

        .journey-header-overlay {
          width: 100vw;
          max-width: 1600px;
          color: #fff;
          font-family: 'Major Mono Display', monospace;
          text-align: center;
          opacity: 0;
          transition: opacity 1.5s cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
          padding: 30px;
        }

        .journey-header-overlay.visible {
          opacity: 1;
        }
        
        .journey-title-container, .journey-heading-container {
          display: inline-block;
          width: 100%;
        }

        .journey-title {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(48px, 8vw, 120px);
          margin: 0 0 20px 0;
          color: white;
          font-weight: bold;
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.4);
          letter-spacing: clamp(2px, 1vw, 8px);
          display: inline-block;
        }

        .journey-heading {
          font-family: 'Major Mono Display', monospace;
          font-size: clamp(20px, 4vw, 48px);
          margin: 0;
          color: #ccc;
          font-weight: 400;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          letter-spacing: clamp(1px, 0.5vw, 4px);
          display: inline-block;
        }

        @media (max-width: 768px) {
          .journey-content {
            gap: 60px;
            padding: 20px;
          }
          
          .journey-image {
            border-radius: 16px;
          }
          
          .journey-header-overlay {
            padding: 20px;
          }
          
          .journey-description {
            font-size: clamp(20px, 5vw, 32px);
          }
        }
      `}</style>
    </div>
  );
} 