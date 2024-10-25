"use client";

import { useEffect, useRef, useState } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FloatingDock } from "./components/FloatingDock";
import { IconHome, IconUser, IconBriefcase, IconNotebook, IconMail } from "@tabler/icons-react";
import { PinContainer } from "./components/3d-pin"; // Import 3D Pin Container for projects
import { Carousel } from "./components/apple-cards-carousel"; // Import Carousel for projects and blog posts
import createGlobe from "cobe"; // Import cobe to create the globe
import { CardSpotlight } from "./components/card-spotlight";

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
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className="globe-canvas"
    />
  );
}

export default function Home() {
  // Navigation Items for the Floating Dock
  const items = [
    { title: "Home", icon: <IconHome />, href: "#home" }, // Link to the Home section
    { title: "About Me", icon: <IconUser />, href: "#about" },
    { title: "Projects", icon: <IconBriefcase />, href: "#projects" },
    { title: "Blog", icon: <IconNotebook />, href: "#blog" },
    { title: "Contact", icon: <IconMail />, href: "#contact" },
  ];

  // Header Slider Data
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showResumePreview, setShowResumePreview] = useState(false); // Modal state for resume preview

  const slides = [
    {
      title: "Welcome to My Portfolio",
      description: "Discover my work and skills.",
      image: "/home1.jpg",
      link: "#about",
    },
    {
      title: "Featured Projects",
      description: "Explore my latest projects.",
      image: "/home2.jpg",
      link: "#projects",
    },
    {
      title: "Blog Insights",
      description: "Read my latest articles.",
      image: "/home4.jpg",
      link: "#blog",
    },
    {
      title: "Contact Me",
      description: "Get in touch.",
      image: "/home3.jpg",
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

  // Placeholder data for Projects
  const projects = [
    {
      title: "Amano",
      description: "Emotion-Based Song Recommendation System that provides personalized song suggestions using Reinforcement Learning and Spotify's API.",
      href: "https://github.com/sbeeredd04/Amano",
      image: "/p (1).jpg",  // Make sure to correctly reference your image location
    },
    {
      title: "Image Insight",
      description: "A web-based tool designed for postdoctoral researchers to automate complex data analysis tasks, significantly increasing research productivity.",
      href: "https://github.com/sbeeredd04/CSDNA",
      image: "/p (2).jpg",  // Use the correct image path
    },
    {
      title: "Mine Alliance",
      description: "Fullstack platform that integrates ChatGPT-4 for sustainable mining site impact assessments, reducing response times by 40%.",
      href: "https://github.com/LuaanNguyen/Mine-Alliance",
      image: "/p (3).jpg",  // Update with the correct path
    },
    {
      title: "Avisol",
      description: "An automated air traffic pathfinding system that utilizes algorithm optimization to reduce computation time for managing autonomous vehicles.",
      href: "https://github.com/sbeeredd04/AviSol",
      image: "/p (4).jpg",  // Make sure to use the right image
    },
  ];

  // Placeholder data for Blog Posts
  const blogPosts = [
    { title: "Blog Post 1", category: "Tech", content: "This is the content for blog post 1" },
    { title: "Blog Post 2", category: "Tech", content: "This is the content for blog post 2" },
    { title: "Blog Post 3", category: "Tech", content: "This is the content for blog post 3" },
    { title: "Blog Post 4", category: "Tech", content: "This is the content for blog post 4" },
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

 return (
   <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] h-screen overflow-hidden relative">
     {/* Floating Dock Position */}
     <div className={`relative z-50 opacity-90 ${isMobile ? 'fixed bottom-0 w-full' : 'left-0'}`}>
       <FloatingDock items={items} />
     </div>

      {/* Right: Main Content */}
      <div className="relative overflow-y-auto overflow-x-hidden p-4">

        {/* Sticky Resume Button */}
        <Link href="/my_resume.pdf" download>
          <button className="sticky top-4 float-right px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-semibold rounded-lg shadow-md hover:bg-gradient-to-r hover:from-blue-500 hover:to-emerald-500 transition-all z-50">
            Resume
          </button>
        </Link>



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
                    <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center rounded-xl">
                      <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-lg mb-4">{slide.description}</p>
                      <Link href={slide.link} className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
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
        <div className="w-full p-8 bg-transparent rounded-xl flex flex-row gap-8">
          {/* Left div with text */}
          <div className="w-1/2 text-left">
            <h2 className="text-4xl font-bold mb-4">About Me</h2>
            <p className="text-lg mb-4">
              Hello! I’m a Junior studying Computer Science with a focus on Software Engineering. I love solving problems, learning new things, and finding creative ways to use technology. Right now, I’m excited about growing my skills in software development, machine learning, and data analysis.
              My goal is to keep improving, whether it’s through collaboration or tackling new challenges. I’m excited about the future and can’t wait to see where my passion for tech takes me!
            </p>

            {/* Button to download resume */}
            <Link href="/my_resume.pdf" download>
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
                Download Resume
              </button>
            </Link>

            {/* Button to open resume preview */}
            <button
              className="ml-4 px-6 py-3 bg-transparent border-2 border-transparent bg-clip-border border-gradient-to-r from-cyan-400 to-blue-400 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all"
              onClick={() => setShowResumePreview(true)}
            >
              View Resume
            </button>

            {/* Modal for Resume Preview */}
            {showResumePreview && (
              <div
                id="resume-modal-overlay"
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                onClick={handleClickOutside}
              >
                <div className="bg-white rounded-lg w-[90vw] h-[85vh] relative">
                  <iframe
                    src="/my_resume.pdf"
                    className="w-full h-full"
                    frameBorder="0"
                  />
                </div>

                {/* Close button outside the modal */}
                <button
                  className="absolute top-8 right-8 text-white bg-gray-700 hover:bg-gray-600 rounded-full p-3"
                  onClick={() => setShowResumePreview(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Right div with globe */}
          <div className="w-1/2 flex items-center justify-center">
            <Globe />
          </div>

        </div>
      </section>

        {/* Projects Section */}
        <section id="projects" className="h-screen w-full bg-transparent mx-4 flex items-center justify-center">
          <div className="w-full p-8 bg-transparent rounded-xl">
            <h2 className="text-4xl font-bold text-center">Featured Projects</h2>
            <Carousel
              items={projects.map((project, index) => (
                <PinContainer
                  key={index}
                  title={project.title}
                  href={project.href}
                  className="text-white"
                  containerClassName="h-[350px] w-[300px]"
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-40 w-full object-cover rounded-md mb-4"
                  />
                  {/* Project Title with Gradient */}
                  <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-200">{project.description}</p>
                </PinContainer>
              ))}
            />
          </div>
        </section>

      {/* Blog Section with CardSpotlight */}
        <section id="blog" className="h-screen w-full bg-transparent mx-4 flex items-center justify-center">
          <div className="w-full p-8 bg-transparent rounded-xl">
            <h2 className="text-4xl font-bold text-center mb-10">Featured Blog Posts</h2>
            <Carousel
              items={blogPosts.map((post, index) => (
                <CardSpotlight key={index} className="h-[500px] w-[350px]">  {/* Custom size for the card */}
                  <h3 className="text-2xl font-bold relative z-20 mt-2 text-white">
                    {post.title}
                  </h3>
                  <p className="text-neutral-200 mt-4 relative z-20">
                    {post.content}
                  </p>
                  <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                    Category: {post.category}
                  </p>
                </CardSpotlight>
              ))}
            />
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="h-screen w-full bg-transparent mx-4 flex items-center justify-center">
          <div className="w-full p-8 bg-transparent rounded-xl">
            <h2 className="text-4xl font-bold text-center">Contact Me</h2>
            <div className="mt-8 text-center">
              <p className="text-lg">Feel free to reach out for collaborations or inquiries.</p>
              <form className="mt-6 space-y-4">
                <input type="text" placeholder="Your Name" className="w-full p-4 bg-gray-100 rounded-md" />
                <input type="email" placeholder="Your Email" className="w-full p-4 bg-gray-100 rounded-md" />
                <textarea placeholder="Your Message" className="w-full p-4 bg-gray-100 rounded-md h-40"></textarea>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 transition-all">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
