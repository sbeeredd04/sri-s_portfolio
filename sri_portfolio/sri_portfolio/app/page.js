"use client";

import { useEffect, useRef, useState } from "react"; 
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
  IconCopy,
  IconPlus,
  IconPalette,
  IconChevronDown,
  IconDownload,
  IconSearch,
} from "@tabler/icons-react"; // Import relevant icons
import { PinContainer } from "./components/3d-pin"; // Import 3D Pin Container for projects
import { Carousel } from "./components/apple-cards-carousel"; // Import Carousel for projects and blog posts
import createGlobe from "cobe"; // Import cobe to create the globe
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
import { ProjectCard } from "./components/ProjectCard";
import deployedProjects from "./json/deployed.json";
import { StickyScroll } from "./components/sticky-scroll-reveal";
import aboutMeContent from "./json/aboutme.json";


// Slider duration in milliseconds
const SLIDE_DURATION = 2000;

function Globe() {
  const canvasRef = useRef(null);  // <-- useRef to reference the canvas element

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', maxWidth: "600px", aspectRatio: 1 }}
      className="globe-canvas mx-auto"
    />
  );
}

export default function Home() {
  // Add these state variables at the top of the component
  const [activeSection, setActiveSection] = useState("home");
  const [activeTab, setActiveTab] = useState("profile"); // Set default tab to profile
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState("experience");
  const [showName, setShowName] = useState(true);
  const [showProjectPreview, setShowProjectPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigation Items for the Floating Dock
  const items = [
    { title: "Home", icon: <IconHome />, onClick: () => navigateToSection("home"), href: "#" },
    { title: "About Me", icon: <IconUser />, onClick: () => navigateToSection("about"), href: "#" },
    { title: "Experience", icon: <IconBriefcase />, onClick: () => navigateToSection("experience"), href: "#" },
    { title: "Projects", icon: <IconBulb />, onClick: () => navigateToSection("projects"), href: "#" },
    { title: "Skills", icon: <IconTools />, onClick: () => navigateToSection("skills"), href: "#" },
    { title: "Blog", icon: <IconBook />, onClick: () => navigateToSection("blog"), href: "#" },
    { title: "Contact", icon: <IconMail />, onClick: () => navigateToSection("contact"), href: "#" },
  ];



  // Auto slide effect for the header slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // Manual slide navigation
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);


  useEffect(() => {
    const handleScroll = () => {
      console.log("Scroll detected in main-content container or fallback"); // Debugging statement
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
      console.log("main-content container not found, using fallback container");
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
        console.log("Removing scroll event listener from main-content or fallback container");
        contentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);
  

  // Placeholder data for Blog Posts
  const blogPosts = [
    {
      title: "Imagine Life as a Website: If Existence Ran on HTTP Requests",
      category: "Tech",
      content: `
  <p>Imagine our world is like a massive website, loaded with HTTP requests, API calls, and conditional statements. Each one of us is like a unique URL endpoint. Life's "server" sends requests, handles responses, and sometimes… well, sometimes you just get a <i>404</i> error. 😆</p>
  
  <p>Here's a deep dive into life if it were structured like a modern web application:</p>
  
  <h2>1. The Signup Page</h2>
  <p>Birth? That's like the "sign-up" page—where we hit "Submit" (or, maybe someone else did?), and suddenly, here we are! We get our user ID (a.k.a. name) and begin our <i>session</i>.</p>
  
  <h2>2. Loading, Loading...</h2>
  <p>Ever feel like you're waiting for something that never arrives? Life's loading bars are basically our day-to-day anticipation—waiting for dreams to process. Sometimes we get the data we requested, sometimes we get a <i>504 Gateway Timeout</i>. 😬</p>
  
  <h2>3. API Calls and Relationships</h2>
  <p>When you meet someone, it's like calling an API endpoint. You send a GET request, hoping for a JSON response with mutual understanding and maybe a few interesting properties. Or, you might get a <i>403 Forbidden</i>—access denied to someone's personal data!</p>
  
  <h2>4. Daily Data Refreshes</h2>
  <p>Every morning, you refresh your "page" with coffee or exercise. You've got new cookies (or bad ones) stored, new "sessions" ready to go. Life is constantly refreshing and re-rendering.</p>
  
  <h2>5. Security Tokens & Trust Issues</h2>
  <p>Trust? It's like a security token—sometimes it gets validated, other times it expires without notice. And yes, those who betray you? That's basically a CSRF attack on your well-being. 😂</p>
  
  <h2>6. The "Terms & Conditions"</h2>
  <p>Ah, the life agreements! We agree to things we might never have read the fine print on, but, hey, we're all "logged in" now, right? Just click "Accept All" and hope for the best.</p>
  
  <h2>7. The Debugging Process</h2>
  <p>Every time you make a mistake, it's like throwing an error in the console. Except, there's no debugger in life. We just try to interpret the cryptic message ("SyntaxError: Can't find happiness") and go on anyway.</p>
  
  <h2>8. 404: Purpose Not Found</h2>
  <p>Sometimes we hit a <i>404 Page Not Found</i> in our journey, wondering if we're on the right URL. Maybe it's a career that's just not loading or relationships stuck in a loop. Good thing we've got "refresh" and plenty of re-routing options!</p>
  
  <h2>9. Scheduled Maintenance (Sleep)</h2>
  <p>Every night, we log off for maintenance. If only there were patch notes every morning, letting us know what life's server team fixed overnight. Maybe a few bugs squashed or minor "optimizations" applied?</p>
  
  <h2>10. Redirects and Major Life Changes</h2>
  <p>A new job, a relationship, a move—these are like 301 Redirects. You're still "you," but now you're located somewhere new on the server, with a fresh HTML and CSS setup.</p>
  
  <h2>11. User Engagement and Feedback Loops</h2>
  <p>What's life without a bit of engagement? Whether it's friends, followers, or family, our "backend" runs on constant feedback loops. And yes, sometimes we go viral for all the wrong reasons. But in the end, it's about how you respond to the response.</p>
  
  <p><strong>In closing</strong>, life as a website might have its quirks and errors, but with every refresh, new opportunities load. Just remember: when life throws you a <i>403 Forbidden</i>, there's always a way to reroute. And if you're ever feeling lost? Sometimes all you need is a hard refresh and a little faith that your server is still up and running.</p>
      `
    },
    { title: "Blog Post 2", category: "Tech", content: "This is the content for blog post 2" },
    { title: "Blog Post 3", category: "Tech", content: "This is the content for blog post 3" },
    { title: "Blog Post 4", category: "Tech", content: "This is the content for blog post 4" }
  ];  
  
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

 return (
    <div 
      className="grid grid-cols-1 md:grid-cols-[100px_1fr] h-screen overflow-hidden relative bg-cover bg-center bg-no-repeat before:content-[''] before:absolute before:inset-0 before:bg-black/50" 
      style={{ backgroundImage: `url(${currentBackground})` }}
    >
      {/* Floating Dock */}
     <div className={`relative z-50 opacity-90 ${isMobile ? 'fixed bottom-0 w-full z[9999]' : 'left-0 z-[9999]'} opacity-100`}>
       <FloatingDock items={items} />
     </div>

      {/* Main Content */}
      <div className="relative h-screen w-full">

        {/* Custom Top-Right Navbar - Only visible on mobile */}
        {isMobile && (
          <div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-60 rounded-2xl shadow-lg z-[1000] py-2 px-4"
      >
        <Link href="https://github.com/sbeeredd04" target="_blank">
              <IconBrandGithub className="text-white hover:text-gray-400 mx-1" size={24} />
        </Link>
            <Link href="https://www.instagram.com/sriujjwalreddy/" target="_blank">
              <IconBrandInstagram className="text-pink-500 hover:text-pink-400 mx-1" size={24} />
        </Link>
        <Link href="https://www.linkedin.com/in/sriujjwal/" target="_blank">
              <IconBrandLinkedin className="text-blue-700 hover:text-blue-500 mx-1" size={24} />
        </Link>
        <Link href="mailto:srisubspace@gmail.com" target="_blank">
          <IconMail className="text-red-500 hover:text-red-400 mx-1" size={24} />
        </Link>
        <Link href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" target="_blank">
              <IconBrandSpotify className="text-green-500 hover:text-green-400 mx-1" size={24} />
        </Link>
        <Link href="/my_resume.pdf" download>
              <button className="px-4 py-2 border border-white/40 text-white font-semibold rounded-md shadow-md hover:border-emerald-500 hover:text-emerald-500 transition-all mx-1 bg-transparent">
            Resume
          </button>
        </Link>
      </div>
        )}

        {/* Top Margin */}
        <div className="h-[10vh] md:h-[7.5vh]" />

        {/* Browser Toolbar */}
        <div className="h-[5vh] mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center px-4 md:px-6">
            {/* Navigation Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                className={`text-neutral-400 hover:text-white transition-colors
                  ${currentHistoryIndex > 0 
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goBack}
                disabled={currentHistoryIndex <= 0}
              >
                <IconArrowLeft size={20} stroke={3} className="md:hidden" />
                <IconArrowLeft size={24} stroke={3} className="hidden md:block" />
              </button>
              <button 
                className={`text-neutral-400 hover:text-white transition-colors
                  ${currentHistoryIndex < navigationHistory.length - 1 
                    ? 'cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'}`}
                onClick={goForward}
                disabled={currentHistoryIndex >= navigationHistory.length - 1}
              >
                <IconArrowRight size={20} stroke={3} className="md:hidden" />
                <IconArrowRight size={24} stroke={3} className="hidden md:block" />
              </button>
              <button 
                className="text-neutral-400 hover:text-white transition-colors"
                onClick={() => window.location.reload()}
              >
                <IconRefresh size={20} stroke={3} className="md:hidden" />
                <IconRefresh size={24} stroke={3} className="hidden md:block" />
              </button>
            </div>

            {/* Search/URL Bar - Different for mobile and desktop */}
            <div className="flex-1 mx-2 md:mx-6">
              {/* Mobile Search Bar */}
              <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-700/20 rounded-lg border border-white/5 md:hidden">
                <IconSearch size={14} className="text-neutral-500" />
                <span className="text-xs text-neutral-400 font-mono truncate">
                  {activeSection}
                </span>
              </div>
              
              {/* Desktop Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-700/20 rounded-lg border border-white/5">
                <IconLock size={18} className="text-neutral-500" />
                <span className="text-sm text-neutral-400 font-mono truncate">
                  sriujjwalreddy.com/{activeSection}
                  {activeSection === 'experience' && `/${activeTimeline}`}
                </span>
              </div>
            </div>

            {/* Browser Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-neutral-700/50 border border-white/10 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center text-white text-xs md:text-sm font-medium">
                  SR
                </div>
              </div>
              <button className="text-neutral-400 hover:text-white transition-colors">
                <IconShare size={20} stroke={3} className="md:hidden" />
                <IconShare size={24} stroke={3} className="hidden md:block" />
              </button>
              <button className="text-neutral-400 hover:text-white transition-colors">
                <IconCopy size={20} stroke={3} className="md:hidden" />
                <IconCopy size={24} stroke={3} className="hidden md:block" />
              </button>
              <button
                onClick={() => setIsBackgroundMenuOpen(!isBackgroundMenuOpen)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-600/30 transition-colors border border-white/10"
              >
                <IconPalette size={20} stroke={3} className="md:hidden" />
                <IconPalette size={24} stroke={3} className="hidden md:block" />
                <span className="text-xs md:text-sm font-medium hidden md:inline">Theme</span>
              </button>
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
        <div className="h-[1vh] md:h-[2.5vh]" />

        {/* Main Content Area */}
        <div className="h-[70vh] mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto overflow-x-hidden px-6 py-6 scrollbar-none"
              >
        {/* Home Section */}
                {activeSection === "home" && (
                  <section className="w-full h-full">
                    <div className="relative w-full h-full">
                      <AnimatePresence mode="wait">
              {slides.map((slide, index) =>
                currentSlide === index ? (
                  <motion.div
                    key={slide.title}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    style={{
                      backgroundImage: `url(${slide.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                              <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-4 md:p-8">
                      <h2 className="text-4xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-md md:text-lg mb-4">{slide.description}</p>
                                <button 
                                  onClick={() => navigateToSection(slide.section)}
                                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all"
                                >
                        Learn More
                                </button>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>

                      <button 
                        onClick={prevSlide} 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all z-10"
                      >
                        <IconArrowLeft className="w-6 h-6" />
            </button>
                      <button 
                        onClick={nextSlide} 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all z-10"
                      >
                        <IconArrowRight className="w-6 h-6" />
            </button>
          </div>
        </section>
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
                            <div className="w-full max-w-[90%]">
                              <StickyScroll content={aboutMeContent} />
                            </div>
                          </div>
                          
                          {/* Resume Buttons */}
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 md:gap-4 px-4 z-50">
                            <Link href="/my_resume.pdf" download>
                              <button className="px-3 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
                                Download Resume
                              </button>
                            </Link>
                            <button
                              className="px-3 md:px-6 py-2 md:py-3 text-sm md:text-base bg-neutral-800/50 backdrop-blur-sm border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 transition-all"
                              onClick={() => setShowResumePreview(true)}
                            >
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
                          className="flex flex-col gap-4 md:gap-8 p-4 md:p-8 h-full w-full"
                        >
                          {/* Top Section - Education Details */}
                          <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-4 md:p-8 border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Logo and Title */}
                              <div className="flex items-center gap-4 md:gap-6 md:col-span-3">
                                <img 
                                  src="/asulogo.png" 
                                  alt="ASU Logo" 
                                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                                />
                                <div>
                                  <h2 className="text-2xl md:text-4xl font-bold text-white">Education</h2>
                                  <p className="text-base md:text-lg text-emerald-400">2022 - 2026</p>
                                </div>
                              </div>

                              {/* University Info */}
                              <div className="md:col-span-1">
                                <h3 className="text-xl md:text-2xl font-semibold text-cyan-400">Arizona State University</h3>
                                <p className="text-base md:text-lg text-white/80 mt-2">Bachelor of Science in Computer Science</p>
                                <p className="text-sm md:text-md text-white/60">Software Engineering Track</p>
                                <div className="mt-4 px-3 md:px-4 py-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm md:text-base text-white/80">GPA</span>
                                    <span className="text-xl md:text-2xl font-bold text-emerald-400">4.0/4.0</span>
                                  </div>
                                </div>
                              </div>

                              {/* Academic Achievements */}
                              <div className="md:col-span-1 md:ml-8">
                                <h4 className="text-lg md:text-xl font-semibold text-white/90 mt-4 md:mt-0">Academic Achievements</h4>
                                <div className="mt-2 space-y-2 md:space-y-3">
                                  <p className="text-sm md:text-md text-white/80">• Dean's List (All Semesters)</p>
                                  <p className="text-sm md:text-md text-white/80">• New American University Scholar</p>
                                  <p className="text-sm md:text-md text-white/80">• Minor in Entrepreneurship</p>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="md:col-span-1">
                                <h4 className="text-lg md:text-xl font-semibold text-white/90 mt-4 md:mt-0">Location</h4>
                                <p className="text-sm md:text-md text-white/60 mt-2">Tempe, Arizona</p>
                                <p className="text-sm md:text-md text-white/60">United States</p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Section - Coursework Grid */}
                          <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-4 md:p-8 border border-white/10">
                            <h3 className="text-xl md:text-2xl font-semibold text-cyan-400 mb-4 md:mb-6">Key Coursework</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 md:pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                              {/* CS Core */}
                              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 border border-white/5">
                                <h4 className="text-base md:text-lg font-semibold text-white/90 mb-2 md:mb-3">Computer Science Core</h4>
                                <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-white/60">
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
                              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 border border-white/5">
                                <h4 className="text-base md:text-lg font-semibold text-white/90 mb-2 md:mb-3">Software Engineering Track</h4>
                                <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-white/60">
                                  <li>• Software Analysis and Design</li>
                                  <li>• Software QA and Testing</li>
                                  <li>• Distributed Software Development</li>
                                  <li>• Information Assurance</li>
                                </ul>
                              </div>

                              {/* Mathematics & Theory */}
                              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 border border-white/5">
                                <h4 className="text-base md:text-lg font-semibold text-white/90 mb-2 md:mb-3">Mathematics & Theory</h4>
                                <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-white/60">
                                  <li>• Discrete Mathematics</li>
                                  <li>• Calculus for Engineers I, II, III</li>
                                  <li>• Applied Linear Algebra</li>
                                  <li>• Engineering Statistics</li>
                                </ul>
                              </div>

                              {/* Entrepreneurship Minor */}
                              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 border border-white/5">
                                <h4 className="text-base md:text-lg font-semibold text-white/90 mb-2 md:mb-3">Entrepreneurship Minor</h4>
                                <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-white/60">
                                  <li>• Principles of Entrepreneurship</li>
                                  <li>• Creativity and Innovation</li>
                                  <li>• Entrepreneurship & Value Creation</li>
                                </ul>
                              </div>

                              {/* Projects & Practice */}
                              <div className="bg-neutral-700/20 rounded-xl p-4 md:p-6 border border-white/5">
                                <h4 className="text-base md:text-lg font-semibold text-white/90 mb-2 md:mb-3">Projects & Practice</h4>
                                <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-white/60">
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
                          className="flex items-center justify-center p-8 h-full"
                        >
                          <div className="text-2xl text-white/60">Hobbies content coming soon...</div>
                        </motion.div>
                      )}

                      {activeTab === "side-quests" && (
                  <motion.div
                          key="side-quests"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-center p-8 h-full"
                        >
                          <div className="text-2xl text-white/60">Side Quests content coming soon...</div>
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
                  <section className="w-full h-full p-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-8">
                      {activeTab === "all" ? "Featured Projects" : "Deployed Projects"}
                    </h2>
                    <div className="w-full h-[calc(100vh-12rem)] overflow-y-auto scrollbar-none">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={activeTab}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-16 pb-8"
                        >
                          {activeTab === "all" ? (
                            projects.map((project, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                  duration: 0.5, 
                                  delay: index * 0.1,
                                  ease: [0.25, 0.1, 0.25, 1]
                                }}
                              >
                                <ProjectCard
                                  title={project.title}
                                  description={project.description}
                                  imageUrl={project.image}
                                  techStack={project.technologies || ["React", "Next.js", "TailwindCSS"]}
                                  projectUrl={project.href}
                                  githubUrl={project.github}
                                />
                              </motion.div>
                            ))
                          ) : (
                            deployedProjects.map((project, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                  duration: 0.5, 
                                  delay: index * 0.1,
                                  ease: [0.25, 0.1, 0.25, 1]
                                }}
                              >
                                <ProjectCard
                                  title={project.title}
                                  description={project.description}
                                  imageUrl={project.image}
                                  techStack={project.technologies || ["React", "Next.js", "TailwindCSS"]}
                                  projectUrl={project.href}
                                  githubUrl={project.github}
                                />
                              </motion.div>
                            ))
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </section>
                )}

                {activeSection === "skills" && (
                  <section className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-full max-w-7xl mx-auto px-4">
                      <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-8 text-center">Technical Skills</h2>
                      <div className="w-full overflow-y-auto max-h-[calc(100vh-16rem)] rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 p-6">
                        <div className="w-full relative">
                          <InfiniteMovingCards
                            sections={skillsSections}
                            direction="left"
                            speed="normal"
                            pauseOnHover={true}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "blog" && (
                  <section className="w-full h-full">
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="w-full h-full relative px-4">
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

                {activeSection === "contact" && (
                  <section className="w-full h-full">
                    <div className="w-full bg-neutral-800/20 backdrop-blur-xl rounded-2xl p-8">
                      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Contact Me</h2>
            <div className="mt-4 md:mt-8 text-center">
              <p className="text-md md:text-lg mb-6">Feel free to reach out for collaborations or inquiries.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-2xl mx-auto">
                <input 
                  type="text" 
                  name="from_name"
                  placeholder="Your Name" 
                  required
                  className="w-full p-3 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <input 
                  type="email" 
                  name="from_email"
                  placeholder="Your Email" 
                  required
                  className="w-full p-3 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" 
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
                  className="w-full p-3 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all h-32 md:h-40"
                ></textarea>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Send Message
                </button>
              </form>
              <div className="mt-6 flex flex-col items-center justify-center space-y-4">
                <div className="text-sm text-gray-500">or connect with me on</div>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.linkedin.com/in/sriujjwal/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    LinkedIn
                  </a>
                  <span className="text-gray-500">•</span>
                  <a 
                    href="https://github.com/sbeeredd04" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-400"
                  >
                    GitHub
                  </a>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
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

        {/* 5% Margin */}
        <div className="h-[1vh] md:h-[5vh]" />

        {/* Bottom Tabs Container - Floating */}
        <div className="h-[5vh] mx-6">
          <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-between px-4 md:px-6">
            {/* Dynamic Tabs based on active section */}
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-none">
              {activeSection === "about" && (
                <>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === "profile"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab("education")}
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === "education"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab("hobbies")}
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === "hobbies"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                  >
                    Hobbies
                  </button>
                  <button
                    onClick={() => setActiveTab("side-quests")}
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
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
                    className={`px-6 py-1.5 rounded-lg text-lg font-medium transition-all ${
                      activeTab === "experience"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("experience")}
                  >
                    Experience
                  </button>
                  <button
                    className={`px-6 py-1.5 rounded-lg text-lg font-medium transition-all ${
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
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === "all"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Projects
                  </button>
                  <button 
                    className={`px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap ${
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
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    All Skills
                  </button>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5">
                    Languages
                  </button>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5">
                    Frameworks
                  </button>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5">
                    Tools
                  </button>
                </>
              )}

              {activeSection === "blog" && (
                <>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    All Posts
                  </button>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5">
                    Tech
                  </button>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5">
                    Tutorials
                  </button>
                </>
              )}

              {activeSection === "contact" && (
                <>
                  <button className="px-3 md:px-6 py-1.5 rounded-lg text-base md:text-lg font-medium transition-all whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Contact Form
                  </button>
                </>
              )}
            </div>

            {/* Social Links - Only visible on desktop */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-4">
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

        {/* Bottom 10% Margin */}
        <div className="h-[10vh] md:h-[5vh]" />
      </div>
    </div>
  );
}
