"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
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
// 
// Core Responsibilities:
// • Camera movement and positioning along prebuilt road curve
// • Checkpoint detection and animation triggers  
// • Smooth navigation between checkpoints
// • Virtual scroll management with event blocking
// • CSS3D checkpoint rendering and interaction
// • Progress tracking and UI state management
// ──────────────────────────────────────────────────────────────────────────────

export default function Journey3D({ onComplete, preloadedResources }) {
  // ── Core References ──
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  
  // ── UI State ──
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  // ── CHECKPOINT NAVIGATION STATE ──
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(-1);
  const [showCheckpointNav, setShowCheckpointNav] = useState(true); // Show from start
  const [isBeforeFirstCheckpoint, setIsBeforeFirstCheckpoint] = useState(true);
  const [isAtFinalCheckpoint, setIsAtFinalCheckpoint] = useState(false);
  
  // ── SMOOTH NAVIGATION STATE ──
  const [isNavigatingToCheckpoint, setIsNavigatingToCheckpoint] = useState(false);
  const navigationAnimationRef = useRef(null);
  const navigationStartTimeRef = useRef(null);
  const navigationStartT = useRef(0);
  const navigationTargetT = useRef(0);
  const navigationDurationRef = useRef(2000); // 2 seconds default

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

  // ── PROGRESS CALCULATION HELPER ──
  const calculateProgress = useCallback((currentT) => {
    if (!checkpointsRef.current || checkpointsRef.current.length === 0) {
      return Math.round(currentT * 100);
    }
    
    // Get the last checkpoint's stopT as the journey endpoint
    const lastCheckpointStopT = checkpointsRef.current[checkpointsRef.current.length - 1].stopT;
    
    // Calculate progress from 0 to lastCheckpointStopT (not full path)
    const progressRatio = Math.min(currentT / lastCheckpointStopT, 1.0);
    return Math.round(progressRatio * 100);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // INITIALIZE checkpoint data from preloaded resources
  // ──────────────────────────────────────────────────────────────────────────────
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
    }
  }, [preloadedResources]);

  // ──────────────────────────────────────────────────────────────────────────────
  // SMOOTH SCROLL CONTROL - High responsiveness with checkpoint pausing
  //
  // Scroll Blocking Logic:
  // • Block ALL scroll during checkpoint animations for smooth experience
  // • Block forward scroll at final checkpoint (only allow backward)
  // • Block scroll during smooth navigation animations
  // • Block scroll when journey is completed
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const getDocHeight = () => Math.max(0, document.body.scrollHeight - window.innerHeight);
    
    // ── WHEEL HANDLER: Smooth scroll with max speed control ──
    const handleWheel = (e) => {
      e.preventDefault(); // Take full control of scrolling
      
      // Block scroll during checkpoint animations, navigation, or journey completion
      if (scrollBlockedRef.current) {
        return;
      }
      
      // Block forward scroll at final checkpoint - only allow backward movement
      if (currentCheckpointRef.current && 
          currentCheckpointRef.current.index === checkpointsRef.current.length - 1 && 
          e.deltaY > 0) {
        e.preventDefault();
        return;
      }
      
      const raw = e.deltaY;
      const docHeight = getDocHeight();
      
      // Apply max speed limiting for smooth control
      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 50, Math.min(MAX_SCROLL_SPEED * 50, raw));
      
      // Update virtual scroll position
      const newScrollY = Math.max(0, Math.min(docHeight, virtualScrollY.current + clampedDelta));
      virtualScrollY.current = newScrollY;
      window.scrollTo(0, virtualScrollY.current);
    };
    
    // ── KEYBOARD HANDLER: Block scroll keys during animations ──
    const handleKeyDown = (e) => {
      if (scrollBlockedRef.current) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }
      
      // Block forward keyboard movement at final checkpoint
      if (currentCheckpointRef.current && 
          currentCheckpointRef.current.index === checkpointsRef.current.length - 1 && 
          ['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        e.preventDefault();
        return;
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
        return;
      }

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;
      
      // Block forward touch movement at final checkpoint
      if (currentCheckpointRef.current && 
          currentCheckpointRef.current.index === checkpointsRef.current.length - 1 && 
          deltaY > 0) {
        e.preventDefault();
        return;
      }
      
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
  }, [isNavigatingToCheckpoint]); // Add dependency for navigation state

  // ──────────────────────────────────────────────────────────────────────────────
  // CHECKPOINT ANIMATION SEQUENCE - Triggered when camera reaches stopT
  // ──────────────────────────────────────────────────────────────────────────────
  const playCheckpointSequence = useCallback(async (cp) => {
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
        
        // Add timeout fallback in case transition never fires
        const timeout = setTimeout(() => {
          resolve();
        }, 2000);
        
        cp.cardObject.element.addEventListener('transitionend', (event) => {
          if (event.propertyName === 'transform') {
            clearTimeout(timeout);
            handleTransition(event);
          }
        }, { once: true });
      });

      const headerPromise = new Promise(resolve => {
        const handleTransition = (event) => {
          if (event.propertyName === 'transform') {
            resolve();
          }
        };
        
        // Add timeout fallback in case transition never fires
        const timeout = setTimeout(() => {
          resolve();
        }, 2000);
        
        cp.headerObject.element.addEventListener('transitionend', (event) => {
          if (event.propertyName === 'transform') {
            clearTimeout(timeout);
            handleTransition(event);
          }
        }, { once: true });
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
      
    } catch (error) {
      console.error('Error in checkpoint sequence:', error);
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // SMOOTH NAVIGATION ANIMATION SYSTEM
  // ──────────────────────────────────────────────────────────────────────────────
  
  const startSmoothNavigation = useCallback((startT, targetT, duration = 2000) => {
    // Calculate dynamic duration based on distance for more natural movement
    const distance = Math.abs(targetT - startT);
    const dynamicDuration = Math.max(1000, Math.min(4000, distance * 3000)); // 1-4 seconds based on distance
    
    // Set navigation state
    setIsNavigatingToCheckpoint(true);
    scrollBlockedRef.current = true; // Block scroll during navigation
    
    // Store navigation parameters
    navigationStartT.current = startT;
    navigationTargetT.current = targetT;
    navigationDurationRef.current = dynamicDuration;
    navigationStartTimeRef.current = performance.now();
  }, []);
  
  const updateSmoothNavigation = useCallback((currentTime) => {
    // Check if navigation is active using refs instead of state to avoid closure issues
    if (!navigationStartTimeRef.current) {
      return null; // No navigation in progress
    }
    
    const elapsed = currentTime - navigationStartTimeRef.current;
    const progress = Math.min(elapsed / navigationDurationRef.current, 1.0);
    
    // Use easeInOutCubic for smooth acceleration/deceleration
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const easedProgress = easeInOutCubic(progress);
    const currentT = navigationStartT.current + (navigationTargetT.current - navigationStartT.current) * easedProgress;
    
    // Update camera position along the path
    if (sceneRef.current) {
      sceneRef.current.cameraT = currentT;
      sceneRef.current.targetT = currentT;
    }
    
    // Update virtual scroll to match camera position
    const docHeight = document.body.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      virtualScrollY.current = currentT * docHeight;
      window.scrollTo(0, virtualScrollY.current);
    }
    
    // Update progress bar using new calculation
    const progressValue = calculateProgress(currentT);
    setProgress(progressValue);
    
    // Check if navigation is complete
    if (progress >= 1.0) {
      // Handle checkpoint animation if we navigated to a checkpoint
      if (navigationAnimationRef.current) {
        const { targetCheckpoint } = navigationAnimationRef.current;
        
        if (!targetCheckpoint.triggered) {
          targetCheckpoint.triggered = true;
          currentCheckpointRef.current = targetCheckpoint;
          pauseStartTimeRef.current = performance.now();
          scrollBlockedRef.current = true;
          
          // Clear navigation reference
          navigationAnimationRef.current = null;
          
          // Trigger checkpoint sequence
          try {
            playCheckpointSequence(targetCheckpoint);
          } catch (error) {
            console.error('Error triggering checkpoint sequence:', error);
            // Fallback: reset scroll blocking
            scrollBlockedRef.current = false;
          }
        } else {
          navigationAnimationRef.current = null;
        }
      }
      
      // End navigation state
      setIsNavigatingToCheckpoint(false);
      if (!currentCheckpointRef.current) {
        scrollBlockedRef.current = false; // Only unblock if no checkpoint animation
      }
      navigationStartTimeRef.current = null;
      
      return navigationTargetT.current; // Return final position
    }
    
    return currentT; // Return current position
  }, [calculateProgress]); // Add calculateProgress dependency

  // ──────────────────────────────────────────────────────────────────────────────
  // CHECKPOINT NAVIGATION FUNCTIONS - Defined after playCheckpointSequence
  // ──────────────────────────────────────────────────────────────────────────────
  
  const navigateToCheckpoint = useCallback((targetIndex, useAnimation = true) => {
    if (!checkpointsRef.current || targetIndex < 0 || targetIndex >= checkpointsRef.current.length) {
      return;
    }
    
    const targetCheckpoint = checkpointsRef.current[targetIndex];
    const targetT = targetCheckpoint.stopT;
    
    // Get current camera position
    const currentT = sceneRef.current ? sceneRef.current.cameraT : 0;
    
    // Update UI state immediately
    setCurrentCheckpointIndex(targetIndex);
    setIsBeforeFirstCheckpoint(false);
    
    // Check if navigating to final checkpoint
    const isFinalCheckpoint = targetIndex === checkpointsRef.current.length - 1;
    setIsAtFinalCheckpoint(isFinalCheckpoint);
    
    if (useAnimation && Math.abs(targetT - currentT) > 0.01) {
      // Use smooth navigation for chevron button clicks
      startSmoothNavigation(currentT, targetT);
      
      // Store checkpoint reference for navigation completion handling
      navigationAnimationRef.current = {
        targetCheckpoint,
        targetIndex
      };
      
    } else {
      // Instant navigation for scroll-based movement (existing behavior)
      if (sceneRef.current) {
        sceneRef.current.cameraT = targetT;
        sceneRef.current.targetT = targetT;
      }
      
      // Sync virtual scroll position
      const docHeight = document.body.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        virtualScrollY.current = targetT * docHeight;
        window.scrollTo(0, virtualScrollY.current);
      }
      
      // Update progress using new calculation
      const progressValue = calculateProgress(targetT);
      setProgress(progressValue);
      
      // Mark this checkpoint as triggered and trigger its animation
      if (!targetCheckpoint.triggered) {
        targetCheckpoint.triggered = true;
        currentCheckpointRef.current = targetCheckpoint;
        pauseStartTimeRef.current = performance.now();
        scrollBlockedRef.current = true;
        playCheckpointSequence(targetCheckpoint);
      }
    }
  }, [playCheckpointSequence, startSmoothNavigation, calculateProgress]);
  
  const navigateToPreviousCheckpoint = useCallback(() => {
    if (currentCheckpointIndex > 0) {
      navigateToCheckpoint(currentCheckpointIndex - 1, true); // Use animation
    } else if (currentCheckpointIndex === 0) {
      // Smoothly go back to initial "Scroll to learn more" state
      const currentT = sceneRef.current ? sceneRef.current.cameraT : 0;
      
      // Update UI state
      setCurrentCheckpointIndex(-1);
      setIsBeforeFirstCheckpoint(true);
      setIsAtFinalCheckpoint(false);
      
      // Use smooth navigation to beginning
      startSmoothNavigation(currentT, 0);
    }
  }, [currentCheckpointIndex, navigateToCheckpoint, startSmoothNavigation]);
  
  const navigateToNextCheckpoint = useCallback(() => {
    if (isBeforeFirstCheckpoint && checkpointsRef.current.length > 0) {
      // Navigate from initial state to first checkpoint with animation
      navigateToCheckpoint(0, true);
    } else if (currentCheckpointIndex < checkpointsRef.current.length - 1) {
      // Navigate to next checkpoint with animation
      navigateToCheckpoint(currentCheckpointIndex + 1, true);
    }
  }, [currentCheckpointIndex, isBeforeFirstCheckpoint, navigateToCheckpoint]);

  // ── JOURNEY COMPLETION FUNCTION ──
  const handleEnterPortfolio = useCallback(() => {
    // Set completion flags
    journeyCompletedRef.current = true;
    scrollBlockedRef.current = true;
    setIsCompleting(true);
    
    // Smooth transition to main page
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
  }, [onComplete]);

  // ── Document height setup with hidden scrollbars ──
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Set document height for virtual scrolling
      document.body.style.height = `${totalHeight}vh`;
      document.body.style.overflow = 'auto';
      
      // Hide scrollbars completely across all browsers
      document.body.style.scrollbarWidth = 'none'; // Firefox
      document.body.style.msOverflowStyle = 'none'; // IE/Edge
      
      // Webkit browsers (Chrome, Safari, newer Edge)
      const style = document.createElement('style');
      style.textContent = `
        /* Hide scrollbars globally */
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: transparent;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        /* Ensure no scrollbars on any element */
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        *::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
        
        /* Hide scrollbars on html and body */
        html, body {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overflow-x: hidden;
        }
        
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
      `;
      document.head.appendChild(style);
      
      // Store reference for cleanup
      document.body._scrollbarHideStyle = style;
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.body.style.scrollbarWidth = '';
        document.body.style.msOverflowStyle = '';
        
        // Remove the injected style
        if (document.body._scrollbarHideStyle) {
          document.head.removeChild(document.body._scrollbarHideStyle);
          delete document.body._scrollbarHideStyle;
        }
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
    if (isTransitioning || !preloadedResources) {
      return;
    }

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
    // Movement States:
    // • SMOOTH NAVIGATION: Override scroll with animated movement to target
    // • CHECKPOINT PAUSE: Block position updates, allow look-around only  
    // • NORMAL SCROLL: Convert scroll to camera movement with smooth interpolation
    // • JOURNEY COMPLETE: Allow normal movement during completion transition
    //
    // Checkpoint Detection:
    // • Detect when camera reaches checkpoint stopT position
    // • Trigger animations and pause camera movement
    // • Update UI navigation state and progress tracking
    // ──────────────────────────────────────────────────────────────────────────────
    function updateCameraAndObjects(deltaTime) {
      if (!isAlive) return;
      
      const sRef = sceneRef.current;
      if (!sRef) return;
      
      // ── SMOOTH NAVIGATION: Update navigation animation if active ──
      const navigationResult = updateSmoothNavigation(performance.now());
      if (navigationResult !== null) {
        // Navigation is active, skip normal scroll-based updates
        updateCameraPosition(sRef, deltaTime);
        return;
      }
      
      // ── COMPLETION TRANSITION: Handle completion overlay ──
      if (journeyCompletedRef.current) {
        // Allow normal camera movement during completion transition
        updateCameraPosition(sRef, deltaTime);
        return;
      }
      
      // ── CHECKPOINT PAUSE HANDLING ──
      let isPaused = false;
      if (currentCheckpointRef.current && pauseStartTimeRef.current) {
        const pauseElapsed = performance.now() - pauseStartTimeRef.current;
        
        if (pauseElapsed >= CHECKPOINT_PAUSE_DURATION) {
          // Resume after 2 seconds - SYNC virtual scroll with camera position
          // This prevents the scroll jump when resuming from checkpoint pause
          const docHeight = document.body.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            virtualScrollY.current = sRef.cameraT * docHeight;
            window.scrollTo(0, virtualScrollY.current);
          }
          
          currentCheckpointRef.current = null;
          pauseStartTimeRef.current = null;
          scrollBlockedRef.current = false;
          isPaused = false;
        } else {
          // Stay paused - block position updates but allow look-around
          isPaused = true;
        }
      }
      
      // ── POSITION UPDATES: Only when not paused and journey not completed ──
      if (!isPaused) {
        // ── CONVERT SCROLL TO CAMERA TARGET ──
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          sRef.targetT = Math.min(virtualScrollY.current / docHeight, 1);
        }
        
        // ── SMOOTH CAMERA INTERPOLATION ──
        // Frame-rate independent interpolation for consistent movement
        const lerpFactor = 1 - Math.pow(1 - CAMERA_LERP_FACTOR, deltaTime * 60);
        sRef.cameraT += (sRef.targetT - sRef.cameraT) * lerpFactor;
        sRef.cameraT = Math.min(Math.max(sRef.cameraT, 0), 0.999);
        
        // ── UPDATE PROGRESS BASED ON ACTUAL CAMERA POSITION ──
        const newProgress = calculateProgress(sRef.cameraT);
        setProgress(newProgress);
        
        // ── CHECKPOINT DETECTION ──
        if (!currentCheckpointRef.current) {
          for (let cp of checkpointsRef.current) {
            if (sRef.cameraT >= cp.stopT && !cp.triggered) {
              // Trigger checkpoint pause
              cp.triggered = true;
              currentCheckpointRef.current = cp;
              pauseStartTimeRef.current = performance.now();
              scrollBlockedRef.current = true;
              
              // Update checkpoint navigation state
              setCurrentCheckpointIndex(cp.index);
              setShowCheckpointNav(true);
              setIsBeforeFirstCheckpoint(false);
              
              // Check if this is the final checkpoint
              const isFinalCheckpoint = cp.index === checkpointsRef.current.length - 1;
              setIsAtFinalCheckpoint(isFinalCheckpoint);
              
              // Snap camera to exact checkpoint position and sync virtual scroll
              sRef.cameraT = cp.stopT;
              sRef.targetT = cp.stopT;
              
              // Update virtual scroll to match camera position immediately
              const docHeight = document.body.scrollHeight - window.innerHeight;
              if (docHeight > 0) {
                virtualScrollY.current = sRef.cameraT * docHeight;
                window.scrollTo(0, virtualScrollY.current);
              }
              
              // Start checkpoint animations (use instant navigation for scroll-based triggers)
              playCheckpointSequence(cp);
              break;
            }
          }
        }
      }
      
      // ── ALWAYS UPDATE PROGRESS FOR SMOOTH BAR FILLING ──
      // Update progress based on actual camera position for consistent visual feedback
      const currentProgress = calculateProgress(sRef.cameraT);
      
      if (currentProgress !== progress) {
        setProgress(currentProgress);
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
        // Check if renderer is still valid before rendering
        if (renderer.getContext() && !renderer.getContext().isContextLost()) {
          renderer.render(scene, camera);
          cssRenderer.render(cssScene, camera);
        } else {
          isAlive = false;
        }
      } catch (error) {
        console.error('Render error:', error);
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
      
      // Reset checkpoint navigation UI state
      setCurrentCheckpointIndex(-1);
      setShowCheckpointNav(true); // Keep showing for initial state
      setIsBeforeFirstCheckpoint(true);
      setIsAtFinalCheckpoint(false);
      
      // Reset smooth navigation state
      setIsNavigatingToCheckpoint(false);
      navigationStartTimeRef.current = null;
      navigationAnimationRef.current = null;

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
          console.warn('Error during DOM cleanup:', error);
        }
      }

      window.removeEventListener('resize', onWindowResize);
    };
  }, [isTransitioning, onComplete, isCompleting, preloadedResources, playCheckpointSequence, updateSmoothNavigation, calculateProgress]);

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Clean UI with Isolated Islands
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

      {/* Completion overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleting ? 1 : 0 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
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

      {/* THREE.js container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ───── ISOLATED PROGRESS ISLANDS ───── */}
      {!isTransitioning && (
        <>
          {/* Progress Bar Island - Top Center */}
          <motion.div
            className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-[100]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="text-white/60 text-sm font-mono">PROGRESS</div>
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="text-white text-sm font-mono min-w-[3rem] text-right">
                  {progress}%
                </div>
              </div>
            </div>
          </motion.div>

          {/* Combined Navigation & Status Island - Bottom Center */}
          <motion.div
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-[100]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
              <div className="flex flex-col gap-4">
                {/* Status Info Row */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="text-white/60 text-xs font-mono">CHECKPOINT</div>
                    <div className="text-white text-sm font-mono">
                      {isBeforeFirstCheckpoint ? 
                        "START" : 
                        `${currentCheckpointIndex + 1} / ${checkpointsRef.current.length}`
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-white/60 text-xs font-mono">STATUS</div>
                    <div className="text-white text-sm font-mono">
                      {isBeforeFirstCheckpoint ? 
                        "EXPLORING" : 
                        isAtFinalCheckpoint ? 
                          "COMPLETE" : 
                          "LEARNING"
                      }
                    </div>
                  </div>
                </div>

                {/* Navigation Row */}
                <div className="flex items-center gap-6">
                  {/* Previous Button */}
                  <button
                    onClick={navigateToPreviousCheckpoint}
                    disabled={isBeforeFirstCheckpoint}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                      isBeforeFirstCheckpoint
                        ? 'text-white/30 cursor-not-allowed bg-white/5' 
                        : 'text-white hover:text-white hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    <FaChevronLeft size={16} />
                  </button>

                  {/* Status Text */}
                  <div className="text-center min-w-[200px] max-w-[300px]">
                    {isBeforeFirstCheckpoint ? (
                      <div className="text-white/80 text-sm font-mono">
                        Scroll to begin journey
                      </div>
                    ) : (
                      <>
                        <div className="text-white/60 text-xs font-mono mb-1">
                          CURRENT
                        </div>
                        <div className="text-white text-sm font-mono truncate">
                          {checkpointsRef.current[currentCheckpointIndex]?.data?.title || 'Unknown'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Next Button or Complete Journey */}
                  {isAtFinalCheckpoint ? (
                    <button
                      onClick={handleEnterPortfolio}
                      className="flex items-center justify-center px-4 py-2 rounded-xl border border-white/40 text-white hover:border-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      <span className="text-sm font-mono">Press Enter to Continue</span>
                    </button>
                  ) : (
                    <button
                      onClick={navigateToNextCheckpoint}
                      disabled={!isBeforeFirstCheckpoint && currentCheckpointIndex >= checkpointsRef.current.length - 1}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                        (!isBeforeFirstCheckpoint && currentCheckpointIndex >= checkpointsRef.current.length - 1)
                          ? 'text-white/30 cursor-not-allowed bg-white/5' 
                          : 'text-white hover:text-white hover:bg-white/10 active:scale-95'
                      }`}
                    >
                      <FaChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ───── Interactive Event Zones ───── */}
      <ScrollCaptureZone containerRef={containerRef} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SCROLL CAPTURE COMPONENT - Native event listeners to bypass React's passive defaults
// ──────────────────────────────────────────────────────────────────────────────
function ScrollCaptureZone({ containerRef }) {
  const scrollCaptureRef = useRef(null);

  useEffect(() => {
    const el = scrollCaptureRef.current;
    if (!el) return;

    // ── WHEEL HANDLER: Non-passive to allow preventDefault() ──
    const onWheel = (e) => {
      // This preventDefault() works because { passive: false }
      e.preventDefault();
      
      // Forward wheel events to window for main scroll handling
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: e.deltaY,
        deltaX: e.deltaX,
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(wheelEvent);
    };

    // ── TOUCH HANDLERS: Non-passive for mobile scroll control ──
    const onTouchStart = (e) => {
      // Forward touch events to window for main touch handling
      const touchEvent = new TouchEvent('touchstart', {
        touches: e.touches,
        targetTouches: e.targetTouches,
        changedTouches: e.changedTouches,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(touchEvent);
    };

    const onTouchMove = (e) => {
      // This preventDefault() works because { passive: false }
      e.preventDefault();
      
      // Forward touch events to window for main touch handling
      const touchEvent = new TouchEvent('touchmove', {
        touches: e.touches,
        targetTouches: e.targetTouches,
        changedTouches: e.changedTouches,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(touchEvent);
    };

    // ── MOUSE HANDLERS: Can be passive since we don't need to prevent defaults ──
    const onMouseMove = (e) => {
      // Forward mouse move events to THREE.js container for look-around
      const container = containerRef.current;
      if (container) {
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true
        });
        container.dispatchEvent(mouseEvent);
      }
    };

    const onMouseLeave = (e) => {
      // Forward mouse leave events to THREE.js container
      const container = containerRef.current;
      if (container) {
        const mouseEvent = new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true
        });
        container.dispatchEvent(mouseEvent);
      }
    };

    // ── ATTACH NATIVE EVENT LISTENERS WITH EXPLICIT PASSIVE SETTINGS ──
    
    // Critical scroll events: { passive: false } to allow preventDefault()
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    
    // Non-critical events: can be passive for better performance
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave, { passive: true });

    // ── CLEANUP ──
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [containerRef]);

  return (
    <div 
      ref={scrollCaptureRef}
      className="absolute pointer-events-auto z-[50] inset-4"
      style={{ 
        background: 'transparent'
      }}
    />
  );
} 
