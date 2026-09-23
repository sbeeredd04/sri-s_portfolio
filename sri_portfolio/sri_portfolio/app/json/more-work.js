// Sources and limits: docs/research/hackathons-mobile-2026-09-14.json.
export const mobileProjects = [
  {
    id: "aatram",
    name: "Aatram",
    category: "IPHONE & IPAD · PRODUCTIVITY",
    year: "2026",
    status: "On the App Store",
    description:
      "A gentler way to build momentum. Aatram pairs a focus timer and emotion check-ins with progress that can bend without breaking.",
    url: "https://apps.apple.com/us/app/aatram/id6760587556",
    linkLabel: "View on the App Store",
    story: [
      {
        title: "A bad day doesn’t erase a good week",
        body: "I wanted to explore productivity without the pressure of a perfect streak. Aatram uses a momentum meter that gradually fades, alongside focus sessions and a check-in on how you’re feeling.",
      },
      {
        title: "Keep it personal",
        body: "The app works without an account and keeps its data on the device. The interface is deliberately quiet, with dark mode and space to focus on the next small step.",
      },
    ],
  },
  {
    id: "simsim",
    name: "SimSim",
    category: "SWIFT · PHOTO SEARCH EXPLORATION",
    description:
      "Exploring a more natural way to search a photo library, using image and text embeddings on the device.",
    url: "https://github.com/sbeeredd04/SimSim",
    stack: ["Swift", "Core ML", "Photos"],
    story: [
      {
        title: "Search by what you mean",
        body: "This native app experiment brings text and image embeddings into a photo-library workflow. It includes photo indexing, a search service, and a grid for exploring the results.",
      },
      {
        title: "Learning the shape of a native app",
        body: "Working in Swift meant thinking through indexing, local persistence, and how a search interaction should feel on a phone. It’s still a place to experiment with how photo search could feel.",
      },
    ],
  },
  {
    id: "ios-101",
    name: "Learning SwiftUI",
    category: "LEARNING PROJECT",
    description:
      "An iOS learning workspace built around Scrumdinger: meeting timers, participants, and history. Part of getting comfortable with native interfaces.",
    url: "https://github.com/sbeeredd04/iOS-101",
    stack: ["Swift", "SwiftUI"],
  },
];
export const hackathonProjects = [
  {
    id: "safeside",
    name: "SafeSide",
    category: "DEVILS INVENT + DASSH · TEAM CONCEPT",
    year: "February 2023",
    status: "Team · tied third in our challenge",
    description:
      "A team concept for helping people understand where to go during an emergency. We explored location-aware evacuation maps, alerts, and clearer communication.",
    url: "/SafeSide.pdf",
    linkLabel: "Read our original presentation",
    sourceUrl:
      "https://students.engineering.asu.edu/devils-invent/past-events/",
    sourceLabel: "ASU event results",
    story: [
      {
        title: "Start with the person in the moment",
        body: "At Devils Invent + DASSH, our team worked on a question about helping crowds make decisions under pressure. We proposed a mobile interface connecting evacuation guidance, location, and updates from responders.",
      },
      {
        title: "An early concept, with a team",
        body: "The presentation explores Bluetooth beacons for indoor positioning and maps for outdoor navigation. It was a hackathon concept, with integrations still proposed. SafeSide tied for third in its problem-statement category.",
      },
    ],
  },
  {
    id: "aruready",
    name: "AR You Ready",
    category: "DEVILS INVENT · AUGMENTED REALITY",
    year: "September 2023",
    status: "Team · third place",
    description:
      "A team exploration of augmented reality as a way to introduce ASU’s Fulton programs. I built the accompanying website.",
    url: "https://github.com/sbeeredd04/ARuReady",
    sourceUrl:
      "https://students.engineering.asu.edu/devils-invent/past-events/",
    sourceLabel: "ASU event results",
    story: [
      {
        title: "An idea people could step into",
        body: "The Augment Our Reality challenge asked teams to use AR to share Fulton programs on social media. Our team, AR You Ready, placed third. The website is one piece of that collaborative project.",
      },
    ],
  },
  {
    id: "avisol",
    name: "AviSol",
    category: "DEVILS INVENT · AUTONOMY IN AEROSPACE",
    year: "April 2024",
    status: "Team · Innovation Technology award",
    description:
      "An aerospace autonomy project, made with a team at Devils Invent. The repository collects the prototype work and links to a simulation.",
    url: "https://github.com/sbeeredd04/AviSol",
    sourceUrl:
      "https://students.engineering.asu.edu/devils-invent/past-events/",
    sourceLabel: "ASU event results",
  },
  {
    id: "voxelcv",
    status: "Hackathon winner · recorded in my earlier résumé",
    sourceUrl: "/sri_resume.pdf",
    sourceLabel: "Original résumé record",
    name: "VoxelCV / PosturePro",
    category: "VOXEL51 HACKATHON · COMPUTER VISION",
    description:
      "A prototype for exploring posture and fall detection through pose landmarks, webcam input, and image analysis.",
    url: "https://github.com/sbeeredd04/VoxelCV",
    stack: ["Python", "MediaPipe", "OpenCV", "Gemini"],
    story: [
      {
        title: "Turn movement into something visible",
        body: "The project uses pose estimation to find body landmarks and calculate angles. It explores both live webcam feedback and image-based fall classification.",
      },
    ],
  },
  {
    id: "mine-alliance",
    status: "Team · Principled Innovation award",
    sourceUrl: "https://github.com/LuaanNguyen/Mine-Alliance",
    sourceLabel: "Team repository & award record",
    name: "Mine Alliance",
    category: "AZ SPARK · TEAM HACKATHON PROJECT",
    year: "2024",
    description:
      "An environmental-information prototype for communities around mining sites. Maps and AI-assisted assessments bring different parts of the picture together.",
    url: "https://devpost.com/software/mine-alliance",
    linkLabel: "View the team’s project",
    stack: ["Flask", "SQLAlchemy", "Leaflet", "AWS"],
    story: [
      {
        title: "A technical problem with people around it",
        body: "The team explored how to make mining information easier to understand and discuss. My role was backend development, connecting the application’s data and assessment workflow. The Devpost entry records the team project and its original aims.",
      },
    ],
  },
  {
    id: "sage-ai",
    name: "Sage AI",
    category: "HACKATHON · EARLIER BUILD",
    description:
      "An early exploration of a data-science workspace with AI guidance and collaborative coding. One of the ideas I tested through hackathons.",
  },
];
export const workInProgress = [
  {
    id: "chalant",
    name: "Chalant",
    category: "IN PROGRESS",
    status: "Currently exploring",
    description: "An app I’m working on now. More to share as it takes shape.",
  },
];
