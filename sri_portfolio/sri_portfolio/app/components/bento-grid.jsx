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
        "mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:gap-4 md:gap-4 md:auto-rows-[16rem] lg:auto-rows-[18rem] md:grid-cols-3 content-start px-2 sm:px-0",
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
        "group/bento relative row-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 transition-colors duration-200 shadow-md shadow-black/20 cursor-pointer p-4 hover:shadow-lg hover:border-white/20",
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
      {/* Top section with tech stack tags */}
      <div className="z-10 mb-6">
        {icon}
      </div>
      
      {/* Middle section with title and description */}
      <div className="z-10 text-center px-3 sm:px-4 md:px-5 max-w-[95%] sm:max-w-[90%] mx-auto mb-8">
        <div className="font-mono font-bold text-white/90 text-sm md:text-base mb-3">
          {title}
        </div>
        
        <div className="font-mono text-[10px] md:text-[11px] font-normal text-white/70 line-clamp-3 sm:line-clamp-2">
          {description}
        </div>
      </div>
      
      {/* Bottom section with GitHub and External Link buttons */}
      <div className="flex justify-end space-x-2 z-10">
        {githubUrl && (
          <a 
            href={githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors hover:bg-black/90"
            aria-label="GitHub"
          >
            <IconBrandGithub size={15} />
          </a>
        )}
        {projectUrl && (
          <a 
            href={projectUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors hover:bg-black/90"
            aria-label="View Project"
          >
            <IconShare2 size={15} />
          </a>
        )}
      </div>
    </div>
  );
});
