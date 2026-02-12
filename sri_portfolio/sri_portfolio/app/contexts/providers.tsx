'use client';

import React from 'react';
import { NavigationProvider } from './NavigationContext';
import { SettingsProvider } from './SettingsContext';
import { ViewProvider } from './ViewContext';

/**
 * RootProviders wrapper component
 * Combines all context providers in a single wrapper for easy application setup
 * 
 * Includes:
 * - NavigationProvider: Section and tab navigation with history
 * - SettingsProvider: Global settings (sound, background, player)
 * - ViewProvider: Main view state (loader, journey, portfolio)
 *
 * @example
 * ```tsx
 * // In your layout or root component
 * import { RootProviders } from '@/app/contexts/providers';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <RootProviders>
 *           {children}
 *         </RootProviders>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <SettingsProvider>
        <ViewProvider>
          {children}
        </ViewProvider>
      </SettingsProvider>
    </NavigationProvider>
  );
}
