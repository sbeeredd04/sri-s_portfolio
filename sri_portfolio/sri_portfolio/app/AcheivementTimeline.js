"use client";

import Image from "next/image";
import React from "react";
import { TracingBeam } from "./components/tracing-beam";

export function AchievementTimelineDemo({ theme }) {
  return (
    <div className="w-full h-full pb-20">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Key Achievements</h1>
        <p className="text-white/60 text-sm md:text-base">Milestones in my programming and development journey</p>
      </div>
      
      <TracingBeam className="px-2">
        <div className="w-full mx-auto antialiased pt-4 relative pb-20">{/* Added pb-20 for bottom spacing */}
          {/* Achievement 1 - Programming Foundation */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2022
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Discovering Programming
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Introduction to Coding
                </h3>
                <p className="text-white/80 font-normal mb-4 leading-relaxed text-sm">
                  My programming journey began with Java in 2022. This first experience with coding quickly sparked my passion for creating impactful software solutions, setting me on the path to becoming a software engineer. I started with basic concepts like variables, loops, and object-oriented programming principles.
                </p>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-green-400 mb-1">Foundation Skills:</p>
                  <p className="text-sm text-green-300">
                    Java fundamentals, object-oriented programming, data structures, and algorithmic thinking.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/achievements/ac (1).webp"
                  alt="Learning Java"
                  width={1200}
                  height={800}
                  className="rounded-lg object-cover w-full h-auto shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Achievement 2 - Hackathon Success */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2023
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Winning Five Hackathons
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  $8K+ in Prizes
                </h3>
                <p className="text-white/80 font-normal mb-4 leading-relaxed text-sm">
                  Over the past few years, I've won five hackathons earning over $8K in prize money, including Devil's Invent, AZ Spark, and DAASH-sponsored events. During the AZ Spark Hackathon, I created Mine Alliance, a sustainable mining platform that integrates OpenAI for real-time environmental assessments, winning a $1.5K prize. I also built Sage AI, a data science tutoring platform with RAG pipelines, and led teams delivering solutions using Python, Flask, React, and Docker.
                </p>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-green-400 mb-1">Notable Projects:</p>
                  <ul className="text-sm text-green-300 list-disc pl-4 space-y-1">
                    <li>Mine Alliance - Sustainable mining platform with OpenAI ($1.5K prize)</li>
                    <li>Sage AI - Data science tutor with RAG pipeline (Hackathon project)</li>
                    <li>5 hackathon wins, $8K+ total prize money</li>
                  </ul>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/achievements/ac (2).webp"
                  alt="Hackathon Victory"
                  width={1200}
                  height={800}
                  className="rounded-lg object-cover w-full h-auto shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Achievement 3 - Machine Learning Growth */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2023
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Growing in Machine Learning
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Exploring Machine Learning
                </h3>
                <p className="text-white/80 font-normal mb-4 leading-relaxed text-sm">
                  I furthered my expertise in machine learning by developing skills in unsupervised models and generative AI applications. This journey led to the creation of projects like Amano, an emotion-based song recommendation system that uses reinforcement learning and sentiment analysis to tailor song choices based on user emotions.
                </p>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-green-400 mb-1">ML Specializations:</p>
                  <ul className="text-sm text-green-300 list-disc pl-4 space-y-1">
                    <li>Unsupervised learning models (K-means clustering)</li>
                    <li>Reinforcement learning algorithms</li>
                    <li>Sentiment analysis and emotion detection</li>
                    <li>Generative AI applications</li>
                  </ul>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/achievements/ac (3).webp"
                  alt="Machine Learning Journey"
                  width={1200}
                  height={800}
                  className="rounded-lg object-cover w-full h-auto shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Achievement 4 - Software Engineering Mastery */}
          <div className="mb-32">
            <h2 className="glass-pill text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2024
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="order-2 lg:order-1">
                <p className="text-xl mb-3 text-white font-semibold">
                  Developing Software Engineering Skills
                </p>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">
                  Advancing in Software Engineering
                </h3>
                <p className="text-white/80 font-normal mb-4 leading-relaxed text-sm">
                  Throughout college, I refined my software engineering skills by developing projects for academic and professional applications. My experience includes full-stack development with platforms like Next.js and Flask, as well as contributions to research and industry through roles such as Lead Software Engineer at the Mesa Interactive Exhibit.
                </p>
                <div className="p-3 glass-light rounded-lg">
                  <p className="text-sm font-medium text-green-400 mb-1">Technical Skills:</p>
                  <ul className="text-sm text-green-300 list-disc pl-4 space-y-1">
                    <li>Full-stack development (Next.js, React, Flask)</li>
                    <li>3D web development with Three.js</li>
                    <li>Team leadership and project management</li>
                    <li>Research and industry collaboration</li>
                  </ul>
                </div>
              </div>
              <div className="order-1 lg:order-2 w-full">
                <Image
                  src="/achievements/ac (4).webp"
                  alt="Software Engineering Growth"
                  width={1200}
                  height={800}
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
