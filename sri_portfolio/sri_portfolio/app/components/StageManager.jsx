"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

const SECTION_META = {
  featured: { label: "Featured", color: "#06b6d4" },
  about: { label: "About Me", color: "#2fb8ff" },
  experience: { label: "Experience", color: "#a855f7" },
  projects: { label: "Projects", color: "#f59e0b" },
  skills: { label: "Skills", color: "#10b981" },
  blog: { label: "Blog", color: "#f43f5e" },
  contact: { label: "Contact", color: "#6366f1" },
};

// Thumbnail dimensions — macOS Stage Manager proportions
const THUMB_W = 140;
const THUMB_H = 88;
const TITLE_BAR_H = 20;
const FULL_W = 1200;
const FULL_H = 750;
const SCALE = THUMB_W / FULL_W; // ~0.117

// Memoized section preview — renders actual section content scaled down
const SectionPreview = React.memo(function SectionPreview({
  section,
  renderPreview,
}) {
  const content = useMemo(
    () => renderPreview(section),
    [section, renderPreview]
  );

  return (
    <MotionConfig reducedMotion="always">
      <div
        style={{
          width: THUMB_W,
          height: THUMB_H - TITLE_BAR_H,
          overflow: "hidden",
          position: "relative",
          contain: "strict",
        }}
      >
        <div
          style={{
            width: FULL_W,
            height: FULL_H,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            userSelect: "none",
            overflow: "hidden",
          }}
        >
          {content}
        </div>
      </div>
    </MotionConfig>
  );
});

export default function StageManager({
  minimizedSections,
  activeSection,
  onSelect,
  renderPreview,
}) {
  const thumbnails = minimizedSections
    .filter((s) => s !== "home" && s !== activeSection && SECTION_META[s]);

  if (thumbnails.length === 0) return null;

  return (
    <motion.div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5"
    >
      <AnimatePresence mode="popLayout">
        {thumbnails.map((section, index) => {
          const meta = SECTION_META[section];
          if (!meta) return null;

          return (
            <motion.div
              key={section}
              layout
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 32,
                delay: index * 0.03,
              }}
              whileHover={{ scale: 1.06, x: -6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(section)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(section)}
              className="group relative cursor-pointer"
            >
              {/* Window thumbnail — macOS style with real content preview */}
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  width: THUMB_W,
                  height: THUMB_H,
                  background: "rgba(30,30,30,0.8)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 0.5px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* Mini title bar with traffic lights */}
                <div
                  className="flex items-center px-2 gap-[3px]"
                  style={{
                    height: TITLE_BAR_H,
                    background: "rgba(45,45,45,0.9)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="w-[5px] h-[5px] rounded-full bg-[#ff5f57]" />
                  <div className="w-[5px] h-[5px] rounded-full bg-[#febc2e]" />
                  <div className="w-[5px] h-[5px] rounded-full bg-[#28c840]" />
                  <span className="text-[6px] text-white/30 font-medium ml-1.5 truncate">
                    {meta.label}
                  </span>
                </div>

                {/* Scaled content preview */}
                <SectionPreview
                  section={section}
                  renderPreview={renderPreview}
                />
              </div>

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  boxShadow: `0 0 20px ${meta.color}20, inset 0 0 0 1px ${meta.color}15`,
                }}
              />

              {/* Tooltip on hover — appears to the left */}
              <div
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] text-white/90 font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {meta.label}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
