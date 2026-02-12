'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Settings state managed by SettingsContext
 * Stores global application settings
 */
export interface SettingsState {
  isSoundEnabled: boolean;
  currentBackground: string;
  showPlayer: boolean;
  isMobile: boolean;
}

/**
 * Settings context actions and state
 */
export interface SettingsContextType extends SettingsState {
  toggleSound: () => void;
  changeBackground: (background: string) => void;
  togglePlayer: () => void;
  setIsMobile: (isMobile: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

/**
 * SettingsProvider component
 * Manages centralized settings state across the application
 * Handles responsive breakpoints and persists settings to localStorage
 *
 * @example
 * ```tsx
 * <SettingsProvider>
 *   <App />
 * </SettingsProvider>
 * ```
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [currentBackground, setCurrentBackground] = useState<string>('default');
  const [showPlayer, setShowPlayer] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('soundEnabled');
      const savedBackground = localStorage.getItem('currentBackground');
      const savedPlayer = localStorage.getItem('showPlayer');

      if (savedSound !== null) setIsSoundEnabled(JSON.parse(savedSound));
      if (savedBackground) setCurrentBackground(savedBackground);
      if (savedPlayer !== null) setShowPlayer(JSON.parse(savedPlayer));

      // Check for mobile device
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  /**
   * Toggle sound on/off and persist to localStorage
   */
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundEnabled', JSON.stringify(newValue));
      }
      return newValue;
    });
  }, []);

  /**
   * Change background and persist to localStorage
   */
  const changeBackground = useCallback((background: string) => {
    setCurrentBackground(background);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentBackground', background);
    }
  }, []);

  /**
   * Toggle player visibility and persist to localStorage
   */
  const togglePlayer = useCallback(() => {
    setShowPlayer(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('showPlayer', JSON.stringify(newValue));
      }
      return newValue;
    });
  }, []);

  /**
   * Set mobile state (called by useBreakpoint hook)
   */
  const handleSetIsMobile = useCallback((mobile: boolean) => {
    setIsMobile(mobile);
  }, []);

  const value: SettingsContextType = {
    isSoundEnabled,
    currentBackground,
    showPlayer,
    isMobile,
    toggleSound,
    changeBackground,
    togglePlayer,
    setIsMobile: handleSetIsMobile,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use SettingsContext
 * @returns SettingsContextType
 * @throws Error if used outside of SettingsProvider
 *
 * @example
 * ```tsx
 * const { isSoundEnabled, toggleSound } = useSettingsContext();
 * ```
 */
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettingsContext must be used within SettingsProvider'
    );
  }
  return context;
}
