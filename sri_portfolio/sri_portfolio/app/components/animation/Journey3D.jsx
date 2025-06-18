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
// FRAME DESIGN CONSTANTS - Customizable trapezoid frame parameters
// ──────────────────────────────────────────────────────────────────────────────

// ── FRAME THICKNESS & PADDING ──
const FRAME_THICKNESS = 1; // Main frame border thickness (viewBox units)
const FRAME_STROKE_WIDTH = 0.4; // SVG stroke width for borders
const FRAME_PADDING_TOP = 1.5; // Distance from top edge
const FRAME_PADDING_RIGHT = 1; // Distance from right edge  
const FRAME_PADDING_BOTTOM = 1.5; // Distance from bottom edge
const FRAME_PADDING_LEFT = 1; // Distance from left edge

// ── TRAPEZOID DIMENSIONS ──
const TRAPEZOID_TOP_LENGTH = 32; // Length of top trapezoid (viewBox units)
const TRAPEZOID_BOTTOM_LENGTH = 32; // Length of bottom trapezoid
const TRAPEZOID_LEFT_LENGTH = 16; // Length of left trapezoid
const TRAPEZOID_RIGHT_LENGTH = 16; // Length of right trapezoid

const TRAPEZOID_TOP_HEIGHT = 2; // Height/depth of top trapezoid
const TRAPEZOID_BOTTOM_HEIGHT = 6; // Height/depth of bottom trapezoid
const TRAPEZOID_LEFT_HEIGHT = 0.75; // Width/depth of left trapezoid
const TRAPEZOID_RIGHT_HEIGHT = 0.75; // Width/depth of right trapezoid

// ── TRAPEZOID SLANT/ANGLE ──
const TRAPEZOID_TOP_SLANT = 2; // How much the top trapezoid slants inward
const TRAPEZOID_BOTTOM_SLANT = 4; // How much the bottom trapezoid slants inward
const TRAPEZOID_LEFT_SLANT = 2; // How much the left trapezoid slants inward
const TRAPEZOID_RIGHT_SLANT = 2; // How much the right trapezoid slants inward

// ── EVENT CAPTURE ZONE ──
const EVENT_ZONE_PADDING = 8; // Padding for scroll/mouse event capture zone (CSS units)

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

  // ── TRAPEZOID COORDINATE CALCULATOR ──
  const calculateTrapezoidCoords = () => {
    // Calculate frame boundaries
    const frameLeft = FRAME_PADDING_LEFT;
    const frameRight = 100 - FRAME_PADDING_RIGHT;
    const frameTop = FRAME_PADDING_TOP;
    const frameBottom = 100 - FRAME_PADDING_BOTTOM;
    
    // Calculate trapezoid centers
    const topCenter = 50;
    const bottomCenter = 50;
    const leftCenter = 50;
    const rightCenter = 50;
    
    // Top trapezoid coordinates
    const topStart = topCenter - (TRAPEZOID_TOP_LENGTH / 2);
    const topEnd = topCenter + (TRAPEZOID_TOP_LENGTH / 2);
    const topSlantStart = topStart + TRAPEZOID_TOP_SLANT;
    const topSlantEnd = topEnd - TRAPEZOID_TOP_SLANT;
    
    // Bottom trapezoid coordinates  
    const bottomStart = bottomCenter - (TRAPEZOID_BOTTOM_LENGTH / 2);
    const bottomEnd = bottomCenter + (TRAPEZOID_BOTTOM_LENGTH / 2);
    const bottomSlantStart = bottomStart + TRAPEZOID_BOTTOM_SLANT;
    const bottomSlantEnd = bottomEnd - TRAPEZOID_BOTTOM_SLANT;
    
    // Left trapezoid coordinates
    const leftStart = leftCenter - (TRAPEZOID_LEFT_LENGTH / 2);
    const leftEnd = leftCenter + (TRAPEZOID_LEFT_LENGTH / 2);
    const leftSlantStart = leftStart + TRAPEZOID_LEFT_SLANT;
    const leftSlantEnd = leftEnd - TRAPEZOID_LEFT_SLANT;
    
    // Right trapezoid coordinates
    const rightStart = rightCenter - (TRAPEZOID_RIGHT_LENGTH / 2);
    const rightEnd = rightCenter + (TRAPEZOID_RIGHT_LENGTH / 2);
    const rightSlantStart = rightStart + TRAPEZOID_RIGHT_SLANT;
    const rightSlantEnd = rightEnd - TRAPEZOID_RIGHT_SLANT;
    
    return {
      frameLeft, frameRight, frameTop, frameBottom,
      // Top trapezoid
      topPath: `L ${topStart} ${frameTop} L ${topSlantStart} ${frameTop + TRAPEZOID_TOP_HEIGHT} L ${topSlantEnd} ${frameTop + TRAPEZOID_TOP_HEIGHT} L ${topEnd} ${frameTop}`,
      // Right trapezoid  
      rightPath: `L ${frameRight} ${rightStart} L ${frameRight - TRAPEZOID_RIGHT_HEIGHT} ${rightSlantStart} L ${frameRight - TRAPEZOID_RIGHT_HEIGHT} ${rightSlantEnd} L ${frameRight} ${rightEnd}`,
      // Bottom trapezoid
      bottomPath: `L ${bottomEnd} ${frameBottom} L ${bottomSlantEnd} ${frameBottom - TRAPEZOID_BOTTOM_HEIGHT} L ${bottomSlantStart} ${frameBottom - TRAPEZOID_BOTTOM_HEIGHT} L ${bottomStart} ${frameBottom}`,
      // Left trapezoid
      leftPath: `L ${frameLeft} ${leftEnd} L ${frameLeft + TRAPEZOID_LEFT_HEIGHT} ${leftSlantEnd} L ${frameLeft + TRAPEZOID_LEFT_HEIGHT} ${leftSlantStart} L ${frameLeft} ${leftStart}`
    };
  };
  
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
      console.log('🖱️ Wheel event detected:', e.deltaY);
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
      
      console.log('📏 Document height:', docHeight, 'Current virtual scroll:', virtualScrollY.current);
      
      // Apply max speed limiting for smooth control
      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 50, Math.min(MAX_SCROLL_SPEED * 50, raw));
      
      // Update virtual scroll position
      const newScrollY = Math.max(0, Math.min(docHeight, virtualScrollY.current + clampedDelta));
      virtualScrollY.current = newScrollY;
      window.scrollTo(0, virtualScrollY.current);
      
      console.log('🎯 Updated scroll position to:', virtualScrollY.current);
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
    console.log('🎧 Attaching scroll event listeners');
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      console.log('🧹 Removing scroll event listeners');
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
    console.log('🎬 Main animation effect running. isTransitioning:', isTransitioning, 'preloadedResources:', !!preloadedResources);
    if (isTransitioning || !preloadedResources) {
      console.log('🚫 Main animation effect skipped - transition or no resources');
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
      
            {/* ───── SVG Notched Frame Overlay - Configurable Trapezoid Design ───── */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        style={{ width: '100vw', height: '100vh' }}
      >
        {(() => {
          const coords = calculateTrapezoidCoords();
          const framePath = `
            M ${coords.frameLeft} ${coords.frameTop} 
            ${coords.topPath}
            L ${coords.frameRight} ${coords.frameTop} 
            ${coords.rightPath}
            L ${coords.frameRight} ${coords.frameBottom} 
            ${coords.bottomPath}
            L ${coords.frameLeft} ${coords.frameBottom} 
            ${coords.leftPath}
            Z
          `;
          
          return (
            <>
              {/* Liquid glass frame fill with trapezoid cutouts */}
              <defs>
                <mask id="frameMask">
                  <rect width="100" height="100" fill="white"/>
                  <path 
                    d={framePath}
                    fill="black"
                  />
                </mask>
              </defs>
              
              {/* Glass effect background */}
              <foreignObject 
                x="0" 
                y="0" 
                width="100%" 
                height="100%"
                mask="url(#frameMask)"
              >
                <div 
                  className="w-full h-full bg-black/60 backdrop-blur-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                />
              </foreignObject>
              
              {/* White border outline */}
              <path 
                d={framePath}
                fill="none"
                stroke="white"
                strokeWidth={FRAME_STROKE_WIDTH}
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Outer border */}
              <rect 
                x="0" 
                y="0" 
                width="100" 
                height="100" 
                fill="none" 
                stroke="white" 
                strokeWidth={FRAME_STROKE_WIDTH}
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Additional glass enhancement effects */}
              <defs>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.12)" />
                  <stop offset="50%" stopColor="rgba(0,0,0,0.1)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
                </linearGradient>
              </defs>
              
              {/* Subtle glass highlight */}
              <foreignObject 
                x="0" 
                y="0" 
                width="100%" 
                height="100%"
                mask="url(#frameMask)"
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.02) 100%)',
                    mixBlendMode: 'overlay'
                  }}
                />
              </foreignObject>
            </>
          );
        })()}
      </svg>
      
      {/* ───── Interactive Event Zones ───── */}
      {/* Scroll Event Capture Zone */}
      <div 
        className="absolute pointer-events-auto z-[50]"
        style={{ 
          background: 'transparent',
          top: `${EVENT_ZONE_PADDING}px`,
          right: `${EVENT_ZONE_PADDING}px`,
          bottom: `${EVENT_ZONE_PADDING}px`,
          left: `${EVENT_ZONE_PADDING}px`
        }}
        onWheel={(e) => {
          // Forward wheel events to window for scroll handling
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: e.deltaY,
            deltaX: e.deltaX,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(wheelEvent);
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          // Forward touch events to window
          const touchEvent = new TouchEvent('touchstart', {
            touches: e.touches,
            targetTouches: e.targetTouches,
            changedTouches: e.changedTouches,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(touchEvent);
        }}
        onTouchMove={(e) => {
          // Forward touch events to window
          const touchEvent = new TouchEvent('touchmove', {
            touches: e.touches,
            targetTouches: e.targetTouches,
            changedTouches: e.changedTouches,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(touchEvent);
          e.preventDefault();
        }}
        onMouseMove={(e) => {
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
        }}
        onMouseLeave={(e) => {
          // Forward mouse leave events to THREE.js container
          const container = containerRef.current;
          if (container) {
            const mouseEvent = new MouseEvent('mouseleave', {
              bubbles: true,
              cancelable: true
            });
            container.dispatchEvent(mouseEvent);
          }
        }}
      />
      {/* ──────────────────────────────────────── */}
    </div>
  );
} 