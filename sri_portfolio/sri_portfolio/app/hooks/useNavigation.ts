'use client';

/**
 * useNavigation Hook
 * Provides easy access to navigation state and actions
 * 
 * @returns {Object} Navigation state and actions
 * @returns {string} currentSection - Currently active section
 * @returns {string} activeTab - Currently active tab in the section
 * @returns {Array<string>} navigationHistory - Array of visited sections
 * @returns {boolean} canGoBack - Whether back navigation is available
 * @returns {boolean} canGoForward - Whether forward navigation is available
 * @returns {Function} navigate - Navigate to a section (section: string, tab?: string) => void
 * @returns {Function} goBack - Go back in navigation history () => void
 * @returns {Function} goForward - Go forward in navigation history () => void
 * @returns {Function} setTab - Change active tab (tab: string) => void
 *
 * @example
 * ```tsx
 * import { useNavigation } from '@/app/hooks/useNavigation';
 * 
 * export function MyComponent() {
 *   const { navigate, currentSection, canGoBack, goBack } = useNavigation();
 *   
 *   return (
 *     <div>
 *       <p>Current: {currentSection}</p>
 *       <button onClick={() => navigate('about', 'profile')}>
 *         Go to About
 *       </button>
 *       {canGoBack && <button onClick={goBack}>Back</button>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useNavigationContext } from '@/app/contexts/NavigationContext';

export function useNavigation() {
  const {
    activeSection,
    activeTab,
    navigationHistory,
    canGoBack,
    canGoForward,
    navigate,
    setTab,
    goBack,
    goForward,
  } = useNavigationContext();

  return {
    currentSection: activeSection,
    activeTab,
    navigationHistory,
    canGoBack,
    canGoForward,
    navigate,
    setTab,
    goBack,
    goForward,
  };
}
