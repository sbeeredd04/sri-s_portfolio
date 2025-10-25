"use client";

import { 
  IconUser,
  IconBriefcase,
  IconBulb,
  IconTools,
  IconBook,
  IconMail,
  IconHome
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { GlowingEffect } from "./glowing-effect";
import { NavigationCard } from "./NavigationCard";
import { ProjectCardFeature } from "./ProjectCardFeature";
import { BlogCardFeature } from "./BlogCardFeature";
import { ProfileCard } from "./ProfileCard";
import features from "../json/features.json";

export const FeaturingSection = ({ navigateToSection }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create a mapping of box IDs to content
  const createContentMap = () => {
    const contentMap = {};
    
    // Add navigation items
    features.navigation?.forEach(nav => {
      if (nav && nav.id) {
        const boxId = isMobile ? nav.mobileId : nav.id;
        contentMap[boxId] = {
          type: 'navigation',
          data: {
            ...nav,
            backgroundImage: nav.image,
            icon: nav.section === 'about' ? <IconUser size={isMobile ? 16 : 20} /> :
                  nav.section === 'experience' ? <IconBriefcase size={isMobile ? 16 : 20} /> :
                  nav.section === 'projects' ? <IconBulb size={isMobile ? 16 : 20} /> :
                  nav.section === 'skills' ? <IconTools size={isMobile ? 16 : 20} /> :
                  nav.section === 'blog' ? <IconBook size={isMobile ? 16 : 20} /> :
                  nav.section === 'contact' ? <IconMail size={isMobile ? 16 : 20} /> :
                  <IconHome size={isMobile ? 16 : 20} />,
            onClick: () => navigateToSection(nav.section)
          }
        };
      }
    });
    
    // Add project items
    features.projects?.forEach(project => {
      if (project && project.id) {
        const boxId = isMobile ? project.mobileId : project.id;
        contentMap[boxId] = {
          type: 'project',
          data: {
            ...project
          }
        };
      }
    });
    
    // Add blog items
    features.blogs?.forEach(blog => {
      if (blog && blog.id) {
        const boxId = isMobile ? blog.mobileId : blog.id;
        contentMap[boxId] = {
          type: 'blog',
          data: {
            ...blog,
            onClick: () => navigateToSection("blog")
          }
        };
      }
    });
    
    return contentMap;
  };

  const contentMap = createContentMap();

  // Render content based on type
  const renderContent = (boxId) => {
    if (boxId === 1) {
      return <ProfileCard />;
    }
    
    const content = contentMap[boxId];
    if (!content) {
      return (
        <div className="relative h-full rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
          <p className="text-white/60 text-sm">Box {boxId}: No content mapped</p>
        </div>
      );
    }
    
    switch (content.type) {
      case 'navigation':
        return <NavigationCard {...content.data} />;
      case 'project':
        return <ProjectCardFeature project={content.data} />;
      case 'blog':
        return <BlogCardFeature blog={content.data} onClick={content.data.onClick} />;
      default:
        return (
          <div className="relative h-full rounded-lg overflow-hidden bg-black-800 flex items-center justify-center">
            <p className="text-white/60 text-sm">Unknown content type: {content.type}</p>
          </div>
        );
    }
  };

  // Grid configuration mapping box numbers to their grid positions
  const gridConfig = {
    1: "col-span-2 row-span-5",
    2: "col-span-3 row-span-3 col-start-3",
    3: "col-span-3 row-span-2 col-start-6",
    4: "col-span-3 row-span-2 col-start-3 row-start-4",
    5: "col-span-3 row-span-3 col-start-6 row-start-3",
    6: "col-span-4 row-span-2 row-start-6",
    7: "col-span-2 row-span-4 col-start-5 row-start-6",
    8: "col-span-2 row-span-2 col-start-7 row-start-6",
    9: "col-span-2 row-span-2 col-start-7 row-start-8",
    10: "col-span-4 row-span-3 col-start-1 row-start-8",
    11: "col-span-2 row-span-4 col-start-1 row-start-11",
    12: "col-span-2 row-span-4 col-start-3 row-start-11",
    13: "col-span-4 row-span-3 col-start-5 row-start-10",
    14: "col-span-4 row-span-2 col-start-5 row-start-13",
    15: "col-span-3 row-span-2 row-start-15",
    16: "col-span-5 row-span-2 col-start-4 row-start-15"
  };

  // Mobile grid configuration (2 columns)
  const mobileGridConfig = {
    1: "col-span-2 row-span-2", // ProfileCard - full width
    2: "col-span-1 row-span-2", // Navigation items
    3: "col-span-1 row-span-2",
    4: "col-span-2 row-span-2", // Projects - full width, 2 rows
    5: "col-span-2 row-span-2",
    6: "col-span-1 row-span-2", // Navigation items
    7: "col-span-1 row-span-2",
    8: "col-span-2 row-span-2", // Projects
    9: "col-span-1 row-span-2", // Navigation items
    10: "col-span-1 row-span-2",
    11: "col-span-1 row-span-3", // Blog posts - 1 column, 3 rows
    12: "col-span-2 row-span-2", // Projects
    13: "col-span-2 row-span-2", // Projects
    14: "col-span-1 row-span-3", // Blog posts
    15: "col-span-1 row-span-3", // Blog posts
    16: "col-span-1 row-span-3", // Blog posts
  };

  const activeGridConfig = isMobile ? mobileGridConfig : gridConfig;

  return (
    <div className="w-full min-h-screen overflow-y-auto scrollbar-none">
      <div className="w-full p-4 md:p-6">
        <GlowingEffect />
        
        {/* Grid Layout - 2 columns on mobile, 8 columns on desktop */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-8 grid-rows-16'} gap-4 md:gap-6 ${isMobile ? 'min-h-[300vh]' : 'min-h-[250vh]'}`}>
          {/* Dynamically render all 16 boxes */}
          {Array.from({ length: 16 }, (_, i) => {
            const boxId = i + 1;
            return (
              <div key={boxId} className={activeGridConfig[boxId]}>
                <div className="p-1.5 md:p-2 bg-black/5 backdrop-blur-sm border border-white/10 rounded-xl h-full">
                  {renderContent(boxId)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Extra spacing at bottom for better scrolling */}
        <div className="h-24" />
      </div>
    </div>
  );
}; 