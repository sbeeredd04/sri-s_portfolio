export const allChapters = [
  {
    id: "studio",
    short: "Home",
    label: "Home in San Francisco",
    number: "01",
    title: "Usually making something.",
    description:
      "Three screens, an open project, and San Francisco outside. An idea I want to see through. Come up to my little corner of San Francisco.",
    action: "What I’m working on",
    content: "journey",
    note: "Try the screens. There’s a story behind each one.",
  },
  {
    id: "projects",
    short: "Made",
    label: "The Foundry",
    number: "02",
    title: "AI tools, research, and products.",
    description:
      "Interfaces for working with AI, developer tools, and software for researchers and communities. Six selected projects, with the purpose and implementation behind each.",
    action: "Read the project stories",
    content: "work",
    note: "Each studio represents a project. Open its story to see what it does and how I contributed.",
  },
  {
    id: "entertainment",
    short: "After hours",
    label: "After hours",
    number: "03",
    title: "The background to everything.",
    description:
      "Fred again.., Tollywood, and a sitcom I’ve seen before. Sometimes I make the music, too.",
    action: "What’s on repeat",
    content: "music",
    note: "A listening room, a comfort channel, and no hurry.",
  },
  {
    id: "court",
    short: "After hours",
    label: "After hours",
    number: "03",
    title: "I’m in for one more.",
    description:
      "A game with friends, a record on, a familiar episode. Badminton, volleyball and basketball share an island with the slower side of my evenings.",
    action: "Life outside work",
    content: "about",
    note: "Three courts, three ways to play. Pick a court and join in.",
  },
  {
    id: "trail",
    short: "Out there",
    label: "A little further out",
    number: "04",
    title: "Take the scenic route.",
    description:
      "New cities. A good hike. Photography along the way. And one day, a trip through the California places that gave macOS its names.",
    action: "On foot, through my lens",
    content: "notes",
    note: "Sequoia, Sonoma, Catalina. Still on the list.",
  },
  {
    id: "future",
    short: "Fieldnotes",
    label: "Fieldnotes",
    number: "05",
    title: "Good things start with a hello.",
    description:
      "Notes on building AI systems, the places I share my work, and a place to start a conversation.",
    action: "Find me elsewhere",
    content: "socials",
    note: "Pull up a chair. Bring an idea.",
  },
];

export const chapters = allChapters.filter((c) => c.id !== "entertainment");

export const readingSections = [
  {
    id: "work",
    name: "Projects & ideas",
    caption: "AI tools, research software, and collaborative projects — their purpose, implementation, and my contribution.",
  },
  {
    id: "journey",
    name: "Experience",
    caption: "Offseason, research, ASU, and the people along the way.",
  },
  {
    id: "about",
    name: "About Sri",
    caption: "A curious builder. A person beyond the work.",
  },
  {
    id: "skills",
    name: "The toolkit",
    caption: "The tools I use to make an idea real.",
  },
  {
    id: "music",
    name: "On repeat",
    caption: "Music I make, music I love, and familiar shows.",
  },
  {
    id: "notes",
    name: "The outdoor journal",
    caption: "Hikes, city walks, and the world through my lens.",
  },
  {
    id: "writing",
    name: "The writing room",
    caption: "Notes on AI engineering, agents, and the work around models.",
  },
  {
    id: "socials",
    name: "Around the internet",
    caption: "My social spaces, public work, and ways to connect.",
  },
  {
    id: "contact",
    name: "Say hello",
    caption: "An idea, a collaboration, or a good conversation.",
  },
  {
    id: "discoveries",
    name: "Little discoveries",
    caption: "A tiny terminal, hidden corners, and your collection.",
  },
];
