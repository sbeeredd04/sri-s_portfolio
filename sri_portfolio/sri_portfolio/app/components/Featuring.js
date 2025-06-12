"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { GlowingEffect } from "./glowing-effect";
import featuresData from "../json/featuresData.json";
import { 
  IconBulb, 
  IconUser, 
  IconBriefcase, 
  IconTools, 
  IconMail, 
  IconCode,
  IconUsers,
  IconBookOpen,
  IconPuzzle,
  IconArrowRight,
  IconExternalLink,
  IconPlayCircle
} from "@tabler/icons-react";

export function Featuring({ navigateToSection }) {
  const [hoveredProject, setHoveredProject] = useState(null);
  
  const getIcon = (iconName) => {
    const icons = {
      IconBulb: IconBulb,
      IconUser: IconUser,
      IconBriefcase: IconBriefcase,
      IconTools: IconTools,
      IconMail: IconMail,
      IconCode: IconCode,
      IconUsers: IconUsers,
      IconBookOpen: IconBookOpen,
      IconPuzzle: IconPuzzle,
    };
    const IconComponent = icons[iconName] || IconBulb;
    return <IconComponent className="h-5 w-5" />;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      green: "text-green-400 border-green-500/30 bg-green-500/10",
      orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
      purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      red: "text-red-400 border-red-500/30 bg-red-500/10",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full h-full p-2 md:p-4">
      <div className="grid grid-cols-8 grid-rows-24 gap-2 h-full max-h-[85vh] overflow-y-auto scrollbar-none">
        
        {/* Blog Post 1 - div1 */}
        <motion.div 
          className="col-start-1 col-span-2 row-start-1 row-span-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BlogCard blog={featuresData.blogPosts[0]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Main Profile Image - div2 */}
        <motion.div 
          className="col-start-3 col-span-4 row-start-1 row-span-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ProfileCard />
        </motion.div>

        {/* Quick Link 1 - div3 */}
        <motion.div 
          className="col-start-7 col-span-2 row-start-1 row-span-7"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickLinkCard link={featuresData.quickLinks[0]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Blog Post 2 - div4 */}
        <motion.div 
          className="col-start-1 col-span-2 row-start-6 row-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BlogCard blog={featuresData.blogPosts[1]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Quick Link 2 - div5 */}
        <motion.div 
          className="col-start-7 col-span-2 row-start-8 row-span-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickLinkCard link={featuresData.quickLinks[1]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Project 1 - div6 */}
        <motion.div 
          className="col-start-1 col-span-2 row-start-10 row-span-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
                     <ProjectCard 
             project={featuresData.featuredProjects[0]} 
             onHover={setHoveredProject}
             isHovered={hoveredProject === featuresData.featuredProjects[0].title}
           />
        </motion.div>

        {/* Quick Link 3 - div7 */}
        <motion.div 
          className="col-start-7 col-span-2 row-start-12 row-span-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <QuickLinkCard link={featuresData.quickLinks[2]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Inspirational Thought 1 - div8 */}
        <motion.div 
          className="col-start-7 col-span-2 row-start-17 row-span-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ThoughtCard thought={featuresData.inspirationalThoughts[0]} />
        </motion.div>

        {/* Project 2 - div9 */}
        <motion.div 
          className="col-start-5 col-span-4 row-start-22 row-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
                     <ProjectCard 
             project={featuresData.featuredProjects[1]} 
             onHover={setHoveredProject}
             isHovered={hoveredProject === featuresData.featuredProjects[1].title}
             horizontal
           />
        </motion.div>

        {/* Blog Post 3 - div10 */}
        <motion.div 
          className="col-start-1 col-span-2 row-start-16 row-span-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <BlogCard blog={featuresData.blogPosts[2]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Project 3 - div11 */}
        <motion.div 
          className="col-start-3 col-span-2 row-start-15 row-span-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
                     <ProjectCard 
             project={featuresData.featuredProjects[2]} 
             onHover={setHoveredProject}
             isHovered={hoveredProject === featuresData.featuredProjects[2].title}
           />
        </motion.div>

        {/* Inspirational Thought 2 - div12 */}
        <motion.div 
          className="col-start-5 col-span-2 row-start-18 row-span-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <ThoughtCard thought={featuresData.inspirationalThoughts[1]} />
        </motion.div>

        {/* Blog Post 4 - div13 */}
        <motion.div 
          className="col-start-1 col-span-2 row-start-21 row-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <BlogCard blog={featuresData.blogPosts[3]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Quick Link 4 - div14 */}
        <motion.div 
          className="col-start-3 col-span-2 row-start-22 row-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <QuickLinkCard link={featuresData.quickLinks[3]} navigateToSection={navigateToSection} />
        </motion.div>

        {/* Project 4 - div15 */}
        <motion.div 
          className="col-start-3 col-span-2 row-start-6 row-span-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
                     <ProjectCard 
             project={featuresData.featuredProjects[3]} 
             onHover={setHoveredProject}
             isHovered={hoveredProject === featuresData.featuredProjects[3].title}
           />
        </motion.div>

        {/* Inspirational Thought 3 - div16 */}
        <motion.div 
          className="col-start-5 col-span-2 row-start-6 row-span-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 }}
        >
          <ThoughtCard thought={featuresData.inspirationalThoughts[2]} />
        </motion.div>

        {/* Project 5 - div17 */}
        <motion.div 
          className="col-start-5 col-span-2 row-start-11 row-span-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
        >
                     <ProjectCard 
             project={featuresData.featuredProjects[4]} 
             onHover={setHoveredProject}
             isHovered={hoveredProject === featuresData.featuredProjects[4].title}
           />
        </motion.div>
        
      </div>
    </div>
  );
}

// Blog Card Component
const BlogCard = ({ blog, navigateToSection }) => (
  <div className="h-full w-full rounded-2xl border border-white/10 p-3 relative overflow-hidden cursor-pointer group"
       onClick={() => navigateToSection('blog')}>
    <GlowingEffect
      spread={20}
      glow={true}
      disabled={false}
      proximity={48}
      inactiveZone={0.01}
      variant="default"
      className="opacity-60"
    />
    <div className="relative h-full bg-gradient-to-br from-neutral-900/80 to-neutral-800/80 backdrop-blur-sm rounded-xl p-3 border border-white/5 flex flex-col justify-between">
      <div>
        <div className="text-xs text-cyan-400 mb-2 font-medium">{blog.category}</div>
        <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 leading-tight">{blog.title}</h3>
        <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">{blog.preview}</p>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-neutral-400">{blog.readTime}</span>
        <IconArrowRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </div>
);

// Profile Card Component
const ProfileCard = () => (
  <div className="h-full w-full rounded-2xl border border-white/10 p-3 relative overflow-hidden">
    <div className="relative h-full bg-neutral-800/60 backdrop-blur-sm rounded-xl overflow-hidden flex items-center justify-center">
      <img 
        src="/me.png" 
        alt="Sri Ujjwal Reddy B" 
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h2 className="text-xl font-bold text-white">Sri Ujjwal Reddy B</h2>
        <p className="text-sm text-cyan-400">Full Stack Developer</p>
      </div>
    </div>
  </div>
);

// Quick Link Card Component
const QuickLinkCard = ({ link, navigateToSection }) => (
  <div className="h-full w-full rounded-2xl border border-white/10 p-3 relative overflow-hidden cursor-pointer group"
       onClick={() => navigateToSection(link.section)}>
    <GlowingEffect
      spread={20}
      glow={true}
      disabled={false}
      proximity={48}
      inactiveZone={0.01}
      variant="default"
      className="opacity-60"
    />
    <div className={cn(
      "relative h-full backdrop-blur-sm rounded-xl p-4 border flex flex-col justify-center items-center text-center space-y-3 group-hover:scale-105 transition-transform",
      getColorClasses(link.color)
    )}>
      <div className="p-2 rounded-lg border border-current bg-current/10">
        {getIcon(link.icon)}
      </div>
      <h3 className="text-sm font-semibold text-current">{link.title}</h3>
      <p className="text-xs text-neutral-300 line-clamp-2">{link.description}</p>
    </div>
  </div>
);

// Project Card Component
const ProjectCard = ({ project, onHover, isHovered, horizontal = false }) => (
  <div className={cn(
    "h-full w-full rounded-2xl border border-white/10 p-2 relative overflow-hidden cursor-pointer group",
    "hover:border-white/20 transition-all duration-500"
  )}
  onMouseEnter={() => onHover && onHover(project.title)}
  onMouseLeave={() => onHover && onHover(null)}>
    <GlowingEffect
      spread={25}
      glow={true}
      disabled={false}
      proximity={48}
      inactiveZone={0.01}
      variant="default"
      className="opacity-50"
    />
    <div className={cn(
      "relative h-full overflow-hidden rounded-xl shadow-xl flex flex-col justify-end",
      "bg-cover bg-center transition-all duration-500",
      isHovered ? "bg-none" : "",
      horizontal ? "md:flex-row md:justify-start" : ""
    )}
    style={{ 
      backgroundImage: !isHovered ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${project.image})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* Video overlay for hover effect */}
      {isHovered && (
        <div className="absolute inset-0 z-10">
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover rounded-xl"
            style={{ filter: 'brightness(0.7)' }}
          >
            <source src={project.video} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      )}
      
      {/* Play icon when not hovered */}
      {!isHovered && (
        <div className="absolute top-2 right-2 z-20">
          <IconPlayCircle className="h-6 w-6 text-white/70" />
        </div>
      )}
      
      {/* Content */}
      <div className={cn(
        "relative z-20 p-3 space-y-2",
        horizontal ? "md:w-1/2" : ""
      )}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs bg-emerald-500/80 text-white rounded-full">
            {project.status}
          </span>
          <IconExternalLink className="h-4 w-4 text-white/70" />
        </div>
        <h3 className="text-sm font-semibold text-white line-clamp-1">{project.title}</h3>
        <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">{project.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {project.technologies.slice(0, 2).map((tech, i) => (
            <span key={i} className="text-[8px] px-1.5 py-0.5 bg-black/60 text-white/90 rounded-full border border-white/20">
              {tech}
            </span>
          ))}
          {project.technologies.length > 2 && (
            <span className="text-[8px] px-1.5 py-0.5 bg-black/60 text-white/90 rounded-full border border-white/20">
              +{project.technologies.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Thought Card Component
const ThoughtCard = ({ thought }) => (
  <div className="h-full w-full rounded-2xl border border-white/10 p-3 relative overflow-hidden">
    <GlowingEffect
      spread={15}
      glow={true}
      disabled={false}
      proximity={48}
      inactiveZone={0.01}
      variant="default"
      className="opacity-40"
    />
    <div className="relative h-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20 flex flex-col justify-center items-center text-center space-y-3">
      <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/30">
        {getIcon(thought.icon)}
      </div>
      <p className="text-sm font-medium text-amber-400 text-center leading-relaxed">
        "{thought.text}"
      </p>
    </div>
  </div>
);

// Helper function for icon colors
const getColorClasses = (color) => {
  const colors = {
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    green: "text-green-400 border-green-500/30 bg-green-500/10",
    orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    red: "text-red-400 border-red-500/30 bg-red-500/10",
  };
  return colors[color] || colors.blue;
};

// Helper function for icons
const getIcon = (iconName) => {
  const icons = {
    IconBulb: IconBulb,
    IconUser: IconUser,
    IconBriefcase: IconBriefcase,
    IconTools: IconTools,
    IconMail: IconMail,
    IconCode: IconCode,
    IconUsers: IconUsers,
    IconBookOpen: IconBookOpen,
    IconPuzzle: IconPuzzle,
  };
  const IconComponent = icons[iconName] || IconBulb;
  return <IconComponent className="h-5 w-5" />;
}; 