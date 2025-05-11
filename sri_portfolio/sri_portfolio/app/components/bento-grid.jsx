import { cn } from "../lib/utils";
import { IconBrandGithub, IconShare2 } from "@tabler/icons-react";
import { memo } from 'react';

export const BentoGrid = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-2 md:gap-3 md:auto-rows-[14rem] lg:auto-rows-[15rem] md:grid-cols-3 content-start",
        className
      )}>
      {children}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders of grid items
export const BentoGridItem = memo(({
  className,
  title,
  description,
  header,
  icon,
  onClick,
  backgroundImage,
  githubUrl,
  projectUrl
}) => {
  // Prevent event propagation when clicking links
  const handleLinkClick = (e) => {
    e.stopPropagation();
  };
  
  // Make sure backgroundImage path is correct and add a default
  const imageUrl = backgroundImage || '/projects/default-project.jpg';
  const safeImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group/bento relative row-span-1 flex flex-col justify-center items-center overflow-hidden rounded-xl border border-white/10 transition-colors duration-200 shadow-sm shadow-black/20 cursor-pointer",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('${safeImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: 'translateZ(0)' // Force GPU acceleration
      }}
    >
      {/* Tech stack at top left */}
      <div className="absolute top-2 left-2 z-10">
        {icon}
      </div>
      
      {/* Title and description in absolute center */}
      <div className="relative z-10 text-center px-4 max-w-[90%]">
        <div className="font-mono font-bold text-white/90 text-sm md:text-base mb-1">
          {title}
        </div>
        
        <div className="font-mono text-[10px] md:text-[11px] font-normal text-white/70 line-clamp-2">
          {description}
        </div>
      </div>
      
      {/* GitHub and External Link buttons at bottom right */}
      <div className="absolute bottom-2 right-2 flex space-x-1.5 z-10">
        {githubUrl && (
          <a 
            href={githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="p-1 bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="GitHub"
          >
            <IconBrandGithub size={14} />
          </a>
        )}
        {projectUrl && (
          <a 
            href={projectUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="p-1 bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="View Project"
          >
            <IconShare2 size={14} />
          </a>
        )}
      </div>
    </div>
  );
});
