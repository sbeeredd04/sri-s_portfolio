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
    console.log("SoundProvider mounted, initializing click sound");
    
    // Create audio element for click sound if it doesn't exist
    if (!clickSoundRef.current && typeof Audio !== 'undefined') {
      try {
        console.log("Creating new Audio element for click sound");
        clickSoundRef.current = new Audio('/click.mp3');
        clickSoundRef.current.volume = 0.8; // Increase volume to make it more audible
        
        // Add event listeners to track audio loading
        clickSoundRef.current.addEventListener('canplaythrough', () => {
          console.log("Click sound loaded successfully!");
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
              console.log("Initial click sound played successfully!");
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
        console.log("Cleaning up click sound");
        clickSoundRef.current = null;
      }
    };
  }, []);

  const playClickSound = () => {
    if (!isClient || !isSoundEnabled) {
      console.log("Click sound not played: client:", isClient, "sound enabled:", isSoundEnabled);
      return;
    }
    
    try {
      if (clickSoundRef.current) {
        console.log("Attempting to play click sound");
        // Create a new audio element each time for better handling of rapid clicks
        const sound = new Audio('/click.mp3');
        sound.volume = 0.8;
        sound.play().then(() => {
          console.log("Click sound played successfully!");
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
      console.log("Sound toggled from", prev, "to", !prev);
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