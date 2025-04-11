"use client";

import Image from "next/image";
import React from "react";
import { Timeline } from "./components/timeline";

export function AchievementTimelineDemo({ theme }) {
  const data = [
    {
      title: "Discovering Programming",
      content: (
        <div>
          <h2 className="text-lg md:text-2xl font-semibold mb-4 text-white">2022 - Introduction to Coding</h2>
          <p className="text-sm md:text-base text-white/80 font-normal mb-8 leading-relaxed">
            My programming journey began with Java in 2022. This first experience with coding quickly sparked my passion for creating impactful software solutions, setting me on the path to becoming a software engineer.
          </p>
          <div className="w-full">
            <Image
              src="/ac (1).webp"
              alt="Learning Java"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-72 lg:h-96 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Winning Four Hackathons",
      content: (
        <div>
          <h2 className="text-lg md:text-2xl font-semibold mb-4 text-white">2023 - Hackathon Success</h2>
          <p className="text-sm md:text-base text-white/80 font-normal mb-8 leading-relaxed">
            Over the past two years, I've won four hackathons, including the Devil's Invent, AZ Spark, and DAASH-sponsored events. During the AZ Spark Hackathon, I created Mine Alliance, a sustainable mining platform that integrates ChatGPT-4 for real-time environmental assessments. In another notable hackathon sponsored by Honeywell, my team developed Avisol, an innovative air traffic management system, which won the "Most Innovative Solution" award.
          </p>
          <div className="w-full">
            <Image
              src="/ac (2).webp"
              alt="Hackathon Victory"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-72 lg:h-96 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Growing in Machine Learning",
      content: (
        <div>
          <h2 className="text-lg md:text-2xl font-semibold mb-4 text-white">2023 - Exploring Machine Learning</h2>
          <p className="text-sm md:text-base text-white/80 font-normal mb-8 leading-relaxed">
            I furthered my expertise in machine learning by developing skills in unsupervised models and generative AI applications. This journey led to the creation of projects like Amano, an emotion-based song recommendation system that uses reinforcement learning and sentiment analysis to tailor song choices based on user emotions.
          </p>
          <div className="w-full">
            <Image
              src="/ac (3).webp"
              alt="Machine Learning Journey"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-72 lg:h-96 w-full"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Developing Software Engineering Skills",
      content: (
        <div>
          <h2 className="text-lg md:text-2xl font-semibold mb-4 text-white">2024 - Advancing in Software Engineering</h2>
          <p className="text-sm md:text-base text-white/80 font-normal mb-8 leading-relaxed">
            Throughout college, I refined my software engineering skills by developing projects for academic and professional applications. My experience includes full-stack development with platforms like Next.js and Flask, as well as contributions to research and industry through roles such as Lead Software Engineer at the Mesa Interactive Exhibit.
          </p>
          <div className="w-full">
            <Image
              src="/ac (4).webp"
              alt="Software Engineering Growth"
              width={1200}
              height={800}
              className="rounded-lg object-cover h-48 md:h-72 lg:h-96 w-full"
            />
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
