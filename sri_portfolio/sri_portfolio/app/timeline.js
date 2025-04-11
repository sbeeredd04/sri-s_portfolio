import React from 'react';
import Image from 'next/image';
import { Timeline } from './components/timeline';

export function TimelineDemo({ theme }) {
  const data = [
    {
      title: "Software Engineering Intern (Machine Learning)",
      content: (
        <div>
          <h2 className="text-lg md:text-2xl font-semibold mb-4 text-white">
            Geometric Media Lab
          </h2>
          <p className="text-sm md:text-base font-normal mb-4 text-white/60">
            Software Engineering Intern (Machine Learning) | Jul 2024 – Present
          </p>
          <ul className="list-disc pl-5 text-sm md:text-base font-normal mb-8 text-white/80 space-y-4">
            <li>
              <strong>Engineered a hybrid ML pipeline:</strong> Combined k-means clustering with a supervised neural network for gunshot detection, boosting accuracy from 20% to 80% on 10+ hours of audio data processed via Librosa and iterative model refinement.
            </li>
            <li>
              <strong>Optimized edge deployment:</strong> Tailored the pipeline for Raspberry Pi by integrating hardware-specific adjustments and a custom microphone setup, ensuring real-time performance in resource-constrained forest environments.
            </li>
            <li>
              <strong>Enhanced model robustness:</strong> Implemented a dynamic feedback loop to continuously refine predictions and improve noise differentiation, securing scalable analysis under diverse conditions.
            </li>
          </ul>
          <div className="mb-8 p-6 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm md:text-base font-medium text-blue-400 mb-2">Currently Working:</p>
            <p className="text-sm md:text-base text-blue-300">
              Looking into video generation models and working on leveraging VLM (Vision Language Models) and scene graph predictions as controls for longer video generation.
            </p>
          </div>
          <div className="w-full">
            <Image
              src="/ex (4).webp"
              alt="Geometric Media Lab ML Intern"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-72 lg:h-96 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Associate Director of Technology",
      content: (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Software Developers Association (SoDA)
          </h2>
          <p className="text-xs md:text-sm font-normal mb-4">
            Associate Director of Technology | Jan 2024 – Present
          </p>
          <ul className="list-disc pl-5 text-xs md:text-sm font-normal mb-8">
            <li>
              <strong>Automated operational workflows:</strong> Reduced test case upload time by 98% using a Selenium-based scraper for 200+ files, streamlining annual code challenge processes.
            </li>
            <li>
              <strong>Optimized membership systems:</strong> Developed a Flask-Next.js application that boosted operational efficiency by 50% and enhanced engagement for 600+ active members.
            </li>
          </ul>
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Current Initiatives:</p>
            <p className="text-xs md:text-sm text-blue-600 dark:text-blue-300">
              Spearheading comprehensive technical workshops on YOLO object detection, Flask web development, and Python programming to enhance member skill development. Orchestrating educational initiatives for upcoming hackathons and competitive coding events to foster innovation and technical excellence.
            </p>
          </div>
          <div className="grid grid-row-2 gap-4">
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
                className="rounded-lg object-cover h-64 md:h-96 lg:h-[32rem] w-full"
              />
            </a>

            <a 
              href="https://thesoda.io/"
              className="text-blue-500 hover:text-blue-600 underline decoration-2 decoration-blue-500/30 hover:decoration-blue-500/60 transition-all"
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
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Mesa Historical Museum (EPICS)
          </h2>
          <p className="text-xs md:text-sm font-normal mb-4">
            Software Engineer | Aug 2024 – Present
          </p>
          <ul className="list-disc pl-5 text-xs md:text-sm font-normal mb-8">
            <li>
              <strong>Built an immersive digital experience:</strong> Developed an interactive website using React and Three.js, increasing visitor engagement by 20% and offering an engaging digital tour of museum collections.
            </li>
            <li>
              <strong>Led cross-functional teams:</strong> Directed a 7-member team to implement scalable content management and ensure sub-second website response times, optimizing the digital visitor experience.
            </li>
          </ul>
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs md:text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Project Status:</p>
            <p className="text-xs md:text-sm text-blue-600 dark:text-blue-300">
              Finalizing user experience optimizations based on comprehensive feedback analysis. Preparing for production deployment with enhanced features and improved performance metrics. Project is on track for successful delivery to stakeholders with documented implementation guidelines.
            </p>
          </div>
          <div className="grid grid-row-2 gap-4">
            <Image
              src="/ex(1).png"
              alt="Mesa Historical Museum EPICS"
              width={800}
              height={800}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>

          <a 
              href="https://github.com/chelsealiannegomez/New-Mesa-Interactive-Exhibit"
              className="text-blue-500 hover:text-blue-400 underline text-base md:text-lg mt-4 inline-block transition-colors"
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
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            ASU Biodesign Institute
          </h2>
          <p className="text-xs md:text-sm font-normal mb-4">
            Software Engineering Intern (Machine Learning) | Jan 2023 – Dec 2024
          </p>
          <ul className="list-disc pl-5 text-xs md:text-sm font-normal mb-8">
            <li>
              <strong>Developed an end-to-end data pipeline:</strong> Automated DNA-PAINT image analysis by integrating k-means clustering and custom tracking algorithms, slashing processing time from 4 hours to 10–30 minutes per image.
            </li>
            <li>
              <strong>Advanced research capabilities:</strong> Delivered granular movement data and actionable metrics, transforming traditional nanotech workflows into ML-driven, high-impact research tools.
            </li>
          </ul>
          <div className="grid grid-row-2 gap-1">
            <Image
              src="/ex(2).jpeg"
              alt="ASU Biodesign Institute ML Intern"
              width={800}
              height={800}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />

            <div className="text-xs md:text-sm font-normal text-neutral-600 dark:text-neutral-400">
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
