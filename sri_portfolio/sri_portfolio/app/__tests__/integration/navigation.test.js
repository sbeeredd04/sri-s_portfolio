/**
 * Integration Tests
 * Tests for complete user workflows and interactions
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Mock full page navigation flow
 */
function PortfolioNavigationFlow() {
  const [activeSection, setActiveSection] = useState('home')
  const [activeTab, setActiveTab] = useState('profile')

  const sections = {
    home: {
      title: 'Welcome',
      tabs: ['intro'],
    },
    about: {
      title: 'About Me',
      tabs: ['profile', 'education', 'hobbies'],
    },
    projects: {
      title: 'Projects',
      tabs: ['all', 'deployed'],
    },
    skills: {
      title: 'Skills',
      tabs: ['overview', 'github'],
    },
  }

  const currentSection = sections[activeSection]

  return (
    <div data-testid="portfolio-app">
      {/* Navigation */}
      <nav data-testid="main-nav">
        {Object.keys(sections).map((section) => (
          <button
            key={section}
            onClick={() => {
              setActiveSection(section)
              setActiveTab(sections[section].tabs[0])
            }}
            data-testid={`nav-${section}`}
            aria-selected={activeSection === section}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </nav>

      {/* Section Content */}
      <main data-testid="main-content">
        <h1 data-testid="section-title">{currentSection.title}</h1>

        {/* Tabs */}
        {currentSection.tabs.length > 1 && (
          <div data-testid="tabs" role="tablist">
            {currentSection.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
                aria-selected={activeTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div data-testid="tab-content">
          {activeSection === 'about' && activeTab === 'profile' && <div>Profile content</div>}
          {activeSection === 'about' && activeTab === 'education' && <div>Education content</div>}
          {activeSection === 'projects' && activeTab === 'all' && <div>All projects</div>}
          {activeSection === 'projects' && activeTab === 'deployed' && <div>Deployed projects</div>}
          {activeSection === 'skills' && activeTab === 'overview' && <div>Skills overview</div>}
          {activeSection === 'skills' && activeTab === 'github' && <div>GitHub stats</div>}
          {activeSection === 'home' && <div>Home content</div>}
        </div>
      </main>
    </div>
  )
}

describe('Integration Tests', () => {
  /**
   * Test: Full page navigation flow
   * Verifies user can navigate between all sections and tabs
   */
  it('should handle full page navigation flow', () => {
    render(<PortfolioNavigationFlow />)

    // Start at home
    expect(screen.getByTestId('section-title')).toHaveTextContent('Welcome')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Home content')

    // Navigate to About
    fireEvent.click(screen.getByTestId('nav-about'))
    expect(screen.getByTestId('section-title')).toHaveTextContent('About Me')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile content')

    // Switch to Education tab
    fireEvent.click(screen.getByTestId('tab-education'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Education content')

    // Navigate to Projects
    fireEvent.click(screen.getByTestId('nav-projects'))
    expect(screen.getByTestId('section-title')).toHaveTextContent('Projects')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('All projects')

    // Switch to Deployed tab
    fireEvent.click(screen.getByTestId('tab-deployed'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Deployed projects')

    // Navigate to Skills
    fireEvent.click(screen.getByTestId('nav-skills'))
    expect(screen.getByTestId('section-title')).toHaveTextContent('Skills')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Skills overview')

    // Switch to GitHub tab
    fireEvent.click(screen.getByTestId('tab-github'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('GitHub stats')
  })

  /**
   * Test: Navigation buttons show correct active state
   * Verifies accessibility attributes are updated during navigation
   */
  it('should update navigation button states', () => {
    render(<PortfolioNavigationFlow />)

    // Initially home is active
    expect(screen.getByTestId('nav-home')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('nav-about')).toHaveAttribute('aria-selected', 'false')

    // Navigate to about
    fireEvent.click(screen.getByTestId('nav-about'))
    expect(screen.getByTestId('nav-home')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('nav-about')).toHaveAttribute('aria-selected', 'true')

    // Navigate to projects
    fireEvent.click(screen.getByTestId('nav-projects'))
    expect(screen.getByTestId('nav-about')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('nav-projects')).toHaveAttribute('aria-selected', 'true')
  })

  /**
   * Test: Tab switching updates visible content
   * Verifies content changes when tabs are switched
   */
  it('should update tab content on selection', () => {
    render(<PortfolioNavigationFlow />)

    // Go to about section
    fireEvent.click(screen.getByTestId('nav-about'))

    // Start with profile tab
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile content')

    // Switch tabs
    fireEvent.click(screen.getByTestId('tab-education'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Education content')

    fireEvent.click(screen.getByTestId('tab-profile'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile content')
  })

  /**
   * Test: Tab state resets when navigating to new section
   * Verifies tabs reset to first tab when section changes
   */
  it('should reset to first tab when changing sections', () => {
    render(<PortfolioNavigationFlow />)

    // Go to about and switch to education
    fireEvent.click(screen.getByTestId('nav-about'))
    fireEvent.click(screen.getByTestId('tab-education'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Education content')

    // Navigate to projects - should reset to "all" tab
    fireEvent.click(screen.getByTestId('nav-projects'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('All projects')
  })

  /**
   * Test: Multiple navigation sequences
   * Verifies navigation works correctly over multiple transitions
   */
  it('should handle complex navigation sequences', () => {
    render(<PortfolioNavigationFlow />)

    const sequence = [
      { nav: 'nav-about', expectedTitle: 'About Me', expectedContent: 'Profile content' },
      { tab: 'tab-education', expectedContent: 'Education content' },
      { nav: 'nav-projects', expectedTitle: 'Projects', expectedContent: 'All projects' },
      { tab: 'tab-deployed', expectedContent: 'Deployed projects' },
      { nav: 'nav-skills', expectedTitle: 'Skills', expectedContent: 'Skills overview' },
      { nav: 'nav-home', expectedTitle: 'Welcome', expectedContent: 'Home content' },
    ]

    sequence.forEach(({ nav, tab, expectedTitle, expectedContent }) => {
      if (nav) fireEvent.click(screen.getByTestId(nav))
      if (tab) fireEvent.click(screen.getByTestId(tab))

      if (expectedTitle) {
        expect(screen.getByTestId('section-title')).toHaveTextContent(expectedTitle)
      }
      if (expectedContent) {
        expect(screen.getByTestId('tab-content')).toHaveTextContent(expectedContent)
      }
    })
  })

  /**
   * Test: Rapid navigation changes
   * Verifies UI handles rapid user interactions
   */
  it('should handle rapid navigation changes', () => {
    render(<PortfolioNavigationFlow />)

    // Rapidly click through sections
    fireEvent.click(screen.getByTestId('nav-about'))
    fireEvent.click(screen.getByTestId('nav-projects'))
    fireEvent.click(screen.getByTestId('nav-skills'))
    fireEvent.click(screen.getByTestId('nav-about'))

    // Final state should be correct
    expect(screen.getByTestId('section-title')).toHaveTextContent('About Me')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile content')
  })
})
