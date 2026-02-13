import { lazy, Suspense } from 'react';

/**
 * Lazy-loaded section components
 * Reduces initial bundle by lazy-loading each section on demand
 */

// Lazy load all sections
export const LazySections = {
  About: lazy(() => import('../sections/AboutSection')),
  Experience: lazy(() => import('../sections/ExperienceSection')),
  Projects: lazy(() => import('../sections/ProjectsSection')),
  Skills: lazy(() => import('../sections/SkillsSection')),
  Blog: lazy(() => import('../sections/BlogSection')),
  Contact: lazy(() => import('../sections/ContactSection')),
};

/**
 * Section fallback UI - minimal loading state
 */
export function SectionFallback() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper for lazy-loaded sections
 * Usage: <LazySectionWrapper section="About" {...props} />
 */
export function LazySectionWrapper({ section, ...props }) {
  const Component = LazySections[section];
  
  if (!Component) {
    console.warn(`Unknown section: ${section}`);
    return null;
  }

  return (
    <Suspense fallback={<SectionFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Pre-fetch a section's bundle
 * Call this on hover or route change to prioritize loading
 */
export async function prefetchSection(sectionName) {
  try {
    // Dynamic import to trigger bundle loading
    await import(`../sections/${sectionName}Section`);
  } catch (error) {
    console.warn(`Failed to prefetch section: ${sectionName}`, error);
  }
}

export default LazySections;
