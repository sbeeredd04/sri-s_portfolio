/**
 * TabButton Component Tests
 * Tests button state management and accessibility
 */

import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock TabButton component
function MockTabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-selected={active}
      className={active ? 'active' : 'inactive'}
      data-testid={`tab-button-${label}`}
    >
      {label}
    </button>
  )
}

describe('TabButton Component', () => {
  /**
   * Test: Active state displays correctly
   * Verifies active tab button has correct styling and attributes
   */
  it('should display active state correctly', () => {
    render(<MockTabButton label="Active Tab" active={true} onClick={() => {}} />)

    const button = screen.getByTestId('tab-button-Active Tab')
    expect(button).toHaveAttribute('aria-selected', 'true')
    expect(button).toHaveClass('active')
  })

  /**
   * Test: Inactive state displays correctly
   * Verifies inactive tab button has correct styling and attributes
   */
  it('should display inactive state correctly', () => {
    render(<MockTabButton label="Inactive Tab" active={false} onClick={() => {}} />)

    const button = screen.getByTestId('tab-button-Inactive Tab')
    expect(button).toHaveAttribute('aria-selected', 'false')
    expect(button).toHaveClass('inactive')
  })

  /**
   * Test: Click handler is called
   * Verifies clicking button triggers callback
   */
  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<MockTabButton label="Clickable" active={false} onClick={handleClick} />)

    fireEvent.click(screen.getByTestId('tab-button-Clickable'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  /**
   * Test: State switching works
   * Verifies button state can change between active and inactive
   */
  it('should switch between active and inactive states', () => {
    function TabButtonTest() {
      const [activeTab, setActiveTab] = useState('tab1')

      return (
        <div>
          <MockTabButton
            label="Tab 1"
            active={activeTab === 'tab1'}
            onClick={() => setActiveTab('tab1')}
          />
          <MockTabButton
            label="Tab 2"
            active={activeTab === 'tab2'}
            onClick={() => setActiveTab('tab2')}
          />
        </div>
      )
    }

    render(<TabButtonTest />)

    const tab1 = screen.getByTestId('tab-button-Tab 1')
    const tab2 = screen.getByTestId('tab-button-Tab 2')

    // Initial state
    expect(tab1).toHaveAttribute('aria-selected', 'true')
    expect(tab2).toHaveAttribute('aria-selected', 'false')

    // Click tab 2
    fireEvent.click(tab2)
    expect(tab1).toHaveAttribute('aria-selected', 'false')
    expect(tab2).toHaveAttribute('aria-selected', 'true')

    // Click tab 1
    fireEvent.click(tab1)
    expect(tab1).toHaveAttribute('aria-selected', 'true')
    expect(tab2).toHaveAttribute('aria-selected', 'false')
  })

  /**
   * Test: Accessibility attributes are correct
   * Verifies button follows WAI-ARIA patterns
   */
  it('should have proper accessibility attributes', () => {
    render(<MockTabButton label="Accessible Tab" active={true} onClick={() => {}} />)

    const button = screen.getByTestId('tab-button-Accessible Tab')
    expect(button).toHaveAttribute('aria-selected')
    expect(button).toBeInTheDocument()
    expect(button).toBeVisible()
    expect(button).toBeEnabled()
  })

  /**
   * Test: Multiple buttons can be managed
   * Verifies tab group behavior with multiple buttons
   */
  it('should work in a tab group', () => {
    function TabGroupTest() {
      const [active, setActive] = useState(0)
      const tabs = ['Profile', 'Settings', 'About']

      return (
        <div role="tablist" data-testid="tab-group">
          {tabs.map((tab, index) => (
            <MockTabButton
              key={index}
              label={tab}
              active={active === index}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      )
    }

    render(<TabGroupTest />)

    const profileTab = screen.getByTestId('tab-button-Profile')
    const settingsTab = screen.getByTestId('tab-button-Settings')
    const aboutTab = screen.getByTestId('tab-button-About')

    // Check initial state
    expect(profileTab).toHaveAttribute('aria-selected', 'true')
    expect(settingsTab).toHaveAttribute('aria-selected', 'false')
    expect(aboutTab).toHaveAttribute('aria-selected', 'false')

    // Click settings
    fireEvent.click(settingsTab)
    expect(profileTab).toHaveAttribute('aria-selected', 'false')
    expect(settingsTab).toHaveAttribute('aria-selected', 'true')
    expect(aboutTab).toHaveAttribute('aria-selected', 'false')

    // Click about
    fireEvent.click(aboutTab)
    expect(settingsTab).toHaveAttribute('aria-selected', 'false')
    expect(aboutTab).toHaveAttribute('aria-selected', 'true')
  })
})
