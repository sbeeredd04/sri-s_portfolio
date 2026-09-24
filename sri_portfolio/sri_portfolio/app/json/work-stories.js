// Recovered from the original ExperienceSection and current repository evidence.
// Source boundaries and deliberately excluded metrics: docs/research/content-recovery-2026-09-21.md.
export const workStories = {
  "Arizona State University": {
    setting: "Tempe · computer science & entrepreneurship",
    chapters: [
      [
        "Learning by making",
        "I started programming with Java in 2022. At ASU, that grew into research work, student tools, museum software, and hackathon prototypes. I graduated with a 4.0 GPA and an entrepreneurship certificate.",
      ],
      [
        "An idea has to meet people",
        "Hackathons gave me a place to build with new teammates and present an idea under a deadline. Entrepreneurship added another question: does this actually help someone?",
      ],
    ],
    link: {
      label: "Explore the hackathon projects",
      href: "#project-safeside",
    },
  },
  "Geometric Media Lab": {
    setting: "Tempe · applied machine learning research",
    chapters: [
      [
        "From a recording to a field device",
        "I worked on an audio pipeline for gunshot detection in rainforest monitoring: capturing and preparing audio, training a model, and deploying inference on a Raspberry Pi. The work connected machine learning experiments with the constraints of a small device.",
      ],
      [
        "From papers to experiments",
        "Other work explored vision-language models and computer vision. I built inference pipelines in PyTorch, ran experiments on ASU’s SOL GPU cluster with CUDA, and used Weights & Biases to log and compare runs.",
      ],
    ],
  },
  "Software Developers Association": {
    setting: "Tempe · student community",
    chapters: [
      [
        "The software behind the club",
        "As Director of Technology, I helped build internal tools around Discord sign-in, administration, member points, and rewards. The platform brought club workflows into a shared API and bot system.",
      ],
      [
        "Make room for someone else to learn",
        "I also led hands-on technical workshops with the team, covering Docker, Flask, and Chrome extensions. Building for the community and teaching with it were both part of the role.",
      ],
    ],
    image: {
      src: "/aboutMe/soda-presentation.webp",
      alt: "Sri and a fellow presenter at a SoDA student event",
      caption: "From the original site’s photo collection: a moment at SoDA.",
    },
    link: { label: "Explore the SoDA platform", href: "#project-soda" },
  },
  "Mesa Historical Museum": {
    setting: "EPICS · a collaborative museum exhibit",
    chapters: [
      [
        "A website with a physical home",
        "I helped take the exhibit from Figma layouts to a React and Three.js interface. Visitors could explore local history through a 3D room, books, text, and video on a dedicated museum display.",
      ],
      [
        "Think beyond the screen",
        "The delivery included automated deployments on Vercel and a locked-down browser for the kiosk hardware. The site used JSON content rather than a separate CMS, keeping the setup simpler to maintain.",
      ],
    ],
    link: { label: "Look inside the museum project", href: "#project-mesa" },
  },
  "ASU Biodesign Institute": {
    setting: "Tempe · software for microscopy research",
    chapters: [
      [
        "Give researchers a way through the images",
        "I built backend and web tools for DNA-PAINT image analysis. The workflow brings detection, noise filtering, clustering, and visual inspection together so researchers can work through microscopy data.",
      ],
      [
        "Keep the result inspectable",
        "The interface exposes analysis settings and supports labeled results, plots, and exports. I also worked on documentation and testing so the workflow could be understood and continued by other engineers.",
      ],
    ],
    link: {
      label: "Explore the csDNA analysis project",
      href: "#project-csdna",
    },
  },
};
