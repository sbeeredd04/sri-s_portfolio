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
} 

from "@tabler/icons-react"; // Import relevant icons
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

// Slider duration in milliseconds
const SLIDE_DURATION = 5000;

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
  // Navigation Items for the Floating Dock
  const items = [
    { title: "Home", icon: <IconHome />, href: "#home" },
    { title: "About Me", icon: <IconUser />, href: "#about" },
    { title: "Experience", icon: <IconBriefcase />, href: "#experience" },
    { title: "Projects", icon: <IconBulb />, href: "#projects" }, // Lightbulb icon for projects/ideas
    { title: "Skills", icon: <IconTools />, href: "#skills" },
    { title: "Blog", icon: <IconBook />, href: "#blog" }, // Book icon for blog
    { title: "Contact", icon: <IconMail />, href: "#contact" },
  ];

  // Header Slider Data
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showResumePreview, setShowResumePreview] = useState(false); // Modal state for resume preview
  const [activeTimeline, setActiveTimeline] = useState("experience");
  const [showName, setShowName] = useState(true);
  const [showProjectPreview, setShowProjectPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  

  const slides = [
    {
      title: "Welcome to My Portfolio",
      description: "Discover my work and skills.",
      image: "/home1.jpg",
      link: "#home",
    },
    {
      title: "About Me",
      description: "Learn more about me.",
      image: "/home2.jpg",
      link: "#about",
    },
    {
      title: "Professional Experience",
      description: "Explore my professional background.",
      image: "/home3.jpg",
      link: "#experience",
    },
    {
      title: "Featured Projects",
      description: "See my latest projects.",
      image: "/home4.jpg",
      link: "#projects",
    },
    {
      title: "Technical Skills",
      description: "Check out my technical skills.",
      image: "/home5.jpg",
      link: "#skills",
    },
    {
      title: "Blog Insights",
      description: "Read my latest articles.",
      image: "/home6.jpg",
      link: "#blog",
    },
    {
      title: "Get in Touch",
      description: "Contact me for collaborations.",
      image: "/home7.jpg",
      link: "#contact",
    },
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
  

  // Placeholder data for Projects
  const projects = [
    {
      title: "Amano",
      description: "Emotion-Based Song Recommendation System that provides personalized song suggestions using Reinforcement Learning and Spotify's API.",
      href: "https://github.com/sbeeredd04/Amano",
      image: "/p (2).webp",
    },
    {
      title: "Image Insight",
      description: "A web-based tool designed for postdoctoral researchers to automate complex data analysis tasks, significantly increasing research productivity.",
      href: "https://github.com/sbeeredd04/CSDNA",
      image: "/p (3).webp",
    },
    {
      title: "Mine Alliance",
      description: "Fullstack platform that integrates ChatGPT-4 for sustainable mining site impact assessments, reducing response times by 40%.",
      href: "https://github.com/LuaanNguyen/Mine-Alliance",
      image: "/p (4).webp",
    },
    {
      title: "Avisol",
      description: "An automated air traffic pathfinding system that utilizes algorithm optimization to reduce computation time for managing autonomous vehicles.",
      href: "https://github.com/sbeeredd04/AviSol",
      image: "/p (1).webp",
    },

    {
      title: "SafeSide",
      description: "A personal safety app designed for active shooter emergencies, providing real-time location tracking, monitored updates, and tailored evacuation routes using BLE beacons and Google Maps.",
      href: "/SafeSide.pdf", 
      image: "/p (5).webp", 
    },
    
    {
      title: "Heat Wave",
      description: "A responsive web app designed to help users stay safe during heat waves by providing real-time weather alerts, safety guidelines, nearby hospital locations, and emergency contact options.",
      href: "https://github.com/Fido27/heat-wave", 
      image: "/p (6).webp", 
    }    

  ];

  // Placeholder data for Blog Posts
  const blogPosts = [
    {
      title: "Imagine Life as a Website: If Existence Ran on HTTP Requests",
      category: "Tech",
      content: `
  <p>Imagine our world is like a massive website, loaded with HTTP requests, API calls, and conditional statements. Each one of us is like a unique URL endpoint. Life’s “server” sends requests, handles responses, and sometimes… well, sometimes you just get a <i>404</i> error. 😆</p>
  
  <p>Here's a deep dive into life if it were structured like a modern web application:</p>
  
  <h2>1. The Signup Page</h2>
  <p>Birth? That’s like the “sign-up” page—where we hit “Submit” (or, maybe someone else did?), and suddenly, here we are! We get our user ID (a.k.a. name) and begin our <i>session</i>.</p>
  
  <h2>2. Loading, Loading...</h2>
  <p>Ever feel like you're waiting for something that never arrives? Life’s loading bars are basically our day-to-day anticipation—waiting for dreams to process. Sometimes we get the data we requested, sometimes we get a <i>504 Gateway Timeout</i>. 😬</p>
  
  <h2>3. API Calls and Relationships</h2>
  <p>When you meet someone, it's like calling an API endpoint. You send a GET request, hoping for a JSON response with mutual understanding and maybe a few interesting properties. Or, you might get a <i>403 Forbidden</i>—access denied to someone’s personal data!</p>
  
  <h2>4. Daily Data Refreshes</h2>
  <p>Every morning, you refresh your “page” with coffee or exercise. You’ve got new cookies (or bad ones) stored, new “sessions” ready to go. Life is constantly refreshing and re-rendering.</p>
  
  <h2>5. Security Tokens & Trust Issues</h2>
  <p>Trust? It’s like a security token—sometimes it gets validated, other times it expires without notice. And yes, those who betray you? That’s basically a CSRF attack on your well-being. 😂</p>
  
  <h2>6. The "Terms & Conditions"</h2>
  <p>Ah, the life agreements! We agree to things we might never have read the fine print on, but, hey, we’re all “logged in” now, right? Just click “Accept All” and hope for the best.</p>
  
  <h2>7. The Debugging Process</h2>
  <p>Every time you make a mistake, it’s like throwing an error in the console. Except, there’s no debugger in life. We just try to interpret the cryptic message (“SyntaxError: Can’t find happiness”) and go on anyway.</p>
  
  <h2>8. 404: Purpose Not Found</h2>
  <p>Sometimes we hit a <i>404 Page Not Found</i> in our journey, wondering if we’re on the right URL. Maybe it’s a career that’s just not loading or relationships stuck in a loop. Good thing we’ve got “refresh” and plenty of re-routing options!</p>
  
  <h2>9. Scheduled Maintenance (Sleep)</h2>
  <p>Every night, we log off for maintenance. If only there were patch notes every morning, letting us know what life’s server team fixed overnight. Maybe a few bugs squashed or minor “optimizations” applied?</p>
  
  <h2>10. Redirects and Major Life Changes</h2>
  <p>A new job, a relationship, a move—these are like 301 Redirects. You’re still “you,” but now you’re located somewhere new on the server, with a fresh HTML and CSS setup.</p>
  
  <h2>11. User Engagement and Feedback Loops</h2>
  <p>What’s life without a bit of engagement? Whether it’s friends, followers, or family, our “backend” runs on constant feedback loops. And yes, sometimes we go viral for all the wrong reasons. But in the end, it’s about how you respond to the response.</p>
  
  <p><strong>In closing</strong>, life as a website might have its quirks and errors, but with every refresh, new opportunities load. Just remember: when life throws you a <i>403 Forbidden</i>, there’s always a way to reroute. And if you’re ever feeling lost? Sometimes all you need is a hard refresh and a little faith that your server is still up and running.</p>
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
 // Detect screen size to toggle FloatingDock position
 const [isMobile, setIsMobile] = useState(false);

 useEffect(() => {
   const handleResize = () => {
     setIsMobile(window.innerWidth < 768);
   };
   handleResize(); // Set initial value
   window.addEventListener("resize", handleResize);
   return () => window.removeEventListener("resize", handleResize);
 }, []);

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

 return (
   <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] h-screen overflow-hidden relative">
     {/* Floating Dock Position */}
     <div className={`relative z-50 opacity-90 ${isMobile ? 'fixed bottom-0 w-full z[9999]' : 'left-0 z-[9999]'} opacity-100`}>
       <FloatingDock items={items} />
     </div>

       {/* Top Left Corner Name with Conditional Visibility */}
        {showName && (
          <motion.div
            className={`fixed ${isMobile ? 'top-20 left-1/2 transform -translate-x-1/2 w-full flex justify-center px-4' : 'top-4 left-4'} z-50`}
            initial={{ opacity: 1 }}
            animate={{ opacity: showName ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Cover className="text-2xl font-semibold font-mono text-white text-center">
              Sri Ujjwal Reddy Beereddy
            </Cover>
          </motion.div>
        )}


      {/* Right: Main Content */}
      <div className="relative overflow-y-auto overflow-x-hidden p-4">


      {/* Custom Top-Right Navbar */}
      <div
        className={`fixed top-4 ${
          isMobile ? "left-1/2 transform -translate-x-1/2 px-6" : "right-4"
        } flex items-center space-x-4 bg-black bg-opacity-60 rounded-2xl shadow-lg z-[1000] py-2 px-3 md:px-4`}
        style={{
          paddingLeft: isMobile ? "1.5rem" : "1rem",
          paddingRight: isMobile ? "1.5rem" : "1rem",
        }}
      >
        <Link href="https://github.com/sbeeredd04" target="_blank">
          <IconBrandGithub
            className="text-white hover:text-gray-400 mx-1"
            size={24}
          />
        </Link>
        <Link href="https://instagram.com/" target="_blank">
          <IconBrandInstagram
            className="text-pink-500 hover:text-pink-400 mx-1"
            size={24}
          />
        </Link>
        <Link href="https://www.linkedin.com/in/sriujjwal/" target="_blank">
          <IconBrandLinkedin
            className="text-blue-700 hover:text-blue-500 mx-1"
            size={24}
          />
        </Link>
        <Link href="mailto:srisubspace@gmail.com" target="_blank">
          <IconMail className="text-red-500 hover:text-red-400 mx-1" size={24} />
        </Link>
        <Link href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" target="_blank">
          <IconBrandSpotify
            className="text-green-500 hover:text-green-400 mx-1"
            size={24}
          />
        </Link>
        <Link href="/my_resume.pdf" download>
          <button className="px-4 py-2 border border-whites-400 text-white-400 font-semibold rounded-md shadow-md hover:border-emerald-500 hover:text-emerald-500 transition-all mx-1 bg-transparent">
            Resume
          </button>
        </Link>
      </div>



        {/* Home Section */}
        <section id="home" className="relative h-screen w-full mb-40">
          <div className="relative w-full h-full overflow-hidden">
            <AnimatePresence>
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
                    <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center rounded-xl p-4 md:p-8">
                      <h2 className="text-4xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-md md:text-lg mb-4">{slide.description}</p>
                      <Link href={slide.link} className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
                        Learn More
                      </Link>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>

            <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white bg-black rounded-full">
              ‹
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white bg-black rounded-full">
              ›
            </button>
          </div>
        </section>

       {/* About Me Section */}
       <section id="about" className="h-screen w-full bg-transparent mx-4 flex items-center justify-center">
        <div className="h-full w-full p-4 md:p-8 bg-transparent rounded-xl flex flex-col md:flex-row gap-8 flex items-center justify-center">
          <div className="w-full p-4 md:p-8 bg-transparent rounded-xl flex flex-col md:flex-row gap-8">
            {/* Left div with text */}
            <div className="w-full md:w-1/2 text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">About Me</h2>
              <p className="text-md md:text-lg mb-4">
                Hello! I’m a Junior studying Computer Science with a focus on Software Engineering. I love solving problems, learning new things, and finding creative ways to use technology. Right now, I’m excited about growing my skills in software development, machine learning, and data analysis.
                My goal is to keep improving, whether it’s through collaboration or tackling new challenges. I’m excited about the future and can’t wait to see where my passion for tech takes me!
              </p>

              {/* Button to download resume */}
              <Link href="/my_resume.pdf" download>
                <button className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
                  Download Resume
                </button>
              </Link>

              {/* Button to open resume preview */}
              <button
                className="ml-0 md:ml-4 mt-4 md:mt-0 px-4 md:px-6 py-2 md:py-3 bg-transparent border-2 border-transparent bg-clip-border border-gradient-to-r from-cyan-400 to-blue-400 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all"
                onClick={() => setShowResumePreview(true)}
              >
                View Resume
              </button>

              {/* Modal for Resume Preview */}
              {showResumePreview && (
                <div
                  id="resume-modal-overlay"
                  className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]"
                  onClick={handleClickOutside}
                >
                  <div className="bg-white rounded-lg w-[90vw] h-[85vh] relative z-[1200]">
                    <iframe
                      src="/my_resume.pdf"
                      className="w-full h-full"
                      frameBorder="0"
                    />
                  </div>

                  {/* Close button outside the modal */}
                  <button
                    className="absolute top-8 right-8 text-white bg-red-700 hover:bg-blue-600 rounded-full p-3 z-[1300]"
                    onClick={() => setShowResumePreview(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Right div with globe */}
            <div className="w-full md:w-1/2 flex items-center justify-center">
              <Globe />
            </div>
          </div>
        </div>
      </section>

       {/* Experience Section with Toggle */}
        <section id="experience" className="w-full bg-transparent py-10 md:py-20 my-10 md:my-20 mb-20 md:mb-40">
          <div className="w-full max-w-8xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 mb-6 md:mb-12">
              {/* Professional Experience Button */}
              <button
                className={`relative text-2xl md:text-4xl font-bold ${
                  activeTimeline === "experience" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setActiveTimeline("experience")}
              >
                Professional Experience
                {activeTimeline === "experience" && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500 shadow-md rounded-lg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </button>

              {/* Achievements & Coding Journey Button */}
              <button
                className={`relative text-2xl md:text-4xl font-bold ${
                  activeTimeline === "achievements" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setActiveTimeline("achievements")}
              >
                Achievements & Coding Journey
                {activeTimeline === "achievements" && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-teal-500 shadow-md rounded-lg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </button>
            </div>

            {/* Content Transition Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTimeline} // Different keys for different sections
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4 }}
                className="bg-transparent rounded-xl p-4 md:p-8"
              >
                {activeTimeline === "experience" ? (
                  <TimelineDemo theme="experience" /> // Pass theme explicitly here
                ) : (
                  <AchievementTimelineDemo theme="achievements" /> // Also, pass theme explicitly here if needed
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="w-full bg-transparent py-10 md:py-20">
          <div className="w-full max-w-8xl mx-auto px-4 md:px-8 lg:px-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Featured Projects</h2>
            
            <Carousel
              items={projects.map((project, index) => (
                <PinContainer
                  key={index}
                  title={project.title}
                  href={project.href} // Pass href to PinContainer
                  containerClassName="flex flex-col items-center justify-center w-[90%] sm:w-[20rem] h-auto md:w-[25rem] p-4"
                  onClick={() => {
                    setPreviewUrl(project.href);
                    setShowProjectPreview(true);
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-32 sm:h-36 md:h-40 object-cover rounded-lg mb-4 transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                  <div className="flex flex-col items-start w-full text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm sm:text-base font-normal text-white">
                      {project.description}
                    </p>
                  </div>
                </PinContainer>
              ))}
            />
          </div>

          {/* Modal for Project Preview */}
          {showProjectPreview && (
            <div
              id="project-modal-overlay"
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]"
              onClick={() => setShowProjectPreview(false)} // Close modal on overlay click
            >
              <div className="bg-white rounded-lg w-[90vw] h-[85vh] relative z-[1200]">
                {previewUrl.includes("github.com") ? (
                  // Open GitHub links in a new tab since they can't be embedded
                  <div className="flex flex-col items-center justify-center w-full h-full text-center p-8">
                    <p className="text-lg font-semibold mb-4">This project is hosted on GitHub.</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition"
                    >
                      Open in GitHub
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    frameBorder="0"
                  />
                )}
              </div>
              <button
                className="absolute top-8 right-8 text-white bg-red-700 hover:bg-red-500 rounded-full p-3 z-[1300]"
                onClick={() => setShowProjectPreview(false)}
              >
                Close
              </button>
            </div>
          )}
        </section>

        {/* Skills Section */}
        <section id="skills" className="w-full bg-transparent py-20 my-20 mb-40">
          <div className="w-full max-w-8xl mx-auto px-4 md:px-8 lg:px-12 scroll-hide">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Skills</h2>
            <div className="bg-transparent rounded-xl p-8 md:px-4 overflow-hidden">
              {/* Apply styles to hide scrollbar */}
              <div className="skills-scroll-container overflow-x-auto whitespace-nowrap scroll-hide">
                <InfiniteMovingCards
                  sections={skillsSections}
                  direction="left"
                  speed="normal"
                  pauseOnHover={true}
                  className="mx-auto"
                />
              </div>
            </div>
          </div>
        </section>


        {/* Blog Section with Expandable Cards */}
        <section id="blog" className="h-screen w-full bg-transparent mx-4 my-20 flex items-center justify-center">
          <div className="w-full p-4 md:p-8 bg-transparent rounded-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Featured Blog Posts</h2>
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
                />
              ))}
            />
          </div>
        </section>



        {/* Contact Section */}
        <section id="contact" className="h-screen w-full bg-transparent mx-4 flex items-center justify-center">
          <div className="w-full p-4 md:p-8 bg-transparent rounded-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Contact Me</h2>
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
      </div>
    </div>
  );
}
