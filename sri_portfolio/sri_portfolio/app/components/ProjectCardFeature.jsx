"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconBrandGithub, IconLink, IconBrandYoutube, IconX, IconExternalLink } from "@tabler/icons-react";
import { MarkdownRenderer, hasMarkdown } from "./MarkdownRenderer";

export const ProjectCardFeature = ({ project, onClick }) => {
  const [showModal, setShowModal] = useState(false);
  const videoRef = useRef(null);

  // Add safety check for project prop
  if (!project) {
    return (
      <div className="relative h-full rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
        <p className="text-white/60 text-sm">Project data not found</p>
      </div>
    );
  }

  // Auto-play video on component mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleCardClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  // Shortened description for card display
  const shortDescription = project?.shortDescription || project?.description?.slice(0, 80) + "..." || 'No description available';

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="relative h-full rounded-lg overflow-hidden cursor-pointer group"
      >
        {/* Video Section - Top 60% */}
        <div className="relative h-[60%] rounded-t-lg overflow-hidden">
          {project?.video && (
            <video
              ref={videoRef}
              src={project.video}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          )}
          {!project?.video && (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-white/60 text-sm">No Video</span>
            </div>
          )}
        </div>

        {/* Content Section - Bottom 40% */}
        <div className="h-[40%] p-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
          <div className="h-full flex flex-col justify-between">
            {/* Technologies */}
            <div className="flex flex-wrap gap-1 mb-1">
              {project?.technologies?.slice(0, 2).map((tech, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full text-white">
                  {tech}
                </span>
              ))}
              {project?.technologies?.length > 2 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full text-white">
                  +{project.technologies.length - 2}
                </span>
              )}
            </div>
            
            {/* Title and Description */}
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                {project?.title || 'Untitled Project'}
              </h3>
              <p className="text-white/80 text-xs line-clamp-2">
                {shortDescription}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 mt-2">
              {project?.github && (
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(project.github, '_blank'); }}
                  className="p-1.5 bg-white/10 backdrop-blur-sm rounded hover:bg-white/20 transition-colors"
                >
                  <IconBrandGithub size={12} className="text-white" />
                </button>
              )}
              {project?.href && (
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(project.href, '_blank'); }}
                  className="p-1.5 bg-white/10 backdrop-blur-sm rounded hover:bg-white/20 transition-colors"
                >
                  <IconLink size={12} className="text-white" />
                </button>
              )}
              {project?.youtube && (
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://www.youtube.com/watch?v=${project.youtube}`, '_blank'); }}
                  className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded hover:bg-red-500/30 transition-colors"
                >
                  <IconBrandYoutube size={12} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Project Modal */}
      <AnimatePresence>
        {showModal && (
          <ProjectModal 
            project={project} 
            onClose={handleModalClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Project Modal Component
const ProjectModal = ({ project, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if we're in the browser environment
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999
      }}
    >
              <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-neutral-900/98 border border-white/30 shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-[100000] p-3 rounded-full bg-black/80 text-white hover:bg-black/90 transition-all backdrop-blur-sm border border-white/20 hover:scale-110"
        >
          <IconX size={24} />
        </button>

        <div className="flex flex-col h-full">
          {/* Video Section - Full width at top */}
          <div className="w-full h-[45vh] bg-black rounded-t-2xl overflow-hidden flex-shrink-0">
            {project?.youtube ? (
              <iframe
                src={`https://www.youtube.com/embed/${project.youtube}?autoplay=1&mute=1&loop=1&playlist=${project.youtube}&controls=1&rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={`${project.title} Demo Video`}
              />
            ) : project?.video ? (
              <video
                ref={videoRef}
                src={project.video}
                className="w-full h-full object-cover"
                controls
                loop
                muted
                autoPlay
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <IconBrandYoutube size={32} className="text-white/60" />
                  </div>
                  <span className="text-white/60 text-sm">No video available</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section - Below video */}
          <div className="flex-1 bg-neutral-900/95 rounded-b-2xl overflow-hidden min-h-0">
            <div 
              className="p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                maxHeight: 'calc(90vh - 45vh - 2rem)'
              }}
            >
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.3);
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.5);
                }
                .markdown-content h1,
                .markdown-content h2,
                .markdown-content h3 {
                  scroll-margin-top: 1rem;
                }
                .markdown-content pre {
                  position: relative;
                }
                .markdown-content {
                  line-height: 1.6;
                  max-width: none;
                }
              `}</style>
              
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{project?.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {project?.technologies?.map((tech, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-white/20 rounded-full text-white">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {project?.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Detailed Content (Enhanced Markdown Support) */}
                {project?.detailedContent && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
                    <div className="text-sm leading-relaxed max-w-none">
                      <MarkdownRenderer content={project.detailedContent} />
                    </div>
                  </div>
                )}

                {/* Links */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {project?.github && (
                      <a 
                        href={project.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors"
                      >
                        <IconBrandGithub size={16} />
                        <span>GitHub</span>
                      </a>
                    )}
                    {project?.href && (
                      <a 
                        href={project.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
                      >
                        <IconExternalLink size={16} />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {project?.youtube && (
                      <a 
                        href={`https://www.youtube.com/watch?v=${project.youtube}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                      >
                        <IconBrandYoutube size={16} />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Render modal using portal to document.body
  return createPortal(modalContent, document.body);
}; 