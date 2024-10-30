"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "../lib/utils";

export const InfiniteMovingCards = ({
  sections,
  direction = "left",
  speed = "veryFast",
  pauseOnHover = true,
  className,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    setupScrollLoop();
  }, []);

  const setupScrollLoop = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollLeft = scrollerRef.current.offsetWidth;
    }
  };

  const handleManualScroll = () => {
    if (scrollerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (scrollLeft >= maxScrollLeft - 1) {
        scrollerRef.current.scrollLeft = clientWidth;
      } else if (scrollLeft <= 1) {
        scrollerRef.current.scrollLeft = maxScrollLeft - clientWidth;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <div
        ref={scrollerRef}
        onScroll={handleManualScroll}
        className="scroll-wrapper max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap"
      >
        <ul
          className={cn(
            "flex min-w-full shrink-0 gap-4 md:gap-8 py-4 md:py-8 w-max flex-nowrap",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
        >
          {[...sections, ...sections, ...sections].map((section, idx) => {
            const cardWidth = Math.max(300, Math.min(section.skills.length * 60, 250));

            return (
              <li
                key={idx}
                style={{ width: `${cardWidth}px`, minHeight: "250px" }}
                className="bg-transparent border border-white shadow-lg p-3 md:p-6 rounded-2xl flex-shrink-0 mx-2 overflow-hidden" // Changed to overflow-hidden
              >
                <h3 className="text-lg md:text-xl font-semibold text-cyan-400 mb-2 md:mb-4 text-center">
                  {section.category}
                </h3>
                <div className="flex flex-wrap gap-2 md:gap-2 justify-center">
                  {section.skills.map((skill, skillIdx) => (
                    <div
                      key={skillIdx}
                      className="flex items-center p-1"
                      style={{ width: "auto" }}
                    >
                      <img
                        src={skill.icon}
                        alt=""
                        className="h-8 md:h-10 object-contain"
                      />
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// CSS for infinite scrolling animation
<style jsx global>{`
  .animate-scroll {
    display: flex;
    animation: scroll infinite var(--animation-duration, 5s) linear var(--animation-direction, normal);
  }

  .scroll-wrapper::-webkit-scrollbar {
    display: none; /* Hide scrollbar */
  }

  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`}</style>
