'use client';

/**
 * useBreakpoint Hook
 * Provides reactive breakpoint detection for responsive components
 * Automatically updates on window resize
 * 
 * @returns {Object} Breakpoint state
 * @returns {boolean} isMobile - Whether device/window is mobile (<768px)
 * @returns {boolean} isTablet - Whether device/window is tablet (768px-1024px)
 * @returns {boolean} isDesktop - Whether device/window is desktop (>1024px)
 *
 * @example
 * ```tsx
 * import { useBreakpoint } from '@/app/hooks/useBreakpoint';
 * 
 * export function MyComponent() {
 *   const { isMobile, isTablet, isDesktop } = useBreakpoint();
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       {isDesktop && <DesktopLayout />}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isMobile, setIsMobileLocal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      const desktop = width >= 1024;

      setIsMobileLocal(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
    };

    handleResize(); // Call once on mount
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
