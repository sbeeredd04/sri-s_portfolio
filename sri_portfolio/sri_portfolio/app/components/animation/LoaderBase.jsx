import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * LoaderBase
 * 
 * Core animation logic for circular progress display
 * Responsibilities:
 * - SVG circular progress ring rendering
 * - Progress state management
 * - Interactive hover effects with directional fill
 * - Mouse tracking for interactive gradients
 * 
 * ~300 LOC
 */
function LoaderBase({ progress, showStartButton, onMouseMove, onMouseEnter, onMouseLeave, isHovered, containerRef }) {
  const radius = 90;
  const strokeWidth = 5;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, angle: 0 });
  const [fillProgress, setFillProgress] = useState(0);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      const angle = Math.atan2(mouseY, mouseX);
      
      const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      const normalizedDistance = Math.min(distance / radius, 1);
      
      setMousePosition({ 
        x: mouseX, 
        y: mouseY, 
        angle: angle,
        distance: normalizedDistance,
        centerX: centerX,
        centerY: centerY
      });

      if (onMouseMove) onMouseMove(mousePosition);
    }
  };

  const handleMouseEnter = () => {
    setFillProgress(1);
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = () => {
    setFillProgress(0);
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="transform -rotate-90 relative z-10"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <radialGradient 
          id="directionalFill" 
          cx={showStartButton ? `${50 + (mousePosition.x / radius) * 50}%` : "50%"}
          cy={showStartButton ? `${50 + (mousePosition.y / radius) * 50}%` : "50%"}
          r="100%"
        >
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="40%" stopColor="white" stopOpacity="0.95" />
          <stop offset="80%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0.6" />
        </radialGradient>
        
        <mask id="directionalMask">
          <rect width="100%" height="100%" fill="black" />
          <motion.circle
            fill="white"
            initial={{ 
              r: 0,
              cx: radius,
              cy: radius
            }}
            animate={{ 
              r: fillProgress * (normalizedRadius * 1.5),
              cx: radius + mousePosition.x,
              cy: radius + mousePosition.y
            }}
            transition={{ 
              duration: 0.6, 
              ease: [0.25, 0.1, 0.25, 1],
              type: "tween"
            }}
          />
        </mask>
      </defs>

      <circle
        stroke="rgba(255, 255, 255, 0)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      
      {showStartButton && isHovered && (
        <circle
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          fill="url(#directionalFill)"
          stroke="none"
          mask="url(#directionalMask)"
        />
      )}
      
      <motion.circle
        stroke="white"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        initial={{ strokeDashoffset: circumference }}
        animate={{ 
          strokeDashoffset: strokeDashoffset
        }}
        transition={{ 
          strokeDashoffset: { duration: 0.3, ease: "easeOut" }
        }}
        style={{
          zIndex: 2
        }}
      />
    </svg>
  );
}

export default LoaderBase;
