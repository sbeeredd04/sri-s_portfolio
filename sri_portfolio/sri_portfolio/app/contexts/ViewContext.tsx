'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * View state managed by ViewContext
 * Manages which main views/sections are displayed
 */
export interface ViewState {
  showLoader: boolean;
  showJourney: boolean;
  showMainPortfolio: boolean;
  isTransitioning: boolean;
}

/**
 * View context actions and state
 */
export interface ViewContextType extends ViewState {
  setShowLoader: (show: boolean) => void;
  setShowJourney: (show: boolean) => void;
  setShowMainPortfolio: (show: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  toggleView: (view: keyof Omit<ViewState, 'isTransitioning'>) => void;
  resetView: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

/**
 * ViewProvider component
 * Manages centralized view state for loader, journey, and portfolio views
 *
 * @example
 * ```tsx
 * <ViewProvider>
 *   <App />
 * </ViewProvider>
 * ```
 */
export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [showJourney, setShowJourney] = useState<boolean>(false);
  const [showMainPortfolio, setShowMainPortfolio] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  /**
   * Toggle a view on/off
   */
  const toggleView = useCallback(
    (view: keyof Omit<ViewState, 'isTransitioning'>) => {
      switch (view) {
        case 'showLoader':
          setShowLoader(prev => !prev);
          break;
        case 'showJourney':
          setShowJourney(prev => !prev);
          break;
        case 'showMainPortfolio':
          setShowMainPortfolio(prev => !prev);
          break;
      }
    },
    []
  );

  /**
   * Reset view to initial state
   */
  const resetView = useCallback(() => {
    setShowLoader(true);
    setShowJourney(false);
    setShowMainPortfolio(false);
    setIsTransitioning(false);
  }, []);

  const value: ViewContextType = {
    showLoader,
    showJourney,
    showMainPortfolio,
    isTransitioning,
    setShowLoader,
    setShowJourney,
    setShowMainPortfolio,
    setIsTransitioning,
    toggleView,
    resetView,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

/**
 * Hook to use ViewContext
 * @returns ViewContextType
 * @throws Error if used outside of ViewProvider
 *
 * @example
 * ```tsx
 * const { showLoader, setShowLoader } = useViewContext();
 * ```
 */
export function useViewContext(): ViewContextType {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewContext must be used within ViewProvider');
  }
  return context;
}
