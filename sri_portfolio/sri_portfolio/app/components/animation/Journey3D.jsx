"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import journeyData from '../../json/journey.json';
import * as THREE from 'three';
import { useJourneyControl } from './useJourneyControl';

// ──────────────────────────────────────────────────────────────────────────────
// RUNTIME CONSTANTS - Camera & Animation Control
// ──────────────────────────────────────────────────────────────────────────────

const SCENE_SCALE = 5; // Must match Loader's SCENE_SCALE
const LERP_FACTOR = 0.05; // Camera smoothing factor
const CAMERA_BASE_OFFSET_Y = 2.0; // Camera height above road
const LOOK_AROUND_MAX_YAW_DEG = 30; // Max mouse look angle
const LOOK_AROUND_LERP_FACTOR = 0.1; // Look-around smoothing
const OBJECT_PLACEMENT_OFFSET_T = 0.065; // Must match Loader's offset

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

// ──────────────────────────────────────────────────────────────────────────────
// MAIN JOURNEY3D COMPONENT - Pure Runtime Animation
// ──────────────────────────────────────────────────────────────────────────────

export default function Journey3D({ onComplete, preloadedResources }) {
  // ── Container & References ──
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  
  // ── UI State ──
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showContinueHint, setShowContinueHint] = useState(false);

  // ── Journey Configuration ──
  const journeyLength = journeyData.length;
  const totalHeight = Math.max(1600, journeyLength * 300);

  // ── STABLE CHECKPOINT DATA: Initialize triggered flags only once ──
  const checkpointsRef = useRef([]);
  const lastCheckpointIndex = useRef(-1); // Track last triggered checkpoint
  
  useEffect(() => {
    if (preloadedResources?.checkpoints) {
      // Initialize checkpoint data with triggered flags ONLY ONCE
      // Include objectT to match Loader's card placement logic
      checkpointsRef.current = preloadedResources.checkpoints.map((cp, i) => ({
        stopT: cp.stopT,
        objectT: cp.stopT + OBJECT_PLACEMENT_OFFSET_T, // Where cards actually live
        index: i,
        triggered: false
      }));
      lastCheckpointIndex.current = -1; // Reset checkpoint tracking
      console.log('📋 Checkpoint data initialized:', checkpointsRef.current.length, 'checkpoints with objectT offsets');
      console.log('📍 Checkpoint positions:', checkpointsRef.current.map(cp => 
        `${cp.index}: stopT=${cp.stopT.toFixed(3)}, objectT=${cp.objectT.toFixed(3)}`
      ));
    }
  }, [preloadedResources]);

  // ── FSM CHECKPOINT CONTROL: Use stable checkpoint data ──
  const journeyControl = useJourneyControl({ 
    checkpoints: checkpointsRef.current,
    autoResumeDelayMs: 5000 
  });

  // ── CSS3D CHECKPOINT REFERENCES: Keep ref to CSS3D objects for React-driven animations ──
  const css3DCheckpointsRef = useRef(preloadedResources?.checkpoints || []);

  // ── VIRTUAL SCROLL SYSTEM: Complete control over scroll behavior ──
  const virtualScrollY = useRef(0);

  // ── VIRTUAL SCROLL CONTROL: Hijack wheel events for smooth checkpoint pausing ──
  useEffect(() => {
    // Document height calculation
    const getDocHeight = () => Math.max(0, document.body.scrollHeight - window.innerHeight);
    
    const handleWheel = (e) => {
      e.preventDefault(); // Block native scroll completely
      
      const raw = e.deltaY;
      const { phase, index } = journeyControl.state;
      const docHeight = getDocHeight();
      
      let scaled = raw;
      
      // ZONE-BASED SLOWDOWN: Dramatically slow scroll near checkpoints
      if (phase === 'traveling' && checkpointsRef.current.length > 0) {
        // Find the next upcoming checkpoint that hasn't been triggered
        const currentProgress = virtualScrollY.current / docHeight;
        const nextCheckpoint = checkpointsRef.current.find(cp => 
          cp.stopT > currentProgress && !cp.triggered
        );
        
        if (nextCheckpoint) {
          const { stopT, objectT } = nextCheckpoint;
          const stopPx = stopT * docHeight;   // Where FSM pauses
          const endPx = objectT * docHeight;  // Where cards actually live
          
          // CORRECTED ZONE: Slowdown between stopT and objectT (not before stopT)
          if (virtualScrollY.current >= stopPx && virtualScrollY.current <= endPx) {
            // DRAMATIC SLOWDOWN: 25% of normal scroll speed in checkpoint zone
            const slowdownFactor = 0.25;
            scaled = raw * slowdownFactor;
            console.log(`🐌 Slowdown zone active: ${slowdownFactor}x speed between stopT=${stopT.toFixed(3)} and objectT=${objectT.toFixed(3)} for checkpoint ${nextCheckpoint.index}`);
          }
        }
      }
      
      // COMPLETE FREEZE: No scroll during checkpoint animations
      if (phase === 'atCheckpoint') {
        console.log('🔒 Scroll completely blocked during checkpoint animation');
        // NO AUTO-RESUME: Let FSM timer or explicit user action handle resume
        return; // No movement at all
      }
      
      // Update virtual scroll position with clamping
      const oldVirtualY = virtualScrollY.current;
      virtualScrollY.current = Math.max(0, Math.min(docHeight, virtualScrollY.current + scaled));
      
      // Sync browser scroll to virtual position
      window.scrollTo(0, virtualScrollY.current);
      
      // Debug logging for scroll control
      if (Math.abs(scaled - raw) > 0.1) {
        console.log(`📏 Virtual scroll: ${oldVirtualY.toFixed(0)} → ${virtualScrollY.current.toFixed(0)} (scaled: ${scaled.toFixed(1)} from ${raw.toFixed(1)})`);
      }
    };
    
    const handleKeyDown = (e) => {
      // Block arrow keys, page up/down, space during checkpoint animations
      if (journeyControl.state.phase === 'atCheckpoint') {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code)) {
          e.preventDefault();
          console.log('⌨️ Keyboard scroll blocked during checkpoint animation');
        }
      }
    };
    
    // Manual resume mechanism - click anywhere to continue
    const handleClick = (e) => {
      if (journeyControl.state.phase === 'atCheckpoint') {
        console.log('👆 User clicked during checkpoint - dispatching USER_RESUME');
        journeyControl.dispatch({ type: 'USER_RESUME' });
      }
    };
    
    // Touch handling for mobile devices
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      if (journeyControl.state.phase === 'atCheckpoint') {
        e.preventDefault();
        console.log('📱 Touch scroll blocked during checkpoint animation');
        // NO AUTO-RESUME: Let FSM timer or explicit user action handle resume
        return;
      }
      
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;
      
      // Apply same virtual scroll logic as wheel events
      const { phase, index } = journeyControl.state;
      const docHeight = getDocHeight();
      
      let scaled = deltaY * 2; // Touch sensitivity multiplier
      
      // Zone-based slowdown for touch
      if (phase === 'traveling' && checkpointsRef.current.length > 0) {
        // Find the next upcoming checkpoint that hasn't been triggered
        const currentProgress = virtualScrollY.current / docHeight;
        const nextCheckpoint = checkpointsRef.current.find(cp => 
          cp.stopT > currentProgress && !cp.triggered
        );
        
        if (nextCheckpoint) {
          const { stopT, objectT } = nextCheckpoint;
          const stopPx = stopT * docHeight;   // Where FSM pauses
          const endPx = objectT * docHeight;  // Where cards actually live
          
          // CORRECTED ZONE: Slowdown between stopT and objectT (not before stopT)
          if (virtualScrollY.current >= stopPx && virtualScrollY.current <= endPx) {
            const slowdownFactor = 0.25;
            scaled = deltaY * slowdownFactor;
            console.log(`🐌📱 Touch slowdown zone active: ${slowdownFactor}x speed between stopT=${stopT.toFixed(3)} and objectT=${objectT.toFixed(3)} for checkpoint ${nextCheckpoint.index}`);
          }
        }
      }
      
      // Update virtual scroll position
      const oldVirtualY = virtualScrollY.current;
      virtualScrollY.current = Math.max(0, Math.min(docHeight, virtualScrollY.current + scaled));
      window.scrollTo(0, virtualScrollY.current);
      
      e.preventDefault(); // Prevent native touch scroll
    };
    
    // Attach non-passive listeners for complete control
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('click', handleClick, { passive: false });
    console.log('🎮 Virtual scroll system activated (wheel + keyboard + touch + click)');
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('click', handleClick);
      console.log('🧹 Virtual scroll system deactivated');
    };
  }, [journeyControl.state.phase, journeyControl.state.index]);

  // ── FSM-DRIVEN CHECKPOINT TRIGGERING: React effect watches FSM state changes ──
  useEffect(() => {
    if (journeyControl.state.phase === 'atCheckpoint') {
      const checkpointIndex = journeyControl.state.index;
      const cp = css3DCheckpointsRef.current[checkpointIndex];
      
      if (cp && !cp._animated) {
        console.log(`🎯 FSM triggered checkpoint ${checkpointIndex} - starting animation sequence`);
        cp._animated = true; // Prevent duplicate animations
        setShowContinueHint(false); // Hide hint during animation
        playCheckpointSequence(cp);
      }
    } else {
      // Hide hint when not at checkpoint
      setShowContinueHint(false);
    }
  }, [journeyControl.state.phase, journeyControl.state.index]);

  // ──────────────────────────────────────────────────────────────────────────────
  // CHECKPOINT SEQUENCE: Proper slide-in animations with transitionend events
  // SCROLL BLOCKING: Prevent page scroll during animations for clean experience
  // FSM INTEGRATION: No manual resume logic needed - FSM handles scroll detection
  // ERROR HANDLING: Safe React root rendering with isAlive checks
  // ──────────────────────────────────────────────────────────────────────────────
  const playCheckpointSequence = useCallback(async (cp) => {
    console.log(`🎬 playCheckpointSequence: Starting sequence for checkpoint ${cp.index}:`, cp.data.title);
    
    // ── BLOCK SCROLLING: Prevent user scroll during animation sequence ──
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    console.log('🔒 Page scrolling blocked during checkpoint animation');
    
    try {
      // ── TRIGGER SLIDE-IN ANIMATIONS: Add .visible class to both elements ──
      cp.cardObject.element.classList.add('visible');
      cp.headerObject.element.classList.add('visible');
      console.log(`🎨 Added .visible class to card and header for checkpoint ${cp.index}`);

      // ── WAIT FOR CARD TRANSITION: Listen for transitionend event ──
      const cardAnimationPromise = new Promise(resolve => {
        const handleCardTransition = (event) => {
          if (event.propertyName === 'transform') {
            console.log(`✅ Card ${cp.index} slide-in transition completed`);
            resolve();
          }
        };
        cp.cardObject.element.addEventListener('transitionend', handleCardTransition, { once: true });
      });

      // ── WAIT FOR HEADER TRANSITION: Listen for transitionend event ──
      const headerAnimationPromise = new Promise(resolve => {
        const handleHeaderTransition = (event) => {
          if (event.propertyName === 'transform') {
            console.log(`✅ Header ${cp.index} slide-in transition completed`);
            resolve();
          }
        };
        cp.headerObject.element.addEventListener('transitionend', handleHeaderTransition, { once: true });
      });

      // ── START TYPEWRITER ANIMATION: Safe React root rendering ──
      const typewriterPromise = new Promise((resolve) => {
        // Check if React root still exists
        if (!cp.root) {
          console.log('⚠️ React root not found, skipping typewriter animation for checkpoint', cp.index);
          return resolve();
        }
        
        console.log(`⌨️ Starting typewriter animation for checkpoint ${cp.index}`);
        
        // Safe render
        setTimeout(() => {
          if (!cp.root) {
            console.log('⚠️ Root disposed during timeout, skipping render');
            return resolve();
          }
          
          try {
            cp.root.render(
              <CheckpointHeader 
                title={cp.data.title}
                heading={cp.data.heading}
                onAnimationComplete={() => {
                  console.log(`✅ Typewriter animation completed for checkpoint ${cp.index}`);
                  resolve();
                }}
              />
            );
          } catch (error) {
            console.error('Error rendering checkpoint header:', error);
            resolve();
          }
        }, 0);
      });
      
      // ── WAIT FOR ALL ANIMATIONS: Both slide-ins + typewriter ──
      console.log(`⏳ Waiting for all animations to complete for checkpoint ${cp.index}`);
      await Promise.all([cardAnimationPromise, headerAnimationPromise, typewriterPromise]);

      console.log(`🎉 All animations completed for checkpoint ${cp.index}`);
      
      // ── SYNC VIRTUAL SCROLL: Reset virtual scroll to match camera position ──
      if (sceneRef.current?.cameraT !== undefined) {
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const newVirtualScrollY = sceneRef.current.cameraT * docHeight;
        virtualScrollY.current = newVirtualScrollY;
        window.scrollTo(0, newVirtualScrollY);
        console.log(`🔄 Virtual scroll synced to camera position: cameraT=${sceneRef.current.cameraT.toFixed(3)}, virtualScrollY=${newVirtualScrollY.toFixed(0)}`);
      }
      
      // Show continue hint after animations complete
      setShowContinueHint(true);
      
    } finally {
      // ── RESTORE SCROLLING: Always restore scroll even if animations fail ──
      document.body.style.overflow = originalOverflow;
      console.log('🔓 Page scrolling restored after checkpoint animation');
    }
    
    console.log(`📄 FSM will handle scroll detection and auto-resume for checkpoint ${cp.index}`);
    
    // FSM INTEGRATION: No manual scroll listeners needed
    // The useJourneyControl hook automatically handles:
    // 1. Scroll detection → USER_RESUME action
    // 2. 5-second timeout → AUTO_RESUME action  
    // 3. Resume animation → CATCH_UP_COMPLETE action
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // SETUP: Document body height & transition timing
  // ──────────────────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    // Allow transition screen to show before starting
    const timeoutId = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // MAIN RUNTIME LOOP: Pure animation using pre-loaded resources
  // GUARDS: Strong isAlive checks to prevent context loss and stale operations
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTransitioning || !preloadedResources) return;

    // ── THREE.js Runtime Variables ──
    let scene, camera, renderer, cssRenderer, cssScene;
    let roadCurve, frenetFrames, checkpoints = [];
    let targetT = 0; // Target scroll position (0-1)
    let cameraT = 0; // Current camera position (0-1)
    let resourceManager = null; // Store reference for React root cleanup
    
    // ── Performance Variables ──
    let lastTime = performance.now();
    
    // ── Look-around Controls ──
    let targetLookDirection = new THREE.Vector3(0, 0, -1);
    let currentLookDirection = new THREE.Vector3(0, 0, -1);
    let isLookingAround = false;

    // ── Animation Loop Control ──
    let rafId = null;
    let isAlive = true;

    // ──────────────────────────────────────────────────────────────────────────────
    // INITIALIZATION: Use pre-built resources from Loader
    // DOM LIFECYCLE: Attach renderers exactly once, store cleanup functions
    // ──────────────────────────────────────────────────────────────────────────────
    function initThreeJS() {
      const container = containerRef.current;
      if (!container || !preloadedResources) return;

      console.log('🚀 initThreeJS: Initializing with preloaded resources');

      // Extract all pre-built resources (no creation here!)
      scene = preloadedResources.scene;
      cssScene = preloadedResources.cssScene;
      camera = preloadedResources.camera;
      renderer = preloadedResources.renderer;
      cssRenderer = preloadedResources.cssRenderer;
      roadCurve = preloadedResources.roadCurve;
      frenetFrames = preloadedResources.frenetFrames;
      checkpoints = preloadedResources.checkpoints;
      resourceManager = preloadedResources.resourceManager; // Store for React root cleanup

      // ── UPDATE CHECKPOINT REF: Ensure React effect has access to current checkpoints ──
      css3DCheckpointsRef.current = checkpoints;

      console.log('📦 Resources loaded:', {
        scene: !!scene,
        cssScene: !!cssScene,
        camera: !!camera,
        renderer: !!renderer,
        cssRenderer: !!cssRenderer,
        roadCurve: !!roadCurve,
        frenetFrames: !!frenetFrames,
        checkpoints: checkpoints.length
      });

      // ── DOM ATTACHMENT: Attach renderer DOM elements exactly once ──
      if (renderer && renderer.domElement && !renderer.domElement.parentNode) {
        container.appendChild(renderer.domElement);
        console.log('🔗 Attached WebGL renderer to container');
      }
      
      if (cssRenderer && cssRenderer.domElement && !cssRenderer.domElement.parentNode) {
        container.appendChild(cssRenderer.domElement);
        console.log('🔗 Attached CSS3D renderer to container');
      }

      // Setup runtime controls and capture cleanup functions
      const cleanupScroll = setupScrollControls();
      const cleanupLookAround = setupLookAroundControls();
      
      // Store references for animation loop
      sceneRef.current = {
        scene, camera, renderer, cssRenderer, cssScene,
        roadCurve, frenetFrames, checkpoints,
        targetT, cameraT,
        LERP_FACTOR, SCENE_SCALE,
        cleanupScroll,
        cleanupLookAround
      };

      console.log('✅ initThreeJS: Initialization complete, starting animation loop');
      animate(); // Start pure animation loop
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // SCROLL CONTROLS: Virtual scroll integration - no more passive listeners
    // PERFORMANCE: Virtual scroll value updated by wheel hijacking system
    // ──────────────────────────────────────────────────────────────────────────────
    function setupScrollControls() {
      // VIRTUAL SCROLL: No event listeners needed - virtualScrollY updated by wheel handler
      console.log('📜 Virtual scroll integration active - no passive listeners needed');
      
      return () => {
        // No cleanup needed for virtual scroll
        console.log('🧹 Virtual scroll integration cleanup (no-op)');
      };
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // MOUSE LOOK CONTROLS: Camera look-around on mouse movement
    // ──────────────────────────────────────────────────────────────────────────────
    function setupLookAroundControls() {
      const container = containerRef.current;
      if (!container) return () => {}; // Return no-op cleanup

      const onMouseMove = (event) => {
        if (!camera || !targetLookDirection) return;
        
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert mouse position to normalized coordinates (-1 to 1)
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);
        
        // Calculate look angles with clamping
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
        isLookingAround = false; // Return to forward look
      };

      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);

      return () => {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
      };
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // ANIMATION LOOP: Update camera position and orientation with delta time
    // VIRTUAL SCROLL INTEGRATION: Use virtualScrollY for smooth checkpoint control
    // PERFORMANCE: Process virtual scroll updates once per frame in RAF loop
    // ──────────────────────────────────────────────────────────────────────────────
    function updateCameraAndObjects(deltaTime) {
      if (!isAlive) return;
      
      const sRef = sceneRef.current;
      if (!sRef) return;
      
      // VIRTUAL SCROLL: Process virtual scroll updates once per frame
      if (journeyControl.shouldMoveCamera()) {
        // Convert virtual scroll to normalized position (0-1)
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          sRef.targetT = Math.min(virtualScrollY.current / docHeight, 1);
          const newProgress = Math.round(sRef.targetT * 100);
          setProgress(newProgress);
        }
      }
      
      // FSM UPDATE: Process checkpoint collisions, auto-resume, journey completion
      journeyControl.update(deltaTime, sRef.cameraT, sRef.targetT);
      
      // PERFORMANCE: Delta time-based smooth camera movement (only when FSM allows)
      if (journeyControl.shouldMoveCamera()) {
        // Frame-rate independent interpolation
        const lerpFactor = 1 - Math.pow(1 - LERP_FACTOR, deltaTime * 60);
        sRef.cameraT += (sRef.targetT - sRef.cameraT) * lerpFactor;
      }
      sRef.cameraT = Math.min(Math.max(sRef.cameraT, 0), 0.999);

      // FSM COMPLETION HANDLING: Trigger completion when FSM says journey is complete
      if (journeyControl.isCompleted && !isCompleting) {
        setIsCompleting(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      }

      // Get camera position on road curve
      const position = sRef.roadCurve.getPointAt(sRef.cameraT);
      const frameIndex = Math.floor(sRef.cameraT * sRef.frenetFrames.tangents.length);
      const normal = sRef.frenetFrames.normals[frameIndex];
      
      // Position camera above road
      sRef.camera.position.copy(position).add(normal.clone().multiplyScalar(CAMERA_BASE_OFFSET_Y * SCENE_SCALE));

      // Handle look-around behavior
      if (targetLookDirection && currentLookDirection) {
        if (!isLookingAround) {
          // Return to forward direction when not looking around
          const roadForward = new THREE.Vector3(0, 0, -1);
          targetLookDirection.copy(roadForward);
        }
        
        // Smooth interpolation between current and target look direction
        currentLookDirection.lerp(targetLookDirection, LOOK_AROUND_LERP_FACTOR);
        currentLookDirection.normalize();
      }
      
      // Apply camera orientation along road + look offset
      const roadMatrix = new THREE.Matrix4();
      const lookAtPosition = sRef.roadCurve.getPointAt(Math.min(sRef.cameraT + 0.01, 1));
      roadMatrix.lookAt(sRef.camera.position, lookAtPosition, normal);
      
      sRef.camera.quaternion.setFromRotationMatrix(roadMatrix);
      
      // Apply look-around offset in camera's local space
      if (currentLookDirection && (isLookingAround || !currentLookDirection.equals(new THREE.Vector3(0, 0, -1)))) {
        const worldLookDirection = currentLookDirection.clone();
        worldLookDirection.applyQuaternion(sRef.camera.quaternion);
        
        const finalLookAt = sRef.camera.position.clone().add(worldLookDirection.multiplyScalar(100));
        
        const finalMatrix = new THREE.Matrix4();
        finalMatrix.lookAt(sRef.camera.position, finalLookAt, normal);
        sRef.camera.quaternion.setFromRotationMatrix(finalMatrix);
      }

      // Keep checkpoint objects facing camera
      sRef.checkpoints.forEach((cp) => {
        cp.cardObject.rotation.copy(sRef.camera.rotation);
        cp.headerObject.rotation.copy(sRef.camera.rotation);
      });

      // FSM INTEGRATION: Checkpoint triggering now handled by dedicated React effect
      // No more manual checkpoint collision detection here - FSM handles it all!
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // RENDER LOOP: Delta time-based animation for consistent 60fps performance
    // STRONG GUARDS: Prevent rendering after disposal or context loss
    // PERFORMANCE: Single RAF loop drives all movement, decoupled scroll processing
    // ──────────────────────────────────────────────────────────────────────────────
    function animate(now = performance.now()) {
      if (!isAlive) {
        console.log('🛑 Animation loop stopped - isAlive = false');
        return;
      }
      
      rafId = requestAnimationFrame(animate);
      
      // Guard against context loss
      if (!renderer || !cssRenderer || !scene || !camera) {
        console.log('⚠️ Missing critical rendering components, stopping animation');
        isAlive = false;
        return;
      }
      
      // PERFORMANCE: Calculate delta time for consistent animation speed
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
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

    // ──────────────────────────────────────────────────────────────────────────────
    // WINDOW RESIZE: Update camera and renderers with performance optimization
    // ──────────────────────────────────────────────────────────────────────────────
    function onWindowResize() {
      if (!sceneRef.current) return;
      const { camera, renderer, cssRenderer } = sceneRef.current;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      // PERFORMANCE: Maintain capped pixel ratio on resize
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      
      console.log('📐 Window resized, pixel ratio:', renderer.getPixelRatio());
    }

    // ── Initialize if resources are ready ──
    if (typeof window !== 'undefined' && preloadedResources) {
      initThreeJS();
      window.addEventListener('resize', onWindowResize);
    }

    // ── CLEANUP: Proper DOM lifecycle management with React root disposal ──
    return () => {
      console.log('🧹 Journey3D: Starting cleanup');
      
      // ── STEP 1: Stop all operations immediately ──
      isAlive = false;
      
      if (rafId) {
        cancelAnimationFrame(rafId);
        console.log('🛑 Animation loop cancelled');
      }

      // ── STEP 1.5: Reset FSM state ──
      journeyControl.reset();
      console.log('🔄 Journey control FSM reset');

      // ── STEP 2: Clean up event listeners using captured cleanup functions ──
      if (sceneRef.current) {
        if (sceneRef.current.cleanupScroll) {
          sceneRef.current.cleanupScroll();
          console.log('🧹 Scroll event listeners cleaned up');
        }
        if (sceneRef.current.cleanupLookAround) {
          sceneRef.current.cleanupLookAround();
          console.log('🧹 Look-around event listeners cleaned up');
        }
      }

      // ── STEP 3: Dispose React roots to prevent "unmounted root" errors ──
      if (resourceManager && resourceManager.disposeReactRoots) {
        resourceManager.disposeReactRoots();
        console.log('🗑️ React roots disposal initiated');
      }

      // ── STEP 4: DOM ELEMENT REMOVAL: Remove exactly what we attached ──
      if (containerRef.current) {
        if (renderer && renderer.domElement && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
          console.log('🔌 Removed WebGL renderer from container');
        }
        if (cssRenderer && cssRenderer.domElement && cssRenderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(cssRenderer.domElement);
          console.log('🔌 Removed CSS3D renderer from container');
        }
      }

      // ── STEP 5: Remove window event listeners ──
      window.removeEventListener('resize', onWindowResize);
      
      console.log('✅ Journey3D: Cleanup completed');
    };
  }, [isTransitioning, onComplete, isCompleting, preloadedResources]);

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Minimal UI with transition states
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black major-mono-display-regular overflow-hidden">
      {/* Transition in overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Completion fade overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

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

      {/* THREE.js container - renderers attached here by resource manager */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Continue hint - shown after checkpoint animations complete */}
      {showContinueHint && (
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3">
            <p className="text-white text-sm major-mono-display-regular tracking-wider">
              Click anywhere or scroll to continue
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
} 