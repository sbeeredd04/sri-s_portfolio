"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import createGlobe from "cobe";
import { 
  IconBulb, 
  IconBrandGithub,
  IconExternalLink,
  IconArrowRight,
  IconSparkles,
  IconHeart,
  IconCode,
  IconRocket
} from "@tabler/icons-react";
import Link from "next/link";
import featuredData from "../json/featured.json";
import deployedProjects from "../json/deployed.json";

export function FeaturingSection({ navigateToSection }) {
  const features = [
    // Blog Posts
    ...featuredData.blogPosts.map((post, idx) => ({
      type: "blog",
      title: post.title,
      description: post.preview,
      skeleton: <BlogSkeleton key={`blog-${idx}`} post={post} navigateToSection={navigateToSection} />,
      className: idx % 2 === 0 ? "col-span-1 lg:col-span-3 border-b lg:border-r dark:border-neutral-800" : "col-span-1 lg:col-span-2 border-b lg:border-r dark:border-neutral-800",
    })),
    
    // Featured Projects - Using deployed projects for accuracy
    ...deployedProjects.slice(0, 6).map((project, idx) => ({
      type: "project",
      title: project.title,
      description: project.description,
      skeleton: <ProjectSkeleton key={`project-${idx}`} project={project} />,
      className: idx % 3 === 0 ? "col-span-1 lg:col-span-3 border-b dark:border-neutral-800" : "col-span-1 lg:col-span-2 border-b dark:border-neutral-800",
    })),

    // My Picture
    {
      type: "profile",
      title: "Sri Ujjwal Reddy B",
      description: "Full Stack Developer & AI Enthusiast",
      skeleton: <ProfileSkeleton />,
      className: "col-span-1 lg:col-span-2 border-b lg:border-r dark:border-neutral-800",
    },

    // Thoughts/Inspiration Cards
    ...featuredData.thoughts.map((thought, idx) => ({
      type: "thought",
      title: thought.title,
      description: thought.description,
      skeleton: <ThoughtSkeleton thought={thought} />,
      className: "col-span-1 lg:col-span-2 border-b dark:border-neutral-800",
    })),

    // Navigation Links
    {
      type: "navigation",
      title: "Explore More",
      description: "Discover my journey, projects, and expertise",
      skeleton: <NavigationSkeleton navigateToSection={navigateToSection} />,
      className: "col-span-1 lg:col-span-4 border-b lg:border-none dark:border-neutral-800",
    },
  ];

  return (
    <div className="relative z-20 py-6 lg:py-12 w-full h-full">
      <div className="px-4 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-bold bg-gradient-to-r from-white via-white to-neutral-300 bg-clip-text text-transparent"
        >
          Welcome to My Digital Universe
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-400 text-center font-normal"
        >
          Full Stack Developer crafting innovative solutions with AI, Web Technologies, and Creative Problem Solving
        </motion.p>
      </div>

      <div className="relative mt-8 lg:mt-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-6"
        >
          {features.map((feature, idx) => (
            <FeatureCard key={`${feature.type}-${idx}`} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full mt-4">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const FeatureCard = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        `p-4 sm:p-6 relative overflow-hidden rounded-2xl backdrop-blur-xl bg-neutral-800/20 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/20`,
        className
      )}
    >
      {children}
    </motion.div>
  );
};

const FeatureTitle = ({ children }) => {
  return (
    <h3 className="max-w-5xl text-left tracking-tight text-white text-lg md:text-xl font-bold">
      {children}
    </h3>
  );
};

const FeatureDescription = ({ children }) => {
  return (
    <p className={cn(
      "text-xs md:text-sm max-w-full text-left mx-0",
      "text-neutral-300 font-normal mt-2"
    )}>
      {children}
    </p>
  );
};

// Blog Skeleton Component
const BlogSkeleton = ({ post, navigateToSection }) => {
  return (
    <div className="relative flex flex-col h-full group cursor-pointer" onClick={() => navigateToSection("blog")}>
      <div className="flex-1 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <IconBulb className="h-5 w-5 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">{post.category}</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed mb-4">
          {post.preview}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-400 font-medium">Read More</span>
          <IconArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

// Project Skeleton Component
const ProjectSkeleton = ({ project }) => {
  // Use a safe fallback approach for images
  const getProjectImage = () => {
    if (project.image && project.image.startsWith('/')) {
      return project.image;
    }
    // Fallback to a gradient background if no image
    return null;
  };
  
  const projectImage = getProjectImage();
  const hoverVideo = "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWlodTF3MjJ3NnJiY3Rlc2J0ZmE0c28yeWoxc3gxY2VtZzA5ejF1NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/syEfLvksYQnmM/giphy.gif";
  
  return (
    <div className="relative h-full">
      <div className={cn(
        "group w-full cursor-pointer overflow-hidden relative h-64 rounded-xl shadow-xl flex flex-col justify-end p-4 border border-white/10",
        "bg-gradient-to-br from-neutral-800/80 to-neutral-900/90",
        "hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:bg-black hover:after:opacity-60",
        "transition-all duration-500"
      )}>
        {/* Background Image */}
        {projectImage && (
          <div className="absolute inset-0">
            <img 
              src={projectImage}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
          </div>
        )}
        
        {/* Hover video effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <img 
            src={hoverVideo}
            alt="Demo"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="text relative z-50">
          <div className="flex flex-wrap gap-1 mb-2">
            {project.technologies?.slice(0, 3).map((tech, i) => (
              <span 
                key={i} 
                className="text-[8px] py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="font-normal text-xs text-gray-50 mb-3 line-clamp-2">
            {project.description}
          </p>
          <div className="flex items-center gap-2">
            {project.github && (
              <Link href={project.github} target="_blank" onClick={(e) => e.stopPropagation()}>
                <IconBrandGithub className="h-4 w-4 text-white/80 hover:text-white" />
              </Link>
            )}
            {project.href && (
              <Link href={project.href} target="_blank" onClick={(e) => e.stopPropagation()}>
                <IconExternalLink className="h-4 w-4 text-white/80 hover:text-white" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Skeleton Component
const ProfileSkeleton = () => {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 1, -1, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <img 
          src="/me.png" 
          alt="Sri Ujjwal Reddy B" 
          className="h-32 w-32 md:h-40 md:w-40 object-contain rounded-full border-2 border-cyan-400/50 shadow-lg"
        />
        <div className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
      </motion.div>
    </div>
  );
};

// Thought Skeleton Component
const ThoughtSkeleton = ({ thought }) => {
  const icons = {
    "Adaptability": IconSparkles,
    "Innovation": IconRocket,
    "Passion": IconHeart,
    "Problem Solving": IconCode
  };
  
  const Icon = icons[thought.title] || IconBulb;
  
  return (
    <div className="relative flex flex-col h-full justify-center items-center text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-8 w-8 md:h-12 md:w-12 text-yellow-400 mb-3" />
      </motion.div>
      <p className="text-xs md:text-sm text-neutral-300 leading-relaxed italic">
        "{thought.description}"
      </p>
    </div>
  );
};

// Navigation Skeleton Component
const NavigationSkeleton = ({ navigateToSection }) => {
  const navItems = [
    { name: "About Me", section: "about", color: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30" },
    { name: "Experience", section: "experience", color: "from-green-500/20 to-green-600/20", border: "border-green-500/30" },
    { name: "Projects", section: "projects", color: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/30" },
    { name: "Skills", section: "skills", color: "from-orange-500/20 to-orange-600/20", border: "border-orange-500/30" },
    { name: "Blog", section: "blog", color: "from-pink-500/20 to-pink-600/20", border: "border-pink-500/30" },
    { name: "Contact", section: "contact", color: "from-cyan-500/20 to-cyan-600/20", border: "border-cyan-500/30" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
      {navItems.map((item, idx) => (
        <motion.button
          key={item.section}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateToSection(item.section)}
          className={cn(
            "relative p-3 rounded-xl border transition-all duration-300 hover:shadow-lg",
            "bg-gradient-to-br",
            item.color,
            item.border,
            "hover:border-opacity-70"
          )}
        >
          <span className="text-xs md:text-sm font-medium text-white">
            {item.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

// Globe Component
export const Globe = ({ className }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [33.4484, -112.0740], size: 0.05 }, // Phoenix, AZ
        { location: [40.7128, -74.0060], size: 0.03 }, // New York
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
}; 