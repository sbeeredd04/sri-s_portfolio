"use client";

import Image from "next/image";
import React from "react";
import { TracingBeam } from "./components/tracing-beam";

export function AchievementTimelineDemo({ theme }) {
  return (
    <div className="w-full h-full">
      <TracingBeam className="px-6">
        <div className="max-w-2xl mx-auto antialiased pt-4 relative">
          {/* Achievement 1 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2022
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Discovering Programming
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Introduction to Coding
              </h3>
              <p className="text-white/80 font-normal mb-4 leading-relaxed">
                My programming journey began with Java in 2022. This first experience with coding quickly sparked my passion for creating impactful software solutions, setting me on the path to becoming a software engineer. I started with basic concepts like variables, loops, and object-oriented programming principles.
              </p>
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-400 mb-1">Foundation Skills:</p>
                <p className="text-sm text-green-300">
                  Java fundamentals, object-oriented programming, data structures, and algorithmic thinking.
                </p>
              </div>
            </div>
            <Image
              src="/ac (1).webp"
              alt="Learning Java"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full mb-4"
            />
          </div>

          {/* Achievement 2 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2023
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Winning Four Hackathons
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Hackathon Success
              </h3>
              <p className="text-white/80 font-normal mb-4 leading-relaxed">
                Over the past two years, I've won four hackathons, including the Devil's Invent, AZ Spark, and DAASH-sponsored events. During the AZ Spark Hackathon, I created Mine Alliance, a sustainable mining platform that integrates ChatGPT-4 for real-time environmental assessments. In another notable hackathon sponsored by Honeywell, my team developed Avisol, an innovative air traffic management system, which won the "Most Innovative Solution" award.
              </p>
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-400 mb-1">Notable Projects:</p>
                <ul className="text-sm text-green-300 list-disc pl-4">
                  <li>Mine Alliance - Sustainable mining platform with ChatGPT-4 integration</li>
                  <li>Avisol - Air traffic management system (Most Innovative Solution)</li>
                  <li>Multiple award-winning hackathon projects</li>
                </ul>
              </div>
            </div>
            <Image
              src="/ac (2).webp"
              alt="Hackathon Victory"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full mb-4"
            />
          </div>

          {/* Achievement 3 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2023
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Growing in Machine Learning
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Exploring Machine Learning
              </h3>
              <p className="text-white/80 font-normal mb-4 leading-relaxed">
                I furthered my expertise in machine learning by developing skills in unsupervised models and generative AI applications. This journey led to the creation of projects like Amano, an emotion-based song recommendation system that uses reinforcement learning and sentiment analysis to tailor song choices based on user emotions.
              </p>
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-400 mb-1">ML Specializations:</p>
                <ul className="text-sm text-green-300 list-disc pl-4">
                  <li>Unsupervised learning models (K-means clustering)</li>
                  <li>Reinforcement learning algorithms</li>
                  <li>Sentiment analysis and emotion detection</li>
                  <li>Generative AI applications</li>
                </ul>
              </div>
            </div>
            <Image
              src="/ac (3).webp"
              alt="Machine Learning Journey"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full mb-4"
            />
          </div>

          {/* Achievement 4 */}
          <div className="mb-10">
            <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
              2024
            </h2>
            <p className="text-xl mb-4 text-white font-semibold">
              Developing Software Engineering Skills
            </p>
            <div className="text-sm prose prose-sm dark:prose-invert mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Advancing in Software Engineering
              </h3>
              <p className="text-white/80 font-normal mb-4 leading-relaxed">
                Throughout college, I refined my software engineering skills by developing projects for academic and professional applications. My experience includes full-stack development with platforms like Next.js and Flask, as well as contributions to research and industry through roles such as Lead Software Engineer at the Mesa Interactive Exhibit.
              </p>
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-400 mb-1">Technical Skills:</p>
                <ul className="text-sm text-green-300 list-disc pl-4">
                  <li>Full-stack development (Next.js, React, Flask)</li>
                  <li>3D web development with Three.js</li>
                  <li>Team leadership and project management</li>
                  <li>Research and industry collaboration</li>
                </ul>
              </div>
            </div>
            <Image
              src="/ac (4).webp"
              alt="Software Engineering Growth"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-60 w-full mb-4"
            />
          </div>
        </div>
      </TracingBeam>
    </div>
  );
}
