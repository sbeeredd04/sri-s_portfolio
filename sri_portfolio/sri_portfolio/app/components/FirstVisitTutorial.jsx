"use client";

import { useState, useEffect, useRef } from 'react';
import { TutorialOverlay } from './TutorialOverlay';

const TUTORIAL_SHOWN_KEY = 'portfolio_tutorial_shown';

export const FirstVisitTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const initialDelayRef = useRef(null);
  const elementCheckIntervalRef = useRef(null);

  // First, safely set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    return () => {
      // Clear any lingering timeouts/intervals on unmount
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
      if (elementCheckIntervalRef.current) {
        clearInterval(elementCheckIntervalRef.current);
      }
    };
  }, []);

  // Check if required elements are present in the DOM
  const areTargetElementsReady = () => {
    if (typeof document === 'undefined') return false;
    
    const requiredElements = [
      'floating-dock-tutorial-target',
      'sound-toggle-tutorial-target',
      'spotify-player-tutorial-target',
      'theme-button-tutorial-target'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      console.log('Tutorial elements not ready yet. Missing:', missingElements);
      return false;
    }
    
    return true;
  };

  // Then handle tutorial visibility once we're on the client
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Check localStorage for tutorial status
      const hasSeenTutorial = localStorage.getItem(TUTORIAL_SHOWN_KEY) === 'true';
      console.log("FirstVisitTutorial: Has seen tutorial before:", hasSeenTutorial);
      
      if (!hasSeenTutorial) {
        // Initial short delay to let the page begin rendering
        initialDelayRef.current = setTimeout(() => {
          console.log("FirstVisitTutorial: Checking elements...");
          
          // Start checking for elements to be ready
          elementCheckIntervalRef.current = setInterval(() => {
            if (areTargetElementsReady()) {
              console.log("FirstVisitTutorial: All tutorial target elements are ready, showing tutorial");
              clearInterval(elementCheckIntervalRef.current);
              elementCheckIntervalRef.current = null;
              
              // One final short delay to ensure elements are rendered properly
              setTimeout(() => {
                setShowTutorial(true);
              }, 500);
            }
          }, 300);
          
          // Timeout the check after 15 seconds regardless
          setTimeout(() => {
            if (elementCheckIntervalRef.current) {
              console.log("FirstVisitTutorial: Gave up waiting for elements after 15 seconds");
              clearInterval(elementCheckIntervalRef.current);
              elementCheckIntervalRef.current = null;
              
              // Show tutorial anyway
              setShowTutorial(true);
            }
          }, 15000);
          
        }, 1000);
      }
    } catch (error) {
      // Fallback in case of any localStorage errors
      console.error("Error checking tutorial status:", error);
      // Show tutorial anyway if there's an error
      setShowTutorial(true);
    }
    
    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
        initialDelayRef.current = null;
      }
      if (elementCheckIntervalRef.current) {
        clearInterval(elementCheckIntervalRef.current);
        elementCheckIntervalRef.current = null;
      }
    };
  }, [isClient]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    
    try {
      // Mark the tutorial as shown in local storage
      localStorage.setItem(TUTORIAL_SHOWN_KEY, 'true');
      console.log("FirstVisitTutorial: Tutorial marked as shown");
    } catch (error) {
      console.error("Error saving tutorial status:", error);
    }
  };

  // Add a window property for manual triggering (development/testing)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      window.showPortfolioTutorial = () => {
        console.log("Manual tutorial trigger activated");
        setShowTutorial(true);
      };
      
      // Also add a function to reset tutorial state
      window.resetPortfolioTutorial = () => {
        try {
          localStorage.removeItem(TUTORIAL_SHOWN_KEY);
          console.log("Tutorial state reset - will show next time page loads");
        } catch (error) {
          console.error("Error resetting tutorial state:", error);
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showPortfolioTutorial;
        delete window.resetPortfolioTutorial;
      }
    };
  }, [isClient]);

  return showTutorial ? <TutorialOverlay onClose={handleCloseTutorial} /> : null;
}; 