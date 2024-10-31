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
            Two years ago, I began my coding journey with Java. This was my first experience with programming, and I quickly became passionate about learning and creating solutions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg" // Replace with your actual image path if available
              alt="Learning Java"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg"
              alt="Early Coding Days"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Devil's Invent Hackathon",
      content: (
        <div>
          <h2 className="text-neutral-800 dark:text-neutral-200 text-lg md:text-xl font-semibold mb-4">2023 - Hackathon Success</h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            In Spring 2023, my team won the Devil's Invent Hackathon, where we developed an innovative solution to a real-world problem. This experience taught me a lot about teamwork, rapid development, and problem-solving under pressure.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg"
              alt="Hackathon Victory"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg"
              alt="Team Celebration"
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
            I continued my growth by learning machine learning through various courses and small projects. This experience helped me develop a strong foundation in data analysis and predictive modeling.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg"
              alt="Machine Learning Journey"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg"
              alt="Learning and Projects"
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
