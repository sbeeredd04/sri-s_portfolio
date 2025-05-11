"use client";

import { useState, useEffect, useRef } from 'react';
import { TutorialOverlay } from './TutorialOverlay';

const TUTORIAL_SHOWN_KEY = 'portfolio_tutorial_shown';
const MOBILE_WIDTH_THRESHOLD = 768;

export const FirstVisitTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initialDelayRef = useRef(null);
  const elementCheckIntervalRef = useRef(null);

  // First, safely set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Detect mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_WIDTH_THRESHOLD);
    };
    
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    
    return () => {
      // Clear any lingering timeouts/intervals on unmount
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
      if (elementCheckIntervalRef.current) {
        clearInterval(elementCheckIntervalRef.current);
      }
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Check if required elements are present in the DOM
  const areTargetElementsReady = () => {
    if (typeof document === 'undefined') return false;
    
    // Different required elements for mobile and desktop
    const requiredElements = [
      'floating-dock-tutorial-target', // This is common to both mobile and desktop
      'sound-toggle-tutorial-target',
      'spotify-player-tutorial-target',
      'theme-button-tutorial-target',
      'tab-switcher-tutorial-target'
    ];
    
    // Social links only required for desktop
    if (!isMobile) {
      requiredElements.push('social-links-tutorial-target');
    } else {
      // Mobile connections target for mobile view
      requiredElements.push('mobile-connections-tutorial-target');
    }
    
    // Check if the elements exist
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      console.log(`Tutorial elements not ready yet. Missing: ${missingElements.join(', ')}`);
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
        // Longer initial delay for mobile to ensure UI is stable
        const initialDelay = isMobile ? 2000 : 1000;
        
        // Initial delay to let the page begin rendering
        initialDelayRef.current = setTimeout(() => {
          console.log(`FirstVisitTutorial: Checking elements for ${isMobile ? 'mobile' : 'desktop'} view...`);
          
          // Start checking for elements to be ready
          elementCheckIntervalRef.current = setInterval(() => {
            if (areTargetElementsReady()) {
              console.log("FirstVisitTutorial: All tutorial target elements are ready, showing tutorial");
              clearInterval(elementCheckIntervalRef.current);
              elementCheckIntervalRef.current = null;
              
              // One final short delay to ensure elements are rendered properly
              // Use a longer delay for mobile as animations may take longer
              setTimeout(() => {
                setShowTutorial(true);
              }, isMobile ? 800 : 500);
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
          
        }, initialDelay);
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
  }, [isClient, isMobile]);

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
      
      // Add a function to reset tutorial state
      window.resetPortfolioTutorial = () => {
        try {
          localStorage.removeItem(TUTORIAL_SHOWN_KEY);
          console.log("Tutorial state reset - will show next time page loads");
        } catch (error) {
          console.error("Error resetting tutorial state:", error);
        }
      };
      
      // Add a function to test the tutorial on mobile or desktop specifically
      window.testMobileTutorial = () => {
        setIsMobile(true);
        setShowTutorial(true);
        console.log("Showing tutorial in mobile mode - waiting for mobile elements to load");
        
        // Wait a moment to make sure all mobile elements are rendered
        setTimeout(() => {
          const mobileConnectionsElement = document.getElementById('mobile-connections-tutorial-target');
          if (mobileConnectionsElement) {
            console.log("Mobile connections element found:", mobileConnectionsElement);
          } else {
            console.warn("Mobile connections element NOT found. Make sure you're in mobile view!");
          }
        }, 500);
      };
      
      window.testDesktopTutorial = () => {
        setIsMobile(false);
        setShowTutorial(true);
        console.log("Showing tutorial in desktop mode");
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showPortfolioTutorial;
        delete window.resetPortfolioTutorial;
        delete window.testMobileTutorial;
        delete window.testDesktopTutorial;
      }
    };
  }, [isClient]);

  return showTutorial ? <TutorialOverlay onClose={handleCloseTutorial} /> : null;
}; 