"use client";
import { cn } from "../lib/utils";
import Image from "next/image";
import Link from "next/link";

export function ProjectCard({ 
  title, 
  description, 
  imageUrl, 
  techStack, 
  projectUrl, 
  githubUrl 
}) {
  return (
    <div className="w-full group/card">
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative h-[22rem] md:h-[28rem] rounded-2xl md:rounded-3xl shadow-xl bg-cover bg-center transition-all duration-500 ease-in-out transform group-hover/card:scale-[1.02]",
          "border border-white/10 bg-neutral-900/50 backdrop-blur-sm"
        )}
      >
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 w-full h-full bg-gradient-radial from-transparent via-black/50 to-black/95 z-10"></div>
        </div>

        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6 bg-gradient-to-b from-transparent via-black/60 to-black/95 backdrop-blur-sm">
          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium bg-blue-500/100 text-white-400 rounded-full border border-blue-500/30"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Project Info */}
          <div className="space-y-2 md:space-y-4">
            <h2 className="text-xl md:text-3xl font-bold text-white/90">
              {title}
            </h2>
            <p className="text-xs md:text-base text-white/70 line-clamp-2 md:line-clamp-3">
              {description}
            </p>

            {/* Action Links */}
            <div className="flex items-center gap-2 md:gap-4 pt-2 md:pt-4">
              {projectUrl && (
                <Link
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-blue-500/60 hover:bg-blue-500/100 rounded-lg border border-blue-500/30 transition-colors duration-200"
                >
                  View Project
                </Link>
              )}
              {githubUrl && (
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white/100 hover:text-white/90 bg-neutral-800/50 hover:bg-neutral-800/70 rounded-lg border border-white/10 transition-colors duration-200"
                >
                  GitHub
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage:
/*
<ProjectCard
  title="Project Name"
  description="A detailed description of the project that can span multiple lines. The component will automatically handle the overflow with ellipsis."
  imageUrl="/project-image.jpg"
  techStack={["React", "Next.js", "TailwindCSS"]}
  projectUrl="https://project-demo.com"
  githubUrl="https://github.com/username/project"
/>
*/ 