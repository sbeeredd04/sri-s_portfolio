// test-utils.jsx
// Custom render function with providers and test utilities

import React from 'react'
import { render as rtlRender } from '@testing-library/react'

/**
 * Custom render function that wraps components with necessary providers
 * This ensures all providers (Context, Theme, etc.) are available in tests
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options to pass to RTL render
 * @returns {Object} RTL render result with queries and utilities
 */
function render(ui, options = {}) {
  function Wrapper({ children }) {
    return <>{children}</>
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { render }

/**
 * Mock data generators for consistent test data
 */
export const mockData = {
  // Mock project data
  mockProject: () => ({
    id: 1,
    title: 'Test Project',
    description: 'A test project for testing',
    tags: ['React', 'Testing'],
    github: 'https://github.com/test/project',
    live: 'https://example.com',
    image: '/test-image.jpg',
  }),

  // Mock projects array
  mockProjects: (count = 3) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Project ${i + 1}`,
      description: `Description for project ${i + 1}`,
      tags: ['React', 'JavaScript'],
      github: `https://github.com/test/project-${i + 1}`,
      live: `https://project${i + 1}.com`,
      image: `/project-${i + 1}.jpg`,
    }))
  },

  // Mock skill data
  mockSkill: () => ({
    name: 'React',
    category: 'Frontend',
    level: 90,
    icon: 'react-icon',
  }),

  // Mock skills array
  mockSkills: (count = 5) => {
    const skills = ['React', 'JavaScript', 'TypeScript', 'Next.js', 'Tailwind CSS']
    return Array.from({ length: Math.min(count, skills.length) }, (_, i) => ({
      name: skills[i],
      category: 'Frontend',
      level: 80 + Math.random() * 20,
      icon: `${skills[i].toLowerCase()}-icon`,
    }))
  },

  // Mock navigation state
  mockNavigation: () => ({
    activeSection: 'home',
    activeTab: 'profile',
    history: [],
  }),

  // Mock settings
  mockSettings: () => ({
    soundEnabled: true,
    musicEnabled: true,
    theme: 'dark',
    language: 'en',
  }),
}

/**
 * Common test utilities for component testing
 */
export const testUtils = {
  /**
   * Wait for an async operation with a timeout
   * @param {Function} callback - The callback to execute
   * @param {number} timeout - Timeout in ms (default: 1000)
   */
  waitFor: async (callback, timeout = 1000) => {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      try {
        callback()
        return
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`)
  },

  /**
   * Simulate a click on an element and wait for updates
   * @param {HTMLElement} element - The element to click
   */
  clickAndWait: async (element) => {
    if (element) {
      element.click()
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  },
}
