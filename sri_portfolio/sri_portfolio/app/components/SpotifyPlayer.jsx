"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
  IconX
} from "@tabler/icons-react";
import { useMusic } from "./MusicProvider";

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const SpotifyPlayer = () => {
  const {
    isPlaying,
    currentSong,
    volume,
    currentTime,
    duration,
    togglePlay,
    nextSong,
    prevSong,
    setCurrentTimePosition,
    changeVolume,
    togglePlayerVisibility
  } = useMusic();

  if (!currentSong) return null;

  const handleProgressChange = (e) => setCurrentTimePosition(parseFloat(e.target.value));
  const progressPercent = ((currentTime || 0) / (duration || 100)) * 100;

  const getVolumeIcon = () => {
    if (volume === 0) return <IconVolumeOff size={14} stroke={1.5} />;
    if (volume < 0.33) return <IconVolume2 size={14} stroke={1.5} />;
    if (volume < 0.66) return <IconVolume3 size={14} stroke={1.5} />;
    return <IconVolume size={14} stroke={1.5} />;
  };

  return (
    <AnimatePresence>
      {/* Compact top-right mini player — sits to the left of the ControlStrip */}
      <motion.div
        className="fixed top-5 z-[99]"
        style={{ right: "210px" }}
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      >
        <div
          className="glass-pill flex flex-col gap-0 overflow-hidden"
          style={{ width: 260, minWidth: 220 }}
        >
          {/* Main row: art + info + controls */}
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            {/* Album Art */}
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-md shadow-black/40"
            >
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-semibold truncate leading-tight">{currentSong.title}</p>
              <p className="text-white/40 text-[10px] truncate leading-tight">{currentSong.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={prevSong}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <IconPlayerTrackPrevFilled size={13} />
              </button>
              <button
                onClick={togglePlay}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all"
              >
                {isPlaying ? <IconPlayerPauseFilled size={13} /> : <IconPlayerPlayFilled size={13} className="ml-0.5" />}
              </button>
              <button
                onClick={nextSong}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <IconPlayerTrackNextFilled size={13} />
              </button>

              {/* Volume mute toggle */}
              <button
                onClick={() => changeVolume(volume === 0 ? 1 : 0)}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              >
                {getVolumeIcon()}
              </button>

              {/* Close */}
              <button
                onClick={togglePlayerVisibility}
                className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
              >
                <IconX size={12} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative px-2.5 pb-2">
            <div className="relative h-0.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white/60"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime || 0}
              onChange={handleProgressChange}
              className="absolute inset-x-2.5 bottom-0 h-4 opacity-0 cursor-pointer"
              style={{ marginTop: "-8px" }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-white/25 text-[8px] tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-white/25 text-[8px] tabular-nums">-{formatTime((duration || 0) - (currentTime || 0))}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};