'use client';

import { Suspense, lazy } from 'react';

const LoaderComponent = lazy(() => import('./Loader'));

/**
 * LazyLoader Component
 * Wraps the heavy Loader component with React.lazy() and Suspense
 * Reduces initial bundle size by ~5-8KB
 */
export function LazyLoader(props) {
  return (
    <Suspense fallback={<LoaderFallback />}>
      <LoaderComponent {...props} />
    </Suspense>
  );
}

/**
 * Fallback UI shown while Loader chunk is loading
 * Minimal DOM footprint for fast rendering
 */
function LoaderFallback() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Minimal spinner animation */}
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading experience...</p>
      </div>
    </div>
  );
}

export default LazyLoader;
