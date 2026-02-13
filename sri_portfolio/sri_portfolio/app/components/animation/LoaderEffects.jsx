import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';

/**
 * LoaderEffects
 * 
 * Visual effects and styling for loader UI elements
 * Responsibilities:
 * - Current time display with crypto decryption effect
 * - Portfolio branding section with depth shadows
 * - Welcome message animations
 * - All decorative visual effects and shadows
 * 
 * ~300 LOC
 */

// Client-only time component to prevent hydration mismatch
function ClientTime({ onAnimationComplete, showContent }) {
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));

    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
          onAnimationComplete={mounted ? onAnimationComplete : undefined}
        />
      </motion.div>
    </motion.div>
  );
}

function PortfolioBranding({ onPortfolioAnimationComplete, onSinceAnimationComplete, showContent }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -60, y: 30 }}
      animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -60, y: showContent ? 0 : 30 }}
      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
      className="absolute bottom-8 left-8 md:bottom-12 md:left-12 flex flex-col gap-3 group cursor-default"
      style={{
        filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5)) drop-shadow(0 3px 10px rgba(0,0,0,0.3))',
        transform: 'translateZ(0)'
      }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02, x: 5, y: -3 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="absolute -inset-3 rounded-lg opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
            transform: 'translateY(4px) translateX(3px)',
            filter: 'blur(8px)',
            zIndex: -1
          }}
        />
        
        <div className="relative z-10 px-3 py-2">
          <DecryptedText
            text={"sriujjwalreddy.com"}
            speed={35}
            maxIterations={15}
            sequential={true}
            revealDirection="start"
            className="major-mono-display-regular text-2xl md:text-4xl text-white font-bold tracking-widest"
            encryptedClassName="text-white/20"
            animateOn="view"
            onAnimationComplete={onPortfolioAnimationComplete}
          />
          
          <motion.div
            className="mt-2 mb-1 h-0.5 bg-gradient-to-r from-white/40 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
            }}
          />
          
          <DecryptedText
            text={"since 2022"}
            speed={35}
            maxIterations={10}
            sequential={true}
            revealDirection="start"
            className="major-mono-display-regular text-sm md:text-lg text-white/60 font-medium tracking-wider"
            encryptedClassName="text-white/15"
            animateOn="view"
            onAnimationComplete={onSinceAnimationComplete}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function WelcomeMessage({ onWelcome1Complete, onWelcome2Complete, showContent }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 60, y: -20 }}
      animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : 60, y: showContent ? 0 : -20 }}
      transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
      className="absolute right-4 top-8 md:right-12 md:top-1/2 md:-translate-y-1/2 text-right flex flex-col gap-3 group cursor-default"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
        transform: 'translateZ(0)'
      }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02, x: -5, y: -2 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="absolute -inset-3 rounded-lg opacity-60"
          style={{
            background: 'linear-gradient(225deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            transform: 'translateY(3px) translateX(-2px)',
            filter: 'blur(4px)',
            zIndex: -1
          }}
        />
        
        <div className="relative z-10 px-3 py-2">
          <DecryptedText
            text={"Welcome"}
            speed={35}
            maxIterations={12}
            sequential={true}
            revealDirection="end"
            className="major-mono-display-regular text-lg md:text-xl text-white font-medium tracking-widest"
            encryptedClassName="text-white/20"
            animateOn="view"
            onAnimationComplete={onWelcome1Complete}
          />
          
          <DecryptedText
            text={"To My Portfolio"}
            speed={35}
            maxIterations={12}
            sequential={true}
            revealDirection="end"
            className="major-mono-display-regular text-lg md:text-xl text-white/80 font-medium tracking-widest"
            encryptedClassName="text-white/20"
            animateOn="view"
            onAnimationComplete={onWelcome2Complete}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export { ClientTime, PortfolioBranding, WelcomeMessage };
