// FloatingDock component remains unchanged
import { cn } from "../lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
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
  let mouseX = useMotionValue(Infinity);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center z-[900]",
        className
      )}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      <div className={`flex ${open ? 'gap-4' : 'gap-2'} items-center`}>
        {items.map((item) => (
          <IconContainerMobile
            key={item.title}
            mouseX={mouseX}
            {...item}
          />
        ))}
      </div>

      {/* Toggle button to open/close icons */}
      <button
        onClick={() => setOpen(!open)}
        className={`h-10 w-10 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center ml-4 ${open ? '' : 'hidden'}`}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  );
};

// Mobile-specific IconContainer with enlarging animation based on horizontal mouse movement
const IconContainerMobile = ({ mouseX, title, icon, href }) => {
  const ref = useRef(null);

  // Calculate the distance of the icon from the mouse's X position
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthIcon = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width: widthIcon, height: heightIcon }}
        className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center relative"
      >
        <motion.div
          className="flex items-center justify-center"
          style={{ width: widthIcon, height: heightIcon }}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
};


// Updated FloatingDockDesktop to fix position on left side
const FloatingDockDesktop = ({ items, className }) => {
  let mouseX = useMotionValue(Infinity);
  
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageY)} // Track Y-axis mouse movement
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        // Applying white border, making container translucent and setting padding
        "fixed left-4 top-1/2 transform -translate-y-1/2 h-auto w-16 gap-8 items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 bg-opacity-50 border border-white px-3 py-3",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};




// Updated IconContainer to grow towards the right
function IconContainer({
  mouseX,
  title,
  icon,
  href,
}) {
  let ref = useRef(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

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
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center relative mb-4" // Added mb-4 for margin between icons
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -10, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%" }}
              exit={{ opacity: 0, x: -10, y: "-50%" }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute left-full ml-2 w-fit text-xs"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
