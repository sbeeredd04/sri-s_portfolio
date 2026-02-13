'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Responsive Bundle Optimization Hook
 * 
 * Dynamically loads features based on device type and screen size
 * Reduces bundle size on mobile by deferring desktop-heavy components
 * 
 * @returns {Object} Device and breakpoint information
 * @returns {string} device - 'mobile' | 'tablet' | 'desktop'
 * @returns {number} width - Current viewport width
 * @returns {number} height - Current viewport height
 * @returns {boolean} isMobile - Is device mobile
 * @returns {boolean} isTablet - Is device tablet
 * @returns {boolean} isDesktop - Is device desktop
 * @returns {boolean} shouldLoad3D - Whether to load 3D components
 * @returns {boolean} shouldLoadParticles - Whether to load particle effects
 * @returns {boolean} shouldLoadAnimations - Whether to load heavy animations
 */
export function useResponsiveBundle() {
  const [breakpoint, setBreakpoint] = useState({
    device: 'desktop',
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    shouldLoad3D: true,
    shouldLoadParticles: true,
    shouldLoadAnimations: true,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const calculateBreakpoint = useCallback(() => {
    if (!isClient) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Device classification
    let device = 'desktop';
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (width < 640) {
      device = 'mobile';
      isMobile = true;
    } else if (width < 1024) {
      device = 'tablet';
      isTablet = true;
    } else {
      device = 'desktop';
      isDesktop = true;
    }

    // Feature loading based on device
    const shouldLoad3D = isDesktop || (isTablet && height > 800);
    const shouldLoadParticles = !isMobile; // Skip particles on mobile
    const shouldLoadAnimations = true; // Always load, but with reduced complexity on mobile

    setBreakpoint({
      device,
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      shouldLoad3D,
      shouldLoadParticles,
      shouldLoadAnimations,
    });
  }, [isClient]);

  // Initial calculation
  useEffect(() => {
    calculateBreakpoint();
  }, [calculateBreakpoint]);

  // Recalculate on resize
  useEffect(() => {
    window.addEventListener('resize', calculateBreakpoint);
    return () => window.removeEventListener('resize', calculateBreakpoint);
  }, [calculateBreakpoint]);

  return breakpoint;
}

/**
 * Hook to conditionally load a component chunk
 * Useful for deferring heavy components based on conditions
 * 
 * @param {boolean} shouldLoad - Whether to load the component
 * @param {() => Promise<any>} importFn - Dynamic import function
 * @returns {Object} Loading state
 * @returns {boolean} isLoaded - Has component been loaded
 * @returns {any} Component - The imported component
 * @returns {Error} error - Any loading error
 */
export function useConditionalChunk(shouldLoad, importFn) {
  const [state, setState] = useState({
    isLoaded: false,
    Component: null,
    error: null,
  });

  useEffect(() => {
    if (!shouldLoad) return;

    let isMounted = true;

    importFn()
      .then(module => {
        if (isMounted) {
          setState({
            isLoaded: true,
            Component: module.default,
            error: null,
          });
        }
      })
      .catch(error => {
        if (isMounted) {
          console.error('Failed to load chunk:', error);
          setState({
            isLoaded: false,
            Component: null,
            error,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldLoad, importFn]);

  return state;
}

/**
 * Preload critical chunks for faster navigation
 * Preload chunks that are likely to be visited next
 * 
 * @param {string[]} chunkNames - Names of chunks to preload (e.g., ['about', 'projects'])
 */
export function usePreloadChunks(chunkNames) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    chunkNames.forEach(chunkName => {
      // Create a link tag to preload the chunk
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/_next/static/chunks/${chunkName}.js`;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }, [chunkNames]);
}

export default useResponsiveBundle;
