import React from 'react';
import Image from 'next/image';
import { Timeline } from './components/timeline';

export function TimelineDemo({ theme }) {
  const data = [
    {
      title: "AI/ML Software Engineering Intern",
      content: (
        <div>
          <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3 text-white">
            Geometric Media Lab
          </h2>
          <p className="text-xs md:text-sm font-normal mb-3 md:mb-4 text-white/60">
            AI/ML Software Engineering Intern | Jul 2024 – Present
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm font-normal mb-4 md:mb-6 text-white/80 space-y-3 md:space-y-4">
            <li>
              <strong>Boosted gunshot detection project's accuracy from 20% to 80%</strong> by adapting existing machine learning models and deploying the model on a Raspberry Pi unit for field use in the South American rainforest, supporting anti-poaching efforts.
            </li>
            <li>
              <strong>Built ML pipelines and architectures for experimentation</strong>, using pretrained VLM models like Gemini VLM API, Hugging Face, and stable video diffusion models with computer vision across 6+ research projects for rapid prototyping and deployment of ML solutions.
            </li>
            <li>
              <strong>Developed ML models and efficient pipelines</strong> using Python, PyTorch, and CUDA; optimized large-scale model training/inference on the SOL GPU cluster with multiple A100 GPUs, achieving significantly faster inference through GPU acceleration and utilizing wandb for experiment tracking and seamless production rollouts.
            </li>
          </ul>
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-xs md:text-sm font-medium text-blue-400 mb-1 md:mb-2">Currently Working:</p>
            <p className="text-xs md:text-sm text-blue-300">
              Looking into video generation models and working on leveraging VLM (Vision Language Models) and scene graph predictions as controls for longer video generation.
            </p>
          </div>
          <div className="w-full">
            <Image
              src="/ex (4).webp"
              alt="Geometric Media Lab AI/ML Intern"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-40 sm:h-48 md:h-60 lg:h-72 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Director of Technology",
      content: (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
            Software Developers Association (SoDA)
          </h2>
          <p className="text-xs font-normal mb-3 md:text-sm md:mb-4">
            Director of Technology | Jan 2024 – Present
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Built and scaled SoDA's internal tools platform</strong> (including a Discord OAuth2.0-secured admin site, summarizer bot, and member rewards/storefront) to support 3,000+ members across multiple clubs (ACM, WiCS), enabling secure and automated management.
            </li>
            <li>
              <strong>Led an 11-member team</strong> to deliver 12+ technical workshops and hackathons (Docker, Chrome Extensions, Flask), removing roadblocks and fostering a creative, collaborative culture, empowering 600+ active students with hands-on software engineering skills.
            </li>
          </ul>
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1 md:mb-2">Current Initiatives:</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Spearheading comprehensive technical workshops on YOLO object detection, Flask web development, and Python programming to enhance member skill development. Orchestrating educational initiatives for upcoming hackathons and competitive coding events to foster innovation and technical excellence.
            </p>
          </div>
          <div className="grid grid-row-2 gap-3 md:gap-4">
            <a 
              href="https://thesoda.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-90 transition-opacity"
            >
              <Image
                src="/ex (3).png"
                alt="SoDA Software Engineer"
                width={1200}
                height={1000}
                className="rounded-lg object-cover h-48 sm:h-56 md:h-72 lg:h-[28rem] w-full"
              />
            </a>

            <a 
              href="https://thesoda.io/"
              className="text-blue-500 hover:text-blue-600 underline decoration-2 decoration-blue-500/30 hover:decoration-blue-500/60 transition-all text-sm md:text-base"
              target="_blank"
              rel="noopener noreferrer"
            >
              Software Developers Association (SoDA)
            </a>
          </div>
        </div>
      ),
    },
    {
      title: "Software Engineer",
      content: (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
            Mesa Historical Museum (EPICS)
          </h2>
          <p className="text-xs font-normal mb-3 md:text-sm md:mb-4">
            Software Engineer | Aug 2024 – May 2025
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Built an interactive 3D museum exhibit</strong> using React, Three.js, and Vercel, digitizing and showcasing detailed stories of historic individuals and landmark places as immersive web experiences for enhanced visitor engagement.
            </li>
            <li>
              <strong>Led a 7-member team</strong> to digitize museum archives, enabling visitors to explore collections online and increasing accessibility through agile practices and direct client communication.
            </li>
            <li>
              <strong>Optimized for cost and performance</strong> by developing and deploying a static-site solution with no ongoing maintenance, using JSON data and Vercel for fast, reliable access in the museum.
            </li>
          </ul>
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1 md:mb-2">Project Status:</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Finalizing user experience optimizations based on comprehensive feedback analysis. Preparing for production deployment with enhanced features and improved performance metrics. Project is on track for successful delivery to stakeholders with documented implementation guidelines.
            </p>
          </div>
          <div className="grid grid-row-2 gap-3 md:gap-4">
            <Image
              src="/ex(1).png"
              alt="Mesa Historical Museum EPICS"
              width={800}
              height={800}
              className="rounded-lg object-cover h-36 sm:h-40 md:h-48 lg:h-52 w-full shadow-md"
            />
          </div>

          <a 
              href="https://github.com/chelsealiannegomez/New-Mesa-Interactive-Exhibit"
              className="text-blue-500 hover:text-blue-400 underline text-sm md:text-base mt-3 md:mt-4 inline-block transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
        </div>
      ),
    },
    {
      title: "Software Engineering Intern (Machine Learning)",
      content: (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
            ASU Biodesign Institute
          </h2>
          <p className="text-xs font-normal mb-3 md:text-sm md:mb-4">
            Software Engineering Intern (Machine Learning) | Jan 2023 – Aug 2024
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Developed a Django/FastAPI backend</strong> to automate DNA-PAINT image analysis for 100+ datasets, enabling researchers to process 2000+ nanorobot entities per image with ML-driven clustering and tracking.
            </li>
            <li>
              <strong>Reduced analysis time from 4 hours to 10–30 minutes per image</strong> by building a scalable pipeline and REST API, delivering a user-friendly web interface for machine learning analysis and visualization.
            </li>
            <li>
              <strong>Collaborated with engineers and researchers</strong> to maintain and document the codebase, support onboarding, and deliver analytics scripts for impactful insights.
            </li>
          </ul>
          <div className="flex flex-col gap-1">
            <Image
              src="/ex(2).jpeg"
              alt="ASU Biodesign Institute ML Intern"
              width={800}
              height={800}
              className="rounded-lg object-cover h-36 sm:h-40 md:h-48 lg:h-52 w-full shadow-md"
            />

            <div className="text-xs font-normal text-neutral-600 dark:text-neutral-400 mt-1 md:mt-2 break-words">
              A cargo-sorting DNA robot. (n.d.). https://www.science.org/doi/10.1126/science.aan6558 
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full">
      <Timeline data={data} theme={theme} />
    </div>
  );
}
