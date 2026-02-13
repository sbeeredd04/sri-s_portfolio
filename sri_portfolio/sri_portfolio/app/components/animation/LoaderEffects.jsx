import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * LoaderEffects Component
 * Visual effects and styling
 * Extracted from Loader.jsx for better maintainability
 */

// Glow effect configurations
export const GLOW_EFFECTS = {
  subtle: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
    filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.1))',
  },
  medium: {
    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))',
  },
  intense: {
    boxShadow: '0 0 60px rgba(59, 130, 246, 0.6)',
    filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))',
  },
};

// Particle system for effects
export class ParticleSystem {
  constructor(particleCount = 50) {
    this.particleCount = particleCount;
    this.particles = this.generateParticles();
  }

  generateParticles() {
    return Array.from({ length: this.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 0.5,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }

  updateParticles() {
    this.particles = this.generateParticles();
  }
}

// Gradient configurations
export const GRADIENT_CONFIGS = {
  loading: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
  complete: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
  error: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)',
};

// Animation variants for effects
export const EFFECT_VARIANTS = {
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  glow: {
    boxShadow: [
      '0 0 20px rgba(59, 130, 246, 0.2)',
      '0 0 40px rgba(59, 130, 246, 0.4)',
      '0 0 20px rgba(59, 130, 246, 0.2)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  shimmer: {
    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * LoaderEffects Component
 * Renders visual effects (glow, particles, gradients)
 */
export default function LoaderEffects({
  isLoading = true,
  isComplete = false,
  isError = false,
  glowIntensity = 'medium',
  showParticles = true,
  showGradient = true,
}) {
  const [particleSystem] = useState(() => new ParticleSystem(30));
  const [glowEffect, setGlowEffect] = useState(GLOW_EFFECTS.subtle);

  // Update glow effect based on intensity
  useEffect(() => {
    if (isLoading) {
      setGlowEffect(GLOW_EFFECTS[glowIntensity]);
    } else if (isComplete) {
      setGlowEffect(GLOW_EFFECTS.intense);
    } else if (isError) {
      setGlowEffect(GLOW_EFFECTS.subtle);
    }
  }, [isLoading, isComplete, isError, glowIntensity]);

  // Determine gradient
  const gradientConfig = isComplete
    ? GRADIENT_CONFIGS.complete
    : isError
    ? GRADIENT_CONFIGS.error
    : GRADIENT_CONFIGS.loading;

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient */}
      {showGradient && (
        <div
          className="absolute inset-0"
          style={{
            background: gradientConfig,
            transition: 'background 0.3s ease',
          }}
        />
      )}

      {/* Glow effect container */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        variants={EFFECT_VARIANTS.glow}
        animate="glow"
        style={glowEffect}
      >
        <div className="w-32 h-32 rounded-full" />
      </motion.div>

      {/* Particle effects */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden">
          {particleSystem.particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-blue-400/50"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [-10, 20, -10],
                opacity: [particle.opacity, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          backgroundSize: '200% 100%',
        }}
        variants={EFFECT_VARIANTS.shimmer}
        animate="shimmer"
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </motion.div>
  );
}
