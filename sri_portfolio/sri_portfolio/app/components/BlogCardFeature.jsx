"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IconPlayerPlay, IconArrowRight } from "@tabler/icons-react";
import { renderMarkdown } from "../utils/markdown";

export const BlogCardFeature = ({ blog, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  // Add safety check for blog prop
  if (!blog) {
    return (
      <div className="relative h-full rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
        <p className="text-white/60 text-sm">Blog data not found</p>
      </div>
    );
  }

  useEffect(() => {
    if (videoRef.current && blog?.video) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, blog?.video]);

  // Use preview if available, otherwise extract from content
  const getPreview = () => {
    if (blog?.preview) return blog.preview;
    if (!blog?.content) return 'No preview available';
    const sentences = blog.content.match(/[^\.!?]+[\.!?]+/g);
    if (sentences && sentences.length >= 2) {
      return sentences.slice(0, 2).join(' ');
    }
    return blog.content.substring(0, 150) + '...';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="relative h-full rounded-lg overflow-hidden cursor-pointer group"
    >
      {/* Background Image - Always visible */}
      <div className="absolute inset-0">
        <img 
          src={blog?.image || '/home1.jpg'} 
          alt={blog?.title || 'Blog Post'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video overlay - Only visible on hover if video exists */}
      {blog?.video && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={blog.video}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
          />
        </div>
      )}

      {/* Content container with backdrop blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg">
        <div className="relative h-full bg-black/10 backdrop-blur-sm rounded-lg p-8 flex flex-col">
          
          {/* Header Section - Top */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <span className="text-xs px-3 py-1 bg-orange-500/80 backdrop-blur-sm rounded-full text-white border border-orange-400/30 block w-fit mb-2">
                BLOG POST
              </span>
              <h3 className="text-white font-semibold text-lg line-clamp-2 pr-4">
                {blog?.title || 'Untitled Blog Post'}
              </h3>
            </div>
            
            {/* Video Play Icon - Top Right */}
            {blog?.video && (
              <div className="flex-shrink-0 p-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                <IconPlayerPlay size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Content - Center (Flex Grow) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="text-white/90 text-sm leading-relaxed line-clamp-4 max-w-md"
                dangerouslySetInnerHTML={renderMarkdown(getPreview())}
              />
            </div>
          </div>

          {/* Read More - Bottom */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center text-white/60 group-hover:text-white transition-colors">
              <span className="text-sm">Read More</span>
              <IconArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 