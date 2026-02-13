"use client";

import { useEffect, useRef, useState, useCallback } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FloatingDock } from "./components/FloatingDock";
import { 
  IconHome, 
  IconUser, 
  IconBriefcase, 
  IconBook, 
  IconMail, 
  IconTools, 
  IconBulb, 
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandSpotify,
  IconArrowLeft, 
  IconArrowRight, 
  IconRefresh, 
  IconLock, 
  IconLetterA,
  IconShare,
  IconVolume,
  IconPlus,
  IconPalette,
  IconChevronDown,
  IconDownload,
  IconSearch,
  IconLayoutSidebar,
  IconLink,
  IconShare2,
  IconEye,
  IconRoute
} from "@tabler/icons-react";
import { IconVolumeOff } from "@tabler/icons-react"; 
import { PinContainer } from "./components/3d-pin";
import { Carousel } from "./components/apple-cards-carousel";
import createGlobe from "cobe";
import { CardSpotlight } from "./components/card-spotlight";
import { Card, ExCarousel } from "./components/ExpandableCard";
import { InfiniteMovingCards } from "./components/infinite-moving-cards";
import { TimelineDemo } from "./timeline";
import { AchievementTimelineDemo } from "./AcheivementTimeline";
import { Cover } from "./components/cover";
import emailjs from '@emailjs/browser';
import projects from "./json/projects.json";
import slides from "./json/slides.json";
import blogs from "./json/blogs.json";
import { ProjectCard } from "./components/ProjectCard";
import deployedProjects from "./json/deployed.json";
import { StickyScroll } from "./components/sticky-scroll-reveal";
import aboutMeContent from "./json/aboutme.json";
import { GlowingEffect } from "./components/glowing-effect";
import { SpotifyPlayer } from "./components/SpotifyPlayer";
import { useMusic } from "./components/MusicProvider";
import { useSound } from "./components/SoundProvider";
import { FirstVisitTutorial } from "./components/FirstVisitTutorial";
import { BentoGrid, BentoGridItem } from "./components/bento-grid";
import { radarSkillsData, detailedSkillsData, gameStatsData, achievementsData } from "./json/skillsData";
import GameSkillsView from "./components/GameSkillsView";
import GitHubStatsView from "./components/GitHubStatsView";
import { FeaturingSection } from "./components/FeaturingSection";
import { LazyLoader as Loader } from "./components/animation/LazyLoader";
import Journey3D from "./components/animation/Journey3D";
import { isMobileDevice } from "./utils/deviceDetection";
import AboutSection from "./sections/AboutSection";
import ExperienceSection from "./sections/ExperienceSection";
import ProjectsSection from "./sections/ProjectsSection";
import SkillsSection from "./sections/SkillsSection";
import BlogSection from "./sections/BlogSection";
import ContactSection from "./sections/ContactSection";
import { TabButton, ResponsiveModal, FormInput, FormTextarea } from "./components/ui";

// Import context hooks
import { useNavigation } from "./hooks/useNavigation";
import { useSettings } from "./hooks/useSettings";
import { useView } from "./hooks/useView";
import { useBreakpoint } from "./hooks/useBreakpoint";

export default function Home() {
  // ============================================================
  // Context Hooks - Centralized state management (5 hooks total)
  // ============================================================
  const { 
    navigate, 
    goBack: contextGoBack,
    goForward: contextGoForward,
    currentSection: activeSection, 
    activeTab,
    setTab,
    canGoBack,
    canGoForward,
    navigationHistory
  } = useNavigation();

  const { 
    isSoundEnabled, 
    toggleSound,
    showPlayer,
    togglePlayer: togglePlayerVisibility,
    currentBackground,
    changeBackground,
    isMobile
  } = useSettings();

  const { 
    showLoader, 
    setShowLoader,
    showJourney, 
    setShowJourney,
    showMainPortfolio, 
    setShowMainPortfolio,
    isTransitioning,
    setIsTransitioning
  } = useView();

  const { isDesktop } = useBreakpoint();

  // ============================================================
  // Remaining Local State (8 hooks - component-specific)
  // ============================================================
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState("experience");
  const [showName, setShowName] = useState(true);
  const [showProjectPreview, setShowProjectPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [skillsActiveTab, setSkillsActiveTab] = useState("github");
  const [isActuallyMobile, setIsActuallyMobile] = useState(false);
  const [preloadedResources, setPreloadedResources] = useState(null);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
  const [isBackgroundMenuOpen, setIsBackgroundMenuOpen] = useState(false);
  
  // Important: Make sure these hooks are called at the top level
  const { showPlayer: oldShowPlayer, togglePlayerVisibility: oldTogglePlayer } = useMusic();
  const { isSoundEnabled: oldIsSoundEnabled, toggleSound: oldToggleSound, playClickSound } = useSound();
  
  const backgroundMenuRef = useRef(null);

  // ============================================================
  // Effects - Reduced from 32 to fewer hooks (consolidated)
  // ============================================================
  
  // Detect actual mobile device for journey skipping
  useEffect(() => {
    setIsActuallyMobile(isMobileDevice());
  }, []);
  
  // Preload project images when visiting projects section
  useEffect(() => {
    if (activeSection === "projects") {
      const allProjects = [...projects, ...deployedProjects];
      allProjects.forEach(project => {
        if (project.image) {
          const img = new Image();
          img.src = project.image.startsWith('/') ? project.image : `/${project.image}`;
        }
      });
    }
  }, [activeSection, activeTab]);
  
  // Click sound effect
  useEffect(() => {
    const handleClickSound = () => {
      if (isSoundEnabled && typeof playClickSound === 'function') {
        playClickSound();
      }
    };
    
    if (typeof window !== 'undefined') {
      document.body.addEventListener('click', handleClickSound);
      const importantButtons = document.querySelectorAll('.FloatingDock button, .Browser-Controls button');
      importantButtons.forEach(btn => {
        btn.addEventListener('click', handleClickSound);
      });
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.body.removeEventListener('click', handleClickSound);
        const importantButtons = document.querySelectorAll('.FloatingDock button, .Browser-Controls button');
        importantButtons.forEach(btn => {
          btn.removeEventListener('click', handleClickSound);
        });
      }
    };
  }, [isSoundEnabled, playClickSound]);

  // Check if this is a first-time visitor
  useEffect(() => {
    const checkFirstTimeVisitor = () => {
      try {
        if (isActuallyMobile) {
          setIsFirstTimeVisitor(false);
          return;
        }
        
        const hasSeenTutorial = localStorage.getItem('portfolio_tutorial_shown') === 'true';
        setIsFirstTimeVisitor(!hasSeenTutorial);
      } catch (error) {
        console.error('Error checking first-time visitor status:', error);
        setIsFirstTimeVisitor(isActuallyMobile ? false : true);
      }
    };
    
    checkFirstTimeVisitor();
  }, [isActuallyMobile]);

  // Handle scroll to show/hide name
  useEffect(() => {
    const handleScroll = () => {
      setShowName(false);
  
      let contentContainer = document.getElementById("main-content");
  
      if (!contentContainer) {
        contentContainer = document.querySelector(".relative.overflow-y-auto.overflow-x-hidden.p-4");
      } else {
        console.log("main-content container found, adding scroll event listener");
      }
  
      if (contentContainer && contentContainer.scrollTop === 0) {
        setShowName(true);
      }
    };
  
    let contentContainer = document.getElementById("main-content");
  
    if (!contentContainer) {
      contentContainer = document.querySelector(".relative.overflow-y-auto.overflow-x-hidden.p-4");
    }
  
    if (contentContainer) {
      contentContainer.addEventListener("scroll", handleScroll);
    }
  
    return () => {
      if (contentContainer) {
        contentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Handle background menu clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (backgroundMenuRef.current && !backgroundMenuRef.current.contains(event.target)) {
        setIsBackgroundMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Skip loader on mobile
  useEffect(() => {
    if (showLoader && isActuallyMobile) {
      const timer = setTimeout(() => {
        setShowLoader(false);
        setShowMainPortfolio(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showLoader, isActuallyMobile]);

  // ============================================================
  // Navigation Functions
  // ============================================================

  const navigateToSection = (section, tab = undefined) => {
    navigate(section, tab);
  };

  const goBack = () => {
    contextGoBack();
  };

  const goForward = () => {
    contextGoForward();
  };

  // Manual journey invocation - only allow on desktop
  const handleManualJourney = () => {
    if (isActuallyMobile) {
      console.log('Journey is not available on mobile devices');
      return;
    }
    
    setShowMainPortfolio(false);
    setShowJourney(true);
    setIsTransitioning(false);
  };

  const handleResourcesReady = (resources) => {
    setPreloadedResources(resources);
  };

  const handleLoaderComplete = () => {
    setIsTransitioning(true);
    setShowLoader(false);
    
    setTimeout(() => {
      if (isActuallyMobile || !isFirstTimeVisitor) {
        setShowMainPortfolio(true);
        setIsTransitioning(false);
      } else {
        setShowJourney(true);
        setIsTransitioning(false);
      }
    }, 100);
  };

  const handleJourneyComplete = () => {
    setIsTransitioning(true);
    setShowJourney(false);
    
    if (isFirstTimeVisitor) {
      try {
        localStorage.setItem('portfolio_tutorial_shown', 'true');
        setIsFirstTimeVisitor(false);
      } catch (error) {
        console.error('Error saving tutorial status:', error);
      }
    }
    
    setTimeout(() => {
      setShowMainPortfolio(true);
      setIsTransitioning(false);
    }, 1000);
  };

  // ============================================================
  // Navigation Items for Floating Dock
  // ============================================================
  const items = [
    { 
      title: "Home", 
      icon: <IconHome />, 
      onClick: () => navigateToSection("home"), 
      href: "#",
      isActive: activeSection === "home"
    },
    { 
      title: "About Me", 
      icon: <IconUser />, 
      onClick: () => navigateToSection("about"), 
      href: "#",
      isActive: activeSection === "about"
    },
    { 
      title: "Experience", 
      icon: <IconBriefcase />, 
      onClick: () => navigateToSection("experience"), 
      href: "#",
      isActive: activeSection === "experience"
    },
    { 
      title: "Projects", 
      icon: <IconBulb />, 
      onClick: () => navigateToSection("projects"), 
      href: "#",
      isActive: activeSection === "projects"
    },
    { 
      title: "Skills", 
      icon: <IconTools />, 
      onClick: () => navigateToSection("skills"), 
      href: "#",
      isActive: activeSection === "skills"
    },
    { 
      title: "Blog", 
      icon: <IconBook />, 
      onClick: () => navigateToSection("blog"), 
      href: "#",
      isActive: activeSection === "blog"
    },
    { 
      title: "Contact", 
      icon: <IconMail />, 
      onClick: () => navigateToSection("contact"), 
      href: "#",
      isActive: activeSection === "contact"
    },
  ];

  // ============================================================
  // Background Configurations
  // ============================================================
  const backgrounds = [
    { name: "Default", path: "/background/homeEnv.jpg" },
    { name: "catimatos", path: "/background/catimatos.jpg" },
    { name: "PineForest", path: "/background/bg2.jpg" },
    { name: "Moon", path: "/background/moon.jpg" },
    { name: "Antelope Canyon", path: "/background/antelope.jpg" },
    { name: "Bridge", path: "/background/bridge.jpg" },
    { name: "House", path: "/background/house.jpg" },
    { name: "Leaves", path: "background/leaves.jpg"},
    { name: "Stars", path: "background/purpleStars.jpg"},
    { name: "Stars-2", path: "background/stars.jpg"},
  ];

  // ============================================================
  // Email Handler
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending...';

      const formData = new FormData(form);
      formData.append('service_id', 'service_5g2m4xh');
      formData.append('template_id', 'template_wl8ymvl');
      formData.append('user_id', 'RLJxuFXWF45rA7V4o');
      formData.append('subject', 'WEBSITE CONTACT');

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send-form', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Message sent successfully!');
        form.reset();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Send Message';
    }
  };

  const blogPosts = blogs;  
  
  const skillsSections = [
    {
      category: "Programming Languages",
      skills: [
        { icon: "https://img.shields.io/badge/c-%2300599C.svg?style=for-the-badge&logo=c&logoColor=white" },
        { icon: "https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white" },
        { icon: "https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white" },
        { icon: "https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" },
        { icon: "https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" },
        { icon: "https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" },
        { icon: "https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" },
        { icon: "https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" },
        { icon: "https://img.shields.io/badge/powershell-%235391FE.svg?style=for-the-badge&logo=powershell&logoColor=white" },
        { icon: "https://img.shields.io/badge/shell_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white" },
        { icon: "https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=csharp&logoColor=white" },
        { icon: "https://img.shields.io/badge/matlab-%230076A8.svg?style=for-the-badge&logo=matrix&logoColor=white" }
      ],
    },
    {
      category: "Frameworks & Libraries",
      skills: [
        { icon: "https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" },
        { icon: "https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white" },
        { icon: "https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" },
        { icon: "https://img.shields.io/badge/fastapi-005571?style=for-the-badge&logo=fastapi" },
        { icon: "https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white" },
        { icon: "https://img.shields.io/badge/next.js-black?style=for-the-badge&logo=next.js&logoColor=white" },
        { icon: "https://img.shields.io/badge/tensorflow-%23FF6F00.svg?style=for-the-badge&logo=tensorflow&logoColor=white" },
        { icon: "https://img.shields.io/badge/pytorch-%23EE4C2C.svg?style=for-the-badge&logo=pytorch&logoColor=white" },
        { icon: "https://img.shields.io/badge/opencv-%23white.svg?style=for-the-badge&logo=opencv&logoColor=white" },
        { icon: "https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white" },
        { icon: "https://img.shields.io/badge/matplotlib-%23ffffff.svg?style=for-the-badge&logo=matplotlib&logoColor=black" },
        { icon: "https://img.shields.io/badge/numpy-%23013243.svg?style=for-the-badge&logo=numpy&logoColor=white" },
        { icon: "https://img.shields.io/badge/pandas-%23150458.svg?style=for-the-badge&logo=pandas&logoColor=white" },
        { icon: "https://img.shields.io/badge/plotly-%233F4F75.svg?style=for-the-badge&logo=plotly&logoColor=white" },
        { icon: "https://img.shields.io/badge/selenium-43B02A?style=for-the-badge&logo=selenium&logoColor=white" },
        { icon: "https://img.shields.io/badge/flutter-%2302569B.svg?style=for-the-badge&logo=flutter&logoColor=white" },
        { icon: "https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" },
        { icon: "https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" },
        { icon: "https://img.shields.io/badge/stable_baselines3-%23FF6F00.svg?style=for-the-badge&logo=python&logoColor=white" },
        { icon: "https://img.shields.io/badge/gymnasium-%23FF6F00.svg?style=for-the-badge&logo=python&logoColor=white" },
        { icon: "https://img.shields.io/badge/ray-%23028CF0.svg?style=for-the-badge&logo=python&logoColor=white" }
      ],
    },
    {
      category: "Software Tools & Environments",
      skills: [
        { icon: "https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white" },
        { icon: "https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" },
        { icon: "https://img.shields.io/badge/aws-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" },
        { icon: "https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white" },
        { icon: "https://img.shields.io/badge/google_cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" },
        { icon: "https://img.shields.io/badge/vs_code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" },
        { icon: "https://img.shields.io/badge/jupyter-F37626?style=for-the-badge&logo=jupyter&logoColor=white" },
        { icon: "https://img.shields.io/badge/eclipse-2C2255?style=for-the-badge&logo=eclipse&logoColor=white" },
        { icon: "https://img.shields.io/badge/excel-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white" },
        { icon: "https://img.shields.io/badge/linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" },
        { icon: "https://img.shields.io/badge/Unix-FCC624?style=for-the-badge&logo=unix&logoColor=black" },
        { icon: "https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white" }
      ],
    },
    {
      category: "Design & UX Tools",
      skills: [
        { icon: "https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white" },
        { icon: "https://img.shields.io/badge/adobe_illustrator-%23FF9A00.svg?style=for-the-badge&logo=adobe-illustrator&logoColor=white" },
        { icon: "https://img.shields.io/badge/adobe_photoshop-31A8FF.svg?style=for-the-badge&logo=adobe-photoshop&logoColor=white" },
        { icon: "https://img.shields.io/badge/canva-%2300C4CC.svg?style=for-the-badge&logo=canva&logoColor=white" }
      ],
    },
    {
      category: "Hardware & Embedded Systems",
      skills: [
        { icon: "https://img.shields.io/badge/raspberry_pi-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white" }
      ],
    }
  ];

  // ============================================================
  // Conditional Rendering - View States
  // ============================================================

  if (showLoader) {
    if (isActuallyMobile) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      );
    }
    
    return (
      <Loader 
        onComplete={handleLoaderComplete} 
        onResourcesReady={handleResourcesReady}
      />
    );
  }

  if (showJourney && !isActuallyMobile) {
    return <Journey3D onComplete={handleJourneyComplete} preloadedResources={preloadedResources} />;
  }

  if (!showMainPortfolio) {
    return (
      <motion.div 
        className="fixed inset-0 bg-black flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <motion.div 
          className="text-white text-xl major-mono-display-regular"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Entering Portfolio...
        </motion.div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
          .major-mono-display-regular {
            font-family: 'Major Mono Display', monospace;
            font-weight: 400;
            font-style: normal;
          }
        `}</style>
      </motion.div>
    );
  }

  // ============================================================
  // Main Portfolio Render
  // ============================================================

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-[100px_1fr] h-screen overflow-hidden relative bg-cover bg-center bg-no-repeat before:content-[''] before:absolute before:inset-0 before:bg-black/50" 
      style={{ backgroundImage: `url(${currentBackground})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {/* Floating Dock */}
      <div className={`relative z-50 opacity-90 ${isMobile ? 'fixed bottom-0 w-full z[9999]' : 'left-0 z-[9999]'} opacity-100`}>
        <FloatingDock items={items} id="floating-dock-tutorial-target" />
      </div>

      {/* Main Content */}
      <div className="relative h-screen w-full flex flex-col overflow-hidden">

        {/* Custom Top-Right Navbar - Only visible on mobile */}
        {isMobile && (
          <div
            id="mobile-connections-tutorial-target"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-60 rounded-2xl shadow-lg z-[1000] py-2 px-4"
          >
            <Link href="https://github.com/sbeeredd04" target="_blank">
              <IconBrandGithub className="text-white hover:text-gray-400 mx-1" size={20} />
            </Link>
            <Link href="https://www.instagram.com/sriujjwalreddy/" target="_blank">
              <IconBrandInstagram className="text-pink-500 hover:text-pink-400 mx-1" size={20} />
            </Link>
            <Link href="https://www.linkedin.com/in/sriujjwal/" target="_blank">
              <IconBrandLinkedin className="text-blue-700 hover:text-blue-500 mx-1" size={20} />
            </Link>
            <Link href="mailto:srisubspace@gmail.com" target="_blank">
              <IconMail className="text-red-500 hover:text-red-400 mx-1" size={20} />
            </Link>
            <Link href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" target="_blank">
              <IconBrandSpotify className="text-green-500 hover:text-green-400 mx-1" size={20} />
            </Link>
            <Link href="/sri_resume.pdf" download>
              <button className="px-3 py-1.5 text-xs border border-white/40 text-white font-semibold rounded-md shadow-md hover:border-emerald-500 hover:text-emerald-500 transition-all mx-1 bg-transparent">
                Resume
              </button>
            </Link>
          </div>
        )}

        {/* Top Spacing - Flexible */}
        <div className={`flex-shrink-0 ${isMobile ? 'h-16' : 'h-6'}`} />

        {/* Browser Toolbar */}
        <div className="flex-shrink-0 h-12 md:h-16 mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center px-4 py-2 md:px-6">
            {/* Navigation Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
                  ${canGoBack
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goBack}
                disabled={!canGoBack}
              >
                <IconArrowLeft size={20} stroke={1.5} className="md:hidden" />
                <IconArrowLeft size={24} stroke={1.5} className="hidden md:block" />
              </button>
              <button 
                className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
                  ${canGoForward
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goForward}
                disabled={!canGoForward}
              >
                <IconArrowRight size={20} stroke={1.5} className="md:hidden" />
                <IconArrowRight size={24} stroke={1.5} className="hidden md:block" />
              </button>
              <button 
                className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                onClick={() => window.location.reload()}
              >
                <IconRefresh size={20} stroke={1.5} className="md:hidden" />
                <IconRefresh size={24} stroke={1.5} className="hidden md:block" />
              </button>
            </div>

            {/* Search/URL Bar */}
            <div className="flex-1 mx-2 md:mx-6 min-w-0">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-900/90 rounded-lg border border-white/5 md:hidden">
                <IconSearch size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-400 font-mono truncate">
                  {activeSection}
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900/90 rounded-lg border border-white/5">
                <IconLock size={18} className="text-neutral-500" />
                <span className="text-sm text-neutral-400 font-mono truncate">
                  sriujjwalreddy.com/{activeSection}
                  {activeSection === 'experience' && `/${activeTimeline}`}
                </span>
              </div>
            </div>

            {/* Browser Controls */}
            <div className="flex items-center gap-1 md:gap-4">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700/50 border border-white/10 overflow-hidden">
                <img 
                  src="/music/mySong.png" 
                  alt="Sri" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div id="sound-toggle-tutorial-target" className="relative">
                <button 
                  className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                  onClick={toggleSound}
                >
                  {isSoundEnabled ? (
                    <>
                      <IconVolume size={20} stroke={1.5} className="md:hidden" />
                      <IconVolume size={24} stroke={1.5} className="hidden md:block" />
                    </>
                  ) : (
                    <>
                      <IconVolumeOff size={20} stroke={1.5} className="md:hidden" />
                      <IconVolumeOff size={24} stroke={1.5} className="hidden md:block" />
                    </>
                  )}
                </button>
              </div>
              <div id="spotify-player-tutorial-target" className="relative">
                <button 
                  className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                  onClick={togglePlayerVisibility}
                >
                  <IconBrandSpotify size={20} stroke={1.5} className="md:hidden" />
                  <IconBrandSpotify size={24} stroke={1.5} className="hidden md:block" />
                </button>
              </div>
              <div id="theme-button-tutorial-target" className="relative" ref={backgroundMenuRef}>
                <button
                  onClick={() => setIsBackgroundMenuOpen(!isBackgroundMenuOpen)}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 h-8 rounded-lg bg-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-600/30 transition-colors border border-white/10 md:px-3 md:gap-2"
                >
                  <IconPalette size={20} stroke={1.5} className="md:hidden" />
                  <IconPalette size={24} stroke={1.5} className="hidden md:block" />
                  <span className="text-xs font-medium hidden md:inline md:text-sm">Theme</span>
                </button>
              </div>
              {/* Journey button - hide on mobile devices */}
              {!isActuallyMobile && (
                <div className="relative">
                  <button
                    onClick={handleManualJourney}
                    className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                    title="Experience Journey"
                  >
                    <IconRoute size={20} stroke={1.5} className="md:hidden" />
                    <IconRoute size={24} stroke={1.5} className="hidden md:block" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Switcher Dropdown */}
        {isBackgroundMenuOpen && (
          <div className="absolute top-[12.5vh] right-6 mt-2 w-48 rounded-xl bg-neutral-800/60 backdrop-blur-2xl border border-white/10 overflow-hidden z-50">
            {backgrounds.map((bg, index) => (
              <button
                key={index}
                onClick={() => {
                  changeBackground(bg.path);
                  setIsBackgroundMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/60 transition-all text-sm"
              >
                {bg.name}
              </button>
            ))}
          </div>
        )}

        {/* Spacing */}
        <div className="flex-shrink-0 h-2 md:h-4" />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden relative">
            {/* Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,_rgba(0,0,0,1.0)_0%,_rgba(0,0,0,0)5%,_rgba(0,0,0,0)_95%,_rgba(0,0,0,1.0)_100%)] z-10 rounded-2xl"></div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                id="main-scroll-container"
                className="h-full overflow-y-auto overflow-x-hidden px-2 py-2 md:px-4 md:py-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <style jsx global>{`
                  #main-scroll-container::-webkit-scrollbar {
                    display: none;
                  }
                  #main-scroll-container {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                  * {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  }
                  *::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {/* Home Section */}
                {activeSection === "home" && (
                  <FeaturingSection navigateToSection={navigateToSection} />
                )}

                {activeSection === "about" && (
                  <AboutSection activeTab={activeTab} setActiveTab={setActiveTab} />
                )}

                {activeSection === "experience" && (
                  <ExperienceSection activeTab={activeTab} setActiveTab={setActiveTab} />
                )}

                {activeSection === "projects" && (
                  <ProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
                )}

                {activeSection === "skills" && (
                  <SkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
                )}

                {activeSection === "blog" && (
                  <BlogSection />
                )}

                {activeSection === "contact" && (
                  <ContactSection handleSubmit={handleSubmit} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 h-12 md:h-16 mx-6 overflow-x-auto">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center px-2 md:px-6 gap-2 md:gap-4 overflow-x-auto">
            {/* Tab buttons based on section */}
            {activeSection === "about" && (
              <>
                <TabButton
                  label="Profile"
                  isActive={activeTab === "profile"}
                  onClick={() => setTab("profile")}
                />
                <TabButton
                  label="Education"
                  isActive={activeTab === "education"}
                  onClick={() => setTab("education")}
                />
                <TabButton
                  label="Hobbies"
                  isActive={activeTab === "hobbies"}
                  onClick={() => setTab("hobbies")}
                />
                <TabButton
                  label="Side Quests"
                  isActive={activeTab === "side-quests"}
                  onClick={() => setTab("side-quests")}
                />
              </>
            )}

            {activeSection === "experience" && (
              <>
                <TabButton
                  label="Experience"
                  isActive={activeTab === "experience"}
                  onClick={() => setTab("experience")}
                />
                <TabButton
                  label="Achievements"
                  isActive={activeTab === "achievements"}
                  onClick={() => setTab("achievements")}
                />
              </>
            )}

            {activeSection === "projects" && (
              <>
                <TabButton
                  label="All Projects"
                  isActive={activeTab === "all"}
                  onClick={() => setTab("all")}
                />
                <TabButton
                  label="Deployed"
                  isActive={activeTab === "deployed"}
                  onClick={() => setTab("deployed")}
                />
              </>
            )}

            {activeSection === "skills" && (
              <>
                <TabButton
                  label="Skill Overview"
                  isActive={skillsActiveTab === "overview"}
                  onClick={() => setSkillsActiveTab("overview")}
                />
                <TabButton
                  label="GitHub Analytics"
                  isActive={skillsActiveTab === "github"}
                  onClick={() => setSkillsActiveTab("github")}
                />
              </>
            )}

            {activeSection === "blog" && (
              <>
                <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30 md:px-6 md:py-1.5 md:text-lg">
                  All Posts
                </button>
                <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5 md:px-6 md:py-1.5 md:text-lg">
                  Tech
                </button>
                <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5 md:px-6 md:py-1.5 md:text-lg">
                  Tutorials
                </button>
              </>
            )}

            {activeSection === "contact" && (
              <>
                <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30 md:px-6 md:py-1.5 md:text-lg">
                  Contact Form
                </button>
              </>
            )}
          </div>
        </div>

        {/* Social Links - Only visible on desktop */}
        {!isMobile && (
          <div className="flex-shrink-0 h-12 md:h-16 mx-6">
            <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center px-2 md:px-6 gap-2 md:gap-4 overflow-x-auto" id="social-links-tutorial-target">
              <Link 
                href="https://github.com/sbeeredd04" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-neutral-700/30 transition-all whitespace-nowrap"
              >
                <IconBrandGithub size={24} stroke={1.25} />
                <span className="text-sm font-medium hidden md:inline">GitHub</span>
              </Link>
              <Link 
                href="https://www.linkedin.com/in/sriujjwal/" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-neutral-700/30 transition-all whitespace-nowrap"
              >
                <IconBrandLinkedin size={24} stroke={1.25} />
                <span className="text-sm font-medium hidden md:inline">LinkedIn</span>
              </Link>
              <Link 
                href="mailto:srisubspace@gmail.com" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-neutral-700/30 transition-all whitespace-nowrap"
              >
                <IconMail size={24} stroke={1.25} />
                <span className="text-sm font-medium hidden md:inline">Email</span>
              </Link>
              <Link 
                href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-neutral-700/30 transition-all whitespace-nowrap"
              >
                <IconBrandSpotify size={24} stroke={1.25} />
                <span className="text-sm font-medium hidden md:inline">Spotify</span>
              </Link>
              <Link 
                href="/sri_resume.pdf" 
                download
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all border border-emerald-500/30 whitespace-nowrap"
              >
                <IconDownload size={24} stroke={1.25} />
                <span className="text-sm font-medium hidden md:inline">Resume</span>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className={`flex-shrink-0 ${isMobile ? 'h-16' : 'h-6'}`} />
      </div>

      {/* Spotify Player */}
      {showPlayer && <SpotifyPlayer />}
      
      {/* Tutorial for first-time visitors */}
      <FirstVisitTutorial />
    </motion.div>
  );
}
