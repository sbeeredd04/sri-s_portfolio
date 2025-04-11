"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

export const InfiniteMovingCards = ({
  sections,
  direction = "left",
  speed = "veryFast",
  pauseOnHover = true,
  className,
}) => {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollLeft += direction === "left" ? 1 : -1;
        handleManualScroll();
      }
    }, speed === "veryFast" ? 10 : speed === "fast" ? 20 : 30);

    return () => clearInterval(interval);
  }, []);

  const handleManualScroll = () => {
    if (scrollerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
      const halfwayPoint = scrollWidth / 2;

      if (scrollLeft >= scrollWidth - clientWidth) {
        scrollerRef.current.scrollLeft = halfwayPoint - clientWidth;
      }
    }
  };

  return (
    <div
      className={cn(
        "scroller relative z-20 w-full overflow-hidden",
        className
      )}
    >
      <div
        ref={scrollerRef}
        onScroll={handleManualScroll}
        className="scroll-wrapper w-full overflow-hidden whitespace-nowrap"
      >
        <ul
          className={cn(
            "animate-scroll flex w-full shrink-0 gap-2 py-2 flex-nowrap",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{
            animation: `scroll linear infinite ${speed === "veryFast" ? "60s" : speed === "fast" ? "90s" : "120s"}`,
          }}
        >
          {[...sections, ...sections].map((section, idx) => {
            const dynamicWidth = Math.max(200, section.skills.length * 35); // Adjusted for better spacing

            // Distribute skills cyclically across four rows
            const rows = [[], [], [], []];
            section.skills.forEach((skill, index) => {
              rows[index % 4].push(skill);
            });

            return (
              <li
                key={idx}
                style={{
                  minWidth: dynamicWidth,
                  height: "300px", // Slightly reduced height
                }}
                className="p-3 rounded-xl flex-shrink-0 mx-1 overflow-hidden flex flex-col justify-center items-center text-center"
              >
                <h3 className="text-lg md:text-xl font-semibold text-cyan-400 mb-3">
                  {section.category}
                </h3>
                <div
                  className="flex flex-col gap-2 items-center justify-center"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    overflow: "hidden",
                  }}
                >
                  {rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex gap-2 justify-center flex-wrap"
                      style={{
                        width: "100%",
                      }}
                    >
                      {row.map((skill, skillIdx) => (
                        <div
                          key={skillIdx}
                          className="flex items-center justify-center p-1"
                        >
                          <img
                            src={skill.icon}
                            alt=""
                            className="h-8 md:h-10 object-contain"
                          />
                        </div>
                      ))}
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
    animation: scroll linear infinite;
    width: 100%;
  }

  .scroll-wrapper {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scroll-wrapper::-webkit-scrollbar {
    display: none;
  }

  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  /* Mobile styling adjustments */
  @media (max-width: 768px) {
    .scroll-wrapper {
      padding: 0.5rem;
    }

    .animate-scroll li {
      min-width: 180px;
      padding: 0.75rem;
    }

    .animate-scroll h3 {
      font-size: 1.1rem;
    }
  }
`}</style>
