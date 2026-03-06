"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════
// GENIE EFFECT — macOS-style 3D perspective window animation
//
// Uses CSS 3D transforms to create the genuine genie funnel:
//   • perspective() in the transform chain enables 3D foreshortening
//   • rotateY → the edge nearest the source appears narrower (pinched)
//   • rotateX → top or bottom edge pinches for vertical genie
//   • Combined with scale + translate for positioning
//
// Stage Manager:  window unfolds from right (rotateY + x-translate)
// Default (dock): window pours upward from bottom (rotateX + y-translate)
// Exit:           always funnels back toward Stage Manager on the right
//
// AnimatePresence mode="popLayout" in the parent ensures the exiting
// window is taken out of layout flow so both animations play cleanly.
// ═══════════════════════════════════════════════════════════════════

const GENIE_ENTER = {
  // ── From Stage Manager thumbnail — unfolds from right side ──
  "stage-manager": {
    initial: {
      scale: 0.12,
      x: "40vw",
      rotateY: 22,       // right edge pinches inward (3D funnel)
      opacity: 0,
    },
    animate: {
      scale: 1,
      x: 0,
      rotateY: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 22,
        mass: 0.85,
        opacity: { duration: 0.2 },
        delay: 0.06,        // slight stagger so exit clears first
      },
    },
  },

  // ── From app grid / dock — pours upward from bottom ──
  default: {
    initial: {
      scale: 0.12,
      y: 280,
      rotateX: -16,       // bottom edge pinches backward (3D funnel)
      opacity: 0,
    },
    animate: {
      scale: 1,
      y: 0,
      rotateX: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 190,
        damping: 23,
        mass: 0.8,
        opacity: { duration: 0.2 },
      },
    },
  },
};

// ── Exit: genie sucks back toward Stage Manager (right side) ──
const GENIE_EXIT = {
  scale: 0.12,
  x: "40vw",
  rotateY: 22,
  opacity: 0,
  transition: {
    duration: 0.38,
    ease: [0.4, 0, 1, 1],     // ease-in curve → "suction" feel
    opacity: { duration: 0.28 },
  },
};

export default function SectionWindow({
  title,
  children,
  onClose,
  isHome = false,
  onMinimize,
  transitionSource = "default",
}) {
  const [isHoveringTrafficLights, setIsHoveringTrafficLights] = useState(false);
  const variant = GENIE_ENTER[transitionSource] || GENIE_ENTER.default;

  if (isHome) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 24,
          mass: 0.7,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full h-full flex flex-col"
      style={{
        transformPerspective: 1200,   // enables 3D foreshortening for rotate
        willChange: "transform, opacity",
      }}
      initial={variant.initial}
      animate={variant.animate}
      exit={GENIE_EXIT}
    >
      {/* Window Container */}
      <div className="flex-1 min-h-0 glass overflow-hidden flex flex-col">
        {/* Title Bar */}
        <div className="flex-shrink-0 flex items-center px-5 py-3 border-b border-white/[0.06]">
          {/* macOS Traffic Light Buttons */}
          <div
            className="flex items-center gap-2 mr-4"
            onMouseEnter={() => setIsHoveringTrafficLights(true)}
            onMouseLeave={() => setIsHoveringTrafficLights(false)}
          >
            {/* Close (Red) */}
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.8 }}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57] transition-all relative group flex items-center justify-center"
              style={{
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.12)",
              }}
              title="Close"
            >
              {isHoveringTrafficLights && (
                <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#4a0002]">
                  <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </motion.button>
            {/* Minimize (Yellow) */}
            <motion.button
              onClick={onMinimize || onClose}
              whileTap={{ scale: 0.8 }}
              className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e] transition-all relative group flex items-center justify-center"
              style={{
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.12)",
              }}
              title="Minimize"
            >
              {isHoveringTrafficLights && (
                <svg width="6" height="2" viewBox="0 0 6 2" className="text-[#985712]">
                  <path d="M0.5 1H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </motion.button>
            {/* Maximize (Green) */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840] transition-all relative group flex items-center justify-center"
              style={{
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.12)",
              }}
              title="Fullscreen"
            >
              {isHoveringTrafficLights && (
                <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#0b6518]">
                  <path d="M1 5L5 1M1 1.5V5H4.5M5 4.5V1H1.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Title - centered */}
          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-white/70 text-sm font-medium tracking-tight">
              {title}
            </h2>
          </div>

          {/* Spacer to balance the traffic lights */}
          <div className="w-[60px]" />
        </div>

        {/* Content Area */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          id="main-scroll-container"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx global>{`
            #main-scroll-container::-webkit-scrollbar { display: none; }
          `}</style>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
