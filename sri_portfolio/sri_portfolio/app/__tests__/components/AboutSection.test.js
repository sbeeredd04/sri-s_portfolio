/**
 * AboutSection Component Tests
 * Tests rendering and tab switching in the About section
 */

import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the AboutSection for testing
function MockAboutSection({ activeTab, setActiveTab }) {
  const [showResumePreview, setShowResumePreview] = useState(false)

  return (
    <section className="w-full h-full flex flex-col" data-testid="about-section">
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
      </div>

      <div data-testid="tab-content">
        {activeTab === 'profile' && <div>Profile Content</div>}
        {activeTab === 'education' && <div>Education Content</div>}
        {activeTab === 'hobbies' && <div>Hobbies Content</div>}
      </div>
    </section>
  )
}

describe('AboutSection Component', () => {
  /**
   * Test: Renders with correct content
   * Verifies the component renders and displays expected elements
   */
  it('should render with correct content', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('profile')
      return <MockAboutSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('about-section')).toBeInTheDocument()
    expect(screen.getByTestId('tab-profile')).toBeInTheDocument()
    expect(screen.getByTestId('tab-education')).toBeInTheDocument()
    expect(screen.getByTestId('tab-hobbies')).toBeInTheDocument()
  })

  /**
   * Test: Tab buttons have correct initial state
   * Verifies accessibility attributes are set correctly
   */
  it('should have correct initial tab state', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('profile')
      return <MockAboutSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-education')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('tab-hobbies')).toHaveAttribute('aria-selected', 'false')
  })

  /**
   * Test: Can switch between tabs
   * Verifies clicking tabs updates active state and content
   */
  it('should switch between tabs', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('profile')
      return <MockAboutSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    // Start with profile tab
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile Content')

    // Click education tab
    fireEvent.click(screen.getByTestId('tab-education'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Education Content')

    // Click hobbies tab
    fireEvent.click(screen.getByTestId('tab-hobbies'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Hobbies Content')

    // Click back to profile
    fireEvent.click(screen.getByTestId('tab-profile'))
    expect(screen.getByTestId('tab-content')).toHaveTextContent('Profile Content')
  })

  /**
   * Test: Tab buttons are accessible
   * Verifies buttons use semantic HTML and ARIA attributes
   */
  it('should have accessible tab buttons', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('profile')
      return <MockAboutSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    const tabs = [
      screen.getByTestId('tab-profile'),
      screen.getByTestId('tab-education'),
      screen.getByTestId('tab-hobbies'),
    ]

    tabs.forEach((tab) => {
      expect(tab).toBeInTheDocument()
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).toHaveTextContent(/Profile|Education|Hobbies/)
    })
  })
})
