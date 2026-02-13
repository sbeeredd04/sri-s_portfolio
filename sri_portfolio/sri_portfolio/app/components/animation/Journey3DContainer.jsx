import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import journeyData from '../../json/journey.json';
import Journey3DScene from './Journey3DScene';
import Journey3DControls from './Journey3DControls';
import Journey3DGeometry from './Journey3DGeometry';

/**
 * Journey3DContainer
 * 
 * Main container component for 3D journey experience
 * Responsibilities:
 * - State management and orchestration
 * - Checkpoint navigation UI
 * - Progress tracking
 * - Component coordination
 * - Completion handling
 * 
 * ~150 LOC
 */
export default function Journey3DContainer({ onComplete, preloadedResources }) {
  // ── UI State ──
  const [progress, setProgress] = useState(0);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCheckpointNav, setShowCheckpointNav] = useState(true);
  const [cameraT, setCameraT] = useState(0);
  const [targetT, setTargetT] = useState(0);

  // ── Component References ──
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const journeyLength = journeyData.length;

  // Initialize camera
  useEffect(() => {
    setIsTransitioning(false);
  }, []);

  // Handle scroll changes
  const handleScrollChange = useCallback((newT) => {
    setTargetT(newT);
    setCameraT(newT);

    // Update progress bar
    let progressValue = 0;
    if (preloadedResources?.checkpoints) {
      const lastCheckpoint = preloadedResources.checkpoints[preloadedResources.checkpoints.length - 1];
      if (lastCheckpoint) {
        const progressRatio = Math.min(newT / lastCheckpoint.stopT, 1.0);
        progressValue = Math.round(progressRatio * 100);
      }
    }
    setProgress(progressValue);
  }, [preloadedResources]);

  // Handle checkpoint reached
  const handleCheckpointReached = useCallback((checkpoint, index) => {
    setCurrentCheckpointIndex(index);
    
    // Pause at checkpoint
    if (controlsRef.current) {
      controlsRef.current.setScrollBlocked(true);
      
      setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.setScrollBlocked(false);
        }
      }, 2000);
    }

    // Check if this is the final checkpoint
    if (preloadedResources?.checkpoints) {
      const lastCheckpointIndex = preloadedResources.checkpoints.length - 1;
      if (index === lastCheckpointIndex && Math.abs(cameraT - checkpoint.stopT) < 0.02) {
        // Trigger completion sequence
        setIsCompleting(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 3000);
      }
    }
  }, [preloadedResources, cameraT, onComplete]);

  // Navigation to checkpoint
  const handleNavigateToCheckpoint = useCallback((checkpointIndex) => {
    if (!preloadedResources?.checkpoints) return;

    const checkpoint = preloadedResources.checkpoints[checkpointIndex];
    if (!checkpoint) return;

    const distance = Math.abs(targetT - checkpoint.stopT);
    const duration = Math.max(1000, Math.min(4000, distance * 3000));

    // Smooth navigation animation
    const startT = targetT;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Easing function
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const newT = startT + (checkpoint.stopT - startT) * easeProgress;
      setTargetT(newT);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetT, preloadedResources]);

  // Navigation buttons
  const handlePrevCheckpoint = useCallback(() => {
    if (currentCheckpointIndex > 0) {
      handleNavigateToCheckpoint(currentCheckpointIndex - 1);
    }
  }, [currentCheckpointIndex, handleNavigateToCheckpoint]);

  const handleNextCheckpoint = useCallback(() => {
    if (preloadedResources?.checkpoints && currentCheckpointIndex < preloadedResources.checkpoints.length - 1) {
      handleNavigateToCheckpoint(currentCheckpointIndex + 1);
    }
  }, [currentCheckpointIndex, preloadedResources, handleNavigateToCheckpoint]);

  if (!preloadedResources) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading experience...</div>
      </div>
    );
  }

  const { roadCurve, frenetFrames } = preloadedResources;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100] w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 3D Scene Rendering */}
      <Journey3DScene
        preloadedResources={preloadedResources}
        roadCurve={roadCurve}
        frenetFrames={frenetFrames}
        cameraT={cameraT}
        targetT={targetT}
        containerRef={containerRef}
        sceneRef={sceneRef}
      />

      {/* Controls Management */}
      <Journey3DControls
        ref={controlsRef}
        sceneRef={sceneRef}
        onScrollChange={handleScrollChange}
        onCheckpointReached={handleCheckpointReached}
        journeyLength={journeyLength}
        roadCurve={roadCurve}
        frenetFrames={frenetFrames}
        checkpoints={preloadedResources.checkpoints}
      />

      {/* Geometry and Checkpoint Management */}
      <Journey3DGeometry
        preloadedResources={preloadedResources}
        sceneRef={sceneRef}
        currentProgress={progress}
        onCheckpointTriggered={handleCheckpointReached}
      />

      {/* Progress Bar */}
      {showCheckpointNav && !isCompleting && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevCheckpoint}
              disabled={currentCheckpointIndex <= 0}
              className="p-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft className="text-white" size={20} />
            </button>

            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <button
              onClick={handleNextCheckpoint}
              disabled={!preloadedResources?.checkpoints || currentCheckpointIndex >= preloadedResources.checkpoints.length - 1}
              className="p-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronRight className="text-white" size={20} />
            </button>
          </div>

          <div className="text-center mt-4 text-white/60 text-sm">
            {currentCheckpointIndex >= 0 && preloadedResources?.checkpoints && (
              <>
                {currentCheckpointIndex + 1} of {preloadedResources.checkpoints.length} checkpoints
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Exit Button */}
      <motion.button
        onClick={onComplete}
        className="fixed top-8 right-8 z-50 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Exit Journey
      </motion.button>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isCompleting && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-white mb-4">Journey Complete!</h1>
              <p className="text-white/60 mb-8">Thank you for exploring my portfolio</p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
