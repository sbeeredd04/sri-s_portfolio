'use client';

import { useState, useEffect } from 'react';
import DecryptedText from './animation/DecryptedText';
import { motion } from 'framer-motion';

/**
 * ClientOnlyTime Component
 * 
 * Prevents hydration mismatch by only rendering time on client-side.
 * Uses useEffect to ensure time is only displayed after initial mount.
 */
export function ClientOnlyTime({ onAnimationComplete, showContent }) {
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only update time after component mounts on client
    setIsMounted(true);
    setCurrentTime(new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));

    // Optional: Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -50, y: -20 }}
        animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -50, y: showContent ? 0 : -20 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="absolute top-8 left-8 md:top-12 md:left-12 group cursor-default"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
          transform: 'translateZ(0)'
        }}
      >
        <div className="major-mono-display-regular text-sm md:text-base text-white/70 font-medium tracking-wider relative z-10 px-2 py-1">
          Local time: --:--:--
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50, y: -20 }}
      animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -50, y: showContent ? 0 : -20 }}
      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      className="absolute top-8 left-8 md:top-12 md:left-12 group cursor-default"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
        transform: 'translateZ(0)'
      }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.3 }}
      >
        {/* Three.js style shadow */}
        <div
          className="absolute -inset-2 rounded-lg opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            transform: 'translateY(3px) translateX(2px)',
            filter: 'blur(4px)',
            zIndex: -1
          }}
        />
        
        <DecryptedText
          text={`Local time: ${currentTime}`}
          speed={35}
          maxIterations={12}
          sequential={true}
          revealDirection="start"
          className="major-mono-display-regular text-sm md:text-base text-white/70 font-medium tracking-wider relative z-10 px-2 py-1"
          encryptedClassName="text-white/20"
          animateOn="view"
          onAnimationComplete={onAnimationComplete}
        />
      </motion.div>
    </motion.div>
  );
}
