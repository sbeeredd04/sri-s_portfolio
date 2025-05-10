"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconArrowRight, IconX } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { cn } from "../lib/utils"; // cn is not used in this version

const tutorialSteps = [
  {
    elementId: "floating-dock-tutorial-target",
    title: "Quick Navigation",
    text: "Use this dock to easily navigate to different sections of the portfolio. It's on the left (desktop) or bottom (mobile).",
    tooltipAttachment: "right", // e.g., tooltip to the right of the dock
    tooltipAlign: "center",    // e.g., centered vertically along the right edge
  },
  {
    elementId: "theme-button-tutorial-target",
    title: "Change Theme",
    text: "Personalize your viewing experience! Click here to change the background theme.",
    tooltipAttachment: "bottom", // e.g., tooltip below the theme button
    tooltipAlign: "end",      // e.g., aligned to the right edge of the button
  },
  // Add more steps here for other important buttons if needed
];

const TOOLTIP_WIDTH = 300; // Approximate width of the tooltip
const TOOLTIP_HEIGHT = 150; // Approximate height of the tooltip
const TOOLTIP_OFFSET = 20; // Increased offset from the element
const BOUNDARY_PADDING = 10; // Padding from viewport edges

export const TutorialOverlay = ({ onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, visibility: 'visible' });
  
  const currentStep = tutorialSteps[currentStepIndex];

  const calculatePositions = useCallback(() => {
    if (!currentStep) return;

    const targetElement = document.getElementById(currentStep.elementId);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setHighlightBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      let topPos = 0;
      let leftPos = 0;

      // Calculate tooltip position based on attachment and alignment
      // Attachment: which side of the target element the tooltip attaches to
      // Alignment: how the tooltip aligns along that side

      // Horizontal positioning
      if (currentStep.tooltipAttachment === 'left') {
        leftPos = rect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
      } else if (currentStep.tooltipAttachment === 'right') {
        leftPos = rect.right + TOOLTIP_OFFSET;
      } else { // top or bottom attachment
        if (currentStep.tooltipAlign === 'start') {
          leftPos = rect.left;
        } else if (currentStep.tooltipAlign === 'center') {
          leftPos = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        } else { // end
          leftPos = rect.right - TOOLTIP_WIDTH;
        }
      }

      // Vertical positioning
      if (currentStep.tooltipAttachment === 'top') {
        topPos = rect.top - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;
      } else if (currentStep.tooltipAttachment === 'bottom') {
        topPos = rect.bottom + TOOLTIP_OFFSET;
      } else { // left or right attachment
        if (currentStep.tooltipAlign === 'start') {
          topPos = rect.top;
        } else if (currentStep.tooltipAlign === 'center') {
          topPos = rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2;
        } else { // end
          topPos = rect.bottom - TOOLTIP_HEIGHT;
        }
      }
      
      // Boundary corrections
      if (leftPos < BOUNDARY_PADDING) {
        leftPos = BOUNDARY_PADDING;
      }
      if (leftPos + TOOLTIP_WIDTH > window.innerWidth - BOUNDARY_PADDING) {
        leftPos = window.innerWidth - TOOLTIP_WIDTH - BOUNDARY_PADDING;
      }
      if (topPos < BOUNDARY_PADDING) {
        topPos = BOUNDARY_PADDING;
      }
      if (topPos + TOOLTIP_HEIGHT > window.innerHeight - BOUNDARY_PADDING) {
        topPos = window.innerHeight - TOOLTIP_HEIGHT - BOUNDARY_PADDING;
      }

      setTooltipPosition({ top: topPos, left: leftPos, visibility: 'visible' });

    } else {
      console.warn(`Tutorial target element not found: ${currentStep.elementId}`);
      setTooltipPosition(prev => ({ ...prev, visibility: 'hidden' })); // Hide tooltip if target not found
      // Optionally auto-advance or close
      if (currentStepIndex < tutorialSteps.length - 1) {
        // setCurrentStepIndex(currentStepIndex + 1); // Can lead to rapid skipping if many elements are missing
      } else {
        // onClose();
      }
    }
  }, [currentStep, currentStepIndex]); // Removed onClose from dependencies to prevent re-calculation on every render if onClose is a new function

  useEffect(() => {
    calculatePositions(); // Initial calculation
    window.addEventListener('resize', calculatePositions);
    window.addEventListener('scroll', calculatePositions, true); // Listen on capture phase for scroll

    return () => {
      window.removeEventListener('resize', calculatePositions);
      window.removeEventListener('scroll', calculatePositions, true);
    };
  }, [calculatePositions]);


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

  if (!currentStep || !highlightBox) {
    return null; 
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[10000] flex items-center justify-center" // Increased backdrop opacity and blur
    >
      {/* Highlight Box */}
      {highlightBox && (
        <motion.div
          key={`highlight-${currentStepIndex}`}
          initial={{ 
            x: highlightBox.left + highlightBox.width / 2, 
            y: highlightBox.top + highlightBox.height / 2, 
            width: 0, 
            height: 0,
            opacity: 0,
          }}
          animate={{
            x: highlightBox.left - 8, // Increased padding for highlight
            y: highlightBox.top - 8,
            width: highlightBox.width + 16,
            height: highlightBox.height + 16,
            opacity: 1,
          }}
          transition={{ duration: 0.35, ease: "circOut" }}
          style={{
            position: 'fixed',
            border: '3px solid #0ea5e9', // A slightly different cyan (sky-500)
            borderRadius: '12px', // Slightly more rounded
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)', // Slightly darker spotlight
            pointerEvents: 'none', 
          }}
        />
      )}

      {/* Tooltip */}
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
          width: `${TOOLTIP_WIDTH}px`,
        }}
        className="bg-neutral-800/90 border border-neutral-700/80 text-white p-5 rounded-lg shadow-2xl z-[10001] backdrop-blur-sm" // Added slight transparency and blur to tooltip
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