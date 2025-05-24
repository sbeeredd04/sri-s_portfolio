"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { SkillsRadarCard } from './SkillsRadar';
import { 
  IconCode, 
  IconServer, 
  IconBrain, 
  IconPalette,
  IconCloud, 
  IconUsers, 
  IconTerminal2,
  IconDeviceDesktop,
  IconChartBar,
  IconDatabase,
  IconGitBranch,
  IconCpu,
  IconBrandPython,
  IconBrandJavascript,
  IconBrandTypescript,
  IconBrandHtml5,
  IconBrandCss3,
  IconBrandReact,
  IconBrandAngular,
  IconBrandVuejs,
  IconBrandTailwind,
  IconLayoutGrid,
  IconLayoutFlex,
  IconBrandNodejs,
  IconFlask,
  IconBrandExpress,
  IconBrandJava,
  IconBrandMicrosoft,
  IconApi,
  IconBrandGraphql,
  IconBrandGit,
  IconBrandAmazon,
  IconBrandGithub,
  IconBrandDocker,
  IconBrandLinux,
  IconBrandApple,
  IconBrandAws,
  IconBrandGoogle,
  IconBrandVercel,
  IconBrandVscode,
  IconBrandVisualStudio,
  IconTool,
  IconBrandFigma,
  IconBrandChrome,
  IconFileText,
  IconLoader2,
  IconMessageCircle2,
  IconMicrophone,
  IconRotateClockwise2,
  IconClock,
  IconBrandOpenai,
  IconBrandCSharp,
  IconBrandSwift,
  IconDeviceMobile, 
  IconBrandMysql,
  IconEye,
  IconBrandDjango,
  IconBrandWebsocket,
  IconBrandGoogleHome,
  IconBrandGithubCopilot,
  IconDeviceImac,
  IconBrandNextjs,
  IconBrandWindows,
  IconBrandVue,
  IconBrandUbuntu,
  IconBrandNotion
} from '@tabler/icons-react';

// Custom Badge Component with consistent styling and proper icons
const CustomBadge = ({ icon, name, category, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20",
    green: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20",
    pink: "bg-pink-500/10 border-pink-500/30 text-pink-300 hover:bg-pink-500/20",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20",
    red: "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`group cursor-pointer border rounded-lg p-3 transition-all duration-200 ${colorClasses[color]}`}
    >
      <div className="flex flex-col items-center gap-2 min-h-[60px] justify-center">
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold leading-tight">{name}</div>
          {category && (
            <div className="text-[10px] opacity-60 mt-1">{category}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Properly categorized skills data with accurate information and available icons
// Properly categorized skills data with accurate information and available icons
const skillSections = [
  {
    id: 'programming',
    title: "Programming Languages",
    description: "Core programming languages across different paradigms",
    icon: <IconCode className="w-4 h-4" />,
    color: "blue",
    radar: {
      title: "Programming Languages",
      skills: [
        { name: "Python", value: 95 },
        { name: "JavaScript", value: 92 },
        { name: "TypeScript", value: 88 },
        { name: "Java", value: 85 },
        { name: "C/C++", value: 80 },
        { name: "Swift", value: 75 },
        { name: "C#", value: 78 },
        { name: "SQL", value: 85 },
        { name: "HTML/CSS", value: 95 },
      ],
    },
    subcategories: [
      {
        name: "Object-Oriented Programming",
        skills: [
          { name: "Python", icon: <IconBrandPython />, color: "yellow" },
          { name: "Java", icon: <IconCode />, color: "orange" },
          { name: "C++", icon: <IconCpu />, color: "blue" },
          { name: "C#", icon: <IconBrandCSharp />, color: "purple" },
          { name: "Swift", icon: <IconBrandSwift />, color: "orange" },
        ],
      },
      {
        name: "Web Technologies",
        skills: [
          { name: "JavaScript", icon: <IconBrandJavascript />, color: "yellow" },
          { name: "TypeScript", icon: <IconBrandTypescript />, color: "blue" },
          { name: "HTML5", icon: <IconBrandHtml5 />, color: "orange" },
          { name: "CSS3", icon: <IconBrandCss3 />, color: "blue" },
        ],
      },
      {
        name: "Scripting & Mobile",
        skills: [
          { name: "Python", icon: <IconBrandPython />, color: "yellow" },
          { name: "Shell Script", icon: <IconTerminal2 />, color: "green" },
          { name: "Flutter", icon: <IconDeviceMobile />, color: "cyan" },
        ],
      },
    ],
  },
  {
    id: 'frontend',
    title: "Frontend Development",
    description: "Modern UI/UX development and client-side technologies",
    icon: <IconPalette className="w-4 h-4" />,
    color: "amber",
    radar: {
      title: "Frontend Development",
      skills: [
        { name: "React", value: 95 },
        { name: "AngularJS", value: 82 },
        { name: "Three.js", value: 78 },
        { name: "Vue.js", value: 80 },
        { name: "Tailwind CSS", value: 90 },
        { name: "UI/UX Design", value: 82 },
        { name: "Responsive Design", value: 95 },
      ],
    },
    subcategories: [
      {
        name: "Frontend Frameworks",
        skills: [
          { name: "React", icon: <IconBrandReact />, color: "cyan" },
          { name: "AngularJS", icon: <IconBrandAngular />, color: "red" },
          { name: "Next.js", icon: <IconBrandNextjs />, color: "blue" },
          { name: "Three.js", icon: <IconDeviceDesktop />, color: "blue" },
          { name: "Vue.js", icon: <IconBrandVue />, color: "green" },
        ],
      },
      {
        name: "Styling & Design",
        skills: [
          { name: "Tailwind CSS", icon: <IconBrandTailwind />, color: "cyan" },
          { name: "Sass/SCSS", icon: <IconPalette />, color: "pink" },
          { name: "CSS Grid", icon: <IconLayoutGrid />, color: "blue" },
          { name: "Flexbox", icon: <IconLayoutGrid />, color: "purple" },
        ],
      },
    ],
  },
  {
    id: 'backend',
    title: "Backend Development",
    description: "Server-side development and API architecture",
    icon: <IconServer className="w-4 h-4" />,
    color: "emerald",
    radar: {
      title: "Backend Development",
      skills: [
        { name: "Node.js", value: 88 },
        { name: "Django", value: 92 },
        { name: "Flask", value: 85 },
        { name: "Express.js", value: 85 },
        { name: "Database Design", value: 85 },
        { name: "API Development", value: 90 },
      ],
    },
    subcategories: [
      {
        name: "Backend Frameworks",
        skills: [
          { name: "Node.js", icon: <IconBrandNodejs />, color: "green" },
          { name: "Django", icon: <IconBrandDjango />, color: "green" },
          { name: "Flask", icon: <IconFlask />, color: "cyan" },
          { name: "Express.js", icon: <IconBrandNodejs />, color: "yellow" },
          { name: "Java", icon: <IconCode />, color: "red" },
          { name: ".NET", icon: <IconBrandWindows />, color: "blue" },
        ],
      },
      {
        name: "Development",
        skills: [
          { name: "RESTful APIs", icon: <IconApi />, color: "blue" },
          { name: "GraphQL", icon: <IconBrandGraphql />, color: "pink" },
          { name: "WebSockets", icon: <IconBrandReact />, color: "purple" },
          { name: "FastAPI", icon: <IconBrandPython />, color: "cyan" },
          { name: "SQLAlchemy", icon: <IconDatabase />, color: "blue" },
          { name: "MySQL", icon: <IconBrandMysql />, color: "blue" },
          { name: "Chrome Extension Development", icon: <IconBrandChrome />, color: "purple" },
        ],
      },
    ],
  },
  {
    id: 'datascience',
    title: "Data Science & AI",
    description: "Machine learning, data analysis, and artificial intelligence",
    icon: <IconBrain className="w-4 h-4" />,
    color: "violet",
    radar: {
      title: "Data Science & AI",
      skills: [
        { name: "Machine Learning", value: 85 },
        { name: "Deep Learning", value: 82 },
        { name: "Neural Networks", value: 80 },
        { name: "LLM/LLVM", value: 78 },
        { name: "Computer Vision", value: 80 },
        { name: "Reinforcement Learning", value: 75 },
      ],
    },
    subcategories: [
      {
        name: "Machine Learning",
        skills: [
          { name: "TensorFlow", icon: <IconBrain />, color: "orange" },
          { name: "PyTorch", icon: <IconBrain />, color: "orange" },
          { name: "scikit-learn", icon: <IconChartBar />, color: "blue" },
          { name: "OpenCV", icon: <IconEye />, color: "blue" },
        ],
      },
      {
        name: "AI Techniques",
        skills: [
          { name: "Neural Networks", icon: <IconBrain />, color: "pink" },
          { name: "LLM/LLVM", icon: <IconBrain />, color: "purple" },
          { name: "Deep Learning", icon: <IconBrain />, color: "red" },
          { name: "Unsupervised Learning", icon: <IconChartBar />, color: "green" },
          { name: "Gemini", icon: <IconBrandGoogle />, color: "blue" },
          { name: "ChatGPT API", icon: <IconBrandOpenai />, color: "black" },
        ],
      },
    ],
  },
  {
    id: 'devops',
    title: "DevOps & Cloud",
    description: "Cloud platforms, containerization, and deployment",
    icon: <IconCloud className="w-4 h-4" />,
    color: "cyan",
    radar: {
      title: "DevOps & Cloud",
      skills: [
        { name: "Docker", value: 85 },
        { name: "AWS", value: 80 },
        { name: "Linux/Unix", value: 88 },
        { name: "GitHub", value: 90 },
        { name: "CI/CD", value: 80 },
        { name: "Kubernetes", value: 75 },
      ],
    },
    subcategories: [
      {
        name: "Development Tools",
        skills: [
          { name: "Git", icon: <IconBrandGit />, color: "orange" },
          { name: "GitHub", icon: <IconBrandGithub />, color: "purple" },
          { name: "Docker", icon: <IconBrandDocker />, color: "blue" },
          { name: "Linux/Unix", icon: <IconBrandUbuntu />, color: "yellow" },
          { name: "macOS", icon: <IconDeviceImac />, color: "black" },
        ],
      },
      {
        name: "Cloud Platforms",
        skills: [
          { name: "AWS", icon: <IconBrandAws />, color: "orange" },
          { name: "Google Cloud", icon: <IconBrandGoogle />, color: "blue" },
          { name: "Jupyter Notebooks", icon: <IconCode />, color: "orange" },
          { name: "Google Colab", icon: <IconBrandGoogle />, color: "green" },
          { name: "Vercel", icon: <IconBrandVercel />, color: "black" },
        ],
      },
    ],
  },
  {
    id: 'tools',
    title: "Tools & Environments",
    description: "Development environments and productivity tools",
    icon: <IconTool className="w-4 h-4" />,
    color: "rose",
    radar: {
      title: "Tools & Environments",
      skills: [
        { name: "VS Code", value: 95 },
        { name: "XCode", value: 75 },
        { name: "Streamlit", value: 82 },
        { name: "Selenium", value: 78 },
        { name: "Jupyter", value: 85 },
        { name: "Figma", value: 80 },
      ],
    },
    subcategories: [
      {
        name: "IDEs & Editors",
        skills: [
          { name: "VS Code", icon: <IconBrandVscode />, color: "blue" },
          { name: "XCode", icon: <IconDeviceDesktop />, color: "cyan" },
          { name: "Jupyter", icon: <IconCode />, color: "orange" },
          { name: "Visual Studio", icon: <IconBrandVisualStudio />, color: "purple" },
        ],
      },
      {
        name: "Productivity Tools",
        skills: [
          { name: "Streamlit", icon: <IconTerminal2 />, color: "green" },
          { name: "Selenium", icon: <IconTool />, color: "red" },
          { name: "Figma", icon: <IconBrandFigma />, color: "purple" },
          { name: "LaTeX", icon: <IconFileText />, color: "teal" },
          { name: "Notion", icon: <IconBrandNotion />, color: "purple" },
        ],
      },
      {
        name: "Cloud Platforms",
        skills: [
          { name: "Vercel", icon: <IconBrandVercel />, color: "black" },
        ],
      },
    ],
  },
  {
    id: 'personal',
    title: "Personal & Interpersonal Skills",
    description: "Soft skills and personal attributes",
    icon: <IconUsers className="w-4 h-4" />,
    color: "sky",
    radar: {
      title: "Personal Skills",
      skills: [
        { name: "Communication", value: 90 },
        { name: "Presentation", value: 85 },
        { name: "Teamwork", value: 95 },
        { name: "Leadership", value: 88 },
        { name: "Problem Solving", value: 92 },
        { name: "Adaptability", value: 90 },
        { name: "Time Management", value: 90 },
      ],
    },
    subcategories: [
      {
        name: "Soft Skills",
        skills: [
          { name: "Communication", icon: <IconMessageCircle2 />, color: "blue" },
          { name: "Presentation", icon: <IconMicrophone />, color: "orange" },
          { name: "Teamwork", icon: <IconUsers />, color: "green" },
          { name: "Problem Solving", icon: <IconCpu />, color: "red" },
        ],
      },
      {
        name: "Leadership & Management",
        skills: [
          { name: "Leadership", icon: <IconUsers />, color: "purple" },
          { name: "Adaptability", icon: <IconRotateClockwise2 />, color: "teal" },
          { name: "Time Management", icon: <IconClock />, color: "yellow" },
        ],
      },
    ],
  },
];

// Modern skill card component with subcategories
const ModernSkillCard = ({ section }) => {
  return (
    <div className="rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 overflow-hidden h-full">
      <div className="p-4 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4 lg:mb-6 flex-shrink-0">
          <div className={getSectionIconClasses(section.color)}>
            {section.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg lg:text-xl font-bold text-white truncate">{section.title}</h3>
            <p className="text-xs lg:text-sm text-white/60 line-clamp-2">{section.description}</p>
          </div>
        </div>
        
        {/* Subcategories */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="space-y-6 pb-4">
            {section.subcategories.map((subcategory, subIndex) => (
              <motion.div
                key={subIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: subIndex * 0.1 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">
                  {subcategory.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {subcategory.skills.map((skill, skillIndex) => (
                    <CustomBadge
                      key={skillIndex}
                      icon={skill.icon}
                      name={skill.name}
                      color={skill.color}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get section icon classes
const getSectionIconClasses = (color) => {
  const classMap = {
    blue: "p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400",
    amber: "p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400",
    emerald: "p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400",
    violet: "p-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400",
    cyan: "p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400",
    rose: "p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400",
  };
  return classMap[color] || classMap.blue;
};

// Main GameSkillsView component with single radar design
export const GameSkillsView = ({ activeView = 'overview' }) => {
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const sectionCardRef = useRef(null); 

  const sectionRefs = useRef(skillSections.map(() => React.createRef()));

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleTabClick = (index) => {
    setActiveSection(index);
    if (isMobile && sectionRefs.current[index]?.current) {
      sectionRefs.current[index].current.scrollIntoView({
        behavior: 'smooth',
        block: 'start' 
      });
    }
  };
  
  if (activeView === 'stats') {
    return (
      <div className="w-full h-full p-4">
        <SkillGameStats 
          playerStats={{ level: 28, xp: 8750, nextLevelXp: 10000, stats: [] }}
          achievements={[]}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-neutral-900">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-2 sm:px-4 pt-3 pb-1 border-b border-white/10 bg-neutral-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto hide-scrollbar pb-2">
          {skillSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleTabClick(index)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[11px] sm:text-xs lg:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 min-w-0 shadow-sm hover:shadow-md active:shadow-inner ${
                activeSection === index
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 ring-1 ring-indigo-400/50'
                  : 'bg-neutral-700/40 text-neutral-300 hover:bg-neutral-600/60 hover:text-white border border-white/10'
              }`}
            >
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${getSectionIconClasses(section.color).split(' ').filter(c => c.startsWith('text-'))[0]}`}>{section.icon}</div>
              <span className="hidden sm:inline truncate">{section.title}</span>
              <span className="sm:hidden truncate">{section.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden flex">
        {isMobile ? (
          /* Mobile Layout */
          <div className="h-full flex flex-col overflow-hidden w-full">
            <div className="flex-shrink-0 p-3 sm:p-4 bg-neutral-850/30 border-b border-white/5 shadow-md">
              <div className="h-[280px] sm:h-[320px]">
                <SkillsRadarCard className="h-full" />
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar p-3 sm:p-4 space-y-6">
              {skillSections.map((section, index) => (
                <div 
                  key={section.id}
                  ref={sectionRefs.current[index]}
                >
                  <motion.div
                    initial={{ opacity: 0.6, y: 15 }}
                    animate={{ 
                      opacity: activeSection === index ? 1 : 0.7,
                      y: activeSection === index ? 0 : 10
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  >
                    <ModernSkillCard section={section} />
                  </motion.div>
                </div>
              ))}
              <div className="h-16"></div> {/* Bottom spacing for scroll */}
            </div>
          </div>
        ) : (
          /* Desktop/Tablet Layout */
          <div className="h-full flex flex-1 gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6">
            <div className="w-[38%] 2xl:w-[35%] flex-shrink-0 flex flex-col">
              <div className="flex-1 min-h-0">
                 <SkillsRadarCard className="h-full sticky top-4" />
              </div>
            </div>
            <div ref={sectionCardRef} className="w-[62%] 2xl:w-[65%] flex-1 overflow-y-auto hide-scrollbar pr-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection} // Key change triggers animation
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="h-full"
                >
                  <ModernSkillCard section={skillSections[activeSection]} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .hide-scrollbar {-ms-overflow-style: none; scrollbar-width: none;}
        .hide-scrollbar::-webkit-scrollbar {display: none;}
        .bg-neutral-850\/30 { background-color: rgba(30, 30, 30, 0.3); }
      `}</style>
    </div>
  );
};

export default GameSkillsView; 