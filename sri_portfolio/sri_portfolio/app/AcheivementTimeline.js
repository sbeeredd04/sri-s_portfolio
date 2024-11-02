"use client";

import Image from "next/image";
import React from "react";
import { Timeline } from "./components/timeline";

export function AchievementTimelineDemo() {
  const data = [
    {
      title: "Discovering Programming",
      content: (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-lg md:text-xl font-semibold mb-4">2022 - Introduction to Coding</h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            My programming journey began with Java in 2022. This first experience with coding quickly sparked my passion for creating impactful software solutions, setting me on the path to becoming a software engineer.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ac (1).webp"
              alt="Learning Java"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Winning Four Hackathons",
      content: (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-lg md:text-xl font-semibold mb-4">2023 - Hackathon Success</h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Over the past two years, I’ve won four hackathons, including the Devil's Invent, AZ Spark, and DAASH-sponsored events. During the AZ Spark Hackathon, I created Mine Alliance, a sustainable mining platform that integrates ChatGPT-4 for real-time environmental assessments. In another notable hackathon sponsored by Honeywell, my team developed Avisol, an innovative air traffic management system, which won the “Most Innovative Solution” award.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ac (2).webp"
              alt="Hackathon Victory"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Growing in Machine Learning",
      content: (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-lg md:text-xl font-semibold mb-4">2023 - Exploring Machine Learning</h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            I furthered my expertise in machine learning by developing skills in unsupervised models and generative AI applications. This journey led to the creation of projects like Amano, an emotion-based song recommendation system that uses reinforcement learning and sentiment analysis to tailor song choices based on user emotions.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ac (3).webp"
              alt="Machine Learning Journey"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Developing Software Engineering Skills",
      content: (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-lg md:text-xl font-semibold mb-4">2024 - Advancing in Software Engineering</h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Throughout college, I refined my software engineering skills by developing projects for academic and professional applications. My experience includes full-stack development with platforms like Next.js and Flask, as well as contributions to research and industry through roles such as Lead Software Engineer at the Mesa Interactive Exhibit.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ac (4).webp"
              alt="Software Engineering Growth"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Timeline data={data} />
    </div>
  );
}
