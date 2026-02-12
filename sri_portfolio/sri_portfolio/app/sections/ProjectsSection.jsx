"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid, BentoGridItem } from "../components/bento-grid";
import projects from "../json/projects.json";
import deployedProjects from "../json/deployed.json";

/**
 * ProjectsSection Component
 * Displays featured projects and deployed projects in a bento grid layout
 * 
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ("all" or "deployed")
 * @param {Function} props.setActiveTab - Function to set active tab
 * @param {boolean} props.isMobile - Whether viewing on mobile device
 * @returns {JSX.Element}
 */
export default function ProjectsSection({ activeTab, setActiveTab, isMobile }) {
  return (
    <section className="w-full h-full p-4 md:p-8 flex flex-col">
      <h2 className="text-xl font-bold text-white/90 mb-4 md:text-4xl md:mb-6 flex-shrink-0">
        {activeTab === "all" ? "Featured Projects" : "Deployed Projects"}
      </h2>
      
      <div 
        className="flex-1 overflow-y-auto scrollbar-none scroll-smooth"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '120px'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-20"
          >
            {activeTab === "all" ? (
              <BentoGrid className="max-w-7xl mx-auto pb-24">
                {projects.map((project, index) => {
                  // Determine if this project should span 2 columns
                  const spanTwoColumns = 
                    index === 2 || index === 5 || index === 7;
                  
                  return (
                    <BentoGridItem
                      key={index}
                      title={project.title}
                      description={project.description}
                      backgroundImage={project.image}
                      githubUrl={project.github}
                      projectUrl={project.href}
                      icon={
                        <div className="flex flex-wrap gap-2">
                          {project.technologies?.slice(0, isMobile ? 2 : 3).map((tech, i) => (
                            <span 
                              key={i} 
                              className="text-[8px] sm:text-[9px] py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies?.length > (isMobile ? 2 : 3) && (
                            <span className="text-[8px] sm:text-[9px] py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20">
                              +{project.technologies.length - (isMobile ? 2 : 3)}
                            </span>
                          )}
                        </div>
                      }
                      className={`border-white/10 hover:border-white/20 ${
                        spanTwoColumns ? "md:col-span-2" : ""
                      }`}
                    />
                  );
                })}
              </BentoGrid>
            ) : (
              <BentoGrid className="max-w-7xl mx-auto pb-24">
                {deployedProjects.map((project, index) => {
                  // Determine if this project should span 2 columns
                  const spanTwoColumns = 
                    index === 1 || index === 3 || index === 4;
                  
                  return (
                    <BentoGridItem
                      key={index}
                      title={project.title}
                      description={project.description}
                      backgroundImage={project.image}
                      githubUrl={project.github}
                      projectUrl={project.href}
                      icon={
                        <div className="flex flex-wrap gap-2">
                          {project.technologies?.slice(0, isMobile ? 2 : 3).map((tech, i) => (
                            <span 
                              key={i} 
                              className="text-[8px] sm:text-[9px] py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies?.length > (isMobile ? 2 : 3) && (
                            <span className="text-[8px] sm:text-[9px] py-1 px-2 bg-black/80 backdrop-blur-sm rounded-full text-white/95 border border-white/20">
                              +{project.technologies.length - (isMobile ? 2 : 3)}
                            </span>
                          )}
                        </div>
                      }
                      className={`border-white/10 hover:border-white/20 ${
                        spanTwoColumns ? "md:col-span-2" : ""
                      }`}
                    />
                  );
                })}
              </BentoGrid>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
