"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconStar,
  IconUser,
  IconSchool,
  IconHeart,
  IconFlame,
  IconBriefcase,
  IconTrophy,
  IconBulb,
  IconRocket,
  IconTools,
  IconBrandGithub,
  IconBook,
  IconMail,
} from "@tabler/icons-react";
import Image from "next/image";

// Flat app list — all together, no group dividers
const ALL_APPS = [
  { section: "featured",    label: "Featured",     icon: IconStar,         gradient: "from-cyan-500/30 to-sky-500/30",         color: "#06b6d4",  bg: "rgba(6,182,212,0.18)" },
  { section: "blog",        label: "Blog",         icon: IconBook,         gradient: "from-rose-500/30 to-red-500/30",         color: "#f43f5e",  bg: "rgba(244,63,94,0.18)" },
  { section: "contact",     label: "Contact",      icon: IconMail,         gradient: "from-indigo-500/30 to-violet-500/30",    color: "#6366f1",  bg: "rgba(99,102,241,0.18)" },
  { section: "about",       tab: "profile",        label: "Profile",       icon: IconUser,         gradient: "from-blue-500/30 to-cyan-500/30",        color: "#2fb8ff",  bg: "rgba(47,184,255,0.18)" },
  { section: "about",       tab: "education",      label: "Education",     icon: IconSchool,       gradient: "from-sky-500/30 to-blue-500/30",         color: "#38bdf8",  bg: "rgba(56,189,248,0.18)" },
  { section: "about",       tab: "hobbies",        label: "Hobbies",       icon: IconHeart,        gradient: "from-pink-500/30 to-rose-500/30",        color: "#ec4899",  bg: "rgba(236,72,153,0.18)" },
  { section: "about",       tab: "side-quests",    label: "Side Quests",   icon: IconFlame,        gradient: "from-orange-500/30 to-amber-500/30",     color: "#f97316",  bg: "rgba(249,115,22,0.18)" },
  { section: "experience",  tab: "experience",     label: "Experience",    icon: IconBriefcase,    gradient: "from-purple-500/30 to-pink-500/30",      color: "#a855f7",  bg: "rgba(168,85,247,0.18)" },
  { section: "experience",  tab: "achievements",   label: "Achievements",  icon: IconTrophy,       gradient: "from-yellow-500/30 to-amber-500/30",     color: "#eab308",  bg: "rgba(234,179,8,0.18)" },
  { section: "projects",    tab: "all",            label: "All Projects",  icon: IconBulb,         gradient: "from-amber-500/30 to-orange-500/30",     color: "#f59e0b",  bg: "rgba(245,158,11,0.18)" },
  { section: "projects",    tab: "deployed",       label: "Deployed",      icon: IconRocket,       gradient: "from-orange-500/30 to-red-500/30",       color: "#f97316",  bg: "rgba(249,115,22,0.18)" },
  { section: "skills",      skillsTab: "overview", label: "Skill Map",     icon: IconTools,        gradient: "from-emerald-500/30 to-teal-500/30",     color: "#10b981",  bg: "rgba(16,185,129,0.18)" },
  { section: "skills",      skillsTab: "github",   label: "GitHub",        icon: IconBrandGithub,  gradient: "from-neutral-500/30 to-slate-500/30",    color: "#94a3b8",  bg: "rgba(148,163,184,0.18)" },
];

// ── Desktop: visionOS honeycomb layout (4-5-4 rows) ──
const ROW_PATTERN = [4, 5, 4];
const ICON = 76;
const GAP_H = 36;
const GAP_V = 32;
const CELL_W = ICON + GAP_H;
const CELL_H = ICON + 26 + GAP_V;

function buildRows(apps) {
  const rows = [];
  let cursor = 0;
  let pi = 0;
  while (cursor < apps.length) {
    const count = Math.min(ROW_PATTERN[pi % ROW_PATTERN.length], apps.length - cursor);
    rows.push(apps.slice(cursor, cursor + count));
    cursor += count;
    pi++;
  }
  return rows;
}

const rowWidth = (n) => n * CELL_W - GAP_H;

// ── 3D Parallax Icon (Desktop) — layered depth with cursor-tracking tilt ──
function DesktopAppIcon({ app, globalIndex, x, y, navigateToSection, navigateToSectionWithTab }) {
  const iconRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dx * 8, y: dy * -8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleClick = () => {
    if (app.tab) {
      navigateToSectionWithTab(app.section, app.tab);
    } else if (app.skillsTab) {
      navigateToSectionWithTab(app.section, app.skillsTab);
    } else {
      navigateToSection(app.section);
    }
  };

  return (
    <motion.button
      ref={iconRef}
      className="flex flex-col items-center gap-[6px] group absolute"
      style={{
        left: x,
        top: y,
        width: ICON,
        perspective: 400,
      }}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.06 + globalIndex * 0.035,
      }}
      whileTap={{ scale: 0.88 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 3D layered icon container */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: ICON,
          height: ICON,
          transformStyle: "preserve-3d",
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: isHovered ? "transform 0.08s ease-out" : "transform 0.4s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {/* Shadow / glow layer behind — parallax offset from cursor */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: app.bg,
            transform: `translateZ(-12px) translateX(${tilt.x * 1.5}px) translateY(${-tilt.y * 1.5}px)`,
            filter: isHovered ? "blur(14px) brightness(1.3)" : "blur(8px)",
            opacity: isHovered ? 0.85 : 0,
            transition: "all 0.3s ease",
          }}
        />

        {/* Base glass layer */}
        <div
          className={`absolute inset-0 glass-icon bg-gradient-to-br ${app.gradient}`}
          style={{ transform: "translateZ(-4px)" }}
        />

        {/* Icon foreground layer — lifts on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: isHovered ? "translateZ(14px)" : "translateZ(0px)",
            transition: isHovered ? "transform 0.12s ease-out" : "transform 0.35s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        >
          <app.icon
            size={26}
            stroke={1.4}
            className="relative z-10"
            style={{
              color: isHovered ? app.color : "rgba(255,255,255,0.9)",
              filter: isHovered ? `drop-shadow(0 2px 8px ${app.color}66)` : "none",
              transition: "color 0.2s, filter 0.2s",
            }}
          />
        </div>
      </div>

      <span className="text-white/60 text-[10px] font-medium group-hover:text-white/90 transition-colors duration-200 tracking-tight text-center leading-tight w-full">
        {app.label}
      </span>
    </motion.button>
  );
}

// ── Mobile: iPhone-style squircle icon ──
function MobileAppIcon({ app, index, navigateToSection, navigateToSectionWithTab }) {
  const handleClick = () => {
    if (app.tab) {
      navigateToSectionWithTab(app.section, app.tab);
    } else if (app.skillsTab) {
      navigateToSectionWithTab(app.section, app.skillsTab);
    } else {
      navigateToSection(app.section);
    }
  };

  return (
    <motion.button
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
        delay: 0.04 + index * 0.025,
      }}
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: `linear-gradient(145deg, ${app.color}30 0%, ${app.color}14 100%)`,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 3px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* iOS glossy highlight */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "44%",
            borderRadius: "14px 14px 0 0",
            background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        <app.icon size={24} stroke={1.5} style={{ color: app.color }} className="relative z-10" />
      </div>
      <span className="text-white/65 text-[10px] font-medium tracking-tight text-center leading-tight max-w-[62px] truncate">
        {app.label}
      </span>
    </motion.button>
  );
}

export default function HomeSection({ navigateToSection, navigateToSectionWithTab }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Mobile View: iPhone-style 4-column grid ──
  if (isMobile) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center px-5 pb-4 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Profile Card - compact */}
        <motion.div
          className="flex items-center gap-3 px-4 py-3 mb-6 cursor-pointer w-full max-w-[300px]"
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateToSectionWithTab("about", "profile")}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
            <Image src="/music/mySong.png" alt="Sri Ujjwal Reddy" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold tracking-tight">Sri Ujjwal Reddy</h1>
            <p className="text-white/45 text-[11px] font-medium">Software Engineer</p>
          </div>
        </motion.div>

        {/* iPhone 4-column grid */}
        <div className="grid grid-cols-4 gap-x-5 gap-y-5 w-fit mx-auto">
          {ALL_APPS.map((app, i) => (
            <MobileAppIcon
              key={`${app.section}-${app.tab || app.skillsTab || ""}`}
              app={app}
              index={i}
              navigateToSection={navigateToSection}
              navigateToSectionWithTab={navigateToSectionWithTab}
            />
          ))}
        </div>

        {/* Page indicator dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>
    );
  }

  // ── Desktop View: visionOS honeycomb with 3D parallax icons ──
  const rows = buildRows(ALL_APPS);
  const containerW = rowWidth(5);
  const containerH = rows.length * CELL_H - GAP_V;
  let globalIndex = 0;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Profile Card */}
      <motion.div
        className="glass-light flex items-center gap-4 px-6 py-4 mb-10 cursor-pointer w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigateToSectionWithTab("about", "profile")}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
          <Image src="/music/mySong.png" alt="Sri Ujjwal Reddy" width={48} height={48} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-white text-base font-bold tracking-tight">Sri Ujjwal Reddy</h1>
          <p className="text-white/50 text-xs font-medium">Software Engineer & Developer</p>
        </div>
      </motion.div>

      {/* Honeycomb app grid */}
      <div className="relative flex-shrink-0" style={{ width: containerW, height: containerH }}>
        {rows.map((rowApps, rowIdx) => {
          const rw = rowWidth(rowApps.length);
          const rowXOffset = (containerW - rw) / 2;
          const rowYOffset = rowIdx * CELL_H;

          return rowApps.map((app, colIdx) => {
            const x = rowXOffset + colIdx * CELL_W;
            const y = rowYOffset;
            const gi = globalIndex++;
            return (
              <DesktopAppIcon
                key={`${app.section}-${app.tab || app.skillsTab || ""}`}
                app={app}
                globalIndex={gi}
                x={x}
                y={y}
                navigateToSection={navigateToSection}
                navigateToSectionWithTab={navigateToSectionWithTab}
              />
            );
          });
        })}
      </div>

      {/* Hint */}
      <motion.p
        className="text-white/15 text-[10px] mt-8 mb-4 font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        Tap an app to explore
      </motion.p>
    </div>
  );
}
