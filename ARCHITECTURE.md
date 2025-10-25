# Sri's Portfolio - Architecture Documentation

## 📋 Overview
This is a modern, interactive Next.js-based portfolio website featuring AI chat, timeline visualizations, dynamic content management, and project showcases.

**Live Site:** https://sriujjwalreddy.com/  
**Repository:** https://github.com/sbeeredd04/sri-s_portfolio

---

## 🏗️ Technology Stack

### Core Technologies
- **Framework:** Next.js 15.0.2 (React 18.0.0)
- **Styling:** Tailwind CSS 3.4.1
- **Animations:** Framer Motion 6.5.1, Motion 12.6.3
- **3D Graphics:** Three.js 0.177.0
- **State Management:** React Hooks

### Key Dependencies
- **AI/ML:** @google/genai (Gemini AI)
- **Database:** @pinecone-database/pinecone
- **UI Components:** @tabler/icons-react, @tsparticles
- **Email:** @emailjs/browser
- **Analytics:** @vercel/analytics, @vercel/speed-insights
- **Rendering:** react-markdown, katex, remark-gfm

---

## 📁 Project Structure

```
sri_portfolio/sri_portfolio/
├── app/                          # Next.js app directory
│   ├── components/               # React components
│   │   ├── animation/           # Animation components
│   │   │   ├── Journey3D.jsx    # 3D journey intro
│   │   │   ├── Loader.jsx       # Loading screen
│   │   │   └── DecryptedText.jsx # Text animations
│   │   ├── background/          # Background effects
│   │   │   └── Beams.jsx        # Background beam effects
│   │   ├── 3d-pin.jsx           # 3D pin effect
│   │   ├── apple-cards-carousel.jsx # Carousel component
│   │   ├── bento-grid.jsx       # Bento grid layout
│   │   ├── BlogCardFeature.jsx  # Blog card display
│   │   ├── canvas-reveal-effect.jsx # Canvas effects
│   │   ├── card-spotlight.jsx   # Spotlight card effect
│   │   ├── ChatInterface.jsx    # Chat functionality (TO BE REMOVED)
│   │   ├── cover.jsx            # Cover component
│   │   ├── ExpandableCard.jsx   # Expandable card
│   │   ├── FeaturingSection.js  # Home page featuring section
│   │   ├── FirstVisitTutorial.jsx # Tutorial overlay
│   │   ├── FloatingDock.jsx     # Navigation dock
│   │   ├── GameSkillsView.jsx   # Skills visualization
│   │   ├── GitHubStatsView.jsx  # GitHub statistics
│   │   ├── glowing-effect.jsx   # Glowing effects
│   │   ├── infinite-moving-cards.jsx # Infinite scroll
│   │   ├── MarkdownRenderer.jsx # Markdown renderer (chat-related)
│   │   ├── MusicProvider.jsx    # Music context provider
│   │   ├── NavigationCard.jsx   # Navigation cards
│   │   ├── ProfileCard.jsx      # Profile display
│   │   ├── ProjectCard.jsx      # Project cards
│   │   ├── ProjectCardFeature.jsx # Featured projects
│   │   ├── SkillGameStats.jsx   # Skill statistics
│   │   ├── SkillsDetail.jsx     # Detailed skills view
│   │   ├── SkillsRadar.jsx      # Skills radar chart
│   │   ├── SoundProvider.jsx    # Sound effects provider
│   │   ├── SpotifyPlayer.jsx    # Spotify integration
│   │   ├── sparkles.jsx         # Sparkle effects
│   │   ├── sticky-scroll-reveal.jsx # Sticky scroll
│   │   ├── tracing-beam.jsx     # Timeline beam effect
│   │   └── TutorialOverlay.jsx  # Tutorial component
│   ├── hooks/                   # Custom React hooks
│   │   └── use-outside-click.jsx # Outside click detection
│   ├── api/                     # API routes
│   │   ├── chat/                # Chat API (TO BE REMOVED)
│   │   │   └── route.js
│   │   └── pinecone/            # Pinecone API (TO BE REMOVED)
│   │       └── route.js
│   ├── json/                    # Static data files
│   │   ├── aboutme.json         # About me content
│   │   ├── blogs.json           # Blog posts
│   │   ├── deployed.json        # Deployed projects
│   │   ├── features.json        # Featured content
│   │   ├── projects.json        # All projects
│   │   ├── skillsData.js        # Skills data
│   │   └── slides.json          # Slide content
│   ├── lib/                     # Utility libraries
│   │   └── utils.js             # Utility functions
│   ├── utils/                   # Utility functions (chat-related, TO BE REMOVED)
│   │   ├── embeddings.js        # Embeddings (chat)
│   │   ├── gemini.js            # Gemini AI (chat)
│   │   ├── markdown.js          # Markdown utils (chat)
│   │   ├── markdownHelper.js    # Markdown helper (chat)
│   │   ├── pinecone.js          # Pinecone DB (chat)
│   │   └── sampleMarkdown.js    # Sample markdown (chat)
│   ├── AcheivementTimeline.js   # Achievements timeline
│   ├── globals.css              # Global styles
│   ├── initialize-embeddings.js # Initialize embeddings (chat)
│   ├── layout.js                # Root layout
│   ├── page.js                  # Main page component
│   ├── test-sound.js            # Sound testing
│   └── timeline.js              # Experience timeline
├── data/                        # Data directory
├── public/                      # Static assets
│   ├── background/              # Background images
│   ├── music/                   # Music files
│   ├── projects/                # Project images
│   └── ...                      # Other assets
├── jsconfig.json                # JavaScript config
├── next.config.js               # Next.js configuration
├── next.config.mjs              # Next.js ES module config
├── package.json                 # Dependencies
├── postcss.config.mjs           # PostCSS config
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript config
└── vercel.json                  # Vercel deployment config
```

---

## 🔄 Data Flow

### 1. Application Initialization
```
User visits site
    ↓
Loader.jsx (preload resources)
    ↓
Journey3D.jsx (first-time visitors only)
    ↓
Main Portfolio (page.js)
```

### 2. Navigation Flow
```
FloatingDock (navigation)
    ↓
navigateToSection(section)
    ↓
Update activeSection state
    ↓
AnimatePresence renders section content
```

### 3. Content Sections
- **Home:** FeaturingSection with Bento Grid
- **About:** Profile, Education, Hobbies, Side Quests
- **Experience:** Timeline with work history
- **Projects:** Bento Grid of all/deployed projects
- **Skills:** Game view or GitHub analytics
- **Blog:** Expandable cards carousel
- **Chat:** ChatInterface (TO BE REMOVED)
- **Contact:** Contact form with EmailJS

### 4. State Management
```javascript
// Main page.js state
- activeSection: current navigation section
- activeTab: tab within section
- showResumePreview: resume modal visibility
- showPlayer: Spotify player visibility
- isSoundEnabled: sound effects toggle
- navigationHistory: browser-like history
- currentBackground: background theme
```

---

## 🎨 Component Relationships

### Core Layout Hierarchy
```
page.js (Main Component)
├── Loader (initial)
├── Journey3D (first visit)
├── Main Portfolio Layout
│   ├── FloatingDock (navigation)
│   ├── Browser Toolbar
│   │   ├── Navigation controls (back/forward)
│   │   ├── Search/URL bar
│   │   └── Controls (sound, Spotify, theme)
│   ├── Main Content Area
│   │   ├── Home → FeaturingSection
│   │   ├── About → StickyScroll / Education
│   │   ├── Experience → TimelineDemo / AchievementTimelineDemo
│   │   ├── Projects → BentoGrid
│   │   ├── Skills → GameSkillsView / GitHubStatsView
│   │   ├── Blog → ExCarousel
│   │   ├── Chat → ChatInterface (TO BE REMOVED)
│   │   └── Contact → Contact Form
│   └── Bottom Tabs (section-specific tabs)
├── SpotifyPlayer (floating)
└── FirstVisitTutorial (overlay)
```

### Reusable Components
- **BentoGrid:** Used in Projects section
- **NavigationCard:** Used in FeaturingSection
- **ProjectCardFeature:** Featured project displays
- **Timeline Components:** TracingBeam for experiences
- **Animation Components:** Journey3D, Loader, DecryptedText

---

## 🔌 API Routes (TO BE REMOVED)

### /api/chat/route.js
- Handles chat messages
- Integrates with Gemini AI
- Manages conversation history
- **Status:** TO BE DEPRECATED

### /api/pinecone/route.js
- Vector database operations
- Embedding storage/retrieval
- **Status:** TO BE DEPRECATED

---

## 📊 Data Files

### features.json
Maps content to Bento Grid boxes on home page:
- Navigation items (id: 3, 4, 8, 9, 11, 14, 15)
- Project showcases (id: 2, 5, 6, 10, 13, 16)
- Blog posts (id: 7, 12)

### projects.json
All projects with:
- Title, description, technologies
- Images, videos, YouTube links
- GitHub and live URLs
- Detailed markdown content

### deployed.json
Subset of projects that are deployed/live

### skillsData.js
- Radar chart skills
- Detailed skill categories
- Game-style statistics
- Achievements

---

## 🎯 Key Features

### 1. Browser-Like Interface
- Back/forward navigation history
- URL bar showing current section
- Theme switcher
- Sound effects toggle
- Spotify player integration

### 2. Interactive Elements
- 3D journey introduction
- Glowing effects and animations
- Responsive Bento Grid layout
- Expandable cards
- Smooth section transitions

### 3. Content Sections
- **Profile:** Sticky scroll with about me
- **Experience:** Interactive timeline with company info
- **Projects:** Grid layout with hover effects
- **Skills:** Game-style visualization + GitHub stats
- **Blog:** Carousel with markdown rendering
- **Contact:** EmailJS integration

### 4. First Visit Experience
- Tutorial overlay
- 3D journey animation
- localStorage tracking

---

## 🔐 Security & Performance

### Security Best Practices
- Environment variables for sensitive data
- Sandboxed iframes for external content
- CORS and CSP headers
- Input validation and sanitization

### Performance Optimizations
- Next.js image optimization
- Lazy loading components
- Preloading critical resources
- Code splitting
- Analytics and speed insights

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Desktop: ≥ 768px

### Mobile-Specific Features
- Floating dock at bottom
- Condensed navigation
- Mobile connections toolbar
- Responsive grid layouts
- Touch-optimized interactions

---

## 🚀 Deployment

### Platform
Vercel (Next.js native deployment)

### Build Process
```bash
npm run build    # Production build
npm run dev      # Development server
npm run start    # Production server
```

### Environment Variables
- NEXT_PUBLIC_VERCEL_URL
- NEXT_PUBLIC_NETWORK_URL
- API keys for Gemini, Pinecone, EmailJS

---

## 🔧 Configuration Files

### next.config.js
- Custom webpack config
- Image optimization
- API routes configuration

### tailwind.config.js
- Custom colors and themes
- Animation configurations
- Responsive breakpoints

### vercel.json
- Deployment settings
- Environment variables
- Build configuration

---

## 📝 Major Workflows

### 1. User Navigation
```
User clicks FloatingDock item
    ↓
navigateToSection() called
    ↓
Update activeSection state
    ↓
Add to navigation history
    ↓
AnimatePresence transitions
    ↓
New section rendered
```

### 2. Project Display (Bento Grid)
```
Load features.json
    ↓
Map projects to grid boxes
    ↓
Render ProjectCardFeature
    ↓
Display with hover effects
    ↓
Click → navigate to project page
```

### 3. Chat Interaction (TO BE REMOVED)
```
User sends message
    ↓
API call to /api/chat
    ↓
Gemini AI processes
    ↓
Pinecone retrieves context
    ↓
Stream response back
    ↓
Display in ChatInterface
```

---

## 🐛 Known Issues

### To Be Fixed
1. Scrolling issue in Experience/Achievements sections
2. Chat functionality to be fully removed
3. Placeholder videos to be replaced with live iframes

### Planned Enhancements
1. Add live project previews via iframes
2. Remove all chat-related code
3. Improve scrolling in timeline sections
4. Clean up unused dependencies
5. Enhanced documentation

---

## 📚 Dependencies to Review

### Chat-Related (TO BE REMOVED)
- @google/genai
- @pinecone-database/pinecone
- react-markdown
- react-syntax-highlighter
- rehype-katex
- rehype-raw
- remark-gfm
- remark-math

### Essential
- next
- react
- react-dom
- framer-motion
- @tabler/icons-react
- @emailjs/browser
- three
- tailwind-merge

---

## 🎓 Learning Resources

### Key Concepts
- Next.js App Router
- React Server Components
- Framer Motion animations
- Three.js 3D graphics
- Tailwind CSS utilities

### Documentation Links
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Framer Motion](https://www.framer.com/motion/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Contact & Support

For questions or contributions:
- **Email:** srisubspace@gmail.com
- **GitHub:** https://github.com/sbeeredd04
- **LinkedIn:** https://www.linkedin.com/in/sriujjwal/

---

*Last Updated: October 2024*
*Version: 0.1.0*
