"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import createGlobe from "cobe";
import { 
  IconBulb, 
  IconBrandGithub,
  IconExternalLink,
  IconUser,
  IconBriefcase,
  IconTools,
  IconBook,
  IconMail,
  IconMessageCircle,
  IconArrowRight,
  IconPlay,
  IconPause
} from "@tabler/icons-react";
import { GlowingEffect } from "./glowing-effect";
import featuringData from "../json/featuring.json";

export function FeaturingSection({ navigateToSection }) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  return (
    <div className="relative z-20 w-full h-full p-4 md:p-6">
      <div className="w-full h-full">
        <div className="grid grid-cols-8 grid-rows-24 gap-2 h-full auto-rows-fr">
          {/* My Picture - div1 */}
          <FeatureCard className="col-start-1 col-end-3 row-start-1 row-end-6">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-800/60 backdrop-blur-sm">
              <img 
                src="/me.png" 
                alt="Sri Ujjwal Reddy B" 
                className="h-full w-full object-contain" 
              />
            </div>
          </FeatureCard>

          {/* Large Project Feature - div2 */}
          <FeatureCard className="col-start-3 col-end-7 row-start-1 row-end-6">
            <ProjectCard 
              project={featuringData.projects[0]} 
              size="large"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Navigation Link - About - div3 */}
          <FeatureCard className="col-start-7 col-end-9 row-start-1 row-end-8">
            <NavigationCard 
              title="About Me"
              description="Learn more about my journey, education, and experiences"
              icon={<IconUser className="h-6 w-6 text-blue-400" />}
              onClick={() => navigateToSection("about")}
              backgroundImage="/background/bridge.jpg"
            />
          </FeatureCard>

          {/* Blog Post 1 - div4 */}
          <FeatureCard className="col-start-1 col-end-3 row-start-6 row-end-10">
            <BlogCard 
              post={featuringData.blogPosts[0]}
              navigateToSection={navigateToSection}
            />
          </FeatureCard>

          {/* Thought Card 1 - div5 */}
          <FeatureCard className="col-start-7 col-end-9 row-start-8 row-end-12">
            <ThoughtCard thought={featuringData.thoughts[0]} />
          </FeatureCard>

          {/* Project 2 - div6 */}
          <FeatureCard className="col-start-1 col-end-3 row-start-10 row-end-16">
            <ProjectCard 
              project={featuringData.projects[1]} 
              size="medium"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Navigation Link - Experience - div7 */}
          <FeatureCard className="col-start-7 col-end-9 row-start-12 row-end-17">
            <NavigationCard 
              title="Experience"
              description="Professional journey and achievements"
              icon={<IconBriefcase className="h-6 w-6 text-green-400" />}
              onClick={() => navigateToSection("experience")}
              backgroundImage="/background/house.jpg"
            />
          </FeatureCard>

          {/* Navigation Link - Skills - div8 */}
          <FeatureCard className="col-start-7 col-end-9 row-start-17 row-end-22">
            <NavigationCard 
              title="Skills"
              description="Technical expertise and capabilities"
              icon={<IconTools className="h-6 w-6 text-purple-400" />}
              onClick={() => navigateToSection("skills")}
              backgroundImage="/background/leaves.jpg"
            />
          </FeatureCard>

          {/* Large Project Feature - div9 */}
          <FeatureCard className="col-start-5 col-end-9 row-start-22 row-end-25">
            <ProjectCard 
              project={featuringData.projects[2]} 
              size="large"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Project 3 - div10 */}
          <FeatureCard className="col-start-1 col-end-3 row-start-16 row-end-21">
            <ProjectCard 
              project={featuringData.projects[3]} 
              size="medium"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Blog Post 2 - div11 */}
          <FeatureCard className="col-start-3 col-end-5 row-start-15 row-end-22">
            <BlogCard 
              post={featuringData.blogPosts[1]}
              navigateToSection={navigateToSection}
              size="large"
            />
          </FeatureCard>

          {/* Thought Card 2 - div12 */}
          <FeatureCard className="col-start-5 col-end-7 row-start-18 row-end-22">
            <ThoughtCard thought={featuringData.thoughts[1]} />
          </FeatureCard>

          {/* Navigation Link - Contact - div13 */}
          <FeatureCard className="col-start-1 col-end-3 row-start-21 row-end-25">
            <NavigationCard 
              title="Contact"
              description="Let's connect and collaborate"
              icon={<IconMail className="h-6 w-6 text-red-400" />}
              onClick={() => navigateToSection("contact")}
              backgroundImage="/background/stars.jpg"
            />
          </FeatureCard>

          {/* Blog Post 3 - div14 */}
          <FeatureCard className="col-start-3 col-end-5 row-start-22 row-end-25">
            <BlogCard 
              post={featuringData.blogPosts[2]}
              navigateToSection={navigateToSection}
            />
          </FeatureCard>

          {/* Project 4 - div15 */}
          <FeatureCard className="col-start-3 col-end-5 row-start-6 row-end-15">
            <ProjectCard 
              project={featuringData.projects[4]} 
              size="large"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Project 5 - div16 */}
          <FeatureCard className="col-start-5 col-end-7 row-start-6 row-end-11">
            <ProjectCard 
              project={featuringData.projects[5]} 
              size="medium"
              hoveredProject={hoveredProject}
              setHoveredProject={setHoveredProject}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
            />
          </FeatureCard>

          {/* Thought Card 3 with Globe - div17 */}
          <FeatureCard className="col-start-5 col-end-7 row-start-11 row-end-18">
            <div className="relative h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800/30 to-neutral-900/30 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <GlowingEffect
                spread={30}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                variant="default"
                className="opacity-70"
              />
              <div className="absolute top-4 left-4">
                <IconBulb className="h-6 w-6 text-yellow-400" />
              </div>
              <Globe className="scale-75" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm text-white/90 font-medium text-center">
                  "Innovation knows no boundaries"
                </p>
                <p className="text-xs text-white/60 text-center mt-1">
                  Global mindset, local impact
                </p>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ children, className }) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="relative h-full w-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
        {children}
      </div>
    </div>
  );
};

const ProjectCard = ({ project, size = "medium", hoveredProject, setHoveredProject, playingVideo, setPlayingVideo }) => {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (hoveredProject === project.id && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Video play failed, fallback to image
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hoveredProject, project.id]);

  const handleVideoLoad = () => {
    setIsVideoReady(true);
  };

  return (
    <div
      className={cn(
        "group w-full cursor-pointer overflow-hidden relative h-full rounded-xl shadow-xl flex flex-col justify-end p-4 border border-transparent dark:border-neutral-800 transition-all duration-500",
        `bg-[url(${project.image})] bg-cover bg-center`,
        "hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:bg-black hover:after:opacity-50"
      )}
      onMouseEnter={() => setHoveredProject(project.id)}
      onMouseLeave={() => setHoveredProject(null)}
    >
      <GlowingEffect
        spread={30}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        variant="default"
        className="opacity-70"
      />
      
      {/* Video overlay */}
      {project.video && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            hoveredProject === project.id && isVideoReady ? "opacity-100" : "opacity-0"
          )}
          muted
          loop
          playsInline
          onLoadedData={handleVideoLoad}
        >
          <source src={project.video} type="video/mp4" />
        </video>
      )}

      <div className="text relative z-50">
        <div className="flex items-center gap-2 mb-2">
          {project.technologies?.slice(0, 3).map((tech, i) => (
            <span 
              key={i} 
              className="text-xs py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20"
            >
              {tech}
            </span>
          ))}
        </div>
        <h1 className={cn(
          "font-bold text-gray-50 relative",
          size === "large" ? "text-xl md:text-2xl" : "text-lg md:text-xl"
        )}>
          {project.title}
        </h1>
        <p className={cn(
          "font-normal text-gray-50 relative my-2",
          size === "large" ? "text-sm md:text-base" : "text-xs md:text-sm"
        )}>
          {project.description}
        </p>
        <div className="flex gap-2 mt-3">
          {project.github && (
            <a 
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <IconBrandGithub size={20} />
            </a>
          )}
          {project.href && (
            <a 
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <IconExternalLink size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const NavigationCard = ({ title, description, icon, onClick, backgroundImage }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex h-full flex-col justify-start overflow-hidden rounded-xl p-4 shadow-xl cursor-pointer hover:ring-1 hover:ring-cyan-400/50 transition-all duration-300"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${backgroundImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      <GlowingEffect
        spread={30}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        variant="default"
        className="opacity-70"
      />
      <div className="relative flex flex-col gap-3 h-full">
        <div className="flex flex-row items-center gap-3">
          <div className="w-fit rounded-lg border border-neutral-600/50 bg-neutral-700/30 p-2 shadow-md shrink-0">
            {icon}
          </div>
          <h3 className="font-sans text-lg font-semibold text-white line-clamp-2">
            {title}
          </h3>
        </div>
        <p className="font-sans text-sm text-neutral-300 leading-relaxed line-clamp-3">
          {description}
        </p>
        <div className="flex items-center gap-2 text-cyan-400 text-sm mt-auto">
          <span>Explore</span>
          <IconArrowRight size={16} />
        </div>
      </div>
    </div>
  );
};

const BlogCard = ({ post, navigateToSection, size = "medium" }) => {
  return (
    <div
      onClick={() => navigateToSection("blog")}
      className="relative flex h-full flex-col justify-start overflow-hidden rounded-xl p-4 shadow-xl cursor-pointer hover:ring-1 hover:ring-orange-400/50 transition-all duration-300 bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-sm border border-white/10"
    >
      <GlowingEffect
        spread={30}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        variant="default"
        className="opacity-70"
      />
      <div className="relative flex flex-col gap-3 h-full">
        <div className="flex flex-row items-center gap-3">
          <div className="w-fit rounded-lg border border-orange-600/50 bg-orange-700/30 p-2 shadow-md shrink-0">
            <IconBook className="h-5 w-5 text-orange-400" />
          </div>
          <span className="text-xs text-orange-400 font-medium">BLOG POST</span>
        </div>
        <h3 className={cn(
          "font-sans font-semibold text-white line-clamp-2",
          size === "large" ? "text-lg" : "text-base"
        )}>
          {post.title}
        </h3>
        <p className={cn(
          "font-sans text-neutral-300 leading-relaxed",
          size === "large" ? "text-sm line-clamp-4" : "text-xs line-clamp-3"
        )}>
          {post.preview}
        </p>
        <div className="flex items-center gap-2 text-orange-400 text-sm mt-auto">
          <span>Read More</span>
          <IconArrowRight size={16} />
        </div>
      </div>
    </div>
  );
};

const ThoughtCard = ({ thought }) => {
  return (
    <div className="relative flex h-full flex-col justify-center items-center overflow-hidden rounded-xl p-4 shadow-xl bg-gradient-to-br from-yellow-900/20 to-amber-900/20 backdrop-blur-sm border border-white/10">
      <GlowingEffect
        spread={30}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        variant="default"
        className="opacity-70"
      />
      <div className="absolute top-4 left-4">
        <IconBulb className="h-6 w-6 text-yellow-400" />
      </div>
      <div className="text-center">
        <p className="font-sans text-sm font-medium text-white mb-2">
          "{thought.text}"
        </p>
        <p className="font-sans text-xs text-white/60">
          {thought.subtitle}
        </p>
      </div>
    </div>
  );
};

export const Globe = ({ className }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
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
        { location: [33.4484, -112.0740], size: 0.05 }, // Arizona
        { location: [37.7749, -122.4194], size: 0.03 }, // San Francisco
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
      style={{ width: 300, height: 300, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
}; 