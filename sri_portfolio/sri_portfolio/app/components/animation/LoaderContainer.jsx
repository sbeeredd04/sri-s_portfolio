import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RGBELoader } from 'three-stdlib';
import { createRoot } from 'react-dom/client';
import journeyData from '../../json/journey.json';
import LoaderBase from './LoaderBase';
import LoaderStages from './LoaderStages';
import { ClientTime, PortfolioBranding, WelcomeMessage } from './LoaderEffects';
import { ThreeJSResourceManager } from './ThreeJSResourceManager';

const Beams = dynamic(() => import('../background/Beams'), { ssr: false });

/**
 * LoaderContainer
 * 
 * Main loader component - wrapper with state management
 * Responsibilities:
 * - UI state orchestration and animations
 * - Progress tracking and smooth animations
 * - Resource manager lifecycle integration
 * - Three.js scene initialization coordination
 * - Text animation completion tracking
 * - START button visibility and timing logic
 * 
 * ~200 LOC
 */
export default function LoaderContainer({ onComplete, onResourcesReady }) {
  // ── UI State Management ──
  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [textAnimationsComplete, setTextAnimationsComplete] = useState({
    localTime: false,
    portfolio: false,
    since: false,
    welcome1: false,
    welcome2: false
  });
  
  const [uiLoadingComplete, setUILoadingComplete] = useState(false);
  const [uiLoadingSteps, setUILoadingSteps] = useState({
    background: false,
    beams: false,
    circularProgress: false,
    textElements: false
  });
  
  // ── Component References ──
  const containerRef = useRef(null);
  const resourceManagerRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const progressAnimationRef = useRef(null);

  // ── Smooth Progress Animation ──
  const MAX_PROGRESS_SPEED = 1.5;
  
  useEffect(() => {
    const animateProgress = () => {
      setProgress(currentProgress => {
        const difference = targetProgress - currentProgress;
        
        if (Math.abs(difference) < 0.05) {
          return targetProgress;
        }
        
        const step = Math.sign(difference) * Math.min(Math.abs(difference), MAX_PROGRESS_SPEED);
        const newProgress = currentProgress + step;
        const finalProgress = Math.min(newProgress, targetProgress);
        
        if (Math.abs(targetProgress - finalProgress) > 0.05) {
          progressAnimationRef.current = requestAnimationFrame(animateProgress);
        }
        
        return finalProgress;
      });
    };
    
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
    }
    
    progressAnimationRef.current = requestAnimationFrame(animateProgress);
    
    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
    };
  }, [targetProgress]);

  // Initialize UI animations
  useEffect(() => {
    setShowContent(true);
    setUILoadingSteps(prev => ({ ...prev, background: true }));
    
    setTimeout(() => {
      setUILoadingSteps(prev => ({ ...prev, beams: true }));
    }, 100);
    
    setTimeout(() => {
      setUILoadingSteps(prev => ({ ...prev, circularProgress: true }));
    }, 200);
  }, []);

  // Track text animation completion
  const handleTextAnimationComplete = useCallback((textKey) => {
    if (textAnimationsComplete[textKey]) {
      return;
    }
    
    setTextAnimationsComplete(prev => {
      if (prev[textKey]) {
        return prev;
      }
      
      return {
        ...prev,
        [textKey]: true
      };
    });
  }, [textAnimationsComplete]);

  // Check when all text animations are complete
  useEffect(() => {
    const allTextComplete = Object.values(textAnimationsComplete).every(Boolean);
    if (allTextComplete && !uiLoadingSteps.textElements) {
      setUILoadingSteps(prev => ({ ...prev, textElements: true }));
    }
  }, [textAnimationsComplete, uiLoadingSteps.textElements]);

  const allTextAnimationsComplete = Object.values(textAnimationsComplete).every(Boolean);

  // Check when all UI loading steps are complete
  useEffect(() => {
    const allUIStepsComplete = Object.values(uiLoadingSteps).every(Boolean);
    
    if (allUIStepsComplete && !uiLoadingComplete) {
      setUILoadingComplete(true);
    }
  }, [uiLoadingSteps, uiLoadingComplete]);

  // Show start button when progress is 100% and text animations are complete
  useEffect(() => {
    if (progress >= 100 && allTextAnimationsComplete) {
      setTimeout(() => {
        setShowStartButton(true);
      }, 800);
    }
  }, [progress, allTextAnimationsComplete]);

  // Resource initialization - only after UI is loaded
  useEffect(() => {
    if (!uiLoadingComplete || hasInitializedRef.current || !containerRef.current) {
      return;
    }
    
    let isMounted = true;
    
    const initializeResources = async () => {
      const resourceManager = new ThreeJSResourceManager();
      resourceManagerRef.current = resourceManager;
      
      resourceManager.setCallbacks(
        (progressValue) => {
          if (isMounted) {
            setTargetProgress(progressValue);
          }
        },
        () => {
          if (isMounted) {
            setTargetProgress(100);
          }
        },
        (error) => {
          console.error('Asset loading error:', error);
          if (isMounted) {
            setTargetProgress(95);
          }
        },
        (resources) => {
          if (isMounted && onResourcesReady) {
            onResourcesReady(resources);
          }
        }
      );
      
      try {
        await resourceManager.initializeResources(containerRef.current);
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize assets:', error);
      }
    };
    
    initializeResources();
    
    return () => {
      isMounted = false;
      if (resourceManagerRef.current) {
        resourceManagerRef.current.disposeThreeJSResources();
      }
    };
  }, [uiLoadingComplete, onResourcesReady]);

  const handleStartClick = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] min-h-screen min-w-full bg-black overflow-hidden major-mono-display-regular"
    >
      {/* Background animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Beams beamWidth={0.8} beamHeight={14} beamNumber={4} lightColor="#fff" speed={2} noiseIntensity={1.75} scale={0.18} rotation={200} />
      </div>

      {/* Main container */}
      <div className="relative w-full h-screen flex flex-col z-10 p-6 md:p-12">
        {/* Current time display */}
        <ClientTime 
          onAnimationComplete={() => handleTextAnimationComplete('localTime')}
          showContent={showContent}
        />

        {/* Portfolio branding */}
        <PortfolioBranding 
          onPortfolioAnimationComplete={() => handleTextAnimationComplete('portfolio')}
          onSinceAnimationComplete={() => handleTextAnimationComplete('since')}
          showContent={showContent}
        />

        {/* Welcome message */}
        <WelcomeMessage 
          onWelcome1Complete={() => handleTextAnimationComplete('welcome1')}
          onWelcome2Complete={() => handleTextAnimationComplete('welcome2')}
          showContent={showContent}
        />

        {/* Center circular progress */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            className="relative flex items-center justify-center group"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            {/* Liquid glass background */}
            {showStartButton && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transform: 'scale(0.9)'
                }}
                animate={{
                  background: showStartButton 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(255, 255, 255, 0.03)'
                }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Circular progress base */}
            <LoaderBase 
              progress={progress}
              showStartButton={showStartButton}
              containerRef={containerRef}
            />
            
            {/* Stages - center content */}
            <LoaderStages 
              progress={progress}
              showStartButton={showStartButton}
              onStartClick={handleStartClick}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
