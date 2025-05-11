"use client";

import { createContext, useState, useContext, useEffect, useRef } from 'react';

// Create context with default values to prevent undefined errors
export const SoundContext = createContext({
  isSoundEnabled: true,
  playClickSound: () => {},
  toggleSound: () => {}
});

export const SoundProvider = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const clickSoundRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);
    
    // Create audio element for click sound if it doesn't exist
    if (!clickSoundRef.current && typeof Audio !== 'undefined') {
      try {
        clickSoundRef.current = new Audio('/click.mp3');
        clickSoundRef.current.volume = 0.8; // Increase volume to make it more audible
        
        // Add event listeners to track audio loading
        clickSoundRef.current.addEventListener('canplaythrough', () => {
          setIsLoaded(true);
        });
        
        clickSoundRef.current.addEventListener('error', (e) => {
          console.error("Error loading click sound:", e);
        });
        
        // Preload the sound
        clickSoundRef.current.load();
        
        // Try playing it once to overcome autoplay restrictions
        document.addEventListener('click', function initialClick() {
          clickSoundRef.current.play()
            .then(() => {
              clickSoundRef.current.pause();
              clickSoundRef.current.currentTime = 0;
            })
            .catch(err => console.error("Could not play initial click sound:", err));
          document.removeEventListener('click', initialClick);
        }, { once: true });
        
      } catch (error) {
        console.error("Error initializing click sound:", error);
      }
    }
    
    return () => {
      if (clickSoundRef.current) {
        clickSoundRef.current = null;
      }
    };
  }, []);

  const playClickSound = () => {
    if (!isClient || !isSoundEnabled) {
      return;
    }
    
    try {
      if (clickSoundRef.current) {
        // Create a new audio element each time for better handling of rapid clicks
        const sound = new Audio('/click.mp3');
        sound.volume = 0.8;
        sound.play().then(() => {
        }).catch(error => {
          console.error("Click sound failed to play:", error);
        });
      } else {
        console.log("Click sound reference not available");
      }
    } catch (error) {
      console.error("Error playing click sound:", error);
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      return !prev;
    });
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = {
    isSoundEnabled,
    playClickSound,
    toggleSound,
    isLoaded
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

// Custom hook to use the sound context
export const useSound = () => {
  const context = useContext(SoundContext);
  return context;
}; 