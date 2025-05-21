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
  const [cardActivationPoints, setCardActivationPoints] = useState([]);

  const ref = useRef(null);
  const containerRef = useRef(null);
  
  const contentItemRefs = useRef([]);
  contentItemRefs.current = content.map(
    (_, i) => contentItemRefs.current[i] ?? React.createRef()
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isIntersecting || !ref.current || contentItemRefs.current.length === 0) {
      if (content.length > 0) {
        setCardActivationPoints(content.map((_, index) => index / content.length));
      } else {
        setCardActivationPoints([]);
      }
      return;
    }

    const scrollContainerEl = ref.current;
    const viewportHeight = scrollContainerEl.clientHeight;
    const scrollHeight = scrollContainerEl.scrollHeight;
    const scrollableDistance = scrollHeight - viewportHeight;

    const newActivationPoints = contentItemRefs.current.map((itemRef) => {
      if (itemRef.current) {
        const itemEl = itemRef.current;
        const itemTop = itemEl.offsetTop;
        const itemHeight = itemEl.offsetHeight;

        if (scrollableDistance <= 0) return 0;

        const scrollTopToCenterItem = itemTop + itemHeight / 2 - viewportHeight / 2;
        
        let activationProgress = scrollTopToCenterItem / scrollableDistance;
        return Math.max(0, Math.min(1, activationProgress));
      }
      return 0;
    });

    setCardActivationPoints(newActivationPoints);

  }, [content, isMobile, isIntersecting, ref, contentItemRefs]);

  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isIntersecting || cardActivationPoints.length === 0) return;

    const closestBreakpointIndex = cardActivationPoints.reduce(
      (acc, breakpoint, index) => {
        const distanceToLatest = Math.abs(latest - breakpoint);
        const currentClosestDistance = Math.abs(latest - cardActivationPoints[acc]);
        return distanceToLatest < currentClosestDistance ? index : acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

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
      <div
        ref={ref}
        className={cn(
          "h-full overflow-y-auto scrollbar-none relative",
          isMobile ? "w-full px-4 pt-16 pb-8" : "w-1/2 px-6 py-4 pt-24"
        )}
      >
        <motion.div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 z-10",
            isMobile ? "top-6" : "top-10"
          )}
          animate={{
            y: [0, 8, 0],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-xs md:text-sm font-medium text-center">Scroll to learn more</span>
          <IconChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>

        {content.map((item, index) => (
          <div 
            key={item.title + index} 
            ref={contentItemRefs.current[index]}
            className={cn(
              "mx-auto flex flex-col justify-center",
              isMobile ? "py-16" : "py-20 mb-16"
            )}
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
        <div className={isMobile ? "h-[30vh]" : "h-[40vh]"}></div>
      </div>

      {!isMobile && (
        <div className="w-1/2 h-full relative flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
            <div className={cn(
              "w-full h-[80%] relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-neutral-700/50",
              contentClassName
            )}>
              {content.length > 0 && content[activeCard] && content[activeCard].content && (
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
