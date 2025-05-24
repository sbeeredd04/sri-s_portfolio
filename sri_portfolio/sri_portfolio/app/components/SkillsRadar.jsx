"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Comprehensive skills data for the single radar
const comprehensiveSkillsData = [
  { name: "Frontend", value: 92, color: "rgba(59, 130, 246, 0.8)" }, 
  { name: "Backend", value: 88, color: "rgba(34, 197, 94, 0.8)" }, 
  { name: "Data Science & AI", value: 85, color: "rgba(168, 85, 247, 0.8)" },
  { name: "DevOps & Cloud", value: 80, color: "rgba(6, 182, 212, 0.8)" }, 
  { name: "Professional", value: 90, color: "rgba(239, 68, 68, 0.8)" }, 
  { name: "Programming", value: 95, color: "rgba(245, 158, 11, 0.8)" },
];

export const SkillsRadar = ({ skills = comprehensiveSkillsData, size = 400, className = "" }) => {
  const canvasRef = useRef(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const maxValue = 100;
  
  useEffect(() => {
    if (!canvasRef.current || !skills || skills.length === 0) return;
    
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); 

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) * 0.75; 
    
    ctx.clearRect(0, 0, size, size);
    
    const numSides = skills.length;
    const angle = (2 * Math.PI) / numSides;
    
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius * level) / levels;
      ctx.beginPath();
      for (let i = 0; i < numSides; i++) {
        const x = centerX + levelRadius * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + levelRadius * Math.sin(angle * i - Math.PI / 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = level === levels ? "rgba(99, 102, 241, 0.5)" : `rgba(255, 255, 255, ${0.08 + (level * 0.03)})`;
      ctx.lineWidth = level === levels ? 1.5 : 1;
      ctx.stroke();
      
      if (level < levels && level % 1 === 0) { 
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        const textX = centerX + (levelRadius + 10) * Math.cos(Math.PI / numSides - Math.PI / 2) ; 
        const textY = centerY + (levelRadius + 10) * Math.sin(Math.PI / numSides - Math.PI / 2) ;
        ctx.fillText(`${level * (maxValue/levels)}`, textX, textY +3 );
      }
    }
    
    for (let i = 0; i < numSides; i++) {
      const gradient = ctx.createLinearGradient(centerX, centerY, centerX + radius * Math.cos(angle * i - Math.PI / 2), centerY + radius * Math.sin(angle * i - Math.PI / 2));
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle * i - Math.PI / 2), centerY + radius * Math.sin(angle * i - Math.PI / 2));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.beginPath();
    const dataPoints = [];
    for (let i = 0; i < numSides; i++) {
      const value = skills[i].value / maxValue;
      const dataRadius = radius * value;
      const x = centerX + dataRadius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + dataRadius * Math.sin(angle * i - Math.PI / 2);
      dataPoints.push({ x, y, value, skill: skills[i], index: i });
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    const dataGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    dataGradient.addColorStop(0, "rgba(99, 102, 241, 0.5)");
    dataGradient.addColorStop(0.7, "rgba(99, 102, 241, 0.3)");
    dataGradient.addColorStop(1, "rgba(99, 102, 241, 0.1)");
    ctx.fillStyle = dataGradient;
    ctx.fill();
    
    ctx.strokeStyle = "rgba(129, 140, 248, 0.9)"; 
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(99, 102, 241, 0.6)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    dataPoints.forEach((point, i) => {
      const isHovered = hoveredSkill === i;
      const pointRadius = isHovered ? 7 : 4;
      const skillColor = skills[i].color || "rgba(255, 255, 255, 0.9)";
      
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius + 3, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
        ctx.fill();
      }
      
      ctx.fillStyle = isHovered ? "#c7d2fe" : skillColor; 
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = isHovered ? "#e0e7ff" : "rgba(255, 255, 255, 0.7)"; 
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    
    ctx.shadowBlur = 0;
    for (let i = 0; i < numSides; i++) {
      const labelRadius = radius * 1.20; 
      const x = centerX + labelRadius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + labelRadius * Math.sin(angle * i - Math.PI / 2);
      const isHovered = hoveredSkill === i;
      
      const textMetrics = ctx.measureText(skills[i].name);
      const textWidth = textMetrics.width;
      const textHeight = 14; 
      
      if (isHovered) {
        ctx.fillStyle = "rgba(30, 41, 59, 0.8)"; 
        ctx.beginPath();
        ctx.roundRect(x - textWidth/2 - 6, y - textHeight/2 - 3, textWidth + 12, textHeight + 6, 5);
        ctx.fill();
      }
      
      ctx.fillStyle = isHovered ? "#a5b4fc" : "#e5e7eb"; 
      ctx.font = isHovered ? "bold 11px Inter, sans-serif" : "10px Inter, sans-serif"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      if (!isHovered) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.7)"; 
        ctx.lineWidth = 2.5;
        ctx.strokeText(skills[i].name, x, y);
      }
      ctx.fillText(skills[i].name, x, y);
    }
  }, [skills, size, hoveredSkill]);
  
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) * 0.75;
    const numSides = skills.length;
    const angle = (2 * Math.PI) / numSides;
    let nearestSkill = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < numSides; i++) {
      const value = skills[i].value / maxValue;
      const dataRadius = radius * value;
      const pointX = centerX + dataRadius * Math.cos(angle * i - Math.PI / 2);
      const pointY = centerY + dataRadius * Math.sin(angle * i - Math.PI / 2);
      const labelX = centerX + (radius * 1.20) * Math.cos(angle * i - Math.PI / 2);
      const labelY = centerY + (radius * 1.20) * Math.sin(angle * i - Math.PI / 2);
      
      const pointDist = Math.sqrt((mouseX - pointX) ** 2 + (mouseY - pointY) ** 2);
      const labelDist = Math.sqrt((mouseX - labelX) ** 2 + (mouseY - labelY) ** 2);
      
      const currentMinDist = Math.min(pointDist, labelDist);
      if (currentMinDist < 25 && currentMinDist < minDistance) { 
        minDistance = currentMinDist;
        nearestSkill = i;
      }
    }
    setHoveredSkill(nearestSkill);
  };
  
  const handleMouseLeave = () => setHoveredSkill(null);
  
  return (
    <div className={`relative ${className} w-full h-full flex items-center justify-center`}>
      <canvas
        ref={canvasRef} 
        className="cursor-pointer max-w-full max-h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredSkill !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.2 }}
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px]"
          style={{ left: mousePos.x - canvasRef.current?.getBoundingClientRect().left, top: mousePos.y - canvasRef.current?.getBoundingClientRect().top - 10}}
        >
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl min-w-[150px]">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skills[hoveredSkill].color }}/>
              <p className="font-semibold text-sm text-indigo-300">{skills[hoveredSkill].name}</p>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">Proficiency:</span>
              <span className="text-xs font-bold text-slate-100">{skills[hoveredSkill].value}%</span>
            </div>
            <div className="w-full bg-slate-700/70 rounded-full h-1.5">
              <motion.div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: skills[hoveredSkill].color }}
                initial={{ width: 0 }}
                animate={{ width: `${skills[hoveredSkill].value}%` }}
                transition={{ duration: 0.4, ease: "circOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const SkillsRadarCard = ({ title = "Technical Proficiency Overview", skills = comprehensiveSkillsData, className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl bg-neutral-800/30 backdrop-blur-lg border border-white/10 overflow-hidden h-full flex flex-col ${className}`}
    >
      <div className="p-4 sm:p-6 h-full flex flex-col">
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-white/60">Comprehensive skill assessment</p>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0 w-full relative aspect-square max-w-md mx-auto">
          <SkillsRadar skills={skills} size={300} /> 
        </div>
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
          {skills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: skill.color }}/>
              <span className="text-white/80 truncate">{skill.name}</span>
              {/* <span className="text-white/60 ml-auto font-medium">{skill.value}%</span> */}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SkillsRadar; 