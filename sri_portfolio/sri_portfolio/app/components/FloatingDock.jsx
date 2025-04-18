import React from 'react';
import { cn } from "../lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState} from "react";


// FloatingDock component updated to switch between desktop and mobile views based on screen size
export const FloatingDock = ({ items, desktopClassName, mobileClassName }) => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768); // Adjust breakpoint as per your requirement
    };
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop ? (
    <FloatingDockDesktop items={items} className={desktopClassName} />
  ) : (
    <FloatingDockMobile items={items} className={mobileClassName} />
  );
};

// Mobile FloatingDock with icon enlargement on hover
const FloatingDockMobile = ({ items, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-3 left-0 right-0 z-50 flex justify-center z-[900]",
        className
      )}
    >
      <div className="w-auto rounded-xl bg-neutral-800/60 backdrop-blur-3xl border border-white/10 shadow-lg px-3 py-2">
        <div className={`flex ${open ? 'gap-4' : 'gap-3'} items-center justify-center`}>
          {/* Icons Section */}
          {items.map((item) => (
            <IconContainerMobile
              key={item.title}
              {...item}
            />
          ))}
          {/* Logo Section */}
          <div className="w-8 h-8 flex items-center justify-center border-l border-white/10 pl-3 ml-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Toggle button to open/close icons */}
      <button
        onClick={() => setOpen(!open)}
        className={`h-8 w-8 rounded-xl bg-neutral-800/60 backdrop-blur-3xl border border-white/10 shadow-lg flex items-center justify-center ml-2 ${open ? '' : 'hidden'}`}
      >
        <IconLayoutNavbarCollapse className="h-4 w-4 text-white stroke-[1.5]" />
      </button>
    </div>
  );
};

// Mobile-specific IconContainer with enlarging animation based on horizontal mouse movement
const IconContainerMobile = ({ title, icon, onClick, isActive }) => {
  return (
    <div
      onClick={onClick}
      className="aspect-square w-8 h-8 flex items-center justify-center relative cursor-pointer"
    >
      <div
        className={`flex items-center justify-center ${isActive ? 'text-blue-500' : 'text-white'}`}
      >
        {React.cloneElement(icon, { 
          className: `${isActive ? 'h-7 w-7' : 'h-5 w-5'} ${isActive ? 'stroke-[3]' : 'stroke-[1.5]'}`
        })}
      </div>
    </div>
  );
};


// Updated FloatingDockDesktop to fix position on left side
const FloatingDockDesktop = ({ items, className }) => {
  let mouseX = useMotionValue(Infinity);
  
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageY)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "fixed left-4 top-1/2 transform -translate-y-1/2 h-auto w-16 gap-6 items-center rounded-3xl bg-neutral-800/60 backdrop-blur-xl border border-white/10 shadow-lg px-2 py-4",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Icons Section */}
        {items.map((item) => (
          <IconContainer mouseX={mouseX} key={item.title} {...item} />
        ))}
        {/* Logo Section */}
        <div className="w-12 h-12 flex items-center justify-center border-t border-white/10 pt-4 mt-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
      </div>
    </motion.div>
  );
};




// Updated IconContainer to handle onClick events
function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
  isActive
}) {
  let ref = useRef(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [36, 72, 36]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [36, 72, 36]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);
  let heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="aspect-square flex items-center justify-center relative cursor-pointer"
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, y: "-50%" }}
            animate={{ opacity: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, x: -10, y: "-50%" }}
            className="px-3 py-1.5 whitespace-pre rounded-lg bg-neutral-800/60 backdrop-blur-3xl border border-white/10 shadow-lg absolute left-full ml-2 w-fit text-xs text-white"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className={`flex items-center justify-center ${isActive ? 'text-blue-500' : 'text-white'}`}
      >
        {React.cloneElement(icon, { 
          className: `${isActive ? 'h-7 w-7' : 'h-5 w-5'} ${isActive ? 'stroke-[3]' : 'stroke-[1.5]'}`
        })}
      </motion.div>
    </motion.div>
  );
}
