"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useTransform, useScroll, useSpring } from "motion/react";
import { cn } from "../lib/utils";

export const TracingBeam = ({
  children,
  className
}) => {
  const ref = useRef(null);
  const contentRef = useRef(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [scrollContainer, setScrollContainer] = useState(null);

  // Get scroll progress from the main container
  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    // Find the main scrolling container by ID first, then fallback to searching
    const findScrollContainer = () => {
      // Try to find the specific main scroll container
      let container = document.getElementById('main-scroll-container');
      if (container) {
        return container;
      }
      
      // Fallback: search parent elements
      let element = ref.current;
      while (element && element !== document.body) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    // Use a timeout to ensure the DOM is fully rendered
    const timeout = setTimeout(() => {
      const container = findScrollContainer();
      if (container && container !== scrollContainer) {
        setScrollContainer(container);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [scrollContainer]);

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }
  }, []);

  const y1 = useSpring(
    useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]), 
    {
      stiffness: 500,
      damping: 90,
    }
  );
  
  const y2 = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]), 
    {
      stiffness: 500,
      damping: 90,
    }
  );

  return (
    <motion.div
      ref={ref}
      className={cn("relative w-full min-h-screen", className)}
    >
      <div className="absolute top-3 left-4 md:left-8 z-10">
        <motion.div
          transition={{
            duration: 0.2,
            delay: 0.5,
          }}
          animate={{
            boxShadow:
              scrollYProgress.get() > 0
                ? "none"
                : "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          }}
          className="border-netural-200 ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border shadow-sm bg-gray-900"
        >
          <motion.div
            transition={{
              duration: 0.2,
              delay: 0.5,
            }}
            animate={{
              backgroundColor: scrollYProgress.get() > 0 ? "#06b6d4" : "#06b6d4",
              borderColor: scrollYProgress.get() > 0 ? "#0891b2" : "#0891b2",
            }}
            className="h-2 w-2 rounded-full border border-cyan-500 bg-cyan-500"
          />
        </motion.div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-4 block"
          aria-hidden="true"
        >
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="#9091A0"
            strokeOpacity="0.16"
            transition={{
              duration: 10,
            }}
          />
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1.25"
            className="motion-reduce:hidden"
            transition={{
              duration: 10,
            }}
          />
          <defs>
            <motion.linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y1}
              y2={y2}
            >
              <stop stopColor="#06b6d4" stopOpacity="0" />
              <stop stopColor="#06b6d4" />
              <stop offset="0.325" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#1e40af" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef} className="pl-20 md:pl-32 overflow-visible">
        {children}
      </div>
    </motion.div>
  );
};
