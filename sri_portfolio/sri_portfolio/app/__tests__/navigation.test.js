/**
 * Navigation Tests
 * Tests for navigation between different sections and tabs
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Navigation and Tab Switching', () => {
  /**
   * Test: Can navigate between sections
   * Verifies user can switch between main sections (home, about, projects, skills)
   */
  it('should handle section navigation', () => {
    function NavigationTest() {
      const [activeSection, setActiveSection] = useState('home')

      return (
        <div>
          <button onClick={() => setActiveSection('home')} data-testid="nav-home">
            Home
          </button>
          <button onClick={() => setActiveSection('about')} data-testid="nav-about">
            About
          </button>
          <button onClick={() => setActiveSection('projects')} data-testid="nav-projects">
            Projects
          </button>
          <button onClick={() => setActiveSection('skills')} data-testid="nav-skills">
            Skills
          </button>
          <div data-testid="section-display">{activeSection}</div>
        </div>
      )
    }

    render(<NavigationTest />)

    // Verify initial state
    expect(screen.getByTestId('section-display')).toHaveTextContent('home')

    // Navigate to About
    fireEvent.click(screen.getByTestId('nav-about'))
    expect(screen.getByTestId('section-display')).toHaveTextContent('about')

    // Navigate to Projects
    fireEvent.click(screen.getByTestId('nav-projects'))
    expect(screen.getByTestId('section-display')).toHaveTextContent('projects')

    // Navigate to Skills
    fireEvent.click(screen.getByTestId('nav-skills'))
    expect(screen.getByTestId('section-display')).toHaveTextContent('skills')

    // Navigate back to Home
    fireEvent.click(screen.getByTestId('nav-home'))
    expect(screen.getByTestId('section-display')).toHaveTextContent('home')
  })

  /**
   * Test: Tab switching within a section works
   * Verifies tabs can be switched and correct content displays
   */
  it('should handle tab switching within sections', () => {
    function TabSwitchingTest() {
      const [activeTab, setActiveTab] = useState('profile')

      return (
        <div>
          <button
            onClick={() => setActiveTab('profile')}
            data-testid="tab-profile"
            aria-selected={activeTab === 'profile'}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('education')}
            data-testid="tab-education"
            aria-selected={activeTab === 'education'}
          >
            Education
          </button>
          <button
            onClick={() => setActiveTab('hobbies')}
            data-testid="tab-hobbies"
            aria-selected={activeTab === 'hobbies'}
          >
            Hobbies
          </button>
          <div data-testid="tab-content" role="tabpanel">
            {activeTab === 'profile' && <div>Profile content</div>}
            {activeTab === 'education' && <div>Education content</div>}
            {activeTab === 'hobbies' && <div>Hobbies content</div>}
          </div>
        </div>
      )
    }

    render(<TabSwitchingTest />)

    // Verify initial tab
    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile content')

    // Switch to Education
    fireEvent.click(screen.getByTestId('tab-education'))
    expect(screen.getByTestId('tab-education')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Education content')

    // Switch to Hobbies
    fireEvent.click(screen.getByTestId('tab-hobbies'))
    expect(screen.getByTestId('tab-hobbies')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Hobbies content')

    // Verify accessibility attributes
    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'false')
  })

  /**
   * Test: Navigation history tracks correctly
   * Verifies navigation history is maintained
   */
  it('should track navigation history', () => {
    function HistoryTest() {
      const [history, setHistory] = useState(['home'])
      const [currentIndex, setCurrentIndex] = useState(0)

      const navigateTo = (section) => {
        const newHistory = history.slice(0, currentIndex + 1)
        newHistory.push(section)
        setHistory(newHistory)
        setCurrentIndex(newHistory.length - 1)
      }

      const canGoBack = currentIndex > 0
      const canGoForward = currentIndex < history.length - 1

      return (
        <div>
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={!canGoBack}
            data-testid="btn-back"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={!canGoForward}
            data-testid="btn-forward"
          >
            Forward
          </button>
          <button onClick={() => navigateTo('about')} data-testid="nav-about">
            Go to About
          </button>
          <div data-testid="current-page">{history[currentIndex]}</div>
          <div data-testid="history">{JSON.stringify(history)}</div>
        </div>
      )
    }

    render(<HistoryTest />)

    // Verify initial state
    expect(screen.getByTestId('current-page')).toHaveTextContent('home')
    expect(screen.getByTestId('btn-back')).toBeDisabled()
    expect(screen.getByTestId('btn-forward')).toBeDisabled()

    // Navigate to About
    fireEvent.click(screen.getByTestId('nav-about'))
    expect(screen.getByTestId('current-page')).toHaveTextContent('about')
    expect(screen.getByTestId('btn-back')).not.toBeDisabled()

    // Go back
    fireEvent.click(screen.getByTestId('btn-back'))
    expect(screen.getByTestId('current-page')).toHaveTextContent('home')
    expect(screen.getByTestId('btn-forward')).not.toBeDisabled()
  })

  /**
   * Test: Back/forward buttons work correctly
   * Verifies browser-like back and forward navigation
   */
  it('should support back and forward navigation', () => {
    function NavigationStackTest() {
      const [stack, setStack] = useState(['home'])
      const [position, setPosition] = useState(0)

      const goBack = () => {
        if (position > 0) {
          setPosition(position - 1)
        }
      }

      const goForward = () => {
        if (position < stack.length - 1) {
          setPosition(position + 1)
        }
      }

      const navigateTo = (page) => {
        const newStack = stack.slice(0, position + 1)
        newStack.push(page)
        setStack(newStack)
        setPosition(newStack.length - 1)
      }

      return (
        <div>
          <button onClick={goBack} disabled={position === 0} data-testid="back">
            Back
          </button>
          <button onClick={goForward} disabled={position === stack.length - 1} data-testid="forward">
            Forward
          </button>
          <button onClick={() => navigateTo('about')} data-testid="to-about">
            To About
          </button>
          <button onClick={() => navigateTo('projects')} data-testid="to-projects">
            To Projects
          </button>
          <div data-testid="location">{stack[position]}</div>
        </div>
      )
    }

    render(<NavigationStackTest />)

    // Navigate: Home -> About -> Projects
    fireEvent.click(screen.getByTestId('to-about'))
    fireEvent.click(screen.getByTestId('to-projects'))
    expect(screen.getByTestId('location')).toHaveTextContent('projects')

    // Go back twice
    fireEvent.click(screen.getByTestId('back'))
    expect(screen.getByTestId('location')).toHaveTextContent('about')

    fireEvent.click(screen.getByTestId('back'))
    expect(screen.getByTestId('location')).toHaveTextContent('home')

    // Verify back is disabled at start
    expect(screen.getByTestId('back')).toBeDisabled()

    // Go forward
    fireEvent.click(screen.getByTestId('forward'))
    expect(screen.getByTestId('location')).toHaveTextContent('about')

    fireEvent.click(screen.getByTestId('forward'))
    expect(screen.getByTestId('location')).toHaveTextContent('projects')
    expect(screen.getByTestId('forward')).toBeDisabled()
  })
})
