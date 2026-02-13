'use client';

import { Suspense, lazy } from 'react';

const Journey3DComponent = lazy(() => import('./Journey3DContainer'));

/**
 * LazyJourney3D Component
 * Wraps the heavy Journey3D component with React.lazy() and Suspense
 * Reduces initial bundle size by ~8-12KB
 */
export function LazyJourney3D(props) {
  return (
    <Suspense fallback={<Journey3DFallback />}>
      <Journey3DComponent {...props} />
    </Suspense>
  );
}

/**
 * Fallback UI shown while Journey3D chunk is loading
 * Provides visual feedback without blocking interaction
 */
function Journey3DFallback() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-blue-500/20 rounded-full blur-xl"
            style={{
              width: Math.random() * 200 + 50 + 'px',
              height: Math.random() * 200 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <div className="inline-block">
            <div className="relative w-32 h-32">
              {/* Orbiting rings */}
              <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-spin"
                   style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-4 border-2 border-purple-500/20 rounded-full animate-spin"
                   style={{ animationDirection: 'reverse', animationDuration: '6s' }}></div>
              <div className="absolute inset-8 border-2 border-cyan-500/10 rounded-full animate-spin"
                   style={{ animationDuration: '8s' }}></div>
              
              {/* Center sphere */}
              <div className="absolute inset-12 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-full blur-lg"></div>
            </div>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">Initializing 3D Journey</h3>
        <p className="text-sm text-gray-400">Preparing visualization...</p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>
    </div>
  );
}

export default LazyJourney3D;
