"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
  IconRepeat,
  IconRepeatOnce,
  IconRepeatOff,
  IconArrowsShuffle,
  IconArrowsRight,
  IconX
} from "@tabler/icons-react";
import { useMusic } from "./MusicProvider";
import { useOutsideClick } from "../hooks/use-outside-click";

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const SpotifyPlayer = () => {
  const playerRef = useRef(null);
  const {
    isPlaying,
    currentSong,
    volume,
    currentTime,
    duration,
    isShuffle,
    repeatMode,
    togglePlay,
    nextSong,
    prevSong,
    toggleShuffle,
    toggleRepeat,
    setCurrentTimePosition,
    changeVolume,
    togglePlayerVisibility
  } = useMusic();

  useOutsideClick(playerRef, () => {
    togglePlayerVisibility();
  });

  if (!currentSong) return null;

  const handleProgressChange = (e) => setCurrentTimePosition(parseFloat(e.target.value));
  const handleVolumeChange = (e) => changeVolume(parseFloat(e.target.value));

  const getVolumeIcon = () => {
    if (volume === 0) return <IconVolumeOff stroke={1.5} />;
    if (volume < 0.33) return <IconVolume2 stroke={1.5} />;
    if (volume < 0.66) return <IconVolume3 stroke={1.5} />;
    return <IconVolume stroke={1.5} />;
  };

  const getRepeatIcon = () => {
    if (repeatMode === 0) return <IconRepeatOff stroke={1.5} />;
    if (repeatMode === 1) return <IconRepeat stroke={1.5} />;
    if (repeatMode === 2) return <IconRepeatOnce stroke={1.5} />;
    return <IconRepeatOff stroke={1.5} />;
  };

  const getRepeatClass = () => {
    if (repeatMode === 0) return "text-neutral-500 hover:text-white";
    if (repeatMode === 1) return "text-green-500";
    if (repeatMode === 2) return "text-green-500";
    return "text-neutral-500 hover:text-white";
  };

  return (
    <AnimatePresence>
      {/* Wrapper div that covers the entire screen but aligns content to bottom */}
      <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none">
        {/* Container with constrained width */}
        <div className="w-[95%] max-w-3xl pointer-events-auto px-4 mb-4 md:mb-8">
          <motion.div
            ref={playerRef}
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className="bg-neutral-900/90 backdrop-blur-md shadow-lg rounded-xl border border-white/10 p-4 flex flex-col sm:flex-col md:flex-row items-center gap-4"
          >
            {/* Close */}
            <button
              onClick={togglePlayerVisibility}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800/60"
            >
              <IconX size={18} />
            </button>

            {/* Artwork & Info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-800 rounded-md overflow-hidden">
                <img src={currentSong.albumArt} alt={`${currentSong.title} cover`} className="w-full h-full object-cover" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-white text-base sm:text-lg font-semibold truncate">
                  {currentSong.title}
                </h4>
                <p className="text-neutral-400 text-sm truncate">
                  {currentSong.artist}
                </p>
              </div>
            </div>

            {/* Controls & Progress */}
            <div className="flex-1 flex flex-col items-center w-full">
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={toggleShuffle} 
                  className={`p-2 rounded-full transition-colors ${
                    isShuffle ? 'text-green-500' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={isShuffle ? "Shuffle On" : "Shuffle Off"}
                >
                  {isShuffle ? <IconArrowsShuffle stroke={1.5} /> : <IconArrowsRight stroke={1.5} />}
                </button>
                <button onClick={prevSong} className="p-2 text-neutral-300 hover:text-white" title="Previous">
                  <IconPlayerTrackPrevFilled size={24} />
                </button>
                <button onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white hover:scale-105 transition-transform" title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <IconPlayerPauseFilled size={28} className="text-black" /> : <IconPlayerPlayFilled size={28} className="text-black" />}
                </button>
                <button onClick={nextSong} className="p-2 text-neutral-300 hover:text-white" title="Next">
                  <IconPlayerTrackNextFilled size={24} />
                </button>
                <button 
                  onClick={toggleRepeat} 
                  className={`p-2 rounded-full transition-colors ${getRepeatClass()}`}
                  title={
                    repeatMode === 0 ? "Repeat Off" : 
                    repeatMode === 1 ? "Repeat All" : 
                    "Repeat One"
                  }
                >
                  {getRepeatIcon()}
                </button>
              </div>
              <div className="flex items-center gap-2 w-full mt-2 px-2">
                <span className="text-neutral-400 text-xs w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime || 0}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 rounded-full bg-neutral-700 appearance-none
                    [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                    [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
                  style={{ background: `linear-gradient(to right, #1DB954 ${(currentTime / (duration || 100)) * 100}%, #404040 ${(currentTime / (duration || 100)) * 100}%)` }}
                />
                <span className="text-neutral-400 text-xs w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-auto">
              <button onClick={() => changeVolume(volume === 0 ? 1 : 0)} className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors" title={volume === 0 ? "Unmute" : "Mute"}>
                {getVolumeIcon()}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full max-w-[100px] h-1 rounded-full bg-neutral-700 appearance-none
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
                style={{ background: `linear-gradient(to right, #1DB954 ${volume * 100}%, #404040 ${volume * 100}%)` }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};