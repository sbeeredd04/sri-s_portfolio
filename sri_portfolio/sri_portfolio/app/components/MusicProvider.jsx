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
  
  // Keep track of play order when shuffle is enabled
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);
    
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    // Set initial song
    if (songs && songs.length > 0) {
      audioRef.current.src = songs[currentSongIndex].audioSrc;
      audioRef.current.load();
    }

    // Initialize shuffled indices
    generateShuffledIndices();

    // Event listeners
    const updateProgress = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const onLoadMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const onSongEnd = () => {
      if (repeatMode === 2) {
        // Repeat one
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => console.error("Play failed:", error));
        }
      } else if (repeatMode === 1) {
        // Repeat all
        nextSong();
      } else {
        // No repeat - stop at the end of the playlist
        if (isShuffle) {
          if (currentShuffleIndex < shuffledIndices.length - 1) {
            nextSong();
          } else {
            // End of playlist in shuffle mode
            setIsPlaying(false);
          }
        } else {
          if (currentSongIndex < songs.length - 1) {
            nextSong();
          } else {
            // End of playlist in normal mode
            setIsPlaying(false);
          }
        }
      }
    };

    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', onLoadMetadata);
    audioRef.current.addEventListener('ended', onSongEnd);

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', onLoadMetadata);
        audioRef.current.removeEventListener('ended', onSongEnd);
        audioRef.current.pause();
      }
    };
  }, []);

  // Generate shuffled indices when shuffle mode changes
  const generateShuffledIndices = () => {
    const indices = Array.from({ length: songs.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    
    // Find where the current song is in the shuffled array
    const currentIndexInShuffled = indices.findIndex(idx => idx === currentSongIndex);
    setCurrentShuffleIndex(currentIndexInShuffled >= 0 ? currentIndexInShuffled : 0);
  };

  // Effect for changing songs
  useEffect(() => {
    if (isClient && audioRef.current && songs && songs.length > 0) {
      audioRef.current.src = songs[currentSongIndex].audioSrc;
      audioRef.current.load();
      
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error("Play failed:", error));
      }
    }
  }, [currentSongIndex, isClient]);

  // Handle play/pause
  useEffect(() => {
    if (isClient && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error("Play failed:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isClient]);

  // Handle volume change
  useEffect(() => {
    if (isClient && audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, isClient]);

  // Effect to regenerate shuffle indices when shuffle mode is toggled
  useEffect(() => {
    if (isShuffle) {
      generateShuffledIndices();
    }
  }, [isShuffle]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    if (isShuffle) {
      // Next song in shuffle mode
      if (currentShuffleIndex < shuffledIndices.length - 1) {
        setCurrentShuffleIndex(currentShuffleIndex + 1);
        setCurrentSongIndex(shuffledIndices[currentShuffleIndex + 1]);
      } else if (repeatMode === 1) {
        // Repeat all in shuffle mode - go back to first shuffle index
        setCurrentShuffleIndex(0);
        setCurrentSongIndex(shuffledIndices[0]);
      }
    } else {
      // Next song in normal mode
      if (currentSongIndex < songs.length - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
      } else if (repeatMode === 1) {
        // Repeat all in normal mode - go back to first song
        setCurrentSongIndex(0);
      }
    }
  };
  
  const prevSong = () => {
    if (isShuffle) {
      // Previous song in shuffle mode
      if (currentShuffleIndex > 0) {
        setCurrentShuffleIndex(currentShuffleIndex - 1);
        setCurrentSongIndex(shuffledIndices[currentShuffleIndex - 1]);
      } else if (repeatMode === 1) {
        // Repeat all in shuffle mode - go to last shuffle index
        setCurrentShuffleIndex(shuffledIndices.length - 1);
        setCurrentSongIndex(shuffledIndices[shuffledIndices.length - 1]);
      }
    } else {
      // Previous song in normal mode
      if (currentSongIndex > 0) {
        setCurrentSongIndex(currentSongIndex - 1);
      } else if (repeatMode === 1) {
        // Repeat all in normal mode - go to last song
        setCurrentSongIndex(songs.length - 1);
      }
    }
  };
  
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };
  
  const toggleRepeat = () => {
    setRepeatMode((repeatMode + 1) % 3);
  };
  
  const setCurrentTimePosition = (time) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };
  
  const changeVolume = (newVolume) => {
    setVolume(newVolume);
  };

  const togglePlayerVisibility = () => {
    setShowPlayer(!showPlayer);
  };

  return (
    <MusicContext.Provider
      value={{
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

// Custom hook to use the music context
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}; 