import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoaderBase, { SCENE_SCALE } from './LoaderBase';
import LoaderStages, { LOADER_STAGES } from './LoaderStages';
import LoaderEffects, { GLOW_EFFECTS } from './LoaderEffects';

/**
 * LoaderContainer Component
 * Wrapper and state management for all Loader sub-components
 * Extracted from Loader.jsx for better maintainability
 */

export default function LoaderContainer({
  isVisible = true,
  onAnimationComplete,
  onProgressChange,
  autoComplete = false,
  autoCompleteDuration = 3000,
}) {
  const [stage, setStage] = useState(LOADER_STAGES.IDLE);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sceneData, setSceneData] = useState(null);

  // Handle scene ready from LoaderBase
  const handleSceneReady = useCallback((data) => {
    setSceneData(data);
    setStage(LOADER_STAGES.LOADING);
    setIsLoading(true);
  }, []);

  // Handle stage changes
  const handleStageChange = useCallback((newStage) => {
    setStage(newStage);

    switch (newStage) {
      case LOADER_STAGES.LOADING:
        setIsLoading(true);
        setIsComplete(false);
        setIsError(false);
        break;
      case LOADER_STAGES.COMPLETE:
        setIsLoading(false);
        setIsComplete(true);
        setIsError(false);
        // Fade out after completion
        setTimeout(() => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 500);
        break;
      case LOADER_STAGES.ERROR:
        setIsLoading(false);
        setIsComplete(false);
        setIsError(true);
        break;
      case LOADER_STAGES.IDLE:
      default:
        setIsLoading(false);
        setIsComplete(false);
        setIsError(false);
        break;
    }
  }, [onAnimationComplete]);

  // Handle progress updates
  const handleProgressChange = useCallback((newProgress) => {
    setProgress(Math.min(newProgress, 1));
    onProgressChange?.(Math.min(newProgress, 1));
  }, [onProgressChange]);

  // Auto-complete loading
  useEffect(() => {
    if (!autoComplete || !isLoading) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / autoCompleteDuration, 1);
      handleProgressChange(newProgress);

      if (newProgress >= 1) {
        clearInterval(interval);
        setStage(LOADER_STAGES.COMPLETE);
        setIsLoading(false);
        setIsComplete(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoComplete, isLoading, autoCompleteDuration, handleProgressChange]);

  // Container animation variants
  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black z-50"
      variants={containerVariants}
      initial="initial"
      animate={isVisible ? 'animate' : 'exit'}
      transition={{ duration: 0.3 }}
    >
      {/* Main loader content */}
      <div className="relative w-full h-full max-w-4xl max-h-4xl">
        {/* THREE.js scene (LoaderBase) */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <LoaderBase
            onSceneReady={handleSceneReady}
            onAnimationComplete={handleSceneReady}
          />
        </div>

        {/* Visual effects overlay (LoaderEffects) */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <LoaderEffects
            isLoading={isLoading}
            isComplete={isComplete}
            isError={isError}
            glowIntensity={isLoading ? 'medium' : 'intense'}
            showParticles={isLoading || isComplete}
            showGradient={true}
          />
        </div>

        {/* Loader stages (progress indicator) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderStages
            stage={stage}
            progress={progress}
            onStageChange={handleStageChange}
            onProgressChange={handleProgressChange}
            showParticles={isLoading}
          />
        </div>

        {/* Loading text (optional) */}
        {isLoading && (
          <motion.div
            className="absolute bottom-8 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-white/60 text-sm font-mono tracking-wider">
              Initializing experience...
            </p>
          </motion.div>
        )}

        {/* Completion message */}
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-white text-lg font-light">
                Welcome to my portfolio
              </p>
              <p className="text-white/50 text-xs mt-2 font-mono">
                Redirecting in 2 seconds...
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Error state */}
        {isError && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-900/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <p className="text-red-400 text-base font-light">
                Loading failed
              </p>
              <button
                onClick={() => setStage(LOADER_STAGES.IDLE)}
                className="mt-4 px-4 py-2 text-white/70 hover:text-white border border-white/20 rounded text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
