"use client";
import React, { useRef } from "react";
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
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
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

  // Custom components for ReactMarkdown
  const components = {
    // Style paragraphs
    p: ({ children }) => (
      <p className="text-slate-300 mb-4">{children}</p>
    ),
    // Style lists
    ul: ({ children }) => (
      <ul className="space-y-3 mt-4">{children}</ul>
    ),
    // Style list items
    li: ({ children }) => (
      <li className="flex items-start">
        <span className="text-emerald-400 mr-3">•</span>
        <span>{children}</span>
      </li>
    ),
    // Style bold text
    strong: ({ children }) => (
      <strong className="text-slate-100 font-semibold">{children}</strong>
    ),
    // Style italic text
    em: ({ children }) => (
      <em className="text-slate-200 italic">{children}</em>
    ),
    // Style inline code blocks
    code: ({ children }) => (
      <code className="bg-slate-800/50 text-cyan-400 px-1.5 py-0.5 rounded font-mono text-sm">{children}</code>
    ),
  };

  return (
    <div className="h-full w-full flex pb-20">
      {/* Scrollable Text Content */}
      <div
        ref={ref}
        className="w-1/2 h-full overflow-y-auto scrollbar-none px-6 py-4 relative"
      >
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 top-8 flex flex-col items-center gap-2 text-slate-400"
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
          <span className="text-sm font-medium">Scroll to learn more</span>
          <IconChevronDown className="w-6 h-6" />
        </motion.div>

        {/* Content */}
        {content.map((item, index) => (
          <div key={item.title + index} className="my-64">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className="text-xl md:text-4xl font-bold text-slate-100 mb-6"
            >
              {item.title}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className="text-base md:text-md"
            >
              <ReactMarkdown components={components}>
                {item.description}
              </ReactMarkdown>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Fixed Image Content */}
      <div className="w-1/2 h-full relative">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className={cn(
            "w-full h-full relative rounded-3xl overflow-hidden",
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
    </div>
  );
};
