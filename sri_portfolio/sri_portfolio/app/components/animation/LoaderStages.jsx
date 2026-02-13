import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * LoaderStages Component
 * Animation stages and transitions
 * Extracted from Loader.jsx for better maintainability
 */

// Animation stage definitions
export const LOADER_STAGES = {
  IDLE: 'idle',
  LOADING: 'loading',
  COMPLETE: 'complete',
  ERROR: 'error',
};

// Stage configurations with timing and visual parameters
export const STAGE_CONFIGS = {
  [LOADER_STAGES.IDLE]: {
    duration: 0.5,
    opacity: 0.8,
    scale: 1,
    rotation: 0,
  },
  [LOADER_STAGES.LOADING]: {
    duration: 2,
    opacity: 1,
    scale: 1.2,
    rotation: 360,
  },
  [LOADER_STAGES.COMPLETE]: {
    duration: 0.8,
    opacity: 1,
    scale: 0.95,
    rotation: 720,
  },
  [LOADER_STAGES.ERROR]: {
    duration: 0.5,
    opacity: 0.6,
    scale: 0.9,
    rotation: 0,
  },
};

// Progress ring animation variants
export const PROGRESS_VARIANTS = {
  initial: { pathLength: 0, opacity: 0.3 },
  animate: (progress) => ({
    pathLength: progress,
    opacity: 0.9,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  }),
  exit: { pathLength: 1, opacity: 0 },
};

// Particle animation variants
export const PARTICLE_VARIANTS = {
  initial: { scale: 0, opacity: 0 },
  animate: (delay) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
  exit: { scale: 0, opacity: 0 },
};

/**
 * LoaderStages Component
 * Manages animation stage transitions and visual feedback
 */
export default function LoaderStages({
  stage = LOADER_STAGES.IDLE,
  progress = 0,
  onStageChange,
  onProgressChange,
  showParticles = true,
}) {
  const [currentStage, setCurrentStage] = useState(stage);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [particles, setParticles] = useState([]);

  // Update stage
  useEffect(() => {
    if (stage !== currentStage) {
      setCurrentStage(stage);
      onStageChange?.(stage);
    }
  }, [stage, currentStage, onStageChange]);

  // Update progress
  useEffect(() => {
    setCurrentProgress(progress);
    onProgressChange?.(progress);
  }, [progress, onProgressChange]);

  // Generate particles for loading stage
  useEffect(() => {
    if (currentStage === LOADER_STAGES.LOADING && showParticles) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * Math.PI * 2,
        delay: i * 0.05,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [currentStage, showParticles]);

  const config = STAGE_CONFIGS[currentStage];

  return (
    <motion.div
      className="relative w-32 h-32 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main loader circle */}
      <motion.svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        animate={{
          rotate: config.rotation,
          scale: config.scale,
          opacity: config.opacity,
        }}
        transition={{
          duration: config.duration,
          repeat: currentStage === LOADER_STAGES.LOADING ? Infinity : 0,
          ease: 'linear',
        }}
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-white/10"
        />

        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="282.7"
          strokeDashoffset={282.7 * (1 - currentProgress)}
          className="text-blue-400"
          custom={currentProgress}
          variants={PROGRESS_VARIANTS}
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="currentColor" className="text-white" />
      </motion.svg>

      {/* Animated particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-blue-400"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: '-2px',
            marginTop: '-2px',
          }}
          custom={particle.delay}
          variants={PARTICLE_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          animate={{
            x: Math.cos(particle.angle) * 50,
            y: Math.sin(particle.angle) * 50,
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Progress text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: currentStage === LOADER_STAGES.LOADING ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-xs font-mono text-white/60">
          {Math.round(currentProgress * 100)}%
        </span>
      </motion.div>
    </motion.div>
  );
}
