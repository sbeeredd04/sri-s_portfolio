'use client';

import { Suspense, lazy } from 'react';

// Lazy-load all sections for route-based splitting
const LazyAboutSection = lazy(() => import('./AboutSection'));
const LazyProjectsSection = lazy(() => import('./ProjectsSection'));
const LazySkillsSection = lazy(() => import('./SkillsSection'));
const LazyExperienceSection = lazy(() => import('./ExperienceSection'));
const LazyBlogSection = lazy(() => import('./BlogSection'));
const LazyContactSection = lazy(() => import('./ContactSection'));

/**
 * Generic Section Wrapper with Suspense
 * Provides consistent loading state across all sections
 */
function SectionSuspense({ children, sectionName }) {
  return (
    <Suspense fallback={<SectionLoadingFallback sectionName={sectionName} />}>
      {children}
    </Suspense>
  );
}

/**
 * Generic loading fallback for sections
 * Appears while section chunk is being loaded
 */
function SectionLoadingFallback({ sectionName = 'Section' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-lg animate-pulse"></div>
              <div className="absolute inset-1 border-2 border-blue-500/40 rounded-full animate-spin"
                   style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-3 border border-purple-500/40 rounded-full animate-spin"
                   style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Loading {sectionName}</h2>
        <p className="text-gray-400 text-sm">Preparing content...</p>
        <div className="mt-4 flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
               style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
               style={{ animationDelay: '100ms' }}></div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
               style={{ animationDelay: '200ms' }}></div>
        </div>
      </div>
    </div>
  );
}

// Export wrapped components with Suspense boundaries

export const AboutSectionLazy = (props) => (
  <SectionSuspense sectionName="About">
    <LazyAboutSection {...props} />
  </SectionSuspense>
);

export const ProjectsSectionLazy = (props) => (
  <SectionSuspense sectionName="Projects">
    <LazyProjectsSection {...props} />
  </SectionSuspense>
);

export const SkillsSectionLazy = (props) => (
  <SectionSuspense sectionName="Skills">
    <LazySkillsSection {...props} />
  </SectionSuspense>
);

export const ExperienceSectionLazy = (props) => (
  <SectionSuspense sectionName="Experience">
    <LazyExperienceSection {...props} />
  </SectionSuspense>
);

export const BlogSectionLazy = (props) => (
  <SectionSuspense sectionName="Blog">
    <LazyBlogSection {...props} />
  </SectionSuspense>
);

export const ContactSectionLazy = (props) => (
  <SectionSuspense sectionName="Contact">
    <LazyContactSection {...props} />
  </SectionSuspense>
);

export { SectionLoadingFallback };
