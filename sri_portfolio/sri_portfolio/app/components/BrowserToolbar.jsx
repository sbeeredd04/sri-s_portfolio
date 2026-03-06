"use client";

import Link from "next/link";
import {
    IconArrowLeft,
    IconArrowRight,
    IconRefresh,
    IconLock,
    IconSearch,
    IconVolume,
    IconBrandSpotify,
    IconPalette,
    IconRoute,
} from "@tabler/icons-react";
import { IconVolumeOff } from "@tabler/icons-react";
import { useRef, useState, useEffect } from "react";

const backgrounds = [
    { name: "Default", path: "/background/homeEnv.jpg" },
    { name: "Tahoe", path: "/background/tahoe-dark.jpg" },
    { name: "Sequoia", path: "/background/sequoia-dark.jpg" },
    { name: "Sunrise", path: "/background/sequoia-sunrise.jpg" },
    { name: "Sonoma", path: "/background/sonoma-light.jpg" },
    { name: "Sonoma Dark", path: "/background/sonoma-dark.jpg" },
    { name: "Ventura", path: "/background/ventura-dark.jpg" },
    { name: "Monterey", path: "/background/monterey-dark.jpg" },
    { name: "Big Sur", path: "/background/big-sur-night.jpg" },
    { name: "Big Sur Day", path: "/background/big-sur-color-day.jpg" },
    { name: "Catalina", path: "/background/catalina-night.jpg" },
    { name: "Mojave", path: "/background/mojave-night.jpg" },
    { name: "Island", path: "/background/island.jpg" },
    { name: "Aurora", path: "/background/aurora.jpg" },
    { name: "Dunes", path: "/background/desert-dunes.jpg" },
    { name: "Ocean", path: "/background/ocean-cliffs.jpg" },
    { name: "Alpine", path: "/background/mountain-lake.jpg" },
    { name: "Peaks", path: "/background/twilight-peaks.jpg" },
    { name: "Moon", path: "/background/moon.jpg" },
    { name: "Canyon", path: "/background/antelope.jpg" },
    { name: "Stars", path: "/background/purpleStars.jpg" },
    { name: "Forest", path: "/background/bg2.jpg" },
    { name: "Bridge", path: "/background/bridge.jpg" },
];

export default function BrowserToolbar({
    activeSection,
    activeTimeline,
    currentHistoryIndex,
    navigationHistory,
    goBack,
    goForward,
    isSoundEnabled,
    toggleSound,
    showPlayer,
    togglePlayerVisibility,
    isActuallyMobile,
    onManualJourney,
    currentBackground,
    setCurrentBackground,
}) {
    const [isBackgroundMenuOpen, setIsBackgroundMenuOpen] = useState(false);
    const backgroundMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (backgroundMenuRef.current && !backgroundMenuRef.current.contains(event.target)) {
                setIsBackgroundMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className="flex-shrink-0 h-12 md:h-16 mx-6">
                <div className="w-full h-full rounded-2xl bg-neutral-800/20 backdrop-blur-xl border border-white/10 shadow-lg flex items-center px-4 py-2 md:px-6">
                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
                ${currentHistoryIndex > 0
                                    ? 'cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'}`}
                            onClick={goBack}
                            disabled={currentHistoryIndex <= 0}
                        >
                            <IconArrowLeft size={20} stroke={1.5} className="md:hidden" />
                            <IconArrowLeft size={24} stroke={1.5} className="hidden md:block" />
                        </button>
                        <button
                            className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
                ${currentHistoryIndex < navigationHistory.length - 1
                                    ? 'cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'}`}
                            onClick={goForward}
                            disabled={currentHistoryIndex >= navigationHistory.length - 1}
                        >
                            <IconArrowRight size={20} stroke={1.5} className="md:hidden" />
                            <IconArrowRight size={24} stroke={1.5} className="hidden md:block" />
                        </button>
                        <button
                            className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            <IconRefresh size={20} stroke={1.5} className="md:hidden" />
                            <IconRefresh size={24} stroke={1.5} className="hidden md:block" />
                        </button>
                    </div>

                    {/* Search/URL Bar */}
                    <div className="flex-1 mx-2 md:mx-6 min-w-0">
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-900/90 rounded-lg border border-white/5 md:hidden">
                            <IconSearch size={14} className="text-neutral-500" />
                            <span className="text-xs text-neutral-400 font-mono truncate">
                                {activeSection}
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900/90 rounded-lg border border-white/5">
                            <IconLock size={18} className="text-neutral-500" />
                            <span className="text-sm text-neutral-400 font-mono truncate">
                                sriujjwalreddy.com/{activeSection === "home" ? "" : activeSection}
                            </span>
                        </div>
                    </div>

                    {/* Browser Controls */}
                    <div className="flex items-center gap-1 md:gap-4">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700/50 border border-white/10 overflow-hidden">
                            <img
                                src="/music/mySong.png"
                                alt="Sri"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div id="sound-toggle-tutorial-target" className="relative">
                            <button
                                className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                                onClick={toggleSound}
                            >
                                {isSoundEnabled ? (
                                    <>
                                        <IconVolume size={20} stroke={1.5} className="md:hidden" />
                                        <IconVolume size={24} stroke={1.5} className="hidden md:block" />
                                    </>
                                ) : (
                                    <>
                                        <IconVolumeOff size={20} stroke={1.5} className="md:hidden" />
                                        <IconVolumeOff size={24} stroke={1.5} className="hidden md:block" />
                                    </>
                                )}
                            </button>
                        </div>
                        <div id="spotify-player-tutorial-target" className="relative">
                            <button
                                className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                                onClick={togglePlayerVisibility}
                            >
                                <IconBrandSpotify size={20} stroke={1.5} className="md:hidden" />
                                <IconBrandSpotify size={24} stroke={1.5} className="hidden md:block" />
                            </button>
                        </div>
                        <div id="theme-button-tutorial-target" className="relative">
                            <button
                                onClick={() => setIsBackgroundMenuOpen(!isBackgroundMenuOpen)}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 h-8 rounded-lg bg-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-600/30 transition-colors border border-white/10 md:px-3 md:gap-2"
                            >
                                <IconPalette size={20} stroke={1.5} className="md:hidden" />
                                <IconPalette size={24} stroke={1.5} className="hidden md:block" />
                                <span className="text-xs font-medium hidden md:inline md:text-sm">Theme</span>
                            </button>
                        </div>
                        {!isActuallyMobile && (
                            <div className="relative">
                                <button
                                    onClick={onManualJourney}
                                    className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors"
                                    title="Experience Journey"
                                >
                                    <IconRoute size={20} stroke={1.5} className="md:hidden" />
                                    <IconRoute size={24} stroke={1.5} className="hidden md:block" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Theme Switcher Dropdown */}
            {isBackgroundMenuOpen && (
                <div className="absolute top-[12.5vh] right-6 mt-2 w-48 rounded-xl bg-neutral-800/60 backdrop-blur-2xl border border-white/10 overflow-hidden z-50">
                    {backgrounds.map((bg, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentBackground(bg.path);
                                setIsBackgroundMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/60 transition-all text-sm"
                        >
                            {bg.name}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
