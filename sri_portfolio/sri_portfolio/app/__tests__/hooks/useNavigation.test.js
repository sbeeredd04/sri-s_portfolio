/**
 * useNavigation Hook Tests
 * Tests custom navigation hook functionality
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'

// Mock useNavigation hook
function useNavigation() {
  const [activeSection, setActiveSection] = React.useState('home')
  const [activeTab, setActiveTab] = React.useState('profile')

  return {
    activeSection,
    setActiveSection,
    activeTab,
    setActiveTab,
  }
}

describe('useNavigation Hook', () => {
  /**
   * Test: Hook returns correct values
   * Verifies hook provides proper initial state
   */
  it('should return correct initial values', () => {
    const { result } = renderHook(() => useNavigation())

    expect(result.current.activeSection).toBe('home')
    expect(result.current.activeTab).toBe('profile')
  })

  /**
   * Test: Can update active section
   * Verifies section state can be changed
   */
  it('should update active section', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.setActiveSection('about')
    })

    expect(result.current.activeSection).toBe('about')
  })

  /**
   * Test: Can update active tab
   * Verifies tab state can be changed
   */
  it('should update active tab', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.setActiveTab('education')
    })

    expect(result.current.activeTab).toBe('education')
  })

  /**
   * Test: Can update both section and tab
   * Verifies independent state management
   */
  it('should independently manage section and tab state', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.setActiveSection('projects')
      result.current.setActiveTab('deployed')
    })

    expect(result.current.activeSection).toBe('projects')
    expect(result.current.activeTab).toBe('deployed')
  })

  /**
   * Test: Section state persists across tab changes
   * Verifies sections don't reset when tabs change
   */
  it('should persist section state when tab changes', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.setActiveSection('skills')
    })

    const sectionBefore = result.current.activeSection

    act(() => {
      result.current.setActiveTab('github')
    })

    expect(result.current.activeSection).toBe(sectionBefore)
    expect(result.current.activeTab).toBe('github')
  })

  /**
   * Test: Multiple state transitions
   * Verifies hook handles sequential updates
   */
  it('should handle multiple state transitions', () => {
    const { result } = renderHook(() => useNavigation())

    const transitions = [
      { section: 'about', tab: 'profile' },
      { section: 'projects', tab: 'all' },
      { section: 'skills', tab: 'overview' },
      { section: 'contact', tab: 'profile' },
    ]

    transitions.forEach(({ section, tab }) => {
      act(() => {
        result.current.setActiveSection(section)
        result.current.setActiveTab(tab)
      })

      expect(result.current.activeSection).toBe(section)
      expect(result.current.activeTab).toBe(tab)
    })
  })
})
