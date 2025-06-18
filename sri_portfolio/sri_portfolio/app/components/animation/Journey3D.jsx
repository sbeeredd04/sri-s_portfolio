"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import journeyData from '../../json/journey.json';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────────────────────
// CAMERA MOVEMENT CONSTANTS - Smooth and responsive controls
// ──────────────────────────────────────────────────────────────────────────────

const SCENE_SCALE = 5; // Must match Loader's SCENE_SCALE
const CAMERA_BASE_OFFSET_Y = 2.0; // Camera height above road
const LOOK_AROUND_MAX_YAW_DEG = 30; // Max mouse look angle
const LOOK_AROUND_LERP_FACTOR = 0.1; // Look-around smoothing

// ── SIMPLE MOVEMENT SETTINGS ──
const CAMERA_LERP_FACTOR = 0.08; // Smooth camera interpolation for fluid movement
const MAX_SCROLL_SPEED = 3.0; // Maximum scroll speed multiplier for responsiveness
const CHECKPOINT_PAUSE_DURATION = 2000; // 2 seconds pause at each checkpoint

// ──────────────────────────────────────────────────────────────────────────────
// CHECKPOINT HEADER COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

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
            className="journey-title decrypted-text"
            encryptedClassName="journey-title encrypted-text text-white/30"
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
            className="journey-heading decrypted-text"
            encryptedClassName="journey-heading encrypted-text text-white/30"
            animateOn="view"
            onAnimationComplete={() => setHeadingDone(true)}
        />
      </div>
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN JOURNEY3D COMPONENT - Simplified Movement System
// ──────────────────────────────────────────────────────────────────────────────

export default function Journey3D({ onComplete, preloadedResources }) {
  // ── Core References ──
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  
  // ── UI State ──
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // ── Journey Configuration ──
  const journeyLength = journeyData.length;
  const totalHeight = Math.max(1600, journeyLength * 300);

  // ── SIMPLE CHECKPOINT STATE ──
  const checkpointsRef = useRef([]);
  const currentCheckpointRef = useRef(null); // Currently active checkpoint
  const pauseStartTimeRef = useRef(null); // When current pause started
  const scrollBlockedRef = useRef(false); // Is scroll currently blocked?
  const virtualScrollY = useRef(0); // Virtual scroll position
  const journeyCompletedRef = useRef(false); // Journey completion lock

  // ── Initialize checkpoint data from preloaded resources ──
  useEffect(() => {
    if (preloadedResources?.checkpoints) {
      checkpointsRef.current = preloadedResources.checkpoints.map((cp, i) => ({
        stopT: cp.stopT, // Where camera pauses
        index: i,
        triggered: false, // Has this checkpoint been triggered?
        data: cp.data, // Checkpoint content data
        cardObject: cp.cardObject, // 3D card element
        headerObject: cp.headerObject, // 3D header element
        root: cp.root // React root for dynamic content
      }));
      console.log('🎯 Simple checkpoint system initialized:', checkpointsRef.current.length, 'checkpoints');
    }
  }, [preloadedResources]);

  // ──────────────────────────────────────────────────────────────────────────────
  // SMOOTH SCROLL CONTROL - High responsiveness with checkpoint pausing
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const getDocHeight = () => Math.max(0, document.body.scrollHeight - window.innerHeight);
    
    // ── WHEEL HANDLER: Smooth scroll with max speed control ──
    const handleWheel = (e) => {
      e.preventDefault(); // Take full control of scrolling
      
      // ABSOLUTELY BLOCK scroll during checkpoint animations or journey completion
      if (scrollBlockedRef.current) {
        if (journeyCompletedRef.current) {
          console.log('🏁 Scroll blocked - journey completed, transitioning to main page');
        } else {
          console.log('🚫 Scroll absolutely blocked during checkpoint animation');
        }
        return;
      }
      
      const raw = e.deltaY;
      const docHeight = getDocHeight();
      
      // Apply max speed limiting for smooth control
      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 50, Math.min(MAX_SCROLL_SPEED * 50, raw));
      
      // Update virtual scroll position
      virtualScrollY.current = Math.max(0, Math.min(docHeight, virtualScrollY.current + clampedDelta));
      window.scrollTo(0, virtualScrollY.current);
    };
    
    // ── KEYBOARD HANDLER: Absolutely block scroll keys during animations ──
    const handleKeyDown = (e) => {
      if (scrollBlockedRef.current) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code)) {
          e.preventDefault();
          console.log('⌨️ Keyboard scroll absolutely blocked during checkpoint animation');
        }
      }
    };
    
    // ── TOUCH HANDLERS: Mobile support with speed limiting ──
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      if (scrollBlockedRef.current) {
        e.preventDefault();
        console.log('📱 Touch scroll absolutely blocked during checkpoint animation');
        return;
      }

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;
      
      const docHeight = getDocHeight();
      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 25, Math.min(MAX_SCROLL_SPEED * 25, deltaY * 2));
      
      virtualScrollY.current = Math.max(0, Math.min(docHeight, virtualScrollY.current + clampedDelta));
      window.scrollTo(0, virtualScrollY.current);
      e.preventDefault();
    };
    
    // Attach scroll event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // CHECKPOINT ANIMATION SEQUENCE - Triggered when camera reaches stopT
  // ──────────────────────────────────────────────────────────────────────────────
  const playCheckpointSequence = useCallback(async (cp) => {
    console.log(`🎬 Starting checkpoint sequence: ${cp.data.title}`);
    
    try {
      // Trigger slide-in animations for card and header
      cp.cardObject.element.classList.add('visible');
      cp.headerObject.element.classList.add('visible');
      
      // Wait for CSS transitions to complete
      const cardPromise = new Promise(resolve => {
        const handleTransition = (event) => {
          if (event.propertyName === 'transform') {
            resolve();
          }
        };
        cp.cardObject.element.addEventListener('transitionend', handleTransition, { once: true });
      });

      const headerPromise = new Promise(resolve => {
        const handleTransition = (event) => {
          if (event.propertyName === 'transform') {
            resolve();
          }
        };
        cp.headerObject.element.addEventListener('transitionend', handleTransition, { once: true });
      });

      // Start typewriter animation for header text
      const typewriterPromise = new Promise((resolve) => {
        if (!cp.root) {
          resolve();
          return;
        }
        
        try {
          cp.root.render(
            <CheckpointHeader 
              title={cp.data.title}
              heading={cp.data.heading}
              onAnimationComplete={resolve}
            />
          );
        } catch (error) {
          console.error('Error rendering checkpoint header:', error);
          resolve();
        }
      });
      
      // Wait for all animations to complete
      await Promise.all([cardPromise, headerPromise, typewriterPromise]);
      console.log(`✅ Checkpoint ${cp.index} animations completed`);
      
    } catch (error) {
      console.error('Error in checkpoint sequence:', error);
    }
  }, []);

  // ── Document height setup ──
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.height = `${totalHeight}vh`;
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.height = '';
        document.body.style.overflow = '';
      }
    };
  }, [totalHeight]);

  // ── Transition timing ──
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // MAIN ANIMATION LOOP - Simplified camera movement with smooth interpolation
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTransitioning || !preloadedResources) return;

    // ── Core THREE.js objects ──
    let scene, camera, renderer, cssRenderer, cssScene;
    let roadCurve, frenetFrames, checkpoints = [];
    let targetT = 0; // Target camera position (0-1)
    let cameraT = 0; // Current camera position (0-1)
    let resourceManager = null;
    let lastTime = performance.now();
    
    // ── Look-around controls ──
    let targetLookDirection = new THREE.Vector3(0, 0, -1);
    let currentLookDirection = new THREE.Vector3(0, 0, -1);
    let isLookingAround = false;

    let rafId = null;
    let isAlive = true;

    // ── INITIALIZATION: Extract preloaded resources ──
    function initThreeJS() {
      const container = containerRef.current;
      if (!container || !preloadedResources) return;

      console.log('🚀 Initializing simplified Journey3D');

      // Get all prebuilt resources
      scene = preloadedResources.scene;
      cssScene = preloadedResources.cssScene;
      camera = preloadedResources.camera;
      renderer = preloadedResources.renderer;
      cssRenderer = preloadedResources.cssRenderer;
      roadCurve = preloadedResources.roadCurve;
      frenetFrames = preloadedResources.frenetFrames;
      checkpoints = preloadedResources.checkpoints;
      resourceManager = preloadedResources.resourceManager;

      // Attach DOM elements
      if (renderer && renderer.domElement && !renderer.domElement.parentNode) {
        container.appendChild(renderer.domElement);
      }
      
      if (cssRenderer && cssRenderer.domElement && !cssRenderer.domElement.parentNode) {
        container.appendChild(cssRenderer.domElement);
      }

      setupLookAroundControls();
      
      // Store references for animation loop
      sceneRef.current = {
        scene, camera, renderer, cssRenderer, cssScene,
        roadCurve, frenetFrames, checkpoints,
        targetT, cameraT
      };

      animate();
    }

    // ── MOUSE LOOK CONTROLS: Camera look-around ──
    function setupLookAroundControls() {
      const container = containerRef.current;
      if (!container) return;

      const onMouseMove = (event) => {
        if (!camera || !targetLookDirection) return;
        
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert mouse to normalized coordinates
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);
        
        // Calculate look angles
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
        
        // Apply rotations to look direction
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        const up = new THREE.Vector3(0, 1, 0);
        
        targetLookDirection.copy(forward);
        targetLookDirection.applyAxisAngle(up, yawAngle);
        targetLookDirection.applyAxisAngle(right, pitchAngle);
        targetLookDirection.normalize();
        
        isLookingAround = true;
      };

      const onMouseLeave = () => {
        isLookingAround = false;
      };

      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // CAMERA UPDATE LOGIC - Smooth movement with checkpoint detection
    // 
    // DURING CHECKPOINT ANIMATIONS:
    // ✅ ALLOW: Camera look-around (mouse movement for immersive experience)
    // 🚫 BLOCK: All scroll movement (wheel, keyboard, touch - absolutely no position changes)
    // 
    // DURING JOURNEY COMPLETION:
    // 🔒 LOCK: Camera position at end (0.999) to prevent glitches
    // 🏠 SMOOTH: Direct transition to main page from journey end
    // ──────────────────────────────────────────────────────────────────────────────
    function updateCameraAndObjects(deltaTime) {
      if (!isAlive) return;
      
      const sRef = sceneRef.current;
      if (!sRef) return;
      
      // ── JOURNEY COMPLETION: Absolute lock to prevent glitches ──
      if (journeyCompletedRef.current) {
        // CRITICAL: Keep camera absolutely locked at end position during completion
        sRef.cameraT = 0.999;
        sRef.targetT = 0.999;
        // Skip all other position updates to prevent any camera movement during transition
        return updateCameraPosition(sRef, deltaTime);
      }
      
      // ── CHECKPOINT PAUSE HANDLING ──
      let isPaused = false;
      if (currentCheckpointRef.current && pauseStartTimeRef.current) {
        const pauseElapsed = performance.now() - pauseStartTimeRef.current;
        
        if (pauseElapsed >= CHECKPOINT_PAUSE_DURATION) {
          // Resume after 2 seconds - SYNC virtual scroll with camera position
          console.log(`⏰ Resuming after checkpoint: ${currentCheckpointRef.current.data.title}`);
          
          // CRITICAL FIX: Sync virtual scroll position with actual camera position
          // This prevents the scroll jump when resuming from checkpoint pause
          const docHeight = document.body.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            virtualScrollY.current = sRef.cameraT * docHeight;
            window.scrollTo(0, virtualScrollY.current);
            console.log(`🔄 Synced virtual scroll to ${virtualScrollY.current.toFixed(1)} (camera at ${sRef.cameraT.toFixed(3)})`);
          }
          
          currentCheckpointRef.current = null;
          pauseStartTimeRef.current = null;
          scrollBlockedRef.current = false;
          isPaused = false;
        } else {
          // Stay paused - block position updates but allow look-around
          isPaused = true;
          console.log(`🔒 Camera position locked during animation (${(pauseElapsed/1000).toFixed(1)}s elapsed)`);
        }
      }
      
      // ── POSITION UPDATES: Only when not paused and journey not completed ──
      if (!isPaused) {
        // ── CONVERT SCROLL TO CAMERA TARGET ──
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          sRef.targetT = Math.min(virtualScrollY.current / docHeight, 1);
          const newProgress = Math.round(sRef.targetT * 100);
          setProgress(newProgress);
        }
        
        // ── SMOOTH CAMERA INTERPOLATION ──
        // Frame-rate independent interpolation for consistent movement
        const lerpFactor = 1 - Math.pow(1 - CAMERA_LERP_FACTOR, deltaTime * 60);
        sRef.cameraT += (sRef.targetT - sRef.cameraT) * lerpFactor;
        sRef.cameraT = Math.min(Math.max(sRef.cameraT, 0), 0.999);
        
        // ── CHECKPOINT DETECTION ──
        if (!currentCheckpointRef.current) {
          for (let cp of checkpointsRef.current) {
            if (sRef.cameraT >= cp.stopT && !cp.triggered) {
              console.log(`🎯 Reached checkpoint ${cp.index} at ${cp.stopT.toFixed(3)}`);
              
              // Trigger checkpoint pause
              cp.triggered = true;
              currentCheckpointRef.current = cp;
              pauseStartTimeRef.current = performance.now();
              scrollBlockedRef.current = true;
              
              // Snap camera to exact checkpoint position and sync virtual scroll
              sRef.cameraT = cp.stopT;
              sRef.targetT = cp.stopT;
              
              // CRITICAL: Update virtual scroll to match camera position immediately
              const docHeight = document.body.scrollHeight - window.innerHeight;
              if (docHeight > 0) {
                virtualScrollY.current = sRef.cameraT * docHeight;
                window.scrollTo(0, virtualScrollY.current);
              }
              
              // Start checkpoint animations
              playCheckpointSequence(cp);
              break;
            }
          }
        }
        
        // ── JOURNEY COMPLETION: Lock camera at end position ──
        if (sRef.cameraT >= 0.95 && !isCompleting && !journeyCompletedRef.current) {
          console.log('🏁 Journey completed - locking camera at end position');
          
          // Lock camera at exact end position to prevent glitches
          sRef.cameraT = 0.999;
          sRef.targetT = 0.999;
          
          // Sync virtual scroll to end position
          const docHeight = document.body.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            virtualScrollY.current = docHeight;
            window.scrollTo(0, virtualScrollY.current);
          }
          
          journeyCompletedRef.current = true;
          scrollBlockedRef.current = true; // Block all scroll input
          
          setIsCompleting(true);
          
          // Smooth transition to main page from end position
          setTimeout(() => {
            console.log('🏠 Transitioning to main page from journey end');
            if (onComplete) onComplete();
          }, 1500); // Slightly shorter delay for smoother UX
        }
      }
      
      // Continue with camera positioning
      updateCameraPosition(sRef, deltaTime);
    }
    
    // ── SEPARATED CAMERA POSITIONING LOGIC ──
    function updateCameraPosition(sRef, deltaTime) {

        // ── CAMERA POSITIONING & ORIENTATION: Always active, even during animations ──
        const position = sRef.roadCurve.getPointAt(sRef.cameraT);
        const frameIndex = Math.floor(sRef.cameraT * sRef.frenetFrames.tangents.length);
        const normal = sRef.frenetFrames.normals[frameIndex];
        
        // Position camera above the road
        sRef.camera.position.copy(position).add(normal.clone().multiplyScalar(CAMERA_BASE_OFFSET_Y * SCENE_SCALE));
        
        // ── LOOK-AROUND BEHAVIOR: Always enabled for immersive experience ──
        if (!isLookingAround) {
          targetLookDirection.copy(new THREE.Vector3(0, 0, -1));
        }
        
        currentLookDirection.lerp(targetLookDirection, LOOK_AROUND_LERP_FACTOR);
        currentLookDirection.normalize();
        
        // Apply base camera orientation along the road
        const roadMatrix = new THREE.Matrix4();
        const lookAtPosition = sRef.roadCurve.getPointAt(Math.min(sRef.cameraT + 0.01, 1));
        roadMatrix.lookAt(sRef.camera.position, lookAtPosition, normal);
        
        sRef.camera.quaternion.setFromRotationMatrix(roadMatrix);
        
        // Apply look-around offset for interactive camera control
        if (isLookingAround || !currentLookDirection.equals(new THREE.Vector3(0, 0, -1))) {
          const worldLookDirection = currentLookDirection.clone();
          worldLookDirection.applyQuaternion(sRef.camera.quaternion);
          
          const finalLookAt = sRef.camera.position.clone().add(worldLookDirection.multiplyScalar(100));
          
          const finalMatrix = new THREE.Matrix4();
          finalMatrix.lookAt(sRef.camera.position, finalLookAt, normal);
          sRef.camera.quaternion.setFromRotationMatrix(finalMatrix);
          
          // Log during animations for feedback (check if we're in a paused state)
          if (currentCheckpointRef.current && pauseStartTimeRef.current && isLookingAround) {
            console.log(`👀 Look-around active during checkpoint animation`);
          }
        }

        // Keep checkpoint objects facing camera for proper visibility
        sRef.checkpoints.forEach((cp) => {
          cp.cardObject.rotation.copy(sRef.camera.rotation);
          cp.headerObject.rotation.copy(sRef.camera.rotation);
        });
      }

    // ── RENDER LOOP ──
    function animate(now = performance.now()) {
      if (!isAlive) return;
      
      rafId = requestAnimationFrame(animate);
      
      if (!renderer || !cssRenderer || !scene || !camera) {
        isAlive = false;
        return;
      }
      
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      updateCameraAndObjects(deltaTime);
      
      try {
        renderer.render(scene, camera);
        cssRenderer.render(cssScene, camera);
      } catch (error) {
        console.error('🚨 Render error:', error);
        isAlive = false;
      }
    }

    // ── WINDOW RESIZE HANDLER ──
    function onWindowResize() {
      if (!sceneRef.current) return;
      const { camera, renderer, cssRenderer } = sceneRef.current;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ── INITIALIZE ──
    if (typeof window !== 'undefined' && preloadedResources) {
      initThreeJS();
      window.addEventListener('resize', onWindowResize);
    }

    // ── CLEANUP ──
    return () => {
      console.log('🧹 Journey3D cleanup');
      
      isAlive = false;
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Reset checkpoint and journey state - Enhanced cleanup
      currentCheckpointRef.current = null;
      pauseStartTimeRef.current = null;
      scrollBlockedRef.current = false;
      journeyCompletedRef.current = false;
      virtualScrollY.current = 0; // Reset virtual scroll position
      checkpointsRef.current.forEach(cp => cp.triggered = false);

      // Reset document body scroll behavior
      if (typeof document !== 'undefined') {
        document.body.style.height = '';
        document.body.style.overflow = '';
        window.scrollTo(0, 0); // Reset scroll position to prevent issues
      }

      // Dispose React roots
      if (resourceManager && resourceManager.disposeReactRoots) {
        resourceManager.disposeReactRoots();
      }

      // Remove DOM elements safely
      if (containerRef.current) {
        try {
          if (renderer && renderer.domElement && renderer.domElement.parentNode === containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
          }
          if (cssRenderer && cssRenderer.domElement && cssRenderer.domElement.parentNode === containerRef.current) {
            containerRef.current.removeChild(cssRenderer.domElement);
          }
        } catch (error) {
          console.warn('⚠️ Error during DOM cleanup:', error);
        }
      }

      window.removeEventListener('resize', onWindowResize);
    };
  }, [isTransitioning, onComplete, isCompleting, preloadedResources, playCheckpointSequence]);

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Clean UI
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black major-mono-display-regular overflow-hidden">
      {/* Transition overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Completion overlay - Enhanced to prevent journey completion glitch */}
      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
      
      {/* Additional completion safety overlay to ensure smooth transition */}
      {isCompleting && (
        <motion.div
          className="absolute inset-0 bg-black z-70 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        />
      )}

      {/* Journey title during transition */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 major-mono-display-regular tracking-widest">
              JOURNEY
            </h2>
            <div className="w-32 h-[2px] bg-white mx-auto"></div>
          </div>
        </motion.div>
      )}
      
      {/* THREE.js container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
} 