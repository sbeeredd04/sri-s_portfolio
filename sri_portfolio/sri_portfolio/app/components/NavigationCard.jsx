"use client";

import { motion } from "framer-motion";
import { IconArrowRight } from "@tabler/icons-react";
import { renderMarkdown } from "../utils/markdown";

export const NavigationCard = ({ title, description, icon, onClick, backgroundImage }) => {
  // Add safety check for props
  if (!title) {
    return (
      <div className="relative h-full rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
        <p className="text-white/60 text-sm">Navigation data not found</p>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative h-full rounded-lg overflow-hidden cursor-pointer group"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage || '/blog/home1.jpg'})` }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm group-hover:bg-black/30 transition-all duration-300" />
      <div className="relative h-full p-2 md:p-4 flex flex-col justify-center items-center text-center bg-black/10 backdrop-blur-sm border border-white/20 rounded-lg">
        <div className="text-white/90 mb-2 md:mb-3">{icon}</div>
        <h3 className="text-white font-semibold text-sm md:text-lg mb-1 md:mb-2">{title}</h3>
        <div 
          className="text-white/80 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2"
          dangerouslySetInnerHTML={renderMarkdown(description || 'No description available')}
        />
        <IconArrowRight className="text-white/60 group-hover:translate-x-1 transition-transform" size={16} />
      </div>
    </motion.div>
  );
}; 