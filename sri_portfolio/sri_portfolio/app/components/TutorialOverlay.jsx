"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconArrowRight, IconX } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { cn } from "../lib/utils"; // cn is not used in this version

// Desktop tutorial steps
const desktopTutorialSteps = [
  {
    elementId: "floating-dock-tutorial-target",
    title: "Quick Navigation",
    text: "Use this dock to easily navigate to different sections of the portfolio. It's on the left side of your screen.",
    tooltipAttachment: "right", // e.g., tooltip to the right of the dock
    tooltipAlign: "center",    // e.g., centered vertically along the right edge
  },
  {
    elementId: "sound-toggle-tutorial-target",
    title: "Sound Effects",
    text: "Toggle sound effects on/off. When enabled, you'll hear a satisfying click sound when interacting with buttons throughout the site.",
    tooltipAttachment: "bottom", 
    tooltipAlign: "center",
  },
  {
    elementId: "spotify-player-tutorial-target",
    title: "Music Player",
    text: "Click here to show/hide the Spotify-themed music player. You can play, pause, skip tracks, adjust volume, and toggle shuffle and repeat modes.",
    tooltipAttachment: "bottom",
    tooltipAlign: "center",
  },
  {
    elementId: "theme-button-tutorial-target",
    title: "Change Theme",
    text: "Personalize your viewing experience! Click here to change the background theme.",
    tooltipAttachment: "bottom", // e.g., tooltip below the theme button
    tooltipAlign: "end",      // e.g., aligned to the right edge of the button
  },
  {
    elementId: "tab-switcher-tutorial-target",
    title: "Section Tabs",
    text: "Switch between different views within each section. Each section has its own set of tabs that let you explore different content.",
    tooltipAttachment: "top",
    tooltipAlign: "start",
  },
  {
    elementId: "social-links-tutorial-target",
    title: "Connect With Me",
    text: "Find me on social media, send an email, or download my resume. These links provide easy access to my professional profiles and contact information.",
    tooltipAttachment: "top",
    tooltipAlign: "end",
  },
];

// Mobile-specific tutorial steps - some elements may be different or in different positions
const mobileTutorialSteps = [
  {
    elementId: "floating-dock-tutorial-target",
    title: "Navigation Menu",
    text: "Tap this floating button to access the main navigation menu. You can also drag it to reposition it on your screen.",
    tooltipAttachment: "top", 
    tooltipAlign: "center",
  },
  {
    elementId: "sound-toggle-tutorial-target",
    title: "Sound Effects",
    text: "Toggle sound effects on/off for interaction sounds throughout the site.",
    tooltipAttachment: "bottom", 
    tooltipAlign: "center",
  },
  {
    elementId: "spotify-player-tutorial-target",
    title: "Music Player",
    text: "Access the Spotify-themed music player to enhance your browsing experience.",
    tooltipAttachment: "bottom",
    tooltipAlign: "center",
  },
  {
    elementId: "theme-button-tutorial-target",
    title: "Change Theme",
    text: "Change the background theme to customize your viewing experience.",
    tooltipAttachment: "bottom",
    tooltipAlign: "center",
  },
  {
    elementId: "tab-switcher-tutorial-target",
    title: "Section Tabs",
    text: "Navigate between different views within each section using these tabs.",
    tooltipAttachment: "top",
    tooltipAlign: "center",
  },
  {
    elementId: "mobile-connections-tutorial-target",
    title: "Connect With Me",
    text: "Quick access to my GitHub, Instagram, LinkedIn, Email, and Spotify profiles. You can also download my resume from here.",
    tooltipAttachment: "bottom",
    tooltipAlign: "center",
  }
  // Social links may not be visible in mobile view, so we omit that step
];

const TOOLTIP_WIDTH = 300; // Approximate width of the tooltip
const TOOLTIP_HEIGHT = 150; // Approximate height of the tooltip
const TOOLTIP_OFFSET = 20; // Increased offset from the element
const BOUNDARY_PADDING = 10; // Padding from viewport edges
const MAX_ATTEMPTS = 20; // Maximum number of attempts to find a target
const RETRY_INTERVAL = 200; // Milliseconds between retries
const SPOTLIGHT_PADDING = 12; // Padding around the spotlight element

// Mobile viewport detection - smaller tooltip for mobile
const MOBILE_WIDTH_THRESHOLD = 768;
const MOBILE_TOOLTIP_WIDTH = 250;
const MOBILE_TOOLTIP_HEIGHT = 180; // Slightly taller for mobile to accommodate text

export const TutorialOverlay = ({ onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, visibility: 'visible' });
  const [isMobile, setIsMobile] = useState(false);
  const findAttemptsRef = useRef(0);
  const findIntervalRef = useRef(null);
  
  // Choose tutorial steps based on viewport size
  const tutorialSteps = isMobile ? mobileTutorialSteps : desktopTutorialSteps;
  const currentStep = tutorialSteps[currentStepIndex];

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_WIDTH_THRESHOLD);
    };
    
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const findTargetElement = useCallback(() => {
    if (!currentStep || !document) return null;
    return document.getElementById(currentStep.elementId);
  }, [currentStep]);

  const calculatePositions = useCallback(() => {
    if (!currentStep) return;

    const targetElement = findTargetElement();

    if (targetElement) {
      // Clear any existing interval as we found the element
      if (findIntervalRef.current) {
        clearInterval(findIntervalRef.current);
        findIntervalRef.current = null;
        findAttemptsRef.current = 0;
      }

      const rect = targetElement.getBoundingClientRect();
      
      // Only update if the element is actually visible
      if (rect.width > 0 && rect.height > 0) {
        console.log(`Found target: ${currentStep.elementId} at position:`, rect);
        
        setHighlightBox({
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          elementWidth: rect.width,
          elementHeight: rect.height,
          elementTop: rect.top,
          elementLeft: rect.left,
        });

        // Determine tooltip dimensions based on viewport
        const tooltipWidth = isMobile ? MOBILE_TOOLTIP_WIDTH : TOOLTIP_WIDTH;
        const tooltipHeight = isMobile ? MOBILE_TOOLTIP_HEIGHT : TOOLTIP_HEIGHT;
        
        let topPos = 0;
        let leftPos = 0;

        // Calculate tooltip position based on attachment and alignment
        // Attachment: which side of the target element the tooltip attaches to
        // Alignment: how the tooltip aligns along that side

        // For mobile, we need special handling for the floating dock button which can be anywhere
        if (isMobile && currentStep.elementId === 'floating-dock-tutorial-target') {
          // Mobile floating dock is likely at the bottom of the screen
          // Try to position tooltip above it
          topPos = rect.top - tooltipHeight - TOOLTIP_OFFSET;
          leftPos = window.innerWidth / 2 - tooltipWidth / 2; // Center horizontally
          
          // If too high, place it below instead
          if (topPos < BOUNDARY_PADDING) {
            topPos = rect.bottom + TOOLTIP_OFFSET;
          }
        } 
        // Special handling for mobile connections bar at the top of the screen
        else if (isMobile && currentStep.elementId === 'mobile-connections-tutorial-target') {
          // Mobile connections is fixed at the top of the screen
          // Position tooltip below it
          topPos = rect.bottom + TOOLTIP_OFFSET;
          leftPos = window.innerWidth / 2 - tooltipWidth / 2; // Center horizontally
          
          // If too low (unlikely), place it above
          if (topPos + tooltipHeight > window.innerHeight - BOUNDARY_PADDING) {
            topPos = rect.top - tooltipHeight - TOOLTIP_OFFSET;
          }
        }
        else {
          // Standard positioning for other elements
          // Horizontal positioning
          if (currentStep.tooltipAttachment === 'left') {
            leftPos = rect.left - tooltipWidth - TOOLTIP_OFFSET;
          } else if (currentStep.tooltipAttachment === 'right') {
            leftPos = rect.right + TOOLTIP_OFFSET;
          } else { // top or bottom attachment
            if (currentStep.tooltipAlign === 'start') {
              leftPos = rect.left;
            } else if (currentStep.tooltipAlign === 'center') {
              leftPos = rect.left + rect.width / 2 - tooltipWidth / 2;
            } else { // end
              leftPos = rect.right - tooltipWidth;
            }
          }

          // Vertical positioning
          if (currentStep.tooltipAttachment === 'top') {
            topPos = rect.top - tooltipHeight - TOOLTIP_OFFSET;
          } else if (currentStep.tooltipAttachment === 'bottom') {
            topPos = rect.bottom + TOOLTIP_OFFSET;
          } else { // left or right attachment
            if (currentStep.tooltipAlign === 'start') {
              topPos = rect.top;
            } else if (currentStep.tooltipAlign === 'center') {
              topPos = rect.top + rect.height / 2 - tooltipHeight / 2;
            } else { // end
              topPos = rect.bottom - tooltipHeight;
            }
          }
        }
        
        // Mobile viewport adjustments - make sure tooltip is fully visible
        if (isMobile) {
          // Ensure tooltip is within viewport for mobile (stricter boundaries)
          if (leftPos < BOUNDARY_PADDING) {
            leftPos = BOUNDARY_PADDING;
          }
          if (leftPos + tooltipWidth > window.innerWidth - BOUNDARY_PADDING) {
            leftPos = window.innerWidth - tooltipWidth - BOUNDARY_PADDING;
          }
          if (topPos < BOUNDARY_PADDING + 60) { // Add extra space for potential browser UI
            topPos = BOUNDARY_PADDING + 60;
          }
          if (topPos + tooltipHeight > window.innerHeight - BOUNDARY_PADDING - 60) {
            topPos = window.innerHeight - tooltipHeight - BOUNDARY_PADDING - 60;
          }
        } else {
          // Desktop viewport adjustments
          if (leftPos < BOUNDARY_PADDING) {
            leftPos = BOUNDARY_PADDING;
          }
          if (leftPos + tooltipWidth > window.innerWidth - BOUNDARY_PADDING) {
            leftPos = window.innerWidth - tooltipWidth - BOUNDARY_PADDING;
          }
          if (topPos < BOUNDARY_PADDING) {
            topPos = BOUNDARY_PADDING;
          }
          if (topPos + tooltipHeight > window.innerHeight - BOUNDARY_PADDING) {
            topPos = window.innerHeight - tooltipHeight - BOUNDARY_PADDING;
          }
        }

        setTooltipPosition({ top: topPos, left: leftPos, visibility: 'visible' });
      } else {
        console.warn(`Element ${currentStep.elementId} found but has zero dimensions`);
      }
    } else {
      console.warn(`Tutorial target element not found: ${currentStep.elementId}, attempt: ${findAttemptsRef.current + 1}`);
      
      // Start repeated attempts to find the element if not already trying
      if (!findIntervalRef.current) {
        findIntervalRef.current = setInterval(() => {
          findAttemptsRef.current += 1;
          
          // Check if we should keep trying
          if (findAttemptsRef.current <= MAX_ATTEMPTS) {
            const element = findTargetElement();
            if (element) {
              console.log(`Found element ${currentStep.elementId} after ${findAttemptsRef.current} attempts`);
              calculatePositions(); // Recalculate now that we found it
            }
          } else {
            // Give up after max attempts
            clearInterval(findIntervalRef.current);
            findIntervalRef.current = null;
            
            // Fallback position in the center of the screen
            const fallbackTop = window.innerHeight / 2 - (isMobile ? MOBILE_TOOLTIP_HEIGHT : TOOLTIP_HEIGHT) / 2;
            const fallbackLeft = window.innerWidth / 2 - (isMobile ? MOBILE_TOOLTIP_WIDTH : TOOLTIP_WIDTH) / 2;
            
            console.log(`Using fallback position for ${currentStep.elementId}`);
            
            setTooltipPosition({ 
              top: fallbackTop, 
              left: fallbackLeft, 
              visibility: 'visible'
            });
            
            // Also set a fallback highlight box in the center
            setHighlightBox({
              top: window.innerHeight / 2 - 50,
              left: window.innerWidth / 2 - 50,
              width: 100,
              height: 100,
              elementWidth: 100,
              elementHeight: 100,
              elementTop: window.innerHeight / 2 - 50,
              elementLeft: window.innerWidth / 2 - 50,
            });
          }
        }, RETRY_INTERVAL);
      }
    }
  }, [currentStep, findTargetElement, isMobile]);

  // Clean up intervals when component unmounts or step changes
  useEffect(() => {
    return () => {
      if (findIntervalRef.current) {
        clearInterval(findIntervalRef.current);
        findIntervalRef.current = null;
      }
      findAttemptsRef.current = 0;
    };
  }, [currentStepIndex]);

  useEffect(() => {
    // Reset the find attempts when step changes
    findAttemptsRef.current = 0;
    
    calculatePositions(); // Initial calculation
    window.addEventListener('resize', calculatePositions);
    window.addEventListener('scroll', calculatePositions, true); // Listen on capture phase for scroll

    return () => {
      window.removeEventListener('resize', calculatePositions);
      window.removeEventListener('scroll', calculatePositions, true);
      
      if (findIntervalRef.current) {
        clearInterval(findIntervalRef.current);
        findIntervalRef.current = null;
      }
    };
  }, [calculatePositions, currentStepIndex]);


  const handleNextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose(); 
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!currentStep) {
    return null; 
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999]" 
    >
      {/* Full-screen backdrop with cutout for the highlighted element */}
      {highlightBox && (
        <>
          {/* 
            Create a specially shaped overlay that darkens everything 
            EXCEPT where the target element is (using clip-path)
          */}
          <div 
            className="fixed inset-0 bg-black/80 pointer-events-none"
            style={{ 
              zIndex: 99998,
              clipPath: `path('M 0,0 L 0,${window.innerHeight} L ${window.innerWidth},${window.innerHeight} L ${window.innerWidth},0 L 0,0 Z M ${highlightBox.left},${highlightBox.top} L ${highlightBox.left + highlightBox.width},${highlightBox.top} L ${highlightBox.left + highlightBox.width},${highlightBox.top + highlightBox.height} L ${highlightBox.left},${highlightBox.top + highlightBox.height} Z')`,
              backdropFilter: 'blur(0)',
            }}
          />
          
          {/* Semi-transparent overlay for areas that are not the target */}
          <div 
            className="fixed inset-0 backdrop-blur-sm pointer-events-none"
            style={{ 
              zIndex: 99997,
              clipPath: `path('M 0,0 L 0,${window.innerHeight} L ${window.innerWidth},${window.innerHeight} L ${window.innerWidth},0 L 0,0 Z M ${highlightBox.left},${highlightBox.top} L ${highlightBox.left + highlightBox.width},${highlightBox.top} L ${highlightBox.left + highlightBox.width},${highlightBox.top + highlightBox.height} L ${highlightBox.left},${highlightBox.top + highlightBox.height} Z')`,
            }}
          />
          
          {/* Glowing border around the highlighted element */}
          <div
            style={{
              position: 'fixed',
              top: highlightBox.top,
              left: highlightBox.left,
              width: highlightBox.width,
              height: highlightBox.height,
              borderRadius: '12px',
              boxShadow: '0 0 0 3px #0ea5e9, 0 0 20px rgba(14, 165, 233, 0.5)',
              pointerEvents: 'none',
              zIndex: 100000
            }}
          />
        </>
      )}

      {/* Tooltip - IMPORTANT: This needs pointer-events-auto to be clickable */}
      <motion.div
        key={`tooltip-${currentStepIndex}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        style={{
          position: 'fixed',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          visibility: tooltipPosition.visibility,
          width: isMobile ? `${MOBILE_TOOLTIP_WIDTH}px` : `${TOOLTIP_WIDTH}px`,
          zIndex: 100001, // Ensure tooltip is above highlight
        }}
        className="bg-neutral-800/90 border border-neutral-700/80 text-white p-5 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-auto" // Added pointer-events-auto
      >
        <h3 className="text-lg font-semibold text-sky-400 mb-2">{currentStep.title}</h3> {/* Matched highlight border color */}
        <p className="text-sm text-neutral-200 mb-4">{currentStep.text}</p> {/* Lighter text */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={handleNextStep}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2" // Matched highlight color
          >
            {currentStepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            {currentStepIndex < tutorialSteps.length - 1 && <IconArrowRight size={16} />}
          </button>
        </div>
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-200 transition-colors" // Lighter hover
          aria-label="Close tutorial"
        >
          <IconX size={20} />
        </button>
      </motion.div>
    </motion.div>
  );
}; 