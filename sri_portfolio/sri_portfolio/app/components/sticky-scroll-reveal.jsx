"use client";
import React, { useRef, useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "../lib/utils";
import ReactMarkdown from 'react-markdown';
import { IconChevronDown } from "@tabler/icons-react";

export const StickyScroll = ({
  content,
  contentClassName
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);
  const containerRef = useRef(null);
  
  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end end"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isIntersecting) return;

    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce((acc, breakpoint, index) => {
      const distance = Math.abs(latest - breakpoint);
      if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
        return index;
      }
      return acc;
    }, 0);
    setActiveCard(closestBreakpointIndex);
  });

  // Custom components for ReactMarkdown with mobile-responsive classes
  const components = {
    p: ({ children }) => (
      <p className="text-slate-300 mb-4 text-sm md:text-base">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 md:space-y-3 mt-3 md:mt-4">{children}</ul>
    ),
    li: ({ children }) => (
      <li className="flex items-start">
        <span className="text-emerald-400 mr-2 md:mr-3 text-sm md:text-base">•</span>
        <span className="text-sm md:text-base">{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="text-slate-100 font-semibold text-sm md:text-base">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-slate-200 italic text-sm md:text-base">{children}</em>
    ),
    code: ({ children }) => (
      <code className="bg-slate-800/50 text-cyan-400 px-1 md:px-1.5 py-0.5 rounded font-mono text-xs md:text-sm">{children}</code>
    ),
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-full w-full flex pb-10 md:pb-20",
        isMobile ? "flex-col" : "flex-row"
      )}>
      {/* Scrollable Text Content */}
      <div
        ref={ref}
        className={cn(
          "h-full overflow-y-auto scrollbar-none relative",
          isMobile ? "w-full px-4 pt-16 pb-8" : "w-1/2 px-6 py-4 pt-24"
        )}
      >
        {/* Scroll Indicator */}
        <motion.div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400",
            isMobile ? "top-6" : "top-10"
          )}
          animate={{
            y: [0, 10, 0],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-xs md:text-sm font-medium">Scroll to learn more</span>
          <IconChevronDown className="w-4 h-4 md:w-6 md:h-6" />
        </motion.div>

        {/* Content */}
        {content.map((item, index) => (
          <div 
            key={item.title + index} 
            className={cn(
              "mx-auto flex flex-col justify-center",
              isMobile ? "min-h-[65vh] my-16" : "min-h-[55vh] mb-16"
            )}
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className={cn(
                "font-bold text-slate-100 mb-3 md:mb-4 text-center",
                isMobile ? "text-xl" : "text-2xl md:text-3xl"
              )}
            >
              {item.title}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className={cn(
                "text-slate-200",
                isMobile ? "text-sm" : "text-base"
              )}
            >
              <ReactMarkdown components={components}>
                {item.description}
              </ReactMarkdown>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Fixed Image Content - Hidden on Mobile */}
      {!isMobile && (
        <div className="w-1/2 h-full relative flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
            <div className={cn(
              "w-full h-[80%] relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl",
              contentClassName
            )}>
              {content[activeCard].content && (
                <Image
                  src={content[activeCard].content}
                  alt={content[activeCard].title}
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
