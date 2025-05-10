"use client";

import { createContext, useState, useContext, useEffect, useRef } from 'react';
import songs from '../json/songs.json';

// Create context
export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one

  const audioRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  // Shuffled order tracking
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
    // initialize audio
    audioRef.current = new Audio(songs[currentSongIndex].audioSrc);
    audioRef.current.volume = volume;
    audioRef.current.loop = repeatMode === 2;

    const updateProgress = () => setCurrentTime(audioRef.current.currentTime);
    const onLoadMetadata = () => setDuration(audioRef.current.duration);
    const onSongEnd = () => {
      const atEnd = isShuffle
        ? currentShuffleIndex >= shuffledIndices.length - 1
        : currentSongIndex >= songs.length - 1;

      if (!atEnd) {
        nextSong();
      } else if (repeatMode === 1) {
        // repeat all
        nextSong();
      } else {
        setIsPlaying(false);
      }
    };

    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', onLoadMetadata);
    audioRef.current.addEventListener('ended', onSongEnd);

    generateShuffledIndices();

    return () => {
      const audio = audioRef.current;
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', onLoadMetadata);
      audio.removeEventListener('ended', onSongEnd);
      audio.pause();
    };
  }, []);

  // Sync loop attribute when repeatMode changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeatMode === 2;
  }, [repeatMode]);

  // Change track source when currentSongIndex changes
  useEffect(() => {
    if (!isClient) return;
    const audio = audioRef.current;
    audio.src = songs[currentSongIndex].audioSrc;
    audio.load();
    if (isPlaying) audio.play().catch(console.error);
  }, [currentSongIndex]);

  // Play/pause
  useEffect(() => {
    if (!isClient) return;
    const audio = audioRef.current;
    if (isPlaying) audio.play().catch(console.error);
    else audio.pause();
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Regenerate shuffle list
  useEffect(() => {
    if (isShuffle) generateShuffledIndices();
  }, [isShuffle]);

  const generateShuffledIndices = () => {
    const indices = songs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    const idx = indices.indexOf(currentSongIndex);
    setCurrentShuffleIndex(idx >= 0 ? idx : 0);
  };

  const togglePlay = () => setIsPlaying(prev => !prev);
  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => setRepeatMode(prev => (prev + 1) % 3);
  const setCurrentTimePosition = time => {
    setCurrentTime(time);
    audioRef.current.currentTime = time;
  };
  const changeVolume = v => setVolume(v);
  const togglePlayerVisibility = () => setShowPlayer(prev => !prev);

  const nextSong = () => {
    if (isShuffle) {
      let nextIdx = currentShuffleIndex + 1;
      if (nextIdx >= shuffledIndices.length) nextIdx = 0;
      setCurrentShuffleIndex(nextIdx);
      setCurrentSongIndex(shuffledIndices[nextIdx]);
    } else {
      let next = currentSongIndex + 1;
      if (next >= songs.length) next = 0;
      setCurrentSongIndex(next);
    }
  };

  const prevSong = () => {
    if (isShuffle) {
      let prevIdx = currentShuffleIndex - 1;
      if (prevIdx < 0) prevIdx = shuffledIndices.length - 1;
      setCurrentShuffleIndex(prevIdx);
      setCurrentSongIndex(shuffledIndices[prevIdx]);
    } else {
      let prev = currentSongIndex - 1;
      if (prev < 0) prev = songs.length - 1;
      setCurrentSongIndex(prev);
    }
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      currentSongIndex,
      currentSong: songs[currentSongIndex],
      allSongs: songs,
      volume,
      currentTime,
      duration,
      showPlayer,
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
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};