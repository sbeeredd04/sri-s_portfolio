"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IconTrophy, 
  IconFlame, 
  IconCode,
  IconGitBranch,
  IconStar,
  IconCalendarStats,
  IconDeviceAnalytics,
  IconTarget,
  IconRocket,
  IconBrain,
  IconUsers,
  IconPresentation,
  IconHeart,
  IconDatabase,
  IconDeviceMobile,
  IconAward,
  IconChartBar,
  IconGitCommit,
  IconEye,
  IconGitPullRequest
} from '@tabler/icons-react';

// GitHub Stats Card Component with enhanced glass morphism
const GitHubStatsCard = ({ title, children, className = "", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.15) 0%, rgba(30, 41, 59, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="p-4 md:p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-3 relative z-10"
        >
          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
          {title}
        </motion.h3>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Achievement Item Component with enhanced animations
const AchievementItem = ({ icon, name, description, unlocked = true, color = "blue", index = 0 }) => {
  const colorMap = {
    blue: "from-blue-900/60 to-cyan-900/60 border-blue-500/60",
    emerald: "from-emerald-900/60 to-green-900/60 border-emerald-500/60",
    violet: "from-violet-900/60 to-purple-900/60 border-violet-500/60",
    amber: "from-amber-900/60 to-yellow-900/60 border-amber-500/60",
    rose: "from-rose-900/60 to-pink-900/60 border-rose-500/60",
  };
  
  const textColorMap = {
    blue: "text-blue-100",
    emerald: "text-emerald-100", 
    violet: "text-violet-100",
    amber: "text-amber-100",
    rose: "text-rose-100",
  };
  
  const iconColorMap = {
    blue: "bg-blue-500/40 text-blue-200",
    emerald: "bg-emerald-500/40 text-emerald-200",
    violet: "bg-violet-500/40 text-violet-200", 
    amber: "bg-amber-500/40 text-amber-200",
    rose: "bg-rose-500/40 text-rose-200",
  };
  
  const gradientClass = colorMap[color] || colorMap.blue;
  const textClass = textColorMap[color] || textColorMap.blue;
  const iconClass = iconColorMap[color] || iconColorMap.blue;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg"
      style={unlocked ? {
        background: `linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(30, 41, 59, 0.15) 100%)`,
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      } : {
        background: 'rgba(30, 41, 59, 0.1)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        opacity: 0.6,
      }}
    >
      <div className={`p-2.5 rounded-xl backdrop-blur-sm ${
        unlocked ? iconClass : "bg-gray-700/40 text-gray-500"
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-xs font-semibold ${unlocked ? textClass : "text-gray-400"}`}>{name}</p>
        <p className="text-[10px] text-white/70 mt-0.5">{description}</p>
      </div>
      {unlocked && (
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
          className="ml-auto"
        >
          <IconTrophy className="text-amber-400" size={16} />
        </motion.div>
      )}
    </motion.div>
  );
};

// Stat Display Component with enhanced styling
const StatDisplay = ({ icon, label, value, color = "blue", index = 0 }) => {
  const colorMap = {
    blue: "text-blue-300",
    emerald: "text-emerald-300",
    violet: "text-violet-300",
    cyan: "text-cyan-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  };
  
  const bgColorMap = {
    blue: "bg-blue-500/20",
    emerald: "bg-emerald-500/20",
    violet: "bg-violet-500/20",
    cyan: "bg-cyan-500/20",
    amber: "bg-amber-500/20",
    rose: "bg-rose-500/20",
  };
  
  const textColor = colorMap[color] || colorMap.blue;
  const bgColor = bgColorMap[color] || bgColorMap.blue;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.2) 0%, rgba(30, 41, 59, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className={`p-2.5 rounded-xl ${bgColor} ${textColor} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-white/60 uppercase tracking-wide">{label}</p>
        <p className={`text-base font-bold ${textColor}`}>{value}</p>
      </div>
    </motion.div>
  );
};

// Main GitHub Stats View Component
export const GitHubStatsView = () => {
  const username = "sbeeredd04";
  const [contributionView, setContributionView] = useState("graph");

  // GitHub achievements with consistent theme colors
  const achievements = [
    {
      icon: <IconStar size={16} />,
      name: "GitHub Superstar",
      description: "Maintained active GitHub presence with consistent contributions",
      unlocked: true,
      color: "amber"
    },
    {
      icon: <IconTrophy size={16} />,
      name: "Full-Stack Virtuoso", 
      description: "Mastered both frontend and backend technologies",
      unlocked: true,
      color: "emerald"
    },
    {
      icon: <IconFlame size={16} />,
      name: "Streak Master",
      description: "Maintained impressive GitHub contribution streaks",
      unlocked: true,
      color: "rose"
    },
    {
      icon: <IconBrain size={16} />,
      name: "AI/ML Pioneer",
      description: "Built advanced machine learning and AI projects",
      unlocked: true,
      color: "violet"
    },
    {
      icon: <IconRocket size={16} />,
      name: "Cloud Architect",
      description: "Deployed applications across multiple cloud platforms",
      unlocked: true,
      color: "blue"
    },
    {
      icon: <IconUsers size={16} />,
      name: "Open Source Contributor",
      description: "Actively contributed to open-source projects", 
      unlocked: true,
      color: "emerald"
    },
    {
      icon: <IconPresentation size={16} />,
      name: "Tech Communicator",
      description: "Excellent at presenting technical concepts clearly",
      unlocked: true,
      color: "blue"
    },
    {
      icon: <IconGitBranch size={16} />,
      name: "Version Control Master",
      description: "Expert in Git workflows and collaboration",
      unlocked: true,
      color: "amber"
    },
    {
      icon: <IconCode size={16} />,
      name: "Multi-Language Expert",
      description: "Proficient in 8+ programming languages",
      unlocked: true,
      color: "violet"
    },
    {
      icon: <IconTarget size={16} />,
      name: "Problem Solver Elite",
      description: "Consistently solves complex technical challenges",
      unlocked: true,
      color: "rose"
    },
    {
      icon: <IconCalendarStats size={16} />,
      name: "Productivity Champion",
      description: "Maintains high development velocity and quality",
      unlocked: true,
      color: "emerald"
    },
    {
      icon: <IconDatabase size={16} />,
      name: "Data Architect",
      description: "Advanced database design and optimization skills",
      unlocked: false,
      color: "blue"
    },
    {
      icon: <IconDeviceMobile size={16} />,
      name: "Mobile App Publisher",
      description: "Published applications on mobile app stores",
      unlocked: false,
      color: "amber"
    },
    {
      icon: <IconAward size={16} />,
      name: "Hackathon Victor",
      description: "Won multiple hackathons and coding competitions",
      unlocked: false,
      color: "violet"
    },
  ];

  // Developer stats with theme colors
  const devStats = [
    { icon: <IconCode size={18} />, label: "Frontend", value: "92%", color: "amber" },
    { icon: <IconDatabase size={18} />, label: "Backend", value: "88%", color: "emerald" },
    { icon: <IconBrain size={18} />, label: "Data Science", value: "85%", color: "violet" },
    { icon: <IconPresentation size={18} />, label: "Communication", value: "90%", color: "blue" },
    { icon: <IconUsers size={18} />, label: "Leadership", value: "82%", color: "rose" },
    { icon: <IconRocket size={18} />, label: "DevOps", value: "75%", color: "cyan" },
    { icon: <IconHeart size={18} />, label: "Design", value: "80%", color: "rose" },
    { icon: <IconTarget size={18} />, label: "Problem Solving", value: "95%", color: "emerald" },
  ];

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 space-y-8 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .contribution-graph img {
          filter: none !important;
        }
        .contribution-graph {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: rgba(13, 17, 23, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(48, 54, 61, 0.6);
        }
        .contribution-graph::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(13, 17, 23, 0.1) 0%, 
            rgba(22, 27, 34, 0.05) 50%, 
            rgba(48, 54, 61, 0.1) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .contribution-graph img {
          position: relative;
          z-index: 2;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
          background: transparent !important;
        }
        /* Contribution Grid Styling */
        .contribution-grid {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: rgba(13, 17, 23, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(48, 54, 61, 0.6);
        }
        .contribution-grid::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(13, 17, 23, 0.1) 0%, 
            rgba(22, 27, 34, 0.05) 50%, 
            rgba(48, 54, 61, 0.1) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .contribution-grid img {
          position: relative;
          z-index: 2;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
          background: transparent !important;
        }
        /* Enhanced glassmorphism for stat cards */
        .github-stat-container {
          background: rgba(30, 41, 59, 0.15) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }
        .github-stat-container img {
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15) !important;
        }
      `}</style>
      
      {/* Header with enhanced animation */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 bg-clip-text text-transparent">
          Developer Profile & GitHub Analytics
        </h2>
        <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto">
          Real-time GitHub statistics, achievements, and development metrics
        </p>
      </motion.div>

      {/* GitHub Contributions Graph */}
      <GitHubStatsCard title="GitHub Contribution Activity" delay={0.1}>
        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex bg-neutral-800/30 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setContributionView("graph")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all duration-300 ${
                contributionView === "graph"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700/30"
              }`}
            >
              Activity Graph
            </button>
            <button
              onClick={() => setContributionView("grid")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all duration-300 ${
                contributionView === "grid"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700/30"
              }`}
            >
              Contribution Grid
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <motion.div
          key={contributionView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {contributionView === "graph" ? (
            <div className="contribution-graph p-4">
              <img 
                src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=github-dark&bg_color=00000000&color=60a5fa&line=93c5fd&point=ffffff&area=true&hide_border=true&radius=3`}
                alt="GitHub Activity Graph" 
                className="w-full h-auto rounded-lg"
                style={{ 
                  backgroundColor: 'transparent',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                loading="lazy"
                onError={(e) => {
                  // Fallback to ghchart with optimized blue filter
                  e.target.src = `https://ghchart.rshah.org/${username}`;
                  e.target.style.filter = 'invert(1) hue-rotate(180deg) saturate(120%) brightness(90%) contrast(120%)';
                }}
              />
            </div>
          ) : (
            <div className="contribution-grid p-4">
              <img 
                src={`https://ghchart.rshah.org/${username}`}
                alt="GitHub Contribution Grid" 
                className="w-full h-auto rounded-lg"
                style={{ 
                  filter: 'invert(1) hue-rotate(180deg) saturate(120%) brightness(90%) contrast(120%)',
                  backgroundColor: 'transparent',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                loading="lazy"
              />
            </div>
          )}
        </motion.div>
      </GitHubStatsCard>

      {/* GitHub Statistics - Full Width */}
      <GitHubStatsCard title="GitHub Statistics" delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full github-stat-container rounded-lg p-4">
            <img 
              src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=transparent&icon_color=60a5fa&text_color=ffffff&bg_color=00000000&title_color=93c5fd&border_color=ffffff20&hide_border=false&include_all_commits=true&count_private=true&custom_title=Sri%20Ujwal's%20GitHub%20Stats`}
              alt="GitHub Stats" 
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="w-full github-stat-container rounded-lg p-4">
            <img 
              src={`https://streak-stats.demolab.com?user=${username}&theme=transparent&ring=60a5fa&fire=10b981&currStreakLabel=ffffff&background=00000000&sideNums=93c5fd&sideLabels=60a5fa&border=ffffff20`}
              alt="GitHub Streak" 
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </GitHubStatsCard>

      {/* Quick Analytics - Horizontal Layout */}
      <GitHubStatsCard title="Quick Analytics" delay={0.3}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatDisplay 
            icon={<IconGitCommit size={18} />}
            label="Total Commits"
            value="500+"
            color="emerald"
            index={0}
          />
          <StatDisplay 
            icon={<IconGitPullRequest size={18} />}
            label="Pull Requests"
            value="150+"
            color="blue"
            index={1}
          />
          <StatDisplay 
            icon={<IconEye size={18} />}
            label="Profile Views"
            value="2.5K+"
            color="violet"
            index={2}
          />
          <StatDisplay 
            icon={<IconStar size={18} />}
            label="Stars Earned"
            value="50+"
            color="amber"
            index={3}
          />
        </div>
      </GitHubStatsCard>

      {/* Developer Skills & Achievements - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Developer Skills */}
        <GitHubStatsCard title="Developer Skills & Stats" delay={0.4}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devStats.map((stat, index) => (
              <StatDisplay 
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                index={index}
              />
            ))}
          </div>
        </GitHubStatsCard>

        {/* Achievements */}
        <GitHubStatsCard title="Developer Achievements" delay={0.5}>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 hide-scrollbar">
            {achievements.map((achievement, index) => (
              <AchievementItem 
                key={index}
                icon={achievement.icon}
                name={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                color={achievement.color}
                index={index}
              />
            ))}
          </div>
        </GitHubStatsCard>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default GitHubStatsView;