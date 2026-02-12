/**
 * useSettings Hook
 * Provides easy access to global settings state and actions
 * Handles sound, background, player visibility, and mobile detection
 * 
 * @returns {Object} Settings state and actions
 * @returns {boolean} isSoundEnabled - Whether sound effects are enabled
 * @returns {string} currentBackground - Current background name/id
 * @returns {boolean} showPlayer - Whether the music player is visible
 * @returns {boolean} isMobile - Whether device is mobile (<768px width)
 * @returns {Function} toggleSound - Toggle sound on/off () => void
 * @returns {Function} changeBackground - Change background (background: string) => void
 * @returns {Function} togglePlayer - Toggle player visibility () => void
 *
 * @example
 * ```tsx
 * import { useSettings } from '@/app/hooks/useSettings';
 * 
 * export function MyComponent() {
 *   const { 
 *     isSoundEnabled, 
 *     toggleSound, 
 *     isMobile 
 *   } = useSettings();
 *   
 *   return (
 *     <div>
 *       <button onClick={toggleSound}>
 *         {isSoundEnabled ? 'Sound On' : 'Sound Off'}
 *       </button>
 *       {isMobile && <p>Mobile Layout</p>}
 *     </div>
 *   );
 * }
 * ```
 */
'use client';

import { useSettingsContext } from '@/app/contexts/SettingsContext';

export function useSettings() {
  const {
    isSoundEnabled,
    currentBackground,
    showPlayer,
    isMobile,
    toggleSound,
    changeBackground,
    togglePlayer,
  } = useSettingsContext();

  return {
    isSoundEnabled,
    currentBackground,
    showPlayer,
    isMobile,
    toggleSound,
    changeBackground,
    togglePlayer,
  };
}
