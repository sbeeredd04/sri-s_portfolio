"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "../lib/utils";

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

  const borderColors = [
    "rgba(6, 182, 212, 0.5)", // cyan-500
    "rgba(236, 72, 153, 0.5)", // pink-500
    "rgba(249, 115, 22, 0.5)", // orange-500
  ];

  const [borderGradient, setBorderGradient] = useState(borderColors[0]);

  useEffect(() => {
    setBorderGradient(borderColors[activeCard % borderColors.length]);
  }, [activeCard]);

  return (
    <motion.div
      animate={{
        borderColor: borderGradient,
        boxShadow: `0 0 20px ${borderGradient}`,
      }}
      className="relative flex h-[50rem] justify-center space-x-10 overflow-y-auto rounded-md p-4 md:p-10 scrollbar-none bg-neutral-800/20 backdrop-blur-xl border-2 transition-all duration-300"
      ref={ref}>
      <div className="div relative flex items-start px-2">
        <div className="max-w-3xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-32 md:my-64">
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-2xl md:text-4xl font-bold text-slate-100">
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-base md:text-xl mt-6 md:mt-10 max-w-xl text-slate-300">
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div className="sticky top-0 flex flex-col items-center justify-center">
        <div
          className={cn(
            "sticky top-10 hidden h-[40rem] w-[45vw] overflow-hidden rounded-md bg-none lg:block transition-all duration-300",
            contentClassName
          )}>
          {content[activeCard].content && (
            <div className="relative w-full h-full">
              <Image
                src={content[activeCard].content}
                alt={content[activeCard].title}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
