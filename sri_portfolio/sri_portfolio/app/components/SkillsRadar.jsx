"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const SkillsRadar = ({ skills, size = 500, className = "" }) => {
  const canvasRef = useRef(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const maxValue = 100;
  
  useEffect(() => {
    if (!canvasRef.current || !skills || skills.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    // Clear canvas with glass morphism background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle background glow
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
    bgGradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const numSides = skills.length;
    const angle = (2 * Math.PI) / numSides;
    
    // Draw background grid with glass effect
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius * level) / levels;
      
      ctx.beginPath();
      for (let i = 0; i < numSides; i++) {
        const x = centerX + levelRadius * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + levelRadius * Math.sin(angle * i - Math.PI / 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // Glass morphism effect for grid
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + (level * 0.01)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 + (level * 0.05)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Draw animated axes with glow
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
    
    for (let i = 0; i < numSides; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const x = centerX + radius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + radius * Math.sin(angle * i - Math.PI / 2);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw animated data polygon with enhanced gradient
    ctx.beginPath();
    const dataPoints = [];
    
    for (let i = 0; i < numSides; i++) {
      const value = skills[i].value / maxValue;
      const dataRadius = radius * value;
      const x = centerX + dataRadius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + dataRadius * Math.sin(angle * i - Math.PI / 2);
      dataPoints.push({ x, y, value, skill: skills[i] });
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    
    // Enhanced gradient for data polygon
    const dataGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    dataGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
    dataGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.6)");
    dataGradient.addColorStop(1, "rgba(236, 72, 153, 0.4)");
    
    ctx.fillStyle = dataGradient;
    ctx.fill();
    
    // Enhanced stroke with glow effect
    ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw enhanced data points with pulsing effect
    dataPoints.forEach((point, i) => {
      const isHovered = hoveredSkill === i;
      const pulseRadius = isHovered ? 8 : 6;
      
      // Outer glow
      const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pulseRadius * 3);
      glow.addColorStop(0, `rgba(59, 130, 246, ${isHovered ? 0.8 : 0.4})`);
      glow.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulseRadius * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Main dot with glass effect
      ctx.fillStyle = isHovered ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulseRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner highlight
      ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulseRadius * 0.6, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw labels with glass morphism backgrounds
    ctx.fillStyle = "#fff";
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    for (let i = 0; i < numSides; i++) {
      const labelRadius = radius * 1.2;
      const x = centerX + labelRadius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + labelRadius * Math.sin(angle * i - Math.PI / 2);
      
      const isHovered = hoveredSkill === i;
      const textWidth = ctx.measureText(skills[i].name).width;
      const padding = 8;
      
      // Glass morphism background for labels
      ctx.fillStyle = isHovered 
        ? "rgba(59, 130, 246, 0.2)" 
        : "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        x - textWidth / 2 - padding, 
        y - 12, 
        textWidth + padding * 2, 
        24
      );
      
      // Border for hovered labels
      if (isHovered) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x - textWidth / 2 - padding, 
          y - 12, 
          textWidth + padding * 2, 
          24
        );
      }
      
      // Text with enhanced visibility
      ctx.fillStyle = isHovered ? "#60a5fa" : "#fff";
      ctx.font = isHovered ? "bold 14px Inter" : "14px Inter";
      ctx.fillText(skills[i].name, x, y);
    }
    
  }, [skills, size, hoveredSkill]);
  
  // Handle mouse interactions
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    const numSides = skills.length;
    const angle = (2 * Math.PI) / numSides;
    
    // Check if mouse is near any data point
    let nearestSkill = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < numSides; i++) {
      const value = skills[i].value / maxValue;
      const dataRadius = radius * value;
      const x = centerX + dataRadius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + dataRadius * Math.sin(angle * i - Math.PI / 2);
      
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance < 30 && distance < minDistance) {
        minDistance = distance;
        nearestSkill = i;
      }
    }
    
    setHoveredSkill(nearestSkill);
  };
  
  const handleMouseLeave = () => {
    setHoveredSkill(null);
  };
  
  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Enhanced tooltip */}
      {hoveredSkill !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute z-10 pointer-events-none"
          style={{
            left: mousePos.x - 50,
            top: mousePos.y - 70,
          }}
        >
          <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg p-3 text-white shadow-xl">
            <p className="font-semibold text-sm text-blue-300">{skills[hoveredSkill].name}</p>
            <p className="text-xs text-white/80">Proficiency: {skills[hoveredSkill].value}%</p>
            <div className="w-full bg-gray-700/30 rounded-full h-1.5 mt-2">
              <div 
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${skills[hoveredSkill].value}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced legend */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-lg rounded-lg py-2 px-3 border border-white/10">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <span className="text-xs text-white/80 font-medium">Skill Level</span>
      </div>
    </div>
  );
};

export const SkillsRadarCard = ({ title, skills, className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl bg-neutral-800/10 backdrop-blur-xl border border-white/10 overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 text-center">{title}</h3>
        <div className="w-full h-[300px] md:h-[400px] lg:h-[450px]">
          <SkillsRadar skills={skills} size={450} />
        </div>
      </div>
    </motion.div>
  );
};

export default SkillsRadar; 