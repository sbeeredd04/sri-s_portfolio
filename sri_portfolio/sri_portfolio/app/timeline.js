import React from 'react';
import Image from 'next/image';
import { TracingBeam } from './components/tracing-beam';

export function TimelineDemo({ theme }) {
  return (
    <div className="w-full h-full pb-20">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Professional Experience</h1>
        <p className="text-white/60 text-sm md:text-base">My journey in software engineering and machine learning</p>
      </div>
      
      <TracingBeam className="px-2">
        <div className="w-full mx-auto antialiased pt-4 relative pb-20">{/* Added pb-20 for bottom spacing */}
          {/* Experience 1 - Geometric Media Lab */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jul 2024 – Present
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  AI/ML Software Engineering Intern
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Geometric Media Lab • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Boosted gunshot detection accuracy from 20% to 80%</strong> by designing an ML pipeline that captured and preprocessed live audio data for training and inference, then deploying the model on a Raspberry Pi for field use in the South American rainforest, helping curb poaching.
                  </li>
                  <li>
                    <strong>Developed ML pipelines and architectures for 6+ research projects</strong> using pretrained VLM models like Gemini VLM API, Hugging Face, and stable video diffusion models with computer vision for rapid prototyping and deployment.
                  </li>
                  <li>
                    <strong>Built custom inference pipelines</strong> by architecting and experimenting with PyTorch ML models based on research papers, leveraging the SOL GPU cluster with CUDA, and using wandb for experiment logging and analysis.
                  </li>
                </ul>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-blue-400 mb-1">Focus Areas:</p>
                  <p className="text-sm text-blue-300">
                    PyTorch, Computer Vision, CUDA, Hugging Face, wandb
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                {/* Empty transparent placeholder for Geometric Media Lab */}
              </div>
            </div>
          </div>

          {/* Experience 2 - SoDA */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2024 – Nov 2025
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Director of Technology
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Software Developers Association (SoDA) • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Built and scaled SoDA's internal tools platform</strong> (Discord OAuth2.0-secured admin site, summarizer bot, and member rewards/storefront), supporting 3,000+ members across multiple clubs (ACM, WiCS) and enabling secure, automated management.
                  </li>
                  <li>
                    <strong>Empowered 600+ students with hands-on software skills</strong> by leading an 11-member team to deliver 12+ technical workshops (Docker, Flask, Chrome Extensions) and hackathons, while fostering a creative and collaborative culture.
                  </li>
                </ul>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-blue-400 mb-1">Impact:</p>
                  <p className="text-sm text-blue-300">
                    3,000+ members managed, 600+ active students empowered, 12+ workshops delivered
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="rounded-lg overflow-hidden border border-white/10 w-full shadow-lg">
                  <div className="glass-dark px-4 py-2 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="text-white/60 text-xs ml-2">thesoda.io</div>
                  </div>
                  <div className="w-full aspect-video overflow-hidden">
                    <iframe 
                      src="https://thesoda.io/" 
                      width="200%" 
                      height="200%"
                      className="border-0"
                      title="Software Developers Association Website"
                      style={{
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                        width: '200%',
                        height: '200%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience 3 - Mesa Historical Museum */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Aug 2024 – May 2025
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Software Engineer
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Mesa Historical Museum (EPICS) • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Led a 7-member team from Figma design to production</strong>, translating wireframes into a React/Vite application with Three.js for interactive 3D museum exhibits showcasing historic individuals and landmarks.
                  </li>
                  <li>
                    <strong>Architected a CI/CD pipeline on Vercel</strong> for automated deployments and shipped the application to a dedicated kiosk display by configuring a locked-down browser environment on the museum's TV hardware.
                  </li>
                  <li>
                    <strong>Shipped a static-site solution</strong> using JSON data and Vercel, eliminating CMS dependency and reducing maintenance costs while ensuring fast, reliable access for museum visitors.
                  </li>
                </ul>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-blue-400 mb-1">Technologies:</p>
                  <p className="text-sm text-blue-300">
                    React, Vite, Three.js, Figma, Vercel, CI/CD
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/experiences/experience-screenshot-1.png"
                  alt="Mesa Historical Museum EPICS"
                  width={800}
                  height={600}
                  className="rounded-lg object-cover w-full h-auto shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Experience 4 - ASU Biodesign Institute */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2023 – Aug 2024
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Software Engineering Intern
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  ASU Biodesign Institute • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Engineered a Django/FastAPI backend</strong> to automate DNA-PAINT image analysis for 100+ datasets, enabling researchers to process 2000+ nanorobot entities per image with ML-driven clustering and tracking.
                  </li>
                  <li>
                    <strong>Optimized analysis time from 4 hours to 10–30 minutes</strong> per image by building a scalable pipeline and REST API, delivering a user-friendly web interface for machine learning analysis and visualization.
                  </li>
                  <li>
                    <strong>Documented codebase with comprehensive API docs and testing</strong>, streamlining onboarding for new engineers and enabling reproducible research workflows.
                  </li>
                </ul>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-blue-400 mb-1">Achievement:</p>
                  <p className="text-sm text-blue-300">
                    93% reduction in processing time (4 hours → 10-30 minutes)
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/experiences/experience-screenshot-2.jpeg"
                  alt="ASU Biodesign Institute ML Intern"
                  width={800}
                  height={400}
                  className="rounded-lg object-cover w-full h-auto shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </TracingBeam>
    </div>
  );
}
