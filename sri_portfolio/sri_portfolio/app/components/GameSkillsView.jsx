"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillsRadar, SkillsRadarCard } from './SkillsRadar';
import { SkillsDetail, SkillCategoryCard } from './SkillsDetail';
import { SkillGameStats } from './SkillGameStats';
import { IconChartRadar, IconList, IconDeviceGamepad2, IconTrophy } from '@tabler/icons-react';

// Tab button component
const TabButton = ({ active, label, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
        active 
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
          : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// Main GameSkillsView component - redesigned with sticky scroll
export const GameSkillsView = ({ radarSkills, detailedSkills, playerStats, achievements, activeView = 'overview' }) => {
  const [activeRadar, setActiveRadar] = useState(0);
  const scrollRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const scrollTop = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      const scrollProgress = scrollTop / scrollHeight;
      
      // Switch between radar charts based on scroll progress
      const newActiveRadar = scrollProgress > 0.3 ? 1 : 0;
      setActiveRadar(newActiveRadar);
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Render based on active view
  if (activeView === 'stats') {
    return (
      <div className="w-full h-full p-4">
        <SkillGameStats 
          playerStats={playerStats} 
          achievements={[]}
        />
      </div>
    );
  }
  
  if (activeView === 'achievements') {
    return (
      <div className="w-full h-full p-4">
        <SkillGameStats 
          playerStats={{ level: 0, xp: 0, nextLevelXp: 0, stats: [] }}
          achievements={achievements}
        />
      </div>
    );
  }
  
  // Default overview with sticky scroll layout
  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-4">
      {/* Left Side - Sticky Radar Charts */}
      <div className="lg:w-2/5 lg:sticky lg:top-0 lg:h-fit">
        <div className="space-y-6">
          {/* Radar Chart Switcher Indicator */}
          <div className="flex justify-center gap-2 lg:hidden">
            {radarSkills.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeRadar === index ? 'bg-blue-400 w-6' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          
          {/* Active Radar Chart */}
          <motion.div
            key={activeRadar}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <SkillsRadarCard
              title={radarSkills[activeRadar]?.title}
              skills={radarSkills[activeRadar]?.skills}
              className="w-full"
            />
          </motion.div>
          
          {/* Legend for larger screens */}
          <div className="hidden lg:block">
            <div className="rounded-xl bg-neutral-800/10 backdrop-blur-xl border border-white/10 p-4">
              <h4 className="text-sm font-semibold text-white/90 mb-3">Navigation</h4>
              <div className="space-y-2 text-xs text-white/70">
                <p>• Scroll right panel to explore skills</p>
                <p>• Hover radar points for details</p>
                <p>• Charts auto-switch based on scroll</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Scrollable Detailed Skills */}
      <div className="lg:w-3/5 flex-1">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-transparent pr-2"
          style={{ 
            maxHeight: 'calc(100vh - 200px)',
            overscrollBehavior: 'contain' 
          }}
        >
          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Detailed Skills & Technologies
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl">
              Comprehensive breakdown of my technical expertise across different domains, 
              including programming languages, frameworks, tools, and interpersonal skills.
            </p>
          </div>
          
          {/* Skills Categories Grid */}
          <div className="space-y-6">
            {detailedSkills.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <SkillCategoryCard
                  category={category.name}
                  skills={category.skills}
                  badges={category.badges}
                  color={getCategoryColor(category.name)}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Bottom spacing for better scroll experience */}
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get category colors
const getCategoryColor = (categoryName) => {
  const colorMap = {
    "Programming Languages": "blue",
    "Frontend Development": "amber",
    "Backend Development": "emerald",
    "Data Science & ML": "rose",
    "DevOps & Cloud": "violet",
    "Mobile Development": "emerald",
    "Design & Creative Tools": "amber",
    "Development Tools": "blue",
    "Interpersonal Skills": "rose",
  };
  return colorMap[categoryName] || "emerald";
};

export default GameSkillsView; 