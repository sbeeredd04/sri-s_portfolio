import { useEffect, useRef } from 'react';

/**
 * Journey3DControls
 * 
 * Camera movement and interaction logic
 * Responsibilities:
 * - Virtual scroll position management
 * - Smooth scroll controls with speed limiting
 * - Keyboard navigation handling
 * - Touch/mobile gesture support
 * - Checkpoint navigation coordination
 * - Mouse look-around controls
 * 
 * ~300 LOC
 */
export default function Journey3DControls({
  sceneRef,
  onScrollChange,
  onCheckpointReached,
  journeyLength,
  roadCurve,
  frenetFrames,
  checkpoints
}) {
  const virtualScrollYRef = useRef(0);
  const scrollBlockedRef = useRef(false);
  const MAX_SCROLL_SPEED = 3.0;

  // Mouse look-around tracking
  const mouseLookRef = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    yaw: 0,
    pitch: 0
  });

  useEffect(() => {
    const getDocHeight = () => Math.max(0, document.body.scrollHeight - window.innerHeight);

    // ── WHEEL HANDLER ──
    const handleWheel = (e) => {
      e.preventDefault();

      if (scrollBlockedRef.current) {
        return;
      }

      if (checkpoints.length > 0) {
        const lastCheckpoint = checkpoints[checkpoints.length - 1];
        if (lastCheckpoint && e.deltaY > 0) {
          return; // Block forward scroll at end
        }
      }

      const raw = e.deltaY;
      const docHeight = getDocHeight();

      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 50, Math.min(MAX_SCROLL_SPEED * 50, raw));

      virtualScrollYRef.current = Math.max(0, Math.min(docHeight, virtualScrollYRef.current + clampedDelta));
      window.scrollTo(0, virtualScrollYRef.current);

      // Calculate T value from scroll position
      const scrollRatio = docHeight > 0 ? virtualScrollYRef.current / docHeight : 0;
      const newT = Math.min(scrollRatio, 1.0);

      if (onScrollChange) {
        onScrollChange(newT);
      }

      // Check for checkpoint proximity
      if (onCheckpointReached && checkpoints) {
        checkpoints.forEach((cp, index) => {
          const proximityThreshold = 0.02;
          if (Math.abs(newT - cp.stopT) < proximityThreshold && !cp.triggered) {
            onCheckpointReached(cp, index);
            cp.triggered = true;
          }
        });
      }
    };

    // ── KEYBOARD HANDLER ──
    const handleKeyDown = (e) => {
      if (scrollBlockedRef.current) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }

      if (checkpoints.length > 0) {
        const lastCheckpoint = checkpoints[checkpoints.length - 1];
        if (lastCheckpoint && ['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
          e.preventDefault();
          return;
        }
      }

      // Scroll with arrow keys
      if (['ArrowUp', 'ArrowDown'].includes(e.code)) {
        const delta = e.code === 'ArrowUp' ? -50 : 50;
        const docHeight = getDocHeight();
        virtualScrollYRef.current = Math.max(0, Math.min(docHeight, virtualScrollYRef.current + delta));
        window.scrollTo(0, virtualScrollYRef.current);

        const scrollRatio = docHeight > 0 ? virtualScrollYRef.current / docHeight : 0;
        if (onScrollChange) {
          onScrollChange(scrollRatio);
        }
      }
    };

    // ── TOUCH HANDLERS ──
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

      if (checkpoints.length > 0) {
        const lastCheckpoint = checkpoints[checkpoints.length - 1];
        if (lastCheckpoint && deltaY > 0) {
          e.preventDefault();
          return;
        }
      }

      const docHeight = getDocHeight();
      const clampedDelta = Math.max(-MAX_SCROLL_SPEED * 25, Math.min(MAX_SCROLL_SPEED * 25, deltaY * 2));

      virtualScrollYRef.current = Math.max(0, Math.min(docHeight, virtualScrollYRef.current + clampedDelta));
      window.scrollTo(0, virtualScrollYRef.current);

      const scrollRatio = docHeight > 0 ? virtualScrollYRef.current / docHeight : 0;
      if (onScrollChange) {
        onScrollChange(scrollRatio);
      }

      e.preventDefault();
    };

    // ── MOUSE LOOK-AROUND ──
    const handleMouseMove = (e) => {
      if (!sceneRef?.current || !mouseLookRef.current.isActive) {
        return;
      }

      const deltaX = e.clientX - mouseLookRef.current.startX;
      const deltaY = e.clientY - mouseLookRef.current.startY;

      // Convert pixel movement to radians (smaller sensitivity)
      mouseLookRef.current.yaw = (deltaX / window.innerWidth) * Math.PI * 0.3;
      mouseLookRef.current.pitch = (deltaY / window.innerHeight) * Math.PI * 0.2;

      // Clamp pitch
      mouseLookRef.current.pitch = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, mouseLookRef.current.pitch));

      // Apply to scene
      if (sceneRef.current) {
        sceneRef.current.lookAroundYaw = mouseLookRef.current.yaw;
        sceneRef.current.lookAroundPitch = mouseLookRef.current.pitch;
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 2) { // Right click
        mouseLookRef.current.isActive = true;
        mouseLookRef.current.startX = e.clientX;
        mouseLookRef.current.startY = e.clientY;
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        mouseLookRef.current.isActive = false;
      }
    };

    // Attach event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Disable context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [onScrollChange, onCheckpointReached, checkpoints, sceneRef]);

  // Expose control functions
  return {
    setScrollBlocked: (blocked) => {
      scrollBlockedRef.current = blocked;
    },
    getScrollPosition: () => virtualScrollYRef.current,
    setScrollPosition: (position) => {
      virtualScrollYRef.current = position;
      window.scrollTo(0, position);
    }
  };
}
