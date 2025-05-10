"use client";

import { useState, useEffect } from "react";
import { useSound } from "./components/SoundProvider";

export default function TestSound() {
  const { isSoundEnabled, toggleSound, playClickSound } = useSound();
  const [clickCount, setClickCount] = useState(0);
  
  const handleTestClick = () => {
    console.log("Test button clicked");
    setClickCount(prev => prev + 1);
    
    // Play the sound directly
    if (playClickSound) {
      console.log("Calling playClickSound directly");
      playClickSound();
    } else {
      console.error("playClickSound function is not available");
    }
  };
  
  // Try playing a sound directly using the Audio API
  const playDirectSound = () => {
    console.log("Playing sound directly with Audio API");
    try {
      const audio = new Audio('/click.mp3');
      audio.volume = 1.0; // Maximum volume
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("Direct sound played successfully"))
          .catch(error => console.error("Direct sound play failed:", error));
      }
    } catch (error) {
      console.error("Error playing direct sound:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-8">Sound Test Page</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <p className="mb-4">Click count: {clickCount}</p>
        <p className="mb-4">Sound enabled: {isSoundEnabled ? "YES" : "NO"}</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleTestClick}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            Test Click Sound
          </button>
          
          <button 
            onClick={toggleSound}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
          >
            {isSoundEnabled ? "Disable Sound" : "Enable Sound"}
          </button>
          
          <button 
            onClick={playDirectSound}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
          >
            Direct Audio API Test
          </button>
        </div>
        
        <div className="mt-6 bg-gray-700 p-4 rounded-md">
          <p className="text-sm">Please check the browser console for debugging messages.</p>
          <p className="text-sm mt-2 text-gray-400">
            If you don't hear sounds, try clicking the "Direct Audio API Test" button which
            bypasses our sound system and uses the browser's Audio API directly.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/" className="text-blue-400 hover:underline">
          Return to Homepage
        </a>
      </div>
    </div>
  );
} 