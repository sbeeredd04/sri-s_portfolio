import React from 'react';
import { cn } from "../lib/utils";
import { IconLayoutNavbarCollapse, IconChevronRight, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState} from "react";


// FloatingDock component updated to switch between desktop and mobile views based on screen size
export const FloatingDock = ({ items, desktopClassName, mobileClassName, id }) => {
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
    <FloatingDockDesktop items={items} className={desktopClassName} id={id} />
  ) : (
    <FloatingDockMobile items={items} className={mobileClassName} id={id} />
  );
};

// Draggable button that triggers the menu
const DraggableMenuButton = ({ onClick, x, y, onDragEnd, dragBounds, initialPositionSet, id }) => {
  const buttonRef = useRef(null);
  const [isReadyToDrag, setIsReadyToDrag] = useState(false);

  useEffect(() => {
    if (initialPositionSet.current && dragBounds && dragBounds.right > dragBounds.left && dragBounds.bottom > dragBounds.top) {
      setIsReadyToDrag(true);
    } else {
      setIsReadyToDrag(false);
    }
  }, [initialPositionSet, dragBounds]);

  return (
    <motion.button
      id={id}
      ref={buttonRef}
      drag={isReadyToDrag}
      dragMomentum={false}
      dragConstraints={isReadyToDrag ? dragBounds : undefined}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ 
        x, 
        y,
        position: 'fixed', // Always fixed once mounted and positioned
        touchAction: 'none',
      }}
      initial={{ opacity: 0, scale: 0.9 }} // Initial state for animation
      animate={{ // Animate to visible once initialPositionSet is true
        opacity: initialPositionSet.current ? 1 : 0, 
        scale: initialPositionSet.current ? 1 : 0.9 
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      // Outer circle: slightly larger padding, translucent background
      className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/20 shadow-xl z-[1000] cursor-grab active:cursor-grabbing"
      aria-label="Open navigation menu"
      whileTap={{ scale: 0.95 }} // Adjusted whileTap for outer button
    >
      {/* Inner circle: more opaque, smaller */}
      <div className="w-9 h-9 rounded-full bg-black/90 flex items-center justify-center shadow-md">
        <Image src="/logo.png" alt="Menu" width={20} height={20} className="object-contain" /> 
      </div>
    </motion.button>
  );
};

// The expanded menu panel
const ExpandedMenuPanel = ({ items, onClose, anchorRect }) => {
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, opacity: 0 });
  
  const MENU_WIDTH = 200; // Approx width of 3 icons + padding
  const MENU_HEIGHT = 200; // Approx height of 3 icons + padding
  const PADDING = 16; // Screen edge padding
  const BUTTON_TO_MENU_OFFSET = 12; // Increased offset slightly

  useEffect(() => {
    if (!anchorRect || typeof window === 'undefined') return;

    const { x: btnX, y: btnY, width: btnWidth, height: btnHeight } = anchorRect;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let idealLeft, idealTop;

    const buttonIsLeftHalf = btnX + btnWidth / 2 < screenWidth / 2;
    
    // Position menu horizontally
    if (buttonIsLeftHalf) {
      idealLeft = btnX + btnWidth + BUTTON_TO_MENU_OFFSET; 
    } else {
      idealLeft = btnX - MENU_WIDTH - BUTTON_TO_MENU_OFFSET; 
    }

    // Position menu vertically: try to center it with the button
    idealTop = btnY + btnHeight / 2 - MENU_HEIGHT / 2;
    
    // Clamp to viewport
    const finalLeft = Math.max(PADDING, Math.min(idealLeft, screenWidth - MENU_WIDTH - PADDING));
    const finalTop = Math.max(PADDING, Math.min(idealTop, screenHeight - MENU_HEIGHT - PADDING));
    
    setMenuPosition({ top: finalTop, left: finalLeft, opacity: 1 });

  }, [anchorRect, MENU_WIDTH, MENU_HEIGHT, PADDING, BUTTON_TO_MENU_OFFSET]);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Create a 3x3 grid layout for up to 8 items + 1 close button (logo)
  // Items: Home, About, Exp, Proj, Skills, Blog, Contact (7 items)
  // The logo in the center will be the close button.
  const gridItems = [...items]; // Max 7 items + 1 close
  const displayItems = [];
  
  // Define the 3x3 grid slots and assign items
  // Order: Top-L, Top-C, Top-R, Mid-L, (Close), Mid-R, Bot-L, Bot-C, Bot-R
  const slotOrder = [0, 1, 2, 3, null, 4, 5, 6, 7]; // null is for the central close button

  slotOrder.forEach((itemIndex, i) => {
    if (itemIndex === null) { // Center slot for Close button
      displayItems.push(
        <motion.button
          key="close-menu"
          onClick={onClose}
          className="aspect-square w-14 h-14 flex items-center justify-center relative cursor-pointer rounded-2xl bg-neutral-700/50 hover:bg-neutral-600/60 transition-colors"
          whileTap={{ scale: 0.9 }}
          aria-label="Close menu"
        >
          <IconX size={24} className="text-white" />
        </motion.button>
      );
    } else if (gridItems[itemIndex]) {
      displayItems.push(<IconContainerMobile key={gridItems[itemIndex].title} {...gridItems[itemIndex]} />);
    } else {
      displayItems.push(<div key={`empty-${i}`} className="w-14 h-14" />); // Empty slot
    }
  });


  if (!anchorRect) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: menuPosition.opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2, ease: "circOut" }}
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        width: MENU_WIDTH,
        height: MENU_HEIGHT,
      }}
      className="grid grid-cols-3 grid-rows-3 gap-2 p-3 rounded-3xl bg-black/100 border border-white/10 shadow-2xl z-[999]"
    >
      {displayItems}
    </motion.div>
  );
};

// Mobile FloatingDock - Assistive Touch Style
const FloatingDockMobile = ({ items, className, id }) => {
  const [open, setOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState(null); // To store position of the button
  
  const PADDING = 16; // Screen edge padding
  const BUTTON_SIZE = 46; // Approximate size of the draggable button (p-2.5 -> 10, image 28 -> 38 + border ~46)
  const ELEVATION_FROM_BOTTOM = 20; // How much to raise the button from the very bottom

  // Ensure initial constraints are always valid
  const getInitialConstraints = () => {
    const safeScreenWidth = typeof window !== 'undefined' ? window.innerWidth : 320; // Default safe width
    const safeScreenHeight = typeof window !== 'undefined' ? window.innerHeight : 480; // Default safe height
    return {
      left: PADDING,
      right: Math.max(PADDING + BUTTON_SIZE, safeScreenWidth - BUTTON_SIZE - PADDING),
      top: PADDING,
      bottom: Math.max(PADDING + BUTTON_SIZE, safeScreenHeight - BUTTON_SIZE - PADDING),
    };
  };

  // Initial position: bottom-right, slightly elevated
  const x = useMotionValue(typeof window !== 'undefined' ? window.innerWidth - BUTTON_SIZE - PADDING : PADDING);
  const y = useMotionValue(typeof window !== 'undefined' ? window.innerHeight - BUTTON_SIZE - PADDING - ELEVATION_FROM_BOTTOM : PADDING);
  const initialPositionSet = useRef(false);
  const constraintsRef = useRef(getInitialConstraints());


  useEffect(() => {
    const updateInitialPositionAndConstraints = () => {
      if (typeof window !== "undefined") {
        const newRightConstraint = window.innerWidth - BUTTON_SIZE - PADDING;
        const newBottomConstraint = window.innerHeight - BUTTON_SIZE - PADDING;
        
        constraintsRef.current = {
          left: PADDING,
          right: Math.max(PADDING + BUTTON_SIZE, newRightConstraint),
          top: PADDING,
          bottom: Math.max(PADDING + BUTTON_SIZE, newBottomConstraint),
        };

        if (!initialPositionSet.current) {
          const initialX = Math.min(constraintsRef.current.right, Math.max(constraintsRef.current.left, window.innerWidth - BUTTON_SIZE - PADDING));
          const initialY = Math.min(constraintsRef.current.bottom, Math.max(constraintsRef.current.top, window.innerHeight - BUTTON_SIZE - PADDING - ELEVATION_FROM_BOTTOM));
          
          x.set(initialX);
          y.set(initialY);
          setButtonRect({ x: initialX, y: initialY, width: BUTTON_SIZE, height: BUTTON_SIZE });
          initialPositionSet.current = true;
        } else {
            const currentX = x.get();
            const currentY = y.get();
            x.set(Math.max(constraintsRef.current.left, Math.min(currentX, constraintsRef.current.right)));
            y.set(Math.max(constraintsRef.current.top, Math.min(currentY, constraintsRef.current.bottom)));
            setButtonRect({ x: x.get(), y: y.get(), width: BUTTON_SIZE, height: BUTTON_SIZE });
        }
      }
    };
    // Delay slightly to ensure window dimensions are stable, especially on mobile
    const timerId = setTimeout(updateInitialPositionAndConstraints, 50);
    window.addEventListener('resize', updateInitialPositionAndConstraints);
    return () => {
        clearTimeout(timerId);
        window.removeEventListener('resize', updateInitialPositionAndConstraints);
    };
  }, [x, y]); // Dependencies are x, y for re-clamping

  const handleDragEnd = (event, info) => {
    if (typeof window === 'undefined') return;

    let targetX;
    if (info.point.x + BUTTON_SIZE / 2 < window.innerWidth / 2) {
      targetX = PADDING;
    } else {
      targetX = window.innerWidth - BUTTON_SIZE - PADDING;
    }
    // For Y, clamp within vertical constraints including the elevation
    const targetY = Math.max(PADDING, Math.min(info.point.y, window.innerHeight - BUTTON_SIZE - PADDING ));
    
    animate(x, targetX, { type: "spring", stiffness: 500, damping: 30 });
    animate(y, targetY, { type: "spring", stiffness: 500, damping: 30 });
    
    setButtonRect({ x: targetX, y: targetY, width: BUTTON_SIZE, height: BUTTON_SIZE });
  };

  const toggleMenu = () => {
    if (!open) {
      setButtonRect({ x: x.get(), y: y.get(), width: BUTTON_SIZE, height: BUTTON_SIZE });
    }
    setOpen(!open);
  };

  return (
    <>
      <DraggableMenuButton 
        onClick={toggleMenu} 
        x={x} 
        y={y} 
        onDragEnd={handleDragEnd}
        dragBounds={constraintsRef.current}
        initialPositionSet={initialPositionSet}
        id={id}
      />
      <AnimatePresence>
        {open && (
          <ExpandedMenuPanel 
            items={items} 
            onClose={() => setOpen(false)} 
            anchorRect={buttonRect} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Mobile-specific IconContainer: ensure it fits in the new grid
const IconContainerMobile = ({ title, icon, onClick, isActive }) => {
  return (
    <motion.div
      onClick={onClick}
      className="w-14 h-14 flex flex-col items-center justify-center relative cursor-pointer rounded-2xl hover:bg-neutral-700/60 transition-colors p-1" // Removed bg-neutral-800/60
      title={title}
      whileTap={{ scale: 0.9 }}
      aria-label={title}
    >
      <div
        className={`flex items-center justify-center transition-colors rounded-full p-1 ${isActive ? 'text-blue-400' : 'text-neutral-300 hover:text-white'}`} // Removed active bg
      >
        {React.cloneElement(icon, { 
          className: `transition-all ${isActive ? 'h-5 w-5 stroke-[2]' : 'h-5 w-5 stroke-[1.8]'}` 
        })}
      </div>
      <span className="text-[10px] text-white/70 mt-0.5 truncate w-full text-center">{title}</span>
    </motion.div>
  );
};

// Updated FloatingDockDesktop to fix position on left side
const FloatingDockDesktop = ({ items, className, id }) => {
  let mouseX = useMotionValue(Infinity);
  
  return (
    <motion.div
      id={id}
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
