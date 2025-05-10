import React from 'react';
import Image from 'next/image';
import { Timeline } from './components/timeline';

export function TimelineDemo({ theme }) {
  const data = [
    {
      title: "Software Engineering Intern (Machine Learning)",
      content: (
        <div>
          <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3 text-white">
            Geometric Media Lab
          </h2>
          <p className="text-xs md:text-sm font-normal mb-3 md:mb-4 text-white/60">
            Software Engineering Intern (Machine Learning) | Jul 2024 – Present
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm font-normal mb-4 md:mb-6 text-white/80 space-y-3 md:space-y-4">
            <li>
              <strong>Developed an end-to-end ML pipeline</strong> for gunshot detection by fusing unsupervised k-means clustering with a supervised neural network. Leveraged Librosa for robust feature extraction and iterative refinements, boosting accuracy from 20% to 80% across 10+ hours of audio data.
            </li>
            <li>
              <strong>Optimized the system for real-time edge deployment</strong> on Raspberry Pi through precise hardware adjustments and custom microphone setups, directly supporting conservation efforts by preventing jaguar poaching in South American rain-forests.
            </li>
            <li>
              <strong>Spearheading research</strong> on innovative video generation models that integrate visual language models and scene graphs with lighting and depth maps within diffusion frameworks. Aiming to produce more stable, coherent videos, to contribute to revolutionizing digital content creation and real-time simulations.
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
              alt="Geometric Media Lab ML Intern"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-40 sm:h-48 md:h-60 lg:h-72 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Associate Director of Technology",
      content: (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
            Software Developers Association (SoDA)
          </h2>
          <p className="text-xs font-normal mb-3 md:text-sm md:mb-4">
            Associate Director of Technology | Jan 2024 – Present
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Architected and facilitated engaging weekly meetings</strong> and hands-on workshops on Python/Jupyter Notebook, Git 101, Object Recognition (YOLO), Flask, AI-Powered Chrome, AI Integration APIs, and SQL, empowering over 600+ student members with essential technical skills while cultivating a collaborative community.
            </li>
            <li>
              <strong>Led and coordinated</strong> the technical team to maintain the thesoda.io website and internal tools, managing a distinguished member program for a club of 3000+ members and driving initiatives for hackathons, code challenges, and mentorship program.
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
            Software Engineer | Aug 2024 – Present
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Developed and architectured</strong> an interactive digital experience using React and Three.js, crafting a dynamic digital tour of museum collections.
            </li>
            <li>
              <strong>Led a 7-member team</strong> as the lead Software Engineer, designing the website architecture, coordinating deliverables with community partners, and delegating tasks among a designer and software engineers to meet client requirements.
            </li>
            <li>
              <strong>Digitized museum archives</strong> to transform static content into an engaging online experience, enabling users to explore key individuals and landmarks while preserving invaluable knowledge.
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
            Software Engineering Intern (Machine Learning) | Jan 2023 – Dec 2024
          </p>
          <ul className="list-disc pl-4 md:pl-5 text-xs font-normal mb-4 md:mb-6 space-y-3 md:space-y-4">
            <li>
              <strong>Engineered an end-to-end data pipeline</strong> for DNA-PAINT image analysis using k-means clustering and custom tracking algorithms, reducing processing time from 4 hours to 10–30 minutes per image.
            </li>
            <li>
              <strong>Implemented a standardized, ML-driven approach</strong> to quantify qualitative data, removing any possible human error in data analysis.
            </li>
            <li>
              <strong>Facilitated accurate calculations</strong> of robot movement kinetics to deliver essential metrics on both individual robot movements and population dynamics, enabling informed decision-making and impactful research outcomes.
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
