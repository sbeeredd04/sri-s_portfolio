// pages/index.js

"use client";

import { FloatingDock } from './components/FloatingDock';
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import { useState } from 'react';

export default function Home() {
  const items = [
    { title: 'Projects', icon: <IconLayoutNavbarCollapse />, href: '#projects' },
    { title: 'About Me', icon: <IconLayoutNavbarCollapse />, href: '#about' },
    { title: 'Resume', icon: <IconLayoutNavbarCollapse />, href: '#resume' },
    { title: 'Blog', icon: <IconLayoutNavbarCollapse />, href: '#blog' },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: 'Welcome to My Portfolio', description: 'Discover my work and skills.', bgColor: 'bg-yellow-300' },
    { title: 'Featured Projects', description: 'Explore my latest projects.', bgColor: 'bg-blue-300' },
    { title: 'Blog Insights', description: 'Read my latest articles.', bgColor: 'bg-green-300' },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="flex">
      {/* Floating Dock */}
      <FloatingDock items={items} />

      {/* Main Content */}
      <div className="flex-1 ml-[100px] p-6 overflow-y-auto space-y-12">
        {/* Carousel */}
        <div className="relative h-96 flex items-center justify-center">
          <button onClick={prevSlide} className="absolute left-0 p-2 text-white bg-black rounded-full">‹</button>
          <div className={`w-full h-full flex items-center justify-center ${slides[currentSlide].bgColor}`}>
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4">{slides[currentSlide].title}</h2>
              <p className="text-lg">{slides[currentSlide].description}</p>
            </div>
          </div>
          <button onClick={nextSlide} className="absolute right-0 p-2 text-white bg-black rounded-full">›</button>
        </div>

        {/* About Me */}
        <section id="about" className="space-y-4">
          <h2 className="text-4xl font-bold">About Me</h2>
          <p>Learn more about my background, skills, and interests.</p>
        </section>

        {/* Featured Projects */}
        <section id="projects" className="space-y-4">
          <h2 className="text-4xl font-bold">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Project cards */}
            {[1, 2, 3].map((project) => (
              <div key={project} className="p-6 bg-gray-100 rounded-lg shadow-lg">
                <div className="h-40 bg-gray-300 mb-4"></div> {/* Placeholder for image */}
                <h3 className="text-2xl font-semibold mb-2">Project {project}</h3>
                <p>Brief description of Project {project}.</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Blog Posts */}
        <section id="blog" className="space-y-4">
          <h2 className="text-4xl font-bold">Featured Blog Posts</h2>
          {/* Blog post cards */}
          {[1, 2].map((post) => (
            <div key={post} className="p-6 bg-gray-100 rounded-lg shadow-lg mb-4">
              <h3 className="text-xl font-semibold">Blog Post {post}</h3>
              <p>Summary of Blog Post {post}.</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}