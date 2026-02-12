'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Navigation state managed by NavigationContext
 * Tracks section, tab, and navigation history
 */
export interface NavigationState {
  activeSection: string;
  activeTab: string;
  navigationHistory: string[];
  historyIndex: number;
}

/**
 * Navigation context actions
 */
export interface NavigationContextType {
  // State
  activeSection: string;
  activeTab: string;
  navigationHistory: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Actions
  navigate: (section: string, tab?: string) => void;
  setTab: (tab: string) => void;
  goBack: () => void;
  goForward: () => void;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

/**
 * NavigationProvider component
 * Manages centralized navigation state across the application
 *
 * @example
 * ```tsx
 * <NavigationProvider>
 *   <App />
 * </NavigationProvider>
 * ```
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  /**
   * Navigate to a new section and optionally change tab
   */
  const navigate = useCallback((section: string, tab?: string) => {
    setActiveSection(section);
    if (tab) {
      setActiveTab(tab);
    }
    
    // Add to history, removing any forward history
    setNavigationHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(section);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  /**
   * Set the active tab within the current section
   */
  const setTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  /**
   * Go back in navigation history
   */
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setActiveSection(navigationHistory[newIndex]);
    }
  }, [historyIndex, navigationHistory]);

  /**
   * Go forward in navigation history
   */
  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setActiveSection(navigationHistory[newIndex]);
    }
  }, [historyIndex, navigationHistory]);

  /**
   * Clear navigation history
   */
  const clearHistory = useCallback(() => {
    setNavigationHistory(['home']);
    setHistoryIndex(0);
    setActiveSection('home');
  }, []);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < navigationHistory.length - 1;

  const value: NavigationContextType = {
    activeSection,
    activeTab,
    navigationHistory,
    canGoBack,
    canGoForward,
    navigate,
    setTab,
    goBack,
    goForward,
    clearHistory,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to use NavigationContext
 * @returns NavigationContextType
 * @throws Error if used outside of NavigationProvider
 *
 * @example
 * ```tsx
 * const { navigate, activeSection } = useNavigation();
 * navigate('about', 'profile');
 * ```
 */
export function useNavigationContext(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      'useNavigationContext must be used within NavigationProvider'
    );
  }
  return context;
}
