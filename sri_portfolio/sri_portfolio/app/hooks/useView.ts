/**
 * useView Hook
 * Provides easy access to view state and actions
 * Manages which main views (loader, journey, portfolio) are displayed
 * 
 * @returns {Object} View state and actions
 * @returns {boolean} showLoader - Whether the initial loader is displayed
 * @returns {boolean} showJourney - Whether the 3D journey view is displayed
 * @returns {boolean} showMainPortfolio - Whether the main portfolio view is displayed
 * @returns {boolean} isTransitioning - Whether currently transitioning between views
 * @returns {Function} setShowLoader - Show/hide loader (show: boolean) => void
 * @returns {Function} setShowJourney - Show/hide journey (show: boolean) => void
 * @returns {Function} setShowMainPortfolio - Show/hide portfolio (show: boolean) => void
 * @returns {Function} setIsTransitioning - Set transition state (transitioning: boolean) => void
 * @returns {Function} toggleView - Toggle a view (view: 'showLoader' | 'showJourney' | 'showMainPortfolio') => void
 * @returns {Function} resetView - Reset all views to initial state () => void
 *
 * @example
 * ```tsx
 * import { useView } from '@/app/hooks/useView';
 * 
 * export function MyComponent() {
 *   const { 
 *     showLoader, 
 *     showMainPortfolio,
 *     setShowLoader,
 *     setShowMainPortfolio 
 *   } = useView();
 *   
 *   return (
 *     <div>
 *       {showLoader && <Loader />}
 *       {showMainPortfolio && <Portfolio />}
 *     </div>
 *   );
 * }
 * ```
 */
'use client';

import { useViewContext } from '@/app/contexts/ViewContext';

export function useView() {
  const {
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
  } = useViewContext();

  return {
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
}
