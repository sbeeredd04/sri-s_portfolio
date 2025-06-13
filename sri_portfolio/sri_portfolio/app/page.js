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
  IconMessageCircle,
  IconLink,
  IconShare2,
  IconEye // Added IconEye
} from "@tabler/icons-react";
// Import IconVolumeOff instead of IconVolumeMute (which appears to be unavailable)
import { IconVolumeOff } from "@tabler/icons-react"; 
import { PinContainer } from "./components/3d-pin";
import { Carousel } from "./components/apple-cards-carousel";
import createGlobe from "cobe";
import { CardSpotlight } from "./components/card-spotlight";
import { Card, ExCarousel } from "./components/ExpandableCard";
import { InfiniteMovingCards } from "./components/infinite-moving-cards";
import { Timeline} from "./components/timeline";
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
import { ChatInterface } from "./components/ChatInterface";
import { BentoGrid, BentoGridItem } from "./components/bento-grid";
import { radarSkillsData, detailedSkillsData, gameStatsData, achievementsData } from "./json/skillsData";
import GameSkillsView from "./components/GameSkillsView";
import GitHubStatsView from "./components/GitHubStatsView";
import { FeaturingSection } from "./components/FeaturingSection";
import Loader from "./components/animation/Loader";
import Journey3D from "./components/animation/Journey3D";

export default function Home() {
  // Add these state variables at the top of the component
  const [activeSection, setActiveSection] = useState("home");
  const [activeTab, setActiveTab] = useState("profile");
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState("experience");
  const [showName, setShowName] = useState(true);
  const [showProjectPreview, setShowProjectPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [skillsActiveTab, setSkillsActiveTab] = useState("overview");
  
  // Important: Make sure these hooks are called at the top level
  const { showPlayer, togglePlayerVisibility } = useMusic();
  const { isSoundEnabled, toggleSound, playClickSound } = useSound();
  
  // Check for mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Preload project images when visiting projects section
  useEffect(() => {
    // Only preload when projects section is active
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
  
  // New click sound effect with improved debugging
  useEffect(() => {
    
    // Create a direct click handler function
    const handleClickSound = () => {
      if (isSoundEnabled && typeof playClickSound === 'function') {
        playClickSound();
      }
    };
    
    // Add to document body for global coverage
    if (typeof window !== 'undefined') {
      document.body.addEventListener('click', handleClickSound);
      
      // Also add to specific important elements
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

  //one setting setShow

  // Navigation Items for the Floating Dock
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
      title: "Chat", 
      icon: <IconMessageCircle />, 
      onClick: () => navigateToSection("chat"), 
      href: "#",
      isActive: activeSection === "chat"
    },
    { 
      title: "Contact", 
      icon: <IconMail />, 
      onClick: () => navigateToSection("contact"), 
      href: "#",
      isActive: activeSection === "contact"
    },
  ];



  // Auto slide effect for the header slides - REMOVED as it's not used by Bento Grid
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % slides.length);
  //   }, SLIDE_DURATION);
  //   return () => clearInterval(interval);
  // }, [currentSlide]);

  // Manual slide navigation - REMOVED
  // const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  // const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);


  useEffect(() => {
    const handleScroll = () => {
      setShowName(false);  // Hide name on scroll
  
      // If scroll is back to top, show name
      if (contentContainer.scrollTop === 0) {
        setShowName(true);
      }
    };
  
    // Attempt to find the main content container by ID
    let contentContainer = document.getElementById("main-content");
  
    // If main-content is not found, use the first existing container as a fallback
    if (!contentContainer) {
      contentContainer = document.querySelector(".relative.overflow-y-auto.overflow-x-hidden.p-4");
    } else {
      console.log("main-content container found, adding scroll event listener");
    }
  
    // Attach the event listener to the found container
    if (contentContainer) {
      contentContainer.addEventListener("scroll", handleScroll);
    }
  
    // Cleanup the scroll event listener on component unmount
    return () => {
      if (contentContainer) {
        contentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);
  

  // Use imported blog posts
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
  

  // Handle outside click for closing resume modal
  const handleClickOutside = (e) => {
    if (e.target.id === "resume-modal-overlay") {
      setShowResumePreview(false);
    }
  };

 // Add this function before the return statement
 const handleSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending...';

    const formData = new FormData(form);
    formData.append('service_id', 'service_5g2m4xh'); // Your EmailJS service ID
    formData.append('template_id', 'template_wl8ymvl'); // Your EmailJS template ID
    formData.append('user_id', 'RLJxuFXWF45rA7V4o'); // Your EmailJS public key
    formData.append('subject', 'WEBSITE CONTACT'); // Add subject to formData

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

  // Add these state variables at the top of the component
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Add navigation functions
  const navigateToSection = (section, addToHistory = true) => {
    setActiveSection(section);
    
    // Set default active tab based on the section
    switch (section) {
      case "experience":
        setActiveTab("experience");
        break;
      case "about":
        setActiveTab("profile");
        break;
      case "projects":
        setActiveTab("all");
        break;
      case "skills":
      case "blog":
      case "contact":
      case "home":
        // These sections don't have tabs, so we don't need to set a default tab
        break;
      default:
        // For any other section, keep the current active tab
        break;
    }
    
    if (addToHistory) {
      const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), section];
      setNavigationHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    }
  };

  const goBack = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      navigateToSection(navigationHistory[currentHistoryIndex - 1], false);
    }
  };

  const goForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      navigateToSection(navigationHistory[currentHistoryIndex + 1], false);
    }
  };

  const [currentBackground, setCurrentBackground] = useState("/background/homeEnv.jpg");
  const [isBackgroundMenuOpen, setIsBackgroundMenuOpen] = useState(false);
  const backgroundMenuRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (backgroundMenuRef.current && !backgroundMenuRef.current.contains(event.target)) {
        setIsBackgroundMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showLoader, setShowLoader] = useState(true);
  const [showJourney, setShowJourney] = useState(false);
  const [showMainPortfolio, setShowMainPortfolio] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [journeyLoadingProgress, setJourneyLoadingProgress] = useState(0);
  const [journeyLoadingText, setJourneyLoadingText] = useState('');
  const [isJourneyLoaded, setIsJourneyLoaded] = useState(false);

  useEffect(() => {
    // Initialize navigation history when main portfolio loads
    if (showMainPortfolio && navigationHistory.length === 0) {
      setNavigationHistory(["home"]);
      setCurrentHistoryIndex(0);
    }
  }, [showMainPortfolio, navigationHistory.length]);

  const handleJourneyLoadingProgress = (progress, text) => {
    setJourneyLoadingProgress(progress);
    setJourneyLoadingText(text);
    
    if (progress >= 100) {
      setIsJourneyLoaded(true);
    }
  };

  const handleLoaderComplete = () => {
    setIsTransitioning(true);
    setShowLoader(false);
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowJourney(true);
      setIsTransitioning(false);
    }, 100);
  };

  const handleJourneyComplete = () => {
    setIsTransitioning(true);
    setShowJourney(false);
    
    // Longer delay to match the Journey3D fade out
    setTimeout(() => {
      setShowMainPortfolio(true);
      setIsTransitioning(false);
    }, 1000);
  };

  // Show loader phase with background journey loading
  if (showLoader) {
    return (
      <>
        <Loader 
          onFinish={handleLoaderComplete} 
          externalProgress={journeyLoadingProgress}
          externalLoadingText={journeyLoadingText}
        />
        {/* Preload Journey3D resources in background */}
        <Journey3D 
          onComplete={() => {}} 
          onLoadingProgress={handleJourneyLoadingProgress}
          preloadOnly={true}
          style={{ position: 'fixed', left: '-100vw', top: '-100vh', width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }}
        />
      </>
    );
  }

  // Show journey phase
  if (showJourney) {
    return <Journey3D onComplete={handleJourneyComplete} />;
  }

  // Show transition or main portfolio
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
        <Link href="/my_resume.pdf" download>
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
                  ${currentHistoryIndex > 0 
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goBack}
                disabled={currentHistoryIndex <= 0}
              >
                <IconArrowLeft size={20} stroke={1.5} className="md:hidden" />
                <IconArrowLeft size={24} stroke={1.5} className="hidden md:block" />
              </button>
              <button 
                className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
                  ${currentHistoryIndex < navigationHistory.length - 1 
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goForward}
                disabled={currentHistoryIndex >= navigationHistory.length - 1}
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

            {/* Search/URL Bar - Different for mobile and desktop */}
            <div className="flex-1 mx-2 md:mx-6 min-w-0"> {/* Added min-w-0 */}
              {/* Mobile Search Bar */}
              <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-900/90 rounded-lg border border-white/5 md:hidden">
                <IconSearch size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-400 font-mono truncate">
                  {activeSection}
                </span>
              </div>
              
              {/* Desktop Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900/90 rounded-lg border border-white/5">
                <IconLock size={18} className="text-neutral-500" />
                <span className="text-sm text-neutral-400 font-mono truncate">
                  sriujjwalreddy.com/{activeSection}
                  {activeSection === 'experience' && `/${activeTimeline}`}
                </span>
              </div>
            </div>

            {/* Browser Controls */}
            <div className="flex items-center gap-1 md:gap-4"> {/* Changed mobile gap to gap-1 */}
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
              <div id="theme-button-tutorial-target" className="relative">
                <button
                  onClick={() => setIsBackgroundMenuOpen(!isBackgroundMenuOpen)}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 h-8 rounded-lg bg-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-600/30 transition-colors border border-white/10 md:px-3 md:gap-2" /* Changed mobile px to px-2 */
                >
                  <IconPalette size={20} stroke={1.5} className="md:hidden" />
                  <IconPalette size={24} stroke={1.5} className="hidden md:block" />
                  <span className="text-xs font-medium hidden md:inline md:text-sm">Theme</span>
                </button>
              </div>
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
                  setCurrentBackground(bg.path);
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

        {/* Main Content Area - Takes up remaining space */}
        <div className="flex-1 min-h-0 mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto overflow-x-hidden px-2 py-2 md:px-4 md:py-4 scrollbar-none"
              >
        {/* Home Section */}
                {activeSection === "home" && (
                  <FeaturingSection navigateToSection={navigateToSection} />
                )}

                {activeSection === "about" && (
                  <section className="w-full h-full flex flex-col">
                    <AnimatePresence mode="wait">
                      {activeTab === "profile" && (
                        <motion.div
                          key="profile"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="h-full relative"
                        >
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                            <div className="w-full h-full">
                              <StickyScroll content={aboutMeContent} />
                            </div>
                          </div>
                          
                          {/* Resume Buttons */}
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 md:gap-4 px-4 z-50 pb-2">
                            <Link href="/my_resume.pdf" download>
                              <button className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-500 text-black hover:from-cyan-500 hover:to-emerald-600 transition-all md:px-6 md:py-3 md:text-base shadow-lg hover:shadow-cyan-500/40 active:scale-95">
                                <IconDownload size="1.1em" strokeWidth={2} className="mr-1.5 md:mr-2 flex-shrink-0" />
                                Download Resume
                              </button>
                            </Link>
                            <button
                              className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/20 backdrop-blur-md border border-cyan-400/60 text-cyan-300 hover:bg-black/30 hover:border-cyan-300 hover:text-cyan-200 transition-all md:px-6 md:py-3 md:text-base active:scale-95"
                              onClick={() => setShowResumePreview(true)}
                            >
                              <IconEye size="1.1em" strokeWidth={2} className="mr-1.5 md:mr-2 flex-shrink-0" />
                              View Resume
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "education" && (
                        <motion.div
                          key="education"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col gap-4 md:gap-8 p-3 md:p-8 h-full w-full"
                        >
                          {/* Top Section - Education Details */}
                          <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                              {/* Logo and Title */}
                              <div className="flex items-center gap-3 md:gap-6 md:col-span-3">
                                <img 
                                  src="/asulogo.png" 
                                  alt="ASU Logo" 
                                  className="w-10 h-10 md:w-16 md:h-16 object-contain"
                                />
                                <div>
                                  <h2 className="text-xl md:text-4xl font-bold text-white">Education</h2>
                                  <p className="text-sm md:text-lg text-emerald-400">2022 - 2026</p>
                                </div>
                              </div>

                              {/* University Info */}
                              <div className="md:col-span-1">
                                <h3 className="text-base font-semibold text-cyan-400 md:text-2xl">Arizona State University</h3>
                                <p className="text-sm text-white/80 mt-1 md:text-lg md:mt-2">Bachelor of Science in Computer Science</p>
                                <p className="text-xs text-white/60 md:text-md">Software Engineering Track</p>
                                <div className="mt-2 px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30 md:mt-4 md:px-4 md:py-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/80 md:text-base">GPA</span>
                                    <span className="text-lg font-bold text-emerald-400 md:text-2xl">4.0/4.0</span>
                                  </div>
                                </div>
                              </div>

                              {/* Academic Achievements */}
                              <div className="md:col-span-1 md:ml-8">
                                <h4 className="text-sm font-semibold text-white/90 mt-2 md:text-xl md:mt-0">Academic Achievements</h4>
                                <div className="mt-1 space-y-1 md:space-y-3 md:mt-2">
                                  <p className="text-xs text-white/80 md:text-md">• Dean's List (All Semesters)</p>
                                  <p className="text-xs text-white/80 md:text-md">• New American University Scholar</p>
                                  <p className="text-xs text-white/80 md:text-md">• Minor in Entrepreneurship</p>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="md:col-span-1">
                                <h4 className="text-sm font-semibold text-white/90 mt-2 md:text-xl md:mt-0">Location</h4>
                                <p className="text-xs text-white/60 mt-1 md:text-md md:mt-2">Tempe, Arizona</p>
                                <p className="text-xs text-white/60 md:text-md">United States</p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Section - Coursework Grid */}
                          <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-3 md:p-8 border border-white/10">
                            <h3 className="text-base font-semibold text-cyan-400 mb-3 md:text-2xl md:mb-6">Key Coursework</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-h-[40vh] md:max-h-[calc(100vh-450px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                              {/* CS Core */}
                              <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Computer Science Core</h4>
                                <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                                  <li>• Data Structures and Algorithms</li>
                                  <li>• Operating Systems</li>
                                  <li>• Computer Organization & Assembly</li>
                                  <li>• Theoretical Computer Science</li>
                                  <li>• Software Engineering</li>
                                  <li>• Object-Oriented Programming</li>
                                  <li>• Programming Language Principles</li>
                                  <li>• Digital Design Fundamentals</li>
                                </ul>
                              </div>

                              {/* Software Engineering Track */}
                              <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Software Engineering Track</h4>
                                <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                                  <li>• Software Analysis and Design</li>
                                  <li>• Software QA and Testing</li>
                                  <li>• Distributed Software Development</li>
                                  <li>• Information Assurance</li>
                                </ul>
                              </div>

                              {/* Mathematics & Theory */}
                              <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Mathematics & Theory</h4>
                                <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                                  <li>• Discrete Mathematics</li>
                                  <li>• Calculus for Engineers I, II, III</li>
                                  <li>• Applied Linear Algebra</li>
                                  <li>• Engineering Statistics</li>
                                </ul>
                              </div>

                              {/* Entrepreneurship Minor */}
                              <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Entrepreneurship Minor</h4>
                                <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                                  <li>• Principles of Entrepreneurship</li>
                                  <li>• Creativity and Innovation</li>
                                  <li>• Entrepreneurship & Value Creation</li>
                                </ul>
                              </div>

                              {/* Projects & Practice */}
                              <div className="bg-neutral-700/20 rounded-xl p-3 md:p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/90 mb-1 md:text-lg md:mb-3">Projects & Practice</h4>
                                <ul className="space-y-1 text-xs text-white/60 md:text-base md:space-y-2">
                                  <li>• EPICS Gold Program</li>
                                  <li>• Computer Science Capstone</li>
                                  <li>• Grand Challenge Scholars Program</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "hobbies" && (
                        <motion.div
                          key="hobbies"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center p-4 md:p-8 h-full"
                        >
                          <div className="text-lg text-white/60 md:text-2xl">Hobbies content coming soon...</div>
                        </motion.div>
                      )}

                      {activeTab === "side-quests" && (
                  <motion.div
                          key="side-quests"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center p-4 md:p-8 h-full"
                        >
                          <div className="text-lg text-white/60 md:text-2xl">Side Quests content coming soon...</div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Resume Preview Modal */}
                    {showResumePreview && (
                      <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            setShowResumePreview(false);
                          }
                        }}
                      >
                        <div className="w-[90%] h-[90%] bg-white rounded-xl shadow-2xl overflow-hidden">
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <Link 
                              href="/my_resume.pdf" 
                              download
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Download
                            </Link>
              <button
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              onClick={() => setShowResumePreview(false)}
                            >
                              <IconPlus className="rotate-45" size={24} />
              </button>
            </div>
                          <iframe
                            src="/my_resume.pdf#view=FitH"
                            className="w-full h-full"
                            style={{ background: 'white' }}
                          />
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeSection === "experience" && (
                  <section className="w-full h-full">
                    <div className="w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full"
                        >
                          {activeTab === "experience" ? (
                            <TimelineDemo theme="experience" />
                          ) : (
                            <AchievementTimelineDemo theme="achievements" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
                )}

                {activeSection === "projects" && (
                  <section className="w-full h-full p-4 md:p-8 flex flex-col">
                    <h2 className="text-xl font-bold text-white/90 mb-4 md:text-4xl md:mb-6 flex-shrink-0">
                      {activeTab === "all" ? "Featured Projects" : "Deployed Projects"}
                    </h2>
                    
                    <div 
                      className="flex-1 overflow-y-auto scrollbar-none scroll-smooth"
                      style={{ 
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '120px' // Extra padding at the bottom to prevent getting stuck
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={activeTab}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="pb-20" // Extra padding at bottom for scrolling space
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
                )}

                {activeSection === "skills" && (
                  <section className="w-full h-full">
                    <div className="w-full h-full max-w-7xl mx-auto">
                      <div className="w-full h-full rounded-2xl bg-neutral-800/10 backdrop-blur-xl border border-white/10 overflow-hidden"
                           style={{
                             background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                             backdropFilter: 'blur(20px)',
                             WebkitBackdropFilter: 'blur(20px)',
                           }}>
                        {skillsActiveTab === "overview" ? (
                          <GameSkillsView
                            radarSkills={radarSkillsData}
                            detailedSkills={detailedSkillsData}
                            playerStats={gameStatsData}
                            achievements={achievementsData}
                            activeView={skillsActiveTab}
                          />
                        ) : skillsActiveTab === "github" ? (
                          <GitHubStatsView />
                        ) : (
                          <GameSkillsView
                            radarSkills={radarSkillsData}
                            detailedSkills={detailedSkillsData}
                            playerStats={gameStatsData}
                            achievements={achievementsData}
                            activeView={skillsActiveTab}
                          />
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "blog" && (
                  <section className="w-full h-full">
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="w-full h-full relative px-2 md:px-4">
                        <ExCarousel
                          items={blogPosts.map((post, index) => (
                            <Card
                              key={index}
                              index={index}
                              card={{
                                title: post.title,
                                content: post.content,
                                category: post.category,
                                src: `/${index + 1}.jpg`, 
                              }}
                              className="max-w-[90%] mx-auto"
                            />
                          ))}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "chat" && (
                  <section className="w-full h-full p-1 md:p-4">
                    <ChatInterface />
                  </section>
                )}

                {activeSection === "contact" && (
                  <section className="w-full h-full">
                    <div className="w-full bg-neutral-800/20 backdrop-blur-xl rounded-2xl p-4 md:p-8">
                      <h2 className="text-xl font-bold text-center mb-4 md:text-4xl md:mb-6">Contact Me</h2>
            <div className="mt-4 md:mt-8 text-center">
              <p className="text-sm mb-4 md:text-lg md:mb-6">Feel free to reach out for collaborations or inquiries.</p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3 max-w-2xl mx-auto md:mt-6 md:space-y-4">
                <input 
                  type="text" 
                  name="from_name"
                  placeholder="Your Name" 
                  required
                  className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4" 
                />
                <input 
                  type="email" 
                  name="from_email"
                  placeholder="Your Email" 
                  required
                  className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4" 
                />
                <input 
                  type="hidden" 
                  name="subject"
                  value="WEBSITE CONTACT"
                />
                <textarea 
                  name="message"
                  placeholder="Your Message" 
                  required
                  className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all h-28 md:h-40 md:p-4"
                ></textarea>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-black hover:from-blue-500 hover:to-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 md:px-6 md:py-3"
                >
                  Send Message
                </button>
              </form>
              <div className="mt-4 flex flex-col items-center justify-center space-y-2 md:mt-6 md:space-y-4">
                <div className="text-xs text-gray-500 md:text-sm">or connect with me on</div>
                <div className="flex space-x-3 md:space-x-4">
                  <a 
                    href="https://www.linkedin.com/in/sriujjwal/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-xs md:text-sm"
                  >
                    LinkedIn
                  </a>
                  <span className="text-gray-500">•</span>
                  <a 
                    href="https://github.com/sbeeredd04" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-400 text-xs md:text-sm"
                  >
                    GitHub
                  </a>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 md:mt-4 md:text-sm">
                Or email me directly at{' '}
                <a 
                  href="mailto:srisubspace@gmail.com?subject=WEBSITE CONTACT" 
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  srisubspace@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Spacing */}
        <div className="flex-shrink-0 h-2 md:h-4" />

        {/* Bottom Tabs Container - Floating */}
        <div className="flex-shrink-0 h-12 md:h-16 mx-6" id="tab-switcher-tutorial-target">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-between px-2 md:px-6">
            {/* Dynamic Tabs based on active section */}
            <div className="flex items-center gap-1 md:gap-4 overflow-x-auto scrollbar-none">
              {activeSection === "home" && (
                <>
                  <button
                    className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30 md:px-6 md:py-1.5 md:text-lg"
                  >
                    Overview
                  </button>
                </>
              )}
              
              {activeSection === "about" && (
                <>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "profile"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab("education")}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "education"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab("hobbies")}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "hobbies"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Hobbies
                  </button>
                  <button
                    onClick={() => setActiveTab("side-quests")}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "side-quests"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Side Quests
                  </button>
                </>
              )}

              {activeSection === "experience" && (
                <>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "experience"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("experience")}
                  >
                    Experience
                  </button>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "achievements"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("achievements")}
                  >
                    Achievements
                  </button>
                </>
              )}

              {activeSection === "projects" && (
                <>
                  <button 
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "all"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Projects
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      activeTab === "deployed"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("deployed")}
                  >
                    Deployed Projects
                  </button>
                </>
              )}

              {activeSection === "skills" && (
                <>
                  <button 
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      skillsActiveTab === "overview"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setSkillsActiveTab("overview")}
                  >
                    Skill Overview
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg ${
                      skillsActiveTab === "github"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setSkillsActiveTab("github")}
                  >
                    GitHub Analytics
                  </button>
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

              {activeSection === "chat" && (
                <>
                  <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30 md:px-6 md:py-1.5 md:text-lg">
                    Chat
                  </button>
                  <button className="px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5 md:px-6 md:py-1.5 md:text-lg">
                    Assistant
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

            {/* Social Links - Only visible on desktop */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-4" id="social-links-tutorial-target">
                <Link 
                  href="https://github.com/sbeeredd04" 
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-neutral-700/30 transition-all"
                >
                  <IconBrandGithub size={32} stroke={1.25} />
                  <span className="text-sm font-medium">GitHub</span>
                </Link>
                <Link 
                  href="https://www.linkedin.com/in/sriujjwal/" 
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-neutral-700/30 transition-all"
                >
                  <IconBrandLinkedin size={32} stroke={1.25} />
                  <span className="text-sm font-medium">LinkedIn</span>
                </Link>
                <Link 
                  href="mailto:srisubspace@gmail.com" 
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-neutral-700/30 transition-all"
                >
                  <IconMail size={32} stroke={1.25} />
                  <span className="text-sm font-medium">Email</span>
                </Link>
                <Link 
                  href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" 
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-neutral-700/30 transition-all"
                >
                  <IconBrandSpotify size={32} stroke={1.25} />
                  <span className="text-sm font-medium">Spotify</span>
                </Link>
                <Link 
                  href="/my_resume.pdf" 
                  download
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all border border-emerald-500/30"
                >
                  <IconDownload size={32} stroke={1.25} />
                  <span className="text-sm font-medium">Resume</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className={`flex-shrink-0 ${isMobile ? 'h-16' : 'h-6'}`} />
      </div>

      {/* Spotify Player - Now rendered as a fixed popup outside the main content flow */}
      {showPlayer && <SpotifyPlayer />}
      
      {/* Tutorial for first-time visitors */}
      <FirstVisitTutorial />
    </motion.div>
  );
}


