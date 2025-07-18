import React from 'react';
import Image from 'next/image';
import { TracingBeam } from './components/tracing-beam';

export function TimelineDemo({ theme }) {
  return (
    <div className="w-full h-full">
      <TracingBeam className="px-6">
        <div className="max-w-2xl mx-auto antialiased pt-4 relative">
          {/* Experience 1 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jul 2024 – Present
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Software Engineering Intern (Machine Learning)
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Geometric Media Lab
              </h3>
              <ul className="list-disc pl-5 text-white/80 space-y-2 mb-4">
                <li>
                  <strong>Developed an end-to-end ML pipeline</strong> for gunshot detection by fusing unsupervised k-means clustering with a supervised neural network. Leveraged Librosa for robust feature extraction and iterative refinements, boosting accuracy from 20% to 80% across 10+ hours of audio data.
                </li>
                <li>
                  <strong>Optimized the system for real-time edge deployment</strong> on Raspberry Pi through precise hardware adjustments and custom microphone setups, directly supporting conservation efforts by preventing jaguar poaching in South American rain-forests.
                </li>
                <li>
                  <strong>Spearheading research</strong> on innovative video generation models that integrate visual language models and scene graphs with lighting and depth maps within diffusion frameworks.
                </li>
              </ul>
              <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm font-medium text-blue-400 mb-1">Currently Working:</p>
                <p className="text-sm text-blue-300">
                  Looking into video generation models and working on leveraging VLM (Vision Language Models) and scene graph predictions as controls for longer video generation.
                </p>
              </div>
            </div>
            <Image
              src="/ex (4).webp"
              alt="Geometric Media Lab ML Intern"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full mb-4"
            />
          </div>

          {/* Experience 2 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2024 – Present
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Associate Director of Technology
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Software Developers Association (SoDA)
              </h3>
              <ul className="list-disc pl-5 text-white/80 space-y-2 mb-4">
                <li>
                  <strong>Architected and facilitated engaging weekly meetings</strong> and hands-on workshops on Python/Jupyter Notebook, Git 101, Object Recognition (YOLO), Flask, AI-Powered Chrome, AI Integration APIs, and SQL, empowering over 600+ student members with essential technical skills.
                </li>
                <li>
                  <strong>Led and coordinated</strong> the technical team to maintain the thesoda.io website and internal tools, managing a distinguished member program for a club of 3000+ members and driving initiatives for hackathons, code challenges, and mentorship program.
                </li>
              </ul>
              <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                <p className="text-sm font-medium text-blue-200 mb-1">Current Initiatives:</p>
                <p className="text-sm text-blue-300">
                  Spearheading comprehensive technical workshops on YOLO object detection, Flask web development, and Python programming to enhance member skill development.
                </p>
              </div>
            </div>
            <a 
              href="https://thesoda.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-90 transition-opacity mb-2"
            >
              <Image
                src="/ex (3).png"
                alt="SoDA Software Engineer"
                width={1200}
                height={1000}
                className="rounded-lg object-cover h-48 md:h-60 w-full"
              />
            </a>
            <a 
              href="https://thesoda.io/"
              className="text-blue-500 hover:text-blue-600 underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Software Developers Association (SoDA)
            </a>
          </div>

          {/* Experience 3 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Aug 2024 – Present
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Software Engineer
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Mesa Historical Museum (EPICS)
              </h3>
              <ul className="list-disc pl-5 text-white/80 space-y-2 mb-4">
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
              <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                <p className="text-sm font-medium text-blue-200 mb-1">Project Status:</p>
                <p className="text-sm text-blue-300">
                  Finalizing user experience optimizations based on comprehensive feedback analysis. Preparing for production deployment with enhanced features and improved performance metrics.
                </p>
              </div>
            </div>
            <Image
              src="/ex(1).png"
              alt="Mesa Historical Museum EPICS"
              width={800}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full shadow-md mb-2"
            />
            <a 
              href="https://github.com/chelsealiannegomez/New-Mesa-Interactive-Exhibit"
              className="text-blue-500 hover:text-blue-400 underline text-sm inline-block transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
          </div>

          {/* Experience 4 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              Jan 2023 – Dec 2024
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Software Engineering Intern (Machine Learning)
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                ASU Biodesign Institute
              </h3>
              <ul className="list-disc pl-5 text-white/80 space-y-2 mb-4">
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
            </div>
            <Image
              src="/ex(2).jpeg"
              alt="ASU Biodesign Institute ML Intern"
              width={800}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full shadow-md mb-2"
            />
            <div className="text-xs font-normal text-neutral-400 break-words">
              A cargo-sorting DNA robot. (n.d.). https://www.science.org/doi/10.1126/science.aan6558 
            </div>
          </div>
        </div>
      </TracingBeam>
    </div>
  );
}
