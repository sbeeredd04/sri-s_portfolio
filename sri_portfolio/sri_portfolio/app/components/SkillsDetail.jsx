"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { IconStar } from '@tabler/icons-react';

// Progress bar component for skill ratings
const SkillBar = ({ name, percentage, color = "emerald" }) => {
  const colorMap = {
    emerald: "from-emerald-500 to-cyan-500",
    amber: "from-amber-500 to-orange-500",
    violet: "from-violet-500 to-fuchsia-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  };
  
  const gradientClass = colorMap[color] || colorMap.emerald;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-white">{name}</span>
        <div className="flex items-center gap-1">
          {/* Render stars based on percentage */}
          {[1, 2, 3, 4, 5].map((star) => (
            <IconStar
              key={star}
              size={12}
              fill={percentage >= star * 20 ? "currentColor" : "none"}
              className={percentage >= star * 20 ? "text-yellow-400" : "text-gray-500"}
            />
          ))}
          <span className="text-xs text-white/70 ml-1">{percentage}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-700/30 rounded-full h-2.5 backdrop-blur-lg">
        <motion.div 
          className={`h-2.5 rounded-full bg-gradient-to-r ${gradientClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

// Badge component for technology icons
export const TechBadge = ({ icon, className = "" }) => {
  return (
    <div className={`p-1 ${className}`}>
      <img 
        src={icon} 
        alt="Technology" 
        className="h-8 hover:scale-110 transition-transform duration-200" 
      />
    </div>
  );
};

// Skill category card component
export const SkillCategoryCard = ({ category, skills, badges = [], color = "emerald" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-neutral-800/20 backdrop-blur-lg border border-white/10 overflow-hidden h-full"
    >
      <div className="px-4 py-3 md:p-6">
        <h3 className="text-md md:text-xl font-semibold text-white/90 mb-4">{category}</h3>
        
        {/* Skill bars */}
        <div className="space-y-2">
          {skills.map((skill, index) => (
            <SkillBar 
              key={index} 
              name={skill.name} 
              percentage={skill.percentage} 
              color={color}
            />
          ))}
        </div>
        
        {/* Technology badges */}
        {badges.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm text-white/70 mb-2">Technologies</h4>
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge, index) => (
                <TechBadge key={index} icon={badge} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Skills Detail component
export const SkillsDetail = ({ categories }) => {
  // Define color scheme for each category
  const categoryColors = {
    "Programming Languages": "blue",
    "Frontend Development": "amber",
    "Backend Development": "emerald",
    "DevOps & Infrastructure": "violet",
    "Data Science & ML": "rose",
    "Mobile & Cross-Platform": "emerald", 
    "Design & UX": "amber",
    "Tools & Environments": "blue",
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
      {categories.map((category, index) => (
        <SkillCategoryCard 
          key={index}
          category={category.name}
          skills={category.skills}
          badges={category.badges || []}
          color={categoryColors[category.name] || "emerald"}
        />
      ))}
    </div>
  );
};

export default SkillsDetail; 