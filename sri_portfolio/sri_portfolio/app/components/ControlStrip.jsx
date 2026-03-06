"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconVolume,
  IconVolumeOff,
  IconBrandSpotify,
  IconPalette,
  IconRoute,
} from "@tabler/icons-react";

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

export default function ControlStrip({
  isSoundEnabled,
  toggleSound,
  showPlayer,
  togglePlayerVisibility,
  isActuallyMobile,
  onManualJourney,
  currentBackground,
  setCurrentBackground,
}) {
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowWallpaperPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[100] flex items-center gap-1" ref={pickerRef}>
      {/* Control Strip Pill */}
      <motion.div
        className="glass-pill flex items-center gap-1 px-2 py-1.5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
          <img
            src="/music/mySong.png"
            alt="Sri"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
          title={isSoundEnabled ? "Mute" : "Unmute"}
        >
          {isSoundEnabled ? (
            <IconVolume size={18} stroke={1.5} />
          ) : (
            <IconVolumeOff size={18} stroke={1.5} />
          )}
        </button>

        {/* Spotify Toggle */}
        <button
          onClick={togglePlayerVisibility}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            showPlayer
              ? "text-green-400 bg-green-400/10"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Spotify Player"
        >
          <IconBrandSpotify size={18} stroke={1.5} />
        </button>

        {/* Wallpaper Picker */}
        <button
          onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            showWallpaperPicker
              ? "text-vision-accent bg-vision-accent/10"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Change Wallpaper"
        >
          <IconPalette size={18} stroke={1.5} />
        </button>

        {/* Journey Replay (desktop only) */}
        {!isActuallyMobile && (
          <button
            onClick={onManualJourney}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Replay Journey"
          >
            <IconRoute size={18} stroke={1.5} />
          </button>
        )}
      </motion.div>

      {/* Wallpaper Picker Dropdown */}
      <AnimatePresence>
        {showWallpaperPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-56 glass-dark rounded-[20px] overflow-hidden p-2"
          >
            <p className="text-white/40 text-xs font-medium px-3 py-1.5 uppercase tracking-wider">
              Wallpaper
            </p>
            <div className="grid grid-cols-2 gap-1.5 p-1">
              {backgrounds.map((bg, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentBackground(bg.path);
                    setShowWallpaperPicker(false);
                  }}
                  className={`relative rounded-xl overflow-hidden h-16 group transition-all ${
                    currentBackground === bg.path
                      ? "ring-2 ring-vision-accent ring-offset-1 ring-offset-black/50"
                      : "hover:ring-1 hover:ring-white/30"
                  }`}
                >
                  <img
                    src={bg.path}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all" />
                  <span className="absolute bottom-1 left-1 text-[10px] text-white/80 font-medium">
                    {bg.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
