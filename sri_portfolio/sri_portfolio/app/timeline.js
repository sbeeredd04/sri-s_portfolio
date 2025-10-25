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
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jul 2024 – Present
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Software Engineering Intern (Machine Learning)
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Geometric Media Lab • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Developed and maintained 4+ scalable ML pipelines</strong> and backend APIs for research projects spanning CelebVQ, CIFAR100, Visual Genome, and custom audio datasets.
                  </li>
                  <li>
                    <strong>Improved gunshot detection accuracy from 20% to 80%</strong> on a project supporting anti-poaching efforts in the South American rainforest, and enabled large-scale experimentation for other projects by deploying and testing pretrained models (Gemini VLM, BLIP) via API.
                  </li>
                  <li>
                    <strong>Collaborated with PhD researchers</strong> to implement and optimize these solutions using CUDA, deploying all experiments and pipelines on ASU's A100 GPU cluster for efficient, reproducible results.
                  </li>
                </ul>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Focus Areas:</p>
                  <p className="text-sm text-blue-300">
                    Machine Learning Pipelines, Computer Vision, GPU Computing, Research Collaboration
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
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2024 – Present
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Director of ASU's SoDA (Software Developers Association)
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  thesoda.io • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Engineered and scaled SoDA's internal tools platform</strong> (including a Discord OAuth2.0-secured admin site, summarizer bot, and member rewards/storefront) to support 3,000+ members across multiple clubs (ACM, WiCS), enabling secure and automated management for users.
                  </li>
                  <li>
                    <strong>Led an 11-member team</strong> to deliver 12+ technical workshops and hackathons (Docker, Chrome Extensions, Flask), removing roadblocks and fostering a creative, collaborative culture, empowering 600+ active students to build, learn, and launch projects with confidence.
                  </li>
                </ul>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Impact:</p>
                  <p className="text-sm text-blue-300">
                    3,000+ members managed, 600+ active students empowered, 12+ workshops delivered
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="rounded-lg overflow-hidden border border-white/10 w-full shadow-lg">
                  <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
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
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
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
                    <strong>Engineered and deployed an interactive 3D museum exhibit</strong> using React, Three.js, and Vercel, digitizing 12+ archives and spaces into immersive web experiences for enhanced user engagement.
                  </li>
                  <li>
                    <strong>Led a 7-member team</strong> to digitize museum archives, enabling visitors to explore collections online and increasing accessibility, by applying agile practices and resolving technical roadblocks through clear client communication.
                  </li>
                  <li>
                    <strong>Optimized for cost and performance</strong> by architecting a static-site solution with zero-dollar maintenance, leveraging JSON-based data, modern build tools, and Vercel deployment for fast, reliable access.
                  </li>
                </ul>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Technologies:</p>
                  <p className="text-sm text-blue-300">
                    React, Three.js, Vercel, JSON APIs, Agile Development
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/experience-screenshot-1.png"
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
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2023 – Dec 2024
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Software Engineering Intern (Machine Learning)
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  ASU Biodesign Institute • Tempe, AZ
                </h3>
                <ul className="list-disc pl-5 text-white/80 space-y-3 mb-4 text-sm">
                  <li>
                    <strong>Developed and deployed a Django/FastAPI backend tool</strong> to automate DNA-PAINT image analysis for 100+ datasets, enabling researchers to process 2000+ nanorobot entities per image with ML-driven clustering and tracking algorithms.
                  </li>
                  <li>
                    <strong>Reduced analysis time from 4 hours to 10–30 minutes</strong> per image by building a scalable pipeline and REST API, delivering a user-friendly web interface for non-engineers to access advanced ML and visualization features.
                  </li>
                  <li>
                    <strong>Collaborated with researchers</strong> to maintain and document the codebase, support team onboarding, and deliver custom analytics scripts, ensuring smooth adoption and impactful data-driven insights.
                  </li>
                </ul>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">Achievement:</p>
                  <p className="text-sm text-blue-300">
                    93% reduction in processing time (4 hours → 10-30 minutes)
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/experience-screenshot-2.jpeg"
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
