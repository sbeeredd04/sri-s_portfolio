import { earlyDrafts, referenceForks } from "./repository-shelf";
import { workbenchProjects } from "./workbench";
import { mobileProjects, hackathonProjects, workInProgress } from "./more-work";
// Current personal details confirmed directly by Sri. Public repository research is
// recorded in docs/research; earlier projects and beginnings are retained from the original site.
export const projects = [
  {
    id: "aether",
    name: "Aether",
    category: "AI · INTERFACE EXPLORATION",
    description:
      "AI conversations don’t have to be a straight line. Branch a conversation, follow a new idea, and keep the original thread.",
    url: "https://github.com/sbeeredd04/Aether",
    year: "2025",
    stack: ["Next.js", "TypeScript", "React Flow", "Zustand"],
    story: [
      {
        title: "Room to follow a thought",
        body: "A question often leads in more than one direction. Aether turns a chat into a canvas of connected conversations. You can branch from an earlier message, compare another model’s answer, and return to the path you started on.",
      },
      {
        title: "Context you can see",
        body: "React Flow handles the conversation graph, while a context sidebar keeps the history close to the selected node. Streaming responses, file inputs, and browser storage bring the parts of a chat interface into a workspace you can explore.",
      },
    ],
  },
  {
    id: "agentex",
    name: "Agentex",
    category: "BROWSER EXTENSION · AI",
    description:
      "A Chrome extension that helps tailor a LaTeX resume to a job description, with a PDF preview right where you’re working.",
    url: "https://github.com/sbeeredd04/Agentex",
    year: "2025–26",
    stack: ["JavaScript", "Chrome APIs", "LaTeX", "Node.js"],
    story: [
      {
        title: "Stay with the application",
        body: "Agentex puts a floating editor beside the page you’re already reading. Add a job description and a LaTeX resume, generate a tailored draft, then inspect the source or compile a PDF. Configuration lives in a separate side panel.",
      },
      {
        title: "Keep the person behind the resume",
        body: "The prompts are written to preserve existing facts and draw relevant experience from a personal knowledge base. The original resume, tailored text, and PDF preview stay available for review. Model choice and custom instructions let the user guide the draft.",
      },
    ],
  },
  {
    id: "gitcue",
    name: "GitCue / Auto-Git",
    category: "DEVELOPER TOOLS",
    description:
      "A CLI and VS Code extension that watches code changes and helps turn them into meaningful Git commits.",
    url: "https://github.com/sbeeredd04/auto-git",
    year: "2025",
    stack: ["Node.js", "Git", "VS Code API", "Gemini"],
    story: [
      {
        title: "A small interruption, handled",
        body: "Auto-Git watches a repository and uses the changes to generate commit messages. GitCue brings the same workflow into VS Code, with commands for committing, watching files, and opening a control panel.",
      },
      {
        title: "Wait for a useful stopping point",
        body: "The commit system tracks activity and waits for it to settle. Thresholds control which changes count, and new edits can cancel a pending commit during its buffer period. Timing, commit behavior, and push settings remain configurable.",
      },
    ],
  },
  {
    id: "mesa",
    name: "Mesa Historical Museum",
    category: "COLLABORATIVE PROJECT · EXHIBIT",
    description:
      "Interactive exhibit software created for the Mesa Historical Museum. Building for people beyond a browser tab.",
    url: "https://github.com/MesaMuseum/New-Mesa-Interactive-Exhibit",
    year: "2024–25",
    stack: ["React", "Three.js", "React Three Fiber", "React Router"],
    story: [
      {
        title: "History as a place to explore",
        body: "This collaborative EPICS project brings local history into an interactive exhibit. A 3D room uses clickable books as a way into the content, connecting a spatial introduction with stories about people and places.",
      },
      {
        title: "From a room to a story",
        body: "The reading interface follows a book layout, with chapter navigation, animated text, and video. My work spanned interface design, the React and Three.js experience, and bringing the exhibit to a dedicated museum kiosk.",
      },
    ],
  },
  {
    id: "csdna",
    name: "csDNA",
    category: "RESEARCH · COMPUTER VISION",
    description:
      "A way for researchers to make sense of DNA-PAINT microscopy images, without doing every step by hand.",
    url: "https://github.com/sbeeredd04/CSDNA",
    year: "2023–24",
    stack: ["Python", "Django", "scikit-learn", "CUDA / cuML"],
    story: [
      {
        title: "From bright dots to useful groups",
        body: "DNA-PAINT microscopy produces images that need processing before researchers can study individual structures. csDNA brings image upload, dot detection, noise filtering, and clustering into a web workflow.",
      },
      {
        title: "Leave room for a researcher’s judgment",
        body: "Researchers can adjust clustering parameters, inspect the detected groups, and assign labels before exporting categorized images and data. The processing pipeline supports GPU-assisted clustering with a CPU fallback, while plots make the results easier to inspect.",
      },
    ],
  },
  {
    id: "soda",
    name: "Tools for the SoDA community",
    category: "COMMUNITY · COLLABORATIVE PROJECT",
    description:
      "The software behind a student developer community: club APIs, Discord bots, and tools that make organizing easier.",
    url: "https://github.com/asusoda/platform",
    year: "2024–25",
    stack: ["Python", "Flask", "Discord", "React"],
    story: [
      {
        title: "Software for the people around me",
        body: "SoDA’s platform combines a modular internal API, Discord bots, and a web interface for a student developer community. It brings club operations into a shared codebase that members can contribute to.",
      },
      {
        title: "Building also means helping others build",
        body: "As Director of Technology, my work included internal tools, Discord integrations, onboarding documentation, and workshops on Docker, Flask, and Chrome extensions. It was a chance to work on both the software and the community around it.",
      },
    ],
  },
];

export const experiments = [
  {
    name: "Beli Codes",
    category: "Community",
    description:
      "A community board for sharing Beli invite codes and voting on which ones still work.",
    url: "https://github.com/sbeeredd04/beli_codes",
  },
  {
    name: "Amano",
    category: "Music + ML",
    description:
      "An experiment in music recommendations that respond to mood and feedback.",
    url: "https://github.com/sbeeredd04/Amano",
    stack: ["Next.js", "Flask", "PyTorch", "Spotify"],
    story: [
      {
        title: "Music meets the machine-learning notebook",
        body: "Amano explores a question close to something I already love: music. Could a recommendation respond to how someone feels, as well as what they have listened to? The prototype brings a mood interface, playlists, and feedback into the same workflow.",
      },
      {
        title: "A recommendation is a loop",
        body: "The project’s design combines audio features such as energy and tempo with mood analysis and a reinforcement-learning model that can use feedback. A Next.js interface talks to a Flask backend. It’s an experiment in how a recommendation changes when the listener responds.",
      },
    ],
  },
  {
    name: "VoxelCV",
    category: "Computer vision",
    description:
      "Exploring posture analysis and fall detection through pose estimation.",
    url: "https://github.com/sbeeredd04/VoxelCV",
  },
  {
    name: "HeadBobberGames",
    category: "Play",
    description:
      "A multiplayer light-cycle game with 3D visuals, made for playing with friends.",
    url: "https://github.com/sbeeredd04/HeadBobberGames",
    stack: ["JavaScript", "Three.js", "Canvas"],
    story: [
      {
        title: "One screen, a few friends",
        body: "Prismatrix is a browser light-cycle game: bikes leave trails, players dodge obstacles, and the last one standing wins. The original project describes two to five players sharing a screen, with configurable keyboard controls and split views.",
      },
      {
        title: "Make the next round different",
        body: "The settings let players adjust the arena, obstacle density, bike speed, jump height, and camera. Three.js handles the neon world and trails. The original playable build is linked below.",
      },
    ],
  },
  {
    name: "Market Anomaly Detection",
    category: "Machine learning",
    description:
      "An experiment in training and evaluating models on financial market data.",
    url: "https://github.com/sbeeredd04/MAD",
  },
  {
    name: "SceneGraphVLM",
    category: "Vision + language",
    description:
      "Exploring scene-graph prediction with vision-language models and the Visual Genome dataset.",
    url: "https://github.com/sbeeredd04/SceneGraphVLM",
  },
  {
    name: "ComputerVision",
    category: "Learning",
    description:
      "Hands-on experiments with YOLO object detection and MediaPipe hand tracking.",
    url: "https://github.com/sbeeredd04/ComputerVision",
  },
  {
    name: "Trainer",
    category: "Deep learning",
    description:
      "A documented ResNet-34 training pipeline for the CIFAR-100 dataset.",
    url: "https://github.com/sbeeredd04/Trainer",
  },
  {
    name: "Prom10",
    category: "Browser tools",
    description:
      "A prompt-assistant Chrome extension, with a companion website.",
    url: "https://github.com/sbeeredd04/promen",
  },
  {
    name: "Song Rec",
    category: "Music + ML",
    description:
      "Exploring music recommendations with Spotify’s Million Playlist Dataset.",
    url: "https://github.com/sbeeredd04/Song_Rec",
  },
  {
    name: "Zsh Autocomplete",
    category: "Developer tools",
    description:
      "A Zsh and C plugin with ghost-text suggestions, prefix-filtered history, and command suggestions that persist between sessions.",
    url: "https://github.com/sbeeredd04/zsh_plugin",
  },
];

export const earlierProjects = [
  {
    name: "OctoDoc / DocEd",
    category: "Documentation",
    description:
      "An earlier experiment in generating useful project documentation from GitHub repositories with AI.",
    story: [
      {
        title: "Start with the repository",
        body: "An early idea for making a codebase easier to approach: use its GitHub repository as the starting point for documentation and README drafts. The original site describes a Next.js interface, Pinecone embeddings, and language-model generation.",
      },
      {
        title: "Keep the experiment in view",
        body: "This was a documentation prototype, and the original hosted interface is preserved below. Its generation flow depends on the original backend. It belongs here as part of learning how AI might help someone understand an unfamiliar project.",
      },
    ],
  },
  {
    name: "Sage AI",
    category: "Learning tools",
    description:
      "A data-science tutoring project, exploring AI guidance, retrieval, and an environment for running code.",
  },
  {
    name: "Mine Alliance",
    category: "Hackathon",
    description:
      "A hackathon project exploring environmental assessments for sustainable mining.",
  },
];

export const beginnings = [
  {
    period: "2022",
    title: "Starting with Java",
    description:
      "My first steps in programming were with Java. Learning to turn a small idea into working software pulled me into everything that came next.",
  },
  {
    period: "During college",
    title: "Building under a deadline",
    description:
      "Hackathons became a place to test ideas quickly, work with new people, and get comfortable presenting. Projects included Mine Alliance and Sage AI.",
  },
];

export const shows = [
  "Brooklyn Nine-Nine",
  "The Big Bang Theory",
  "Friends",
  "The Fresh Prince of Bel-Air",
  "How I Met Your Mother",
];

export const history = [
  {
    name: "Offseason",
    role: "Founding Engineer",
    period: "Now · San Francisco",
    description:
      "Building an AI agent for personal wellness. Working at the intersection of useful technology and a deeply personal part of everyday life.",
  },
  {
    name: "Arizona State University",
    role: "Computer Science · Entrepreneurship certificate",
    period: "Graduated · 4.0 GPA",
    description:
      "A foundation in software engineering, with an interest in turning technical ideas into products people want.",
  },
  {
    name: "Geometric Media Lab",
    role: "AI / ML Software Engineering",
    period: "Research experience",
    description:
      "Explored gunshot detection for rainforest monitoring, vision-language models, and machine-learning pipelines. Built and evaluated PyTorch experiments using GPU computing.",
  },
  {
    name: "Software Developers Association",
    role: "Director of Technology",
    period: "January 2024 – November 2025",
    description:
      "Built internal tools and Discord integrations, wrote onboarding documentation, and led workshops on Docker, Flask, and Chrome extensions. Helping a student community learn by making things together.",
  },
  {
    name: "Mesa Historical Museum",
    role: "Software Engineer · EPICS",
    period: "August 2024 – May 2025",
    description:
      "Worked from interface design through a React and Three.js exhibit, then brought it to a dedicated museum kiosk. A collaborative EPICS project for visitors to explore local history.",
  },
  {
    name: "ASU Biodesign Institute",
    role: "Software Engineering Intern",
    period: "January 2023 – August 2024",
    description:
      "Built backend and web tools for DNA-PAINT image analysis, helping researchers explore microscopy data with clustering and visualization.",
  },
];

export const toolkit = [
  {
    title: "Interfaces & experiences",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "HTML & CSS",
      "Three.js",
      "Tailwind CSS",
      "Figma",
    ],
  },
  {
    title: "AI & research",
    items: [
      "Python",
      "PyTorch",
      "Computer vision",
      "Model evaluation",
      "CUDA",
      "Hugging Face",
      "TensorFlow",
      "scikit-learn",
      "OpenCV",
      "NumPy",
      "pandas",
      "LangChain",
    ],
  },
  {
    title: "Behind the scenes",
    items: [
      "Node.js",
      "Flask",
      "Django",
      "FastAPI",
      "Express",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Git",
      "Docker",
      "Linux",
    ],
  },
  {
    title: "Languages & workbench",
    items: [
      "Java",
      "C / C++",
      "SQL",
      "Bash",
      "VS Code",
      "Jupyter",
      "Selenium",
    ],
  },
  {
    title: "The way I work",
    items: [
      "Product thinking",
      "Interaction design",
      "Rapid prototyping",
      "Technical workshops",
      "Building with teams",
    ],
  },
];

export const projectCollections = [
  { id: "projects", label: "Selected work", items: projects },
  { id: "mobile", label: "iPhone & iPad", items: mobileProjects },
  { id: "hackathons", label: "Hackathons", items: hackathonProjects },
  { id: "progress", label: "In progress", items: workInProgress },
  { id: "workbench", label: "The workbench", items: workbenchProjects },
  {
    id: "experiments",
    label: "Experiments",
    items: experiments.filter((p) => p.name !== "VoxelCV"),
  },
  {
    id: "earlier",
    label: "Earlier builds",
    items: earlierProjects.filter(
      (p) => !["Mine Alliance", "Sage AI"].includes(p.name),
    ),
  },
  { id: "drafts", label: "Early drafts", items: earlyDrafts },
  { id: "references", label: "Reference shelf", items: referenceForks },
];
export const allProjects = projectCollections.flatMap((group) => group.items);
