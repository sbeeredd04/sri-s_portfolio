"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export const Timeline = ({ data, theme }) => {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Dynamic colors based on theme
  const dotColor =
    theme === "experience"
      ? "from-blue-400 via-purple-500"
      : "from-green-400 via-teal-500";
  const titleColor =
    theme === "experience"
      ? "text-blue-400 dark:text-purple-500"
      : "text-green-400 dark:text-teal-500";

  return (
    <div className="font-[Ubuntu_Mono] md:px-10 px-4" ref={containerRef}>
      <div ref={ref} className="relative max-w-8xl mx-auto pb-10 md:pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-20 lg:pt-40 md:gap-6 lg:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-20 md:top-32 lg:top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div
                className={`absolute left-1 md:left-3 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center bg-gradient-to-r ${dotColor}`}
              >
                <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-1 md:p-2" />
              </div>
              <h3
                className={`hidden md:block text-xl md:pl-16 lg:pl-20 md:text-3xl lg:text-5xl font-bold ${titleColor} font-[Ubuntu_Mono]`}
              >
                {item.title}
              </h3>
            </div>

            <div className="relative pl-10 pr-2 md:pl-4 md:pr-4 w-full">
              <h3
                className={`md:hidden block text-xl mb-3 text-left font-bold ${titleColor} font-[Ubuntu_Mono]`}
              >
                {item.title}
              </h3>
              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 lg:p-8 border border-white/5">
                {item.content}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute left-[11px] md:left-[19px] top-0 overflow-hidden w-[2px] bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200 dark:via-neutral-700"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className={`absolute inset-x-0 top-0 w-[3px] bg-gradient-to-t ${dotColor} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
};
