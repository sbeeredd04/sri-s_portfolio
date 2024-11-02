"use client";;
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useOutsideClick } from "../hooks/use-outside-click";

export const CarouselContext = createContext({
  onCardClose: () => {},
  currentIndex: 0,
});

export const ExCarousel = ({
  items,
  initialScroll = 0
}) => {
  const carouselRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };
  

  const scrollLeft = () => {
    console.log("Left button clicked");
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };
  
  const scrollRight = () => {
    console.log("Right button clicked");
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  

  const handleCardClose = (index) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  return (
    (<CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative h-full w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-20 scroll-smooth [scrollbar-width:none]"
          ref={carouselRef}
          onScroll={checkScrollability}>
          <div
            className={cn(
              "absolute right-0  z-[1000] h-auto  w-[5%] overflow-hidden bg-gradient-to-l"
            )}></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-3 pl-2",
              "min-w-[240px] md:min-w-[360px]",
              "max-w-7xl mx-auto"
            )}>
            {items.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                    once: true,
                  },
                }}
                key={"card" + index}
                className="rounded-3xl">
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mr-20">
          <button
            className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
            onClick={scrollLeft}
            disabled={!canScrollLeft}>
            <IconArrowNarrowLeft className="h-6 w-6 text-gray-500" />
          </button>
          <button
            className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
            onClick={scrollRight}
            disabled={!canScrollRight}>
            <IconArrowNarrowRight className="h-6 w-6 text-gray-500" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>)
  );
};

export const Card = ({ card, index, layout = false }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const { onCardClose } = useContext(CarouselContext);
  
    useEffect(() => {
      if (open) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "auto";
    }, [open]);
  
    useOutsideClick(containerRef, () => handleClose());
  
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
      setOpen(false);
      onCardClose(index);
    };
  
    return (
      <>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[1500] inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div
                ref={containerRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layoutId={layout ? `card-${card.title}` : undefined}
                className="relative w-full max-w-5xl h-full max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 p-6 md:p-10 rounded-3xl shadow-lg">
                <button
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200"
                  onClick={handleClose}>
                  <IconX className="text-gray-500 w-6 h-6" />
                </button>
                <motion.h2 className="text-2xl md:text-4xl font-semibold text-neutral-700 dark:text-white mt-6">
                  {card.title}
                </motion.h2>
                <motion.p className="text-md md:text-lg font-medium text-gray-500 dark:text-gray-300 mt-2 mb-6">
                  {card.category}
                </motion.p>
                <div className="text-gray-800 dark:text-gray-200 py-4">
                  {card.content}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Card Preview */}
        <motion.button
          layoutId={layout ? `card-${card.title}` : undefined}
          onClick={handleOpen}
          className="cursor-pointer rounded-3xl bg-gray-100 dark:bg-neutral-900 shadow-lg h-80 w-56 md:h-[40rem] md:w-96 overflow-hidden flex flex-col items-start justify-start relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-10" />
          <Image
            src={card.src}
            alt={card.title}
            fill
            className="object-cover w-full h-full transition duration-300"
          />
          <div className="relative z-20 p-4">
            <h3 className="text-white font-semibold text-lg md:text-xl">{card.title}</h3>
            <p className="text-sm text-white opacity-80 mt-1">{card.category}</p>
          </div>
        </motion.button>
      </>
    );
  };


export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}) => {
  const [isLoading, setLoading] = useState(true);
  return (
    (<Image
      className={cn("transition duration-300", isLoading ? "blur-sm" : "blur-0", className)}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      blurDataURL={typeof src === "string" ? src : undefined}
      alt={alt ? alt : "Background of a beautiful view"}
      {...rest} />)
  );
};
