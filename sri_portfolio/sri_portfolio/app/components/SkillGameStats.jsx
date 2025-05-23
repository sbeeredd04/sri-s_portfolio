"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  IconTrophy, 
  IconSword, 
  IconShield, 
  IconBrain, 
  IconRocket, 
  IconDeviceDesktop, 
  IconServer, 
  IconCloud,
  IconPalette,
  IconDatabase,
  IconCode,
  IconTools
} from '@tabler/icons-react';

// XP Bar component
const XPBar = ({ level, xp, nextLevelXp, color = "cyan" }) => {
  const percentage = (xp / nextLevelXp) * 100;
  
  const colorMap = {
    cyan: "from-cyan-500 to-blue-500",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-green-500",
    purple: "from-purple-500 to-violet-500",
    rose: "from-rose-500 to-pink-500",
  };
  
  const gradientClass = colorMap[color] || colorMap.cyan;
  
  return (
    <div className="w-full mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-white/80">Level {level}</span>
        <span className="text-xs text-white/60">{xp}/{nextLevelXp} XP</span>
      </div>
      <div className="relative w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
        <motion.div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradientClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
};

// Stat item component
const StatItem = ({ icon, name, value, color = "white" }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
      <div className={`p-2 rounded-lg bg-black/30 text-${color}-400`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/60">{name}</p>
        <p className={`text-lg font-bold text-${color}-400`}>{value}</p>
      </div>
    </div>
  );
};

// Achievement item component
const AchievementItem = ({ icon, name, description, unlocked = true }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      unlocked 
        ? "bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/30" 
        : "bg-gray-800/30 border-gray-700/30 opacity-60"
    }`}>
      <div className={`p-2 rounded-full ${
        unlocked ? "bg-amber-500/20 text-amber-400" : "bg-gray-700/30 text-gray-500"
      }`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-medium ${unlocked ? "text-amber-300" : "text-gray-400"}`}>{name}</p>
        <p className="text-xs text-white/60">{description}</p>
      </div>
      {unlocked && (
        <div className="ml-auto">
          <IconTrophy className="text-amber-400" size={18} />
        </div>
      )}
    </div>
  );
};

// Main SkillGameStats component
export const SkillGameStats = ({ playerStats, achievements }) => {
  const getIconForStat = (stat) => {
    switch(stat.toLowerCase()) {
      case 'strength': return <IconSword size={20} />;
      case 'defense': return <IconShield size={20} />;
      case 'intelligence': return <IconBrain size={20} />;
      case 'agility': return <IconRocket size={20} />;
      case 'frontend': return <IconDeviceDesktop size={20} />;
      case 'backend': return <IconServer size={20} />;
      case 'devops': return <IconCloud size={20} />;
      case 'design': return <IconPalette size={20} />;
      case 'database': return <IconDatabase size={20} />;
      case 'algorithms': return <IconCode size={20} />;
      case 'tools': return <IconTools size={20} />;
      default: return <IconCode size={20} />;
    }
  };
  
  const getColorForStat = (stat) => {
    switch(stat.toLowerCase()) {
      case 'strength': return 'red';
      case 'defense': return 'blue';
      case 'intelligence': return 'violet';
      case 'agility': return 'green';
      case 'frontend': return 'amber';
      case 'backend': return 'blue';
      case 'devops': return 'emerald';
      case 'design': return 'pink';
      case 'database': return 'cyan';
      case 'algorithms': return 'violet';
      case 'tools': return 'orange';
      default: return 'white';
    }
  };
  
  return (
    <div className="w-full">
      {/* Character stats section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 overflow-hidden mb-4"
      >
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-white">Developer Stats</h3>
            <div className="px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/30">
              <span className="text-xs text-blue-400">Character Level: {playerStats.level}</span>
            </div>
          </div>
          
          {/* XP Bar */}
          <XPBar 
            level={playerStats.level} 
            xp={playerStats.xp} 
            nextLevelXp={playerStats.nextLevelXp} 
          />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {playerStats.stats.map((stat, index) => (
              <StatItem 
                key={index}
                icon={getIconForStat(stat.name)}
                name={stat.name}
                value={stat.value}
                color={getColorForStat(stat.name)}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Achievements section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Achievements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <AchievementItem 
                key={index}
                icon={achievement.icon}
                name={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SkillGameStats; 