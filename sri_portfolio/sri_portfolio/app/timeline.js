"use client";

import Image from "next/image";
import React from "react";
import { Timeline } from "./components/timeline";

export function TimelineDemo() {
  const data = [
    {
      title: "2024",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Started a new project focused on integrating advanced AI tools to streamline operations.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg"
              alt="Project 1"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg" // Use another image or the same as a placeholder
              alt="Project 2"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Completed a major redesign of the user interface to improve accessibility and user experience.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg" // Replace with your desired image path
              alt="UI Redesign"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg" // Replace with another image if available
              alt="Feature Update"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2022",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Successfully launched an early prototype, receiving positive feedback from the initial user base.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/home1.jpg" // Replace with your image path
              alt="Prototype"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
            <Image
              src="/home1.jpg" // Replace with another image if available
              alt="User Feedback"
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
