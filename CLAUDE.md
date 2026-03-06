# CLAUDE.md - Portfolio Project Guidelines

## Project Overview
Next.js 16 portfolio application with Three.js 3D intro journey, section-based UI with browser-style navigation chrome.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19, Framer Motion, Tailwind CSS 3
- **3D**: Three.js, @react-three/fiber, @react-three/drei
- **Icons**: @tabler/icons-react

## Project Structure
```
app/
├── page.js              # Root page — orchestrates loader/journey/portfolio phases
├── layout.js            # Root layout
├── globals.css          # Global styles
├── sections/            # Section components (one per portfolio section)
│   ├── AboutSection.jsx
│   ├── ExperienceSection.jsx
│   ├── ProjectsSection.jsx
│   ├── SkillsSection.jsx
│   ├── BlogSection.jsx
│   └── ContactSection.jsx
├── components/          # Reusable UI components
│   ├── animation/       # 3D loader & journey (heavy — dynamically imported)
│   ├── BrowserToolbar.jsx
│   ├── BottomTabBar.jsx
│   ├── FloatingDock.jsx
│   └── ...
├── hooks/               # Custom React hooks
├── json/                # Static data (projects, blogs, about, etc.)
├── utils/               # Utility functions
└── lib/                 # Library helpers
```

## Commands
```bash
npm run dev    # Start dev server (Turbopack)
npm run build  # Production build
npm start      # Start production server
```

## Architecture Conventions
1. **Section components** in `app/sections/` — one file per portfolio section
2. **Heavy components** (Three.js) use `next/dynamic` with `{ ssr: false }`
3. **Data** lives in `app/json/` as JSON or JS data modules
4. **No inline section content** in `page.js` — delegate to section components
5. **Navigation** uses client-side state (will migrate to route-based)

## Important Notes
- The 3D journey only runs on desktop; mobile skips straight to portfolio
- First-time visitors see the 3D journey; returning visitors skip it
- `Loader.jsx` pre-builds all Three.js resources; `Journey3D.jsx` animates them
- EmailJS handles contact form (service/template IDs in ContactSection.jsx)
