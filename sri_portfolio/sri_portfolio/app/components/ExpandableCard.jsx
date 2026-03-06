"use client";
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
import { renderMarkdown } from "../utils/markdown";

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
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };
  
  const scrollRight = () => {
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
    return typeof window !== 'undefined' && window.innerWidth < 768;
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
            className="relative z-40 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-all"
            onClick={scrollLeft}
            disabled={!canScrollLeft}>
            <IconArrowNarrowLeft className="h-6 w-6 text-white/70" />
          </button>
          <button
            className="relative z-40 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-all"
            onClick={scrollRight}
            disabled={!canScrollRight}>
            <IconArrowNarrowRight className="h-6 w-6 text-white/70" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>)
  );
};

// Update the Card component to render HTML content
// Card Component to Render HTML Content with Improved Styling

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
            className="fixed z-[1500] inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative w-full max-w-5xl h-full max-h-[90vh] overflow-y-auto glass-dark p-6 md:p-10 shadow-lg"
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                onClick={handleClose}
              >
                <IconX className="text-white/60 w-5 h-5" />
              </button>
              <motion.h2 className="text-2xl md:text-4xl font-semibold text-white mt-6">
                {card.title}
              </motion.h2>
              <motion.p className="text-md md:text-lg font-medium text-white/50 mt-2 mb-6">
                {card.category}
              </motion.p>
              {/* Render markdown content */}
              <div
                className="markdown-content text-white/80 py-4 blog-content prose prose-invert max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(card.content)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Preview */}
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="cursor-pointer rounded-3xl glass-light h-96 w-56 md:h-[45rem] md:w-96 overflow-hidden flex flex-col items-center justify-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-10" />
        <Image
          src={card.src}
          alt={card.title}
          fill
          className="object-cover w-full h-full transition duration-300 filter blur-sm"
        />
        <div className="relative z-20 p-4 text-center">
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