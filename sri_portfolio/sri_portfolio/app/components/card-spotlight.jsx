import { motion, useMotionValue } from "framer-motion";
import React, { useState } from "react";
import { cn } from "../lib/utils";

export const CardSpotlight = ({
  children,
  radius = 50, // Default spotlight radius
  spotlightColor = "#ffffff88", // Spotlight color with transparency
  backgroundColor = "#262626", // Card background color
  className,
  ...props
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Handle mouse movement to update spotlight position
  const handleMouseMove = (event) => {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  };

  // State to track if the card is being hovered
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn(
        "group relative p-8 rounded-lg border border-gray-800 bg-black overflow-hidden", // Tailwind CSS for styling
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      {/* Spotlight effect */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${mouseX.get()}px ${mouseY.get()}px, ${spotlightColor} ${radius}px, ${backgroundColor} 100%)`,
          opacity: isHovering ? 1 : 0,
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
