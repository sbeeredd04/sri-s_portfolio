"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
    IconHome,
    IconUser,
    IconBriefcase,
    IconBook,
    IconMail,
    IconTools,
    IconBulb,
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandSpotify,
    IconLayoutGrid,
    IconStar,
} from "@tabler/icons-react";
import { FloatingDock } from "../components/FloatingDock";
import { SpotifyPlayer } from "../components/SpotifyPlayer";
import { useMusic } from "../components/MusicProvider";
import { useSound } from "../components/SoundProvider";
import ControlStrip from "../components/ControlStrip";
import SectionWindow from "../components/SectionWindow";
import BottomTabBar from "../components/BottomTabBar";
import StageManager from "../components/StageManager";
import { isMobileDevice } from "../utils/deviceDetection";
import { preloadWallpapers } from "../config/wallpapers";

// Section components
import HomeSection from "../sections/HomeSection";
import AboutSection from "../sections/AboutSection";
import ExperienceSection from "../sections/ExperienceSection";
import ProjectsSection from "../sections/ProjectsSection";
import SkillsSection from "../sections/SkillsSection";
import BlogSection from "../sections/BlogSection";
import ContactSection from "../sections/ContactSection";
import { FeaturingSection } from "../components/FeaturingSection";

// Dynamic imports for heavy 3D components (latency fix)
const Loader = dynamic(() => import("../components/animation/Loader"), { ssr: false });
const Journey3D = dynamic(() => import("../components/animation/Journey3D"), { ssr: false });

const SECTION_TITLES = {
    "home": "Home",
    "featured": "Featured",
    "about": "About Me",
    "experience": "Experience",
    "projects": "Projects",
    "skills": "Skills",
    "blog": "Blog",
    "contact": "Contact",
};

export default function PortfolioShell({ initialSection = "home" }) {
    // ── Core Navigation State ──
    const [activeSection, setActiveSection] = useState(initialSection);
    const [activeTab, setActiveTab] = useState("profile");
    // activeTimeline kept for potential future use
    const [activeTimeline] = useState("experience");
    const [isMobile, setIsMobile] = useState(false);
    const [isActuallyMobile, setIsActuallyMobile] = useState(false);
    const [skillsActiveTab, setSkillsActiveTab] = useState("github");
    const [currentBackground, setCurrentBackground] = useState("/background/mojave-night.jpg");

    // ── Navigation History ──
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
    const [minimizedSections, setMinimizedSections] = useState([]);
    const [transitionSource, setTransitionSource] = useState("default");

    // ── Loader/Journey State ──
    const [showLoader, setShowLoader] = useState(true);
    const [showJourney, setShowJourney] = useState(false);
    const [showMainPortfolio, setShowMainPortfolio] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [preloadedResources, setPreloadedResources] = useState(null);
    const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);

    // ── Provider Hooks ──
    const { showPlayer, togglePlayerVisibility } = useMusic();
    const { isSoundEnabled, toggleSound, playClickSound } = useSound();

    // ── Responsive Detection ──
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ── Initialize: detect mobile & skip loader for returning visitors ──
    useEffect(() => {
        // Start preloading wallpapers immediately
        preloadWallpapers();
        
        const mobile = isMobileDevice();
        setIsActuallyMobile(mobile);

        let shouldSkipLoader = mobile;
        try {
            const hasCompletedJourney = localStorage.getItem('portfolio_journey_completed') === 'true';
            if (hasCompletedJourney) {
                shouldSkipLoader = true;
                setIsFirstTimeVisitor(false);
            } else {
                setIsFirstTimeVisitor(!mobile);
            }
        } catch {
            setIsFirstTimeVisitor(!mobile);
        }

        if (shouldSkipLoader) {
            setShowLoader(false);
            setShowJourney(false);
            setShowMainPortfolio(true);
        }
    }, []);

    // ── Click Sound Effect — delegated via capture phase for efficiency ──
    useEffect(() => {
        if (!isSoundEnabled || typeof playClickSound !== 'function') return;
        const handleClickSound = () => playClickSound();
        document.body.addEventListener('click', handleClickSound, { passive: true });
        return () => document.body.removeEventListener('click', handleClickSound);
    }, [isSoundEnabled, playClickSound]);

    // ── Preload project images lazily ──
    useEffect(() => {
        if (activeSection !== "projects") return;
        const preload = async () => {
            const [{ default: projects }, { default: deployed }] = await Promise.all([
                import("../json/projects.json"),
                import("../json/deployed.json")
            ]);
            [...projects, ...deployed].forEach(project => {
                if (project.image) {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.as = 'image';
                    link.href = project.image.startsWith('/') ? project.image : `/${project.image}`;
                    document.head.appendChild(link);
                }
            });
        };
        preload();
    }, [activeSection]);

    // ── Preload wallpaper images when portfolio shows ──
    useEffect(() => {
        if (showMainPortfolio) {
            preloadWallpapers();
        }
    }, [showMainPortfolio]);

    // ── Navigation Functions ──
    // ── Navigation: general section switch (dock, home grid, etc.) ──
    const navigateToSection = useCallback((section, addToHistory = true) => {
        // When navigating away from an open section, it goes to Stage Manager
        setMinimizedSections(prev => {
            let next = [...prev];
            if (activeSection !== "home" && activeSection !== section) {
                next = next.filter(s => s !== activeSection);
                next = [activeSection, ...next];
            }
            // Remove target from minimized (we're opening it)
            next = next.filter(s => s !== section);
            return next;
        });
        setTransitionSource("default");
        setActiveSection(section);
        switch (section) {
            case "experience": setActiveTab("experience"); break;
            case "about": setActiveTab("profile"); break;
            case "projects": setActiveTab("all"); break;
            default: break;
        }
        if (addToHistory) {
            const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), section];
            setNavigationHistory(newHistory);
            setCurrentHistoryIndex(newHistory.length - 1);
        }
    }, [navigationHistory, currentHistoryIndex, activeSection]);

    // ── Close (red button): remove from Stage Manager, go home ──
    const handleClose = useCallback(() => {
        setMinimizedSections(prev => prev.filter(s => s !== activeSection));
        setTransitionSource("default");
        setActiveSection("home");
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), "home"];
        setNavigationHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [activeSection, navigationHistory, currentHistoryIndex]);

    // ── Minimize (yellow button): add to Stage Manager, go home ──
    const handleMinimize = useCallback(() => {
        setMinimizedSections(prev => {
            const next = prev.filter(s => s !== activeSection);
            return [activeSection, ...next];
        });
        setTransitionSource("default");
        setActiveSection("home");
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), "home"];
        setNavigationHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [activeSection, navigationHistory, currentHistoryIndex]);

    // ── Stage Manager select: expand thumbnail, current window goes to SM ──
    const handleStageManagerSelect = useCallback((section) => {
        setMinimizedSections(prev => {
            let next = [...prev];
            // Current section goes to Stage Manager (if not home)
            if (activeSection !== "home" && activeSection !== section) {
                next = next.filter(s => s !== activeSection);
                next = [activeSection, ...next];
            }
            // Remove selected from Stage Manager (it's being opened)
            next = next.filter(s => s !== section);
            return next;
        });
        setTransitionSource("stage-manager");
        setActiveSection(section);
        switch (section) {
            case "experience": setActiveTab("experience"); break;
            case "about": setActiveTab("profile"); break;
            case "projects": setActiveTab("all"); break;
            default: break;
        }
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), section];
        setNavigationHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [activeSection, navigationHistory, currentHistoryIndex]);

    // ── Navigate to a section and set a specific sub-tab (for app shortcuts) ──
    const navigateToSectionWithTab = useCallback((section, tab) => {
        setMinimizedSections(prev => {
            let next = [...prev];
            if (activeSection !== "home" && activeSection !== section) {
                next = next.filter(s => s !== activeSection);
                next = [activeSection, ...next];
            }
            next = next.filter(s => s !== section);
            return next;
        });
        setTransitionSource("default");
        setActiveSection(section);
        if (section === "skills") {
            setSkillsActiveTab(tab);
        } else {
            setActiveTab(tab);
        }
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), section];
        setNavigationHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [navigationHistory, currentHistoryIndex, activeSection]);

    // ── Render preview content for Stage Manager thumbnails ──
    const renderPreview = useCallback((section) => {
        switch (section) {
            case "featured": return <FeaturingSection navigateToSection={() => {}} />;
            case "about": return <AboutSection activeTab="profile" />;
            case "experience": return <ExperienceSection activeTab="experience" />;
            case "projects": return <ProjectsSection activeTab="all" isMobile={false} />;
            case "skills": return <SkillsSection skillsActiveTab="github" />;
            case "blog": return <BlogSection />;
            case "contact": return <ContactSection />;
            default: return null;
        }
    }, []);

    const goBack = useCallback(() => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(currentHistoryIndex - 1);
            navigateToSection(navigationHistory[currentHistoryIndex - 1], false);
        }
    }, [currentHistoryIndex, navigationHistory, navigateToSection]);

    const goForward = useCallback(() => {
        if (currentHistoryIndex < navigationHistory.length - 1) {
            setCurrentHistoryIndex(currentHistoryIndex + 1);
            navigateToSection(navigationHistory[currentHistoryIndex + 1], false);
        }
    }, [currentHistoryIndex, navigationHistory, navigateToSection]);

    // ── Initialize Navigation History ──
    useEffect(() => {
        if (showMainPortfolio && navigationHistory.length === 0) {
            setNavigationHistory([activeSection]);
            setCurrentHistoryIndex(0);
        }
    }, [showMainPortfolio, navigationHistory.length, activeSection]);

    // First-time visitor check is now handled in the initialization effect above

    // ── Journey Handlers ──
    const handleManualJourney = useCallback(() => {
        if (isActuallyMobile) return;
        setShowMainPortfolio(false);
        setShowJourney(true);
        setIsTransitioning(false);
    }, [isActuallyMobile]);

    const handleResourcesReady = useCallback((resources) => {
        setPreloadedResources(resources);
    }, []);

    const handleLoaderComplete = useCallback(() => {
        setIsTransitioning(true);
        setShowLoader(false);
        setTimeout(() => {
            if (isActuallyMobile || !isFirstTimeVisitor) {
                setShowMainPortfolio(true);
            } else {
                setShowJourney(true);
            }
            setIsTransitioning(false);
        }, 100);
    }, [isActuallyMobile, isFirstTimeVisitor]);

    const handleJourneyComplete = useCallback(() => {
        setIsTransitioning(true);
        setShowJourney(false);
        try {
            localStorage.setItem('portfolio_journey_completed', 'true');
            setIsFirstTimeVisitor(false);
        } catch { }
        setTimeout(() => {
            setShowMainPortfolio(true);
            setIsTransitioning(false);
        }, 1000);
    }, []);

    // Mobile loader skip is now handled in the initialization effect above

    // ── Navigation Dock Items ──
    const items = [
        { title: "Home", icon: <IconStar />, onClick: () => navigateToSection("featured"), href: "#", isActive: activeSection === "featured" },
        { title: "Apps", icon: <IconLayoutGrid />, onClick: () => navigateToSection("home"), href: "#", isActive: activeSection === "home" },
        { title: "About Me", icon: <IconUser />, onClick: () => navigateToSection("about"), href: "#", isActive: activeSection === "about" },
        { title: "Experience", icon: <IconBriefcase />, onClick: () => navigateToSection("experience"), href: "#", isActive: activeSection === "experience" },
        { title: "Projects", icon: <IconBulb />, onClick: () => navigateToSection("projects"), href: "#", isActive: activeSection === "projects" },
        { title: "Skills", icon: <IconTools />, onClick: () => navigateToSection("skills"), href: "#", isActive: activeSection === "skills" },
        { title: "Blog", icon: <IconBook />, onClick: () => navigateToSection("blog"), href: "#", isActive: activeSection === "blog" },
        { title: "Contact", icon: <IconMail />, onClick: () => navigateToSection("contact"), href: "#", isActive: activeSection === "contact" },
    ];

    // ═══════════════════════════════════════════════════════════════════
    // RENDER PHASES: Loader → Journey → Main Portfolio
    // ═══════════════════════════════════════════════════════════════════

    if (showLoader) {
        if (isActuallyMobile) {
            return (
                <div className="fixed inset-0 bg-black flex items-center justify-center">
                    <motion.div
                        className="text-white/60 text-sm font-medium tracking-wider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Loading...
                    </motion.div>
                </div>
            );
        }
        return <Loader onComplete={handleLoaderComplete} onResourcesReady={handleResourcesReady} />;
    }

    if (showJourney && !isActuallyMobile) {
        return <Journey3D onComplete={handleJourneyComplete} preloadedResources={preloadedResources} />;
    }

    if (!showMainPortfolio) {
        return (
            <motion.div
                className="fixed inset-0 bg-black flex items-center justify-center"
                initial={{ opacity: 1 }}
                animate={{ opacity: isTransitioning ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                <motion.div
                    className="text-white/80 text-lg major-mono-display-regular tracking-widest"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    Entering Portfolio...
                </motion.div>
            </motion.div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // MAIN PORTFOLIO LAYOUT — visionOS Style
    // ═══════════════════════════════════════════════════════════════════

    const isHome = activeSection === "home";
    const hasStageManager = !isMobile && minimizedSections.some(s => s !== "home" && s !== activeSection);

    return (
        <motion.div
            className="h-screen w-screen overflow-hidden relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
        >
            {/* Full-bleed wallpaper background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                style={{ backgroundImage: `url(${currentBackground})` }}
            />
            {/* Subtle dark overlay for readability */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Control Strip — top right */}
            <ControlStrip
                isSoundEnabled={isSoundEnabled}
                toggleSound={toggleSound}
                showPlayer={showPlayer}
                togglePlayerVisibility={togglePlayerVisibility}
                isActuallyMobile={isActuallyMobile}
                onManualJourney={handleManualJourney}
                currentBackground={currentBackground}
                setCurrentBackground={setCurrentBackground}
            />

            {/* Floating Dock — show when inside any app */}
            {activeSection !== "home" && (
                <div className={`relative z-50 ${isMobile ? 'fixed bottom-0 w-full' : ''}`}>
                    <FloatingDock items={items} id="floating-dock-tutorial-target" />
                </div>
            )}

            {/* Stage Manager — left side, Apple-style, desktop only */}
            {!isMobile && (
                <StageManager
                    minimizedSections={minimizedSections}
                    activeSection={activeSection}
                    onSelect={handleStageManagerSelect}
                    renderPreview={renderPreview}
                />
            )}

            {/* Main Content Area — dynamic padding for dock (left) + Stage Manager (right) */}
            <div
                className={`relative z-10 h-full flex flex-col`}
                style={{
                    paddingLeft: isMobile || isHome ? 0 : 96,
                    paddingRight: isMobile || isHome ? 0 : (hasStageManager ? 164 : 24),
                    transition: 'padding-right 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
            >
                {/* Mobile Social Bar — positioned at bottom */}
                {isMobile && (
                    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 glass-pill px-4 py-2 z-[100]">
                        <Link href="https://github.com/sbeeredd04" target="_blank">
                            <IconBrandGithub className="text-white/60 hover:text-white transition-colors" size={18} />
                        </Link>
                        <Link href="https://www.instagram.com/sriujjwalreddy/" target="_blank">
                            <IconBrandInstagram className="text-white/60 hover:text-white transition-colors" size={18} />
                        </Link>
                        <Link href="https://www.linkedin.com/in/sriujjwal/" target="_blank">
                            <IconBrandLinkedin className="text-white/60 hover:text-white transition-colors" size={18} />
                        </Link>
                        <Link href="mailto:srisubspace@gmail.com" target="_blank">
                            <IconMail className="text-white/60 hover:text-white transition-colors" size={18} />
                        </Link>
                        <Link href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=2c62fb75bef644f6" target="_blank">
                            <IconBrandSpotify className="text-white/60 hover:text-white transition-colors" size={18} />
                        </Link>
                    </div>
                )}

                {/* Spacer for top — avoid overlapping the control strip */}
                <div className={`flex-shrink-0 ${isMobile ? 'h-16' : 'h-20'}`} />

                {/* Content Window — relative for popLayout absolute-positioning of exit */}
                <div className={`flex-1 min-h-0 ${isMobile ? 'mx-3' : 'mx-6'} relative`}>
                    <AnimatePresence mode="popLayout">
                        <SectionWindow
                            key={activeSection}
                            title={SECTION_TITLES[activeSection]}
                            onClose={handleClose}
                            onMinimize={handleMinimize}
                            isHome={isHome}
                            transitionSource={transitionSource}
                        >
                            {activeSection === "home" && <HomeSection navigateToSection={navigateToSection} navigateToSectionWithTab={navigateToSectionWithTab} />}
                            {activeSection === "featured" && <FeaturingSection navigateToSection={navigateToSection} />}
                            {activeSection === "about" && <AboutSection activeTab={activeTab} />}
                            {activeSection === "experience" && <ExperienceSection activeTab={activeTab} />}
                            {activeSection === "projects" && <ProjectsSection activeTab={activeTab} isMobile={isMobile} />}
                            {activeSection === "skills" && <SkillsSection skillsActiveTab={skillsActiveTab} />}
                            {activeSection === "blog" && <BlogSection />}
                            {activeSection === "contact" && <ContactSection />}
                        </SectionWindow>
                    </AnimatePresence>
                </div>

                {/* Bottom Tab Bar — only for app sections (not home/featured) */}
                {!isHome && activeSection !== "featured" && (
                    <div className="flex-shrink-0 py-2 md:py-3">
                        <BottomTabBar
                            activeSection={activeSection}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            skillsActiveTab={skillsActiveTab}
                            setSkillsActiveTab={setSkillsActiveTab}
                            isMobile={isMobile}
                        />
                    </div>
                )}

                {/* Bottom spacer */}
                <div className={`flex-shrink-0 ${isMobile ? 'h-16' : (isHome || activeSection === 'featured') ? 'h-6' : 'h-4'}`} />
            </div>

            {/* Spotify Player */}
            {showPlayer && <SpotifyPlayer />}

            {/* Global scrollbar hide */}
            <style jsx global>{`
                * { scrollbar-width: none; -ms-overflow-style: none; }
                *::-webkit-scrollbar { display: none; }
            `}</style>
        </motion.div>
    );
}
