// Source audit: docs/research/github-refresh-2026-09-15.json and github-source-samples-2026-09-15.json.
export const workbenchProjects = [
  {
    id: "food-thought",
    name: "Food Thought",
    category: "TEAM WORKFLOW · PROTOTYPE",
    description:
      "A staff-management prototype with separate views for employees and managers: schedules, requests, training, and alerts.",
    stack: ["Next.js", "React"],
    url: "https://github.com/sbeeredd04/FoodThought",
    story: [
      {
        title: "One workplace, two perspectives",
        body: "I explored how the same schedule could serve people doing the work and people organizing it. The prototype separates those views while keeping the day-to-day tasks close at hand.",
      },
    ],
  },
  {
    id: "nous",
    name: "Nous",
    category: "AI SYSTEM · EXPERIMENT",
    description:
      "An experiment with background reasoning, memory, and a conversational foreground. A place to explore how a system might carry context between interactions.",
    stack: ["Python"],
    url: "https://github.com/sbeeredd04/Nous",
    story: [
      {
        title: "A thought that continues",
        body: "The architecture separates a background loop from the part that talks to a person. Its memory and simulated internal states are experiments in software behavior, not evidence of consciousness.",
      },
    ],
  },
  {
    id: "trak",
    name: "Trak / EvolveFit",
    category: "HEALTH INTERFACE · CONCEPT",
    description:
      "A quieter health-tracking concept. The web prototype explores a simple introduction, app previews, and a waitlist flow.",
    stack: ["TypeScript", "React"],
    url: "https://github.com/sbeeredd04/Trak",
    story: [
      {
        title: "Start with how it should feel",
        body: "This was an interface exploration around less visual noise and more focus. The repository contains the concept site; it does not establish a launched health service or real customer results.",
      },
    ],
  },
  {
    id: "psych",
    name: "Psych",
    category: "CONVERSATIONAL INTERFACE · PROTOTYPE",
    description:
      "A chat-interface experiment around personal reflection, with messages, file input, audio playback, and settings.",
    stack: ["TypeScript", "Next.js"],
    url: "https://github.com/sbeeredd04/psych",
    story: [
      {
        title: "Exploring a more supportive interface",
        body: "The work brings several kinds of input into a conversation. It is an early software prototype, not a clinically validated mental-health product.",
      },
    ],
  },
  {
    id: "classauto",
    name: "A seat in the class",
    category: "PERSONAL AUTOMATION",
    description:
      "A class-availability monitor with a separate browser workflow for enrollment. A small automation built around a familiar student problem.",
    stack: ["Python", "Selenium"],
    url: "https://github.com/sbeeredd04/classauto",
    story: [
      {
        title: "Separate the waiting from the action",
        body: "The checker watches availability in the background; the visible browser handles the enrollment flow and authentication. The repository documents the two-part design, without proving ongoing reliability against ASU’s current system.",
      },
    ],
  },
  {
    id: "threaded-wordcount",
    name: "Words, split across threads",
    category: "DISTRIBUTED SYSTEMS · LEARNING",
    description:
      "A Python word counter inspired by MapReduce. Split a text into pieces, count them in parallel, then combine the results.",
    stack: ["Python", "Threads"],
    url: "https://github.com/sbeeredd04/hadoop_multithreading",
    story: [
      {
        title: "Learning by making the pieces visible",
        body: "The exercise names each step—map, reduce, and combine—and compares a single thread with multiple threads. It is a local threaded implementation, not a deployed Hadoop cluster.",
      },
    ],
  },
  {
    id: "inspection-pdf",
    name: "From inspection data to a report",
    category: "DOCUMENT AUTOMATION",
    description:
      "A report-generation challenge that turns structured inspection data into a PDF, including form fields, images, comments, and QR links.",
    stack: ["TypeScript", "pdf-lib"],
    url: "https://github.com/sbeeredd04/binsr_challenge",
    story: [
      {
        title: "The details that make a document usable",
        body: "I worked on the space between structured data and a document someone can read: ordering sections, wrapping text, placing images, and keeping page numbers and links useful.",
      },
    ],
  },
  {
    id: "xml-exploration",
    name: "Making structured data behave",
    category: "XML & SCHEMAS · LEARNING",
    description:
      "An exercise in XML schemas, validation, and conversion to JSON, using a hotel directory and intentionally invalid examples.",
    stack: ["XML", "XSD", "C#"],
    url: "https://github.com/sbeeredd04/XML_Xpoloration",
    story: [
      {
        title: "Knowing why an input fails",
        body: "The interesting part was not only accepting a valid document. The exercise also uses broken examples to make validation errors and missing fields explicit.",
      },
    ],
  },
  {
    id: "browser-101",
    name: "A conversation in the browser",
    category: "BROWSER EXTENSIONS · LEARNING",
    description:
      "A Chrome-extension learning project with a Gemini chat side panel, a service worker, and a settings page.",
    stack: ["JavaScript", "Chrome Extensions"],
    url: "https://github.com/sbeeredd04/Chrome-extension-101",
    story: [
      {
        title: "Learning a new place to build",
        body: "This workspace explores the structure of an extension: what lives in the panel, what belongs in the background, and how settings connect the two.",
      },
    ],
  },
  {
    id: "gymception",
    name: "Gymception",
    category: "GYM WORKFLOW · EARLY BUILD",
    description:
      "A Django application exploring gym equipment queues and workout records, with background jobs handled through Celery.",
    stack: ["Python", "Django", "Celery"],
    story: [
      {
        title: "A shared space needs coordination",
        body: "The project explores member workflows and scheduled cleanup for shared gym resources. It remains an earlier build in this collection.",
      },
    ],
  },
  {
    id: "prompt-improver",
    name: "A clearer first prompt",
    category: "AI TOOL · SMALL EXPERIMENT",
    description:
      "A Streamlit experiment that takes a draft prompt and asks a language model to make the request more specific.",
    stack: ["Python", "Streamlit"],
    story: [
      {
        title: "A small tool for a small friction",
        body: "The interaction is deliberately simple: write a first version, ask for a revision, and compare the wording. It was a quick experiment in improving the input to an AI conversation.",
      },
    ],
  },
  {
    id: "coloring-book",
    name: "Suzie Q’s coloring book",
    category: "COMMUNITY WEBSITE · EARLY BUILD",
    description:
      "An early website with pages for contributing drawings, sponsorship, and a coloring-book fundraiser.",
    stack: ["HTML", "CSS", "Firebase"],
    url: "https://github.com/sbeeredd04/SparkDev_LAA",
    story: [
      {
        title: "Making room for people to contribute",
        body: "The prototype connects a drawing-upload flow with pages about supporting the project. It is part of my earlier web work; the public source does not establish fundraising outcomes.",
      },
    ],
  },
  {
    id: "biomod",
    name: "Cargo Code Breakers",
    category: "SCIENCE COMMUNICATION · TEAM WEBSITE",
    description:
      "A website presenting the Cargo Code Breakers BIOMOD project, with introductions, experiments, results, and a team page.",
    stack: ["HTML", "CSS"],
    url: "https://github.com/sbeeredd04/BIOMOD_CCB",
    story: [
      {
        title: "Give the science a place to be understood",
        body: "The website organizes the team’s material into a path from background to experiments and results. The site work is distinct from claiming authorship of every scientific result.",
      },
    ],
  },
  {
    id: "wish",
    name: "A birthday on the web",
    category: "SMALL PERSONAL WEBSITE",
    description:
      "A small birthday website with a soundtrack and a custom page. An earlier reminder that making something can be personal, too.",
    stack: ["HTML", "CSS", "JavaScript"],
    url: "https://github.com/sbeeredd04/Wish",
  },
  {
    id: "notion-widgets",
    name: "Little things for a Notion page",
    category: "WIDGETS · EXPLORATION",
    description:
      "A collection of web widgets intended for Notion pages. Small interface experiments with a narrow job to do.",
    stack: ["HTML"],
    url: "https://github.com/sbeeredd04/Notion_widgets",
  },
  {
    id: "flask-101",
    name: "Learning Flask",
    category: "WEB FRAMEWORK · LEARNING",
    description:
      "An introductory Flask workspace from learning how Python applications become web services.",
    stack: ["Python", "Flask"],
    url: "https://github.com/sbeeredd04/Flask-101",
  },
  {
    id: "javafx-learning",
    name: "Learning JavaFX",
    category: "COURSEWORK · LEARNING",
    description:
      "JavaFX and programming exercises from a software-engineering course workspace. Early practice with desktop interfaces and application structure.",
    stack: ["Java", "JavaFX"],
    url: "https://github.com/sbeeredd04/CSE_360_Projec",
  },
  {
    id: "leetcode",
    name: "Working through a problem",
    category: "ALGORITHMS · PRACTICE",
    description:
      "A record of algorithm practice and solutions. The smaller, regular work behind becoming more comfortable with a difficult problem.",
    stack: ["Python"],
    url: "https://github.com/sbeeredd04/LeetCode",
  },
  {
    id: "dotfiles",
    name: "The setup behind the setup",
    category: "DEVELOPER ENVIRONMENT",
    description:
      "Personal shell and Git configuration for my macOS development environment. A few details that make daily work feel familiar.",
    stack: ["Shell", "Git"],
    url: "https://github.com/sbeeredd04/dotfiles",
  },
];
